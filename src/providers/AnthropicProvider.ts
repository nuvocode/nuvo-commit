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
import { fetchWithTimeout } from "./http";

const DEFAULT_ENDPOINT = "https://api.anthropic.com/v1/messages";

interface AnthropicResponse {
  content: Array<{
    text: string;
    type: string;
  }>;
  error?: {
    message: string;
  };
}

export class AnthropicProvider implements Provider {
  readonly name = "anthropic";

  constructor(private readonly opts: ProviderConfig) {}

  async generateCommitMessage(
    diff: string,
    options: CommitMessageOptions = {},
  ): Promise<string> {
    const prompt = buildCommitPrompt(diff, options);
    const endpoint = this.opts.endpoint || DEFAULT_ENDPOINT;

    let res: Response;
    try {
      res = await fetchWithTimeout(
        endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": this.opts.apiKey ?? "",
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: this.opts.model,
            max_tokens: options.includeBody ? 300 : 150,
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
          }),
        },
        this.opts.timeoutMs,
      );
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      throw new ProviderError(
        `Cannot reach Anthropic API at ${endpoint}. Check your connection and API key.`,
        err,
      );
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new ProviderError(
        `Anthropic responded ${res.status}: ${body.slice(0, 200)}`,
      );
    }

    let data: AnthropicResponse;
    try {
      data = (await res.json()) as AnthropicResponse;
    } catch (err) {
      throw new ProviderError("Invalid JSON from Anthropic", err);
    }

    if (data.error) {
      throw new ProviderError(`Anthropic error: ${data.error.message}`);
    }

    if (!data.content || data.content.length === 0) {
      throw new ProviderError("No response from Anthropic");
    }

    return sanitizeCommitMessage(data.content[0].text.trim(), options);
  }

  async generatePullRequestContent(
    diff: string,
    options: PullRequestContentOptions = {},
  ): Promise<PullRequestContent> {
    const prompt = buildPullRequestPrompt(diff, options);
    const endpoint = this.opts.endpoint || DEFAULT_ENDPOINT;

    let res: Response;
    try {
      res = await fetchWithTimeout(
        endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": this.opts.apiKey ?? "",
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: this.opts.model,
            max_tokens: 700,
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
          }),
        },
        this.opts.timeoutMs,
      );
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      throw new ProviderError(
        `Cannot reach Anthropic API at ${endpoint}. Check your connection and API key.`,
        err,
      );
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new ProviderError(
        `Anthropic responded ${res.status}: ${body.slice(0, 200)}`,
      );
    }

    let data: AnthropicResponse;
    try {
      data = (await res.json()) as AnthropicResponse;
    } catch (err) {
      throw new ProviderError("Invalid JSON from Anthropic", err);
    }

    if (data.error) {
      throw new ProviderError(`Anthropic error: ${data.error.message}`);
    }

    if (!data.content || data.content.length === 0) {
      throw new ProviderError("No response from Anthropic");
    }

    return sanitizePullRequestContent(data.content[0].text.trim());
  }

  async listModels(): Promise<string[]> {
    // Common Anthropic models - static list
    return [
      "claude-sonnet-4-20250514",
      "claude-3-7-sonnet-20250219",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-3-opus-20240229",
    ];
  }
}
