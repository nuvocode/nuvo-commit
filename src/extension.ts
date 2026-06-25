import { execFile } from "child_process";
import { promisify } from "util";
import * as vscode from "vscode";

import {
  getPullRequestDiff,
  getStagedDiff,
  getWorkingDiff,
  GitError,
} from "./git/diff";
import {
  Provider,
  ProviderError,
  ProviderRegistry,
} from "./providers/Provider";
import { OllamaProvider } from "./providers/OllamaProvider";
import { OpenAIProvider } from "./providers/OpenAIProvider";
import { AnthropicProvider } from "./providers/AnthropicProvider";
import { CommitMessageOptions } from "./commitMessage";
import { PullRequestContent, PullRequestContentOptions } from "./pullRequest";
import { buildProviderConfig, requiresApiKey } from "./providers/config";
import { optimizeDiff } from "./utils/optimizeDiff";

const execFileAsync = promisify(execFile);

const PROVIDER_DEFAULTS: Record<string, { model: string; endpoint: string }> = {
  ollama: {
    model: "qwen3:4b",
    endpoint: "http://localhost:11434/api/generate",
  },
  openai: {
    model: "gpt-4o-mini",
    endpoint: "",
  },
  anthropic: {
    model: "claude-3-5-sonnet-20241022",
    endpoint: "",
  },
};

/** Legacy key kept as fallback for users upgrading from older versions. */
const LEGACY_API_KEY_SECRET = "nuvoCommit.apiKey";

/** Set during `activate`; the only handle to VS Code's encrypted storage. */
let secretStorage: vscode.SecretStorage | undefined;

interface Settings {
  provider: string;
  model: string;
  endpoint: string;
  maxDiffChars: number;
  autoCommit: boolean;
  autoAccept: boolean;
  includeBody: boolean;
  pullRequestBaseBranch: string;
  pullRequestOpenCreateView: boolean;
  pullRequestIncludeCommitList: boolean;
  requestTimeoutMs: number;
}

export function getProviderSettingKey(
  provider: string,
  setting: "model" | "endpoint",
): string {
  return `${provider}.${setting}`;
}

export function getApiKeySecret(provider: string): string {
  return `nuvoCommit.${provider}.apiKey`;
}

function getProviderDefaults(provider: string): {
  model: string;
  endpoint: string;
} {
  return PROVIDER_DEFAULTS[provider] ?? PROVIDER_DEFAULTS.ollama;
}

function readConfiguredString(
  cfg: vscode.WorkspaceConfiguration,
  key: string,
): string | undefined {
  if (typeof cfg.inspect === "function") {
    const inspected = cfg.inspect<string>(key);
    for (const value of [
      inspected?.workspaceFolderValue,
      inspected?.workspaceValue,
      inspected?.globalValue,
    ]) {
      if (typeof value === "string") return value;
    }
    return undefined;
  }

  return cfg.get<string | undefined>(key, undefined);
}

function readProviderStringSetting(
  cfg: vscode.WorkspaceConfiguration,
  provider: string,
  setting: "model" | "endpoint",
  defaultValue: string,
): string {
  return (
    readConfiguredString(cfg, getProviderSettingKey(provider, setting)) ??
    defaultValue
  );
}

export function readSettings(): Settings {
  const cfg = vscode.workspace.getConfiguration("nuvoCommit");
  const provider = cfg.get<string>("provider", "ollama");
  const defaults = getProviderDefaults(provider);
  const legacyModel = readConfiguredString(cfg, "model");
  const legacyEndpoint = readConfiguredString(cfg, "endpoint");

  return {
    provider,
    model: readProviderStringSetting(
      cfg,
      provider,
      "model",
      legacyModel ?? defaults.model,
    ),
    endpoint: readProviderStringSetting(
      cfg,
      provider,
      "endpoint",
      legacyEndpoint ?? defaults.endpoint,
    ),
    maxDiffChars: cfg.get<number>("maxDiffChars", 12000),
    autoCommit: cfg.get<boolean>("autoCommit", false),
    autoAccept: cfg.get<boolean>("autoAccept", true),
    includeBody: cfg.get<boolean>("includeBody", false),
    pullRequestBaseBranch: cfg.get<string>("pullRequestBaseBranch", ""),
    pullRequestOpenCreateView: cfg.get<boolean>(
      "pullRequestOpenCreateView",
      true,
    ),
    pullRequestIncludeCommitList: cfg.get<boolean>(
      "pullRequestIncludeCommitList",
      true,
    ),
    requestTimeoutMs: cfg.get<number>("requestTimeoutMs", 30000),
  };
}

async function getApiKey(provider: string): Promise<string> {
  if (!secretStorage) return "";
  return (
    (await secretStorage.get(getApiKeySecret(provider))) ??
    (await secretStorage.get(LEGACY_API_KEY_SECRET)) ??
    ""
  );
}

async function buildProvider(settings: Settings): Promise<Provider> {
  const ProviderClass = ProviderRegistry.get(settings.provider);
  if (!ProviderClass) {
    throw new ProviderError(`Unknown provider: ${settings.provider}`);
  }

  const apiKey = requiresApiKey(settings.provider)
    ? await getApiKey(settings.provider)
    : "";
  const config = buildProviderConfig({
    provider: settings.provider,
    model: settings.model,
    endpoint: settings.endpoint,
    apiKey,
    timeoutMs: settings.requestTimeoutMs,
  });

  return new ProviderClass(config);
}

function getRepoRoot(): string | undefined {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) return undefined;
  return folders[0].uri.fsPath;
}

async function generateOnce(
  provider: Provider,
  diff: string,
  options: CommitMessageOptions,
): Promise<string> {
  return provider.generateCommitMessage(diff, options);
}

async function generatePullRequestContentOnce(
  provider: Provider,
  diff: string,
  options: PullRequestContentOptions,
): Promise<PullRequestContent> {
  return provider.generatePullRequestContent(diff, options);
}

interface ActionItem extends vscode.QuickPickItem {
  action: "accept" | "regenerate" | "edit" | "cancel";
}

interface PullRequestActionItem extends vscode.QuickPickItem {
  action:
    | "accept"
    | "regenerate"
    | "copyTitle"
    | "copyBody"
    | "openCreate"
    | "cancel";
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

function formatPullRequestContent(content: PullRequestContent): string {
  return `${content.title.trim()}\n\n${content.body.trim()}`.trim();
}

async function copyPullRequestContent(
  content: PullRequestContent,
): Promise<void> {
  await vscode.env.clipboard.writeText(formatPullRequestContent(content));
  vscode.window.showInformationMessage(
    "Nuvo Commit: pull request content copied to clipboard.",
  );
}

async function pickPullRequestAction(
  content: PullRequestContent,
): Promise<PullRequestActionItem["action"]> {
  const items: PullRequestActionItem[] = [
    {
      label: "$(check) Accept",
      action: "accept",
      description: "Copy generated title and body",
    },
    { label: "$(sync) Regenerate", action: "regenerate" },
    { label: "$(copy) Copy Title", action: "copyTitle" },
    { label: "$(copy) Copy Body", action: "copyBody" },
    {
      label: "$(git-pull-request-create) Open GitHub PR Create",
      action: "openCreate",
    },
    { label: "$(close) Cancel", action: "cancel" },
  ];
  const picked = await vscode.window.showQuickPick(items, {
    placeHolder: content.title,
    ignoreFocusOut: true,
  });
  return picked?.action ?? "cancel";
}

export async function openGitHubPullRequestCreate(
  cwd: string,
  compareBranch: string,
): Promise<boolean> {
  const githubPrExtension = vscode.extensions.getExtension(
    "GitHub.vscode-pull-request-github",
  );

  if (!githubPrExtension) {
    vscode.window.showWarningMessage(
      "Nuvo Commit: GitHub Pull Requests extension is not installed. Paste the copied content manually.",
    );
    return false;
  }

  try {
    await vscode.commands.executeCommand("pr.create", {
      repoPath: cwd,
      compareBranch,
    });
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    vscode.window.showErrorMessage(
      `Nuvo Commit: failed to open GitHub PR create view: ${msg}`,
    );
    return false;
  }
}

export function buildGitCommitArgs(message: string): string[] {
  const normalized = message.replace(/\r\n/g, "\n").trim();
  const [header = "", ...bodyLines] = normalized.split("\n");
  const body = bodyLines.join("\n").trim();

  return body.length > 0
    ? ["commit", "-m", header.trim(), "-m", body]
    : ["commit", "-m", header.trim()];
}

async function applyMessage(
  message: string,
  cwd: string,
  autoCommit: boolean,
): Promise<void> {
  if (autoCommit) {
    try {
      await execFileAsync("git", buildGitCommitArgs(message), { cwd });
      vscode.window.showInformationMessage(
        `Committed: ${message.split(/\r?\n/)[0]}`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      vscode.window.showErrorMessage(`git commit failed: ${msg}`);
    }
    return;
  }

  const gitExt = vscode.extensions.getExtension<GitExtensionApi>("vscode.git");
  if (gitExt) {
    const api = (await gitExt.activate()).getAPI(1);
    const repo =
      api.repositories.find((r) => r.rootUri.fsPath === cwd) ??
      api.repositories[0];
    if (repo) {
      repo.inputBox.value = message;
      return;
    }
  }

  await vscode.env.clipboard.writeText(message);
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

  let provider: Provider;
  try {
    provider = await buildProvider(settings);
  } catch (err) {
    const msg = err instanceof ProviderError ? err.message : String(err);
    vscode.window.showErrorMessage(`Nuvo Commit: ${msg}`);
    return;
  }

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

  const commitOptions: CommitMessageOptions = {
    includeBody: settings.includeBody,
    files: optimized.includedFiles,
    skippedFiles: optimized.skippedFiles,
    truncated: optimized.truncated,
    truncatedFiles: optimized.truncatedFiles,
  };

  let message: string;
  try {
    message = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Nuvo Commit: generating with ${settings.model}…`,
        cancellable: false,
      },
      () => generateOnce(provider, optimized.diff, commitOptions),
    );
  } catch (err) {
    const msg = err instanceof ProviderError ? err.message : String(err);
    vscode.window.showErrorMessage(`Nuvo Commit: ${msg}`);
    return;
  }

  // Auto-accept: skip dialog and directly apply the message
  if (settings.autoAccept) {
    await applyMessage(message, cwd, settings.autoCommit);
    return;
  }

  // Show dialog for manual approval
  while (true) {
    const action = await pickAction(message);
    switch (action) {
      case "accept":
        await applyMessage(message, cwd, settings.autoCommit);
        return;
      case "regenerate":
        try {
          message = await vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Notification,
              title: `Nuvo Commit: regenerating with ${settings.model}…`,
              cancellable: false,
            },
            () => generateOnce(provider, optimized.diff, commitOptions),
          );
        } catch (err) {
          const msg = err instanceof ProviderError ? err.message : String(err);
          vscode.window.showErrorMessage(`Nuvo Commit: ${msg}`);
          return;
        }
        break;
      case "edit": {
        const edited = await editMessage(message);
        if (edited) {
          message = edited;
        }
        break;
      }
      case "cancel":
        return;
    }
  }
}

async function runPullRequestContentCommand(): Promise<void> {
  const cwd = getRepoRoot();
  if (!cwd) {
    vscode.window.showErrorMessage("Nuvo Commit: open a folder first.");
    return;
  }

  const settings = readSettings();

  let provider: Provider;
  try {
    provider = await buildProvider(settings);
  } catch (err) {
    const msg = err instanceof ProviderError ? err.message : String(err);
    vscode.window.showErrorMessage(`Nuvo Commit: ${msg}`);
    return;
  }

  let pullRequestDiff;
  try {
    pullRequestDiff = await getPullRequestDiff(
      cwd,
      settings.pullRequestBaseBranch,
      settings.pullRequestIncludeCommitList,
    );
  } catch (err) {
    const msg = err instanceof GitError ? err.message : String(err);
    vscode.window.showErrorMessage(`Nuvo Commit: ${msg}`);
    return;
  }

  if (pullRequestDiff.files.length === 0) {
    vscode.window.showWarningMessage(
      `Nuvo Commit: no branch changes detected against ${pullRequestDiff.baseBranch}.`,
    );
    return;
  }

  const optimized = optimizeDiff(pullRequestDiff.diff, settings.maxDiffChars);
  if (optimized.includedFiles.length === 0) {
    vscode.window.showWarningMessage(
      "Nuvo Commit: all pull request files are ignored (lock/generated/binary).",
    );
    return;
  }

  const promptOptions: PullRequestContentOptions = {
    baseBranch: pullRequestDiff.baseBranch,
    currentBranch: pullRequestDiff.currentBranch,
    commits: pullRequestDiff.commits,
    includeCommitList: settings.pullRequestIncludeCommitList,
  };

  let content: PullRequestContent;
  try {
    content = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Nuvo Commit: generating pull request content with ${settings.model}…`,
        cancellable: false,
      },
      () =>
        generatePullRequestContentOnce(provider, optimized.diff, promptOptions),
    );
  } catch (err) {
    const msg = err instanceof ProviderError ? err.message : String(err);
    vscode.window.showErrorMessage(`Nuvo Commit: ${msg}`);
    return;
  }

  while (true) {
    const action = await pickPullRequestAction(content);
    switch (action) {
      case "accept":
        await copyPullRequestContent(content);
        if (settings.pullRequestOpenCreateView) {
          await openGitHubPullRequestCreate(cwd, pullRequestDiff.currentBranch);
        }
        return;
      case "regenerate":
        try {
          content = await vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Notification,
              title: `Nuvo Commit: regenerating pull request content with ${settings.model}…`,
              cancellable: false,
            },
            () =>
              generatePullRequestContentOnce(
                provider,
                optimized.diff,
                promptOptions,
              ),
          );
        } catch (err) {
          const msg = err instanceof ProviderError ? err.message : String(err);
          vscode.window.showErrorMessage(`Nuvo Commit: ${msg}`);
          return;
        }
        break;
      case "copyTitle":
        await vscode.env.clipboard.writeText(content.title);
        vscode.window.showInformationMessage(
          "Nuvo Commit: pull request title copied to clipboard.",
        );
        break;
      case "copyBody":
        await vscode.env.clipboard.writeText(content.body);
        vscode.window.showInformationMessage(
          "Nuvo Commit: pull request body copied to clipboard.",
        );
        break;
      case "openCreate":
        await copyPullRequestContent(content);
        await openGitHubPullRequestCreate(cwd, pullRequestDiff.currentBranch);
        return;
      case "cancel":
        return;
    }
  }
}

async function selectModel(): Promise<void> {
  const settings = readSettings();

  let provider: Provider;
  try {
    provider = await buildProvider(settings);
  } catch (err) {
    const msg = err instanceof ProviderError ? err.message : String(err);
    vscode.window.showErrorMessage(`Nuvo Commit: ${msg}`);
    return;
  }

  // Get available models from provider
  let models: string[] = [];
  if (provider.listModels) {
    models = await provider.listModels();
  }

  // Add custom input option
  const items: vscode.QuickPickItem[] = [];

  if (models.length > 0) {
    items.push(
      { label: "Available Models", kind: vscode.QuickPickItemKind.Separator },
      ...models.map((m) => ({ label: m, description: "Click to select" })),
    );
  }

  items.push(
    { label: "Custom Model", kind: vscode.QuickPickItemKind.Separator },
    {
      label: "$(pencil) Enter manually...",
      description: "Type a custom model name",
    },
  );

  const picked = await vscode.window.showQuickPick(items, {
    placeHolder: `Select model for ${settings.provider}`,
    ignoreFocusOut: true,
  });

  if (!picked) return;

  let selectedModel: string;
  if (picked.label === "$(pencil) Enter manually...") {
    const input = await vscode.window.showInputBox({
      prompt: "Enter model name",
      placeHolder: "e.g., llama3.2:3b",
      ignoreFocusOut: true,
    });
    if (!input) return;
    selectedModel = input;
  } else {
    selectedModel = picked.label;
  }

  await updateProviderModel(settings.provider, selectedModel);
  vscode.window.showInformationMessage(`Model set to: ${selectedModel}`);
}

export async function updateProviderModel(
  provider: string,
  model: string,
): Promise<void> {
  const cfg = vscode.workspace.getConfiguration("nuvoCommit");
  await cfg.update(
    getProviderSettingKey(provider, "model"),
    model,
    vscode.ConfigurationTarget.Global,
  );
}

export async function updateProviderEndpoint(
  provider: string,
  endpoint: string,
): Promise<void> {
  const cfg = vscode.workspace.getConfiguration("nuvoCommit");
  await cfg.update(
    getProviderSettingKey(provider, "endpoint"),
    endpoint,
    vscode.ConfigurationTarget.Global,
  );
}

export async function updateActiveProvider(provider: string): Promise<void> {
  const cfg = vscode.workspace.getConfiguration("nuvoCommit");
  await cfg.update("provider", provider, vscode.ConfigurationTarget.Global);
}

interface ProviderItem extends vscode.QuickPickItem {
  provider: "ollama" | "openai" | "anthropic";
}

interface ApiKeyProviderItem extends vscode.QuickPickItem {
  provider: "openai" | "anthropic";
}

interface SettingsActionItem extends vscode.QuickPickItem {
  action: "provider" | "model" | "endpoint" | "apiKey";
}

function providerLabel(provider: string): string {
  switch (provider) {
    case "ollama":
      return "Ollama";
    case "openai":
      return "OpenAI";
    case "anthropic":
      return "Anthropic";
    default:
      return provider;
  }
}

async function pickProvider(
  currentProvider: string,
): Promise<ProviderItem["provider"] | undefined> {
  const picked = await vscode.window.showQuickPick<ProviderItem>(
    [
      {
        label: "Ollama",
        description:
          currentProvider === "ollama" ? "Current provider" : undefined,
        provider: "ollama",
      },
      {
        label: "OpenAI",
        description:
          currentProvider === "openai" ? "Current provider" : undefined,
        provider: "openai",
      },
      {
        label: "Anthropic",
        description:
          currentProvider === "anthropic" ? "Current provider" : undefined,
        provider: "anthropic",
      },
    ],
    {
      placeHolder: "Select AI provider",
      ignoreFocusOut: true,
    },
  );

  return picked?.provider;
}

function buildSettingsActionItems(settings: Settings): SettingsActionItem[] {
  const items: SettingsActionItem[] = [
    {
      label: "$(server-environment) Provider",
      description: providerLabel(settings.provider),
      action: "provider",
    },
    {
      label: "$(symbol-string) Model",
      description: settings.model,
      action: "model",
    },
    {
      label: "$(link) Endpoint",
      description: settings.endpoint || "Default provider endpoint",
      action: "endpoint",
    },
  ];

  if (requiresApiKey(settings.provider)) {
    items.push({
      label: "$(key) API Key",
      description: `Set or clear ${providerLabel(settings.provider)} key`,
      action: "apiKey",
    });
  }

  return items;
}

async function configureProviderModel(settings: Settings): Promise<void> {
  const input = await vscode.window.showInputBox({
    value: settings.model,
    prompt: `Enter ${providerLabel(settings.provider)} model`,
    ignoreFocusOut: true,
    validateInput: (value) =>
      value.trim().length === 0 ? "Model cannot be empty" : null,
  });
  if (input === undefined) return;

  await updateProviderModel(settings.provider, input.trim());
  vscode.window.showInformationMessage(
    `Nuvo Commit: ${providerLabel(settings.provider)} model updated.`,
  );
}

async function configureProviderEndpoint(settings: Settings): Promise<void> {
  const input = await vscode.window.showInputBox({
    value: settings.endpoint,
    prompt: `Enter ${providerLabel(settings.provider)} endpoint`,
    placeHolder:
      settings.provider === "ollama"
        ? "http://localhost:11434/api/generate"
        : "Leave empty to use provider default",
    ignoreFocusOut: true,
  });
  if (input === undefined) return;

  await updateProviderEndpoint(settings.provider, input.trim());
  vscode.window.showInformationMessage(
    `Nuvo Commit: ${providerLabel(settings.provider)} endpoint updated.`,
  );
}

export async function configureProviderSettings(): Promise<void> {
  const settings = readSettings();
  const picked = await vscode.window.showQuickPick(
    buildSettingsActionItems(settings),
    {
      placeHolder: `Configure ${providerLabel(settings.provider)}`,
      ignoreFocusOut: true,
    },
  );
  if (!picked) return;

  switch (picked.action) {
    case "provider": {
      const provider = await pickProvider(settings.provider);
      if (!provider) return;
      await updateActiveProvider(provider);
      vscode.window.showInformationMessage(
        `Nuvo Commit: provider set to ${providerLabel(provider)}.`,
      );
      return;
    }
    case "model":
      await configureProviderModel(settings);
      return;
    case "endpoint":
      await configureProviderEndpoint(settings);
      return;
    case "apiKey":
      await setApiKey();
      return;
  }
}

async function pickApiKeyProvider(
  activeProvider: string,
): Promise<"openai" | "anthropic" | undefined> {
  if (activeProvider === "openai" || activeProvider === "anthropic") {
    return activeProvider;
  }

  const picked = await vscode.window.showQuickPick<ApiKeyProviderItem>(
    [
      {
        label: "OpenAI",
        description: "Save an OpenAI API key",
        provider: "openai",
      },
      {
        label: "Anthropic",
        description: "Save an Anthropic API key",
        provider: "anthropic",
      },
    ],
    {
      placeHolder: "Select cloud provider for API key",
      ignoreFocusOut: true,
    },
  );

  return picked?.provider;
}

async function setApiKey(): Promise<void> {
  if (!secretStorage) return;

  const activeProvider = readSettings().provider;
  const provider = await pickApiKeyProvider(activeProvider);
  if (!provider) return;

  const input = await vscode.window.showInputBox({
    prompt: `Enter the API key for ${provider} (leave empty to clear).`,
    password: true,
    ignoreFocusOut: true,
  });
  if (input === undefined) return; // cancelled

  const trimmed = input.trim();
  const secretKey = getApiKeySecret(provider);
  if (trimmed.length === 0) {
    await secretStorage.delete(secretKey);
    vscode.window.showInformationMessage(
      `Nuvo Commit: ${provider} API key cleared.`,
    );
    return;
  }

  await secretStorage.store(secretKey, trimmed);
  vscode.window.showInformationMessage(
    `Nuvo Commit: ${provider} API key saved securely.`,
  );
}

/**
 * One-time migration: move any plaintext `nuvoCommit.apiKey` setting into
 * SecretStorage and clear it from settings.json so it cannot leak into git.
 */
async function migrateApiKey(): Promise<void> {
  if (!secretStorage) return;

  const cfg = vscode.workspace.getConfiguration("nuvoCommit");
  const provider = cfg.get<string>("provider", "ollama");
  const targetSecret = requiresApiKey(provider)
    ? getApiKeySecret(provider)
    : LEGACY_API_KEY_SECRET;
  const legacy = cfg.get<string>("apiKey", "");
  const legacySecret = await secretStorage.get(LEGACY_API_KEY_SECRET);
  const keyToMigrate = legacy.trim() || legacySecret?.trim();
  if (!keyToMigrate) return;

  const existing = await secretStorage.get(targetSecret);
  if (!existing) {
    await secretStorage.store(targetSecret, keyToMigrate);
  }

  if (!legacy || legacy.trim().length === 0) return;

  // Clear the plaintext setting from every scope it might be defined in.
  for (const target of [
    vscode.ConfigurationTarget.Global,
    vscode.ConfigurationTarget.Workspace,
    vscode.ConfigurationTarget.WorkspaceFolder,
  ]) {
    try {
      await cfg.update("apiKey", undefined, target);
    } catch {
      // Scope unavailable (e.g. no workspace open) — ignore.
    }
  }

  vscode.window.showInformationMessage(
    "Nuvo Commit: your API key was moved to secure storage and removed from settings.json.",
  );
}

export function activate(context: vscode.ExtensionContext): void {
  secretStorage = context.secrets;

  // Register providers
  ProviderRegistry.register("ollama", OllamaProvider);
  ProviderRegistry.register("openai", OpenAIProvider);
  ProviderRegistry.register("anthropic", AnthropicProvider);

  void migrateApiKey();

  context.subscriptions.push(
    vscode.commands.registerCommand("nuvoCommit.generate", runCommand),
    vscode.commands.registerCommand(
      "nuvoCommit.generatePullRequestContent",
      runPullRequestContentCommand,
    ),
    vscode.commands.registerCommand(
      "nuvoCommit.settings",
      configureProviderSettings,
    ),
    vscode.commands.registerCommand("nuvoCommit.selectModel", selectModel),
    vscode.commands.registerCommand("nuvoCommit.setApiKey", setApiKey),
  );
}

export function deactivate(): void {}
