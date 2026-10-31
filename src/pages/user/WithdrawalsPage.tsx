import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Lock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export const WithdrawalsPage: React.FC = () => {
  const { wallet, refreshUser } = useAuth();
  const cachedWithdrawals = api.getCachedData<any>('/withdrawals');
  const [withdrawals, setWithdrawals] = useState<any[]>(cachedWithdrawals?.withdrawals || []);
  const [withdrawalQuota, setWithdrawalQuota] = useState<any>(cachedWithdrawals?.withdrawalQuota || null);
  const [historyLoading, setHistoryLoading] = useState(!cachedWithdrawals);

  const [method, setMethod] = useState<'EASYPAISA' | 'JAZZCASH' | 'BANK_TRANSFER'>('EASYPAISA');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientAccount, setRecipientAccount] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const availableBalance = wallet?.availableBalance || 0;
  const isLocked = Boolean(withdrawalQuota?.isLocked);
  const isUnrestricted = Boolean(withdrawalQuota?.isUnrestricted);
  const stage = withdrawalQuota?.stage || (isLocked ? 'LOCKED_BEFORE_L1' : 'LEVEL_1');

  const exactAvailable = isLocked
    ? 0
    : withdrawalQuota
    ? withdrawalQuota.maxWithdrawableAmount
    : availableBalance;

  const loadData = () => {
    api.getWithdrawals()
      .then((wRes) => {
        setWithdrawals(wRes.withdrawals || []);
        if (wRes.withdrawalQuota) {
          setWithdrawalQuota(wRes.withdrawalQuota);
          if (wRes.withdrawalQuota.isUnrestricted && !customAmount) {
            setCustomAmount(wRes.withdrawalQuota.availableBalance?.toString() || '');
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setHistoryLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync custom amount if unrestricted
  useEffect(() => {
    if (isUnrestricted && !customAmount && availableBalance > 0) {
      setCustomAmount(availableBalance.toString());
    }
  }, [isUnrestricted, availableBalance]);

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

  const handlePercentageSelect = (pct: number) => {
    if (availableBalance <= 0) return;
    const computed = Math.max(1, Math.round(availableBalance * pct));
    setCustomAmount(computed.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLocked) {
      setError(withdrawalQuota?.withdrawalNotice || 'Withdrawals are currently locked for your account.');
      return;
    }

    if (availableBalance <= 0) {
      setError('You do not have any available balance to withdraw.');
      return;
    }

    if (!recipientName.trim() || !recipientAccount.trim()) {
      setError('Recipient Name and Account Number are required');
      return;
    }

    let submitAmount = exactAvailable;

    if (isUnrestricted) {
      const parsed = parseFloat(customAmount);
      if (isNaN(parsed) || parsed <= 0) {
        setError('Please enter a valid positive withdrawal amount.');
        return;
      }
      if (parsed > availableBalance) {
        setError(`Withdrawal amount cannot exceed your available balance of PKR ${availableBalance.toLocaleString()}.`);
        return;
      }
      submitAmount = parsed;
    } else {
      submitAmount = exactAvailable;
      if (submitAmount <= 0) {
        setError('Withdrawable balance is 0.');
        return;
      }
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.submitWithdrawal({
        amount: submitAmount,
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

      {/* Available Balance Quick Card with Status */}
      <div className="royal-card p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-400 block font-medium">Total Account Balance:</span>
          <span className="text-2xl font-black text-[#FFD45A] block mt-0.5">
            PKR {availableBalance.toLocaleString()}
          </span>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            {isLocked ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-500/15 border border-red-500/30 px-3 py-1 rounded-full">
                <Lock className="w-3.5 h-3.5" /> Withdrawal Locked
              </span>
            ) : isUnrestricted ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#10D6A0] bg-[#10D6A0]/15 border border-[#10D6A0]/30 px-3 py-1 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-[#FFD45A]" /> Unrestricted Withdrawals Unlocked
              </span>
            ) : stage === 'LEVEL_1' ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#10D6A0] bg-[#10D6A0]/15 border border-[#10D6A0]/30 px-3 py-1 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" /> Level 1 Reward: PKR {exactAvailable.toLocaleString()} (100% Quota)
              </span>
            ) : stage === 'LEVEL_2' ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-3 py-1 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" /> Level 2 Reward: Full Balance Request (10% Disbursal)
              </span>
            ) : (
              <span className="text-xs font-bold text-[#10D6A0] bg-[#10D6A0]/15 border border-[#10D6A0]/30 px-2.5 py-0.5 rounded-full">
                Available for Withdrawal: PKR {exactAvailable.toLocaleString()}
              </span>
            )}
          </div>

          <p className="text-[11px] text-[#A6C4FF] mt-2 leading-relaxed">
            💡 {withdrawalQuota?.withdrawalNotice || 'Complete Level 1 to unlock the withdrawal panel for the withdrawal'}
          </p>
        </div>

        {isLocked && (
          <Link
            to="/app/tasks"
            className="self-start sm:self-center px-4 py-2 rounded-xl bg-gradient-to-r from-[#1459E8] to-[#2478FF] hover:from-[#2478FF] hover:to-[#1459E8] text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
          >
            <span>Complete Tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Main Withdrawal Panel */}
      {isLocked ? (
        <div className="royal-card p-8 rounded-3xl text-center space-y-4 border border-red-500/20 bg-[#071936]/80">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
            <Lock className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-base font-bold text-white">Withdrawal Panel is Locked</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {withdrawalQuota?.withdrawalNotice ||
                'Complete the current level tasks to unlock the withdrawal panel and withdraw your earnings.'}
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/app/tasks"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1459E8] hover:bg-[#2478FF] text-white font-bold text-xs shadow-lg transition-all"
            >
              <span>Go to Task Panel</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="royal-card p-6 sm:p-8 rounded-3xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#214B91]/40">
            <h2 className="text-sm font-bold text-white">Enter Payout Destination Details</h2>
            {isUnrestricted && (
              <span className="text-[10px] font-bold text-[#10D6A0] bg-[#10D6A0]/15 border border-[#10D6A0]/30 px-2 py-0.5 rounded-md uppercase tracking-wider">
                Unrestricted Mode
              </span>
            )}
          </div>

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

            {/* Withdrawal Amount Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {isUnrestricted
                  ? 'Withdrawal Amount (PKR) *'
                  : 'Withdrawal Amount in PKR (Exact Available Balance) *'}
              </label>

              {isUnrestricted ? (
                <div className="space-y-2">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#FFD45A]">
                      PKR
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={availableBalance}
                      step="any"
                      required
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="Enter amount to withdraw"
                      className="w-full bg-[#020B20] border border-[#214B91] focus:border-[#2478FF] rounded-xl pl-14 pr-4 py-2.5 text-base font-black text-white focus:outline-none"
                    />
                  </div>
                  {/* Quick percentage pills */}
                  <div className="flex items-center gap-2">
                    {[
                      { label: '25%', pct: 0.25 },
                      { label: '50%', pct: 0.5 },
                      { label: '75%', pct: 0.75 },
                      { label: '100% (Max)', pct: 1.0 },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => handlePercentageSelect(btn.pct)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#061633] border border-[#173C73] text-slate-300 hover:text-white hover:border-[#3978FF]/60 transition-all"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Enter any amount between PKR 1 and PKR {availableBalance.toLocaleString()}. Level 3 allows zero-restriction withdrawals.
                  </p>
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    readOnly
                    value={`PKR ${exactAvailable.toLocaleString()}`}
                    className="w-full bg-[#020B20]/90 border border-[#214B91] rounded-xl px-4 py-2.5 text-base font-black text-[#FFD45A] focus:outline-none cursor-not-allowed"
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    {stage === 'LEVEL_1' && (
                      <>
                        Withdrawal requests for Level 1 are for your total account balance of{' '}
                        <strong className="text-white">PKR {exactAvailable.toLocaleString()}</strong>.
                        Submitting this withdrawal will unlock Level 2 tasks!
                      </>
                    )}
                    {stage === 'LEVEL_2' && (
                      <>
                        Level 2 completion requires requesting your total account balance of{' '}
                        <strong className="text-white">PKR {exactAvailable.toLocaleString()}</strong>.
                        Upon admin approval, you will receive a{' '}
                        <strong className="text-[#10D6A0]">10% payout (PKR {(exactAvailable * 0.1).toLocaleString()})</strong>{' '}
                        and the remaining{' '}
                        <strong className="text-[#FFD45A]">90% (PKR {(exactAvailable * 0.9).toLocaleString()})</strong>{' '}
                        will return to your balance.
                      </>
                    )}
                  </p>
                </div>
              )}
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
              disabled={submitting || availableBalance <= 0}
              className="w-full py-3 bg-gradient-to-r from-[#FFD45A] to-amber-400 hover:from-amber-400 hover:to-[#FFD45A] text-[#020B20] font-black text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <span className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              ) : isUnrestricted ? (
                <>
                  <Send className="w-4 h-4" /> Withdraw Amount (PKR {parseFloat(customAmount || '0').toLocaleString()})
                </>
              ) : stage === 'LEVEL_1' ? (
                <>
                  <Send className="w-4 h-4" /> Withdraw Level 1 Balance (PKR {exactAvailable.toLocaleString()})
                </>
              ) : stage === 'LEVEL_2' ? (
                <>
                  <Send className="w-4 h-4" /> Request Level 2 Balance (PKR {exactAvailable.toLocaleString()})
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Withdraw Available Balance (PKR {exactAvailable.toLocaleString()})
                </>
              )}
            </button>
          </form>
        </div>
      )}

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
                    <td className="py-3 px-3 font-semibold text-slate-200">
                      {w.paymentMethod}
                      {w.notes?.includes('[LEVEL_2_WITHDRAWAL]') && (
                        <span className="block text-[9px] text-purple-400 font-bold">Level 2 (10% Payout)</span>
                      )}
                    </td>
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
