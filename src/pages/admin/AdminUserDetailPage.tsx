import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  User,
  ArrowLeft,
  Crown,
  Wallet,
  CheckSquare,
  ArrowDownLeft,
  ArrowUpRight,
  Disc,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api } from '../../api/client';

export const AdminUserDetailPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'wallet' | 'deposits' | 'withdrawals' | 'spin'>('overview');

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    api.getAdminUserDetail(userId)
      .then((res) => setUserData(res.user))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-[#2563EB]/20 border-t-[#2563EB] rounded-full animate-spin" />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="admin-card p-12 text-center">
        <p className="text-xs text-[#6B7280]">Member record not found.</p>
      </div>
    );
  }

  const tabs = [
    { key: 'overview', label: 'Overview', icon: User },
    { key: 'tasks', label: 'Task History', icon: CheckSquare },
    { key: 'wallet', label: 'Wallet & Ledger', icon: Wallet },
    { key: 'deposits', label: 'Deposits', icon: ArrowDownLeft },
    { key: 'withdrawals', label: 'Withdrawals', icon: ArrowUpRight },
    { key: 'spin', label: 'Spin History', icon: Disc },
  ];

  return (
    <div className="space-y-6">
      <Link
        to="/adminpanal/users"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4B5563] hover:text-[#111827]"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Members
      </Link>

      {/* Header Info Card */}
      <div className="admin-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-[#2563EB]">User ID: {userData.id}</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  userData.accountStatus === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {userData.accountStatus}
              </span>
            </div>
            <h1 className="text-xl font-bold text-[#111827]">{userData.name}</h1>
            <p className="text-xs text-[#6B7280] font-mono mt-0.5">
              Phone: {userData.phone} • Referral Code: {userData.referralCode}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-lg text-right">
              <span className="text-[10px] text-amber-800 block font-semibold uppercase">Credit Points</span>
              <span className="text-lg font-black text-amber-700 flex items-center justify-end gap-1">
                <Sparkles className="w-4 h-4 text-amber-500" />
                {(userData.wallet?.creditPoints || 0).toLocaleString()} CPs
              </span>
            </div>

            <div className="p-3 bg-[#F8FAFD] border border-[#D9E4F2] rounded-lg text-right">
              <span className="text-[10px] text-[#6B7280] block font-semibold uppercase">Wallet Balance</span>
              <span className="text-lg font-black text-[#111827]">
                PKR {(userData.wallet?.availableBalance || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pt-6 border-t border-[#D9E4F2] mt-6">
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'text-[#4B5563] hover:bg-[#F8FAFD]'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="admin-card p-4 space-y-1">
            <span className="text-[11px] font-semibold text-[#6B7280] block">Joined Date</span>
            <span className="text-sm font-bold text-[#111827]">
              {new Date(userData.createdAt).toLocaleString()}
            </span>
          </div>
          <div className="admin-card p-4 space-y-1">
            <span className="text-[11px] font-semibold text-[#6B7280] block">Referred By</span>
            <span className="text-sm font-bold text-[#111827]">
              {userData.referredBy?.name ? `${userData.referredBy.name} (${userData.referredBy.phone})` : 'Direct Registration'}
            </span>
          </div>
          <div className="admin-card p-4 space-y-1">
            <span className="text-[11px] font-semibold text-[#6B7280] block">Total Withdrawn</span>
            <span className="text-sm font-bold text-blue-700">
              PKR {(userData.wallet?.totalWithdrawn || 0).toLocaleString()}
            </span>
          </div>
          <div className="admin-card p-4 space-y-1">
            <span className="text-[11px] font-semibold text-[#6B7280] block">Earned Credit Points</span>
            <span className="text-sm font-bold text-amber-600 flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-amber-500" />
              {(userData.wallet?.creditPoints || 0).toLocaleString()} CPs
            </span>
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="admin-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-[#111827]">Task Progress & Submissions</h2>
          {userData.taskProgress?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs admin-table">
                <thead>
                  <tr>
                    <th>Level / Task</th>
                    <th>Status</th>
                    <th>Updated Date</th>
                  </tr>
                </thead>
                <tbody>
                  {userData.taskProgress.map((tp: any) => (
                    <tr key={tp.id}>
                      <td className="font-semibold text-[#111827]">
                        Level {tp.task?.level?.levelNumber} Task #{tp.task?.taskNumber}: {tp.task?.title}
                      </td>
                      <td>
                        <span
                          className={`font-semibold text-[10px] px-2 py-0.5 rounded-full ${
                            tp.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {tp.status}
                        </span>
                      </td>
                      <td className="text-[#6B7280]">{new Date(tp.updatedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-[#6B7280]">No task progress recorded yet.</p>
          )}
        </div>
      )}

      {activeTab === 'wallet' && (
        <div className="admin-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-[#111827]">Ledger Transactions</h2>
          {userData.transactions?.length > 0 ? (
            <div className="space-y-2">
              {userData.transactions.map((tx: any) => (
                <div key={tx.id} className="p-3 bg-[#F8FAFD] border border-[#EDF1F7] rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-[#111827]">{tx.reason}</span>
                    <span className="text-[10px] text-[#6B7280] block">{new Date(tx.createdAt).toLocaleString()}</span>
                  </div>
                  <span className={`font-bold ${tx.amount > 0 ? 'text-emerald-700' : 'text-[#111827]'}`}>
                    {tx.amount > 0 ? '+' : ''}PKR {Math.abs(tx.amount).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#6B7280]">No transactions recorded.</p>
          )}
        </div>
      )}
    </div>
  );
};
