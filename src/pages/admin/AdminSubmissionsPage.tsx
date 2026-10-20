import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  X,
  User,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../api/client';

export const AdminSubmissionsPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [status, setStatus] = useState('PENDING');
  const [level, setLevel] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Review Modal State
  const [reviewingSub, setReviewingSub] = useState<any | null>(null);
  const [action, setAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadSubmissions = (p = 1, isManual = false) => {
    if (isManual) {
      setReloading(true);
    } else if (submissions.length === 0) {
      setLoading(true);
    }
    api.getAdminSubmissions({
      status: status || undefined,
      level: level ? parseInt(level, 10) : undefined,
      page: p,
      limit: 15,
    })
      .then((res) => {
        setSubmissions(res.submissions || []);
        setTotalPages(res.pagination?.totalPages || 1);
        setPage(p);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        setLoading(false);
        setReloading(false);
      });
  };

  useEffect(() => {
    loadSubmissions(1);
  }, [status, level]);

  const handleOpenReview = (sub: any, defaultAction: 'APPROVE' | 'REJECT') => {
    setReviewingSub(sub);
    setAction(defaultAction);
    setReviewNotes('');
    setRejectionReason('');
  };

  const handleExecuteReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingSub) return;
    setSubmittingReview(true);
    setMessage(null);

    try {
      const res = await api.reviewTaskSubmission(reviewingSub.id, {
        action,
        reviewNotes: reviewNotes.trim() || undefined,
        rejectionReason: action === 'REJECT' ? rejectionReason : undefined,
      });
      // Update only this submission directly without reloading the whole table!
      const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      setSubmissions((prev) =>
        prev.map((s) => (s.id === reviewingSub.id ? { ...s, status: newStatus } : s))
      );
      setMessage({ type: 'success', text: res.message });
      setReviewingSub(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Review execution failed' });
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#111827]">Task Verification Desk</h1>
        <p className="text-xs text-[#6B7280] mt-0.5">
          Inspect member submitted proof, approve task rewards, or reject incomplete submissions.
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
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-white border border-[#D9E4F2] rounded-lg px-3 py-1.5 text-xs text-[#111827] focus:outline-none h-9"
          >
            <option value="">All Verification States</option>
            <option value="PENDING">Pending Review</option>
            <option value="APPROVED">Approved Submissions</option>
            <option value="REJECTED">Rejected Submissions</option>
          </select>

          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="bg-white border border-[#D9E4F2] rounded-lg px-3 py-1.5 text-xs text-[#111827] focus:outline-none h-9"
          >
            <option value="">All Levels (1–10)</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((l) => (
              <option key={l} value={l.toString()}>
                Level {l}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => loadSubmissions(page, true)}
          disabled={reloading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D9E4F2] bg-white hover:bg-[#F8FAFD] text-[#2563EB] font-bold text-xs transition-all h-9 disabled:opacity-60 shadow-xs"
          title="Reload task submissions from database"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${reloading ? 'animate-spin' : ''}`} />
          <span>{reloading ? 'Reloading...' : 'Reload Submissions'}</span>
        </button>
      </div>

      {/* Submissions Table */}
      <div className="admin-card overflow-hidden">
        {loading && submissions.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#6B7280]">Loading submissions...</div>
        ) : submissions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs admin-table">
              <thead>
                <tr>
                  <th>Submitted At</th>
                  <th>Member</th>
                  <th>Assignment</th>
                  <th>Notes / Proof</th>
                  <th>Reward (PKR)</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => (
                  <tr key={sub.id}>
                    <td className="text-[#6B7280] whitespace-nowrap">
                      {new Date(sub.createdAt).toLocaleDateString()} {new Date(sub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="font-semibold text-[#111827]">
                      {sub.user?.name}
                      <span className="block text-[10px] text-[#6B7280] font-mono">{sub.user?.phone}</span>
                    </td>
                    <td>
                      <span className="font-semibold text-[#111827] block">
                        L{sub.task?.level?.levelNumber}-T{sub.task?.taskNumber}: {sub.task?.title}
                      </span>
                      <span className="text-[10px] text-[#2563EB]">{sub.task?.taskType}</span>
                    </td>
                    <td className="max-w-xs">
                      <p className="text-[#111827] truncate font-mono text-[11px]">{sub.submissionNotes}</p>
                      {sub.proofEvidence && (
                        <p className="text-[10px] text-[#6B7280] truncate mt-0.5">Proof: {sub.proofEvidence}</p>
                      )}
                    </td>
                    <td className="font-bold text-[#111827] whitespace-nowrap">
                      PKR {sub.task?.rewardAmount.toLocaleString()}
                    </td>
                    <td>
                      <span
                        className={`font-semibold text-[10px] px-2 py-0.5 rounded-full ${
                          sub.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : sub.status === 'PENDING'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="text-right whitespace-nowrap">
                      {sub.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenReview(sub, 'APPROVE')}
                            className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-600 hover:text-white transition-colors text-xs"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleOpenReview(sub, 'REJECT')}
                            className="px-2.5 py-1 rounded bg-red-50 text-red-700 font-semibold hover:bg-red-600 hover:text-white transition-colors text-xs"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#6B7280]">
                          Reviewed by {sub.reviewerName || 'Admin'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-xs text-[#6B7280]">No task submissions found.</div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#D9E4F2] flex items-center justify-between text-xs text-[#4B5563]">
            <button
              onClick={() => loadSubmissions(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="px-3 py-1 rounded bg-[#F8FAFD] border border-[#D9E4F2] disabled:opacity-40"
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => loadSubmissions(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 rounded bg-[#F8FAFD] border border-[#D9E4F2] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="admin-card p-6 w-full max-w-lg bg-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#D9E4F2]">
              <h2 className="text-sm font-bold text-[#111827]">
                Review Submission: L{reviewingSub.task?.level?.levelNumber}-T{reviewingSub.task?.taskNumber}
              </h2>
              <button onClick={() => setReviewingSub(null)} className="p-1 text-[#6B7280]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#F8FAFD] border border-[#D9E4F2] rounded-lg text-xs space-y-1.5">
              <p>
                <strong className="text-[#111827]">Member:</strong> {reviewingSub.user?.name} ({reviewingSub.user?.phone})
              </p>
              <p>
                <strong className="text-[#111827]">Task:</strong> {reviewingSub.task?.title}
              </p>
              <p>
                <strong className="text-[#111827]">Reward to Credit:</strong> PKR {reviewingSub.task?.rewardAmount.toLocaleString()}
              </p>
              <p className="border-t border-[#D9E4F2] pt-1">
                <strong className="text-[#111827]">Submitted Evidence / Notes:</strong>
                <span className="block font-mono text-[11px] text-[#2563EB] mt-0.5 whitespace-pre-wrap">
                  {reviewingSub.submissionNotes}
                </span>
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
                    ✓ Approve & Credit Reward
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
                    ✗ Reject Submission
                  </button>
                </div>
              </div>

              {action === 'APPROVE' ? (
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">
                    Approval Feedback / Review Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Verified screenshot proof"
                    className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2 text-xs text-[#111827] focus:outline-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">
                    Rejection Reason (Visible to Member) *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why evidence was insufficient so member can correct..."
                    className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2 text-xs text-[#111827] focus:outline-none"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReviewingSub(null)}
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
                    ? 'Confirm Approval'
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
