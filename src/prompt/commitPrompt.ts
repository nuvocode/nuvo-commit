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
- Output ONE line only for the header.
- Maximum 50 characters total for the header.
- Format: <type>(<scope>)?: <subject>
- type must be one of: ${ALLOWED_TYPES.join(", ")}.
- subject is imperative mood, lowercase, no trailing period.
- Keep it VERY SHORT - aim for 30-40 characters.

FORBIDDEN:
- No explanations, no reasoning, no preamble.
- No markdown, no code fences, no quotes, no backticks.
- No bullet points, no lists, no multi-line output.
- No emoji.
- No "Here is" / "This commit" / "I have" wording.
- No body/description text - header only.

Examples of CORRECT output:
feat(auth): add token validation
fix(api): handle empty body
refactor(ui): simplify modal
docs: update README

Examples of INCORRECT output:
"feat: add login" (no quotes)
- feat: add login (no bullets)
feat: add login.\nThis adds... (no extra lines)
feat(parser): implement new recursive descent parsing (too long)

Reply with the commit message header ONLY. Nothing else.`;

export function buildCommitPrompt(diff: string): string {
  return `${SYSTEM_RULES}

Git diff:
\`\`\`diff
${diff}
\`\`\`

Commit message:`;
}
