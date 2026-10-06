import { setupFixes } from "./setupCheck";

const titles = (provider: string, error: string) =>
  setupFixes(provider, "qwen3:4b", error).map((f) => f.title);

describe("setupFixes", () => {
  it("asks for an API key when it is missing or rejected", () => {
    expect(
      titles(
        "openai",
        'The "openai" provider requires an API key. Run "Nuvo Commit: Set API Key" to add one.',
      ),
    ).toEqual(["Set API Key", "Open Settings"]);
    expect(
      titles("anthropic", "Anthropic responded 401: invalid x-api-key"),
    ).toEqual(["Set API Key", "Open Settings"]);
  });

  it("points to the Ollama download when Ollama is not running", () => {
    expect(
      titles(
        "ollama",
        "Cannot reach Ollama at http://localhost:11434/api/generate. Is it running?",
      ),
    ).toEqual(["Install Ollama", "Open Settings"]);
  });

  it("offers to pull a missing Ollama model", () => {
    const fixes = setupFixes(
      "ollama",
      "qwen3:4b",
      'Ollama responded 404: {"error":"model \'qwen3:4b\' not found"}',
    );
    expect(fixes[0]).toEqual({
      title: "Copy Pull Command",
      copy: "ollama pull qwen3:4b",
    });
    expect(fixes[1].command).toBe("nuvoCommit.selectModel");
  });

  it("suggests another model when the response is empty", () => {
    expect(
      titles(
        "ollama",
        "qwen3:4b returned an empty response. Choose another model.",
      ),
    ).toEqual(["Select Model"]);
  });

  it("falls back to the settings", () => {
    expect(titles("openai", "OpenAI responded 500: oops")).toEqual([
      "Open Settings",
    ]);
  });
});
