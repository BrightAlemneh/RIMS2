import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { Proposal, ReviewRecommendation } from '../../../types/database';
import { X } from 'lucide-react';

interface ReviewProposalModalProps {
  proposal: Proposal;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewProposalModal({ proposal, onClose, onSuccess }: ReviewProposalModalProps) {
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    score: '',
    recommendation: 'approve' as ReviewRecommendation,
    comments: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const score = parseInt(formData.score);
    if (score < 0 || score > 100) {
      setError('Score must be between 0 and 100');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('reviews').insert({
        proposal_id: proposal.id,
        reviewer_id: profile?.id,
        score: score,
        recommendation: formData.recommendation,
        comments: formData.comments,
      });

      if (error) throw error;
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Review Proposal</h2>
            <p className="text-sm text-gray-600 mt-1">{proposal.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 bg-gray-50 border-b">
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Abstract</h3>
              <p className="text-sm text-gray-900 mt-1">{proposal.abstract}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700">Methodology</h3>
              <p className="text-sm text-gray-900 mt-1">{proposal.methodology}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700">Budget</h3>
              <p className="text-sm text-gray-900 mt-1">ETB {proposal.budget_amount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="score" className="block text-sm font-medium text-gray-700 mb-2">
              Score (0-100)
            </label>
            <input
              id="score"
              type="number"
              min="0"
              max="100"
              value={formData.score}
              onChange={(e) => setFormData({ ...formData, score: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter score out of 100"
            />
            <p className="text-xs text-gray-500 mt-1">Enter a score between 0 and 100</p>
          </div>

          <div>
            <label htmlFor="recommendation" className="block text-sm font-medium text-gray-700 mb-2">
              Recommendation
            </label>
            <select
              id="recommendation"
              value={formData.recommendation}
              onChange={(e) => setFormData({ ...formData, recommendation: e.target.value as ReviewRecommendation })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="approve">Approve</option>
              <option value="revise">Needs Revision</option>
              <option value="reject">Reject</option>
            </select>
          </div>

          <div>
            <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-2">
              Review Comments
            </label>
            <textarea
              id="comments"
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              required
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Provide detailed feedback on the proposal..."
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
