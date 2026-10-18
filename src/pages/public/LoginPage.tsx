import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Crown, Lock, Phone, ArrowRight, AlertCircle } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    phone: '',
    password: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login(formData);
      login(res.token, res.user, res.user.wallet);
      navigate('/app');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#04132F] text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#1459E8]/20 blur-3xl rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-3 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#1459E8] to-[#FFD45A] p-0.5 shadow-lg shadow-[#1459E8]/40 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#04132F] rounded-[10px] flex items-center justify-center">
                <Crown className="w-6 h-6 text-[#FFD45A]" />
              </div>
            </div>
            <span className="text-2xl font-black tracking-tight text-white">EARN SHEET</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-xs text-slate-400 mt-1">
            Sign in to continue your level progression and tasks
          </p>
        </div>

        <div className="royal-card p-6 sm:p-8 rounded-3xl">
          {error && (
            <div className="mb-6 p-3.5 bg-red-500/15 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Registered Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  required
                  placeholder="e.g. 03001234567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-[#020B20] border border-[#214B91] focus:border-[#2478FF] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Password
                </label>
                <Link to="/forgot-password" className="text-[11px] text-[#FFD45A] hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-[#020B20] border border-[#214B91] focus:border-[#2478FF] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-[#1459E8] to-[#2478FF] hover:from-[#2478FF] hover:to-[#1459E8] text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-[#1459E8]/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Seed demo account hint */}
          <div className="mt-4 p-3 bg-[#020B20]/60 border border-[#214B91]/40 rounded-xl text-left">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-1">
              Test Account Credentials
            </span>
            <div className="flex justify-between items-center text-xs text-slate-300">
              <span>Phone: <code className="text-[#FFD45A]">03001234567</code></span>
              <span>Pass: <code className="text-[#FFD45A]">Password123!</code></span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-[#214B91]/50 text-center text-xs text-slate-400">
            Don't have an account yet?{' '}
            <Link to="/register" className="text-[#FFD45A] font-bold hover:underline">
              Register Here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
