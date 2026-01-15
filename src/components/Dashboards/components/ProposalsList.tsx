import { Proposal } from '../../../types/database';
import { FileText } from 'lucide-react';

interface ProposalsListProps {
  proposals: Proposal[];
  onAssignReviewer?: (proposal: Proposal) => void;
  onRequestBudget?: (proposal: Proposal) => void;
  onStatusChange?: (proposalId: string, newStatus: string) => void;
  isDirector?: boolean;
}

export default function ProposalsList({
  proposals,
  onAssignReviewer,
  onRequestBudget,
  onStatusChange,
  isDirector = false,
}: ProposalsListProps) {
  const getStatusColor = (status: string) => {
    const colors = {
      submitted: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      budget_requested: 'bg-purple-100 text-purple-800',
      budget_approved: 'bg-emerald-100 text-emerald-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold text-gray-900">All Proposals</h2>
      </div>

      <div className="p-6">
        {proposals.length === 0 ? (
          <p className="text-gray-600">No proposals submitted yet.</p>
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal) => (
              <div key={proposal.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{proposal.title}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{proposal.abstract}</p>
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                    {proposal.status.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 mt-3 pt-3 border-t">
                  <div className="flex gap-4">
                    <span>Budget: ETB {proposal.budget_amount.toLocaleString()}</span>
                    <span>Submitted: {new Date(proposal.submitted_at).toLocaleDateString()}</span>
                  </div>

                  {isDirector && (
                    <div className="flex gap-2">
                      {(proposal.status === 'submitted' || proposal.status === 'under_review') && onAssignReviewer && (
                        <button
                          onClick={() => onAssignReviewer(proposal)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                        >
                          Assign Reviewer
                        </button>
                      )}

                      {proposal.status === 'approved' && onRequestBudget && (
                        <button
                          onClick={() => onRequestBudget(proposal)}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                        >
                          Request Budget
                        </button>
                      )}

                      {proposal.status === 'under_review' && onStatusChange && (
                        <>
                          <button
                            onClick={() => onStatusChange(proposal.id, 'approved')}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => onStatusChange(proposal.id, 'rejected')}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
