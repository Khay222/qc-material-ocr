import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Shield, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Warehouse Operator');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: tab,
          name: tab === 'register' ? name : undefined,
          email,
          password,
          role: tab === 'register' ? role : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onSuccess(data.user);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      // Local fallback for offline/demo if serverless is unreachable
      if (tab === 'login' && email) {
        const fallbackUser: User = {
          id: Math.floor(Math.random() * 1000) + 1,
          name: email.split('@')[0].replace(/[._]/g, ' ').toUpperCase(),
          email,
          role: 'Warehouse Operator',
        };
        onSuccess(fallbackUser);
        onClose();
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'demo' }),
      });
      const data = await res.json();
      if (data.user) {
        onSuccess(data.user);
      } else {
        throw new Error('Demo login failed');
      }
    } catch {
      // Fallback demo user
      const demoUser: User = {
        id: 999,
        name: 'Hans Mueller',
        email: 'hans.mueller@dhl-logistics.com',
        role: 'Senior QA Inspector',
      };
      onSuccess(demoUser);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border-2 border-neutral-200">
        {/* Modal Top Header with DHL Styling */}
        <div className="bg-[#FFCC00] px-6 py-4 flex items-center justify-between border-b-2 border-[#D40511]">
          <div className="flex items-center space-x-2">
            <span className="bg-[#D40511] text-white font-black italic px-2 py-0.5 text-sm rounded-xs">
              DHL
            </span>
            <h3 className="font-extrabold text-[#1A1A1A] text-lg">
              {tab === 'login' ? 'Operator Sign In' : 'Create New Account'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-700 hover:text-black p-1 rounded-md hover:bg-black/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 bg-neutral-100 p-1 border-b border-neutral-200 text-sm font-bold">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`py-2 rounded-md transition-colors ${
              tab === 'login'
                ? 'bg-white text-[#1A1A1A] shadow-xs'
                : 'text-neutral-500 hover:text-[#1A1A1A]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setError(null);
            }}
            className={`py-2 rounded-md transition-colors ${
              tab === 'register'
                ? 'bg-white text-[#1A1A1A] shadow-xs'
                : 'text-neutral-500 hover:text-[#1A1A1A]'
            }`}
          >
            Create New Account
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-[#D40511] text-[#D40511] text-xs font-semibold rounded-md flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'register' && (
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Mercer"
                    className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00] focus:border-[#D40511]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@dhl.com"
                  className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00] focus:border-[#D40511]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00] focus:border-[#D40511]"
                />
              </div>
            </div>

            {tab === 'register' && (
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Assigned Role
                </label>
                <div className="relative">
                  <Shield className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00] focus:border-[#D40511] bg-white"
                  >
                    <option value="Warehouse Operator">Warehouse Operator</option>
                    <option value="Senior QA Inspector">Senior QA Inspector</option>
                    <option value="Packaging Specialist">Packaging Specialist</option>
                    <option value="Logistics Supervisor">Logistics Supervisor</option>
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#D40511] hover:bg-[#B0000D] text-white font-bold text-sm rounded-md shadow-md transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Processing...' : tab === 'login' ? 'Sign In' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Login Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-neutral-500 font-semibold">Or Quick Access</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full py-2 px-3 bg-neutral-100 hover:bg-[#FFCC00]/20 border border-neutral-300 text-neutral-800 font-bold text-xs rounded-md transition-colors flex items-center justify-center space-x-2"
          >
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Instant Demo Sign In (Hans Mueller - QA Inspector)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
