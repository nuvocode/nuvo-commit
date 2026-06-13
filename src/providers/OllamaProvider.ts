import { buildCommitPrompt } from "../prompt/commitPrompt";
import {
  CommitMessageOptions,
  Provider,
  ProviderConfig,
  ProviderError,
} from "./Provider";
import { sanitizeCommitMessage } from "../utils/sanitize";
import { fetchWithTimeout } from "./http";

const DEFAULT_ENDPOINT = "http://localhost:11434/api/generate";

interface OllamaGenerateResponse {
  response: string;
  done: boolean;
  error?: string;
}

interface OllamaTag {
  name: string;
  model: string;
  modified_at: string;
  size: number;
}

interface OllamaTagsResponse {
  models: OllamaTag[];
}

export class OllamaProvider implements Provider {
  readonly name = "ollama";

  constructor(private readonly opts: ProviderConfig) {}

  private get endpoint(): string {
    return this.opts.endpoint ?? DEFAULT_ENDPOINT;
  }

  async generateCommitMessage(
    diff: string,
    options: CommitMessageOptions = {},
  ): Promise<string> {
    const prompt = buildCommitPrompt(diff, options);

    let res: Response;
    try {
      res = await fetchWithTimeout(
        this.endpoint,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: this.opts.model,
            prompt,
            stream: false,
            options: {
              temperature: 0.2,
              top_p: 0.9,
              num_predict: options.includeBody ? 180 : 80,
              stop: options.includeBody
                ? ["```", "Here", "This commit"]
                : ["\n\n", "```", "Here", "This commit"],
            },
          }),
        },
        this.opts.timeoutMs,
      );
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      throw new ProviderError(
        `Cannot reach Ollama at ${this.endpoint}. Is it running?`,
        err,
      );
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new ProviderError(
        `Ollama responded ${res.status}: ${body.slice(0, 200)}`,
      );
    }

    let data: OllamaGenerateResponse;
    try {
      data = (await res.json()) as OllamaGenerateResponse;
    } catch (err) {
      throw new ProviderError("Invalid JSON from Ollama", err);
    }

    if (data.error) {
      throw new ProviderError(`Ollama error: ${data.error}`);
    }

    return sanitizeCommitMessage(stripThinking(data.response ?? ""), options);
  }

  async listModels(): Promise<string[]> {
    try {
      const baseUrl = this.endpoint.replace("/api/generate", "");
      const res = await fetchWithTimeout(
        `${baseUrl}/api/tags`,
        {},
        this.opts.timeoutMs,
      );

      if (!res.ok) {
        return [];
      }

      const data = (await res.json()) as OllamaTagsResponse;
      return data.models.map((m) => m.name).sort();
    } catch {
      return [];
    }
  }
}

function stripThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}
