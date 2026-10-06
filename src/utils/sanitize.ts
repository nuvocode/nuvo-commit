import { ALLOWED_TYPES } from "../prompt/commitPrompt";
import { CommitMessageOptions } from "../commitMessage";

const HEADER_MAX_LEN = 72;
const DEFAULT_SUBJECT = "update staged changes";

export type SanitizeCommitMessageOptions = CommitMessageOptions;

const CONVENTIONAL_RE = new RegExp(
  `^(${ALLOWED_TYPES.join("|")})(\\([^)]+\\))?!?:\\s.+`,
);

const CONVENTIONAL_PARTS_RE = new RegExp(
  `^(?<prefix>(${ALLOWED_TYPES.join("|")})(\\([^)]+\\))?!?:\\s*)(?<subject>.+)$`,
);

const WEAK_TRAILING_WORDS = new Set([
  "and",
  "or",
  "with",
  "for",
  "to",
  "from",
  "by",
  "in",
  "on",
  "of",
]);

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

function cleanLine(raw: string): string {
  return raw
    .replace(/^[-*•]\s+/, "")
    .replace(/^#+\s+/, "")
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\*\*/g, "")
    .replace(/[*_`]/g, "")
    .trim();
}

function removeTrailingPunctuation(text: string): string {
  return text.replace(/[.!?\s]+$/g, "");
}

function removeWeakTrailingWords(text: string): string {
  let next = removeTrailingPunctuation(text);

  while (true) {
    const match = next.match(/^(.*)\s+([a-z]+)$/i);
    if (!match || !WEAK_TRAILING_WORDS.has(match[2].toLowerCase())) {
      return next;
    }

    const previous = removeTrailingPunctuation(match[1].trim());
    if (previous.length === 0) {
      return next;
    }
    next = previous;
  }
}

function normalizeHeader(rawHeader: string): string {
  let line = removeTrailingPunctuation(cleanLine(rawHeader));

  if (!CONVENTIONAL_RE.test(line)) {
    const fallback = line.length > 0 ? line : DEFAULT_SUBJECT;
    line = `chore: ${fallback}`;
  }

  const parts = CONVENTIONAL_PARTS_RE.exec(line);
  if (!parts?.groups) {
    return truncateAtWordBoundary(line, HEADER_MAX_LEN);
  }

  const prefix = parts.groups.prefix;
  let subject = removeTrailingPunctuation(parts.groups.subject.trim());
  const maxSubjectLen = HEADER_MAX_LEN - prefix.length;
  let wasTruncated = false;

  if (maxSubjectLen > 0 && subject.length > maxSubjectLen) {
    subject = truncateAtWordBoundary(subject, maxSubjectLen);
    wasTruncated = true;
  }

  if (wasTruncated) {
    subject = removeWeakTrailingWords(subject);
  }

  if (subject.length === 0) {
    subject = DEFAULT_SUBJECT;
  }

  const header = `${prefix}${subject}`;
  return header.length > HEADER_MAX_LEN
    ? truncateAtWordBoundary(header, HEADER_MAX_LEN)
    : header;
}

function cleanBodyLine(raw: string): string {
  return cleanLine(raw).replace(/\s+/g, " ").trim();
}

export function sanitizeCommitMessage(
  raw: string,
  options: SanitizeCommitMessageOptions = {},
): string {
  let text = raw ?? "";

  text = text.replace(/```[\s\S]*?```/g, " ");
  text = text.replace(/```/g, "");

  const lines = text.split(/\r?\n/);
  const firstLineIndex = lines.findIndex((l) => l.trim().length > 0);
  const firstLine = firstLineIndex >= 0 ? lines[firstLineIndex] : "";
  const header = normalizeHeader(firstLine);

  if (!options.includeBody || firstLineIndex < 0) {
    return header;
  }

  const body = lines
    .slice(firstLineIndex + 1)
    .map(cleanBodyLine)
    .filter((l) => l.length > 0)
    .join("\n");

  return body.length > 0 ? `${header}\n\n${body}` : header;
}
