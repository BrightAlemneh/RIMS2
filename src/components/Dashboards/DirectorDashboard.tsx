import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { CallForPapers, Proposal, UserProfile, BudgetRequest } from '../../types/database';
import { FileText, Plus, Users, DollarSign, LogOut } from 'lucide-react';
import CreateCallModal from './components/CreateCallModal';
import ProposalsList from './components/ProposalsList';
import AssignReviewerModal from './components/AssignReviewerModal';
import RequestBudgetModal from './components/RequestBudgetModal';

export default function DirectorDashboard() {
  const { profile, signOut } = useAuth();
  const [calls, setCalls] = useState<CallForPapers[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [showCreateCall, setShowCreateCall] = useState(false);
  const [showAssignReviewer, setShowAssignReviewer] = useState(false);
  const [showRequestBudget, setShowRequestBudget] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [callsData, proposalsData] = await Promise.all([
        supabase.from('calls_for_papers').select('*').order('created_at', { ascending: false }),
        supabase.from('proposals').select('*').order('submitted_at', { ascending: false })
      ]);

      if (callsData.data) setCalls(callsData.data);
      if (proposalsData.data) setProposals(proposalsData.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleAssignReviewer(proposal: Proposal) {
    setSelectedProposal(proposal);
    setShowAssignReviewer(true);
  }

  function handleRequestBudget(proposal: Proposal) {
    setSelectedProposal(proposal);
    setShowRequestBudget(true);
  }

  async function handleStatusChange(proposalId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('proposals')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', proposalId);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Research Director Dashboard</h1>
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
                <p className="text-sm text-gray-600">Total Calls</p>
                <p className="text-2xl font-bold text-gray-900">{calls.length}</p>
              </div>
              <FileText className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Proposals</p>
                <p className="text-2xl font-bold text-gray-900">{proposals.length}</p>
              </div>
              <FileText className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">
                  {proposals.filter(p => p.status === 'submitted' || p.status === 'under_review').length}
                </p>
              </div>
              <Users className="w-10 h-10 text-orange-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Calls for Papers</h2>
              <button
                onClick={() => setShowCreateCall(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create New Call
              </button>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <p className="text-gray-600">Loading...</p>
            ) : calls.length === 0 ? (
              <p className="text-gray-600">No calls for papers yet. Create one to get started.</p>
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
                          <span className={`px-2 py-1 rounded ${
                            call.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {call.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <ProposalsList
          proposals={proposals}
          onAssignReviewer={handleAssignReviewer}
          onRequestBudget={handleRequestBudget}
          onStatusChange={handleStatusChange}
          isDirector={true}
        />
      </div>

      {showCreateCall && (
        <CreateCallModal
          onClose={() => setShowCreateCall(false)}
          onSuccess={() => {
            setShowCreateCall(false);
            loadData();
          }}
        />
      )}

      {showAssignReviewer && selectedProposal && (
        <AssignReviewerModal
          proposal={selectedProposal}
          onClose={() => {
            setShowAssignReviewer(false);
            setSelectedProposal(null);
          }}
          onSuccess={() => {
            setShowAssignReviewer(false);
            setSelectedProposal(null);
            loadData();
          }}
        />
      )}

      {showRequestBudget && selectedProposal && (
        <RequestBudgetModal
          proposal={selectedProposal}
          onClose={() => {
            setShowRequestBudget(false);
            setSelectedProposal(null);
          }}
          onSuccess={() => {
            setShowRequestBudget(false);
            setSelectedProposal(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
