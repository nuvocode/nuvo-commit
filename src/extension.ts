import { execFile } from "child_process";
import { promisify } from "util";
import * as vscode from "vscode";

import { getStagedDiff, getWorkingDiff, GitError } from "./git/diff";
import { OllamaProvider } from "./providers/OllamaProvider";
import { Provider, ProviderError } from "./providers/Provider";
import { optimizeDiff } from "./utils/optimizeDiff";
import { sanitizeCommitMessage } from "./utils/sanitize";

const execFileAsync = promisify(execFile);

interface Settings {
  provider: "ollama";
  model: string;
  ollamaEndpoint: string;
  maxDiffChars: number;
  autoCommit: boolean;
}

function readSettings(): Settings {
  const cfg = vscode.workspace.getConfiguration("nuvoCommit");
  return {
    provider: cfg.get<"ollama">("provider", "ollama"),
    model: cfg.get<string>("model", "qwen3:4b"),
    ollamaEndpoint: cfg.get<string>(
      "ollamaEndpoint",
      "http://localhost:11434/api/generate",
    ),
    maxDiffChars: cfg.get<number>("maxDiffChars", 12000),
    autoCommit: cfg.get<boolean>("autoCommit", false),
  };
}

function buildProvider(settings: Settings): Provider {
  switch (settings.provider) {
    case "ollama":
      return new OllamaProvider({
        endpoint: settings.ollamaEndpoint,
        model: settings.model,
      });
  }
}

function getRepoRoot(): string | undefined {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) return undefined;
  return folders[0].uri.fsPath;
}

async function generateOnce(
  provider: Provider,
  diff: string,
): Promise<string> {
  const raw = await provider.generateCommitMessage(diff);
  return sanitizeCommitMessage(raw);
}

interface ActionItem extends vscode.QuickPickItem {
  action: "accept" | "regenerate" | "edit" | "cancel";
}

async function pickAction(message: string): Promise<ActionItem["action"]> {
  const items: ActionItem[] = [
    { label: "$(check) Accept", action: "accept", description: message },
    { label: "$(sync) Regenerate", action: "regenerate" },
    { label: "$(edit) Edit manually", action: "edit" },
    { label: "$(close) Cancel", action: "cancel" },
  ];
  const picked = await vscode.window.showQuickPick(items, {
    placeHolder: message,
    ignoreFocusOut: true,
  });
  return picked?.action ?? "cancel";
}

async function editMessage(current: string): Promise<string | undefined> {
  return vscode.window.showInputBox({
    value: current,
    prompt: "Edit commit message",
    ignoreFocusOut: true,
    validateInput: (v) => (v.trim().length === 0 ? "Cannot be empty" : null),
  });
}

async function applyMessage(
  message: string,
  cwd: string,
  autoCommit: boolean,
): Promise<void> {
  if (autoCommit) {
    try {
      await execFileAsync("git", ["commit", "-m", message], { cwd });
      vscode.window.showInformationMessage(`Committed: ${message}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      vscode.window.showErrorMessage(`git commit failed: ${msg}`);
    }
    return;
  }

  const gitExt = vscode.extensions.getExtension<GitExtensionApi>("vscode.git");
  if (gitExt) {
    const api = (await gitExt.activate()).getAPI(1);
    const repo = api.repositories.find((r) => r.rootUri.fsPath === cwd)
      ?? api.repositories[0];
    if (repo) {
      repo.inputBox.value = message;
      vscode.window.showInformationMessage("Commit message set in SCM input.");
      return;
    }
  }

  await vscode.env.clipboard.writeText(message);
  vscode.window.showInformationMessage(
    "Commit message copied to clipboard (Git extension not available).",
  );
}

interface GitRepository {
  rootUri: vscode.Uri;
  inputBox: { value: string };
}
interface GitApi {
  repositories: GitRepository[];
}
interface GitExtensionApi {
  getAPI(version: 1): GitApi;
}

async function runCommand(): Promise<void> {
  const cwd = getRepoRoot();
  if (!cwd) {
    vscode.window.showErrorMessage("Nuvo Commit: open a folder first.");
    return;
  }

  const settings = readSettings();
  const provider = buildProvider(settings);

  let staged;
  try {
    staged = await getStagedDiff(cwd);
  } catch (err) {
    const msg = err instanceof GitError ? err.message : String(err);
    vscode.window.showErrorMessage(`Nuvo Commit: ${msg}`);
    return;
  }

  // If no staged changes, check for working directory changes
  let useWorkingDir = false;
  if (staged.files.length === 0) {
    try {
      const working = await getWorkingDiff(cwd);
      if (working.files.length === 0) {
        vscode.window.showWarningMessage(
          "Nuvo Commit: no changes detected. Stage files or add unstaged changes to proceed.",
        );
        return;
      }
      staged = working;
      useWorkingDir = true;
    } catch (err) {
      const msg = err instanceof GitError ? err.message : String(err);
      vscode.window.showErrorMessage(`Nuvo Commit: ${msg}`);
      return;
    }
  }

  const optimized = optimizeDiff(staged.diff, settings.maxDiffChars);
  if (optimized.includedFiles.length === 0) {
    vscode.window.showWarningMessage(
      `Nuvo Commit: all ${useWorkingDir ? "unstaged" : "staged"} files are ignored (lock/generated/binary).`,
    );
    return;
  }

  let message: string;
  while (true) {
    try {
      message = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Nuvo Commit: generating with ${settings.model}…`,
          cancellable: false,
        },
        () => generateOnce(provider, optimized.diff),
      );
    } catch (err) {
      const msg = err instanceof ProviderError ? err.message : String(err);
      vscode.window.showErrorMessage(`Nuvo Commit: ${msg}`);
      return;
    }

    const action = await pickAction(message);
    if (action === "accept") break;
    if (action === "cancel") return;
    if (action === "edit") {
      const edited = await editMessage(message);
      if (!edited) return;
      message = sanitizeCommitMessage(edited);
      break;
    }
    // regenerate -> loop
  }

  await applyMessage(message, cwd, settings.autoCommit);
}

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("nuvoCommit.generate", runCommand),
  );
}

export function deactivate(): void {}
