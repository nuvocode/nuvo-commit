import { buildCommitPrompt } from "../prompt/commitPrompt";
import { Provider, ProviderError, LocalProviderConfig } from "./Provider";

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

export interface OllamaOptions extends LocalProviderConfig {
  endpoint: string;
  model: string;
}

export class OllamaProvider implements Provider {
  readonly name = "ollama";

  constructor(private readonly opts: OllamaOptions) {}

  async generateCommitMessage(diff: string): Promise<string> {
    const prompt = buildCommitPrompt(diff);

    let res: Response;
    try {
      res = await fetch(this.opts.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.opts.model,
          prompt,
          stream: false,
          options: {
            temperature: 0.2,
            top_p: 0.9,
            num_predict: 80,
            stop: ["\n\n", "```", "Here", "This commit"],
          },
        }),
      });
    } catch (err) {
      throw new ProviderError(
        `Cannot reach Ollama at ${this.opts.endpoint}. Is it running?`,
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

    return stripThinking(data.response ?? "");
  }

  async listModels(): Promise<string[]> {
    try {
      const baseUrl = this.opts.endpoint.replace("/api/generate", "");
      const res = await fetch(`${baseUrl}/api/tags`);
      
      if (!res.ok) {
        return [];
      }

      const data = (await res.json()) as OllamaTagsResponse;
      return data.models.map((m) => m.name).sort();
    } catch (err) {
      return [];
    }
  }
}

function stripThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}
