import { buildCommitPrompt } from "../prompt/commitPrompt";
import { Provider, ProviderError, APIProviderConfig } from "./Provider";

interface OpenAIChatResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  error?: {
    message: string;
  };
}

export interface OpenAIOptions extends APIProviderConfig {
  apiKey: string;
  endpoint?: string;
  model: string;
}

export class OpenAIProvider implements Provider {
  readonly name = "openai";
  private readonly defaultEndpoint = "https://api.openai.com/v1/chat/completions";

  constructor(private readonly opts: OpenAIOptions) {}

  async generateCommitMessage(diff: string): Promise<string> {
    const prompt = buildCommitPrompt(diff);
    const endpoint = this.opts.endpoint ?? this.defaultEndpoint;

    let res: Response;
    try {
      res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.opts.apiKey}`,
        },
        body: JSON.stringify({
          model: this.opts.model,
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that generates concise git commit messages.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.2,
          max_tokens: 150,
        }),
      });
    } catch (err) {
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

    return data.choices[0].message.content.trim();
  }

  async listModels(): Promise<string[]> {
    // Common OpenAI models - static list
    return [
      "gpt-4o",
      "gpt-4o-mini",
      "gpt-4-turbo",
      "gpt-4",
      "gpt-3.5-turbo",
    ];
  }
}
