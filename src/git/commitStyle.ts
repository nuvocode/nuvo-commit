import { promises as fs } from "fs";
import * as path from "path";
import { CommitMessageOptions } from "../commitMessage";
import { getRecentCommitHeaders } from "./diff";

const COMMITLINT_FILES = [
  ".commitlintrc",
  ".commitlintrc.json",
  ".commitlintrc.yaml",
  ".commitlintrc.yml",
  ".commitlintrc.js",
  ".commitlintrc.cjs",
  ".commitlintrc.mjs",
  ".commitlintrc.ts",
  "commitlint.config.js",
  "commitlint.config.cjs",
  "commitlint.config.mjs",
  "commitlint.config.ts",
];

const CONVENTIONAL_HEADER = /^[a-z]+(\([^)]*\))?!?: \S/i;

export type CommitStyle = Pick<
  CommitMessageOptions,
  "examples" | "types" | "scopes" | "conventional"
>;

export interface CommitlintRules {
  types?: string[];
  scopes?: string[];
}

/** Reads the repository's commit style: recent headers and commitlint rules. */
export async function readCommitStyle(cwd: string): Promise<CommitStyle> {
  const [examples, rules] = await Promise.all([
    getRecentCommitHeaders(cwd, 15),
    readCommitlintRules(cwd),
  ]);
  return {
    examples,
    ...rules,
    conventional: rules !== undefined || isConventional(examples),
  };
}

/** True when at least half of the headers follow Conventional Commits. */
export function isConventional(headers: string[]): boolean {
  if (headers.length === 0) return true;
  const matches = headers.filter((h) => CONVENTIONAL_HEADER.test(h)).length;
  return matches * 2 >= headers.length;
}

async function readCommitlintRules(
  cwd: string,
): Promise<CommitlintRules | undefined> {
  for (const file of COMMITLINT_FILES) {
    const text = await fs
      .readFile(path.join(cwd, file), "utf8")
      .catch(() => undefined);
    if (text !== undefined) return parseCommitlintRules(text);
  }

  const pkg = await fs
    .readFile(path.join(cwd, "package.json"), "utf8")
    .catch(() => undefined);
  try {
    const config = pkg && JSON.parse(pkg).commitlint;
    return config ? parseCommitlintRules(JSON.stringify(config)) : undefined;
  } catch {
    return undefined;
  }
}

export function parseCommitlintRules(text: string): CommitlintRules {
  return {
    types: ruleValues(text, "type-enum"),
    scopes: ruleValues(text, "scope-enum"),
  };
}

// ponytail: regex over the config text instead of executing JS/TS configs.
// Covers JSON, JS/TS and inline YAML; YAML block lists are not read.
function ruleValues(text: string, rule: string): string[] | undefined {
  const match = new RegExp(
    `${rule}["']?\\s*:\\s*\\[[^\\[\\]]*\\[([^\\]]*)\\]`,
  ).exec(text);
  const values = match?.[1].match(/[^\s"',]+/g);
  return values && values.length > 0 ? values : undefined;
}
