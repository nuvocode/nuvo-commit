export interface CommitMessageOptions {
  includeBody?: boolean;
  files?: string[];
  skippedFiles?: string[];
  truncated?: boolean;
  truncatedFiles?: string[];
  /** Sampling temperature. Raised when several suggestions are requested. */
  temperature?: number;
  /** Extra instruction that steers one suggestion toward a different angle. */
  hint?: string;
}
