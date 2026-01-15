import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Proposal } from '../../types/database';
import { FileText, LogOut, Users } from 'lucide-react';
import ProposalsList from './components/ProposalsList';
import AssignReviewerModal from './components/AssignReviewerModal';

export default function CoordinatorDashboard() {
  const { profile, signOut } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [showAssignReviewer, setShowAssignReviewer] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data: proposalsData, error } = await supabase
        .from('proposals')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      if (proposalsData) setProposals(proposalsData);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Research Coordinator Dashboard</h1>
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
                <p className="text-sm text-gray-600">Total Proposals</p>
                <p className="text-2xl font-bold text-gray-900">{proposals.length}</p>
              </div>
              <FileText className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Needs Reviewer</p>
                <p className="text-2xl font-bold text-gray-900">
                  {proposals.filter(p => p.status === 'submitted').length}
                </p>
              </div>
              <Users className="w-10 h-10 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Under Review</p>
                <p className="text-2xl font-bold text-gray-900">
                  {proposals.filter(p => p.status === 'under_review').length}
                </p>
              </div>
              <FileText className="w-10 h-10 text-yellow-500" />
            </div>
          </div>
        </div>

        <ProposalsList
          proposals={proposals}
          onAssignReviewer={handleAssignReviewer}
          isDirector={false}
        />
      </div>

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
    </div>
  );
}
