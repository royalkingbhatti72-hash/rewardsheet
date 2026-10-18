import React, { useState, useEffect } from 'react';
import {
  ArrowDownLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  X,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../api/client';

export const AdminDepositsPage: React.FC = () => {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('PENDING');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Review Modal State
  const [reviewingDep, setReviewingDep] = useState<any | null>(null);
  const [action, setAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadDeposits = (p = 1) => {
    setLoading(true);
    api.getAdminDeposits({ status: status || undefined, page: p, limit: 15 })
      .then((res) => {
        setDeposits(res.deposits || []);
        setTotalPages(res.pagination?.totalPages || 1);
        setPage(p);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDeposits(1);
  }, [status]);

  const handleOpenReview = (dep: any, defaultAction: 'APPROVE' | 'REJECT') => {
    setReviewingDep(dep);
    setAction(defaultAction);
    setReviewNotes('');
  };

  const handleExecuteReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingDep) return;
    setSubmittingReview(true);
    setMessage(null);

    try {
      const res = await api.reviewDeposit(reviewingDep.id, {
        action,
        reviewNotes: reviewNotes.trim() || undefined,
      });
      setMessage({ type: 'success', text: res.message });
      setReviewingDep(null);
      loadDeposits(page);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Deposit review failed' });
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#111827]">Deposit Management</h1>
        <p className="text-xs text-[#6B7280] mt-0.5">
          Review manual transfers via Easypaisa, JazzCash, and banking networks. Approved deposits credit wallets exactly once.
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
      <div className="admin-card p-4 flex items-center justify-between">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-white border border-[#D9E4F2] rounded-lg px-3 py-1.5 text-xs text-[#111827] focus:outline-none h-9"
        >
          <option value="">All Deposit States</option>
          <option value="PENDING">Pending Verification</option>
          <option value="APPROVED">Approved Deposits</option>
          <option value="REJECTED">Rejected Deposits</option>
        </select>
      </div>

      {/* Deposits Table */}
      <div className="admin-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-[#6B7280]">Loading deposit requests...</div>
        ) : deposits.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs admin-table">
              <thead>
                <tr>
                  <th>Submitted At</th>
                  <th>Member</th>
                  <th>Channel</th>
                  <th>Trx Reference</th>
                  <th>Proof Notes</th>
                  <th>Amount (PKR)</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map((dep) => (
                  <tr key={dep.id}>
                    <td className="text-[#6B7280] whitespace-nowrap">
                      {new Date(dep.createdAt).toLocaleDateString()} {new Date(dep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="font-semibold text-[#111827]">
                      {dep.user?.name}
                      <span className="block text-[10px] text-[#6B7280] font-mono">{dep.user?.phone}</span>
                    </td>
                    <td className="font-semibold text-[#2563EB]">{dep.paymentMethod}</td>
                    <td className="font-mono text-[#111827] font-bold text-[11px]">{dep.transactionReference}</td>
                    <td className="text-[#4B5563] text-[11px] max-w-xs truncate">{dep.proofEvidence || 'N/A'}</td>
                    <td className="font-bold text-[#111827] whitespace-nowrap">PKR {dep.amount.toLocaleString()}</td>
                    <td>
                      <span
                        className={`font-semibold text-[10px] px-2 py-0.5 rounded-full ${
                          dep.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : dep.status === 'PENDING'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {dep.status}
                      </span>
                    </td>
                    <td className="text-right whitespace-nowrap">
                      {dep.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenReview(dep, 'APPROVE')}
                            className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-600 hover:text-white transition-colors text-xs"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleOpenReview(dep, 'REJECT')}
                            className="px-2.5 py-1 rounded bg-red-50 text-red-700 font-semibold hover:bg-red-600 hover:text-white transition-colors text-xs"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#6B7280]">
                          Reviewed by {dep.reviewerName || 'Admin'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-xs text-[#6B7280]">No deposit requests found.</div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#D9E4F2] flex items-center justify-between text-xs text-[#4B5563]">
            <button
              onClick={() => loadDeposits(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="px-3 py-1 rounded bg-[#F8FAFD] border border-[#D9E4F2] disabled:opacity-40"
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => loadDeposits(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 rounded bg-[#F8FAFD] border border-[#D9E4F2] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewingDep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="admin-card p-6 w-full max-w-md bg-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#D9E4F2]">
              <h2 className="text-sm font-bold text-[#111827]">
                Review Deposit: PKR {reviewingDep.amount.toLocaleString()}
              </h2>
              <button onClick={() => setReviewingDep(null)} className="p-1 text-[#6B7280]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#F8FAFD] border border-[#D9E4F2] rounded-lg text-xs space-y-1.5">
              <p>
                <strong className="text-[#111827]">Member:</strong> {reviewingDep.user?.name} ({reviewingDep.user?.phone})
              </p>
              <p>
                <strong className="text-[#111827]">Channel:</strong> {reviewingDep.paymentMethod}
              </p>
              <p>
                <strong className="text-[#111827]">Reference / TID:</strong>{' '}
                <span className="font-mono text-[#2563EB] font-bold">{reviewingDep.transactionReference}</span>
              </p>
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
                    ✓ Approve & Credit
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
                    ✗ Reject Deposit
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
                  placeholder="Verified in bank or portal"
                  className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2 text-xs text-[#111827] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReviewingDep(null)}
                  className="px-4 py-2 border border-[#D9E4F2] rounded-lg text-[#4B5563] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className={`px-4 py-2 text-white font-semibold rounded-lg ${
                    action === 'APPROVE'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {submittingReview
                    ? 'Processing...'
                    : action === 'APPROVE'
                    ? 'Confirm Credit Approval'
                    : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
