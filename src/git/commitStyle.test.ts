import { execFileSync } from "child_process";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import * as path from "path";
import {
  isConventional,
  parseCommitlintRules,
  readCommitStyle,
} from "./commitStyle";

describe("parseCommitlintRules", () => {
  it("reads type and scope lists from JSON", () => {
    const rules = parseCommitlintRules(
      JSON.stringify({
        extends: ["@commitlint/config-conventional"],
        rules: {
          "type-enum": [2, "always", ["feat", "fix", "deps"]],
          "scope-enum": [2, "always", ["api", "web"]],
        },
      }),
    );
    expect(rules).toEqual({
      types: ["feat", "fix", "deps"],
      scopes: ["api", "web"],
    });
  });

  it("reads JS configs and inline YAML", () => {
    expect(
      parseCommitlintRules(`module.exports = {
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix']],
  },
};`).types,
    ).toEqual(["feat", "fix"]);
    expect(
      parseCommitlintRules("rules:\n  scope-enum: [2, always, [core, cli]]")
        .scopes,
    ).toEqual(["core", "cli"]);
  });

  it("returns nothing when the rules are not set", () => {
    expect(
      parseCommitlintRules('{"extends":["@commitlint/config-conventional"]}'),
    ).toEqual({ types: undefined, scopes: undefined });
  });
});

describe("isConventional", () => {
  it("follows the majority of recent headers", () => {
    expect(isConventional([])).toBe(true);
    expect(isConventional(["feat: add x", "fix(api): y", "Update docs"])).toBe(
      true,
    );
    expect(isConventional(["Add login page", "Fix typo", "feat: z"])).toBe(
      false,
    );
  });
});

describe("readCommitStyle", () => {
  let dir: string;
  const git = (...args: string[]) =>
    execFileSync("git", args, { cwd: dir, stdio: "ignore" });

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), "nvc-style-"));
    git("init", "-q");
    git("config", "user.email", "t@example.com");
    git("config", "user.name", "T");
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("handles a repository without commits", async () => {
    expect(await readCommitStyle(dir)).toEqual({
      examples: [],
      conventional: true,
    });
  });

  it("reads recent headers and detects a non-conventional style", async () => {
    for (const msg of ["Add login page", "Fix typo in README"]) {
      git("commit", "-q", "--allow-empty", "-m", msg);
    }
    expect(await readCommitStyle(dir)).toEqual({
      examples: ["Fix typo in README", "Add login page"],
      conventional: false,
    });
  });

  it("treats a commitlint config as conventional", async () => {
    git("commit", "-q", "--allow-empty", "-m", "Add login page");
    writeFileSync(
      path.join(dir, ".commitlintrc.json"),
      '{"rules":{"type-enum":[2,"always",["feat","fix"]]}}',
    );
    expect(await readCommitStyle(dir)).toMatchObject({
      types: ["feat", "fix"],
      conventional: true,
    });
  });
});
