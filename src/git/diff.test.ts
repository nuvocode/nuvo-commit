import { execFile } from "child_process";
import { getStagedDiff, getWorkingDiff, GitError } from "./diff";

jest.mock("child_process");

const mockExecFile = execFile as unknown as jest.Mock;

const CWD = "/repo";

type GitCallback = (
  err: Error | null,
  result?: { stdout: string; stderr: string },
) => void;

type GitResult = { stdout: string } | { error: Error };

/** Routes git invocations to canned results keyed by the joined argument list. */
function routeGit(routes: Record<string, GitResult>): void {
  mockExecFile.mockImplementation(
    (_cmd: string, args: string[], _opts: unknown, cb: GitCallback) => {
      const key = args.join(" ");
      const result = routes[key];
      if (!result) {
        cb(new Error(`unexpected git args: ${key}`));
        return;
      }
      if ("error" in result) {
        cb(result.error);
      } else {
        cb(null, { stdout: result.stdout, stderr: "" });
      }
    },
  );
}

describe("getStagedDiff", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns an empty result when nothing is staged", async () => {
    routeGit({
      "diff --cached --name-only --diff-filter=ACMRTUXB": { stdout: "" },
    });
    const result = await getStagedDiff(CWD);
    expect(result).toEqual({ diff: "", files: [] });
  });

  it("does not request a diff when no files are staged", async () => {
    routeGit({
      "diff --cached --name-only --diff-filter=ACMRTUXB": { stdout: "\n  \n" },
    });
    await getStagedDiff(CWD);
    expect(mockExecFile).toHaveBeenCalledTimes(1);
  });

  it("returns files and diff when changes are staged", async () => {
    routeGit({
      "diff --cached --name-only --diff-filter=ACMRTUXB": {
        stdout: "src/a.ts\nsrc/b.ts\n",
      },
      "diff --cached --no-ext-diff --unified=3": {
        stdout: "diff --git a/src/a.ts b/src/a.ts\n+hello",
      },
    });
    const result = await getStagedDiff(CWD);
    expect(result.files).toEqual(["src/a.ts", "src/b.ts"]);
    expect(result.diff).toContain("+hello");
  });

  it("throws GitError when git fails", async () => {
    routeGit({
      "diff --cached --name-only --diff-filter=ACMRTUXB": {
        error: new Error("fatal: not a git repository"),
      },
    });
    await expect(getStagedDiff(CWD)).rejects.toThrow(GitError);
  });
});

describe("getWorkingDiff", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns an empty result when the working tree is clean", async () => {
    routeGit({
      "diff --name-only --diff-filter=ACMRTUXB": { stdout: "" },
    });
    const result = await getWorkingDiff(CWD);
    expect(result).toEqual({ diff: "", files: [] });
  });

  it("returns files and diff for unstaged changes", async () => {
    routeGit({
      "diff --name-only --diff-filter=ACMRTUXB": { stdout: "README.md\n" },
      "diff --no-ext-diff --unified=3": {
        stdout: "diff --git a/README.md b/README.md\n+docs",
      },
    });
    const result = await getWorkingDiff(CWD);
    expect(result.files).toEqual(["README.md"]);
    expect(result.diff).toContain("+docs");
  });

  it("throws GitError when git fails", async () => {
    routeGit({
      "diff --name-only --diff-filter=ACMRTUXB": {
        error: new Error("fatal"),
      },
    });
    await expect(getWorkingDiff(CWD)).rejects.toThrow(GitError);
  });
});
