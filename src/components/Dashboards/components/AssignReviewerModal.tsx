import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { Proposal, UserProfile } from '../../../types/database';
import { X } from 'lucide-react';

interface AssignReviewerModalProps {
  proposal: Proposal;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssignReviewerModal({ proposal, onClose, onSuccess }: AssignReviewerModalProps) {
  const { profile } = useAuth();
  const [reviewers, setReviewers] = useState<UserProfile[]>([]);
  const [assignedReviewers, setAssignedReviewers] = useState<string[]>([]);
  const [selectedReviewer, setSelectedReviewer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReviewers();
    loadAssignedReviewers();
  }, []);

  async function loadReviewers() {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('role', 'reviewer');

      if (error) throw error;
      setReviewers(data || []);
    } catch (err) {
      console.error('Error loading reviewers:', err);
    }
  }

  async function loadAssignedReviewers() {
    try {
      const { data, error } = await supabase
        .from('proposal_reviewers')
        .select('reviewer_id')
        .eq('proposal_id', proposal.id);

      if (error) throw error;
      setAssignedReviewers(data?.map(r => r.reviewer_id) || []);
    } catch (err) {
      console.error('Error loading assigned reviewers:', err);
    }
  }

  async function handleAssign() {
    if (!selectedReviewer) return;

    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.from('proposal_reviewers').insert({
        proposal_id: proposal.id,
        reviewer_id: selectedReviewer,
        assigned_by: profile?.id,
      });

      if (error) throw error;

      const { error: updateError } = await supabase
        .from('proposals')
        .update({ status: 'under_review' })
        .eq('id', proposal.id);

      if (updateError) throw updateError;

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign reviewer');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(reviewerId: string) {
    try {
      const { error } = await supabase
        .from('proposal_reviewers')
        .delete()
        .eq('proposal_id', proposal.id)
        .eq('reviewer_id', reviewerId);

      if (error) throw error;
      await loadAssignedReviewers();
    } catch (err) {
      console.error('Error removing reviewer:', err);
    }
  }

  const availableReviewers = reviewers.filter(r => !assignedReviewers.includes(r.id));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Assign Reviewer</h2>
            <p className="text-sm text-gray-600 mt-1">{proposal.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <h3 className="font-medium text-gray-900 mb-3">Currently Assigned Reviewers</h3>
            {assignedReviewers.length === 0 ? (
              <p className="text-sm text-gray-600">No reviewers assigned yet</p>
            ) : (
              <div className="space-y-2">
                {assignedReviewers.map(reviewerId => {
                  const reviewer = reviewers.find(r => r.id === reviewerId);
                  return reviewer ? (
                    <div key={reviewer.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{reviewer.full_name}</p>
                        <p className="text-sm text-gray-600">{reviewer.email}</p>
                      </div>
                      <button
                        onClick={() => handleRemove(reviewer.id)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ) : null;
                })}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-3">Assign New Reviewer</h3>
            <div className="flex gap-3">
              <select
                value={selectedReviewer}
                onChange={(e) => setSelectedReviewer(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a reviewer...</option>
                {availableReviewers.map(reviewer => (
                  <option key={reviewer.id} value={reviewer.id}>
                    {reviewer.full_name} - {reviewer.department || 'No department'}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAssign}
                disabled={loading || !selectedReviewer}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
