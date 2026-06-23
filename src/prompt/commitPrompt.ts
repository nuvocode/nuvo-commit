import { CommitMessageOptions } from "../commitMessage";

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

export type CommitPromptOptions = CommitMessageOptions;

const HEADER_RULES = `You write Conventional Commit messages from a git diff.

OUTPUT FORMAT — STRICT:
- Output ONE line only for the header.
- Maximum 72 characters total for the header.
- Format: <type>(<scope>)?: <subject>
- type must be one of: ${ALLOWED_TYPES.join(", ")}.
- subject is imperative mood, lowercase, no trailing period.
- Keep it concise and complete.
- Consider all changed files listed in the context, not only the first diff.
- If the diff was truncated, infer the main intent from the full changed-file list.
- Do not end the subject with weak trailing words like "and", "with", "for", or "to".

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
fix: update auth and (incomplete subject)

Reply with the commit message header ONLY. Nothing else.`;

const BODY_RULES = `You write Conventional Commit messages from a git diff.

OUTPUT FORMAT — STRICT:
- First line: a Conventional Commit header.
- Maximum 72 characters total for the header.
- Then one blank line.
- Then a short body explaining the most important change.
- Format: <type>(<scope>)?: <subject>
- type must be one of: ${ALLOWED_TYPES.join(", ")}.
- subject is imperative mood, lowercase, no trailing period.
- Consider all changed files listed in the context, not only the first diff.
- If the diff was truncated, infer the main intent from the full changed-file list.
- Do not end the header subject with weak trailing words like "and", "with", "for", or "to".

FORBIDDEN:
- No explanations, no reasoning, no preamble.
- No markdown, no code fences, no quotes, no backticks.
- No bullet points, no lists.
- No emoji.
- No "Here is" / "This commit" / "I have" wording.

Examples of CORRECT output:
feat(auth): add token validation

Validate bearer tokens before protected route access.

fix(api): handle empty body

Return a clear validation error for empty requests.

Reply with the commit message only. Nothing else.`;

export function buildCommitPrompt(
  diff: string,
  options: CommitPromptOptions = {},
): string {
  const rules = options.includeBody ? BODY_RULES : HEADER_RULES;
  const changedFiles = formatFileList("Changed files", options.files);
  const skippedFiles = formatFileList("Skipped files", options.skippedFiles);
  const truncatedFiles = formatFileList(
    "Partially included files",
    options.truncatedFiles,
  );
  const truncationNote = options.truncated
    ? "Diff context is balanced across files and partially truncated. Do not focus only on the first file."
    : undefined;
  const context = [
    changedFiles,
    skippedFiles,
    truncatedFiles,
    truncationNote,
  ].filter((line): line is string => Boolean(line));

  return `${rules}${context.length > 0 ? `\n\nChange context:\n${context.join("\n")}` : ""}

Git diff:
\`\`\`diff
${diff}
\`\`\`

Commit message:`;
}

function formatFileList(label: string, files?: string[]): string | undefined {
  if (!files || files.length === 0) return undefined;

  const visible = files.slice(0, 30);
  const suffix =
    files.length > visible.length
      ? `, ... +${files.length - visible.length} more`
      : "";
  return `${label}: ${visible.join(", ")}${suffix}`;
}
