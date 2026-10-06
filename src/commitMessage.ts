export interface CommitMessageOptions {
  includeBody?: boolean;
  files?: string[];
  skippedFiles?: string[];
  truncated?: boolean;
  truncatedFiles?: string[];
  /** Output language, e.g. "Turkish". Empty or "English" adds no instruction. */
  language?: string;
  /** Recent commit headers from the repository, used as style examples. */
  examples?: string[];
  /** Allowed commit types, e.g. from commitlint. Defaults to ALLOWED_TYPES. */
  types?: string[];
  /** Allowed scopes, e.g. from commitlint. Any scope when unset. */
  scopes?: string[];
  /** false when the repository does not use Conventional Commits. */
  conventional?: boolean;
  /** Sampling temperature. Raised when several suggestions are requested. */
  temperature?: number;
  /** Extra instruction that steers one suggestion toward a different angle. */
  hint?: string;
}
