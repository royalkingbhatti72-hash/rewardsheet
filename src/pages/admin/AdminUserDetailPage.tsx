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
  Edit3,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../api/client';

export const AdminUserDetailPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'wallet' | 'deposits' | 'withdrawals' | 'spin'>('overview');

  // Credit Points Adjustment Modal state
  const [pointsModalOpen, setPointsModalOpen] = useState(false);
  const [pointsActionType, setPointsActionType] = useState<'ADD' | 'DEDUCT'>('ADD');
  const [adjustPoints, setAdjustPoints] = useState('');
  const [pointsReason, setPointsReason] = useState('');
  const [pointsLoading, setPointsLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    api.getAdminUserDetail(userId)
      .then((res) => setUserData(res.user))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || !adjustPoints) return;
    const numPoints = parseInt(adjustPoints, 10);
    if (isNaN(numPoints) || numPoints <= 0) {
      setActionMessage({ type: 'error', text: 'Credit points must be a positive integer.' });
      return;
    }
    const currentPoints = userData.wallet?.creditPoints || 0;
    if (pointsActionType === 'DEDUCT' && currentPoints < numPoints) {
      setActionMessage({
        type: 'error',
        text: `Cannot deduct ${numPoints} CPs. Current balance is only ${currentPoints} CPs. Negative credit points are not allowed.`,
      });
      return;
    }

    setPointsLoading(true);
    setActionMessage(null);
    try {
      const res = await api.adjustUserCreditPoints(userData.id, {
        points: numPoints,
        actionType: pointsActionType,
        reason: pointsReason,
      });

      const updatedPoints = res.creditPoints ?? (
        currentPoints + (pointsActionType === 'ADD' ? numPoints : -numPoints)
      );

      // Targeted state update: update ONLY this user's wallet without full-page reload
      setUserData((prev: any) => ({
        ...prev,
        wallet: {
          ...prev.wallet,
          creditPoints: updatedPoints,
        },
      }));

      setActionMessage({ type: 'success', text: res.message || 'Credit points updated successfully!' });
      setPointsModalOpen(false);
      setAdjustPoints('');
      setPointsReason('');
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to adjust credit points.' });
    } finally {
      setPointsLoading(false);
    }
  };

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
      <div className="flex items-center justify-between">
        <Link
          to="/adminpanal/users"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4B5563] hover:text-[#111827]"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Members
        </Link>
        <button
          type="button"
          onClick={() => {
            setAdjustPoints('');
            setPointsReason('');
            setPointsActionType('ADD');
            setPointsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 active:scale-95 text-white transition-all shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Edit Credit Points</span>
        </button>
      </div>

      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between shadow-xs ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="p-1 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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

          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-right flex flex-col justify-between min-w-[150px] shadow-xs">
              <div>
                <span className="text-[10px] text-amber-800 block font-bold uppercase tracking-wider">Credit Points</span>
                <span className="text-lg font-black text-amber-700 flex items-center justify-end gap-1">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  {(userData.wallet?.creditPoints || 0).toLocaleString()} CPs
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAdjustPoints('');
                  setPointsReason('');
                  setPointsActionType('ADD');
                  setPointsModalOpen(true);
                }}
                className="mt-2 px-2.5 py-1 text-[11px] font-bold bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                title="Edit / Adjust User Credit Points"
              >
                <Edit3 className="w-3 h-3" />
                <span>Adjust CPs</span>
              </button>
            </div>

            <div className="p-3 bg-[#F8FAFD] border border-[#D9E4F2] rounded-xl text-right min-w-[150px]">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <div className="admin-card p-4 space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-semibold text-[#6B7280] block">Earned Credit Points</span>
              <span className="text-base font-bold text-amber-600 flex items-center gap-1 mt-0.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                {(userData.wallet?.creditPoints || 0).toLocaleString()} CPs
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setAdjustPoints('');
                setPointsReason('');
                setPointsActionType('ADD');
                setPointsModalOpen(true);
              }}
              className="w-full mt-2 px-3 py-1.5 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Edit / Adjust Credit Points</span>
            </button>
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

      {/* Credit Points Adjustment Modal */}
      {pointsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="admin-card p-6 w-full max-w-md bg-white space-y-4 shadow-2xl rounded-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#D9E4F2]">
              <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" /> Adjust Credit Points: {userData.name}
              </h2>
              <button
                type="button"
                onClick={() => setPointsModalOpen(false)}
                className="p-1 text-[#6B7280] hover:text-[#111827] rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs flex justify-between items-center">
              <span className="text-amber-900 font-medium">Current Credit Points:</span>
              <strong className="text-amber-800 font-black text-sm flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                {(userData.wallet?.creditPoints || 0).toLocaleString()} CPs
              </strong>
            </div>

            <form onSubmit={handleAdjustPoints} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#374151] mb-1.5">
                  Action Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPointsActionType('ADD')}
                    className={`py-2 px-3 rounded-lg font-bold border text-xs flex items-center justify-center gap-1.5 transition-all ${
                      pointsActionType === 'ADD'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs'
                        : 'border-[#D9E4F2] text-[#4B5563] hover:bg-slate-50'
                    }`}
                  >
                    + Add Points (Reward)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPointsActionType('DEDUCT')}
                    className={`py-2 px-3 rounded-lg font-bold border text-xs flex items-center justify-center gap-1.5 transition-all ${
                      pointsActionType === 'DEDUCT'
                        ? 'bg-red-50 border-red-300 text-red-800 shadow-xs'
                        : 'border-[#D9E4F2] text-[#4B5563] hover:bg-slate-50'
                    }`}
                  >
                    - Deduct Points (Penalty)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  Credit Points Amount (CPs) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  placeholder="Enter CPs (e.g. 5, 10, 30, 50)"
                  value={adjustPoints}
                  onChange={(e) => setAdjustPoints(e.target.value)}
                  className="w-full bg-white border border-[#D9E4F2] focus:border-amber-500 rounded-lg p-2.5 font-bold text-sm text-[#111827] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  Audit Logging Reason (Strictly Required) *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Enter reason (e.g. Manual correction, task bonus reward, tier adjustment)"
                  value={pointsReason}
                  onChange={(e) => setPointsReason(e.target.value)}
                  className="w-full bg-white border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-[#111827] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPointsModalOpen(false)}
                  className="px-4 py-2 border border-[#D9E4F2] rounded-lg text-[#4B5563] font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pointsLoading}
                  className="px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 active:scale-95 flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {pointsLoading ? 'Updating CPs...' : 'Confirm Points Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
