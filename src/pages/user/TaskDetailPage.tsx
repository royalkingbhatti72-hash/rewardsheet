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
  ArrowRight,
  AlertCircle,
  Send,
  Zap,
  HelpCircle,
  ShieldCheck,
  ArrowDownLeft,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const triggerFireworks = () => {
  const duration = 2.5 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 99999 };
  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  const interval: any = setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return clearInterval(interval);

    const particleCount = 40 * (timeLeft / duration);
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.4), y: Math.random() - 0.2 },
      colors: ['#FFD45A', '#1459E8', '#22D3EE', '#10D6A0'],
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.6, 0.9), y: Math.random() - 0.2 },
      colors: ['#FFD45A', '#1459E8', '#22D3EE', '#10D6A0'],
    });
  }, 250);
};

const cleanTaskTitle = (title: string) => {
  if (!title) return '';
  if (title.startsWith('Prepaid Task')) return title;
  return title.replace(/\s+Task\s*#?\d+$/i, '').trim();
};

export const TaskDetailPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { wallet, refreshUser } = useAuth();

  const cachedTask = taskId ? api.getCachedData<any>(`/tasks/${taskId}`) : null;
  const [taskData, setTaskData] = useState<any>(cachedTask);
  const [loading, setLoading] = useState(!cachedTask);
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
      const targetId = task?.id || taskId;
      const res = await api.unlockTask(targetId);
      setSuccess(res.message);
      if (res.task) {
        setTaskData((prev: any) => (prev ? { ...prev, task: { ...prev.task, ...res.task } } : prev));
      }
      refreshUser();
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
      const targetId = task?.id || taskId;
      const res = await api.submitTask(targetId, {
        submissionNotes: 'Task completed',
      });
      setSuccess(res.message || 'Task completed successfully! Reward credited.');
      setTaskData((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          task: {
            ...prev.task,
            userStatus: res.userStatus || 'APPROVED',
            isPaidUnlocked: true,
          },
          nextTaskId: res.nextTaskId,
          submissions: res.submission ? [res.submission, ...(prev.submissions || [])] : prev.submissions,
        };
      });
      triggerFireworks();
      api.invalidateCache('/tasks');
      refreshUser();
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

  if (loading && !taskData) {
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

  const isPrepaid = Boolean(
    task?.isPaid ||
    (task?.unlockFee && task.unlockFee > 0) ||
    task?.taskNumber === 5 ||
    task?.taskNumber === 10 ||
    task?.taskNumber === 15 ||
    task?.taskNumber === 20 ||
    task?.taskType?.toLowerCase().includes('prepaid')
  );
  const taskCreditPoints = isPrepaid
    ? (task?.creditPoints && task.creditPoints > 5 ? task.creditPoints : 30)
    : (task?.creditPoints && task.creditPoints > 0 ? task.creditPoints : 5);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Back Link */}
      <Link
        to="/app/tasks"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Tasks & Levels
      </Link>

      {/* Messages */}
      {success && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="p-3.5 bg-red-500/15 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Clean Unified Task Card (Always appearable!) */}
      <div className="royal-card p-5 sm:p-7 rounded-2xl space-y-5">
        {/* Header & Badges */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-[#FFD45A]">
              Level {level?.levelNumber}: {level?.title}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs font-semibold text-[#22D3EE]">
              Task #{task?.taskNumber}
            </span>
            {task?.taskType && (
              <>
                <span className="text-slate-500">•</span>
                <span className="text-xs text-slate-300 font-medium">
                  {task?.taskType}
                </span>
              </>
            )}
            {task?.isPaid && (
              <>
                <span className="text-slate-500">•</span>
                <span className="text-xs font-bold text-[#FFD45A] flex items-center gap-1">
                  <Zap className="w-3 h-3 text-[#FFD45A]" /> Prepaid
                </span>
              </>
            )}
          </div>

          {/* Status Indicator */}
          <div>
            {isLocked && (
              <span className="bg-amber-500/15 border border-amber-500/40 text-amber-400 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 text-xs">
                <Lock className="w-3.5 h-3.5" /> Locked
              </span>
            )}
            {isApproved && (
              <span className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" /> Approved
              </span>
            )}
            {isPending && (
              <span className="bg-blue-500/15 border border-blue-500/40 text-blue-400 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 text-xs">
                <Clock className="w-3.5 h-3.5" /> Pending Verification
              </span>
            )}
            {isRejected && (
              <span className="bg-red-500/15 border border-red-500/40 text-red-400 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 text-xs">
                <XCircle className="w-3.5 h-3.5" /> Rejected
              </span>
            )}
            {isAvailable && (
              <span className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 text-xs">
                <Unlock className="w-3.5 h-3.5" /> Ready for Completion
              </span>
            )}
          </div>
        </div>

          {/* Title & Description */}
          <div className="space-y-1.5">
            <h1 className="text-lg sm:text-xl font-bold text-white">
              {cleanTaskTitle(task?.title)}
            </h1>
            {task?.description && (
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {task?.description}
              </p>
            )}
          </div>

          {/* Simple Inline Rewards Strip (No boxes) */}
          <div className="flex items-center gap-5 sm:gap-8 flex-wrap pt-1 pb-1">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block tracking-wider">Commission</span>
              <span className="text-sm sm:text-base font-black text-[#10D6A0]">
                PKR {task?.rewardAmount?.toLocaleString()}
              </span>
            </div>
            <div className="h-6 w-px bg-white/10 hidden sm:block" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block tracking-wider">Credit Points</span>
              <span className="text-sm sm:text-base font-black text-[#22D3EE]">
                +{taskCreditPoints} CPs
              </span>
            </div>
            {level?.completionReward > 0 && (
              <>
                <div className="h-6 w-px bg-white/10 hidden sm:block" />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block tracking-wider">Level Reward</span>
                  <span className="text-sm sm:text-base font-black text-[#FFD45A]">
                    PKR {level?.levelNumber === 1 ? '500' : (level?.completionReward?.toLocaleString() || 0)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Locked Notice (if task is locked) */}
          {isLocked && (
            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="p-6 rounded-2xl border border-amber-500/30 bg-[#071B3A]/90 text-center space-y-3 shadow-md">
                <div className="w-12 h-12 rounded-xl bg-[#061633] border border-[#173C73] flex items-center justify-center mx-auto text-[#FFD45A]">
                  <Lock className="w-6 h-6 text-[#FFD45A]" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="text-base font-bold text-white">This Task is Locked</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {task?.lockMessage || `Task #${task?.taskNumber || ''} is locked. Complete the previous task first in proper sequence.`}
                  </p>
                </div>
                <div className="pt-1">
                  <Link
                    to="/app/tasks"
                    className="inline-flex items-center gap-1.5 bg-[#1264F5] hover:bg-[#168BFF] text-white text-xs font-semibold px-4 py-2 rounded-lg shadow transition-all"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Tasks & Levels</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Prepaid Task Balance Requirement (Clean inline row if applicable) */}
          {task?.isPaid && isAvailable && (
            <div className="pt-3 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                  <Zap className="w-4 h-4 text-[#FFD45A]" />
                  <span>Prepaid Task Balance Requirement (Zero fee deducted, funds remain in wallet)</span>
                </span>
                <span className="text-slate-400">
                  Required: <strong className="text-white">PKR {unlockFee.toLocaleString()}</strong> • Your Balance: <strong className={hasSufficientBalance ? 'text-[#10D6A0]' : 'text-[#FFD45A]'}>PKR {userBalance.toLocaleString()}</strong>
                </span>
              </div>
              {!hasSufficientBalance && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 text-xs text-[#FFD45A]">
                  <span>Please deposit PKR {remainingNeeded.toLocaleString()} to complete the required PKR {unlockFee.toLocaleString()} balance.</span>
                  <Link
                    to={`/app/deposits?amount=${remainingNeeded}`}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#1264F5] to-[#168BFF] text-white font-bold rounded-lg shadow-sm"
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>Deposit PKR {remainingNeeded.toLocaleString()}</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Assignment Instructions (Simple Clean Typography, No Box) */}
          {task?.instructions && (
            <div className="pt-3 border-t border-white/10 space-y-1.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Assignment Instructions
              </h2>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                {task?.instructions}
              </p>
            </div>
          )}

          {/* Open Task Assignment Link */}
          {task?.protectedUrl && (
            <div className="pt-1">
              {isPrepaid && !hasSufficientBalance ? (
                <div
                  className="inline-flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 text-slate-400 text-xs font-semibold px-4 py-2.5 rounded-xl cursor-not-allowed select-none"
                  title={`Deposit PKR ${remainingNeeded.toLocaleString()} to access this assignment link`}
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Open Task Assignment Link (PKR {unlockFee.toLocaleString()} Balance Required)</span>
                </div>
              ) : (
                <a
                  href={task.protectedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-[#1459E8] hover:bg-[#2478FF] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95"
                >
                  <span>Open Task Assignment Link</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}

          {/* Complete / Submit Action Button */}
          {(isAvailable || isRejected) && (
            <div className="pt-2">
              {task?.isPaid && !hasSufficientBalance ? (
                <Link
                  to={`/app/deposits?amount=${remainingNeeded}`}
                  className="w-full py-3 bg-gradient-to-r from-[#1264F5] to-[#168BFF] hover:from-[#168BFF] hover:to-[#1264F5] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>Deposit PKR {remainingNeeded.toLocaleString()} to Complete Task</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitProof}
                  disabled={submitting}
                  className={`w-full py-3 font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-98 ${
                    task?.isPaid
                      ? 'bg-gradient-to-r from-[#10D6A0] to-emerald-400 hover:from-emerald-400 hover:to-[#10D6A0] text-[#020B20] font-black'
                      : 'bg-gradient-to-r from-[#1459E8] to-[#2478FF] hover:from-[#2478FF] hover:to-[#1459E8] text-white'
                  }`}
                >
                  {submitting ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : task?.isPaid ? (
                    <>
                      <Zap className="w-4 h-4 text-[#020B20]" />
                      <span>Complete Prepaid Task (+PKR {task?.rewardAmount?.toLocaleString() || 80} Reward)</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Complete Task & Claim PKR {task?.rewardAmount?.toLocaleString()}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Pending Verification Notice */}
          {isPending && (
            <div className="flex items-center gap-3 pt-2 text-blue-400">
              <Clock className="w-5 h-5 flex-shrink-0 animate-pulse" />
              <div>
                <p className="text-xs font-bold text-blue-300">Task Under Review ⏳</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Your task has been sent for verification. Once approved, the reward will be added to your balance and the next task will automatically open.
                </p>
              </div>
            </div>
          )}

          {/* Approved State Notice */}
          {isApproved && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2.5 text-emerald-400">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <p className="text-xs font-semibold text-emerald-300">
                  {task?.isPaid ? (
                    <>Task Completed & Approved! +PKR {task?.rewardAmount?.toLocaleString() || 80} credited to your wallet and +30 CPs awarded.</>
                  ) : (
                    <>Task Verified & Completed! +PKR {task?.rewardAmount?.toLocaleString()} reward and +{taskCreditPoints} CPs credited.</>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {taskData?.nextTaskId ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/app/tasks/${taskData.nextTaskId}`)}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-[#10D6A0] to-emerald-400 text-[#020B20] font-black text-xs px-5 py-2.5 rounded-xl shadow-lg hover:scale-105 transition-all cursor-pointer"
                  >
                    <span>Proceed to Next Task (Task {(task?.taskNumber || 0) + 1})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (task?.taskNumber || 0) < (level?.requiredTaskCount || 10) ? (
                  <Link
                    to={`/app/tasks?level=${level?.levelNumber}`}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-[#10D6A0] to-emerald-400 text-[#020B20] font-black text-xs px-5 py-2.5 rounded-xl shadow-lg hover:scale-105 transition-all cursor-pointer"
                  >
                    <span>Proceed to Next Task (Task ${(task?.taskNumber || 0) + 1})</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link
                    to={`/app/tasks?level=${(level?.levelNumber || 1) + 1}`}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-[#10D6A0] to-emerald-400 text-[#020B20] font-black text-xs px-5 py-2.5 rounded-xl shadow-lg hover:scale-105 transition-all cursor-pointer"
                  >
                    <span>Level {level?.levelNumber || 1} Complete! Proceed to Level {(level?.levelNumber || 1) + 1}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Submissions History (Clean List, No Boxes) */}
          {submissions && submissions.length > 0 && (
            <div className="pt-4 border-t border-white/10 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Submission History</h3>
              <div className="divide-y divide-white/5">
                {submissions.map((sub: any) => (
                  <div key={sub.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                    <div className="space-y-0.5">
                      <span className="text-slate-400 text-[11px] block">{new Date(sub.createdAt).toLocaleString()}</span>
                      {sub.reviewNotes && (
                        <p className="text-emerald-300 text-[11px]">Feedback: {sub.reviewNotes}</p>
                      )}
                      {sub.rejectionReason && (
                        <p className="text-red-400 text-[11px]">Reason: {sub.rejectionReason}</p>
                      )}
                    </div>
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
                ))}
              </div>
            </div>
          )}
        </div>
    </div>
  );
};
