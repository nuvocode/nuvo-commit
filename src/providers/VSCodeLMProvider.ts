import * as vscode from "vscode";
import { buildCommitPrompt } from "../prompt/commitPrompt";
import { buildPullRequestPrompt } from "../prompt/pullRequestPrompt";
import {
  CommitMessageOptions,
  Provider,
  ProviderConfig,
  ProviderError,
} from "./Provider";
import { PullRequestContent, PullRequestContentOptions } from "../pullRequest";
import { sanitizeCommitMessage } from "../utils/sanitize";
import { sanitizePullRequestContent } from "../utils/pullRequestContent";
import { DEFAULT_TIMEOUT_MS } from "./http";

/**
 * Uses the chat models VS Code already exposes through the Language Model API
 * (e.g. GitHub Copilot). No API key or local server needed. An empty `model`
 * picks the first available model.
 */
export class VSCodeLMProvider implements Provider {
  readonly name = "vscode";

  constructor(private readonly opts: ProviderConfig) {}

  async generateCommitMessage(
    diff: string,
    options: CommitMessageOptions = {},
  ): Promise<string> {
    const text = await this.send(buildCommitPrompt(diff, options));
    return sanitizeCommitMessage(text, options);
  }

  async generatePullRequestContent(
    diff: string,
    options: PullRequestContentOptions = {},
  ): Promise<PullRequestContent> {
    const text = await this.send(buildPullRequestPrompt(diff, options));
    return sanitizePullRequestContent(text.trim());
  }

  async listModels(): Promise<string[]> {
    try {
      const models = await vscode.lm.selectChatModels();
      return models.map((m) => m.id);
    } catch {
      return [];
    }
  }

  private async pickModel(): Promise<vscode.LanguageModelChat> {
    const selector = this.opts.model ? { id: this.opts.model } : undefined;
    const [model] = await vscode.lm.selectChatModels(selector);
    if (model) return model;

    throw new ProviderError(
      this.opts.model
        ? `VS Code language model "${this.opts.model}" is not available. ` +
            `Run "Nuvo Commit: Select Model" to pick another one.`
        : "No VS Code language models are available. " +
            "Install and sign in to GitHub Copilot, or choose another provider.",
    );
  }

  private async send(prompt: string): Promise<string> {
    const model = await this.pickModel();
    const cts = new vscode.CancellationTokenSource();
    const timeoutMs = this.opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const timer = setTimeout(() => cts.cancel(), timeoutMs);

    try {
      const response = await model.sendRequest(
        [vscode.LanguageModelChatMessage.User(prompt)],
        {
          justification:
            "Nuvo Commit generates commit messages from your diff.",
        },
        cts.token,
      );
      let text = "";
      for await (const chunk of response.text) text += chunk;
      return text;
    } catch (err) {
      if (cts.token.isCancellationRequested) {
        throw new ProviderError(
          `Request timed out after ${timeoutMs}ms — the model did not respond in time.`,
          err,
        );
      }
      const reason =
        err instanceof vscode.LanguageModelError
          ? `${err.code}: ${err.message}`
          : String(err);
      throw new ProviderError(`VS Code language model error (${reason})`, err);
    } finally {
      clearTimeout(timer);
      cts.dispose();
    }
  }
}
