import { ALLOWED_TYPES } from "../prompt/commitPrompt";

const MAX_LEN = 72;

const CONVENTIONAL_RE = new RegExp(
  `^(${ALLOWED_TYPES.join("|")})(\\([^)]+\\))?!?:\\s.+`,
);

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
    line = line.slice(0, MAX_LEN).replace(/[\s\-_,;:]+$/g, "");
  }

  return line;
}
