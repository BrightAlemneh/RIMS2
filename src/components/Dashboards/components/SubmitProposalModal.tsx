import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { CallForPapers } from '../../../types/database';
import { X } from 'lucide-react';

interface SubmitProposalModalProps {
  call: CallForPapers;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SubmitProposalModal({ call, onClose, onSuccess }: SubmitProposalModalProps) {
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    abstract: '',
    methodology: '',
    budgetAmount: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.from('proposals').insert({
        call_id: call.id,
        researcher_id: profile?.id,
        title: formData.title,
        abstract: formData.abstract,
        methodology: formData.methodology,
        budget_amount: parseFloat(formData.budgetAmount),
        status: 'submitted',
      });

      if (error) throw error;
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit proposal');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Submit Proposal</h2>
            <p className="text-sm text-gray-600 mt-1">{call.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Proposal Title
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter a descriptive title for your research"
            />
          </div>

          <div>
            <label htmlFor="abstract" className="block text-sm font-medium text-gray-700 mb-2">
              Abstract
            </label>
            <textarea
              id="abstract"
              value={formData.abstract}
              onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
              required
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Provide a brief summary of your research..."
            />
          </div>

          <div>
            <label htmlFor="methodology" className="block text-sm font-medium text-gray-700 mb-2">
              Methodology
            </label>
            <textarea
              id="methodology"
              value={formData.methodology}
              onChange={(e) => setFormData({ ...formData, methodology: e.target.value })}
              required
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe your research methodology and approach..."
            />
          </div>

          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
              Budget Amount (ETB)
            </label>
            <input
              id="budget"
              type="number"
              step="0.01"
              value={formData.budgetAmount}
              onChange={(e) => setFormData({ ...formData, budgetAmount: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
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
              {loading ? 'Submitting...' : 'Submit Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
