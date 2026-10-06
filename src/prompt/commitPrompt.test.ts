import { buildCommitPrompt } from "./commitPrompt";

describe("buildCommitPrompt", () => {
  it("should build a header-only prompt by default", () => {
    const prompt = buildCommitPrompt("diff content");

    expect(prompt).toContain("Maximum 72 characters total for the header.");
    expect(prompt).toContain("Output ONE line only for the header.");
    expect(prompt).toContain("No body/description text - header only.");
    expect(prompt).toContain("diff content");
  });

  it("should build a body prompt when enabled", () => {
    const prompt = buildCommitPrompt("diff content", { includeBody: true });

    expect(prompt).toContain("Then one blank line.");
    expect(prompt).toContain(
      "Then a short body explaining the most important change.",
    );
    expect(prompt).not.toContain("No body/description text - header only.");
  });

  it("should include changed file context when provided", () => {
    const prompt = buildCommitPrompt("diff content", {
      files: ["src/large.ts", "src/second.ts"],
      skippedFiles: ["package-lock.json"],
    });

    expect(prompt).toContain("Change context:");
    expect(prompt).toContain("Changed files: src/large.ts, src/second.ts");
    expect(prompt).toContain("Skipped files: package-lock.json");
    expect(prompt).toContain("Consider all changed files");
  });

  it("should include balanced truncation context when provided", () => {
    const prompt = buildCommitPrompt("diff content", {
      truncated: true,
      truncatedFiles: ["src/large.ts"],
    });

    expect(prompt).toContain("Partially included files: src/large.ts");
    expect(prompt).toContain("Diff context is balanced across files");
    expect(prompt).toContain("Do not focus only on the first file.");
  });

  it("asks for the configured language but keeps types in English", () => {
    const prompt = buildCommitPrompt("diff", { language: "Turkish" });

    expect(prompt).toContain(
      "Write the subject and body in Turkish, not English.",
    );
    expect(
      prompt.endsWith(
        'English, e.g. "fix(api): <subject in Turkish>".\n\nCommit message:',
      ),
    ).toBe(true);
    expect(prompt).toContain("Keep the type (feat, fix");
  });

  it("adds no language rule for English or empty", () => {
    for (const language of [undefined, "", "English", " english "]) {
      expect(buildCommitPrompt("diff", { language })).not.toContain(
        "LANGUAGE:",
      );
    }
  });

  it("should use the repository's types, scopes and recent commits", () => {
    const prompt = buildCommitPrompt("diff content", {
      types: ["feat", "deps"],
      scopes: ["api", "web"],
      examples: ["feat(api): add users endpoint"],
    });

    expect(prompt).toContain("type must be one of: feat, deps.");
    expect(prompt).toContain("scope, if used, must be one of: api, web.");
    expect(prompt).toContain("Recent commits in this repository");
    expect(prompt).toContain("feat(api): add users endpoint");
  });

  it("should follow the recent commits when the repo is not conventional", () => {
    const prompt = buildCommitPrompt("diff content", {
      conventional: false,
      examples: ["Add login page"],
    });

    expect(prompt).toContain("You write git commit messages");
    expect(prompt).toContain("Follow the style of the recent commits");
    expect(prompt).not.toContain("type must be one of");
    expect(prompt).not.toContain("feat(auth): add token validation");
    expect(prompt).toContain("Add login page");
  });

  it("keeps the language rule in line with the commit style", () => {
    expect(
      buildCommitPrompt("diff", {
        language: "Turkish",
        types: ["feat", "deps"],
      }),
    ).toContain("Keep the type (feat, deps)");
    const freeform = buildCommitPrompt("diff", {
      language: "Turkish",
      conventional: false,
    });
    expect(freeform).toContain("Write the commit message in Turkish");
    expect(freeform).not.toContain("Keep the type");
  });
});
