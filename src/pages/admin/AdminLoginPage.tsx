import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '../../api/client';
import { useAdminAuth } from '../../context/AdminAuthContext';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { adminLogin } = useAdminAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.adminLogin({ username, password });
      adminLogin(res.token, res.admin);
      navigate('/adminpanal/dashboard');
    } catch (err: any) {
      setError(err.message || 'Administrator authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans antialiased selection:bg-amber-500/30 selection:text-amber-200">
      {/* Ambient Luxury Lighting Layers */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-amber-500/15 via-amber-600/5 to-transparent blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-amber-400/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Subtle Luxury Pattern Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#D97706] via-[#F59E0B] to-[#FDE68A] p-[1.5px] shadow-xl shadow-amber-500/20">
              <div className="w-full h-full bg-[#0A0F1D] rounded-[14px] flex items-center justify-center">
                <Shield className="w-6 h-6 text-[#F59E0B] drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]" />
              </div>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-2xl font-black tracking-wider text-white flex items-center gap-1.5">
                EARN STREET
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              </span>
              <span className="text-[10px] tracking-widest text-amber-400/80 font-bold uppercase -mt-0.5">
                Administrator Control Portal
              </span>
            </div>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-2">Executive Access</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
            Secure Administrator Authentication & System Management
          </p>
        </div>

        {/* Frosted Glass Card with Luxury Midnight & Rich Gold Styling */}
        <div className="relative bg-[#0D1324]/85 backdrop-blur-2xl border border-amber-500/25 p-6 sm:p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-amber-400/50 before:to-transparent space-y-6">
          {error && (
            <div className="p-3.5 bg-red-500/15 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2.5 shadow-lg shadow-red-950/40 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Administrator Username
              </label>
              <div className="relative group">
                <User className="w-4 h-4 text-slate-400 group-focus-within:text-amber-400 absolute left-3.5 top-3.5 transition-colors" />
                <input
                  type="text"
                  required
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#060A14] border border-slate-800/90 focus:border-amber-400/80 focus:ring-2 focus:ring-amber-400/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner h-11"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Admin Secret Password
              </label>
              <div className="relative group">
                <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-amber-400 absolute left-3.5 top-3.5 transition-colors" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#060A14] border border-slate-800/90 focus:border-amber-400/80 focus:ring-2 focus:ring-amber-400/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner h-11"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-[#FBBF24] hover:from-[#B45309] hover:via-[#D97706] hover:to-[#F59E0B] text-slate-950 font-black py-2.5 px-4 rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 h-11 transition-all disabled:opacity-50 tracking-wide text-sm cursor-pointer"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In as Administrator</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-amber-500/15 text-center text-[11px] text-slate-500">
            Protected by multi-layer cryptographic authorization & audit logging
          </div>
        </div>
      </div>
    </div>
  );
};
