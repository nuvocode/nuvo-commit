import { PullRequestContentOptions } from "../pullRequest";

const PR_RULES = `You write GitHub pull request titles and descriptions from a git diff.

OUTPUT FORMAT - STRICT:
- Output valid JSON only.
- JSON shape: {"title":"...","body":"..."}
- title is concise, human-readable, and maximum 80 characters.
- body is Markdown.
- body must include these headings exactly:
  - Summary
  - Testing
- Summary should explain the important user-visible or implementation changes.
- Testing should mention inferred tests only when visible in the diff or commits; otherwise say "Not run."

FORBIDDEN:
- No explanations, no reasoning, no preamble.
- No code fences, no markdown outside the JSON.
- No emoji.
- No "Here is" / "This pull request" wording outside the JSON.`;

export function buildPullRequestPrompt(
  diff: string,
  options: PullRequestContentOptions = {},
): string {
  const contextLines = [
    options.baseBranch ? `Base branch: ${options.baseBranch}` : undefined,
    options.currentBranch
      ? `Current branch: ${options.currentBranch}`
      : undefined,
  ].filter((line): line is string => Boolean(line));

  const commits =
    options.includeCommitList !== false && options.commits?.length
      ? `\nCommit summary:\n${options.commits.map((c) => `- ${c}`).join("\n")}\n`
      : "";

  const context =
    contextLines.length > 0
      ? `\nBranch context:\n${contextLines.join("\n")}\n`
      : "";

  return `${PR_RULES}${context}${commits}
Git diff:
\`\`\`diff
${diff}
\`\`\`

Pull request JSON:`;
}
