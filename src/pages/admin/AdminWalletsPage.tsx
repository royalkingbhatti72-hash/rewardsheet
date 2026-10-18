import React, { useState, useEffect } from 'react';
import { Wallet, Search, Plus, Minus, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { api } from '../../api/client';

export const AdminWalletsPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Balance Modal
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [amount, setAmount] = useState('500');
  const [actionType, setActionType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [reason, setReason] = useState('Audited administrative correction');
  const [notes, setNotes] = useState('');
  const [executing, setExecuting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadUsers = () => {
    setLoading(true);
    api.getAdminUsers({ search: search.trim(), limit: 30 })
      .then((res) => setUsers(res.users || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers();
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setMessage({ type: 'error', text: 'Enter a valid positive adjustment amount' });
      return;
    }

    setExecuting(true);
    setMessage(null);

    try {
      const res = await api.adjustUserBalance(selectedUser.id, {
        amount: numAmount,
        actionType,
        reason: reason.trim(),
        notes: notes.trim() || undefined,
      });
      setMessage({ type: 'success', text: res.message });
      setSelectedUser(null);
      loadUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Balance adjustment failed' });
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#111827]">Balance Management Desk</h1>
        <p className="text-xs text-[#6B7280] mt-0.5">
          Execute auditable balance adjustments. Every manual modification generates an immutable ledger transaction.
        </p>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-center justify-between ${
            message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="admin-card p-4">
        <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-md">
          <input
            type="text"
            placeholder="Search member by Name, Phone, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg px-3 py-1.5 text-xs text-[#111827] focus:outline-none h-9"
          />
          <button
            type="submit"
            className="px-4 py-1.5 bg-[#2563EB] text-white font-semibold text-xs rounded-lg hover:bg-[#1D4ED8] h-9"
          >
            Search
          </button>
        </form>
      </div>

      {/* Wallets Table */}
      <div className="admin-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-[#6B7280]">Loading member balances...</div>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs admin-table">
              <thead>
                <tr>
                  <th>Member Name</th>
                  <th>Phone Number</th>
                  <th>Referral Code</th>
                  <th>Current Balance</th>
                  <th>Account Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="font-semibold text-[#111827]">{u.name}</td>
                    <td className="font-mono text-[#4B5563]">{u.phone}</td>
                    <td className="font-mono text-[#2563EB] font-bold">{u.referralCode}</td>
                    <td className="font-bold text-[#111827]">PKR {u.walletBalance.toLocaleString()}</td>
                    <td>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.accountStatus === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {u.accountStatus}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setAmount('500');
                          setActionType('CREDIT');
                        }}
                        className="px-3 py-1 bg-[#2563EB] text-white font-semibold text-xs rounded-lg hover:bg-[#1D4ED8]"
                      >
                        Adjust Balance
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-xs text-[#6B7280]">No users found.</div>
        )}
      </div>

      {/* Adjustment Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="admin-card p-6 w-full max-w-md bg-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#D9E4F2]">
              <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#2563EB]" /> Adjust Balance: {selectedUser.name}
              </h2>
              <button onClick={() => setSelectedUser(null)} className="p-1 text-[#6B7280]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#F8FAFD] border border-[#D9E4F2] rounded-lg text-xs flex justify-between">
              <span className="text-[#6B7280]">Current Available Balance:</span>
              <strong className="text-[#111827] font-bold">PKR {selectedUser.walletBalance.toLocaleString()}</strong>
            </div>

            <form onSubmit={handleAdjustBalance} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#374151] mb-1">Adjustment Direction</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActionType('CREDIT')}
                    className={`py-2 rounded-lg font-bold border text-xs ${
                      actionType === 'CREDIT'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'border-[#D9E4F2] text-[#4B5563]'
                    }`}
                  >
                    + Add Balance (Credit)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionType('DEBIT')}
                    className={`py-2 rounded-lg font-bold border text-xs ${
                      actionType === 'DEBIT'
                        ? 'bg-red-50 border-red-300 text-red-800'
                        : 'border-[#D9E4F2] text-[#4B5563]'
                    }`}
                  >
                    - Deduct Balance (Debit)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">Amount in PKR *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2 font-bold text-sm text-[#111827] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">Audit Reason (Required) *</label>
                <textarea
                  rows={2}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2 text-[#111827] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 border border-[#D9E4F2] rounded-lg text-[#4B5563] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={executing}
                  className="px-4 py-2 bg-[#2563EB] text-white font-semibold rounded-lg hover:bg-[#1D4ED8]"
                >
                  {executing ? 'Executing...' : 'Confirm Balance Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
