import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowDownLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export const DepositsPage: React.FC = () => {
  const { refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const queryAmount = searchParams.get('amount');

  const cachedInst = api.getCachedData<any>('/deposits/instructions');
  const cachedDeps = api.getCachedData<any>('/deposits');
  const [instructions, setInstructions] = useState<any>(cachedInst);
  const [deposits, setDeposits] = useState<any[]>(cachedDeps?.deposits || []);
  const [loading, setLoading] = useState(!cachedInst && !cachedDeps);

  const [method, setMethod] = useState<'EASYPAISA' | 'JAZZCASH' | 'BANK_TRANSFER'>('EASYPAISA');
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountReady, setAccountReady] = useState(false);
  const loadingTimerRef = React.useRef<any>(null);

  const [amount, setAmount] = useState<string>(queryAmount || '1000');
  const [trxRef, setTrxRef] = useState('');
  const [evidence, setEvidence] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const telegramUrl = (instructions?.supportTelegram || 'https://t.me/earnsheet_official').trim();

  const handleSelectMethod = (m: 'EASYPAISA' | 'JAZZCASH' | 'BANK_TRANSFER') => {
    setMethod(m);
    setAccountReady(false);
    setAccountLoading(true);
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
    }
    loadingTimerRef.current = setTimeout(() => {
      setAccountLoading(false);
      setAccountReady(true);
    }, 2000);
  };

  useEffect(() => {
    handleSelectMethod('EASYPAISA');
    return () => {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    };
  }, []);

  const handleGetAccount = () => {
    try {
      const opened = window.open(telegramUrl, '_blank', 'noopener,noreferrer');
      if (!opened || opened.closed || typeof opened.closed === 'undefined') {
        window.location.href = telegramUrl;
      }
    } catch {
      window.location.href = telegramUrl;
    }
  };

  const loadData = (silent = false) => {
    if (!silent && !instructions && deposits.length === 0) setLoading(true);
    Promise.all([api.getDepositInstructions(), api.getDeposits()])
      .then(([instRes, depRes]) => {
        setInstructions(instRes);
        setDeposits(depRes.deposits || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData(!!instructions);
  }, []);

  // Realtime Live Update Listener (Zero Reload Strategy)
  useEffect(() => {
    const handleLiveEvent = (e: any) => {
      const type = e.detail?.type;
      if (type === 'wallet' || type === 'notification' || type === 'command' || type === 'all') {
        api.invalidateCache('/deposits');
        loadData(true);
        refreshUser();
      }
    };
    window.addEventListener('royal_live_update', handleLiveEvent);
    window.addEventListener('royal_live_heartbeat', () => loadData(true));
    return () => {
      window.removeEventListener('royal_live_update', handleLiveEvent);
      window.removeEventListener('royal_live_heartbeat', () => loadData(true));
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid deposit amount');
      return;
    }
    if (!trxRef.trim()) {
      setError('Transaction Reference / ID is required');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.submitDeposit({
        amount: numAmount,
        paymentMethod: method,
        transactionReference: trxRef.trim(),
        proofEvidence: evidence.trim() || undefined,
      });

      setSuccess(res.message);
      setTrxRef('');
      setEvidence('');
      if (res.deposit) {
        setDeposits((prev) => [res.deposit, ...prev]);
      }
      refreshUser();
      loadData(true);
    } catch (err: any) {
      setError(err.message || 'Deposit submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const getMethodDisplayName = (m: 'EASYPAISA' | 'JAZZCASH' | 'BANK_TRANSFER') => {
    if (m === 'EASYPAISA') return 'Easypaisa';
    if (m === 'JAZZCASH') return 'JazzCash';
    return 'Bank Transfer';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
          <ArrowDownLeft className="w-7 h-7 text-[#1459E8]" /> Deposit Funds
        </h1>
        <p className="text-xs text-slate-300 mt-1">
          Add PKR balance to your wallet via Easypaisa, JazzCash, or online banking. Verified manually by administration.
        </p>
      </div>

      {queryAmount && (
        <div className="p-4 bg-gradient-to-r from-[#FFD45A]/15 via-[#071B3A] to-[#1459E8]/20 border border-[#FFD45A]/50 rounded-2xl text-xs shadow-md">
          <div className="space-y-0.5">
            <span className="font-bold text-[#FFD45A] block text-sm">
              Prepaid Task Balance Deposit: PKR {parseFloat(queryAmount).toLocaleString()}
            </span>
            <span className="text-slate-300">
              The required difference of <strong className="text-white font-bold">PKR {parseFloat(queryAmount).toLocaleString()}</strong> needed to unlock your prepaid task has been pre-filled below. Send the funds and submit your transaction ID to activate your task!
            </span>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-500/15 border border-red-500/40 rounded-2xl text-red-300 text-xs flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* 3 Available Payment Method Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {([
          { key: 'EASYPAISA', name: 'Easypaisa', subtitle: 'Mobile Wallet' },
          { key: 'JAZZCASH', name: 'JazzCash', subtitle: 'Mobile Account' },
          { key: 'BANK_TRANSFER', name: 'Bank Transfer', subtitle: 'Online Banking / IBAN' },
        ] as const).map(({ key, name, subtitle }) => {
          const isSelected = method === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleSelectMethod(key)}
              className={`royal-card p-4 rounded-2xl text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-[#2478FF] bg-[#1459E8]/20 shadow-lg shadow-[#1459E8]/20 ring-1 ring-[#2478FF]'
                  : 'hover:border-[#214B91] hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-white">{name}</span>
                <span
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-colors ${
                    isSelected ? 'border-[#22D3EE] bg-[#22D3EE]' : 'border-slate-500'
                  }`}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-[11px] text-slate-400">{subtitle}</p>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Available
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Account Loading (2 seconds) */}
      {accountLoading && (
        <div className="royal-card p-6 sm:p-8 rounded-3xl border border-[#2478FF]/50 bg-gradient-to-br from-[#0B2248] via-[#020B20] to-[#04132F] text-center space-y-4 shadow-xl animate-in fade-in duration-300">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#1459E8]/20 border border-[#2478FF]/40 flex items-center justify-center text-[#22D3EE]">
            <span className="w-7 h-7 border-3 border-[#2478FF]/30 border-t-[#22D3EE] rounded-full animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Checking Account Availability...</h3>
            <p className="text-xs text-slate-400">
              Allocating official receiving account for {getMethodDisplayName(method)}
            </p>
          </div>
          <div className="w-48 h-1.5 bg-[#020B20] rounded-full mx-auto overflow-hidden border border-[#214B91]/50">
            <div className="h-full bg-gradient-to-r from-[#1459E8] to-[#22D3EE] animate-pulse w-full" />
          </div>
        </div>
      )}

      {/* Account is Available & Get Account Option */}
      {!accountLoading && accountReady && (
        <div className="royal-card p-6 sm:p-8 rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-br from-[#041d1a] via-[#020B20] to-[#04132F] space-y-5 shadow-2xl shadow-emerald-500/10 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#214B91]/40">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-white">Account is Available</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                    Ready to Receive
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Official {getMethodDisplayName(method)} receiving account has been allocated and verified.
                </p>
              </div>
            </div>

            <div className="flex-shrink-0 sm:text-right">
              <span className="text-[11px] font-semibold text-slate-400 block">Selected Option</span>
              <span className="text-sm font-bold text-[#FFD45A] block">
                {getMethodDisplayName(method)}
              </span>
            </div>
          </div>

          <div className="p-4 bg-[#020B20] border border-[#214B91] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Verified Account Details Ready
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Click below to get your assigned receiving account details and proceed with your deposit.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGetAccount}
              className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#1459E8] via-[#2478FF] to-[#0088cc] hover:brightness-110 active:scale-[0.98] text-white font-black text-sm shadow-xl shadow-[#1459E8]/30 transition-all cursor-pointer whitespace-nowrap"
            >
              <span>Get Account</span>
              <ArrowDownLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </div>
      )}

      {/* Deposit Submission Form */}
      <div className="royal-card p-6 sm:p-8 rounded-3xl space-y-4">
        <h2 className="text-sm font-bold text-white">Submit Deposit Confirmation Reference</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Deposit Amount in PKR *
            </label>
            <input
              type="number"
              required
              min="1"
              step="any"
              placeholder="Enter deposit amount in PKR"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-[#020B20] border border-[#214B91] focus:border-[#2478FF] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Transaction ID / TID / Reference *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. EP-9876543210 or Bank Reference"
              value={trxRef}
              onChange={(e) => setTrxRef(e.target.value)}
              className="w-full bg-[#020B20] border border-[#214B91] focus:border-[#2478FF] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Supporting Proof / Sender Account (Optional)
            </label>
            <input
              type="text"
              placeholder="Sender phone / name or receipt reference"
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              className="w-full bg-[#020B20] border border-[#214B91] focus:border-[#2478FF] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-gradient-to-r from-[#1459E8] to-[#2478FF] hover:from-[#2478FF] hover:to-[#1459E8] text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" /> Submit Deposit Request
              </>
            )}
          </button>
        </form>
      </div>

      {/* User Deposit Requests History */}
      <div className="royal-card p-6 rounded-3xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#22D3EE]" /> Deposit Requests History
        </h2>

        {deposits.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#214B91]/50 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3">Method</th>
                  <th className="pb-3 px-3">Reference</th>
                  <th className="pb-3 px-3 text-right">Amount</th>
                  <th className="pb-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#214B91]/30">
                {deposits.map((dep) => (
                  <tr key={dep.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                      {new Date(dep.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-200">{dep.paymentMethod}</td>
                    <td className="py-3 px-3 text-mono text-slate-300 font-mono text-[11px]">{dep.transactionReference}</td>
                    <td className="py-3 px-3 text-right font-black text-white whitespace-nowrap">
                      PKR {dep.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          dep.status === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : dep.status === 'PENDING'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                            : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {dep.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-400">
            No deposit requests submitted yet.
          </div>
        )}
      </div>
    </div>
  );
};
