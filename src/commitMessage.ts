export interface CommitMessageOptions {
  includeBody?: boolean;
  files?: string[];
  skippedFiles?: string[];
  truncated?: boolean;
  truncatedFiles?: string[];
  /** Output language, e.g. "Turkish". Empty or "English" adds no instruction. */
  language?: string;
}
