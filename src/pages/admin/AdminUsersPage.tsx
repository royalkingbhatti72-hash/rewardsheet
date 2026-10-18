import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  KeyRound,
  Wallet,
  Eye,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  X,
  Filter,
} from 'lucide-react';
import { api } from '../../api/client';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals state
  const [resetModalUser, setResetModalUser] = useState<any | null>(null);
  const [tempPassword, setTempPassword] = useState('TempPass2026!');
  const [resetReason, setResetReason] = useState('Customer support verified identity request');
  const [resetLoading, setResetLoading] = useState(false);

  const [balanceModalUser, setBalanceModalUser] = useState<any | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>('500');
  const [adjustType, setAdjustType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [adjustReason, setAdjustReason] = useState('Promotional bonus reward');
  const [adjustLoading, setAdjustLoading] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadUsers = (p = 1) => {
    setLoading(true);
    api.getAdminUsers({ search: search.trim(), status, page: p, limit: 15 })
      .then((res) => {
        setUsers(res.users || []);
        setTotalPages(res.pagination?.totalPages || 1);
        setPage(p);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers(1);
  }, [status]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers(1);
  };

  const handleToggleStatus = async (user: any) => {
    const newStatus = user.accountStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.updateUserStatus(user.id, newStatus, `Admin manual status toggle to ${newStatus}`);
      setMessage({ type: 'success', text: `User status changed to ${newStatus}` });
      loadUsers(page);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Status update failed' });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser) return;
    setResetLoading(true);
    try {
      const res = await api.resetUserPassword(resetModalUser.id, {
        temporaryPassword: tempPassword,
        requireChangeOnLogin: true,
        reason: resetReason,
      });
      setMessage({ type: 'success', text: res.message });
      setResetModalUser(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Reset failed' });
    } finally {
      setResetLoading(false);
    }
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!balanceModalUser) return;
    const numAmount = parseFloat(adjustAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setMessage({ type: 'error', text: 'Enter a valid positive adjustment amount' });
      return;
    }
    setAdjustLoading(true);
    try {
      const res = await api.adjustUserBalance(balanceModalUser.id, {
        amount: numAmount,
        actionType: adjustType,
        reason: adjustReason,
      });
      setMessage({ type: 'success', text: res.message });
      setBalanceModalUser(null);
      loadUsers(page);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Balance adjustment failed' });
    } finally {
      setAdjustLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#111827]">Member Management</h1>
        <p className="text-xs text-[#6B7280] mt-0.5">
          View member accounts, reset passwords with audit logging, and perform balance adjustments.
        </p>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="admin-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Name, Phone, or Referral Code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#111827] focus:outline-none h-9"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 bg-[#2563EB] text-white font-semibold text-xs rounded-lg hover:bg-[#1D4ED8] transition-colors h-9"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-white border border-[#D9E4F2] rounded-lg px-3 py-1.5 text-xs text-[#111827] focus:outline-none h-9"
          >
            <option value="">All Account Statuses</option>
            <option value="ACTIVE">Active Accounts</option>
            <option value="SUSPENDED">Suspended Accounts</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="admin-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-[#6B7280]">Loading users...</div>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs admin-table">
              <thead>
                <tr>
                  <th>Member Name</th>
                  <th>Phone</th>
                  <th>Referral Code</th>
                  <th>Approved Tasks</th>
                  <th>Wallet Balance</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="font-semibold text-[#111827]">
                      <Link
                        to={`/adminpanal/users/${u.id}`}
                        className="hover:text-[#2563EB] hover:underline"
                      >
                        {u.name}
                      </Link>
                      <span className="block text-[10px] text-[#6B7280] font-mono">
                        ID: {u.id.slice(-6)}
                      </span>
                    </td>
                    <td className="font-mono text-[#4B5563]">{u.phone}</td>
                    <td className="font-mono font-bold text-[#2563EB]">{u.referralCode}</td>
                    <td>
                      <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded text-[11px]">
                        {u.approvedTasksCount} / 100
                      </span>
                    </td>
                    <td className="font-bold text-[#111827]">
                      PKR {u.walletBalance.toLocaleString()}
                    </td>
                    <td>
                      <span
                        className={`font-semibold text-[10px] px-2 py-0.5 rounded-full ${
                          u.accountStatus === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {u.accountStatus}
                      </span>
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/adminpanal/users/${u.id}`}
                          className="p-1.5 rounded-md hover:bg-[#F8FAFD] text-[#4B5563] hover:text-[#2563EB]"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setBalanceModalUser(u)}
                          className="p-1.5 rounded-md hover:bg-emerald-50 text-[#4B5563] hover:text-emerald-700"
                          title="Adjust Balance"
                        >
                          <Wallet className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setResetModalUser(u)}
                          className="p-1.5 rounded-md hover:bg-blue-50 text-[#4B5563] hover:text-[#2563EB]"
                          title="Reset Password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`p-1.5 rounded-md text-xs font-semibold ${
                            u.accountStatus === 'ACTIVE'
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={u.accountStatus === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                        >
                          {u.accountStatus === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-xs text-[#6B7280]">No users found matching query.</div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#D9E4F2] flex items-center justify-between text-xs text-[#4B5563]">
            <button
              onClick={() => loadUsers(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="px-3 py-1 rounded bg-[#F8FAFD] border border-[#D9E4F2] disabled:opacity-40"
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => loadUsers(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 rounded bg-[#F8FAFD] border border-[#D9E4F2] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Password Reset Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="admin-card p-6 w-full max-w-md bg-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#D9E4F2]">
              <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#2563EB]" /> Reset Password: {resetModalUser.name}
              </h2>
              <button onClick={() => setResetModalUser(null)} className="p-1 text-[#6B7280]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  Temporary Password *
                </label>
                <input
                  type="text"
                  required
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  className="w-full bg-white border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2 font-mono text-[#111827] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  Audit Logging Reason *
                </label>
                <textarea
                  rows={2}
                  required
                  value={resetReason}
                  onChange={(e) => setResetReason(e.target.value)}
                  className="w-full bg-white border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2 text-[#111827] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-4 py-2 border border-[#D9E4F2] rounded-lg text-[#4B5563] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-4 py-2 bg-[#2563EB] text-white font-semibold rounded-lg hover:bg-[#1D4ED8]"
                >
                  {resetLoading ? 'Resetting...' : 'Confirm Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Balance Adjustment Modal */}
      {balanceModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="admin-card p-6 w-full max-w-md bg-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#D9E4F2]">
              <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#2563EB]" /> Adjust Balance: {balanceModalUser.name}
              </h2>
              <button onClick={() => setBalanceModalUser(null)} className="p-1 text-[#6B7280]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#F8FAFD] border border-[#D9E4F2] rounded-lg text-xs flex justify-between">
              <span className="text-[#6B7280]">Current Available Balance:</span>
              <strong className="text-[#111827] font-bold">
                PKR {balanceModalUser.walletBalance.toLocaleString()}
              </strong>
            </div>

            <form onSubmit={handleAdjustBalance} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  Action Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('CREDIT')}
                    className={`py-2 rounded-lg font-bold border text-xs ${
                      adjustType === 'CREDIT'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'border-[#D9E4F2] text-[#4B5563]'
                    }`}
                  >
                    + Credit Funds
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('DEBIT')}
                    className={`py-2 rounded-lg font-bold border text-xs ${
                      adjustType === 'DEBIT'
                        ? 'bg-red-50 border-red-300 text-red-800'
                        : 'border-[#D9E4F2] text-[#4B5563]'
                    }`}
                  >
                    - Debit Funds
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  Adjustment Amount in PKR *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full bg-white border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2 font-bold text-sm text-[#111827] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  Audit Logging Reason (Strictly Required) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-white border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2 text-[#111827] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBalanceModalUser(null)}
                  className="px-4 py-2 border border-[#D9E4F2] rounded-lg text-[#4B5563] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustLoading}
                  className="px-4 py-2 bg-[#2563EB] text-white font-semibold rounded-lg hover:bg-[#1D4ED8]"
                >
                  {adjustLoading ? 'Executing...' : 'Confirm Balance Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
