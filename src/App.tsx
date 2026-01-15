import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import DirectorDashboard from './components/Dashboards/DirectorDashboard';
import ResearcherDashboard from './components/Dashboards/ResearcherDashboard';
import ReviewerDashboard from './components/Dashboards/ReviewerDashboard';
import VicePresidentDashboard from './components/Dashboards/VicePresidentDashboard';
import CoordinatorDashboard from './components/Dashboards/CoordinatorDashboard';

function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);

  return isLogin ? (
    <Login onToggleMode={() => setIsLogin(false)} />
  ) : (
    <Register onToggleMode={() => setIsLogin(true)} />
  );
}

function DashboardRouter() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <AuthScreen />;
  }

  switch (profile.role) {
    case 'director':
      return <DirectorDashboard />;
    case 'researcher':
      return <ResearcherDashboard />;
    case 'reviewer':
      return <ReviewerDashboard />;
    case 'vice_president':
      return <VicePresidentDashboard />;
    case 'coordinator':
      return <CoordinatorDashboard />;
    default:
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Invalid role assigned to your account.</p>
          </div>
        </div>
      );
  }
}

function App() {
  return (
    <AuthProvider>
      <DashboardRouter />
    </AuthProvider>
  );
}

export default App;
