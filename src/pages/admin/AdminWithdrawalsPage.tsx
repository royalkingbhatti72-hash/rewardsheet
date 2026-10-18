import React, { useState, useEffect } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  X,
  CreditCard,
} from 'lucide-react';
import { api } from '../../api/client';

export const AdminWithdrawalsPage: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvalFilter, setApprovalFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Review Modal State
  const [reviewingReq, setReviewingReq] = useState<any | null>(null);
  const [action, setAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [reviewNotes, setReviewNotes] = useState('');

  // Mark Paid Modal State
  const [payingReq, setPayingReq] = useState<any | null>(null);
  const [payoutRef, setPayoutRef] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');

  const [executing, setExecuting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadWithdrawals = (p = 1) => {
    setLoading(true);
    api.getAdminWithdrawals({
      approvalStatus: approvalFilter || undefined,
      paymentStatus: paymentFilter || undefined,
      page: p,
      limit: 15,
    })
      .then((res) => {
        setWithdrawals(res.withdrawals || []);
        setTotalPages(res.pagination?.totalPages || 1);
        setPage(p);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadWithdrawals(1);
  }, [approvalFilter, paymentFilter]);

  const handleExecuteReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingReq) return;
    setExecuting(true);
    setMessage(null);

    try {
      const res = await api.reviewWithdrawal(reviewingReq.id, {
        action,
        reviewNotes: reviewNotes.trim() || undefined,
      });
      setMessage({ type: 'success', text: res.message });
      setReviewingReq(null);
      loadWithdrawals(page);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Review execution failed' });
    } finally {
      setExecuting(false);
    }
  };

  const handleExecutePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingReq) return;
    if (!payoutRef.trim()) {
      setMessage({ type: 'error', text: 'Payout Reference / Trx ID is required' });
      return;
    }
    setExecuting(true);
    setMessage(null);

    try {
      const res = await api.payoutWithdrawal(payingReq.id, {
        payoutReference: payoutRef.trim(),
        reviewNotes: payoutNotes.trim() || undefined,
      });
      setMessage({ type: 'success', text: res.message });
      setPayingReq(null);
      loadWithdrawals(page);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Payout confirmation failed' });
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#111827]">Withdrawal Management</h1>
        <p className="text-xs text-[#6B7280] mt-0.5">
          Two-phase disbursement management: 1) Approval review, 2) Manual payment disbursement with payout confirmation.
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

      {/* Filter Bar */}
      <div className="admin-card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select
            value={approvalFilter}
            onChange={(e) => setApprovalFilter(e.target.value)}
            className="bg-white border border-[#D9E4F2] rounded-lg px-3 py-1.5 text-xs text-[#111827] focus:outline-none h-9"
          >
            <option value="">All Approval States</option>
            <option value="PENDING">Pending Approval</option>
            <option value="APPROVED">Approved Requests</option>
            <option value="REJECTED">Rejected Requests</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="bg-white border border-[#D9E4F2] rounded-lg px-3 py-1.5 text-xs text-[#111827] focus:outline-none h-9"
          >
            <option value="">All Payment States</option>
            <option value="NOT_SENT">Not Sent Yet</option>
            <option value="PAID">Disbursed (Paid)</option>
            <option value="FAILED">Failed / Refunded</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="admin-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-[#6B7280]">Loading withdrawals...</div>
        ) : withdrawals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs admin-table">
              <thead>
                <tr>
                  <th>Requested At</th>
                  <th>Member</th>
                  <th>Channel</th>
                  <th>Recipient Account</th>
                  <th>Amount (PKR)</th>
                  <th>Approval Status</th>
                  <th>Payment Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id}>
                    <td className="text-[#6B7280] whitespace-nowrap">
                      {new Date(w.createdAt).toLocaleDateString()} {new Date(w.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="font-semibold text-[#111827]">
                      {w.user?.name}
                      <span className="block text-[10px] text-[#6B7280] font-mono">{w.user?.phone}</span>
                    </td>
                    <td className="font-semibold text-[#2563EB]">{w.paymentMethod}</td>
                    <td className="text-[#111827]">
                      <span className="font-bold block">{w.recipientName}</span>
                      <span className="font-mono text-[11px] text-[#4B5563]">{w.recipientAccount}</span>
                    </td>
                    <td className="font-bold text-[#111827] whitespace-nowrap">
                      PKR {w.amount.toLocaleString()}
                    </td>
                    <td>
                      <span
                        className={`font-semibold text-[10px] px-2 py-0.5 rounded-full ${
                          w.approvalStatus === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : w.approvalStatus === 'PENDING'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {w.approvalStatus}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`font-semibold text-[10px] px-2 py-0.5 rounded-full ${
                          w.paymentStatus === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold'
                            : w.paymentStatus === 'NOT_SENT'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {w.paymentStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-right whitespace-nowrap">
                      {w.approvalStatus === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setReviewingReq(w);
                              setAction('APPROVE');
                              setReviewNotes('');
                            }}
                            className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-600 hover:text-white transition-colors text-xs"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setReviewingReq(w);
                              setAction('REJECT');
                              setReviewNotes('');
                            }}
                            className="px-2.5 py-1 rounded bg-red-50 text-red-700 font-semibold hover:bg-red-600 hover:text-white transition-colors text-xs"
                          >
                            Reject
                          </button>
                        </div>
                      ) : w.approvalStatus === 'APPROVED' && w.paymentStatus !== 'PAID' ? (
                        <button
                          onClick={() => {
                            setPayingReq(w);
                            setPayoutRef(`PAYOUT-${Date.now()}`);
                            setPayoutNotes('');
                          }}
                          className="px-3 py-1 rounded bg-[#2563EB] text-white font-semibold hover:bg-[#1D4ED8] transition-colors text-xs shadow-sm"
                        >
                          Mark as Paid
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#6B7280]">
                          {w.payoutReference ? `Ref: ${w.payoutReference}` : 'Resolved'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-xs text-[#6B7280]">No withdrawal requests found.</div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#D9E4F2] flex items-center justify-between text-xs text-[#4B5563]">
            <button
              onClick={() => loadWithdrawals(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="px-3 py-1 rounded bg-[#F8FAFD] border border-[#D9E4F2] disabled:opacity-40"
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => loadWithdrawals(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 rounded bg-[#F8FAFD] border border-[#D9E4F2] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Approval / Rejection Modal */}
      {reviewingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="admin-card p-6 w-full max-w-md bg-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#D9E4F2]">
              <h2 className="text-sm font-bold text-[#111827]">
                Review Withdrawal: PKR {reviewingReq.amount.toLocaleString()}
              </h2>
              <button onClick={() => setReviewingReq(null)} className="p-1 text-[#6B7280]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#F8FAFD] border border-[#D9E4F2] rounded-lg text-xs space-y-1">
              <p><strong className="text-[#111827]">Member:</strong> {reviewingReq.user?.name}</p>
              <p><strong className="text-[#111827]">Channel:</strong> {reviewingReq.paymentMethod}</p>
              <p><strong className="text-[#111827]">Recipient:</strong> {reviewingReq.recipientName} ({reviewingReq.recipientAccount})</p>
            </div>

            <form onSubmit={handleExecuteReview} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#374151] mb-1">Decision</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAction('APPROVE')}
                    className={`py-2 rounded-lg font-bold border text-xs ${
                      action === 'APPROVE'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'border-[#D9E4F2] text-[#4B5563]'
                    }`}
                  >
                    ✓ Approve Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setAction('REJECT')}
                    className={`py-2 rounded-lg font-bold border text-xs ${
                      action === 'REJECT'
                        ? 'bg-red-50 border-red-300 text-red-800'
                        : 'border-[#D9E4F2] text-[#4B5563]'
                    }`}
                  >
                    ✗ Reject & Refund Funds
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  Review Notes (Optional)
                </label>
                <input
                  type="text"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Reviewer notes"
                  className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2 text-xs text-[#111827] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReviewingReq(null)}
                  className="px-4 py-2 border border-[#D9E4F2] rounded-lg text-[#4B5563] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={executing}
                  className={`px-4 py-2 text-white font-semibold rounded-lg ${
                    action === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {executing ? 'Executing...' : 'Confirm Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Paid Modal */}
      {payingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="admin-card p-6 w-full max-w-md bg-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#D9E4F2]">
              <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#2563EB]" /> Confirm Payout: PKR {payingReq.amount.toLocaleString()}
              </h2>
              <button onClick={() => setPayingReq(null)} className="p-1 text-[#6B7280]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#F8FAFD] border border-[#D9E4F2] rounded-lg text-xs space-y-1">
              <p><strong className="text-[#111827]">Transfer Destination:</strong> {payingReq.paymentMethod}</p>
              <p><strong className="text-[#111827]">Title:</strong> {payingReq.recipientName}</p>
              <p><strong className="text-[#111827]">Account No:</strong> <span className="font-mono text-[#2563EB] font-bold">{payingReq.recipientAccount}</span></p>
            </div>

            <form onSubmit={handleExecutePayout} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  Payout Transaction ID / Reference (Required) *
                </label>
                <input
                  type="text"
                  required
                  value={payoutRef}
                  onChange={(e) => setPayoutRef(e.target.value)}
                  placeholder="e.g. EP-PAYOUT-987654 or Bank Trx"
                  className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2 font-mono text-xs text-[#111827] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  Payout Notes (Optional)
                </label>
                <input
                  type="text"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  placeholder="Sent from official account"
                  className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2 text-xs text-[#111827] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayingReq(null)}
                  className="px-4 py-2 border border-[#D9E4F2] rounded-lg text-[#4B5563] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={executing}
                  className="px-4 py-2 bg-[#2563EB] text-white font-semibold rounded-lg hover:bg-[#1D4ED8]"
                >
                  {executing ? 'Processing...' : 'Mark as Paid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
