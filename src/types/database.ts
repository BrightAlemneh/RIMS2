export type UserRole = 'researcher' | 'reviewer' | 'coordinator' | 'director' | 'vice_president';

export type ProposalStatus = 'submitted' | 'under_review' | 'approved' | 'rejected' | 'budget_requested' | 'budget_approved';

export type CallStatus = 'open' | 'closed';

export type ReviewRecommendation = 'approve' | 'reject' | 'revise';

export type BudgetStatus = 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  id: string;
  full_name: string;
  role: UserRole;
  department: string | null;
  email: string;
  created_at: string;
}

export interface CallForPapers {
  id: string;
  title: string;
  description: string;
  deadline: string;
  created_by: string;
  status: CallStatus;
  created_at: string;
}

export interface Proposal {
  id: string;
  call_id: string;
  researcher_id: string;
  title: string;
  abstract: string;
  methodology: string;
  budget_amount: number;
  status: ProposalStatus;
  submitted_at: string;
  updated_at: string;
}

export interface ProposalReviewer {
  id: string;
  proposal_id: string;
  reviewer_id: string;
  assigned_by: string;
  assigned_at: string;
}

export interface Review {
  id: string;
  proposal_id: string;
  reviewer_id: string;
  score: number;
  recommendation: ReviewRecommendation;
  comments: string;
  submitted_at: string;
}

export interface BudgetRequest {
  id: string;
  proposal_id: string;
  requested_amount: number;
  justification: string;
  status: BudgetStatus;
  requested_by: string;
  approved_by: string | null;
  requested_at: string;
  reviewed_at: string | null;
}
