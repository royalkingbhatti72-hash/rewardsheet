import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
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
    <div className="min-h-screen bg-[#F5F8FC] text-[#111827] flex flex-col justify-center items-center px-4 py-12 font-sans antialiased">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#2563EB] text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-[#2563EB]/25">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#111827]">Earn Street Admin</h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Secure Administrator Authentication Portal
          </p>
        </div>

        <div className="admin-card p-6 sm:p-8 bg-white space-y-6">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                Administrator Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg pl-10 pr-4 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 transition-all h-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                Admin Secret Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg pl-10 pr-4 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 transition-all h-10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm rounded-lg shadow-sm shadow-[#2563EB]/30 transition-all flex items-center justify-center gap-2 h-10 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In as Administrator</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
