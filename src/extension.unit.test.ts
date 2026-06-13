import * as vscode from "vscode";

import { buildGitCommitArgs, readSettings } from "./extension";

const packageJson = require("../package.json") as {
  contributes: {
    configuration: {
      properties: Record<string, { default?: unknown; type?: string }>;
    };
  };
};

describe("extension helpers", () => {
  it("should default includeBody to false in settings", () => {
    expect(readSettings().includeBody).toBe(false);
  });

  it("should expose includeBody as a boolean checkbox setting", () => {
    const setting =
      packageJson.contributes.configuration.properties["nuvoCommit.includeBody"];

    expect(setting).toEqual(
      expect.objectContaining({
        type: "boolean",
        default: false,
      }),
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
});
