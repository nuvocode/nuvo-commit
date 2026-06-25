import * as vscode from "vscode";

import packageJson from "../package.json";
import {
  buildGitCommitArgs,
  configureProviderSettings,
  getApiKeySecret,
  getProviderSettingKey,
  openGitHubPullRequestCreate,
  readSettings,
  updateActiveProvider,
  updateProviderEndpoint,
  updateProviderModel,
} from "./extension";

const packageManifest = packageJson as {
  contributes: {
    configuration: {
      properties: Record<string, { default?: unknown; type?: string }>;
    };
  };
};

function mockNuvoConfig(values: Record<string, unknown>) {
  const update = jest.fn();
  const config = {
    get: jest.fn((key: string, defaultValue: unknown) =>
      Object.prototype.hasOwnProperty.call(values, key)
        ? values[key]
        : defaultValue,
    ),
    inspect: jest.fn((key: string) =>
      Object.prototype.hasOwnProperty.call(values, key)
        ? { globalValue: values[key] }
        : undefined,
    ),
    update,
  };

  const getConfiguration = vscode.workspace.getConfiguration as jest.Mock;
  getConfiguration.mockReturnValue(config);
  return { config, update };
}

describe("extension helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (vscode.window.showQuickPick as jest.Mock).mockReset();
    (vscode.window.showInputBox as jest.Mock).mockReset();
    const getConfiguration = vscode.workspace.getConfiguration as jest.Mock;
    getConfiguration.mockReturnValue({
      get: jest.fn((_key: string, defaultValue: unknown) => defaultValue),
      inspect: jest.fn(() => undefined),
      update: jest.fn(),
    });
  });

  it("should default includeBody to false in settings", () => {
    expect(readSettings().includeBody).toBe(false);
  });

  it("should default pull request settings", () => {
    expect(readSettings()).toEqual(
      expect.objectContaining({
        pullRequestBaseBranch: "",
        pullRequestOpenCreateView: true,
        pullRequestIncludeCommitList: true,
      }),
    );
  });

  it("should expose includeBody as a boolean checkbox setting", () => {
    const setting =
      packageManifest.contributes.configuration.properties[
        "nuvoCommit.includeBody"
      ];

    expect(setting).toEqual(
      expect.objectContaining({
        type: "boolean",
        default: false,
      }),
    );
  });

  it("should expose pull request settings", () => {
    const properties = packageManifest.contributes.configuration.properties;

    expect(properties["nuvoCommit.pullRequestBaseBranch"]).toEqual(
      expect.objectContaining({
        type: "string",
        default: "",
      }),
    );
    expect(properties["nuvoCommit.pullRequestOpenCreateView"]).toEqual(
      expect.objectContaining({
        type: "boolean",
        default: true,
      }),
    );
    expect(properties["nuvoCommit.pullRequestIncludeCommitList"]).toEqual(
      expect.objectContaining({
        type: "boolean",
        default: true,
      }),
    );
  });

  it("should expose provider-specific settings", () => {
    const properties = packageManifest.contributes.configuration.properties;

    expect(properties["nuvoCommit.ollama.model"]).toEqual(
      expect.objectContaining({ type: "string", default: "qwen3:4b" }),
    );
    expect(properties["nuvoCommit.ollama.endpoint"]).toEqual(
      expect.objectContaining({
        type: "string",
        default: "http://localhost:11434/api/generate",
      }),
    );
    expect(properties["nuvoCommit.openai.model"]).toEqual(
      expect.objectContaining({ type: "string", default: "gpt-4o-mini" }),
    );
    expect(properties["nuvoCommit.openai.endpoint"]).toEqual(
      expect.objectContaining({ type: "string", default: "" }),
    );
    expect(properties["nuvoCommit.anthropic.model"]).toEqual(
      expect.objectContaining({
        type: "string",
        default: "claude-3-5-sonnet-20241022",
      }),
    );
    expect(properties["nuvoCommit.anthropic.endpoint"]).toEqual(
      expect.objectContaining({ type: "string", default: "" }),
    );
  });

  it("should read provider-specific OpenAI settings", () => {
    mockNuvoConfig({
      provider: "openai",
      "openai.model": "gpt-4o",
      "openai.endpoint": "https://custom-openai/v1/chat/completions",
      "ollama.model": "llama3.2:3b",
      "ollama.endpoint": "http://localhost:11434/api/generate",
    });

    expect(readSettings()).toEqual(
      expect.objectContaining({
        provider: "openai",
        model: "gpt-4o",
        endpoint: "https://custom-openai/v1/chat/completions",
      }),
    );
  });

  it("should read provider-specific Ollama settings", () => {
    mockNuvoConfig({
      provider: "ollama",
      "ollama.model": "mistral:7b",
      "ollama.endpoint": "http://localhost:11435/api/generate",
      "openai.model": "gpt-4o",
      "openai.endpoint": "",
    });

    expect(readSettings()).toEqual(
      expect.objectContaining({
        provider: "ollama",
        model: "mistral:7b",
        endpoint: "http://localhost:11435/api/generate",
      }),
    );
  });

  it("should fall back to legacy model and endpoint settings", () => {
    mockNuvoConfig({
      provider: "openai",
      model: "legacy-model",
      endpoint: "https://legacy-endpoint/v1/chat/completions",
    });

    expect(readSettings()).toEqual(
      expect.objectContaining({
        provider: "openai",
        model: "legacy-model",
        endpoint: "https://legacy-endpoint/v1/chat/completions",
      }),
    );
  });

  it("should update the active provider model setting", async () => {
    const { update } = mockNuvoConfig({});

    await updateProviderModel("anthropic", "claude-sonnet-4-20250514");

    expect(update).toHaveBeenCalledWith(
      "anthropic.model",
      "claude-sonnet-4-20250514",
      vscode.ConfigurationTarget.Global,
    );
  });

  it("should update the active provider endpoint setting", async () => {
    const { update } = mockNuvoConfig({});

    await updateProviderEndpoint(
      "openai",
      "http://localhost:1234/v1/chat/completions",
    );

    expect(update).toHaveBeenCalledWith(
      "openai.endpoint",
      "http://localhost:1234/v1/chat/completions",
      vscode.ConfigurationTarget.Global,
    );
  });

  it("should update the active provider setting", async () => {
    const { update } = mockNuvoConfig({});

    await updateActiveProvider("anthropic");

    expect(update).toHaveBeenCalledWith(
      "provider",
      "anthropic",
      vscode.ConfigurationTarget.Global,
    );
  });

  it("should use separate API key secrets for cloud providers", () => {
    expect(getApiKeySecret("openai")).toBe("nuvoCommit.openai.apiKey");
    expect(getApiKeySecret("anthropic")).toBe("nuvoCommit.anthropic.apiKey");
    expect(getApiKeySecret("openai")).not.toBe(getApiKeySecret("anthropic"));
  });

  it("should build provider-specific setting keys", () => {
    expect(getProviderSettingKey("ollama", "endpoint")).toBe("ollama.endpoint");
    expect(getProviderSettingKey("openai", "model")).toBe("openai.model");
  });

  it("should show only non-secret active Ollama settings", async () => {
    mockNuvoConfig({
      provider: "ollama",
      "ollama.model": "qwen3:4b",
      "ollama.endpoint": "http://localhost:11434/api/generate",
    });
    const showQuickPick = vscode.window.showQuickPick as jest.Mock;
    showQuickPick.mockResolvedValueOnce(undefined);

    await configureProviderSettings();

    const items = showQuickPick.mock.calls[0][0];
    expect(items.map((item: { action: string }) => item.action)).toEqual([
      "provider",
      "model",
      "endpoint",
    ]);
  });

  it("should show API key action for active cloud providers", async () => {
    mockNuvoConfig({
      provider: "openai",
      "openai.model": "gpt-4o-mini",
      "openai.endpoint": "",
    });
    const showQuickPick = vscode.window.showQuickPick as jest.Mock;
    showQuickPick.mockResolvedValueOnce(undefined);

    await configureProviderSettings();

    const items = showQuickPick.mock.calls[0][0];
    expect(items.map((item: { action: string }) => item.action)).toEqual([
      "provider",
      "model",
      "endpoint",
      "apiKey",
    ]);
  });

  it("should configure the active provider model from focused settings", async () => {
    const { update } = mockNuvoConfig({
      provider: "openai",
      "openai.model": "gpt-4o-mini",
      "openai.endpoint": "",
    });
    const showQuickPick = vscode.window.showQuickPick as jest.Mock;
    const showInputBox = vscode.window.showInputBox as jest.Mock;
    showQuickPick.mockResolvedValueOnce({ action: "model" });
    showInputBox.mockResolvedValueOnce("gpt-4o");

    await configureProviderSettings();

    expect(update).toHaveBeenCalledWith(
      "openai.model",
      "gpt-4o",
      vscode.ConfigurationTarget.Global,
    );
  });

  it("should configure the active provider endpoint from focused settings", async () => {
    const { update } = mockNuvoConfig({
      provider: "anthropic",
      "anthropic.model": "claude-3-5-sonnet-20241022",
      "anthropic.endpoint": "",
    });
    const showQuickPick = vscode.window.showQuickPick as jest.Mock;
    const showInputBox = vscode.window.showInputBox as jest.Mock;
    showQuickPick.mockResolvedValueOnce({ action: "endpoint" });
    showInputBox.mockResolvedValueOnce("https://custom-anthropic/v1/messages");

    await configureProviderSettings();

    expect(update).toHaveBeenCalledWith(
      "anthropic.endpoint",
      "https://custom-anthropic/v1/messages",
      vscode.ConfigurationTarget.Global,
    );
  });

  it("should change providers from focused settings", async () => {
    const { update } = mockNuvoConfig({
      provider: "ollama",
      "ollama.model": "qwen3:4b",
      "ollama.endpoint": "http://localhost:11434/api/generate",
    });
    const showQuickPick = vscode.window.showQuickPick as jest.Mock;
    showQuickPick
      .mockResolvedValueOnce({ action: "provider" })
      .mockResolvedValueOnce({ provider: "openai" });

    await configureProviderSettings();

    expect(update).toHaveBeenCalledWith(
      "provider",
      "openai",
      vscode.ConfigurationTarget.Global,
    );
  });

  it("should pass a single -m argument for header-only commits", () => {
    expect(buildGitCommitArgs("fix: handle empty response")).toEqual([
      "commit",
      "-m",
      "fix: handle empty response",
    ]);
  });

  it("should split multiline commits into header and body -m arguments", () => {
    expect(
      buildGitCommitArgs(
        "fix: handle empty response\n\nReturn a clear error for missing data.",
      ),
    ).toEqual([
      "commit",
      "-m",
      "fix: handle empty response",
      "-m",
      "Return a clear error for missing data.",
    ]);
  });

  it("should read includeBody when configured", () => {
    const getConfiguration = vscode.workspace.getConfiguration as jest.Mock;
    getConfiguration.mockReturnValueOnce({
      get: jest.fn((key: string, defaultValue: unknown) =>
        key === "includeBody" ? true : defaultValue,
      ),
    });

    expect(readSettings().includeBody).toBe(true);
  });

  it("should open GitHub PR create with repo path and compare branch", async () => {
    const getExtension = vscode.extensions.getExtension as jest.Mock;
    getExtension.mockReturnValue({ id: "GitHub.vscode-pull-request-github" });

    await expect(
      openGitHubPullRequestCreate("/repo", "feature/pr-content"),
    ).resolves.toBe(true);

    expect(vscode.commands.executeCommand).toHaveBeenCalledWith("pr.create", {
      repoPath: "/repo",
      compareBranch: "feature/pr-content",
    });
  });

  it("should not run pr.create when GitHub PR extension is missing", async () => {
    const getExtension = vscode.extensions.getExtension as jest.Mock;
    getExtension.mockReturnValue(undefined);

    await expect(
      openGitHubPullRequestCreate("/repo", "feature/pr-content"),
    ).resolves.toBe(false);

    expect(vscode.commands.executeCommand).not.toHaveBeenCalled();
  });
});
