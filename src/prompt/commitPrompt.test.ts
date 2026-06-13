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
    expect(prompt).toContain("Then a short body explaining the most important change.");
    expect(prompt).not.toContain("No body/description text - header only.");
  });
});
