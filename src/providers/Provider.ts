export interface ProviderConfig {
  model: string;
  endpoint?: string;
}

export interface Provider {
  readonly name: string;
  generateCommitMessage(diff: string): Promise<string>;
}

export class ProviderError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "ProviderError";
  }
}
