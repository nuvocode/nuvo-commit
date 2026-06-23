const IGNORED_FILES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "composer.lock",
  "Cargo.lock",
  "Gemfile.lock",
  "poetry.lock",
  "bun.lockb",
]);

const IGNORED_DIR_PREFIXES = [
  "dist/",
  "build/",
  ".next/",
  "out/",
  "coverage/",
  "node_modules/",
  ".turbo/",
  ".cache/",
];

const GENERATED_HINTS = [".min.js", ".min.css", ".map", ".generated.", ".gen."];

export function isIgnoredPath(path: string): boolean {
  const base = path.split("/").pop() ?? path;
  if (IGNORED_FILES.has(base)) return true;
  if (
    IGNORED_DIR_PREFIXES.some(
      (p) => path.startsWith(p) || path.includes(`/${p}`),
    )
  ) {
    return true;
  }
  if (GENERATED_HINTS.some((h) => base.includes(h))) return true;
  return false;
}

interface FileHunk {
  path: string;
  body: string;
  binary: boolean;
}

interface KeptHunk extends FileHunk {
  body: string;
}

function parseHunks(diff: string): FileHunk[] {
  if (!diff.trim()) return [];

  const hunks: FileHunk[] = [];
  const parts = diff.split(/^diff --git /m);

  for (const part of parts) {
    if (!part.trim()) continue;
    const body = `diff --git ${part}`;

    const headerMatch = part.match(/^a\/(.+?) b\/(.+?)(?:\n|$)/);
    const path = headerMatch ? headerMatch[2] : "unknown";
    const binary = /^Binary files .* differ$/m.test(part);

    hunks.push({ path, body, binary });
  }

  return hunks;
}

export interface OptimizeResult {
  diff: string;
  truncated: boolean;
  includedFiles: string[];
  skippedFiles: string[];
  truncatedFiles: string[];
}

export function optimizeDiff(diff: string, maxChars: number): OptimizeResult {
  const hunks = parseHunks(diff);
  const includedFiles: string[] = [];
  const skippedFiles: string[] = [];
  const kept: KeptHunk[] = [];

  for (const hunk of hunks) {
    if (hunk.binary || isIgnoredPath(hunk.path)) {
      skippedFiles.push(hunk.path);
      continue;
    }
    includedFiles.push(hunk.path);
    kept.push({ ...hunk, body: hunk.body.trimEnd() });
  }

  const fullDiff = kept.map((hunk) => hunk.body).join("\n");
  if (fullDiff.length <= maxChars) {
    return {
      diff: fullDiff,
      truncated: false,
      includedFiles,
      skippedFiles,
      truncatedFiles: [],
    };
  }

  const truncatedFiles: string[] = [];
  const separatorBudget = Math.max(0, kept.length - 1);
  const available = Math.max(0, maxChars - separatorBudget);
  const baseBudget = kept.length > 0 ? Math.floor(available / kept.length) : 0;
  let remainder = kept.length > 0 ? available % kept.length : 0;

  const balanced = kept.map((hunk) => {
    const budget = baseBudget + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;

    const body = hunk.body;
    if (body.length <= budget) {
      return body;
    }

    truncatedFiles.push(hunk.path);
    return truncateFileDiff(body, budget);
  });

  return {
    diff: balanced.join("\n"),
    truncated: true,
    includedFiles,
    skippedFiles,
    truncatedFiles,
  };
}

function truncateFileDiff(body: string, maxChars: number): string {
  const marker = "\n...[file diff truncated]";
  if (maxChars <= 0) return "";
  if (body.length <= maxChars) return body;

  if (maxChars <= marker.length) {
    return body.slice(0, maxChars);
  }

  return `${body.slice(0, maxChars - marker.length).trimEnd()}${marker}`;
}
