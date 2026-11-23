import React from 'react';
import { Scan, History, Volume2, VolumeX, User as UserIcon, LogOut, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  activeTab: 'workstation' | 'history';
  setActiveTab: (tab: 'workstation' | 'history') => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  activeBatchNumber?: string;
  isSessionActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAuth,
  onLogout,
  isMuted,
  setIsMuted,
  activeBatchNumber,
  isSessionActive,
}) => {
  return (
    <header className="bg-[#FFCC00] border-b-4 border-[#D40511] shadow-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand Identity */}
          <div className="flex items-center space-x-3">
            <div className="bg-[#D40511] text-white px-3 py-1 font-black text-2xl tracking-tighter italic rounded-sm shadow-inner select-none flex items-center">
              DHL
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg text-[#1A1A1A] tracking-tight">
                  ScanGuard
                </span>
                <span className="bg-[#1A1A1A] text-[#FFCC00] text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded">
                  Logistics QA
                </span>
              </div>
              <span className="text-xs text-neutral-800 font-medium hidden sm:inline">
                Material to Material Barcode Validation System
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab('workstation')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-bold transition-colors ${
                activeTab === 'workstation'
                  ? 'bg-[#1A1A1A] text-[#FFCC00] shadow'
                  : 'text-[#1A1A1A] hover:bg-black/10'
              }`}
            >
              <Scan className="w-4 h-4" />
              <span>Scan Workstation</span>
              {isSessionActive && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-bold transition-colors ${
                activeTab === 'history'
                  ? 'bg-[#1A1A1A] text-[#FFCC00] shadow'
                  : 'text-[#1A1A1A] hover:bg-black/10'
              }`}
            >
              <History className="w-4 h-4" />
              <span>History & Reports</span>
            </button>
          </div>

          {/* Right Tools & User Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? 'Audio alarms muted - Click to unmute' : 'Audio alarms active - Click to mute'}
              className={`p-2 rounded-md transition-colors ${
                isMuted
                  ? 'bg-[#D40511] text-white hover:bg-red-700'
                  : 'bg-black/10 text-[#1A1A1A] hover:bg-black/20'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Operator Account / Login */}
            {currentUser ? (
              <div className="flex items-center space-x-2 bg-white/90 border border-neutral-300 rounded-md px-2.5 py-1 shadow-sm">
                <div className="w-7 h-7 rounded-full bg-[#D40511] text-white flex items-center justify-center font-bold text-xs">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-xs font-bold text-[#1A1A1A] leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-neutral-600 leading-tight">
                    {currentUser.role}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-1 text-neutral-600 hover:text-[#D40511] transition-colors ml-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="flex items-center space-x-1.5 bg-[#D40511] hover:bg-[#B0000D] text-white text-xs font-bold px-3 py-2 rounded-md shadow-sm transition-transform active:scale-95"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Operator Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
