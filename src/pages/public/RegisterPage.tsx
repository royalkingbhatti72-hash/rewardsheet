import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Crown, Lock, Phone, User, Ticket, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const refParam = searchParams.get('ref');
    if (refParam) {
      setFormData((prev) => ({ ...prev, referralCode: refParam.trim() }));
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.referralCode.trim()) {
      setError('Referral code is required. Registration requires an official 6-letter code provided by administration.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await api.register({
        ...formData,
        referralCode: formData.referralCode.trim(),
      });
      login(res.token, res.user);
      navigate('/app');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-amber-500/30 selection:text-amber-200">
      {/* Ambient Luxury Lighting Layers */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-amber-500/15 via-amber-600/5 to-transparent blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-amber-400/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Subtle Luxury Pattern Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" />

      {/* Card Container */}
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#D97706] via-[#F59E0B] to-[#FDE68A] p-[1.5px] shadow-xl shadow-amber-500/20 group-hover:shadow-amber-500/40 group-hover:scale-105 transition-all duration-300">
              <div className="w-full h-full bg-[#0A0F1D] rounded-[14px] flex items-center justify-center">
                <Crown className="w-6 h-6 text-[#F59E0B] drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]" />
              </div>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-2xl font-black tracking-wider text-white flex items-center gap-1.5">
                EARN STREET
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              </span>
              <span className="text-[10px] tracking-widest text-amber-400/80 font-bold uppercase -mt-0.5">
                Premium Rewards Portal
              </span>
            </div>
          </Link>
          <h1 className="text-2xl font-black text-white tracking-tight mt-2">Create Your Account</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
            Register to start completing Level 1 tasks and claim cash rewards
          </p>
        </div>

        <div className="relative bg-[#0D1324]/85 backdrop-blur-2xl border border-amber-500/25 p-6 sm:p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-amber-400/50 before:to-transparent">
          {error && (
            <div className="mb-6 p-3.5 bg-red-500/15 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2.5 shadow-lg shadow-red-950/40 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Full Name
              </label>
              <div className="relative group">
                <User className="w-4 h-4 text-slate-400 group-focus-within:text-amber-400 absolute left-3.5 top-3.5 transition-colors" />
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Shahid Khan"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-[#060A14] border border-slate-800/90 focus:border-amber-400/80 focus:ring-2 focus:ring-amber-400/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Mobile Number
              </label>
              <div className="relative group">
                <Phone className="w-4 h-4 text-slate-400 group-focus-within:text-amber-400 absolute left-3.5 top-3.5 transition-colors" />
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="e.g. 03001234567"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full bg-[#060A14] border border-slate-800/90 focus:border-amber-400/80 focus:ring-2 focus:ring-amber-400/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative group">
                <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-amber-400 absolute left-3.5 top-3.5 transition-colors" />
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-[#060A14] border border-slate-800/90 focus:border-amber-400/80 focus:ring-2 focus:ring-amber-400/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Confirm Password
              </label>
              <div className="relative group">
                <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-amber-400 absolute left-3.5 top-3.5 transition-colors" />
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-[#060A14] border border-slate-800/90 focus:border-amber-400/80 focus:ring-2 focus:ring-amber-400/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Official Referral Code *
                </label>
                <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  6-Letter Admin Code
                </span>
              </div>
              <div className="relative group">
                <Ticket className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  name="referralCode"
                  required
                  maxLength={6}
                  placeholder="e.g. lbhyfr"
                  value={formData.referralCode}
                  onChange={handleChange}
                  className="w-full bg-[#060A14] border border-slate-800/90 focus:border-amber-400/80 focus:ring-2 focus:ring-amber-400/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-amber-300 font-mono font-bold tracking-wider placeholder-slate-500 focus:outline-none transition-all shadow-inner"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                Enter your 6-letter official referral code provided by administration (e.g. <span className="font-mono text-amber-300">lbhyfr</span>, <span className="font-mono text-amber-300">LBHYFR</span>, or <span className="font-mono text-amber-300">Lbhyfr</span>). Each code is valid for a single registration only.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-[#FBBF24] hover:from-[#B45309] hover:via-[#D97706] hover:to-[#F59E0B] text-slate-950 font-black py-3 px-4 rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 transition-all disabled:opacity-50 tracking-wide text-sm cursor-pointer"
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-amber-500/20 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-amber-400 hover:text-amber-300 font-bold transition-colors">
              Sign In Here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
