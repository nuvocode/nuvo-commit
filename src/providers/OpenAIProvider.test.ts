import { OpenAIProvider } from "./OpenAIProvider";
import { ProviderError } from "./Provider";

// Mock fetch globally
global.fetch = jest.fn();

describe("OpenAIProvider", () => {
  const mockApiKey = "sk-test123";
  const mockModel = "gpt-4o";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create provider with correct name", () => {
      const provider = new OpenAIProvider({
        apiKey: mockApiKey,
        model: mockModel,
      });
      expect(provider.name).toBe("openai");
    });
  });

  describe("generateCommitMessage", () => {
    it("should generate commit message successfully", async () => {
      const mockResponse = {
        choices: [{ message: { content: "feat: add new feature" } }],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const provider = new OpenAIProvider({
        apiKey: mockApiKey,
        model: mockModel,
      });

      const diff = "diff --git a/file.js b/file.js";
      const message = await provider.generateCommitMessage(diff);

      expect(message).toBe("feat: add new feature");
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.openai.com/v1/chat/completions",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: `Bearer ${mockApiKey}`,
          }),
        }),
      );
    });

    it("should use custom endpoint when provided", async () => {
      const customEndpoint = "https://custom.openai.com/v1/chat/completions";
      const mockResponse = {
        choices: [{ message: { content: "fix: bug fix" } }],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const provider = new OpenAIProvider({
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

    it("should throw ProviderError on network error", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network error"),
      );

      const provider = new OpenAIProvider({
        apiKey: mockApiKey,
        model: mockModel,
      });

      await expect(
        provider.generateCommitMessage("diff"),
      ).rejects.toThrow(ProviderError);
    });

    it("should throw ProviderError on non-OK response", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Unauthorized"),
      });

      const provider = new OpenAIProvider({
        apiKey: "invalid-key",
        model: mockModel,
      });

      await expect(
        provider.generateCommitMessage("diff"),
      ).rejects.toThrow(/OpenAI responded 401/);
    });

    it("should throw ProviderError on empty choices", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ choices: [] }),
      });

      const provider = new OpenAIProvider({
        apiKey: mockApiKey,
        model: mockModel,
      });

      await expect(
        provider.generateCommitMessage("diff"),
      ).rejects.toThrow(/No response from OpenAI/);
    });
  });

  describe("listModels", () => {
    it("should return static list of common OpenAI models", async () => {
      const provider = new OpenAIProvider({
        apiKey: mockApiKey,
        model: mockModel,
      });

      const models = await provider.listModels();

      expect(models).toEqual([
        "gpt-4o",
        "gpt-4o-mini",
        "gpt-4-turbo",
        "gpt-4",
        "gpt-3.5-turbo",
      ]);
      expect(models).toHaveLength(5);
    });
  });
});
