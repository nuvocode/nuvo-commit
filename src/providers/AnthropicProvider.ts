import { buildCommitPrompt } from "../prompt/commitPrompt";
import { Provider, ProviderConfig, ProviderError } from "./Provider";
import { sanitizeCommitMessage } from "../utils/sanitize";
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

  async generateCommitMessage(diff: string): Promise<string> {
    const prompt = buildCommitPrompt(diff);
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
            max_tokens: 150,
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

    return sanitizeCommitMessage(data.content[0].text.trim());
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
