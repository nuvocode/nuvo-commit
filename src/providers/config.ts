import { ProviderConfig, ProviderError } from "./Provider";

const CLOUD_PROVIDERS = new Set(["openai", "anthropic"]);

/** Cloud providers require an API key; local providers (Ollama) do not. */
export function requiresApiKey(provider: string): boolean {
  return CLOUD_PROVIDERS.has(provider);
}

export interface BuildConfigInput {
  provider: string;
  model: string;
  endpoint: string;
  apiKey: string;
  timeoutMs: number;
}

/**
 * Builds a `ProviderConfig` from raw settings. The config shape is decided by
 * the *selected provider* — not by whether an API key happens to be present.
 * Throws a `ProviderError` if a cloud provider is selected without a key.
 */
export function buildProviderConfig(input: BuildConfigInput): ProviderConfig {
  const needsKey = requiresApiKey(input.provider);

  if (needsKey && input.apiKey.trim().length === 0) {
    throw new ProviderError(
      `The "${input.provider}" provider requires an API key. ` +
        `Run "Nuvo Commit: Set API Key" to add one.`,
    );
  }

  const config: ProviderConfig = {
    model: input.model,
    timeoutMs: input.timeoutMs,
  };

  if (input.endpoint.trim().length > 0) {
    config.endpoint = input.endpoint;
  }

  if (needsKey) {
    config.apiKey = input.apiKey;
  }

  return config;
}
