export interface CommitMessageOptions {
  includeBody?: boolean;
  files?: string[];
  skippedFiles?: string[];
  truncated?: boolean;
  truncatedFiles?: string[];
  /** Recent commit headers from the repository, used as style examples. */
  examples?: string[];
  /** Allowed commit types, e.g. from commitlint. Defaults to ALLOWED_TYPES. */
  types?: string[];
  /** Allowed scopes, e.g. from commitlint. Any scope when unset. */
  scopes?: string[];
  /** false when the repository does not use Conventional Commits. */
  conventional?: boolean;
}
