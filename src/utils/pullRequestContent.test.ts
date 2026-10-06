import { sanitizePullRequestContent } from "./pullRequestContent";

describe("sanitizePullRequestContent", () => {
  it("parses valid JSON output", () => {
    expect(
      sanitizePullRequestContent(
        '{"title":"Add PR generator","body":"## Summary\\n\\nAdds PR content.\\n\\n## Testing\\n\\nNot run."}',
      ),
    ).toEqual({
      title: "Add PR generator",
      body: "## Summary\n\nAdds PR content.\n\n## Testing\n\nNot run.",
    });
  });

  it("parses fenced JSON output", () => {
    expect(
      sanitizePullRequestContent(
        '```json\n{"title":"Fix settings.","body":"## Summary\\n\\nFixes settings."}\n```',
      ),
    ).toEqual({
      title: "Fix settings",
      body: "## Summary\n\nFixes settings.",
    });
  });

  it("falls back to text output when JSON is invalid", () => {
    expect(
      sanitizePullRequestContent("Add PR content\n\n## Summary\nAdds output"),
    ).toEqual({
      title: "Add PR content",
      body: "## Summary\nAdds output",
    });
  });

  it("provides defaults for empty output", () => {
    expect(sanitizePullRequestContent("")).toEqual({
      title: "Update branch changes",
      body: "## Summary\n\nNot provided.\n\n## Testing\n\nNot run.",
    });
  });

  it("truncates long titles", () => {
    const result = sanitizePullRequestContent(
      JSON.stringify({
        title:
          "Add a very long pull request title that exceeds the configured maximum title length by a lot",
        body: "Body",
      }),
    );

    expect(result.title.length).toBeLessThanOrEqual(80);
    expect(result.title).toMatch(/^Add a very long/);
  });
});
