import { OllamaProvider } from './OllamaProvider';
import { ProviderError } from './Provider';

// Mock global fetch
global.fetch = jest.fn();

describe('OllamaProvider', () => {
  const mockEndpoint = 'http://localhost:11434/api/generate';
  const mockModel = 'qwen3:4b';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have correct name', () => {
    const provider = new OllamaProvider({ endpoint: mockEndpoint, model: mockModel });
    expect(provider.name).toBe('ollama');
  });

  it('should generate commit message successfully', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ response: 'feat: add new feature', done: true }),
    };
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const provider = new OllamaProvider({ endpoint: mockEndpoint, model: mockModel });
    const diff = 'diff --git a/src/index.ts b/src/index.ts\n+console.log("hello")';

    const result = await provider.generateCommitMessage(diff);

    expect(result).toBe('feat: add new feature');
    expect(global.fetch).toHaveBeenCalledWith(
      mockEndpoint,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  it('should throw ProviderError when fetch fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const provider = new OllamaProvider({ endpoint: mockEndpoint, model: mockModel });
    const diff = 'diff --git a/src/index.ts b/src/index.ts';

    await expect(provider.generateCommitMessage(diff)).rejects.toThrow(ProviderError);
    await expect(provider.generateCommitMessage(diff)).rejects.toThrow(
      `Cannot reach Ollama at ${mockEndpoint}`
    );
  });

  it('should throw ProviderError on non-OK response', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      text: jest.fn().mockResolvedValue('Internal server error'),
    };
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const provider = new OllamaProvider({ endpoint: mockEndpoint, model: mockModel });
    const diff = 'diff --git a/src/index.ts b/src/index.ts';

    await expect(provider.generateCommitMessage(diff)).rejects.toThrow(ProviderError);
    await expect(provider.generateCommitMessage(diff)).rejects.toThrow(
      'Ollama responded 500'
    );
  });

  it('should handle empty response gracefully', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ response: '', done: true }),
    };
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const provider = new OllamaProvider({ endpoint: mockEndpoint, model: mockModel });
    const diff = 'diff --git a/src/index.ts b/src/index.ts';

    const result = await provider.generateCommitMessage(diff);
    // Empty response is sanitized to default fallback
    expect(result).toBe('chore: update staged changes');
  });

  it('should send correct request body', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ response: 'fix: bug fix', done: true }),
    };
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const provider = new OllamaProvider({ endpoint: mockEndpoint, model: mockModel });
    const diff = 'diff content here';

    await provider.generateCommitMessage(diff);

    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(callArgs[1].body);
    
    expect(body.model).toBe(mockModel);
    expect(body.prompt).toBeDefined();
    expect(body.stream).toBe(false);
    expect(body.options).toEqual({
      temperature: 0.2,
      top_p: 0.9,
      num_predict: 50,
      stop: ['\n\n', '```', 'Here', 'This commit'],
    });
  });
});
