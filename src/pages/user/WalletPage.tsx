import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Crown,
  Clock,
  TrendingUp,
  Receipt,
  CheckCircle2,
  Lock,
  Zap,
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export const WalletPage: React.FC = () => {
  const { wallet: authWallet, updateWallet } = useAuth();
  const cachedWallet = api.getCachedData<any>('/wallet')?.wallet || authWallet;
  const cachedTx = api.getCachedData<any>('/wallet/transactions?page=1&limit=15');
  const [wallet, setWallet] = useState<any>(cachedWallet);
  const [transactions, setTransactions] = useState<any[]>(cachedTx?.transactions || []);
  const [loading, setLoading] = useState(!cachedWallet && !cachedTx);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(cachedTx?.pagination?.totalPages || 1);

  const loadData = (p = 1) => {
    if (!wallet && transactions.length === 0) setLoading(true);
    Promise.all([api.getWallet(), api.getTransactions(p, 15)])
      .then(([walletRes, txRes]) => {
        setWallet(walletRes.wallet);
        if (walletRes?.wallet) {
          updateWallet(walletRes.wallet);
        }
        setTransactions(txRes.transactions || []);
        setTotalPages(txRes.pagination?.totalPages || 1);
        setPage(p);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData(1);
  }, []);

  // Realtime Live Update Listener (Zero Reload Strategy)
  useEffect(() => {
    const handleLiveEvent = (e: any) => {
      const type = e.detail?.type;
      const payload = e.detail?.payload;
      if (type === 'wallet' && payload) {
        setWallet((prev: any) => (prev ? { ...prev, ...payload } : prev));
        updateWallet(payload);
      }
      if (type === 'wallet' || type === 'all' || type === 'refresh') {
        api.invalidateCache('/wallet');
        loadData(page);
      }
    };

    window.addEventListener('royal_live_update', handleLiveEvent);
    return () => {
      window.removeEventListener('royal_live_update', handleLiveEvent);
    };
  }, [page]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Wallet className="w-7 h-7 text-[#FFD45A]" /> Wallet & Financial Ledger
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/app/deposits"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1459E8] hover:bg-[#2478FF] text-white text-xs font-bold transition-all shadow-md shadow-[#1459E8]/30"
          >
            <ArrowDownLeft className="w-4 h-4" /> Deposit
          </Link>
          <Link
            to="/app/withdrawals"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FFD45A] to-amber-400 text-[#020B20] text-xs font-black transition-all shadow-md shadow-[#FFD45A]/20"
          >
            <ArrowUpRight className="w-4 h-4" /> Withdraw
          </Link>
        </div>
      </div>

      {/* Balance Breakdown Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="royal-card p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 block font-medium">Available</span>
          <span className="text-lg font-black text-[#FFD45A] block mt-1">
            PKR {(wallet?.availableBalance || 0).toLocaleString()}
          </span>
          <span className="text-[9px] text-slate-500">Ready to withdraw</span>
        </div>

        <div className="royal-card p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 block font-medium">Reserved</span>
          <span className="text-lg font-black text-white block mt-1">
            PKR {(wallet?.pendingBalance || 0).toLocaleString()}
          </span>
          <span className="text-[9px] text-slate-500">In pending review</span>
        </div>

        <div className="royal-card p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 block font-medium">Total Earned</span>
          <span className="text-lg font-black text-emerald-400 block mt-1">
            PKR {(wallet?.totalEarned || 0).toLocaleString()}
          </span>
          <span className="text-[9px] text-slate-500">Rewards + bonuses</span>
        </div>

        <div className="royal-card p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 block font-medium">Total Deposited</span>
          <span className="text-lg font-black text-[#22D3EE] block mt-1">
            PKR {(wallet?.totalDeposited || 0).toLocaleString()}
          </span>
          <span className="text-[9px] text-slate-500">Credited deposits</span>
        </div>

        <div className="royal-card p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 block font-medium">Total Withdrawn</span>
          <span className="text-lg font-black text-blue-400 block mt-1">
            PKR {(wallet?.totalWithdrawn || 0).toLocaleString()}
          </span>
          <span className="text-[9px] text-slate-500">Completed payouts</span>
        </div>

        <div className="royal-card p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 block font-medium">Unlock Fees</span>
          <span className="text-lg font-black text-amber-300 block mt-1">
            PKR {(wallet?.totalUnlockFees || 0).toLocaleString()}
          </span>
          <span className="text-[9px] text-slate-500">VIP task fees</span>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="royal-card p-6 rounded-3xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Receipt className="w-4 h-4 text-[#2478FF]" /> Immutable Financial Ledger
        </h2>

        {loading && transactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading ledger records...</div>
        ) : transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#214B91]/50 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3">Type</th>
                  <th className="pb-3 px-3">Description</th>
                  <th className="pb-3 px-3 text-right">Amount</th>
                  <th className="pb-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#214B91]/30">
                {transactions.map((tx: any) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-3">
                        <span className="bg-[#1459E8]/20 border border-[#214B91] text-[#22D3EE] font-semibold px-2 py-0.5 rounded text-[10px]">
                          {tx.transactionType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-200">
                        {tx.reason}
                        {tx.notes && <span className="block text-[10px] text-slate-400 mt-0.5">{tx.notes}</span>}
                      </td>
                      <td className="py-3 px-3 text-right font-bold whitespace-nowrap">
                        <span className={isPositive ? 'text-emerald-400' : 'text-slate-300'}>
                          {isPositive ? '+' : ''}PKR {Math.abs(tx.amount).toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`font-semibold text-[10px] px-2 py-0.5 rounded-full ${
                            tx.status === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-blue-500/10 text-blue-400'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-xs text-slate-400">
            No financial transactions recorded on this account yet.
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-[#214B91]/40 text-xs">
            <button
              onClick={() => loadData(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg bg-[#020B20] border border-[#214B91] text-slate-300 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-slate-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => loadData(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg bg-[#020B20] border border-[#214B91] text-slate-300 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
