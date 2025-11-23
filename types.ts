export interface AuditScores {
  architecture: number;
  core: number;
  performance: number;
  security: number;
  qa: number;
  total: number;
}

export interface AuditResult {
  markdownReport: string;
  scores: AuditScores | null;
  repoName: string;
  verdict: string;
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}
