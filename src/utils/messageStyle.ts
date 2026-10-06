export type MessageStyle = "conventional" | "gitmoji" | "plain";

/** gitmoji.dev emoji for each Conventional Commit type. */
export const GITMOJI: Record<string, string> = {
  feat: "✨",
  fix: "🐛",
  refactor: "♻️",
  docs: "📝",
  test: "✅",
  chore: "🔧",
  perf: "⚡️",
  style: "🎨",
  ci: "👷",
  build: "📦️",
  revert: "⏪️",
};

const HEADER_RE =
  /^(?<type>[a-z]+)(?:\((?<scope>[^)]+)\))?(?<breaking>!)?: (?<subject>.+)$/;

/**
 * Rewrites a Conventional Commit header in the chosen style. The model always
 * writes Conventional Commits; headers it cannot parse are left unchanged.
 *   gitmoji: `feat(auth): add login` → `✨ auth: add login`
 *   plain:   `feat(auth): add login` → `Add login`
 */
export function applyMessageStyle(
  message: string,
  style: MessageStyle,
): string {
  if (style === "conventional") return message;

  const [header, ...rest] = message.split("\n");
  const m = HEADER_RE.exec(header)?.groups;
  if (!m) return message;

  let next: string;
  if (style === "plain") {
    next = m.subject.charAt(0).toUpperCase() + m.subject.slice(1);
  } else {
    const emoji = m.breaking ? "💥" : GITMOJI[m.type];
    if (!emoji) return message;
    next = `${emoji} ${m.scope ? `${m.scope}: ` : ""}${m.subject}`;
  }
  return [next, ...rest].join("\n");
}
