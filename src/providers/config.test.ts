import { buildProviderConfig, requiresApiKey } from "./config";
import { ProviderError } from "./Provider";

describe("requiresApiKey", () => {
  it("is true for cloud providers", () => {
    expect(requiresApiKey("openai")).toBe(true);
    expect(requiresApiKey("anthropic")).toBe(true);
  });

  it("is false for the local Ollama provider", () => {
    expect(requiresApiKey("ollama")).toBe(false);
  });
});

describe("buildProviderConfig", () => {
  const base = {
    model: "qwen3:4b",
    endpoint: "http://localhost:11434/api/generate",
    apiKey: "",
    timeoutMs: 30000,
  };

  it("builds a local config for ollama without an api key", () => {
    const config = buildProviderConfig({ ...base, provider: "ollama" });
    expect(config).toEqual({
      model: "qwen3:4b",
      timeoutMs: 30000,
      endpoint: "http://localhost:11434/api/generate",
    });
    expect(config.apiKey).toBeUndefined();
  });

  it("includes the api key for cloud providers", () => {
    const config = buildProviderConfig({
      ...base,
      provider: "openai",
      endpoint: "",
      apiKey: "sk-test",
    });
    expect(config.apiKey).toBe("sk-test");
    expect(config.endpoint).toBeUndefined();
  });

  it("keeps a custom endpoint for cloud providers", () => {
    const config = buildProviderConfig({
      ...base,
      provider: "openai",
      endpoint: "https://custom/v1/chat",
      apiKey: "sk-test",
    });
    expect(config.endpoint).toBe("https://custom/v1/chat");
  });

  it("throws a ProviderError when a cloud provider has no api key", () => {
    expect(() =>
      buildProviderConfig({ ...base, provider: "anthropic", apiKey: "" }),
    ).toThrow(ProviderError);
  });

  it("throws when the api key is only whitespace", () => {
    expect(() =>
      buildProviderConfig({ ...base, provider: "openai", apiKey: "   " }),
    ).toThrow(/requires an API key/);
  });
});
