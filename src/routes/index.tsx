import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Workstation } from '../components/Workstation';
import { HistoryView } from '../components/HistoryView';
import { AuthModal } from '../components/AuthModal';
import { User, Batch } from '../types';
import { ShieldCheck, Database, CheckCircle2, Zap, Barcode } from 'lucide-react';

export const Route = createFileRoute('/')({
  component: AppRoot,
});

function AppRoot() {
  const [activeTab, setActiveTab] = useState<'workstation' | 'history'>('workstation');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Restore user session from localStorage if available
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('dhl_operator_user');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('dhl_operator_user', JSON.stringify(user));
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('dhl_operator_user');
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] flex flex-col selection:bg-[#FFCC00] selection:text-black">
      {/* Top DHL Yellow & Red Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        isSessionActive={activeTab === 'workstation'}
      />

      {/* Main Workstation View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quality Standard Bar */}
        <div className="mb-4 bg-white rounded-xl p-3 border border-neutral-200 shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2 text-neutral-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-[#1A1A1A]">Workstation System Status:</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              OPERATIONAL • READY FOR SCANNING
            </span>
          </div>

          <div className="flex items-center space-x-3 text-neutral-500 font-medium">
            <span className="flex items-center space-x-1">
              <Barcode className="w-3.5 h-3.5 text-[#D40511]" />
              <span>Auto-Enter Enabled</span>
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:flex items-center space-x-1">
              <Database className="w-3.5 h-3.5 text-[#FFCC00]" />
              <span>Netlify Postgres Persistent</span>
            </span>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'workstation' ? (
          <Workstation
            currentUser={currentUser}
            isMuted={isMuted}
            onViewHistory={() => setActiveTab('history')}
          />
        ) : (
          <HistoryView />
        )}
      </main>

      {/* Industrial Footer */}
      <footer className="bg-[#1A1A1A] text-neutral-400 border-t-4 border-[#FFCC00] mt-auto py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <span className="bg-[#D40511] text-white px-2 py-0.5 font-black italic rounded-xs text-[11px]">
              DHL
            </span>
            <span className="text-neutral-300 font-bold">
              Supply Chain & Logistics Quality Assurance System
            </span>
          </div>

          <div className="flex items-center space-x-4 text-[11px] text-neutral-400">
            <span>ScanGuard v2.4 Enterprise</span>
            <span>•</span>
            <span>Material-to-Material 1:1 Verification</span>
            <span>•</span>
            <span className="text-[#FFCC00] font-semibold">Postgres Drizzle Migration Active</span>
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
