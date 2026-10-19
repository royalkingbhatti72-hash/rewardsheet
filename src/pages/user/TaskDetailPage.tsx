import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Crown,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  ArrowLeft,
  AlertCircle,
  Send,
  Zap,
  HelpCircle,
  ShieldCheck,
  ArrowDownLeft,
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const cleanTaskTitle = (title: string) => {
  if (!title) return '';
  if (title.startsWith('Prepaid Task')) return title;
  return title.replace(/\s+Task\s*#?\d+$/i, '').trim();
};

export const TaskDetailPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { wallet, refreshUser } = useAuth();

  const [taskData, setTaskData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [proofEvidence, setProofEvidence] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadTask = (silent = false) => {
    if (!taskId) return;
    if (!silent && !taskData) setLoading(true);
    api.getTaskDetails(taskId)
      .then(setTaskData)
      .catch((err) => {
        if (!taskData) setError(err.message || 'Failed to load task details');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTask();
  }, [taskId]);

  // Realtime Live Update Listener (Zero Reload Strategy)
  useEffect(() => {
    const handleLiveEvent = (e: any) => {
      const type = e.detail?.type;
      if (type === 'task' || type === 'notification' || type === 'command' || type === 'all') {
        loadTask(true);
      }
    };
    window.addEventListener('royal_live_update', handleLiveEvent);
    window.addEventListener('royal_live_heartbeat', () => loadTask(true));
    return () => {
      window.removeEventListener('royal_live_update', handleLiveEvent);
      window.removeEventListener('royal_live_heartbeat', () => loadTask(true));
    };
  }, [taskId]);

  const handleUnlock = async () => {
    if (!taskId) return;
    setUnlocking(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.unlockTask(taskId);
      setSuccess(res.message);
      await refreshUser();
      loadTask();
    } catch (err: any) {
      setError(err.message || 'Failed to unlock task');
    } finally {
      setUnlocking(false);
    }
  };

  const handleSubmitProof = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!taskId) return;

    if (task?.isPaid && !hasSufficientBalance) {
      navigate(`/app/deposits?amount=${remainingNeeded}`);
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.submitTask(taskId, {
        submissionNotes: 'Review My Task',
      });
      setSuccess(res.message);
      await refreshUser();
      loadTask();
    } catch (err: any) {
      setError(err.message || 'Submission failed');
      if (err.remainingNeeded || err.redirectToDeposit) {
        setTimeout(() => {
          navigate(`/app/deposits?amount=${err.remainingNeeded || remainingNeeded}`);
        }, 1200);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-[#1459E8]/30 border-t-[#FFD45A] rounded-full animate-spin" />
      </div>
    );
  }

  const { task, level, submissions } = taskData || {};
  const userBalance = wallet?.availableBalance || 0;
  const unlockFee = task?.unlockFee || 0;
  const remainingNeeded = Math.max(0, unlockFee - userBalance);
  const hasSufficientBalance = userBalance >= unlockFee;

  const isLocked = task?.userStatus === 'LOCKED';
  const isApproved = task?.userStatus === 'APPROVED';
  const isPending = task?.userStatus === 'PENDING_VERIFICATION';
  const isRejected = task?.userStatus === 'REJECTED';
  const isAvailable = !isLocked && !isApproved && !isPending && !isRejected;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        to="/app/tasks"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Tasks & Levels
      </Link>

      {/* Messages */}
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

      {/* Task Header Card */}
      <div className="royal-card p-6 sm:p-8 rounded-3xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#FFD45A]">
                Level {level?.levelNumber}: {level?.title}
              </span>
              <span className="text-[10px] text-[#22D3EE] bg-[#22D3EE]/10 px-2 py-0.5 rounded-md font-semibold">
                Task #{task?.taskNumber}
              </span>
              {!isLocked && (
                <>
                  <span className="text-[10px] font-semibold text-slate-300 bg-[#061633] border border-[#173C73] px-2 py-0.5 rounded-md">
                    {task?.taskType}
                  </span>
                  <span className="text-[10px] font-bold text-[#22D3EE] bg-[#22D3EE]/15 border border-[#22D3EE]/30 px-2 py-0.5 rounded-md">
                    +{task?.creditPoints || 5} CPs
                  </span>
                  {task?.isPaid && (
                    <span className="text-[10px] font-black text-[#FFD45A] bg-[#FFD45A]/15 border border-[#FFD45A]/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5" /> Prepaid: PKR {task?.unlockFee?.toLocaleString()}
                    </span>
                  )}
                </>
              )}
            </div>
            <h1 className="text-2xl font-black text-white">
              {isLocked ? 'Locked Task' : cleanTaskTitle(task?.title)}
            </h1>
            <p className="text-xs text-slate-300">
              {isLocked
                ? (task?.lockMessage || `Complete and get approval for Task #${(task?.taskNumber || 1) - 1} to unlock this assignment.`)
                : task?.description}
            </p>
          </div>

          {!isLocked && (
            <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
              <div className="bg-[#020B20]/80 border border-[#214B91] p-3 rounded-2xl text-right self-start sm:self-center">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Commission</span>
                <span className="text-lg font-black text-[#10D6A0]">
                  PKR {task?.rewardAmount?.toLocaleString()}
                </span>
              </div>
              <div className="bg-[#020B20]/80 border border-[#214B91] p-3 rounded-2xl text-right self-start sm:self-center">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Credit Points</span>
                <span className="text-lg font-black text-[#22D3EE]">
                  +{task?.creditPoints || 5} Points
                </span>
              </div>
              {level?.completionReward > 0 && (
                <div className="bg-[#020B20]/80 border border-[#214B91] p-3 rounded-2xl text-right self-start sm:self-center">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Level Reward</span>
                  <span className="text-lg font-black text-[#FFD45A]">
                    PKR {level?.levelNumber === 1 ? '500' : (level?.completionReward?.toLocaleString() || 0)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Current State Status Bar */}
        <div className="mt-4 pt-4 border-t border-[#214B91]/50 flex items-center justify-between text-xs">
          <span className="text-slate-400">Current Task Status:</span>
          <div>
            {isApproved && (
              <span className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Approved
              </span>
            )}
            {isPending && (
              <span className="bg-blue-500/15 border border-blue-500/40 text-blue-400 font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Pending Verification
              </span>
            )}
            {isRejected && (
              <span className="bg-red-500/15 border border-red-500/40 text-red-400 font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" /> Rejected
              </span>
            )}
            {isAvailable && (
              <span className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                <Unlock className="w-3.5 h-3.5" /> Ready for Completion
              </span>
            )}
            {isLocked && (
              <span className="bg-slate-800 text-slate-400 font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Locked
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Prepaid Balance Requirement Section (Shown for prepaid tasks) */}
      {task?.isPaid && isAvailable && (
        <div className={`royal-card p-6 sm:p-8 rounded-3xl border space-y-5 ${
          hasSufficientBalance ? 'border-[#10D6A0]/40' : 'border-[#FFD45A]/40'
        }`}>
          <div className="flex items-start gap-3">
            <Zap className={`w-6 h-6 flex-shrink-0 mt-1 ${hasSufficientBalance ? 'text-[#10D6A0]' : 'text-[#FFD45A]'}`} />
            <div>
              <h2 className="text-lg font-bold text-white">Prepaid Task Account Balance Requirement</h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                You do not need to pay anything to complete this assignment. You only need to have an account balance of{' '}
                <strong className="text-[#FFD45A] font-bold">PKR {unlockFee.toLocaleString()}</strong> when submitting for approval.
                {' '}<strong>Your funds are NOT spent or deducted</strong> — they remain safe in your account.
              </p>
            </div>
          </div>

          {/* 3-Column Balance Breakdown Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div className="p-3.5 bg-[#020B20] border border-[#214B91] rounded-2xl">
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Required Balance</span>
              <span className="text-lg font-black text-white">PKR {unlockFee.toLocaleString()}</span>
              <span className="text-[10px] text-[#10D6A0] block mt-0.5">No fee deducted</span>
            </div>
            <div className="p-3.5 bg-[#020B20] border border-[#214B91] rounded-2xl">
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Your Current Balance</span>
              <span className="text-lg font-black text-[#10D6A0]">PKR {userBalance.toLocaleString()}</span>
            </div>
            <div className="p-3.5 bg-[#020B20] border border-[#214B91] rounded-2xl">
              <span className="text-[10px] text-slate-400 block uppercase font-medium">
                {hasSufficientBalance ? 'Balance Status' : 'Needed to Deposit'}
              </span>
              <span className={`text-lg font-black ${hasSufficientBalance ? 'text-[#10D6A0]' : 'text-[#FFD45A]'}`}>
                {hasSufficientBalance ? 'Ready to Submit' : `PKR ${remainingNeeded.toLocaleString()}`}
              </span>
            </div>
          </div>

          {!hasSufficientBalance ? (
            <div className="p-4 bg-[#FFD45A]/10 border border-[#FFD45A]/30 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-xs text-[#FFD45A] font-semibold">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>
                  You have PKR {userBalance.toLocaleString()} in your account. Please deposit PKR {remainingNeeded.toLocaleString()} to complete the required PKR {unlockFee.toLocaleString()} balance before submitting for approval.
                </span>
              </div>
              <Link
                to={`/app/deposits?amount=${remainingNeeded}`}
                className="w-full py-3 bg-gradient-to-r from-[#1264F5] to-[#168BFF] hover:from-[#168BFF] hover:to-[#1264F5] text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Deposit PKR {remainingNeeded.toLocaleString()} to Reach Balance</span>
              </Link>
            </div>
          ) : (
            <div className="p-3.5 bg-[#10D6A0]/10 border border-[#10D6A0]/30 rounded-2xl flex items-center gap-2.5 text-xs text-[#10D6A0]">
              <CheckCircle2 className="w-4 h-4 text-[#10D6A0] flex-shrink-0" />
              <span>
                Account balance requirement met (PKR {userBalance.toLocaleString()})! Submitting below will automatically verify and place your task under review at the same time.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Locked Task Message */}
      {isLocked && (
        <div className="royal-card p-8 rounded-3xl text-center space-y-4 border border-[#F59E0B]/40 bg-[#071B3A]/90 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-[#061633] border border-[#173C73] flex items-center justify-center mx-auto text-[#FFD45A]">
            <Lock className="w-8 h-8 text-[#FFD45A]" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-xl font-black text-white">This Task is Locked</h2>
            <p className="text-xs sm:text-sm text-[#B7C6E4] leading-relaxed">
              {task?.lockMessage || `Task #${task?.taskNumber || ''} is locked. You must complete and get approval for the previous task first before viewing instructions or details.`}
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/app/tasks"
              className="inline-flex items-center gap-2 bg-[#1264F5] hover:bg-[#168BFF] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Current Active Task</span>
            </Link>
          </div>
        </div>
      )}

      {/* Unlocked / Available Instructions & Protected Link */}
      {(isAvailable || isPending || isApproved || isRejected) && (
        <div className="royal-card p-6 sm:p-8 rounded-3xl space-y-6">
          <div>
            <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#22D3EE]" /> Assignment Instructions
            </h2>
            <div className="p-4 bg-[#020B20] border border-[#214B91]/50 rounded-2xl text-xs text-slate-200 whitespace-pre-line leading-relaxed font-mono">
              {task?.instructions}
            </div>
          </div>

          {task?.protectedUrl && (
            <div>
              <a
                href={task.protectedUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-[#1459E8] hover:bg-[#2478FF] text-white text-xs font-bold px-5 py-3 rounded-xl shadow-md transition-all"
              >
                <span>Open Task Assignment Link</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Submission Guidance */}
          {/* Submission Guidance */}
          <div className="p-4 bg-[#04132F] border border-[#214B91]/60 rounded-2xl text-xs space-y-2">
            <p className="font-bold text-[#FFD45A] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Verification Instructions:
            </p>
            <p className="text-slate-300 leading-relaxed">
              Open and complete the YouTube activity above, then simply click <strong>"Review My Task"</strong> below. Your task will immediately go under review. Once approved by an administrator, the task will be completed and the next task will automatically open!
            </p>
          </div>

          {/* Prepaid Task Banner */}
          {task?.isPaid && (
            <div className="p-3.5 bg-gradient-to-r from-[#FFD45A]/15 via-[#020B20] to-[#10D6A0]/15 border border-[#FFD45A]/40 rounded-2xl text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#FFD45A]">
                <Zap className="w-4 h-4 text-[#FFD45A]" />
                <span>Prepaid Assignment • Admin Approval & Direct Reward</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                This prepaid task requires a verified account balance of PKR {task?.unlockFee?.toLocaleString() || 0}. Your funds remain safe in your wallet with zero deductions. Upon admin approval, your +PKR {task?.rewardAmount?.toLocaleString() || 80} reward directly increases your account balance, and the next sequential assignment opens.
              </p>
            </div>
          )}

          {/* Submission Action Button */}
          {(isAvailable || isRejected) && (
            <div className="space-y-3.5 pt-4 border-t border-[#214B91]/50">
              <div className="p-3.5 bg-[#020B20] border border-[#214B91]/70 rounded-2xl flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#10D6A0] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed">
                  {task?.isPaid ? (
                    hasSufficientBalance ? (
                      <>
                        Your account balance is verified! Click <strong>"Submit Approval"</strong> below to automatically process and send your task under admin review.
                      </>
                    ) : (
                      <>
                        Your account balance is <strong>PKR {userBalance.toLocaleString()}</strong>. Please deposit <strong>PKR {remainingNeeded.toLocaleString()}</strong> to complete the required PKR {unlockFee.toLocaleString()} balance to submit for approval.
                      </>
                    )
                  ) : (
                    <>
                      No text answer or screenshot required. Complete your assignment above, then click <strong>"Review My Task"</strong> below to send it directly for admin approval.
                    </>
                  )}
                </p>
              </div>

              {task?.isPaid && !hasSufficientBalance ? (
                <Link
                  to={`/app/deposits?amount=${remainingNeeded}`}
                  className="w-full py-3.5 bg-gradient-to-r from-[#1264F5] to-[#168BFF] hover:from-[#168BFF] hover:to-[#1264F5] text-white font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>Deposit PKR {remainingNeeded.toLocaleString()} to Submit Approval</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitProof}
                  disabled={submitting}
                  className={`w-full py-3.5 font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer ${
                    task?.isPaid
                      ? 'bg-gradient-to-r from-[#10D6A0] to-emerald-400 hover:from-emerald-400 hover:to-[#10D6A0] text-[#020B20] font-black'
                      : 'bg-gradient-to-r from-[#1459E8] to-[#2478FF] hover:from-[#2478FF] hover:to-[#1459E8] text-white shadow-[#1459E8]/30'
                  }`}
                >
                  {submitting ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : task?.isPaid ? (
                    <>
                      <Zap className="w-4 h-4 text-[#020B20]" />
                      <span>Submit Approval (+PKR {task?.rewardAmount?.toLocaleString() || 80} Reward)</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Review My Task</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Pending State Notice */}
          {isPending && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-blue-300">Task Under Review ⏳</p>
                <p className="text-[11px] text-blue-200/80 leading-relaxed">
                  Your task has been submitted for review! An administrator will evaluate and approve it shortly. Once approved, this task will be marked completed and the next task will automatically open.
                </p>
              </div>
            </div>
          )}

          {/* Approved State Notice */}
          {isApproved && (
            <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <p className="text-xs text-emerald-300 font-semibold leading-relaxed">
                  {task?.isPaid ? (
                    <>
                      This prepaid task was verified and <strong>approved by administrator</strong>! +PKR {task?.rewardAmount?.toLocaleString() || 80} has been directly credited to your account balance. Next sequential task is now unlocked!
                    </>
                  ) : (
                    <>
                      This task has been verified and approved! +{task?.creditPoints || 5} Credit Points have been credited. Next sequential task is now unlocked!
                    </>
                  )}
                </p>
              </div>

              <div className="pt-1">
                <Link
                  to={`/app/tasks?level=${level?.levelNumber}`}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#10D6A0] to-emerald-400 text-[#020B20] font-black text-xs px-5 py-2.5 rounded-xl shadow-lg hover:scale-105 transition-all cursor-pointer"
                >
                  <span>Proceed to Next Task (Task {(task?.taskNumber || 0) + 1})</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Past Submissions History */}
      {submissions && submissions.length > 0 && (
        <div className="royal-card p-6 rounded-3xl space-y-4">
          <h3 className="text-sm font-bold text-white">Submission History</h3>
          <div className="space-y-3">
            {submissions.map((sub: any) => (
              <div
                key={sub.id}
                className="p-4 bg-[#020B20]/80 border border-[#214B91]/40 rounded-2xl space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{new Date(sub.createdAt).toLocaleString()}</span>
                  <div>
                    {sub.status === 'APPROVED' && (
                      <span className="bg-emerald-500/15 text-emerald-400 font-bold px-2 py-0.5 rounded-full text-[10px]">
                        Approved
                      </span>
                    )}
                    {sub.status === 'PENDING' && (
                      <span className="bg-blue-500/15 text-blue-400 font-bold px-2 py-0.5 rounded-full text-[10px]">
                        Pending Review
                      </span>
                    )}
                    {sub.status === 'REJECTED' && (
                      <span className="bg-red-500/15 text-red-400 font-bold px-2 py-0.5 rounded-full text-[10px]">
                        Rejected
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-slate-200">
                  <strong className="text-slate-400">Notes:</strong> {sub.submissionNotes}
                </p>
                {sub.reviewNotes && (
                  <p className="text-emerald-300">
                    <strong className="text-slate-400">Admin Feedback:</strong> {sub.reviewNotes}
                  </p>
                )}
                {sub.rejectionReason && (
                  <p className="text-red-400">
                    <strong className="text-slate-400">Rejection Reason:</strong> {sub.rejectionReason}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
