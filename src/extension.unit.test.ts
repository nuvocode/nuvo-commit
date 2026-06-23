import * as vscode from "vscode";

import packageJson from "../package.json";
import {
  buildGitCommitArgs,
  openGitHubPullRequestCreate,
  readSettings,
} from "./extension";

const packageManifest = packageJson as {
  contributes: {
    configuration: {
      properties: Record<string, { default?: unknown; type?: string }>;
    };
  };
};

describe("extension helpers", () => {
  beforeEach(() => jest.clearAllMocks());

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
