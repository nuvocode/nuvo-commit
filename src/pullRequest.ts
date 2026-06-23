export interface PullRequestContent {
  title: string;
  body: string;
}

export interface PullRequestContentOptions {
  baseBranch?: string;
  currentBranch?: string;
  commits?: string[];
  includeCommitList?: boolean;
}
