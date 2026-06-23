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

export interface PullRequestDiff {
  diff: string;
  files: string[];
  baseBranch: string;
  currentBranch: string;
  commits: string[];
}

export class GitError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
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

async function tryGit(
  args: string[],
  cwd: string,
): Promise<string | undefined> {
  try {
    return await git(args, cwd);
  } catch {
    return undefined;
  }
}

function splitLines(output: string): string[] {
  return output
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export async function getStagedDiff(cwd: string): Promise<StagedDiff> {
  const filesOut = await git(
    ["diff", "--cached", "--name-only", "--diff-filter=ACMRTUXB"],
    cwd,
  );
  const files = splitLines(filesOut);

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
  const files = splitLines(filesOut);

  if (files.length === 0) {
    return { diff: "", files: [] };
  }

  const diff = await git(["diff", "--no-ext-diff", "--unified=3"], cwd);

  return { diff, files };
}

export async function getCurrentBranch(cwd: string): Promise<string> {
  const branch = (await git(["rev-parse", "--abbrev-ref", "HEAD"], cwd)).trim();
  if (branch === "HEAD" || branch.length === 0) {
    throw new GitError("Cannot create pull request content from detached HEAD");
  }
  return branch;
}

async function hasCommitRef(cwd: string, ref: string): Promise<boolean> {
  const result = await tryGit(
    ["rev-parse", "--verify", `${ref}^{commit}`],
    cwd,
  );
  return result !== undefined;
}

export async function resolvePullRequestBaseBranch(
  cwd: string,
  configuredBaseBranch?: string,
): Promise<string> {
  const configured = configuredBaseBranch?.trim();
  if (configured) {
    if (await hasCommitRef(cwd, configured)) {
      return configured;
    }
    throw new GitError(`Configured pull request base not found: ${configured}`);
  }

  const originHead = (
    await tryGit(["symbolic-ref", "--short", "refs/remotes/origin/HEAD"], cwd)
  )?.trim();

  const candidates = [originHead, "main", "master"].filter(
    (candidate): candidate is string => Boolean(candidate),
  );
  const seen = new Set<string>();

  for (const candidate of candidates) {
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    if (await hasCommitRef(cwd, candidate)) {
      return candidate;
    }
  }

  throw new GitError("Could not resolve a pull request base branch");
}

export async function getPullRequestDiff(
  cwd: string,
  configuredBaseBranch?: string,
  includeCommitList = true,
): Promise<PullRequestDiff> {
  const currentBranch = await getCurrentBranch(cwd);
  const baseBranch = await resolvePullRequestBaseBranch(
    cwd,
    configuredBaseBranch,
  );
  const range = `${baseBranch}...HEAD`;
  const commitRange = `${baseBranch}..HEAD`;
  const filesOut = await git(
    ["diff", "--name-only", "--diff-filter=ACMRTUXB", range],
    cwd,
  );
  const files = splitLines(filesOut);

  if (files.length === 0) {
    return { diff: "", files, baseBranch, currentBranch, commits: [] };
  }

  const diff = await git(["diff", "--no-ext-diff", "--unified=3", range], cwd);
  const commits = includeCommitList
    ? splitLines(await git(["log", "--pretty=format:%s", commitRange], cwd))
    : [];

  return { diff, files, baseBranch, currentBranch, commits };
}
