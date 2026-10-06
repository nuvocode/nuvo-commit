import * as vscode from "vscode";
import { VSCodeLMProvider } from "./VSCodeLMProvider";
import { ProviderError } from "./Provider";

const selectChatModels = vscode.lm.selectChatModels as jest.Mock;

function fakeModel(id: string, chunks: string[] | Error) {
  return {
    id,
    sendRequest: jest.fn(async () => {
      if (chunks instanceof Error) throw chunks;
      return {
        text: (async function* () {
          yield* chunks;
        })(),
      };
    }),
  };
}

describe("VSCodeLMProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("generates a commit message from the first available model", async () => {
    const model = fakeModel("copilot-gpt", ["feat: add ", "login"]);
    selectChatModels.mockResolvedValueOnce([model]);

    const provider = new VSCodeLMProvider({ model: "" });

    expect(await provider.generateCommitMessage("diff")).toBe(
      "feat: add login",
    );
    expect(selectChatModels).toHaveBeenCalledWith(undefined);
    expect(model.sendRequest).toHaveBeenCalledTimes(1);
  });

  it("selects the configured model by id", async () => {
    selectChatModels.mockResolvedValueOnce([
      fakeModel("claude", ["fix: handle empty body"]),
    ]);

    const provider = new VSCodeLMProvider({ model: "claude" });
    await provider.generateCommitMessage("diff");

    expect(selectChatModels).toHaveBeenCalledWith({ id: "claude" });
  });

  it("throws a helpful error when the configured model is missing", async () => {
    selectChatModels.mockResolvedValueOnce([]);
    const provider = new VSCodeLMProvider({ model: "gone" });

    await expect(provider.generateCommitMessage("diff")).rejects.toThrow(
      /"gone" is not available/,
    );
  });

  it("throws a helpful error when no models exist", async () => {
    selectChatModels.mockResolvedValueOnce([]);
    const provider = new VSCodeLMProvider({ model: "" });

    await expect(provider.generateCommitMessage("diff")).rejects.toThrow(
      /GitHub Copilot/,
    );
  });

  it("wraps LanguageModelError (e.g. no consent) in a ProviderError", async () => {
    const LMError = vscode.LanguageModelError as unknown as new (
      message: string,
      code: string,
    ) => Error;
    selectChatModels.mockResolvedValueOnce([
      fakeModel("copilot-gpt", new LMError("consent denied", "NoPermissions")),
    ]);
    const provider = new VSCodeLMProvider({ model: "" });

    const err = await provider.generateCommitMessage("diff").catch((e) => e);
    expect(err).toBeInstanceOf(ProviderError);
    expect(err.message).toMatch(/NoPermissions: consent denied/);
  });

  it("lists model ids and returns [] when the API fails", async () => {
    selectChatModels.mockResolvedValueOnce([
      fakeModel("a", []),
      fakeModel("b", []),
    ]);
    const provider = new VSCodeLMProvider({ model: "" });
    expect(await provider.listModels()).toEqual(["a", "b"]);

    selectChatModels.mockRejectedValueOnce(new Error("boom"));
    expect(await provider.listModels()).toEqual([]);
  });
});
