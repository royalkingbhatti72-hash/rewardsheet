import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowDownLeft,
  Crown,
  CheckCircle2,
  AlertCircle,
  Copy,
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
  const [amount, setAmount] = useState<string>(queryAmount || '1000');
  const [trxRef, setTrxRef] = useState('');
  const [evidence, setEvidence] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

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
      await refreshUser();
      loadData();
    } catch (err: any) {
      setError(err.message || 'Deposit submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !instructions && deposits.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-[#1459E8]/30 border-t-[#FFD45A] rounded-full animate-spin" />
      </div>
    );
  }

  const selectedMethodInfo = instructions?.methods?.[method];

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
        <div className="p-4 bg-red-500/15 border border-red-500/40 rounded-2xl text-red-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Payment Method Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(['EASYPAISA', 'JAZZCASH', 'BANK_TRANSFER'] as const).map((m) => {
          const isSelected = method === m;
          const info = instructions?.methods?.[m];
          return (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={`royal-card p-4 rounded-2xl text-left transition-all ${
                isSelected
                  ? 'border-[#2478FF] bg-[#1459E8]/20 shadow-lg shadow-[#1459E8]/20'
                  : 'hover:border-[#214B91]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-white">{info?.name || m}</span>
                <span className={`w-3.5 h-3.5 rounded-full border-2 ${isSelected ? 'border-[#22D3EE] bg-[#22D3EE]' : 'border-slate-500'}`} />
              </div>
              <p className="text-[11px] text-slate-400">Manual Transfer & Verification</p>
            </button>
          );
        })}
      </div>

      {/* Receiving Account Instructions Box */}
      {selectedMethodInfo && (
        <div className="royal-card p-6 rounded-3xl border border-[#214B91]/80 space-y-4">
          <h2 className="text-sm font-bold text-[#FFD45A] uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Official Receiving Account Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-[#020B20] border border-[#214B91] rounded-2xl flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Account Title</span>
                <span className="font-bold text-white text-sm">{selectedMethodInfo.title}</span>
              </div>
            </div>

            <div className="p-3.5 bg-[#020B20] border border-[#214B91] rounded-2xl flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">
                  {method === 'BANK_TRANSFER' ? 'Account Number / IBAN' : 'Mobile Account Number'}
                </span>
                <span className="font-bold text-[#FFD45A] text-sm font-mono">
                  {selectedMethodInfo.account || selectedMethodInfo.accountNumber || selectedMethodInfo.iban}
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    selectedMethodInfo.account || selectedMethodInfo.accountNumber || selectedMethodInfo.iban,
                    'account'
                  )
                }
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
                title="Copy Number"
              >
                {copiedKey === 'account' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {method === 'BANK_TRANSFER' && selectedMethodInfo.iban && (
            <div className="p-3.5 bg-[#020B20] border border-[#214B91] rounded-2xl flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Bank & IBAN</span>
                <span className="font-bold text-white block">{selectedMethodInfo.bankName}</span>
                <span className="font-mono text-[#22D3EE] text-xs">{selectedMethodInfo.iban}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(selectedMethodInfo.iban, 'iban')}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
              >
                {copiedKey === 'iban' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          )}

          <p className="text-xs text-slate-300 leading-relaxed pt-1">
            {selectedMethodInfo.instructions} You can deposit any amount in PKR.
          </p>
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
              placeholder="Sender phone / name or receipt image reference"
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
