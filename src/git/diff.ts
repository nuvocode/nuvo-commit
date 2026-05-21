import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export interface StagedDiff {
  diff: string;
  files: string[];
}

export interface WorkingDiff {
  diff: string;
  files: string[];
}

export class GitError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "GitError";
  }
}

async function git(args: string[], cwd: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync("git", args, {
      cwd,
      maxBuffer: 50 * 1024 * 1024,
    });
    return stdout;
  } catch (err) {
    throw new GitError(`git ${args.join(" ")} failed`, err);
  }
}

export async function getStagedDiff(cwd: string): Promise<StagedDiff> {
  const filesOut = await git(
    ["diff", "--cached", "--name-only", "--diff-filter=ACMRTUXB"],
    cwd,
  );
  const files = filesOut
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (files.length === 0) {
    return { diff: "", files: [] };
  }

  const diff = await git(
    ["diff", "--cached", "--no-ext-diff", "--unified=3"],
    cwd,
  );

  return { diff, files };
}

export async function getWorkingDiff(cwd: string): Promise<WorkingDiff> {
  const filesOut = await git(
    ["diff", "--name-only", "--diff-filter=ACMRTUXB"],
    cwd,
  );
  const files = filesOut
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (files.length === 0) {
    return { diff: "", files: [] };
  }

  const diff = await git(["diff", "--no-ext-diff", "--unified=3"], cwd);

  return { diff, files };
}
