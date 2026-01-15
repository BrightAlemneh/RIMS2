import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { CallForPapers, Proposal } from '../../types/database';
import { FileText, Plus, LogOut } from 'lucide-react';
import SubmitProposalModal from './components/SubmitProposalModal';

export default function ResearcherDashboard() {
  const { profile, signOut } = useAuth();
  const [calls, setCalls] = useState<CallForPapers[]>([]);
  const [myProposals, setMyProposals] = useState<Proposal[]>([]);
  const [showSubmitProposal, setShowSubmitProposal] = useState(false);
  const [selectedCall, setSelectedCall] = useState<CallForPapers | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [profile?.id]);

  async function loadData() {
    if (!profile?.id) return;

    setLoading(true);
    try {
      const [callsData, proposalsData] = await Promise.all([
        supabase
          .from('calls_for_papers')
          .select('*')
          .eq('status', 'open')
          .order('created_at', { ascending: false }),
        supabase
          .from('proposals')
          .select('*')
          .eq('researcher_id', profile.id)
          .order('submitted_at', { ascending: false })
      ]);

      if (callsData.data) setCalls(callsData.data);
      if (proposalsData.data) setMyProposals(proposalsData.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmitProposal(call: CallForPapers) {
    setSelectedCall(call);
    setShowSubmitProposal(true);
  }

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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Researcher Dashboard</h1>
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
                <p className="text-sm text-gray-600">My Proposals</p>
                <p className="text-2xl font-bold text-gray-900">{myProposals.length}</p>
              </div>
              <FileText className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Under Review</p>
                <p className="text-2xl font-bold text-gray-900">
                  {myProposals.filter(p => p.status === 'under_review').length}
                </p>
              </div>
              <FileText className="w-10 h-10 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {myProposals.filter(p => p.status === 'approved' || p.status === 'budget_approved').length}
                </p>
              </div>
              <FileText className="w-10 h-10 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Open Calls for Papers</h2>
          </div>

          <div className="p-6">
            {loading ? (
              <p className="text-gray-600">Loading...</p>
            ) : calls.length === 0 ? (
              <p className="text-gray-600">No open calls for papers at the moment.</p>
            ) : (
              <div className="space-y-4">
                {calls.map((call) => (
                  <div key={call.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{call.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{call.description}</p>
                        <div className="flex gap-4 mt-2 text-sm text-gray-500">
                          <span>Deadline: {new Date(call.deadline).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSubmitProposal(call)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Submit Proposal
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">My Proposals</h2>
          </div>

          <div className="p-6">
            {myProposals.length === 0 ? (
              <p className="text-gray-600">You haven't submitted any proposals yet.</p>
            ) : (
              <div className="space-y-4">
                {myProposals.map((proposal) => (
                  <div key={proposal.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{proposal.title}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{proposal.abstract}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                        {proposal.status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-3 pt-3 border-t">
                      <span>Budget: ETB {proposal.budget_amount.toLocaleString()}</span>
                      <span>Submitted: {new Date(proposal.submitted_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showSubmitProposal && selectedCall && (
        <SubmitProposalModal
          call={selectedCall}
          onClose={() => {
            setShowSubmitProposal(false);
            setSelectedCall(null);
          }}
          onSuccess={() => {
            setShowSubmitProposal(false);
            setSelectedCall(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
