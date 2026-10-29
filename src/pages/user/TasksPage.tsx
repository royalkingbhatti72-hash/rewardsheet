import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Crown,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Shield,
  Award,
  Flame,
  Star,
  Gem,
  Medal,
  Trophy,
  Check,
  Zap,
  ArrowDownLeft,
  X,
  ShieldCheck,
  Sparkles,
  Layers,
  Target,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useBodyScrollLock } from '../../utils/useBodyScrollLock';

// Icons mapped to the 10 levels
const LEVEL_ICONS: Record<number, React.ElementType> = {
  1: Crown,
  2: Shield,
  3: Award,
  4: Flame,
  5: Star,
  6: Gem,
  7: Medal,
  8: Trophy,
  9: Zap,
  10: Crown,
};

// Tier metadata for all 10 levels
const TIER_METADATA: Record<
  number,
  {
    tierName: string;
    badge: string;
    bonus: number;
    points: number;
  }
> = {
  1: { tierName: 'Novice Rewards', badge: 'Tier 1', bonus: 500, points: 100 },
  2: { tierName: 'Bronze Earner', badge: 'Tier 2', bonus: 400, points: 100 },
  3: { tierName: 'Silver Verified', badge: 'Tier 3', bonus: 600, points: 100 },
  4: { tierName: 'Gold Sovereign', badge: 'Tier 4', bonus: 800, points: 100 },
  5: { tierName: 'Platinum Master', badge: 'Tier 5', bonus: 1000, points: 100 },
  6: { tierName: 'Diamond Prestige', badge: 'Tier 6', bonus: 1200, points: 100 },
  7: { tierName: 'Ruby Champion', badge: 'Tier 7', bonus: 1500, points: 100 },
  8: { tierName: 'Emerald Elite', badge: 'Tier 8', bonus: 2000, points: 100 },
  9: { tierName: 'Sapphire Royal', badge: 'Tier 9', bonus: 2500, points: 100 },
  10: { tierName: 'Imperial Pinnacle', badge: 'Tier 10', bonus: 3000, points: 100 },
};

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



export const TasksPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, wallet } = useAuth();

  const [levels, setLevels] = useState<any[]>([]);
  const [activeLevelNumber, setActiveLevelNumber] = useState<number>(1);
  const [currentLevelData, setCurrentLevelData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [unlockingLevel, setUnlockingLevel] = useState(false);
  const [unlockedLevels, setUnlockedLevels] = useState<Record<number, boolean>>({});

  const [congratsModalLevel, setCongratsModalLevel] = useState<any | null>(null);
  const [prepaidModalTask, setPrepaidModalTask] = useState<any | null>(null);

  useBodyScrollLock(Boolean(congratsModalLevel || prepaidModalTask));
  const tasksSectionRef = useRef<HTMLDivElement>(null);
  const tabsScrollRef = useRef<HTMLDivElement>(null);

  // Clean up any stale mock level keys from legacy versions
  useEffect(() => {
    try {
      for (let i = 1; i <= 10; i++) {
        localStorage.removeItem(`royal_completed_lvl_${i}`);
      }
    } catch {}
  }, []);

  // Compute User's Current Eligible Active Level
  const userCurrentLevelNumber = useMemo(() => {
    if (!levels || levels.length === 0) return 1;
    const activeUnlocked = levels.find(
      (l) => l.isUnlocked && (l.approvedTaskCount || 0) < (l.requiredTaskCount || 10)
    );
    if (activeUnlocked) return activeUnlocked.levelNumber;
    const lastUnlocked = levels.filter((l) => l.isUnlocked).slice(-1)[0];
    return lastUnlocked ? lastUnlocked.levelNumber : 1;
  }, [levels]);

  const { level, tasks = [], isLevelUnlocked } = currentLevelData || {};
  const selectedLevelSummary = levels.find((l) => l.levelNumber === activeLevelNumber);
  const isSelectedLevelLocked = selectedLevelSummary
    ? !selectedLevelSummary.isUnlocked && (selectedLevelSummary.approvedTaskCount || 0) < 10
    : !isLevelUnlocked;

  const liveApprovedTasksCount = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return 0;
    return tasks.filter((t: any) => {
      const uStatus = String(t.userStatus || '').toUpperCase();
      const status = String(t.status || '').toUpperCase();
      const subStatus = String(t.submission?.status || '').toUpperCase();
      return (
        uStatus === 'APPROVED' ||
        uStatus === 'COMPLETED' ||
        uStatus === 'DONE' ||
        status === 'APPROVED' ||
        status === 'COMPLETED' ||
        subStatus === 'APPROVED' ||
        t.isCompleted === true ||
        t.completed === true
      );
    }).length;
  }, [tasks]);

  const isLevelUnlockedByUser = (lvl: any) => {
    if (!lvl) return false;
    if (lvl.levelNumber === 1) return true;
    if (lvl.isUnlocked) return true;
    if (lvl.levelNumber <= userCurrentLevelNumber) return true;
    if (unlockedLevels[lvl.levelNumber]) return true;
    return false;
  };

  const handleSelectLevel = (levelNumber: number) => {
    if (levelNumber < 1 || levelNumber > 10) return;
    setActiveLevelNumber(levelNumber);
    setSearchParams({ level: String(levelNumber) });
    setActionError(null);

    // Scroll active tab into view smoothly
    if (tabsScrollRef.current) {
      const activeBtn = tabsScrollRef.current.querySelector(
        `[data-level="${levelNumber}"]`
      ) as HTMLElement;
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  };

  // Fetch all 10 levels
  const fetchLevels = async (keepCurrentSelection = false) => {
    try {
      const res = await api.getLevels({ bypassCache: true });
      const loadedLevels = res.levels || [];
      setLevels(loadedLevels);

      const userCurrent =
        loadedLevels.find((l: any) => l.isUnlocked && !l.isCompleted) ||
        loadedLevels.filter((l: any) => l.isUnlocked).slice(-1)[0] ||
        loadedLevels[0];
      const currentEligibleNumber = userCurrent ? userCurrent.levelNumber : 1;

      if (!keepCurrentSelection) {
        const paramLevel = parseInt(searchParams.get('level') || '', 10);
        const targetParamLvl = loadedLevels.find((l: any) => l.levelNumber === paramLevel);
        if (paramLevel >= 1 && paramLevel <= 10 && targetParamLvl && targetParamLvl.isUnlocked) {
          setActiveLevelNumber(paramLevel);
        } else {
          setActiveLevelNumber(currentEligibleNumber);
          setSearchParams({ level: String(currentEligibleNumber) }, { replace: true });
        }
      }
    } catch (err: any) {
      console.error(err);
      if (levels.length === 0) {
        setActionError('Failed to load level progression.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLevels();
  }, []);

  // Fetch tasks whenever active level changes
  useEffect(() => {
    if (!activeLevelNumber) return;
    setActionError(null);
    setActionSuccess(null);

    const cached = api.getCachedData<any>(`/tasks/levels/${activeLevelNumber}`);
    if (cached && cached.tasks && cached.tasks.length > 0) {
      setCurrentLevelData(cached);
      setTasksLoading(false);
    } else {
      setTasksLoading(true);
    }

    api
      .getLevelTasks(activeLevelNumber, { bypassCache: true })
      .then((data) => {
        setCurrentLevelData(data);
      })
      .catch((err) => {
        console.error(err);
        if (!cached) {
          setActionError(`Failed to load tasks for Level ${activeLevelNumber}.`);
        }
      })
      .finally(() => setTasksLoading(false));
  }, [activeLevelNumber]);

  // Realtime Live Update Listener
  useEffect(() => {
    const handleLiveEvent = (e: any) => {
      const type = e.detail?.type;
      if (type === 'wallet') return;

      if (type === 'task' || type === 'command' || type === 'all' || type === 'refresh') {
        const payload = e.detail?.payload;
        if (payload?.taskId && payload?.status) {
          setCurrentLevelData((prev: any) => {
            if (!prev || !prev.tasks) return prev;
            return {
              ...prev,
              tasks: prev.tasks.map((t: any) =>
                t.id === payload.taskId
                  ? {
                      ...t,
                      userStatus: payload.status,
                      ...(payload.status === 'APPROVED' ? { isPaidUnlocked: true } : {}),
                    }
                  : t
              ),
            };
          });
        }
        api.invalidateCache('/tasks');
        fetchLevels(true);
        api
          .getLevelTasks(activeLevelNumber, { bypassCache: true })
          .then((data) => setCurrentLevelData(data))
          .catch(() => {});
      }
    };

    window.addEventListener('royal_live_update', handleLiveEvent);
    return () => {
      window.removeEventListener('royal_live_update', handleLiveEvent);
    };
  }, [activeLevelNumber, userCurrentLevelNumber]);


  if (loading && levels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-10 h-10 border-4 border-[#1459E8]/30 border-t-[#FFD45A] rounded-full animate-spin" />
        <p className="text-xs text-[#B7C6E4] font-medium">Loading Tasks & Levels...</p>
      </div>
    );
  }

  const totalTasksCount =
    selectedLevelSummary?.requiredTaskCount ||
    level?.requiredTaskCount ||
    (tasks && tasks.length > 0 ? tasks.length : 0) ||
    (activeLevelNumber === 8 ? 15 : activeLevelNumber >= 9 ? 20 : 10);

  const summaryApprovedCount = selectedLevelSummary?.approvedTaskCount ?? 0;
  const approvedTaskCount = Math.max(summaryApprovedCount, liveApprovedTasksCount);
  const progressPercent = Math.min(100, Math.round((approvedTaskCount / totalTasksCount) * 100));

  const isSelectedLevelCompleted = Boolean(
    (approvedTaskCount >= totalTasksCount && totalTasksCount > 0) ||
    (tasks.length >= totalTasksCount &&
      totalTasksCount > 0 &&
      tasks.every((t: any) => {
        const uStatus = String(t.userStatus || '').toUpperCase();
        const status = String(t.status || '').toUpperCase();
        const subStatus = String(t.submission?.status || '').toUpperCase();
        return (
          uStatus === 'APPROVED' ||
          uStatus === 'COMPLETED' ||
          uStatus === 'DONE' ||
          status === 'APPROVED' ||
          status === 'COMPLETED' ||
          subStatus === 'APPROVED' ||
          t.isCompleted === true ||
          t.completed === true
        );
      }))
  );

  const meta = TIER_METADATA[activeLevelNumber] || TIER_METADATA[1];
  const LevelIcon = LEVEL_ICONS[activeLevelNumber] || Crown;

  // Unlock Level Handler
  const handleUnlockLevelAction = async (lvl: any) => {
    if (!lvl) return;
    setUnlockingLevel(true);
    setActionError(null);
    try {
      if (typeof (api as any).unlockLevel === 'function') {
        await (api as any).unlockLevel(lvl.levelNumber);
      }
      try {
        localStorage.setItem(`royal_unlocked_lvl_${lvl.levelNumber}`, 'true');
      } catch {}
      setUnlockedLevels((prev) => ({ ...prev, [lvl.levelNumber]: true }));
      triggerFireworks();
      setCongratsModalLevel(lvl);
      await fetchLevels(true);
      const updatedData = await api.getLevelTasks(lvl.levelNumber);
      setCurrentLevelData(updatedData);
    } catch (err: any) {
      console.error(err);
      setActionError(err.message || `Failed to unlock Level ${lvl.levelNumber}`);
    } finally {
      setUnlockingLevel(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 select-none pb-12">
      {/* Alert Notices */}
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-400 text-xs sm:text-sm flex items-center gap-2.5 shadow-md">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span className="font-semibold">{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-3.5 bg-red-500/15 border border-red-500/40 rounded-xl text-red-400 text-xs sm:text-sm flex items-center gap-2.5 shadow-md">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="font-semibold">{actionError}</span>
        </div>
      )}

      {/* ========================================================
          1. CLEAN LEVEL TABS (Fast & Simple 10-Level Switcher)
          ======================================================== */}
      <section className="bg-[#05142B] border border-[#16386E]/70 p-1.5 sm:p-2 rounded-2xl shadow-lg">
        <div
          ref={tabsScrollRef}
          className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-0.5"
        >
          {levels.map((lvl) => {
            const isSelected = lvl.levelNumber === activeLevelNumber;
            const lvlTotal = lvl.requiredTaskCount || 10;
            const lvlApproved = lvl.approvedTaskCount || 0;
            const isCompleted = lvlApproved >= lvlTotal;
            const isLocked = !lvl.isUnlocked && !isCompleted;

            return (
              <button
                key={lvl.id}
                data-level={lvl.levelNumber}
                onClick={() => handleSelectLevel(lvl.levelNumber)}
                className={`flex-1 min-w-[74px] sm:min-w-[84px] py-2 px-2 rounded-xl font-bold text-xs transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#1459E8] to-[#1264F5] text-white shadow-md ring-2 ring-[#FFD45A]/70 scale-[1.02]'
                    : isCompleted
                    ? 'bg-[#06242B] text-emerald-400 border border-emerald-500/30 hover:bg-[#08333D]'
                    : isLocked
                    ? 'bg-[#030E22]/60 text-slate-500 border border-[#102447]/60 hover:bg-[#051530]'
                    : 'bg-[#071D42] text-amber-300 border border-amber-500/30 hover:bg-[#0A275A]'
                }`}
              >
                <div className="flex items-center gap-1 text-[11px] sm:text-xs">
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : isLocked ? (
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>Lvl {lvl.levelNumber}</span>
                </div>
                <span
                  className={`text-[9px] font-semibold ${
                    isSelected
                      ? 'text-[#FFD45A]'
                      : isCompleted
                      ? 'text-emerald-400/80'
                      : isLocked
                      ? 'text-slate-500'
                      : 'text-amber-400/80'
                  }`}
                >
                  {isCompleted ? 'Completed' : isLocked ? 'Locked' : 'Processing'}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ========================================================
          2. ACTIVE LEVEL SUMMARY CARD (Crisp & Informative)
          Everything in one unified card: Icon, Name, Progress & Rewards
          ======================================================== */}
      <section className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#061B3D] via-[#082452] to-[#04122A] border border-[#184282]/80 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left: Icon & Level Details */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-[#1264F5] to-[#FFD45A] p-0.5 shadow-md flex-shrink-0">
              <div className="w-full h-full bg-[#030E24] rounded-[14px] flex items-center justify-center">
                <LevelIcon className="w-6 h-6 sm:w-7 sm:h-7 text-[#FFD45A]" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-black tracking-wider text-[#FFD45A] bg-[#FFD45A]/15 border border-[#FFD45A]/35 px-2 py-0.5 rounded-md">
                  Level {activeLevelNumber}
                </span>
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    isSelectedLevelCompleted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/40'
                      : isSelectedLevelLocked
                      ? 'bg-slate-800 text-slate-400 border border-slate-700'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-400/40'
                  }`}
                >
                  {isSelectedLevelCompleted
                    ? 'Completed'
                    : isSelectedLevelLocked
                    ? 'Locked'
                    : 'Processing'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                {meta.tierName}
              </h2>
            </div>
          </div>

          {/* Right: Bonus and Credit Points Reward Capsules */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Bonus Reward Pill */}
            <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#030E24]/90 border border-[#214B91]/50 shadow-sm backdrop-blur-md hover:border-emerald-500/40 transition-all">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-left leading-tight">
                <span className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Bonus</span>
                <span className="text-xs sm:text-sm font-black text-emerald-400">
                  PKR{' '}
                  {activeLevelNumber === 1
                    ? '500'
                    : level?.completionReward?.toLocaleString() || meta.bonus.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Credit Points Pill */}
            <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#030E24]/90 border border-[#214B91]/50 shadow-sm backdrop-blur-md hover:border-[#22D3EE]/40 transition-all">
              <div className="w-6 h-6 rounded-lg bg-[#22D3EE]/15 border border-[#22D3EE]/30 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" />
              </div>
              <div className="text-left leading-tight">
                <span className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Points</span>
                <span className="text-xs sm:text-sm font-black text-[#22D3EE]">
                  +{level?.totalCreditPoints || meta.points} CPs
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Clean Progress Bar */}
        <div className="space-y-1.5 pt-1 border-t border-[#16386E]/60">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#A6BCD9] font-medium flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[#FFD45A]" />
              Progress
            </span>
            <span className="font-bold text-white text-xs">
              {approvedTaskCount} / {totalTasksCount} Tasks Done ({progressPercent}%)
            </span>
          </div>

          <div className="w-full bg-[#030D1E] rounded-full h-2.5 overflow-hidden border border-[#16386E]/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#1459E8] via-[#22D3EE] to-emerald-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Notice if locked */}
        {isSelectedLevelLocked && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-3 text-xs">
            <span className="text-red-300">
              Complete all tasks in Level {activeLevelNumber - 1} to unlock this tier.
            </span>
            <button
              onClick={() => handleSelectLevel(userCurrentLevelNumber)}
              className="text-[#FFD45A] font-bold hover:underline flex-shrink-0 cursor-pointer"
            >
              Switch to Active Lvl {userCurrentLevelNumber} →
            </button>
          </div>
        )}
      </section>

      {/* Unlock Level Button (if unlocked & ready to activate) */}
      {selectedLevelSummary && !isSelectedLevelLocked && !isLevelUnlockedByUser(selectedLevelSummary) && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FFD45A]/20 via-[#071D42] to-emerald-500/20 border-2 border-[#FFD45A]/60 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h4 className="text-sm font-black text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#FFD45A]" />
              Level {activeLevelNumber} Ready for Activation!
            </h4>
            <p className="text-xs text-[#A6BCD9]">Click to activate your {totalTasksCount} new assignments.</p>
          </div>
          <button
            onClick={() => handleUnlockLevelAction(selectedLevelSummary)}
            disabled={unlockingLevel}
            className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#FFD45A] to-amber-400 hover:brightness-110 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer flex-shrink-0"
          >
            {unlockingLevel ? 'Activating...' : `Unlock Level ${activeLevelNumber} 🎉`}
          </button>
        </div>
      )}

      {/* ========================================================
          3. STANDALONE TASK CARDS (Clean, Easy & Direct)
          ======================================================== */}
      {/* ========================================================
          3. STANDALONE TASK ROWS (Compact, Clean & Direct)
          ======================================================== */}
      <section ref={tasksSectionRef} className="space-y-2">
        <div className="flex items-center justify-between px-1 mb-1">
          <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#22D3EE]" />
            <span>Tasks in Level {activeLevelNumber}</span>
          </h3>
          <span className="text-xs text-[#A6BCD9] font-medium">
            {approvedTaskCount} of {totalTasksCount} Approved
          </span>
        </div>

        {/* Desktop column header labels */}
        <div className="hidden sm:flex items-center justify-between px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-[#7E96BF]/80">
          <div className="flex-1">Task Assignment</div>
          <div className="flex items-center gap-5">
            <span className="w-16 text-center">Points</span>
            <span className="w-24 text-right">Reward</span>
            <span className="w-20 text-center">Action</span>
          </div>
        </div>

        {tasksLoading && (!tasks || tasks.length === 0) ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-8 h-8 border-3 border-[#1264F5]/30 border-t-[#FFD45A] rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#8194B7]">Loading tasks...</p>
          </div>
        ) : tasks && tasks.length > 0 ? (
          <div className="space-y-2">
            {tasks.map((task: any) => {
              const isPrepaid = Boolean(
                task.isPaid ||
                  (task.unlockFee && task.unlockFee > 0) ||
                  task.taskNumber === 5 ||
                  task.taskNumber === 10 ||
                  task.taskNumber === 15 ||
                  task.taskNumber === 20 ||
                  task.taskType?.toLowerCase().includes('prepaid')
              );
              const unlockFee = task.unlockFee || (isPrepaid ? 2000 : 0);

              // Level completion check: past levels remain fully openable.
              // Task 1 of any unlocked level is always openable.
              const isPastCompletedLevel =
                (selectedLevelSummary?.approvedTaskCount ?? 0) >= totalTasksCount;
              const isTaskLocked =
                isSelectedLevelLocked ||
                (task.userStatus === 'LOCKED' && !isPastCompletedLevel);
              const isApproved =
                !isSelectedLevelLocked &&
                (task.userStatus === 'APPROVED' || isPastCompletedLevel);
              const isPending =
                !isSelectedLevelLocked &&
                !isPastCompletedLevel &&
                task.userStatus === 'PENDING_VERIFICATION';
              const isRejected =
                !isSelectedLevelLocked &&
                !isPastCompletedLevel &&
                task.userStatus === 'REJECTED';

              const taskCPs = isPrepaid
                ? task.creditPoints && task.creditPoints > 5
                  ? task.creditPoints
                  : 30
                : task.creditPoints && task.creditPoints > 0
                ? task.creditPoints
                : 5;

              return (
                <div
                  id={`task-row-${task.taskNumber}`}
                  key={task.id}
                  onClick={() => {
                    navigate(`/app/tasks/${task.id}`);
                  }}
                  className={`flex items-center justify-between gap-3 p-2.5 sm:px-4 sm:py-3 rounded-xl border transition-all duration-150 ${
                    isTaskLocked
                      ? 'bg-[#040E24]/60 border-[#142C56]/40 opacity-75 hover:border-amber-500/40 cursor-pointer'
                      : isApproved
                      ? 'bg-[#06242B]/75 border-emerald-500/35 hover:border-emerald-400 cursor-pointer'
                      : isPending
                      ? 'bg-[#08224C]/75 border-[#168BFF]/40 hover:border-[#22D3EE] cursor-pointer'
                      : isPrepaid
                      ? 'bg-gradient-to-r from-[#142C58] to-[#07193A] border-[#FFD45A]/70 hover:border-[#FFD45A] cursor-pointer'
                      : 'bg-[#071E44]/80 border-[#1A4580]/70 hover:border-[#22D3EE] cursor-pointer'
                  }`}
                >
                  {/* Left: Task Number & Task Name (Always appearable!) */}
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <span
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0 ${
                        isApproved
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : isPending
                          ? 'bg-[#1264F5]/25 text-[#22D3EE]'
                          : isTaskLocked
                          ? 'bg-slate-800 text-slate-400'
                          : isPrepaid
                          ? 'bg-[#FFD45A] text-slate-950 font-black'
                          : 'bg-[#1459E8]/30 text-white'
                      }`}
                    >
                      #{task.taskNumber < 10 ? `0${task.taskNumber}` : task.taskNumber}
                    </span>

                    <div className="min-w-0 flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                        {cleanTaskTitle(task.title)}
                      </h4>

                      {isPrepaid && (
                        <span className="hidden sm:inline-flex text-[9px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/20 border border-amber-400/30 px-1.5 py-0.5 rounded flex-shrink-0">
                          Prepaid (PKR {unlockFee.toLocaleString()})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Credit Points, PKR Reward, Option to Open */}
                  <div className="flex items-center gap-2.5 sm:gap-5 flex-shrink-0">
                    {/* Credit Points */}
                    <span className="text-[10px] sm:text-xs font-black text-[#22D3EE] bg-[#22D3EE]/10 border border-[#22D3EE]/20 px-2 py-1 rounded-md whitespace-nowrap">
                      +{taskCPs} CPs
                    </span>

                    {/* PKR Reward */}
                    <span className="text-xs sm:text-sm font-black text-[#FFD45A] whitespace-nowrap min-w-[65px] sm:min-w-[75px] text-right">
                      PKR {task.rewardAmount?.toLocaleString()}
                    </span>

                    {/* Option to Open / View */}
                    <div className="flex-shrink-0">
                      {isTaskLocked ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/app/tasks/${task.id}`);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-400 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Lock className="w-3 h-3 text-amber-400" />
                          <span className="hidden sm:inline">Locked</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/app/tasks/${task.id}`);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                            isApproved
                              ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40'
                              : isPending
                              ? 'bg-[#1264F5]/20 hover:bg-[#1264F5]/30 text-[#22D3EE] border border-[#168BFF]/40'
                              : isPrepaid
                              ? 'bg-gradient-to-r from-[#FFD45A] to-amber-400 text-slate-950 hover:brightness-110'
                              : 'bg-[#1459E8] hover:bg-[#1264F5] text-white'
                          }`}
                        >
                          <span>Open</span>
                          {isApproved ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <ArrowRight className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center rounded-2xl bg-[#071B3A] border border-[#173C73]">
            <p className="text-[#8194B7] text-xs">No tasks found for this tier.</p>
          </div>
        )}
      </section>

      {/* Level Completed Celebration Banner */}
      {isSelectedLevelCompleted && activeLevelNumber < 10 && (
        <section className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-[#071F42] to-emerald-500/15 border border-emerald-400/40 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Level {activeLevelNumber} Completed! 🎉
            </h4>
            <p className="text-[11px] text-slate-300">
              Bonus credited! Ready for Level {activeLevelNumber + 1}?
            </p>
          </div>

          <button
            onClick={() => {
              const nextLevelNum = activeLevelNumber + 1;
              handleSelectLevel(nextLevelNum);
              const nextLvl = levels.find((l) => l.levelNumber === nextLevelNum);
              if (nextLvl && !isLevelUnlockedByUser(nextLvl)) {
                handleUnlockLevelAction(nextLvl);
              }
            }}
            className="py-2 px-4 rounded-xl bg-gradient-to-r from-[#FFD45A] to-amber-400 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer flex-shrink-0"
          >
            Advance to Level {activeLevelNumber + 1} →
          </button>
        </section>
      )}

      {/* Level Unlocked Celebration Modal */}
      {congratsModalLevel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="royal-card w-full max-w-sm p-6 rounded-3xl border border-[#FFD45A]/60 bg-[#081F44] text-center space-y-4 relative shadow-2xl">
            <button
              onClick={() => setCongratsModalLevel(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-[#040F24] text-slate-400 hover:text-white border border-[#173C73]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-[#FFD45A]/20 border border-[#FFD45A]/40 mx-auto flex items-center justify-center text-[#FFD45A]">
              <Trophy className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">
                Level {congratsModalLevel.levelNumber} Unlocked!
              </h3>
              <p className="text-xs text-[#B7C6E4]">
                {congratsModalLevel.requiredTaskCount || (congratsModalLevel.levelNumber === 8 ? 15 : congratsModalLevel.levelNumber >= 9 ? 20 : 10)} new assignments are now available. Complete them to earn bonus rewards.
              </p>
            </div>

            <button
              onClick={() => setCongratsModalLevel(null)}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#FFD45A] to-amber-400 text-slate-950 font-black text-xs shadow-md cursor-pointer"
            >
              Start Level {congratsModalLevel.levelNumber}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
