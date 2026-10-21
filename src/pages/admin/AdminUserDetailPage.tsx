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
  ExternalLink,
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

  // Edit User Profile Modal state (sends only changed fields to backend/Supabase)
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'SUSPENDED'>('ACTIVE');
  const [editReason, setEditReason] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    api.getAdminUserDetail(userId)
      .then((res) => setUserData(res.user))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    const changedFields: Record<string, any> = {};
    if (editName.trim() && editName.trim() !== userData.name) {
      changedFields.name = editName.trim();
    }
    if (editPhone.trim() && editPhone.trim() !== userData.phone) {
      changedFields.phone = editPhone.trim();
    }
    if (editStatus && editStatus !== userData.accountStatus) {
      changedFields.accountStatus = editStatus;
    }
    if (editReason.trim()) {
      changedFields.reason = editReason.trim();
    }

    if (Object.keys(changedFields).filter((k) => k !== 'reason').length === 0) {
      setActionMessage({ type: 'success', text: 'No fields were modified. User profile is unchanged.' });
      setEditModalOpen(false);
      return;
    }

    const payload = { ...changedFields };
    setEditModalOpen(false);
    setEditLoading(true);
    setActionMessage(null);
    try {
      const res = await api.updateUser(userData.id, payload);
      // Update only this user's data instantly without reloading the page
      setUserData((prev: any) => ({
        ...prev,
        ...res.user,
      }));
      setActionMessage({ type: 'success', text: res.message || 'User profile updated successfully!' });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to update user profile.' });
    } finally {
      setEditLoading(false);
    }
  };

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

    const payloadPoints = numPoints;
    const payloadType = pointsActionType;
    const payloadReason = pointsReason;

    setPointsModalOpen(false);
    setAdjustPoints('');
    setPointsReason('');
    setPointsLoading(true);
    setActionMessage(null);
    try {
      const res = await api.adjustUserCreditPoints(userData.id, {
        points: payloadPoints,
        actionType: payloadType,
        reason: payloadReason,
      });

      const updatedPoints = res.creditPoints ?? (
        currentPoints + (payloadType === 'ADD' ? payloadPoints : -payloadPoints)
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditName(userData.name);
              setEditPhone(userData.phone);
              setEditStatus(userData.accountStatus || 'ACTIVE');
              setEditReason('');
              setEditModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-95 text-white transition-all shadow-sm"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
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
              className="w-full mt-2 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-[#374151] border border-[#D9E4F2] rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#6B7280]" />
              <span>Adjust Credit Points</span>
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

      {/* Deposits Tab */}
      {activeTab === 'deposits' && (
        <div className="space-y-4">
          {/* Quick Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="admin-card p-4">
              <span className="text-[11px] font-semibold text-[#6B7280] block">Total Approved Deposits</span>
              <span className="text-lg font-black text-emerald-700">
                PKR{' '}
                {(userData.depositRequests || [])
                  .filter((d: any) => d.status === 'APPROVED')
                  .reduce((sum: number, d: any) => sum + (d.amount || 0), 0)
                  .toLocaleString()}
              </span>
            </div>
            <div className="admin-card p-4">
              <span className="text-[11px] font-semibold text-[#6B7280] block">Total Deposit Requests</span>
              <span className="text-lg font-black text-[#111827]">
                {(userData.depositRequests || []).length} requests
              </span>
            </div>
            <div className="admin-card p-4">
              <span className="text-[11px] font-semibold text-[#6B7280] block">Pending Verification</span>
              <span className="text-lg font-black text-amber-600">
                {(userData.depositRequests || []).filter((d: any) => d.status === 'PENDING').length} pending
              </span>
            </div>
          </div>

          <div className="admin-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                <span>Deposit Request History</span>
              </h2>
              <span className="text-xs text-[#6B7280]">
                {(userData.depositRequests || []).length} records
              </span>
            </div>

            {userData.depositRequests?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs admin-table">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Transaction ID / Reference</th>
                      <th>Proof Evidence</th>
                      <th>Status</th>
                      <th>Reviewer / Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userData.depositRequests.map((d: any) => (
                      <tr key={d.id}>
                        <td className="text-[#6B7280] whitespace-nowrap">
                          {new Date(d.createdAt).toLocaleString()}
                        </td>
                        <td className="font-bold text-emerald-700 whitespace-nowrap">
                          PKR {Number(d.amount || 0).toLocaleString()}
                        </td>
                        <td>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md font-semibold text-[10px] bg-slate-100 text-[#374151]">
                            {d.paymentMethod}
                          </span>
                        </td>
                        <td className="font-mono text-[11px] text-[#111827]">
                          {d.transactionReference || '—'}
                        </td>
                        <td>
                          {d.proofEvidence ? (
                            <a
                              href={d.proofEvidence}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-[#2563EB] hover:underline font-semibold"
                            >
                              <span>View Slip</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-[#9CA3AF] text-[11px]">No proof file</span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`font-semibold text-[10px] px-2.5 py-0.5 rounded-full inline-block ${
                              d.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : d.status === 'REJECTED'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {d.status}
                          </span>
                        </td>
                        <td className="text-[11px] text-[#4B5563]">
                          {d.reviewerName ? (
                            <span>
                              <strong>{d.reviewerName}</strong>
                              {d.reviewNotes ? `: ${d.reviewNotes}` : ''}
                            </span>
                          ) : (
                            <span className="text-[#9CA3AF]">Awaiting review</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[#6B7280] space-y-1">
                <ArrowDownLeft className="w-8 h-8 text-[#9CA3AF] mx-auto opacity-50" />
                <p className="font-semibold text-[#374151]">No deposit requests found</p>
                <p>This user has not submitted any deposit slips yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Withdrawals Tab */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-4">
          {/* Quick Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="admin-card p-4">
              <span className="text-[11px] font-semibold text-[#6B7280] block">Total Paid Withdrawals</span>
              <span className="text-lg font-black text-blue-700">
                PKR{' '}
                {(userData.withdrawalRequests || [])
                  .filter((w: any) => w.approvalStatus === 'APPROVED' || w.paymentStatus === 'PAID')
                  .reduce((sum: number, w: any) => sum + (w.amount || 0), 0)
                  .toLocaleString()}
              </span>
            </div>
            <div className="admin-card p-4">
              <span className="text-[11px] font-semibold text-[#6B7280] block">Total Requests</span>
              <span className="text-lg font-black text-[#111827]">
                {(userData.withdrawalRequests || []).length} requests
              </span>
            </div>
            <div className="admin-card p-4">
              <span className="text-[11px] font-semibold text-[#6B7280] block">Pending Approval</span>
              <span className="text-lg font-black text-amber-600">
                {(userData.withdrawalRequests || []).filter((w: any) => w.approvalStatus === 'PENDING').length} pending
              </span>
            </div>
          </div>

          <div className="admin-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-blue-600" />
                <span>Withdrawal Request History</span>
              </h2>
              <span className="text-xs text-[#6B7280]">
                {(userData.withdrawalRequests || []).length} records
              </span>
            </div>

            {userData.withdrawalRequests?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs admin-table">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Amount</th>
                      <th>Destination Account</th>
                      <th>Approval</th>
                      <th>Payout Status</th>
                      <th>Payout Ref / TID</th>
                      <th>Reviewer / Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userData.withdrawalRequests.map((w: any) => (
                      <tr key={w.id}>
                        <td className="text-[#6B7280] whitespace-nowrap">
                          {new Date(w.createdAt).toLocaleString()}
                        </td>
                        <td className="font-bold text-[#111827] whitespace-nowrap">
                          PKR {Number(w.amount || 0).toLocaleString()}
                        </td>
                        <td>
                          <div>
                            <span className="font-semibold text-[#111827] block">
                              {w.recipientName || '—'}
                            </span>
                            <span className="text-[11px] font-mono text-[#6B7280]">
                              {w.paymentMethod}: {w.recipientAccount}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`font-semibold text-[10px] px-2.5 py-0.5 rounded-full inline-block ${
                              w.approvalStatus === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : w.approvalStatus === 'REJECTED'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {w.approvalStatus}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`font-semibold text-[10px] px-2.5 py-0.5 rounded-full inline-block ${
                              w.paymentStatus === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : w.paymentStatus === 'PROCESSING'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : w.paymentStatus === 'FAILED'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {w.paymentStatus}
                          </span>
                        </td>
                        <td className="font-mono text-[11px] text-[#111827]">
                          {w.payoutReference || '—'}
                        </td>
                        <td className="text-[11px] text-[#4B5563]">
                          {w.reviewerName ? (
                            <span>
                              <strong>{w.reviewerName}</strong>
                              {w.reviewNotes ? `: ${w.reviewNotes}` : ''}
                            </span>
                          ) : (
                            <span className="text-[#9CA3AF]">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[#6B7280] space-y-1">
                <ArrowUpRight className="w-8 h-8 text-[#9CA3AF] mx-auto opacity-50" />
                <p className="font-semibold text-[#374151]">No withdrawal requests found</p>
                <p>This user has not requested any withdrawals yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Spin History Tab */}
      {activeTab === 'spin' && (
        <div className="space-y-4">
          {/* Active Spin Entitlements & Allocation Summary */}
          <div className="admin-card p-6 space-y-4">
            <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-600" />
              <span>Current Spin Entitlements & Allocation Status</span>
            </h2>

            {userData.spinEntitlements?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {userData.spinEntitlements.map((ent: any) => (
                  <div
                    key={ent.id}
                    className="p-3.5 bg-[#F8FAFD] border border-[#D9E4F2] rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#111827]">
                        {ent.triggerReason || 'Fortune Wheel Entitlement'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ent.isEligible && ent.remainingSpins > 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {ent.remainingSpins > 0 ? `${ent.remainingSpins} Available` : 'Exhausted'}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#4B5563] space-y-1">
                      <div className="flex justify-between">
                        <span>Total Spins Granted:</span>
                        <strong className="text-[#111827]">{ent.totalSpins}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Remaining Spins:</span>
                        <strong className="text-amber-700">{ent.remainingSpins}</strong>
                      </div>
                      {ent.assignedPrize && (
                        <div className="flex justify-between pt-1 border-t border-[#EDF1F7]">
                          <span>Assigned Prize:</span>
                          <strong className="text-[#2563EB]">{ent.assignedPrize.name}</strong>
                        </div>
                      )}
                      {ent.requiresAdminReview && (
                        <div className="flex justify-between text-amber-700 font-semibold">
                          <span>Admin Review:</span>
                          <span>{ent.adminReviewed ? 'Reviewed' : 'Pending Allocation'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#6B7280]">No active spin entitlements recorded for this user.</p>
            )}
          </div>

          {/* Historical Spin Outcomes */}
          <div className="admin-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                <Disc className="w-4 h-4 text-[#2563EB]" />
                <span>Historical Wheel Spin Results</span>
              </h2>
              <span className="text-xs text-[#6B7280]">
                {(userData.spinHistories || []).length} records
              </span>
            </div>

            {userData.spinHistories?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs admin-table">
                  <thead>
                    <tr>
                      <th>Spun At</th>
                      <th>Prize Won</th>
                      <th>Prize Type</th>
                      <th>Value</th>
                      <th>Reward Status</th>
                      <th>Transaction ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userData.spinHistories.map((h: any) => (
                      <tr key={h.id}>
                        <td className="text-[#6B7280] whitespace-nowrap">
                          {new Date(h.createdAt).toLocaleString()}
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#111827]">
                              {h.prize?.name || h.resultLabel || 'Spin Prize'}
                            </span>
                            {h.prize?.displayLabel && (
                              <span className="text-[10px] text-[#6B7280] font-mono">
                                ({h.prize.displayLabel})
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`font-semibold text-[10px] px-2 py-0.5 rounded-full inline-block ${
                              h.prize?.prizeType === 'PHYSICAL'
                                ? 'bg-amber-50 text-amber-800 border border-amber-300'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {h.prize?.prizeType === 'PHYSICAL' ? 'BUMPER PHYSICAL' : 'CASH'}
                          </span>
                        </td>
                        <td className="font-bold text-[#111827] whitespace-nowrap">
                          PKR {Number(h.prizeValue || h.prize?.monetaryValue || 0).toLocaleString()}
                        </td>
                        <td>
                          <span
                            className={`font-semibold text-[10px] px-2.5 py-0.5 rounded-full inline-block ${
                              h.rewardStatus === 'CREDITED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : h.rewardStatus === 'PENDING_LEVEL_10'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {h.rewardStatus === 'PENDING_LEVEL_10'
                              ? 'Level 10 Dispatch'
                              : h.rewardStatus || 'Credited'}
                          </span>
                        </td>
                        <td className="font-mono text-[11px] text-[#6B7280]">
                          {h.transactionId || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[#6B7280] space-y-1">
                <Disc className="w-8 h-8 text-[#9CA3AF] mx-auto opacity-50" />
                <p className="font-semibold text-[#374151]">No spin history found</p>
                <p>This user has not spun the wheel yet.</p>
              </div>
            )}
          </div>
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
                  Audit Logging Reason (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Enter reason (e.g. Manual correction, task bonus reward, tier adjustment) - optional"
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
                  className="px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 active:scale-95 flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Confirm Points Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Profile Modal (Only changed fields are sent to backend) */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="admin-card p-6 w-full max-w-md bg-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#D9E4F2]">
              <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#2563EB]" /> Edit Member Profile: {userData.name}
              </h2>
              <button onClick={() => setEditModalOpen(false)} className="p-1 text-[#6B7280]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter full name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-white border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 font-medium text-[#111827] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  Phone Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 03001234567"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-white border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 font-mono text-[#111827] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  Account Status *
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full bg-white border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 font-medium text-[#111827] focus:outline-none"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  Audit Logging Reason (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Reason for profile update"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="w-full bg-white border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-[#111827] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 border border-[#D9E4F2] rounded-lg text-[#4B5563] font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2563EB] text-white font-semibold rounded-lg hover:bg-[#1D4ED8] active:scale-95 flex items-center gap-1.5 transition-all shadow-xs"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
