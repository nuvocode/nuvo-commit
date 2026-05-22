export interface BaseProviderConfig {
  model: string;
}

export interface LocalProviderConfig extends BaseProviderConfig {
  endpoint: string;
}

export interface APIProviderConfig extends BaseProviderConfig {
  apiKey: string;
  endpoint?: string;
}

export type ProviderConfig = LocalProviderConfig | APIProviderConfig;

export interface Provider {
  readonly name: string;
  generateCommitMessage(diff: string): Promise<string>;
  listModels?(): Promise<string[]>;
}

export class ProviderError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "ProviderError";
  }
}

export class ProviderRegistry {
  private static providers = new Map<string, new (config: ProviderConfig) => Provider>();

  static register(name: string, providerClass: new (config: ProviderConfig) => Provider): void {
    this.providers.set(name, providerClass);
  }

  static get(name: string): (new (config: ProviderConfig) => Provider) | undefined {
    return this.providers.get(name);
  }

  static list(): string[] {
    return Array.from(this.providers.keys());
  }
}

export function isLocalProvider(config: ProviderConfig): config is LocalProviderConfig {
  return "endpoint" in config && !("apiKey" in config);
}

export function isAPIProvider(config: ProviderConfig): config is APIProviderConfig {
  return "apiKey" in config;
}
