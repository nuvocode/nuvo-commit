import { applyMessageStyle } from "./messageStyle";

describe("applyMessageStyle", () => {
  it("keeps Conventional Commits unchanged", () => {
    expect(applyMessageStyle("feat(auth): add login", "conventional")).toBe(
      "feat(auth): add login",
    );
  });

  it("maps the type to a gitmoji and keeps the scope", () => {
    expect(applyMessageStyle("feat(auth): add login", "gitmoji")).toBe(
      "✨ auth: add login",
    );
    expect(applyMessageStyle("fix: handle empty body", "gitmoji")).toBe(
      "🐛 handle empty body",
    );
    expect(applyMessageStyle("refactor(api)!: drop v1 routes", "gitmoji")).toBe(
      "💥 api: drop v1 routes",
    );
  });

  it("drops the type for plain messages", () => {
    expect(applyMessageStyle("feat(auth): add login", "plain")).toBe(
      "Add login",
    );
  });

  it("keeps the body", () => {
    expect(
      applyMessageStyle("docs: update README\n\nExplain setup.", "gitmoji"),
    ).toBe("📝 update README\n\nExplain setup.");
  });

  it("leaves headers it cannot map unchanged", () => {
    expect(applyMessageStyle("Add login page", "gitmoji")).toBe(
      "Add login page",
    );
    expect(applyMessageStyle("deps: bump react", "gitmoji")).toBe(
      "deps: bump react",
    );
    expect(applyMessageStyle("deps: bump react", "plain")).toBe("Bump react");
  });
});
