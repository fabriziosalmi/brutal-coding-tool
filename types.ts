export interface AuditScores {
  architecture: number;
  core: number;
  performance: number;
  security: number;
  qa: number;
  total: number;
}

export interface Phase1Metric {
  label: string;
  score: number;
  description: string;
}

export interface Phase1Category {
  title: string;
  items: Phase1Metric[];
}

export interface AuditResult {
  repoName: string;
  verdictShort: string;
  finalVerdictContent: string;
  phase1: Phase1Category[];
  phase2Content: string;
  phase3Plans: string[];
  scores: AuditScores;
  modelUsed: string;
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}
