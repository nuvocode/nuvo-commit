import { AnthropicProvider } from "./AnthropicProvider";
import { ProviderError } from "./Provider";

// Mock fetch globally
global.fetch = jest.fn();

describe("AnthropicProvider", () => {
  const mockApiKey = "sk-ant-test123";
  const mockModel = "claude-sonnet-4-20250514";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create provider with correct name", () => {
      const provider = new AnthropicProvider({
        apiKey: mockApiKey,
        model: mockModel,
      });
      expect(provider.name).toBe("anthropic");
    });
  });

  describe("generateCommitMessage", () => {
    it("should generate commit message successfully", async () => {
      const mockResponse = {
        content: [{ type: "text", text: "feat: add new feature" }],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const provider = new AnthropicProvider({
        apiKey: mockApiKey,
        model: mockModel,
      });

      const diff = "diff --git a/file.js b/file.js";
      const message = await provider.generateCommitMessage(diff);

      expect(message).toBe("feat: add new feature");
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.anthropic.com/v1/messages",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "x-api-key": mockApiKey,
            "anthropic-version": "2023-06-01",
          }),
        }),
      );
    });

    it("should use custom endpoint when provided", async () => {
      const customEndpoint = "https://custom.anthropic.com/v1/messages";
      const mockResponse = {
        content: [{ type: "text", text: "fix: bug fix" }],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const provider = new AnthropicProvider({
        apiKey: mockApiKey,
        model: mockModel,
        endpoint: customEndpoint,
      });

      await provider.generateCommitMessage("diff content");

      expect(global.fetch).toHaveBeenCalledWith(
        customEndpoint,
        expect.any(Object),
      );
    });

    it("should allow body output when requested", async () => {
      const mockResponse = {
        content: [
          {
            type: "text",
            text: "fix: handle empty response\n\nReturn a clear error for missing data.",
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const provider = new AnthropicProvider({
        apiKey: mockApiKey,
        model: mockModel,
      });

      const message = await provider.generateCommitMessage("diff content", {
        includeBody: true,
      });
      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(message).toBe(
        "fix: handle empty response\n\nReturn a clear error for missing data.",
      );
      expect(body.messages[0].content).toContain("Then one blank line.");
      expect(body.max_tokens).toBe(300);
    });

    it("should throw ProviderError on network error", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network error"),
      );

      const provider = new AnthropicProvider({
        apiKey: mockApiKey,
        model: mockModel,
      });

      await expect(provider.generateCommitMessage("diff")).rejects.toThrow(
        ProviderError,
      );
    });

    it("should throw ProviderError on non-OK response", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Invalid API key"),
      });

      const provider = new AnthropicProvider({
        apiKey: "invalid-key",
        model: mockModel,
      });

      await expect(provider.generateCommitMessage("diff")).rejects.toThrow(
        /Anthropic responded 401/,
      );
    });

    it("should throw ProviderError on empty content", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ content: [] }),
      });

      const provider = new AnthropicProvider({
        apiKey: mockApiKey,
        model: mockModel,
      });

      await expect(provider.generateCommitMessage("diff")).rejects.toThrow(
        /No response from Anthropic/,
      );
    });
  });

  describe("listModels", () => {
    const provider = () =>
      new AnthropicProvider({ apiKey: mockApiKey, model: mockModel });

    it("fetches models from the Models API", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [{ id: "claude-opus-5-5" }, { id: "claude-haiku-4-5" }],
          }),
      });

      expect(await provider().listModels()).toEqual([
        "claude-opus-5-5",
        "claude-haiku-4-5",
      ]);
      const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toBe("https://api.anthropic.com/v1/models?limit=1000");
      expect(init.headers["x-api-key"]).toBe(mockApiKey);
    });

    it("falls back to a static list when the request fails", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });
      expect(await provider().listModels()).toContain("claude-haiku-4-5");

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("offline"));
      expect(await provider().listModels()).toContain("claude-haiku-4-5");
    });
  });
});
