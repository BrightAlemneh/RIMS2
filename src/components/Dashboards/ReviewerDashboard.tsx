import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Proposal, Review } from '../../types/database';
import { FileText, LogOut, CheckCircle } from 'lucide-react';
import ReviewProposalModal from './components/ReviewProposalModal';

export default function ReviewerDashboard() {
  const { profile, signOut } = useAuth();
  const [assignedProposals, setAssignedProposals] = useState<Proposal[]>([]);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [profile?.id]);

  async function loadData() {
    if (!profile?.id) return;

    setLoading(true);
    try {
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('proposal_reviewers')
        .select('proposal_id')
        .eq('reviewer_id', profile.id);

      if (assignmentsError) throw assignmentsError;

      const proposalIds = assignmentsData?.map(a => a.proposal_id) || [];

      if (proposalIds.length > 0) {
        const { data: proposalsData, error: proposalsError } = await supabase
          .from('proposals')
          .select('*')
          .in('id', proposalIds);

        if (proposalsError) throw proposalsError;
        setAssignedProposals(proposalsData || []);
      }

      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('reviewer_id', profile.id);

      if (reviewsError) throw reviewsError;
      setMyReviews(reviewsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleReviewProposal(proposal: Proposal) {
    setSelectedProposal(proposal);
    setShowReviewModal(true);
  }

  function hasReviewed(proposalId: string): boolean {
    return myReviews.some(r => r.proposal_id === proposalId);
  }

  function getReview(proposalId: string): Review | undefined {
    return myReviews.find(r => r.proposal_id === proposalId);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Reviewer Dashboard</h1>
              <p className="text-sm text-gray-600">{profile?.full_name}</p>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Assigned Proposals</p>
                <p className="text-2xl font-bold text-gray-900">{assignedProposals.length}</p>
              </div>
              <FileText className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Reviews</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assignedProposals.length - myReviews.length}
                </p>
              </div>
              <FileText className="w-10 h-10 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{myReviews.length}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Assigned Proposals</h2>
          </div>

          <div className="p-6">
            {loading ? (
              <p className="text-gray-600">Loading...</p>
            ) : assignedProposals.length === 0 ? (
              <p className="text-gray-600">No proposals assigned to you yet.</p>
            ) : (
              <div className="space-y-4">
                {assignedProposals.map((proposal) => {
                  const reviewed = hasReviewed(proposal.id);
                  const review = getReview(proposal.id);

                  return (
                    <div key={proposal.id} className="border rounded-lg p-5 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <FileText className="w-5 h-5 text-gray-400 mt-1" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-gray-900">{proposal.title}</h3>
                                {reviewed && (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Reviewed
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-3">{proposal.abstract}</p>

                              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Methodology</h4>
                                <p className="text-sm text-gray-700">{proposal.methodology}</p>
                              </div>

                              {reviewed && review && (
                                <div className="bg-blue-50 rounded-lg p-3">
                                  <h4 className="text-sm font-medium text-gray-900 mb-2">Your Review</h4>
                                  <div className="flex gap-4 text-sm">
                                    <span className="text-gray-700">
                                      Score: <span className="font-semibold">{review.score}/100</span>
                                    </span>
                                    <span className="text-gray-700">
                                      Recommendation: <span className="font-semibold capitalize">{review.recommendation}</span>
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700 mt-2">{review.comments}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t">
                        <div className="flex gap-4">
                          <span>Budget: ETB {proposal.budget_amount.toLocaleString()}</span>
                          <span>Submitted: {new Date(proposal.submitted_at).toLocaleDateString()}</span>
                        </div>

                        {!reviewed && (
                          <button
                            onClick={() => handleReviewProposal(proposal)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                          >
                            Submit Review
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {showReviewModal && selectedProposal && (
        <ReviewProposalModal
          proposal={selectedProposal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedProposal(null);
          }}
          onSuccess={() => {
            setShowReviewModal(false);
            setSelectedProposal(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
