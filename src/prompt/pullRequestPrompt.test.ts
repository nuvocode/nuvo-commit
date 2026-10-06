import { buildPullRequestPrompt } from "./pullRequestPrompt";

describe("buildPullRequestPrompt", () => {
  it("requests strict JSON with title and body", () => {
    const prompt = buildPullRequestPrompt("diff content");

    expect(prompt).toContain('{"title":"...","body":"..."}');
    expect(prompt).toContain("Output valid JSON only.");
    expect(prompt).toContain("Summary");
    expect(prompt).toContain("Testing");
    expect(prompt).toContain("diff content");
  });

  it("includes branch and commit context when provided", () => {
    const prompt = buildPullRequestPrompt("diff content", {
      baseBranch: "origin/main",
      currentBranch: "feature/pr-content",
      commits: ["feat: add generator"],
      includeCommitList: true,
    });

    expect(prompt).toContain("Base branch: origin/main");
    expect(prompt).toContain("Current branch: feature/pr-content");
    expect(prompt).toContain("- feat: add generator");
  });

  it("omits commit context when disabled", () => {
    const prompt = buildPullRequestPrompt("diff content", {
      commits: ["feat: add generator"],
      includeCommitList: false,
    });

    expect(prompt).not.toContain("Commit summary:");
  });
});
