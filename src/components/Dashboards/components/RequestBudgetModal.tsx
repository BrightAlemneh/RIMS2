import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { Proposal } from '../../../types/database';
import { X } from 'lucide-react';

interface RequestBudgetModalProps {
  proposal: Proposal;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RequestBudgetModal({ proposal, onClose, onSuccess }: RequestBudgetModalProps) {
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    requestedAmount: proposal.budget_amount.toString(),
    justification: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: budgetError } = await supabase.from('budget_requests').insert({
        proposal_id: proposal.id,
        requested_amount: parseFloat(formData.requestedAmount),
        justification: formData.justification,
        requested_by: profile?.id,
        status: 'pending',
      });

      if (budgetError) throw budgetError;

      const { error: updateError } = await supabase
        .from('proposals')
        .update({ status: 'budget_requested' })
        .eq('id', proposal.id);

      if (updateError) throw updateError;

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request budget');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Request Budget Approval</h2>
            <p className="text-sm text-gray-600 mt-1">{proposal.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Requested Amount (ETB)
            </label>
            <input
              id="amount"
              type="number"
              step="0.01"
              value={formData.requestedAmount}
              onChange={(e) => setFormData({ ...formData, requestedAmount: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="justification" className="block text-sm font-medium text-gray-700 mb-2">
              Budget Justification
            </label>
            <textarea
              id="justification"
              value={formData.justification}
              onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
              required
              rows={6}
              placeholder="Provide detailed justification for the budget request..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
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
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
