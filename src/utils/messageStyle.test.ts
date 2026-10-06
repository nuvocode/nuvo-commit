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

  it("uses custom emoji from the settings", () => {
    const emojis = { feat: "🚀", breaking: "🔥", wip: "🚧" };
    expect(applyMessageStyle("feat: add login", "gitmoji", emojis)).toBe(
      "🚀 add login",
    );
    expect(applyMessageStyle("fix!: drop v1", "gitmoji", emojis)).toBe(
      "🔥 drop v1",
    );
    expect(applyMessageStyle("wip: draft", "gitmoji", emojis)).toBe("🚧 draft");
    expect(applyMessageStyle("fix: typo", "gitmoji", emojis)).toBe("🐛 typo");
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
