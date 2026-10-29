import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Crown, Lock, Phone, User, Share2, ArrowRight, AlertCircle } from 'lucide-react';
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
      setFormData((prev) => ({ ...prev, referralCode: refParam.trim().toUpperCase() }));
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
      setError('Referral code is required. Registration is strictly invite-only.');
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
        referralCode: formData.referralCode.trim().toUpperCase(),
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
    <div className="min-h-screen bg-[#04132F] text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#1459E8]/20 blur-3xl rounded-full pointer-events-none" />

      {/* Card Container */}
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-3 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#1459E8] to-[#FFD45A] p-0.5 shadow-lg shadow-[#1459E8]/40 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#04132F] rounded-[10px] flex items-center justify-center">
                <Crown className="w-6 h-6 text-[#FFD45A]" />
              </div>
            </div>
            <span className="text-2xl font-black tracking-tight text-white">EARN STREET</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Create Your Account</h1>
          <p className="text-xs text-slate-400 mt-1">
            Register to start completing Level 1 tasks and claim cash rewards
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
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Shahid Khan"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-[#020B20] border border-[#214B91] focus:border-[#2478FF] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="e.g. 03001234567"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full bg-[#020B20] border border-[#214B91] focus:border-[#2478FF] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-[#020B20] border border-[#214B91] focus:border-[#2478FF] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-[#020B20] border border-[#214B91] focus:border-[#2478FF] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Official Referral Code *
                </label>
                <span className="text-[10px] font-bold text-[#FFD45A] bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  Admin Code Required
                </span>
              </div>
              <div className="relative">
                <Share2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  name="referralCode"
                  required
                  placeholder="e.g. ROYAL-VIP-001"
                  value={formData.referralCode}
                  onChange={handleChange}
                  className="w-full bg-[#020B20] border border-[#214B91] focus:border-[#2478FF] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#FFD45A] font-semibold uppercase placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Exclusive access: Registrations strictly require an official admin-issued referral code. Each code is one-time use and provided directly by administration.
              </p>
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
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#214B91]/50 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-[#FFD45A] font-bold hover:underline">
              Sign In Here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
