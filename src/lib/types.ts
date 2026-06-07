// ─────────────────────────────────────────────
// Agent type definitions for the Trustless Escrow pipeline
// ─────────────────────────────────────────────

export type AgentName = 'planner' | 'github' | 'evidence' | 'milestone' | 'payment' | 'report';

export interface AgentLog {
  timestamp: string;
  agent: AgentName;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  payload?: unknown;
}

// ── 1. Planner Agent ──────────────────────────
export interface PlannedMilestone {
  title:       string;
  description: string;
  weight:      number; // all milestones sum to 100
}

export interface PlannerOutput {
  status:     'success' | 'error';
  milestones: PlannedMilestone[];
  reasoning:  string;
}

// ── 2. GitHub Agent ───────────────────────────
export interface RepoFile {
  path: string;
  size?: number;
}

export interface RepoCommit {
  sha:     string;
  message: string;
  author:  string;
  date:    string;
}

export interface RepoPR {
  id:     number;
  title:  string;
  state:  'open' | 'closed' | 'merged';
  author: string;
  diff?:  string;
}

export interface GithubOutput {
  status:      'success' | 'error';
  files:       RepoFile[];
  commits:     RepoCommit[];
  pullRequests: RepoPR[];
  summary:     string;
  technologies: string[];
}

// ── 3. Evidence Agent ─────────────────────────
export interface MilestoneEvidence {
  milestoneTitle: string;
  status:  'completed' | 'partial' | 'missing' | 'unknown';
  files:   string[];
  commits: string[];
  reasoning: string;
}

export interface EvidenceOutput {
  status:    'success' | 'error';
  evidence:  Record<string, MilestoneEvidence>;
  confidence: number; // 0-100
  reasoning: string;
}

// ── 4. Milestone Agent ────────────────────────
export interface MilestoneScore {
  title:      string;
  completion: number; // 0-100
  status:     'Not Started' | 'Partial' | 'Mostly Complete' | 'Completed';
  reasoning:  string;
}

export interface MilestoneOutput {
  status:           'success' | 'error';
  milestoneScores:  MilestoneScore[];
  reasoning:        string;
}

// ── 5. Payment Agent ──────────────────────────
export interface PaymentOutput {
  status:               'success' | 'error';
  completionPercentage: number;
  escrowAmount:         number;
  recommendedRelease:   number;
  confidence:           number;
  reasoning:            string;
}

// ── 6. Report Agent ───────────────────────────
export interface ReportOutput {
  status:            'success' | 'error';
  markdownReport:    string;
  summary:           string;
  clientTranslation?: string;
}

// ── Orchestrator state ────────────────────────
export interface PipelineState {
  projectId:       string;
  status:          'idle' | 'running' | 'completed' | 'failed';
  currentAgent?:   AgentName;
  logs:            AgentLog[];
  plannerResult?:  PlannerOutput;
  githubResult?:   GithubOutput;
  evidenceResult?: EvidenceOutput;
  milestoneResult?: MilestoneOutput;
  paymentResult?:  PaymentOutput;
  reportResult?:   ReportOutput;
  startedAt?:      string;
  completedAt?:    string;
}

// ── DB entity types ───────────────────────────
export interface Project {
  id:            string;
  title:         string;
  description:   string;
  client_id:     string;
  escrow_amount: number;
  escrow_status: 'Created' | 'Funded' | 'Released' | 'Refunded';
  github_url:    string;
  created_at:    string;
  updated_at:    string;
}

export interface Milestone {
  id:          string;
  project_id:  string;
  title:       string;
  description: string;
  weight:      number;
  completion:  number;
  status:      'Not Started' | 'Partial' | 'Mostly Complete' | 'Completed';
  created_at:  string;
  updated_at:  string;
}

export interface Repository {
  id:          string;
  project_id:  string;
  github_url:  string;
  owner:       string;
  repo:        string;
  branch:      string;
  created_at:  string;
  updated_at:  string;
}

export interface Review {
  id:                 string;
  project_id:         string;
  score:              number;
  confidence:         number;
  summary:            string;
  evidence:           string; // JSON
  client_translation?: string;
  created_at:         string;
  updated_at:         string;
}

export interface Payout {
  id:                 string;
  project_id:         string;
  amount:             number;
  release_percentage: number;
  status:             'Pending' | 'Approved' | 'Released' | 'Refunded';
  tx_hash?:           string;
  created_at:         string;
  updated_at:         string;
}

export interface BlockchainTx {
  hash:        string;
  blockNumber: number;
  from:        string;
  to:          string;
  value:       string;
  method:      string;
  status:      'success' | 'pending' | 'reverted';
  timestamp:   string;
  gasUsed:     number;
}
