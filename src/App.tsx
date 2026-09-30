import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { SkillsPage } from './pages/SkillsPage';
import { PracticePage } from './pages/PracticePage';
import { GoalsPage } from './pages/GoalsPage';
import { CommunityPage } from './pages/CommunityPage';
import { ProfilePage } from './pages/ProfilePage';
import { api } from './services/api';
import { Cloud, Check, Database, Shield, Server, HardDrive } from 'lucide-react';

const MainContent: React.FC = () => {
  const { user, loading, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [practiceSkillId, setPracticeSkillId] = useState<string | undefined>(undefined);
  const [milestoneToShare, setMilestoneToShare] = useState<{ milestone: string; skillId: string } | undefined>(
    undefined
  );
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

  const handleResetSeed = async () => {
    try {
      const res = await api.seed.resetSeed();
      setDemoNotice(res.message);
      await refreshProfile();
      setTimeout(() => setDemoNotice(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to reseed database');
    }
  };

  const handleLogPracticeForSkill = (skillId: string) => {
    setPracticeSkillId(skillId);
    setActiveTab('practice');
  };

  const handlePostMilestone = (milestoneText: string, skillId: string) => {
    setMilestoneToShare({ milestone: milestoneText, skillId });
    setActiveTab('community');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-700">Connecting to Cloud Backend...</p>
          <p className="text-xs text-slate-400">Verifying session credentials &amp; cloud database connection</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetSeed={handleResetSeed}
      />

      {/* Demo notification banner */}
      {demoNotice && (
        <div className="bg-indigo-600 text-white text-xs font-semibold py-2 px-4 text-center shadow-xs flex items-center justify-center space-x-2">
          <Check className="w-4 h-4" />
          <span>{demoNotice}</span>
        </div>
      )}

      {/* Main View Router */}
      <main className="flex-1">
        {activeTab === 'dashboard' && <DashboardPage setActiveTab={setActiveTab} />}
        {activeTab === 'skills' && <SkillsPage onLogPracticeForSkill={handleLogPracticeForSkill} />}
        {activeTab === 'practice' && (
          <PracticePage
            initialSkillId={practiceSkillId}
            onPostMilestone={handlePostMilestone}
          />
        )}
        {activeTab === 'goals' && (
          <GoalsPage onLogPractice={() => setActiveTab('practice')} />
        )}
        {activeTab === 'community' && (
          <CommunityPage
            initialMilestone={milestoneToShare?.milestone}
            initialSkillId={milestoneToShare?.skillId}
          />
        )}
        {activeTab === 'profile' && <ProfilePage />}
      </main>

      {/* Academic & Cloud Architecture Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Cloud className="w-5 h-5 text-indigo-600" />
              <span className="text-sm font-bold text-slate-800">
                Online Hobby &amp; Skills Tracker on Cloud
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
              <span className="flex items-center space-x-1">
                <Shield className="w-3.5 h-3.5 text-indigo-500" />
                <span>Firebase / REST Auth</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Database className="w-3.5 h-3.5 text-emerald-500" />
                <span>Firestore Cloud DB</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <HardDrive className="w-3.5 h-3.5 text-amber-500" />
                <span>Cloud Object Storage</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Server className="w-3.5 h-3.5 text-purple-500" />
                <span>Stateless REST API</span>
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Academic Cloud Computing Project • Production-Ready
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
