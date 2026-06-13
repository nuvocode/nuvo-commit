import { CommitMessageOptions } from "../commitMessage";

export interface ProviderConfig {
  /** Model identifier passed to the provider. */
  model: string;
  /** API endpoint URL. Required for local providers, optional override for cloud. */
  endpoint?: string;
  /** API key for cloud providers. Unused by local providers. */
  apiKey?: string;
  /** Request timeout in milliseconds. */
  timeoutMs?: number;
}

export interface Provider {
  readonly name: string;
  generateCommitMessage(
    diff: string,
    options?: CommitMessageOptions,
  ): Promise<string>;
  listModels?(): Promise<string[]>;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

export type ProviderConstructor = new (config: ProviderConfig) => Provider;

export { CommitMessageOptions };

export class ProviderRegistry {
  private static providers = new Map<string, ProviderConstructor>();

  static register(name: string, providerClass: ProviderConstructor): void {
    this.providers.set(name, providerClass);
  }

  static get(name: string): ProviderConstructor | undefined {
    return this.providers.get(name);
  }

  static list(): string[] {
    return Array.from(this.providers.keys());
  }
}
