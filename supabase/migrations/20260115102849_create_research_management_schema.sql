/*
  # Research Management System Schema

  ## Overview
  Complete database schema for Debark University Research Management System

  ## New Tables
  
  ### 1. user_profiles
    - `id` (uuid, FK to auth.users) - User identifier
    - `full_name` (text) - User's full name
    - `role` (text) - User role: 'researcher', 'reviewer', 'coordinator', 'director', 'vice_president'
    - `department` (text) - User's department
    - `email` (text) - User's email
    - `created_at` (timestamptz) - Account creation timestamp

  ### 2. calls_for_papers
    - `id` (uuid, PK) - Call identifier
    - `title` (text) - Call title
    - `description` (text) - Call description
    - `deadline` (timestamptz) - Submission deadline
    - `created_by` (uuid, FK) - Director who created the call
    - `status` (text) - 'open', 'closed'
    - `created_at` (timestamptz) - Creation timestamp

  ### 3. proposals
    - `id` (uuid, PK) - Proposal identifier
    - `call_id` (uuid, FK) - Associated call for papers
    - `researcher_id` (uuid, FK) - Researcher who submitted
    - `title` (text) - Proposal title
    - `abstract` (text) - Proposal abstract
    - `methodology` (text) - Research methodology
    - `budget_amount` (numeric) - Requested budget
    - `status` (text) - 'submitted', 'under_review', 'approved', 'rejected', 'budget_requested', 'budget_approved'
    - `submitted_at` (timestamptz) - Submission timestamp
    - `updated_at` (timestamptz) - Last update timestamp

  ### 4. proposal_reviewers
    - `id` (uuid, PK) - Assignment identifier
    - `proposal_id` (uuid, FK) - Proposal being reviewed
    - `reviewer_id` (uuid, FK) - Assigned reviewer
    - `assigned_by` (uuid, FK) - Who assigned the reviewer
    - `assigned_at` (timestamptz) - Assignment timestamp

  ### 5. reviews
    - `id` (uuid, PK) - Review identifier
    - `proposal_id` (uuid, FK) - Proposal being reviewed
    - `reviewer_id` (uuid, FK) - Reviewer
    - `score` (integer) - Score out of 100
    - `recommendation` (text) - 'approve', 'reject', 'revise'
    - `comments` (text) - Review comments
    - `submitted_at` (timestamptz) - Review submission timestamp

  ### 6. budget_requests
    - `id` (uuid, PK) - Budget request identifier
    - `proposal_id` (uuid, FK) - Associated proposal
    - `requested_amount` (numeric) - Amount requested
    - `justification` (text) - Budget justification
    - `status` (text) - 'pending', 'approved', 'rejected'
    - `requested_by` (uuid, FK) - Director who requested
    - `approved_by` (uuid, FK) - VP who approved/rejected
    - `requested_at` (timestamptz) - Request timestamp
    - `reviewed_at` (timestamptz) - Review timestamp

  ## Security
  - Enable RLS on all tables
  - Role-based access policies for each user type
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('researcher', 'reviewer', 'coordinator', 'director', 'vice_president')),
  department text,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create calls_for_papers table
CREATE TABLE IF NOT EXISTS calls_for_papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  deadline timestamptz NOT NULL,
  created_by uuid REFERENCES user_profiles(id) NOT NULL,
  status text DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at timestamptz DEFAULT now()
);

-- Create proposals table
CREATE TABLE IF NOT EXISTS proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid REFERENCES calls_for_papers(id) NOT NULL,
  researcher_id uuid REFERENCES user_profiles(id) NOT NULL,
  title text NOT NULL,
  abstract text NOT NULL,
  methodology text NOT NULL,
  budget_amount numeric NOT NULL,
  status text DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'budget_requested', 'budget_approved')),
  submitted_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create proposal_reviewers table
CREATE TABLE IF NOT EXISTS proposal_reviewers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES proposals(id) ON DELETE CASCADE NOT NULL,
  reviewer_id uuid REFERENCES user_profiles(id) NOT NULL,
  assigned_by uuid REFERENCES user_profiles(id) NOT NULL,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(proposal_id, reviewer_id)
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES proposals(id) ON DELETE CASCADE NOT NULL,
  reviewer_id uuid REFERENCES user_profiles(id) NOT NULL,
  score integer CHECK (score >= 0 AND score <= 100),
  recommendation text CHECK (recommendation IN ('approve', 'reject', 'revise')),
  comments text NOT NULL,
  submitted_at timestamptz DEFAULT now(),
  UNIQUE(proposal_id, reviewer_id)
);

-- Create budget_requests table
CREATE TABLE IF NOT EXISTS budget_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES proposals(id) NOT NULL,
  requested_amount numeric NOT NULL,
  justification text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_by uuid REFERENCES user_profiles(id) NOT NULL,
  approved_by uuid REFERENCES user_profiles(id),
  requested_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  UNIQUE(proposal_id)
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls_for_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_reviewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_requests ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Users can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policies for calls_for_papers
CREATE POLICY "Anyone can view open calls"
  ON calls_for_papers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Directors can create calls"
  ON calls_for_papers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'director'
    )
  );

CREATE POLICY "Directors can update calls"
  ON calls_for_papers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'director'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'director'
    )
  );

-- Policies for proposals
CREATE POLICY "Researchers can view own proposals"
  ON proposals FOR SELECT
  TO authenticated
  USING (
    researcher_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('director', 'coordinator')
    )
    OR EXISTS (
      SELECT 1 FROM proposal_reviewers
      WHERE proposal_reviewers.proposal_id = proposals.id
      AND proposal_reviewers.reviewer_id = auth.uid()
    )
  );

CREATE POLICY "Researchers can create proposals"
  ON proposals FOR INSERT
  TO authenticated
  WITH CHECK (
    researcher_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'researcher'
    )
  );

CREATE POLICY "Directors can update proposal status"
  ON proposals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'director'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'director'
    )
  );

-- Policies for proposal_reviewers
CREATE POLICY "Staff can view reviewer assignments"
  ON proposal_reviewers FOR SELECT
  TO authenticated
  USING (
    reviewer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('director', 'coordinator')
    )
  );

CREATE POLICY "Directors and coordinators can assign reviewers"
  ON proposal_reviewers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('director', 'coordinator')
    )
  );

CREATE POLICY "Directors and coordinators can remove reviewer assignments"
  ON proposal_reviewers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('director', 'coordinator')
    )
  );

-- Policies for reviews
CREATE POLICY "Reviewers can view own reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (
    reviewer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('director', 'coordinator')
    )
  );

CREATE POLICY "Assigned reviewers can create reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    reviewer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM proposal_reviewers
      WHERE proposal_reviewers.proposal_id = reviews.proposal_id
      AND proposal_reviewers.reviewer_id = auth.uid()
    )
  );

CREATE POLICY "Reviewers can update own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (reviewer_id = auth.uid())
  WITH CHECK (reviewer_id = auth.uid());

-- Policies for budget_requests
CREATE POLICY "Directors and VP can view budget requests"
  ON budget_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('director', 'vice_president')
    )
    OR EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = budget_requests.proposal_id
      AND proposals.researcher_id = auth.uid()
    )
  );

CREATE POLICY "Directors can create budget requests"
  ON budget_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'director'
    )
  );

CREATE POLICY "Vice presidents can update budget requests"
  ON budget_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'vice_president'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'vice_president'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_proposals_researcher ON proposals(researcher_id);
CREATE INDEX IF NOT EXISTS idx_proposals_call ON proposals(call_id);
CREATE INDEX IF NOT EXISTS idx_proposal_reviewers_proposal ON proposal_reviewers(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_reviewers_reviewer ON proposal_reviewers(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_proposal ON reviews(proposal_id);
CREATE INDEX IF NOT EXISTS idx_budget_requests_proposal ON budget_requests(proposal_id);
