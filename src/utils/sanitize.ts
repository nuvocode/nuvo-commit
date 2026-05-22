import { ALLOWED_TYPES } from "../prompt/commitPrompt";

const MAX_LEN = 50;

const CONVENTIONAL_RE = new RegExp(
  `^(${ALLOWED_TYPES.join("|")})(\\([^)]+\\))?!?:\\s.+`,
);

/**
 * Truncates text at word boundaries to avoid cutting words in half.
 * Ensures the result doesn't exceed maxLen characters.
 */
function truncateAtWordBoundary(text: string, maxLen: number): string {
  if (text.length <= maxLen) {
    return text;
  }

  // Try to find a space to cut at
  const lastSpace = text.lastIndexOf(" ", maxLen);
  
  // If we found a space and it's not too far back, cut there
  if (lastSpace > maxLen * 0.7) {
    return text.slice(0, lastSpace);
  }

  // Otherwise just cut at maxLen
  return text.slice(0, maxLen).replace(/[\s\-_,;:]+$/g, "");
}

export function sanitizeCommitMessage(raw: string): string {
  let text = raw ?? "";

  text = text.replace(/```[\s\S]*?```/g, " ");
  text = text.replace(/```/g, "");

  const firstLine = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l.length > 0) ?? "";

  let line = firstLine
    .replace(/^[-*•]\s+/, "")
    .replace(/^#+\s+/, "")
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\*\*/g, "")
    .replace(/[*_`]/g, "")
    .trim();

  line = line.replace(/[.!?\s]+$/g, "");

  if (!CONVENTIONAL_RE.test(line)) {
    const fallback = line.length > 0 ? line : "update staged changes";
    line = `chore: ${fallback}`;
  }

  if (line.length > MAX_LEN) {
    line = truncateAtWordBoundary(line, MAX_LEN);
  }

  return line;
}
