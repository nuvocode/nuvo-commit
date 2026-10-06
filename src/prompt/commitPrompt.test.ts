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
});
