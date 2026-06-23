import { PullRequestContent } from "../pullRequest";

const DEFAULT_TITLE = "Update branch changes";
const TITLE_MAX_LEN = 80;

function truncateTitle(title: string): string {
  if (title.length <= TITLE_MAX_LEN) return title;

  const lastSpace = title.lastIndexOf(" ", TITLE_MAX_LEN);
  const cut = lastSpace > TITLE_MAX_LEN * 0.7 ? lastSpace : TITLE_MAX_LEN;
  return title.slice(0, cut).replace(/[\s\-_,;:.]+$/g, "");
}

function cleanTitle(raw: string): string {
  const title = raw
    .replace(/^[-*]\s+/, "")
    .replace(/^#+\s+/, "")
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\*\*/g, "")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.!?\s]+$/g, "");

  return truncateTitle(title.length > 0 ? title : DEFAULT_TITLE);
}

function normalizeBody(raw: string): string {
  const body = raw.replace(/\r\n/g, "\n").trim();
  return body.length > 0
    ? body
    : "## Summary\n\nNot provided.\n\n## Testing\n\nNot run.";
}

function extractJson(raw: string): string | undefined {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return raw.slice(start, end + 1);
  }

  return undefined;
}

function fallbackFromText(raw: string): PullRequestContent {
  const lines = raw
    .replace(/```/g, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const [first = DEFAULT_TITLE, ...rest] = lines;

  return {
    title: cleanTitle(first),
    body: normalizeBody(rest.join("\n")),
  };
}

export function sanitizePullRequestContent(raw: string): PullRequestContent {
  const text = raw ?? "";
  const json = extractJson(text);

  if (json) {
    try {
      const parsed = JSON.parse(json) as Partial<PullRequestContent>;
      if (typeof parsed.title === "string" && typeof parsed.body === "string") {
        return {
          title: cleanTitle(parsed.title),
          body: normalizeBody(parsed.body),
        };
      }
    } catch {
      // Fall back to text parsing below.
    }
  }

  return fallbackFromText(text);
}
