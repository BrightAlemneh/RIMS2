import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { BudgetRequest, Proposal } from '../../types/database';
import { DollarSign, LogOut, CheckCircle, XCircle } from 'lucide-react';

interface BudgetRequestWithProposal extends BudgetRequest {
  proposal?: Proposal;
}

export default function VicePresidentDashboard() {
  const { profile, signOut } = useAuth();
  const [budgetRequests, setBudgetRequests] = useState<BudgetRequestWithProposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data: requestsData, error: requestsError } = await supabase
        .from('budget_requests')
        .select('*')
        .order('requested_at', { ascending: false });

      if (requestsError) throw requestsError;

      if (requestsData && requestsData.length > 0) {
        const proposalIds = requestsData.map(r => r.proposal_id);
        const { data: proposalsData, error: proposalsError } = await supabase
          .from('proposals')
          .select('*')
          .in('id', proposalIds);

        if (proposalsError) throw proposalsError;

        const requestsWithProposals = requestsData.map(request => ({
          ...request,
          proposal: proposalsData?.find(p => p.id === request.proposal_id),
        }));

        setBudgetRequests(requestsWithProposals);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(requestId: string, proposalId: string) {
    try {
      const { error: budgetError } = await supabase
        .from('budget_requests')
        .update({
          status: 'approved',
          approved_by: profile?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (budgetError) throw budgetError;

      const { error: proposalError } = await supabase
        .from('proposals')
        .update({ status: 'budget_approved' })
        .eq('id', proposalId);

      if (proposalError) throw proposalError;

      await loadData();
    } catch (error) {
      console.error('Error approving budget:', error);
    }
  }

  async function handleReject(requestId: string) {
    try {
      const { error } = await supabase
        .from('budget_requests')
        .update({
          status: 'rejected',
          approved_by: profile?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error rejecting budget:', error);
    }
  }

  const pendingRequests = budgetRequests.filter(r => r.status === 'pending');
  const reviewedRequests = budgetRequests.filter(r => r.status !== 'pending');

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Vice President Dashboard</h1>
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
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{budgetRequests.length}</p>
              </div>
              <DollarSign className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{pendingRequests.length}</p>
              </div>
              <DollarSign className="w-10 h-10 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {budgetRequests.filter(r => r.status === 'approved').length}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Pending Budget Requests</h2>
          </div>

          <div className="p-6">
            {loading ? (
              <p className="text-gray-600">Loading...</p>
            ) : pendingRequests.length === 0 ? (
              <p className="text-gray-600">No pending budget requests.</p>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">{request.proposal?.title}</h3>
                        <div className="bg-blue-50 rounded-lg p-4 mb-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Requested Amount:</span>
                              <span className="font-semibold text-gray-900 ml-2">
                                ETB {request.requested_amount.toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Original Budget:</span>
                              <span className="font-semibold text-gray-900 ml-2">
                                ETB {request.proposal?.budget_amount.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Justification</h4>
                          <p className="text-sm text-gray-700">{request.justification}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
                      <span>Requested: {new Date(request.requested_at).toLocaleDateString()}</span>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleReject(request.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                        <button
                          onClick={() => handleApprove(request.id, request.proposal_id)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Reviewed Budget Requests</h2>
          </div>

          <div className="p-6">
            {reviewedRequests.length === 0 ? (
              <p className="text-gray-600">No reviewed budget requests yet.</p>
            ) : (
              <div className="space-y-4">
                {reviewedRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{request.proposal?.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {request.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex gap-6 text-sm text-gray-600">
                          <span>Amount: ETB {request.requested_amount.toLocaleString()}</span>
                          <span>Reviewed: {new Date(request.reviewed_at || '').toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
