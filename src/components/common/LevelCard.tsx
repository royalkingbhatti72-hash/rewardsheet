import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  Trophy,
  Zap,
  Sparkles,
  ArrowRight,
  Layers,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '../../utils/supabase';

export interface LevelData {
  id: string;
  level_number: number;
  title: string;
  description?: string;
  status: 'in_progress' | 'completed' | 'locked';
  reward_amount?: number;
  created_at?: string;
  updated_at?: string;
}

export interface TaskData {
  id: string;
  level_id: string;
  task_number: number;
  title: string;
  description?: string;
  task_type?: string;
  status: 'pending' | 'approved' | 'rejected';
  reward_amount?: number;
  instructions?: string;
  created_at?: string;
  updated_at?: string;
}

interface LevelCardProps {
  /** The Level ID to fetch and bind Realtime events to */
  levelId?: string;
  /** Initial Level data (optional if levelId is provided) */
  initialLevel?: LevelData;
  /** Initial Tasks list (optional if levelId is provided) */
  initialTasks?: TaskData[];
  /** Whether the current viewer has Admin review permissions */
  isAdmin?: boolean;
  /** Callback fired when a level reaches completed status */
  onLevelComplete?: (level: LevelData) => void;
  /** Additional custom classNames */
  className?: string;
}

export const LevelCard: React.FC<LevelCardProps> = ({
  levelId: propLevelId,
  initialLevel,
  initialTasks,
  isAdmin = false,
  onLevelComplete,
  className = '',
}) => {
  const [level, setLevel] = useState<LevelData | null>(initialLevel || null);
  const [tasks, setTasks] = useState<TaskData[]>(initialTasks || []);
  const [loading, setLoading] = useState<boolean>(!initialLevel && Boolean(propLevelId));
  const [actionLoadingTaskId, setActionLoadingTaskId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [realtimePulse, setRealtimePulse] = useState<boolean>(false);

  // Active Level ID (from props or initial object)
  const activeLevelId = propLevelId || level?.id;

  // -------------------------------------------------------------
  // 1. Initial Fetch: Fetch level and sister tasks ONCE on mount
  // -------------------------------------------------------------
  useEffect(() => {
    if (!activeLevelId) return;

    // If initial data wasn't pre-supplied, fetch once
    if (!initialLevel || !initialTasks) {
      setLoading(true);
      Promise.all([
        supabase.from('levels').select('*').eq('id', activeLevelId).single(),
        supabase
          .from('tasks')
          .select('*')
          .eq('level_id', activeLevelId)
          .order('task_number', { ascending: true }),
      ])
        .then(([levelRes, tasksRes]) => {
          if (levelRes.error && !initialLevel) {
            console.warn('Supabase levels query notice:', levelRes.error.message);
          } else if (levelRes.data) {
            setLevel(levelRes.data as LevelData);
          }

          if (tasksRes.error && !initialTasks) {
            console.warn('Supabase tasks query notice:', tasksRes.error.message);
          } else if (tasksRes.data) {
            setTasks(tasksRes.data as TaskData[]);
          }
        })
        .catch((err) => {
          console.error('Failed to load level/tasks:', err);
        })
        .finally(() => setLoading(false));
    }
  }, [activeLevelId]);

  // -------------------------------------------------------------
  // 2. Supabase Realtime Channel: Zero Polling / No Refetches
  // Updates local state DIRECTLY from postgres_changes payloads
  // -------------------------------------------------------------
  useEffect(() => {
    if (!activeLevelId) return;

    const channelName = `realtime:level-card-${activeLevelId}`;
    const channel = supabase
      .channel(channelName)
      // Listen to all Task changes under this level
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `level_id=eq.${activeLevelId}`,
        },
        (payload) => {
          // Trigger subtle visual pulse indicator showing live sync
          setRealtimePulse(true);
          setTimeout(() => setRealtimePulse(false), 1200);

          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as TaskData;
            setTasks((prev) =>
              prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
            );
          } else if (payload.eventType === 'INSERT') {
            const created = payload.new as TaskData;
            setTasks((prev) => {
              if (prev.some((t) => t.id === created.id)) return prev;
              return [...prev, created].sort((a, b) => a.task_number - b.task_number);
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string })?.id;
            if (deletedId) {
              setTasks((prev) => prev.filter((t) => t.id !== deletedId));
            }
          }
        }
      )
      // Listen to Level status updates (e.g. updated atomically by PostgreSQL Trigger)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'levels',
          filter: `id=eq.${activeLevelId}`,
        },
        (payload) => {
          const updatedLevel = payload.new as LevelData;
          setLevel((prev) => (prev ? { ...prev, ...updatedLevel } : updatedLevel));

          if (updatedLevel.status === 'completed') {
            onLevelComplete?.(updatedLevel);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeLevelId, onLevelComplete]);

  // -------------------------------------------------------------
  // 3. Admin Approval Action: Optimistic Update with Rollback
  // -------------------------------------------------------------
  const handleAdminApproveTask = useCallback(
    async (taskId: string) => {
      if (actionLoadingTaskId) return;
      setActionLoadingTaskId(taskId);
      setErrorMessage(null);

      // Snapshot previous state for rollback on error
      const previousTasks = [...tasks];
      const previousLevel = level ? { ...level } : null;

      // Optimistic update: mark task as approved immediately
      const nextTasks = tasks.map((t) =>
        t.id === taskId ? { ...t, status: 'approved' as const } : t
      );
      setTasks(nextTasks);

      // Check if all tasks are now approved (optimistic parent level completion)
      const allApproved =
        nextTasks.length > 0 && nextTasks.every((t) => t.status === 'approved');
      if (allApproved && level) {
        setLevel({ ...level, status: 'completed' });
      }

      try {
        const { error } = await supabase
          .from('tasks')
          .update({
            status: 'approved',
            updated_at: new Date().toISOString(),
          })
          .eq('id', taskId);

        if (error) {
          throw error;
        }
      } catch (err: any) {
        console.error('Optimistic approval failed, rolling back:', err);
        // Rollback on failure
        setTasks(previousTasks);
        setLevel(previousLevel);
        setErrorMessage(err.message || 'Failed to approve task. Rolled back changes.');
      } finally {
        setActionLoadingTaskId(null);
      }
    },
    [tasks, level, actionLoadingTaskId]
  );

  // -------------------------------------------------------------
  // Derived Statistics
  // -------------------------------------------------------------
  const totalTasks = tasks.length;
  const approvedTasksCount = useMemo(
    () => tasks.filter((t) => t.status === 'approved').length,
    [tasks]
  );
  const progressPercent = totalTasks > 0 ? Math.round((approvedTasksCount / totalTasks) * 100) : 0;
  const isLevelCompleted = level?.status === 'completed' || (totalTasks > 0 && approvedTasksCount === totalTasks);

  if (loading) {
    return (
      <div className="royal-card p-6 rounded-2xl animate-pulse space-y-4 text-center">
        <div className="w-8 h-8 border-2 border-[#168BFF]/30 border-t-[#FFD45A] rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400">Loading unified Level & Task architecture...</p>
      </div>
    );
  }

  return (
    <div
      className={`royal-card p-4 sm:p-6 rounded-2xl relative overflow-hidden transition-all duration-300 border ${
        isLevelCompleted
          ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10'
          : 'border-[#173C73] shadow-xl'
      } ${className}`}
    >
      {/* Realtime Live Pulse Indicator */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        <span
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            realtimePulse
              ? 'bg-[#10D6A0] scale-150 ring-4 ring-[#10D6A0]/40'
              : 'bg-emerald-400/80 animate-pulse'
          }`}
          title="Supabase Realtime Active"
        />
        <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">
          Realtime
        </span>
      </div>

      {/* Error Alert with Rollback Notification */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-500/15 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-[10px] underline text-red-200 hover:text-white cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================
          A. UNIFIED LEVEL HEADER
          ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-[#214B91]/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-[#FFD45A] bg-[#FFD45A]/10 px-2 py-0.5 rounded-md border border-[#FFD45A]/20">
              Level {level?.level_number || 1}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                isLevelCompleted
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
              }`}
            >
              {isLevelCompleted ? (
                <>
                  <CheckCircle2 className="w-3 h-3" /> Level Completed
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3" /> In Progress
                </>
              )}
            </span>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>{level?.title || `Level ${level?.level_number || 1}`}</span>
            {isLevelCompleted && <Sparkles className="w-4 h-4 text-[#FFD45A]" />}
          </h2>
          {level?.description && (
            <p className="text-[11px] text-slate-300 max-w-xl leading-relaxed">
              {level.description}
            </p>
          )}
        </div>

        {/* Level Completion Metrics */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="bg-[#020B20]/80 border border-[#214B91]/70 px-3 py-1.5 rounded-xl text-right">
            <span className="text-[9px] uppercase tracking-tight text-slate-400 block font-medium">
              Tasks Approved
            </span>
            <span className="text-xs sm:text-sm font-bold text-white block">
              {approvedTasksCount} / {totalTasks}
            </span>
          </div>
          {Number(level?.reward_amount || 0) > 0 && (
            <div className="bg-[#020B20]/80 border border-[#214B91]/70 px-3 py-1.5 rounded-xl text-right">
              <span className="text-[9px] uppercase tracking-tight text-slate-400 block font-medium">
                Level Reward
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#FFD45A] block">
                PKR {level?.reward_amount?.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4 space-y-1">
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>Overall Level Progress</span>
          <span className="font-bold text-white">{progressPercent}%</span>
        </div>
        <div className="w-full h-1.5 bg-[#020B20] rounded-full overflow-hidden border border-[#214B91]/40">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isLevelCompleted
                ? 'bg-gradient-to-r from-emerald-400 to-[#10D6A0]'
                : 'bg-gradient-to-r from-[#1264F5] to-[#22D3EE]'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* ========================================================
          B. SISTER TASKS LIST (COMPACT, REACTIVE)
          ======================================================== */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#22D3EE]" /> Associated Level Tasks ({totalTasks})
          </h3>
          {isAdmin && (
            <span className="text-[10px] text-[#FFD45A] font-semibold bg-[#FFD45A]/10 border border-[#FFD45A]/30 px-2 py-0.5 rounded">
              Admin Review Mode
            </span>
          )}
        </div>

        {tasks.length === 0 ? (
          <div className="p-4 rounded-xl bg-[#020B20]/60 border border-[#214B91]/40 text-center text-xs text-slate-400">
            No tasks registered under this level.
          </div>
        ) : (
          tasks.map((task) => {
            const isApproved = task.status === 'approved';
            const isRejected = task.status === 'rejected';
            const isPending = task.status === 'pending';
            const isProcessingThis = actionLoadingTaskId === task.id;

            return (
              <div
                key={task.id}
                className={`p-3 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                  isApproved
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : isRejected
                    ? 'bg-red-950/20 border-red-500/30'
                    : 'bg-[#020B20]/70 border-[#214B91]/50 hover:border-[#168BFF]/60'
                }`}
              >
                {/* Left: Task Info */}
                <div className="flex items-start gap-2.5 min-w-0">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5 ${
                      isApproved
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : isRejected
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : 'bg-[#061633] text-[#22D3EE] border border-[#173C73]'
                    }`}
                  >
                    #{task.task_number}
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-bold text-white truncate">{task.title}</h4>
                      {task.task_type && (
                        <span className="text-[9px] text-slate-300 bg-[#061633] border border-[#173C73] px-1.5 py-0.2 rounded">
                          {task.task_type}
                        </span>
                      )}
                      {Number(task.reward_amount || 0) > 0 && (
                        <span className="text-[9px] font-bold text-[#10D6A0] bg-[#10D6A0]/10 border border-[#10D6A0]/30 px-1.5 py-0.2 rounded">
                          +PKR {task.reward_amount}
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-[11px] text-slate-300 leading-normal line-clamp-1">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Status Pill & Admin Action Button */}
                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                  {/* Status Indicator */}
                  {isApproved && (
                    <span className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px]">
                      <CheckCircle2 className="w-3 h-3" /> Approved
                    </span>
                  )}
                  {isRejected && (
                    <span className="bg-red-500/15 border border-red-500/40 text-red-400 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px]">
                      <XCircle className="w-3 h-3" /> Rejected
                    </span>
                  )}
                  {isPending && (
                    <span className="bg-blue-500/15 border border-blue-500/40 text-blue-400 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px]">
                      <Clock className="w-3 h-3" /> Pending Review
                    </span>
                  )}

                  {/* Admin Approval Button with Optimistic UI */}
                  {isAdmin && !isApproved && (
                    <button
                      type="button"
                      disabled={isProcessingThis}
                      onClick={() => handleAdminApproveTask(task.id)}
                      className="px-2.5 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-[10px] rounded-lg shadow transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      title="Approve task (fires live Supabase Realtime broadcast)"
                    >
                      {isProcessingThis ? (
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <ShieldCheck className="w-3 h-3" />
                      )}
                      <span>Approve</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
