export const ALLOWED_TYPES = [
  "feat",
  "fix",
  "refactor",
  "docs",
  "test",
  "chore",
  "perf",
  "style",
  "ci",
  "build",
] as const;

export type CommitType = (typeof ALLOWED_TYPES)[number];

const SYSTEM_RULES = `You write Conventional Commit messages from a git diff.

OUTPUT FORMAT — STRICT:
- Output ONE line only.
- Maximum 72 characters.
- Format: <type>(<scope>)?: <subject>
- type must be one of: ${ALLOWED_TYPES.join(", ")}.
- subject is imperative mood, lowercase, no trailing period.

FORBIDDEN:
- No explanations, no reasoning, no preamble.
- No markdown, no code fences, no quotes, no backticks.
- No bullet points, no lists, no multi-line output.
- No emoji.
- No "Here is" / "This commit" / "I have" wording.

Examples of CORRECT output:
feat(auth): add refresh token validation
fix(api): handle empty response body
refactor(ui): simplify modal state handling

Examples of INCORRECT output:
"feat: add login" (no quotes)
- feat: add login (no bullets)
feat: add login.\nThis adds... (no extra lines or sentences)

Reply with the commit message line ONLY. Nothing else.`;

export function buildCommitPrompt(diff: string): string {
  return `${SYSTEM_RULES}

Git diff:
\`\`\`diff
${diff}
\`\`\`

Commit message:`;
}
