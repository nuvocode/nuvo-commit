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

const DEFAULT_ENDPOINT = "https://api.openai.com/v1/chat/completions";

interface OpenAIChatResponse {
  choices: Array<{
    message: {
      content: string | null;
    };
  }>;
  error?: {
    message: string;
  };
}

export class OpenAIProvider implements Provider {
  readonly name = "openai";

  constructor(private readonly opts: ProviderConfig) {}

  async generateCommitMessage(
    diff: string,
    options: CommitMessageOptions = {},
  ): Promise<string> {
    const text = await this.complete(
      "You are a helpful assistant that generates concise git commit messages.",
      buildCommitPrompt(diff, options),
      options.includeBody ? 300 : 150,
    );
    return sanitizeCommitMessage(text, options);
  }

  async generatePullRequestContent(
    diff: string,
    options: PullRequestContentOptions = {},
  ): Promise<PullRequestContent> {
    const text = await this.complete(
      "You are a helpful assistant that generates concise GitHub pull request titles and descriptions.",
      buildPullRequestPrompt(diff, options),
      700,
    );
    return sanitizePullRequestContent(text);
  }

  /**
   * Reasoning models (gpt-oss, qwen3, Gemini with thinking…) can spend the
   * whole max_tokens budget on hidden reasoning and return no text. When that
   * happens, ask once more with reasoning turned off.
   */
  private async complete(
    system: string,
    prompt: string,
    maxTokens: number,
  ): Promise<string> {
    const text = await this.request(system, prompt, maxTokens);
    if (text) return text;

    // Not every API accepts "none"; a rejection lands in the error below.
    const retry = await this.request(system, prompt, maxTokens, "none").catch(
      () => "",
    );
    if (retry) return retry;

    throw new ProviderError(
      `${this.opts.model} returned an empty response, likely because it ` +
        "spent its token budget on reasoning. Choose a non-reasoning model.",
    );
  }

  private async request(
    system: string,
    prompt: string,
    maxTokens: number,
    reasoningEffort?: string,
  ): Promise<string> {
    const endpoint = this.opts.endpoint || DEFAULT_ENDPOINT;

    let res: Response;
    try {
      res = await fetchWithTimeout(
        endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.opts.apiKey ?? ""}`,
          },
          body: JSON.stringify({
            model: this.opts.model,
            messages: [
              { role: "system", content: system },
              { role: "user", content: prompt },
            ],
            temperature: 0.2,
            max_tokens: maxTokens,
            ...(reasoningEffort && { reasoning_effort: reasoningEffort }),
          }),
        },
        this.opts.timeoutMs,
      );
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      throw new ProviderError(
        `Cannot reach OpenAI API at ${endpoint}. Check your connection and API key.`,
        err,
      );
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new ProviderError(
        `OpenAI responded ${res.status}: ${body.slice(0, 200)}`,
      );
    }

    let data: OpenAIChatResponse;
    try {
      data = (await res.json()) as OpenAIChatResponse;
    } catch (err) {
      throw new ProviderError("Invalid JSON from OpenAI", err);
    }

    if (data.error) {
      throw new ProviderError(`OpenAI error: ${data.error.message}`);
    }

    if (!data.choices || data.choices.length === 0) {
      throw new ProviderError("No response from OpenAI");
    }

    return (data.choices[0].message.content ?? "").trim();
  }

  async listModels(): Promise<string[]> {
    // Works for OpenAI-compatible servers too (LM Studio, OpenRouter, Groq…).
    const endpoint = this.opts.endpoint || DEFAULT_ENDPOINT;
    try {
      const res = await fetchWithTimeout(
        endpoint.replace(/\/chat\/completions\/?$/, "/models"),
        { headers: { Authorization: `Bearer ${this.opts.apiKey ?? ""}` } },
        this.opts.timeoutMs,
      );
      if (!res.ok) return FALLBACK_MODELS;
      const data = (await res.json()) as { data?: Array<{ id: string }> };
      const ids = (data.data ?? [])
        .map((m) => m.id)
        .filter((id) => !NON_CHAT_MODEL.test(id))
        .sort();
      return ids.length > 0 ? ids : FALLBACK_MODELS;
    } catch {
      return FALLBACK_MODELS;
    }
  }
}

// /v1/models also returns embedding, audio and image models; hide those.
const NON_CHAT_MODEL =
  /embedding|whisper|tts|dall-e|image|audio|realtime|transcribe|moderation|davinci|babbage/i;

// ponytail: shown only when /v1/models is unreachable (no key, offline).
const FALLBACK_MODELS = ["gpt-4o-mini", "gpt-4o"];
