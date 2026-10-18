import React, { useState, useEffect } from 'react';
import { Receipt, Search, Filter } from 'lucide-react';
import { api } from '../../api/client';

export const AdminTransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadTransactions = (p = 1) => {
    setLoading(true);
    api.getAdminTransactions({ type: typeFilter || undefined, page: p, limit: 20 })
      .then((res) => {
        setTransactions(res.transactions || []);
        setTotalPages(res.pagination?.totalPages || 1);
        setPage(p);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTransactions(1);
  }, [typeFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#111827]">Financial Transactions Ledger</h1>
        <p className="text-xs text-[#6B7280] mt-0.5">
          Auditable immutable ledger of all deposits, task rewards, level rewards, spin prizes, and payouts.
        </p>
      </div>

      <div className="admin-card p-4 flex items-center justify-between">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-white border border-[#D9E4F2] rounded-lg px-3 py-1.5 text-xs text-[#111827] focus:outline-none h-9"
        >
          <option value="">All Transaction Categories</option>
          <option value="DEPOSIT_CREDIT">Deposit Credits</option>
          <option value="TASK_REWARD">Task Rewards</option>
          <option value="LEVEL_REWARD">Level Rewards</option>
          <option value="REFERRAL_REWARD">Referral Bonuses</option>
          <option value="SPIN_REWARD">Spin Rewards</option>
          <option value="TASK_UNLOCK_FEE">Task Unlock Fees</option>
          <option value="WITHDRAWAL_PAID">Withdrawals Paid</option>
          <option value="ADMIN_CREDIT">Admin Credits</option>
          <option value="ADMIN_DEBIT">Admin Debits</option>
        </select>
      </div>

      <div className="admin-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-[#6B7280]">Loading ledger records...</div>
        ) : transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs admin-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Member</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Actor / System</th>
                  <th className="text-right">Amount (PKR)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="text-[#6B7280] whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="font-semibold text-[#111827]">
                      {tx.user?.name}
                      <span className="block text-[10px] text-[#6B7280] font-mono">{tx.user?.phone}</span>
                    </td>
                    <td>
                      <span className="bg-[#EAF2FF] text-[#2563EB] font-semibold px-2 py-0.5 rounded text-[10px]">
                        {tx.transactionType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="max-w-xs">
                      <span className="text-[#111827] block truncate">{tx.reason}</span>
                      {tx.notes && <span className="text-[10px] text-[#6B7280] block truncate">{tx.notes}</span>}
                    </td>
                    <td className="text-[#4B5563] text-[11px] font-mono">{tx.actorName || 'system'}</td>
                    <td className="text-right font-bold whitespace-nowrap">
                      <span className={tx.amount > 0 ? 'text-emerald-700' : 'text-[#111827]'}>
                        {tx.amount > 0 ? '+' : ''}PKR {Math.abs(tx.amount).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded text-[10px]">
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-xs text-[#6B7280]">No ledger transactions found.</div>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t border-[#D9E4F2] flex items-center justify-between text-xs text-[#4B5563]">
            <button
              onClick={() => loadTransactions(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="px-3 py-1 rounded bg-[#F8FAFD] border border-[#D9E4F2] disabled:opacity-40"
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => loadTransactions(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 rounded bg-[#F8FAFD] border border-[#D9E4F2] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
