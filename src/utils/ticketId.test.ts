import { addTicketId, extractTicketId } from "./ticketId";

describe("extractTicketId", () => {
  it("finds the ticket in common branch names", () => {
    expect(extractTicketId("feat/ABC-123-login")).toBe("ABC-123");
    expect(extractTicketId("PROJ2-7")).toBe("PROJ2-7");
    expect(extractTicketId("fix/login-2")).toBeUndefined();
    expect(extractTicketId("main")).toBeUndefined();
  });

  it("uses a custom pattern and ignores an invalid one", () => {
    expect(extractTicketId("feature/gh-42-search", "gh-\\d+")).toBe("gh-42");
    expect(extractTicketId("feat/ABC-1", "(")).toBeUndefined();
    expect(extractTicketId("feat/ABC-1", "")).toBe("ABC-1");
  });
});

describe("addTicketId", () => {
  it("adds a Refs footer", () => {
    expect(addTicketId("feat: add login", "ABC-1", "footer")).toBe(
      "feat: add login\n\nRefs: ABC-1",
    );
    expect(addTicketId("feat: add login\n\nBody.", "ABC-1", "footer")).toBe(
      "feat: add login\n\nBody.\n\nRefs: ABC-1",
    );
  });

  it("puts the ticket after the Conventional Commit prefix", () => {
    expect(addTicketId("feat(auth)!: add login", "ABC-1", "prefix")).toBe(
      "feat(auth)!: ABC-1 add login",
    );
    expect(addTicketId("Add login page", "ABC-1", "prefix")).toBe(
      "ABC-1 Add login page",
    );
  });

  it("leaves the message alone when off, missing or already present", () => {
    expect(addTicketId("feat: add login", "ABC-1", "off")).toBe(
      "feat: add login",
    );
    expect(addTicketId("feat: add login", undefined, "footer")).toBe(
      "feat: add login",
    );
    expect(addTicketId("feat: ABC-1 add login", "ABC-1", "footer")).toBe(
      "feat: ABC-1 add login",
    );
  });
});
