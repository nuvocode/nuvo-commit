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
  if (IGNORED_DIR_PREFIXES.some((p) => path.startsWith(p) || path.includes(`/${p}`))) {
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
}

export function optimizeDiff(diff: string, maxChars: number): OptimizeResult {
  const hunks = parseHunks(diff);
  const includedFiles: string[] = [];
  const skippedFiles: string[] = [];
  const kept: string[] = [];

  for (const hunk of hunks) {
    if (hunk.binary || isIgnoredPath(hunk.path)) {
      skippedFiles.push(hunk.path);
      continue;
    }
    includedFiles.push(hunk.path);
    kept.push(hunk.body.trimEnd());
  }

  let joined = kept.join("\n");
  let truncated = false;

  if (joined.length > maxChars) {
    joined = joined.slice(0, maxChars) + "\n...[diff truncated]";
    truncated = true;
  }

  return { diff: joined, truncated, includedFiles, skippedFiles };
}
