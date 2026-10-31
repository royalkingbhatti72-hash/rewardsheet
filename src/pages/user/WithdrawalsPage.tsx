import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Send,
  Wallet,
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export const WithdrawalsPage: React.FC = () => {
  const { wallet, refreshUser } = useAuth();
  const cachedWithdrawals = api.getCachedData<any>('/withdrawals');
  const [withdrawals, setWithdrawals] = useState<any[]>(cachedWithdrawals?.withdrawals || []);
  const [withdrawalQuota, setWithdrawalQuota] = useState<any>(cachedWithdrawals?.withdrawalQuota || null);
  const [historyLoading, setHistoryLoading] = useState(!cachedWithdrawals);
  const [minWithdrawal, setMinWithdrawal] = useState(1000);

  const [method, setMethod] = useState<'EASYPAISA' | 'JAZZCASH' | 'BANK_TRANSFER'>('EASYPAISA');
  const [amount, setAmount] = useState<string>('1000');
  const [recipientName, setRecipientName] = useState('');
  const [recipientAccount, setRecipientAccount] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const exactAvailable = withdrawalQuota
    ? withdrawalQuota.maxWithdrawableAmount
    : (wallet?.availableBalance || 0);

  const loadData = () => {
    api.getWithdrawals()
      .then((wRes) => {
        setWithdrawals(wRes.withdrawals || []);
        if (wRes.withdrawalQuota) setWithdrawalQuota(wRes.withdrawalQuota);
      })
      .catch((err) => console.error(err))
      .finally(() => setHistoryLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Realtime Live Update Listener (Zero Reload Strategy)
  useEffect(() => {
    const handleLiveEvent = (e: any) => {
      const type = e.detail?.type;
      if (type === 'wallet' || type === 'all' || type === 'refresh') {
        loadData();
        refreshUser();
      }
    };
    window.addEventListener('royal_live_update', handleLiveEvent);
    return () => {
      window.removeEventListener('royal_live_update', handleLiveEvent);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (exactAvailable <= 0) {
      setError(
        withdrawalQuota && withdrawalQuota.eligiblePercent === 0
          ? 'Withdrawals unlock progressively per level. Complete all 10 tasks in Level 1 to unlock your withdrawal quota!'
          : 'You do not have any withdrawable balance currently available.'
      );
      return;
    }
    if (!recipientName.trim() || !recipientAccount.trim()) {
      setError('Recipient Name and Account Number are required');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.submitWithdrawal({
        amount: exactAvailable,
        paymentMethod: method,
        recipientName: recipientName.trim(),
        recipientAccount: recipientAccount.trim(),
        notes: notes.trim() || undefined,
      });

      setSuccess(res.message);
      setRecipientName('');
      setRecipientAccount('');
      setNotes('');
      if (res.withdrawal) {
        setWithdrawals((prev) => [res.withdrawal, ...prev]);
      }
      refreshUser();
      loadData();
    } catch (err: any) {
      setError(err.message || 'Withdrawal request failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {success && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-500/15 border border-red-500/40 rounded-2xl text-red-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Available Balance Quick Card with Level Quota */}
      <div className="royal-card p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-400 block font-medium">Total Account Balance:</span>
          <span className="text-2xl font-black text-[#FFD45A] block mt-0.5">
            PKR {(wallet?.availableBalance || 0).toLocaleString()}
          </span>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-xs font-bold text-[#10D6A0] bg-[#10D6A0]/15 border border-[#10D6A0]/30 px-2.5 py-0.5 rounded-full">
              Available for Withdrawal: PKR {exactAvailable.toLocaleString()} ({withdrawalQuota ? withdrawalQuota.eligiblePercent : 10}% Quota)
            </span>
          </div>
          <p className="text-[11px] text-[#A6C4FF] mt-2 leading-relaxed">
            💡 {withdrawalQuota?.withdrawalNotice || 'Complete Level 1 to unlock the withdrawal panel for the withdrawal'}
          </p>
        </div>
      </div>

      {/* Withdrawal Form */}
      <div className="royal-card p-6 sm:p-8 rounded-3xl space-y-4">
        <h2 className="text-sm font-bold text-white">Enter Payout Destination Details</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Payout Channel
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['EASYPAISA', 'JAZZCASH', 'BANK_TRANSFER'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                    method === m
                      ? 'bg-[#1459E8] border-[#2478FF] text-white shadow-md'
                      : 'bg-[#020B20] border-[#214B91] text-slate-400 hover:text-white'
                  }`}
                >
                  {m === 'BANK_TRANSFER' ? 'Bank Transfer' : m === 'EASYPAISA' ? 'Easypaisa' : 'JazzCash'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Withdrawal Amount in PKR (Exact Available Balance) *
            </label>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={`PKR ${exactAvailable.toLocaleString()}`}
                className="w-full bg-[#020B20]/90 border border-[#214B91] rounded-xl px-4 py-2.5 text-base font-black text-[#FFD45A] focus:outline-none cursor-not-allowed"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Withdrawal requests are processed exclusively for the exact available balance of PKR {exactAvailable.toLocaleString()}.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Recipient Account Title / Name *
            </label>
            <input
              type="text"
              required
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="w-full bg-[#020B20] border border-[#214B91] focus:border-[#2478FF] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {method === 'BANK_TRANSFER' ? 'Bank Name & Account / IBAN Number *' : 'Mobile Account Number *'}
            </label>
            <input
              type="text"
              required
              value={recipientAccount}
              onChange={(e) => setRecipientAccount(e.target.value)}
              className="w-full bg-[#020B20] border border-[#214B91] focus:border-[#2478FF] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none font-mono"
            />
          </div>



          <button
            type="submit"
            disabled={submitting || exactAvailable <= 0}
            className="w-full py-3 bg-gradient-to-r from-[#FFD45A] to-amber-400 hover:from-amber-400 hover:to-[#FFD45A] text-[#020B20] font-black text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <span className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" /> Withdraw Exact Available (PKR {exactAvailable.toLocaleString()})
              </>
            )}
          </button>
        </form>
      </div>

      {/* User Withdrawal Requests History */}
      <div className="royal-card p-6 rounded-3xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#2478FF]" /> Withdrawal History
        </h2>

        {historyLoading && withdrawals.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            Loading withdrawal records...
          </div>
        ) : withdrawals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#214B91]/50 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3">Method</th>
                  <th className="pb-3 px-3">Recipient</th>
                  <th className="pb-3 px-3 text-right">Amount</th>
                  <th className="pb-3 px-3 text-center">Approval</th>
                  <th className="pb-3 px-3 text-center">Payment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#214B91]/30">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                      {new Date(w.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-200">{w.paymentMethod}</td>
                    <td className="py-3 px-3 text-slate-300">
                      <span className="font-semibold block">{w.recipientName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{w.recipientAccount}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-black text-white whitespace-nowrap">
                      PKR {w.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          w.approvalStatus === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : w.approvalStatus === 'PENDING'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                            : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {w.approvalStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          w.paymentStatus === 'PAID'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40'
                            : w.paymentStatus === 'PROCESSING'
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-700/50 text-slate-400'
                        }`}
                      >
                        {w.paymentStatus.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-400">
            No withdrawal requests submitted yet.
          </div>
        )}
      </div>
    </div>
  );
};
