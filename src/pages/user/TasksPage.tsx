import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  RefreshCw,
  Gift,
  Check,
  Zap,
  ArrowDownLeft,
  Wallet,
  X,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

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

const triggerFireworks = () => {
  const duration = 3.5 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 99999 };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  const interval: any = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);

    // Left firework cannon
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ['#FFD45A', '#1459E8', '#22D3EE', '#10D6A0', '#FF4D6D', '#F59E0B'],
    });
    // Right firework cannon
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ['#FFD45A', '#1459E8', '#22D3EE', '#10D6A0', '#FF4D6D', '#F59E0B'],
    });
    // Center rocket
    confetti({
      ...defaults,
      particleCount: particleCount * 0.7,
      origin: { x: 0.5, y: randomInRange(0.1, 0.4) },
      colors: ['#FFD45A', '#FFFFFF', '#22D3EE', '#10D6A0'],
    });
  }, 250);
};

const cleanTaskTitle = (title: string) => {
  if (!title) return '';
  if (title.startsWith('Prepaid Task')) return title;
  return title.replace(/\s+Task\s*#?\d+$/i, '').trim();
};

export const TasksPage: React.FC = () => {
  const { user, refreshUser, wallet } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [unlockedLevels, setUnlockedLevels] = useState<{ [lvlNum: number]: boolean }>(() => {
    const stored: { [key: number]: boolean } = { 1: true };
    try {
      for (let i = 2; i <= 10; i++) {
        if (localStorage.getItem(`royal_unlocked_lvl_${i}`) === 'true') {
          stored[i] = true;
        }
      }
    } catch {}
    return stored;
  });

  const [congratsModalLevel, setCongratsModalLevel] = useState<any | null>(null);

  const isLevelUnlockedByUser = (lvl: any) => {
    if (!lvl) return false;
    if (lvl.levelNumber === 1) return true;
    if ((lvl.approvedTaskCount || 0) > 0) return true;
    return !!unlockedLevels[lvl.levelNumber];
  };

  const handleUnlockLevelAction = (lvl: any) => {
    if (!lvl) return;
    try {
      localStorage.setItem(`royal_unlocked_lvl_${lvl.levelNumber}`, 'true');
    } catch {}
    setUnlockedLevels((prev) => ({ ...prev, [lvl.levelNumber]: true }));
    setCongratsModalLevel(lvl);
    triggerFireworks();
  };

  const DEFAULT_FALLBACK_LEVELS = Array.from({ length: 10 }, (_, i) => ({
    id: `lvl-${i + 1}`,
    levelNumber: i + 1,
    title: `Level ${i + 1}`,
    description: `Tier ${i + 1} Assignment`,
    isUnlocked: i === 0,
    isCompleted: false,
    approvedTaskCount: 0,
    requiredTaskCount: 10,
    completionReward: (i + 1) * 200,
    totalCreditPoints: 100,
  }));
  const cachedLevels = api.getCachedData<any>('/tasks/levels');
  const [levels, setLevels] = useState<any[]>(cachedLevels?.levels || DEFAULT_FALLBACK_LEVELS);
  const [activeLevelNumber, setActiveLevelNumber] = useState<number>(() => {
    const paramLevel = parseInt(new URLSearchParams(window.location.search).get('level') || '', 10);
    if (paramLevel >= 1 && paramLevel <= 10) return paramLevel;
    if (cachedLevels?.levels) {
      const userCurrent =
        cachedLevels.levels.find((l: any) => l.isUnlocked && !l.isCompleted) ||
        cachedLevels.levels.filter((l: any) => l.isUnlocked).slice(-1)[0] ||
        cachedLevels.levels[0];
      return userCurrent ? userCurrent.levelNumber : 1;
    }
    return 1;
  });

  const [currentLevelData, setCurrentLevelData] = useState<any>(() => {
    const paramLevel = parseInt(new URLSearchParams(window.location.search).get('level') || '', 10) || 1;
    return api.getCachedData<any>(`/tasks/levels/${paramLevel}`);
  });
  const [loading, setLoading] = useState(!cachedLevels);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [unlockingTaskId, setUnlockingTaskId] = useState<string | null>(null);
  const [prepaidModalTask, setPrepaidModalTask] = useState<any | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const carouselRef = useRef<HTMLDivElement>(null);
  const tasksSectionRef = useRef<HTMLDivElement>(null);

  // Fetch all 10 levels with user progression
  const fetchLevels = async (keepCurrentSelection = false) => {
    try {
      const res = await api.getLevels();
      const loadedLevels = res.levels || [];
      setLevels(loadedLevels);

      // Determine user's actual CURRENT ELIGIBLE rank from database
      const userCurrent =
        loadedLevels.find((l: any) => l.isUnlocked && !l.isCompleted) ||
        loadedLevels.filter((l: any) => l.isUnlocked).slice(-1)[0] ||
        loadedLevels[0];
      const currentEligibleNumber = userCurrent ? userCurrent.levelNumber : 1;

      if (!keepCurrentSelection) {
        // Check URL search param, but ONLY if explicitly provided and valid
        const paramLevel = parseInt(searchParams.get('level') || '', 10);
        if (paramLevel >= 1 && paramLevel <= 10) {
          setActiveLevelNumber(paramLevel);
        } else {
          // Default to the user's actual CURRENT ELIGIBLE LEVEL (e.g. Level 1)
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

  // Fetch tasks whenever selected level number changes
  useEffect(() => {
    if (!activeLevelNumber) return;
    const cached = api.getCachedData<any>(`/tasks/levels/${activeLevelNumber}`);
    if (cached) {
      setCurrentLevelData(cached);
      setTasksLoading(false);
    } else {
      setTasksLoading(true);
    }
    setActionError(null);
    setActionSuccess(null);

    api
      .getLevelTasks(activeLevelNumber)
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

    // Center selected card in carousel
    scrollToSelectedCard(activeLevelNumber);
  }, [activeLevelNumber]);

  // Realtime Live Update Listener (Zero Reload Strategy)
  useEffect(() => {
    const handleLiveEvent = (e: any) => {
      const type = e.detail?.type;
      if (type === 'task' || type === 'notification' || type === 'wallet' || type === 'command' || type === 'all') {
        api.invalidateCache('/tasks');
        fetchLevels(true);
        if (activeLevelNumber) {
          api
            .getLevelTasks(activeLevelNumber)
            .then((data) => setCurrentLevelData(data))
            .catch(() => {});
        }
      }
    };

    const handleHeartbeat = () => {
      if (activeLevelNumber) {
        api
          .getLevelTasks(activeLevelNumber)
          .then((data) => setCurrentLevelData(data))
          .catch(() => {});
      }
    };

    window.addEventListener('royal_live_update', handleLiveEvent);
    window.addEventListener('royal_live_heartbeat', handleHeartbeat);
    return () => {
      window.removeEventListener('royal_live_update', handleLiveEvent);
      window.removeEventListener('royal_live_heartbeat', handleHeartbeat);
    };
  }, [activeLevelNumber]);

  const scrollToSelectedCard = (levelNum: number) => {
    setTimeout(() => {
      const card = document.getElementById(`carousel-card-${levelNum}`);
      if (card && carouselRef.current) {
        const container = carouselRef.current;
        const cardLeft = card.offsetLeft;
        const cardWidth = card.offsetWidth;
        const containerWidth = container.offsetWidth;
        const scrollTarget = cardLeft - containerWidth / 2 + cardWidth / 2;
        container.scrollTo({ left: scrollTarget, behavior: 'smooth' });
      }
    }, 80);
  };

  // Synchronized level selection through Carousel
  const handleSelectLevel = (levelNumber: number) => {
    if (levelNumber < 1 || levelNumber > 10) return;
    setActiveLevelNumber(levelNumber);
    setSearchParams({ level: String(levelNumber) });
  };

  const handlePrevLevel = () => {
    if (activeLevelNumber > 1) {
      handleSelectLevel(activeLevelNumber - 1);
    }
  };

  const handleNextLevel = () => {
    if (activeLevelNumber < 10) {
      handleSelectLevel(activeLevelNumber + 1);
    }
  };

  const scrollToTasksSection = () => {
    if (tasksSectionRef.current) {
      tasksSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Paid task unlocking
  const handleUnlockTask = async (taskId: string) => {
    setUnlockingTaskId(taskId);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await api.unlockTask(taskId);
      setActionSuccess(res.message);
      await refreshUser();
      const updated = await api.getLevelTasks(activeLevelNumber);
      setCurrentLevelData(updated);
      const resLevels = await api.getLevels();
      setLevels(resLevels.levels || []);
    } catch (err: any) {
      setActionError(err.message || 'Failed to unlock task');
    } finally {
      setUnlockingTaskId(null);
    }
  };

  // Compute User's ACTUAL CURRENT ELIGIBLE Level
  const userCurrentLevel =
    levels.find((l) => l.isUnlocked && !l.isCompleted) ||
    levels.filter((l) => l.isUnlocked).slice(-1)[0] ||
    levels[0];
  const userCurrentLevelNumber = userCurrentLevel?.levelNumber || 1;

  if (loading && levels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-10 h-10 border-4 border-[#1459E8]/30 border-t-[#FFD45A] rounded-full animate-spin" />
        <p className="text-xs text-[#B7C6E4] font-medium">Loading Tasks & Levels...</p>
      </div>
    );
  }

  const { level, tasks = [], isLevelUnlocked } = currentLevelData || {};
  const selectedLevelSummary = levels.find((l) => l.levelNumber === activeLevelNumber);
  const isSelectedLevelLocked = selectedLevelSummary
    ? !selectedLevelSummary.isUnlocked
    : !isLevelUnlocked;
  const isSelectedLevelCompleted =
    selectedLevelSummary?.isCompleted ||
    (tasks.length === 10 && tasks.every((t: any) => t.userStatus === 'APPROVED'));

  // Prerequisite level information for locked levels
  const previousLevelSummary =
    activeLevelNumber > 1 ? levels.find((l) => l.levelNumber === activeLevelNumber - 1) : null;
  const previousLevelApprovedTasks = previousLevelSummary?.approvedTaskCount || 0;
  const approvedTaskCount = selectedLevelSummary?.approvedTaskCount || 0;
  const progressPercent = Math.min(100, Math.round((approvedTaskCount / 10) * 100));

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto">
      {/* Action Messages */}
      {actionSuccess && (
        <div className="p-3.5 bg-[#10D6A0]/15 border border-[#10D6A0]/40 rounded-2xl text-[#10D6A0] text-xs flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#10D6A0] flex-shrink-0" />
          <span className="font-medium">{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-3.5 bg-[#EF4444]/15 border border-[#EF4444]/40 rounded-2xl text-[#EF4444] text-xs flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
          <span className="font-medium">{actionError}</span>
        </div>
      )}



      {/* ========================================================
          C. HORIZONTAL LEVEL CARD CAROUSEL (OPTION 1)
          Prominent centered selected card, side peeks, touch scroll,
          and arrow controls for all 10 standard levels
          ======================================================== */}
      <section className="relative px-2 sm:px-8 select-none">
        {/* Floating Left Navigation Button */}
        <button
          onClick={handlePrevLevel}
          disabled={activeLevelNumber === 1}
          className="absolute left-0 sm:left-2 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-[#061633]/90 border border-[#173C73] text-white hover:border-[#168BFF] flex items-center justify-center shadow-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="Previous Level"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Floating Right Navigation Button */}
        <button
          onClick={handleNextLevel}
          disabled={activeLevelNumber === 10}
          className="absolute right-0 sm:right-2 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-[#061633]/90 border border-[#173C73] text-white hover:border-[#168BFF] flex items-center justify-center shadow-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="Next Level"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Horizontal Carousel Track */}
        <div
          ref={carouselRef}
          className="flex items-center gap-3 sm:gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory py-4 px-8 sm:px-14 scrollbar-none justify-start"
          style={{ scrollPadding: '2.5rem' }}
        >
          {levels.map((lvl) => {
            const isSelected = lvl.levelNumber === activeLevelNumber;
            const isCurrent = lvl.levelNumber === userCurrentLevelNumber;
            const isCompleted = lvl.isCompleted;
            const isLocked = !lvl.isUnlocked;
            const isReadyToUnlock = lvl.isUnlocked && !isCompleted && !isLevelUnlockedByUser(lvl);
            const approved = lvl.approvedTaskCount || 0;
            const lvlProgressPercent = Math.min(100, Math.round((approved / (lvl.requiredTaskCount || 10)) * 100));
            const LevelIconComponent = LEVEL_ICONS[lvl.levelNumber] || Crown;

            return (
              <div
                id={`carousel-card-${lvl.levelNumber}`}
                key={lvl.id}
                onClick={() => handleSelectLevel(lvl.levelNumber)}
                className={`flex-shrink-0 rounded-3xl p-5 sm:p-6 transition-all duration-300 snap-center cursor-pointer flex flex-col items-center text-center relative overflow-hidden select-none ${
                  isSelected
                    ? isLocked
                      ? 'w-[250px] sm:w-[280px] md:w-[310px] bg-gradient-to-b from-[#091E42] via-[#071B3A] to-[#04132F] border-2 border-[#F59E0B] shadow-2xl shadow-[#F59E0B]/20 ring-2 ring-[#FFD45A]/50 z-20 scale-100'
                      : 'w-[250px] sm:w-[280px] md:w-[310px] bg-gradient-to-b from-[#0B2248] via-[#071B3A] to-[#04132F] border-2 border-[#168BFF] shadow-2xl shadow-[#168BFF]/40 ring-2 ring-[#FFD45A]/70 z-20 scale-100'
                    : isLocked
                    ? 'w-[200px] sm:w-[230px] md:w-[245px] bg-[#051329]/80 border border-[#173C73]/60 opacity-60 hover:opacity-85 scale-90'
                    : 'w-[200px] sm:w-[230px] md:w-[245px] bg-[#071B3A]/80 border border-[#173C73] opacity-70 hover:opacity-95 scale-90'
                }`}
              >
                {/* Glow behind center icon for active card */}
                {isSelected && (
                  <div
                    className={`absolute top-4 w-32 h-32 rounded-full blur-2xl pointer-events-none ${
                      isLocked ? 'bg-[#F59E0B]/15' : 'bg-[#FFD45A]/15'
                    }`}
                  />
                )}

                {/* Level Badge / Icon */}
                <div className="relative mb-3 flex items-center justify-center">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-base transition-transform ${
                      isSelected
                        ? isLocked
                          ? 'bg-gradient-to-tr from-[#F59E0B] to-[#FFD45A] p-0.5 shadow-lg shadow-[#F59E0B]/30 scale-105'
                          : 'bg-gradient-to-tr from-[#1264F5] to-[#FFD45A] p-0.5 shadow-lg shadow-[#1264F5]/40 scale-105'
                        : 'bg-[#061633] text-[#8194B7] border border-[#173C73]'
                    }`}
                  >
                    <div className="w-full h-full bg-[#04132F] rounded-[14px] flex items-center justify-center">
                      {isLocked ? (
                        <Lock
                          className={`w-7 h-7 ${isSelected ? 'text-[#FFD45A]' : 'text-slate-500'}`}
                        />
                      ) : isReadyToUnlock ? (
                        <Unlock className="w-7 h-7 text-[#FFD45A] animate-pulse" />
                      ) : (
                        <LevelIconComponent
                          className={`w-7 h-7 ${isSelected ? 'text-[#FFD45A]' : 'text-slate-400'}`}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Level Number & Title */}
                <div className="mb-2 space-y-0.5">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block ${
                      isReadyToUnlock
                        ? 'bg-gradient-to-r from-[#FFD45A]/25 to-[#10D6A0]/25 text-[#FFD45A] border border-[#FFD45A]/50 animate-pulse'
                        : isCurrent
                        ? 'bg-[#1264F5]/25 text-[#22D3EE] border border-[#168BFF]/40'
                        : isCompleted
                        ? 'bg-[#10D6A0]/20 text-[#10D6A0] border border-[#10D6A0]/30'
                        : isLocked
                        ? 'bg-[#061633] text-slate-400 border border-[#173C73]'
                        : 'bg-[#061633] text-[#B7C6E4] border border-[#173C73]'
                    }`}
                  >
                    {isReadyToUnlock
                      ? 'Ready to Unlock'
                      : isCurrent
                      ? 'Current Level'
                      : isCompleted
                      ? 'Completed'
                      : isLocked
                      ? 'Locked'
                      : 'Open'}
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-tight pt-1">
                    Level {lvl.levelNumber}
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-[#22D3EE] tracking-wide truncate max-w-[200px]">
                    {lvl.title}
                  </p>
                </div>

                {/* Progress Bar & Ratio */}
                <div className="w-full space-y-1.5 mb-4">
                  <div className="w-full h-2 bg-[#061633] rounded-full overflow-hidden border border-[#173C73]/50">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted
                          ? 'bg-[#10D6A0]'
                          : isLocked
                          ? 'bg-slate-600'
                          : 'bg-gradient-to-r from-[#1264F5] via-[#22D3EE] to-[#FFD45A]'
                      }`}
                      style={{ width: `${lvlProgressPercent}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-[#B7C6E4] block">
                    {isCompleted
                      ? 'Level Completed'
                      : isLocked
                      ? 'Locked Level'
                      : isReadyToUnlock
                      ? 'Ready to Activate'
                      : `${approved} Tasks Completed`}
                  </span>
                  <div className="pt-1 flex items-center justify-center gap-1.5 text-[10px] flex-wrap">
                    <span className="text-[#10D6A0] font-black">
                      Bonus: PKR {lvl.completionReward?.toLocaleString()}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-[#22D3EE] font-bold">
                      {lvl.totalCreditPoints || 100} CPs
                    </span>
                  </div>
                </div>

                {/* Action Button inside Card */}
                <div className="w-full">
                  {isReadyToUnlock ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectLevel(lvl.levelNumber);
                        handleUnlockLevelAction(lvl);
                      }}
                      className="w-full py-2.5 px-4 rounded-full text-xs font-black shadow-lg flex items-center justify-center gap-1.5 transition-all transform hover:scale-105 active:scale-95 bg-gradient-to-r from-[#FFD45A] via-amber-400 to-[#10D6A0] text-[#020B20] shadow-[#FFD45A]/30 animate-pulse cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Unlock Level {lvl.levelNumber}</span>
                    </button>
                  ) : isSelected ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        scrollToTasksSection();
                      }}
                      className={`w-full py-2.5 px-4 rounded-full text-xs font-black shadow-lg flex items-center justify-center gap-1.5 transition-all transform hover:scale-[1.02] ${
                        isLocked
                          ? 'bg-gradient-to-r from-[#F59E0B] to-[#FFD45A] text-[#020B20] shadow-[#F59E0B]/20'
                          : 'bg-gradient-to-r from-[#FFD45A] to-[#F59E0B] text-[#020B20] shadow-[#FFD45A]/25'
                      }`}
                    >
                      <span>{isLocked ? 'Locked Level' : 'View Tasks'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#061633] border border-[#173C73] text-[10px] text-[#8194B7] font-medium">
                      {isLocked ? (
                        <Lock className="w-2.5 h-2.5" />
                      ) : (
                        <Check className="w-2.5 h-2.5 text-[#10D6A0]" />
                      )}
                      <span>{isLocked ? 'Locked' : isCompleted ? 'Completed' : 'Select'}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Carousel Dot Indicators */}
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {levels.map((lvl) => (
            <button
              key={lvl.id}
              onClick={() => handleSelectLevel(lvl.levelNumber)}
              className={`transition-all rounded-full ${
                lvl.levelNumber === activeLevelNumber
                  ? 'w-5 h-1.5 bg-[#22D3EE]'
                  : 'w-1.5 h-1.5 bg-[#173C73] hover:bg-[#8194B7]'
              }`}
              title={`Level ${lvl.levelNumber}`}
            />
          ))}
        </div>
      </section>

      {/* Locked Notice if selected level is locked */}
      {isSelectedLevelLocked && (
        <div className="p-3.5 rounded-xl bg-[#061633] border border-[#F59E0B]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <p className="font-bold text-[#FFD45A] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#F59E0B]" />
              Level {activeLevelNumber} is locked. Complete all tasks in Level{' '}
              {activeLevelNumber - 1} to unlock it.
            </p>
            {previousLevelSummary && (
              <p className="text-[#B7C6E4] text-[11px]">
                Level {activeLevelNumber - 1} Progress: {previousLevelApprovedTasks} tasks approved.
              </p>
            )}
          </div>

          <button
            onClick={() => handleSelectLevel(userCurrentLevelNumber)}
            className="inline-flex items-center gap-1 bg-[#1264F5] hover:bg-[#168BFF] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all shadow-sm self-start sm:self-auto flex-shrink-0"
          >
            <span>Go to Level {userCurrentLevelNumber}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* ========================================================
          E. SEQUENTIAL TASK LIST (COMPACT HORIZONTAL CARDS)
          Clear hierarchy: Number & icon left | Info center | Action right
          ======================================================== */}
      <section ref={tasksSectionRef} className="space-y-4 scroll-mt-20">

        {tasksLoading && (!tasks || tasks.length === 0) ? (
          <div className="py-16 text-center space-y-2">
            <div className="w-8 h-8 border-3 border-[#1264F5]/30 border-t-[#FFD45A] rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#8194B7]">Evaluating task prerequisites...</p>
          </div>
        ) : isSelectedLevelLocked ? (
          <div className="p-8 text-center rounded-2xl bg-[#071B3A] border border-[#173C73] space-y-3">
            <Lock className="w-10 h-10 text-[#F59E0B] mx-auto" />
            <h4 className="text-sm sm:text-base font-bold text-white">
              Level {activeLevelNumber} Tasks are Locked
            </h4>
            <p className="text-xs text-[#8194B7] max-w-md mx-auto">
              This level's tasks are hidden until you unlock Level {activeLevelNumber}.
            </p>
            <button
              onClick={() => handleSelectLevel(userCurrentLevelNumber)}
              className="inline-flex items-center gap-1.5 bg-[#1264F5] hover:bg-[#168BFF] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md mt-2"
            >
              <span>Back to Current Level {userCurrentLevelNumber}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : selectedLevelSummary && !isLevelUnlockedByUser(selectedLevelSummary) ? (
          /* ========================================================
             LEVEL UNLOCK GATEWAY (Ready to Unlock with Celebration)
             ======================================================== */
          <div className="p-8 sm:p-10 text-center rounded-3xl bg-gradient-to-b from-[#091E42] via-[#071B3A] to-[#04132F] border-2 border-[#FFD45A]/50 shadow-2xl shadow-[#FFD45A]/20 space-y-5 relative overflow-hidden">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#1264F5] via-[#FFD45A] to-[#10D6A0] p-1 mx-auto shadow-xl shadow-[#FFD45A]/30">
              <div className="w-full h-full bg-[#04132F] rounded-[22px] flex items-center justify-center">
                <Trophy className="w-10 h-10 text-[#FFD45A] animate-bounce" />
              </div>
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFD45A]/15 border border-[#FFD45A]/40 text-[#FFD45A] text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> Level {activeLevelNumber} Ready
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Unlock Level {activeLevelNumber}: {selectedLevelSummary?.title}
              </h3>
              <p className="text-xs text-[#B7C6E4] leading-relaxed">
                You have reached Level {activeLevelNumber}! Click the unlock button below to celebrate your progress with fireworks and activate your new tier assignments.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => handleUnlockLevelAction(selectedLevelSummary)}
                className="py-3.5 px-8 rounded-full bg-gradient-to-r from-[#FFD45A] via-amber-400 to-[#10D6A0] hover:brightness-110 text-[#020B20] font-black text-sm shadow-xl shadow-[#FFD45A]/30 transition-all transform hover:scale-105 active:scale-95 inline-flex items-center gap-2 cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>Unlock Level {activeLevelNumber} Now 🎉</span>
              </button>
            </div>
          </div>
        ) : tasks && tasks.length > 0 ? (
          <div className="space-y-1 sm:space-y-1.5">
            {tasks.map((task: any) => {
              const userBalance = wallet?.availableBalance || 0;
              const unlockFee = task.unlockFee || 0;
              const remainingDepositNeeded = Math.max(0, unlockFee - userBalance);
              const hasSufficientBalance = userBalance >= unlockFee;

              const isTaskLocked = isSelectedLevelLocked || task.userStatus === 'LOCKED';
              const isApproved = !isSelectedLevelLocked && task.userStatus === 'APPROVED';
              const isPending =
                !isSelectedLevelLocked && task.userStatus === 'PENDING_VERIFICATION';
              const isRejected = !isSelectedLevelLocked && task.userStatus === 'REJECTED';

              const isAvailable =
                !isSelectedLevelLocked &&
                !isApproved &&
                !isPending &&
                !isRejected &&
                !isTaskLocked;

              // ----------------------------------------------------
              // LOCKED TASK ROW (Until client reaches the task)
              // Task name and quantity are hidden.
              // Visible things: CPs and PKR reward.
              // ----------------------------------------------------
              if (isTaskLocked) {
                return (
                  <div
                    id={`task-card-${task.taskNumber}`}
                    key={task.id}
                    className="py-1.5 px-2.5 sm:px-3 rounded-lg bg-[#061633]/60 border border-[#173C73]/40 flex items-center justify-between gap-2 opacity-80 select-none transition-all hover:bg-[#071B3A]/60"
                  >
                    {/* Left: Lock Icon & Hidden Task Name with CPs and PKR Reward visible */}
                    <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                      <div className="w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-md bg-[#071B3A] border border-[#173C73] flex items-center justify-center flex-shrink-0 text-slate-500 font-bold text-[10px]">
                        <Lock className="w-3 h-3 text-slate-500" />
                      </div>

                      <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden flex-nowrap">
                        <span className="text-[11px] sm:text-xs font-semibold text-slate-400 truncate">
                          Locked Task
                        </span>

                        <span className="text-[9px] font-bold text-[#22D3EE] bg-[#22D3EE]/10 border border-[#22D3EE]/25 px-1.5 py-0.5 rounded-full leading-none flex-shrink-0 whitespace-nowrap">
                          +{task.creditPoints || 5} CPs
                        </span>

                        <span className="text-[9px] font-bold text-[#10D6A0] bg-[#10D6A0]/10 border border-[#10D6A0]/25 px-1.5 py-0.5 rounded-full leading-none flex-shrink-0 whitespace-nowrap">
                          PKR {task.rewardAmount?.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Right: Locked Action strictly in 1 line */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-medium text-slate-500 bg-[#061633] px-2 py-0.5 rounded-md border border-[#173C73] whitespace-nowrap leading-none">
                        <Lock className="w-2.5 h-2.5" /> Locked
                      </span>
                    </div>
                  </div>
                );
              }

              // ----------------------------------------------------
              // UNLOCKED TASK ROW (Ultra-Compact Single Line)
              // ----------------------------------------------------
              return (
                <div
                  id={`task-card-${task.taskNumber}`}
                  key={task.id}
                  onClick={() => {
                    navigate(`/app/tasks/${task.id}`);
                  }}
                  className={`py-1.5 px-2.5 sm:px-3 rounded-lg flex items-center justify-between gap-2 transition-all bg-[#071B3A] border cursor-pointer ${
                    isApproved
                      ? 'border-[#10D6A0]/40 hover:border-[#10D6A0]/70'
                      : isPending
                      ? 'border-[#1264F5]/40 hover:border-[#1264F5]/70'
                      : isAvailable
                      ? 'border-[#168BFF]/60 shadow-sm shadow-[#1264F5]/10 hover:border-[#168BFF]'
                      : 'border-[#173C73]'
                  }`}
                >
                  {/* Left: Number & Title & Badges strictly in 1 line */}
                  <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                    <div
                      className={`w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-md flex items-center justify-center flex-shrink-0 font-bold text-[10px] ${
                        isApproved
                          ? 'bg-[#10D6A0]/20 border border-[#10D6A0]/40 text-[#10D6A0]'
                          : isPending
                          ? 'bg-[#1264F5]/20 border border-[#168BFF]/40 text-[#168BFF]'
                          : 'bg-[#1264F5]/30 border border-[#173C73] text-[#FFD45A]'
                      }`}
                    >
                      {isApproved ? (
                        <Check className="w-3 h-3 text-[#10D6A0]" />
                      ) : isPending ? (
                        <Clock className="w-3 h-3 text-[#168BFF]" />
                      ) : (
                        <span>#{task.taskNumber}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden flex-nowrap">
                      <span className="text-[10px] font-bold text-slate-400 flex-shrink-0">
                        #{task.taskNumber}
                      </span>

                      <h5 className="text-[11px] sm:text-xs font-semibold text-white truncate">
                        {cleanTaskTitle(task.title)}
                      </h5>

                      <span className="text-[9px] font-bold text-[#22D3EE] bg-[#22D3EE]/15 border border-[#22D3EE]/30 px-1.5 py-0.5 rounded-full leading-none flex-shrink-0 whitespace-nowrap">
                        +{task.creditPoints || 5} CPs
                      </span>

                      <span className="text-[9px] font-bold text-[#10D6A0] bg-[#10D6A0]/15 border border-[#10D6A0]/30 px-1.5 py-0.5 rounded-full leading-none flex-shrink-0 whitespace-nowrap">
                        PKR {task.rewardAmount?.toLocaleString()}
                      </span>

                      {task.isPaid && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPrepaidModalTask(task);
                          }}
                          className="text-[9px] font-black text-[#FFD45A] bg-[#FFD45A]/15 border border-[#FFD45A]/40 hover:bg-[#FFD45A]/25 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 cursor-pointer flex-shrink-0 whitespace-nowrap transition-all leading-none"
                        >
                          <Zap className="w-2.5 h-2.5" /> PKR {task.unlockFee?.toLocaleString()}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right: Compact Status / Action Button strictly in 1 line */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isApproved ? (
                      <span className="inline-flex items-center gap-1 bg-[#10D6A0]/15 border border-[#10D6A0]/40 text-[#10D6A0] text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md leading-none whitespace-nowrap">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Approved
                      </span>
                    ) : isPending ? (
                      <Link
                        to={`/app/tasks/${task.id}`}
                        className="inline-flex items-center gap-1 bg-[#1264F5]/20 border border-[#1264F5]/40 text-[#168BFF] text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md hover:bg-[#1264F5]/30 transition-colors leading-none whitespace-nowrap"
                      >
                        <Clock className="w-2.5 h-2.5" /> In Review
                      </Link>
                    ) : isRejected ? (
                      <Link
                        to={`/app/tasks/${task.id}`}
                        className="inline-flex items-center gap-1 bg-[#EF4444]/20 border border-[#EF4444]/40 text-[#EF4444] text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md hover:bg-[#EF4444]/30 transition-colors leading-none whitespace-nowrap"
                      >
                        <XCircle className="w-2.5 h-2.5" /> Rejected
                      </Link>
                    ) : (
                      <Link
                        to={`/app/tasks/${task.id}`}
                        className="inline-flex items-center gap-1 bg-gradient-to-r from-[#1264F5] to-[#168BFF] hover:from-[#168BFF] hover:to-[#1264F5] text-white text-[9px] sm:text-[10px] font-bold px-2.5 py-0.5 rounded-md shadow-sm transition-all leading-none whitespace-nowrap"
                      >
                        <span>Open</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center rounded-2xl bg-[#071B3A] border border-[#173C73]">
            <p className="text-[#8194B7] text-xs">No tasks configured for this tier yet.</p>
          </div>
        )}
      </section>

      {/* ========================================================
          F. LEVEL COMPLETION INFORMATION
          Bottom milestone banner for bonus or completion status
          ======================================================== */}
      {isSelectedLevelCompleted ? (
        <section className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#10D6A0]/15 via-[#071B3A] to-[#10D6A0]/15 border border-[#10D6A0]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-white">
              Level {activeLevelNumber} Completed!
            </h4>
            <p className="text-xs text-[#B7C6E4]">
              All tasks approved. Completion reward of PKR{' '}
              {level?.completionReward?.toLocaleString() || 0} earned.
            </p>
          </div>

          {activeLevelNumber < 10 && (
            <button
              onClick={() => {
                const nextLevelNum = activeLevelNumber + 1;
                handleSelectLevel(nextLevelNum);
                const nextLvl = levels.find((l) => l.levelNumber === nextLevelNum);
                if (nextLvl && !isLevelUnlockedByUser(nextLvl)) {
                  handleUnlockLevelAction(nextLvl);
                }
              }}
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#FFD45A] to-amber-400 hover:brightness-110 text-[#020B20] text-xs font-black px-4 py-2.5 rounded-xl transition-all shadow-md self-start sm:self-auto flex-shrink-0 cursor-pointer animate-pulse"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Unlock Level {activeLevelNumber + 1} 🎉</span>
            </button>
          )}
        </section>
      ) : (
        <section className="p-4 rounded-2xl bg-gradient-to-r from-[#071B3A] via-[#0B2248] to-[#071B3A] border border-[#173C73] flex items-center justify-between gap-3">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white">
              Level {activeLevelNumber} Completion Reward
            </h4>
            <p className="text-[11px] text-[#B7C6E4]">
              Complete all tasks in this tier to claim PKR{' '}
              {level?.completionReward?.toLocaleString() || 0} bonus!
            </p>
          </div>

          <span className="text-xs font-bold text-[#FFD45A] bg-[#061633] border border-[#173C73] px-3 py-1.5 rounded-xl hidden sm:inline">
            +PKR {level?.completionReward?.toLocaleString() || 0}
          </span>
        </section>
      )}

      {/* ========================================================
          TEMPORARY POPUP: PREPAID TASK BALANCE & REQUIREMENT MODAL
          ======================================================== */}
      {prepaidModalTask && (() => {
        const modalUnlockFee = prepaidModalTask.unlockFee || 0;
        const modalRewardAmount = prepaidModalTask.rewardAmount || 80;
        const modalUserBalance = wallet?.availableBalance || 0;
        const modalRemainingNeeded = Math.max(0, modalUnlockFee - modalUserBalance);
        const modalCompletedBalance = (modalUserBalance >= modalUnlockFee ? modalUserBalance : modalUnlockFee) + modalRewardAmount;
        const isSufficient = modalRemainingNeeded === 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="royal-card w-full max-w-lg p-6 sm:p-7 rounded-3xl border border-[#FFD45A]/50 bg-gradient-to-b from-[#071B3A] to-[#041228] shadow-2xl relative space-y-5">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setPrepaidModalTask(null)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-[#020B20] text-slate-400 hover:text-white border border-[#173C73] hover:border-[#FFD45A]/50 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Modal Header */}
              <div className="flex items-start gap-3.5 pr-8">
                <div className="w-12 h-12 rounded-2xl bg-[#FFD45A]/15 border border-[#FFD45A]/40 flex items-center justify-center flex-shrink-0 text-[#FFD45A]">
                  <Zap className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-[#FFD45A]/20 text-[#FFD45A] border border-[#FFD45A]/40 px-2 py-0.5 rounded-full">
                      Prepaid Assignment
                    </span>
                    <span className="text-[10px] font-bold text-[#22D3EE] bg-[#22D3EE]/15 border border-[#22D3EE]/30 px-2 py-0.5 rounded-full">
                      Task #{prepaidModalTask.taskNumber}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                    {cleanTaskTitle(prepaidModalTask.title)}
                  </h3>
                </div>
              </div>

              {/* 4-Box Financial Breakdown & Exact Calculator */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* 1. Task Price / Required Balance */}
                <div className="p-3 rounded-2xl bg-[#020B20] border border-[#173C73] space-y-1 text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    <Zap className="w-3 h-3 text-[#FFD45A]" />
                    <span>Task Price</span>
                  </div>
                  <span className="text-base sm:text-lg font-black text-white block">
                    PKR {modalUnlockFee.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-[#10D6A0]">Required balance</span>
                </div>

                {/* 2. Account Balance */}
                <div className="p-3 rounded-2xl bg-[#020B20] border border-[#173C73] space-y-1 text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    <Wallet className="w-3 h-3 text-[#10D6A0]" />
                    <span>Your Balance</span>
                  </div>
                  <span className="text-base sm:text-lg font-black text-[#10D6A0] block">
                    PKR {modalUserBalance.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-slate-500">In your wallet</span>
                </div>

                {/* 3. Needed Deposit */}
                <div className={`p-3 rounded-2xl bg-[#020B20] border space-y-1 text-center ${
                  modalRemainingNeeded > 0 ? 'border-[#FFD45A]/50 bg-[#FFD45A]/5' : 'border-[#10D6A0]/50 bg-[#10D6A0]/5'
                }`}>
                  <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    <ArrowDownLeft className="w-3 h-3 text-[#FFD45A]" />
                    <span>Needed Deposit</span>
                  </div>
                  <span className={`text-base sm:text-lg font-black block ${
                    modalRemainingNeeded > 0 ? 'text-[#FFD45A]' : 'text-[#10D6A0]'
                  }`}>
                    {modalRemainingNeeded > 0 ? `PKR ${modalRemainingNeeded.toLocaleString()}` : 'PKR 0'}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    {modalRemainingNeeded > 0 ? 'To reach required' : 'Requirement met'}
                  </span>
                </div>

                {/* 4. Task Reward */}
                <div className="p-3 rounded-2xl bg-[#020B20] border border-[#10D6A0]/40 bg-[#10D6A0]/5 space-y-1 text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    <Sparkles className="w-3 h-3 text-[#10D6A0]" />
                    <span>Task Reward</span>
                  </div>
                  <span className="text-base sm:text-lg font-black text-[#10D6A0] block">
                    +PKR {modalRewardAmount.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-emerald-400">Added to balance</span>
                </div>
              </div>

              {/* Exact Calculator Breakdown Card */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#10D6A0]/15 via-[#071B3A] to-[#FFD45A]/15 border border-[#10D6A0]/40 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs font-black text-white">
                    <CheckCircle2 className="w-4 h-4 text-[#10D6A0]" />
                    <span>Total Client Account Balance After Approval</span>
                  </div>
                  <div className="text-right">
                    <span className="text-base sm:text-xl font-black text-[#10D6A0]">
                      PKR {modalCompletedBalance.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#020B20]/80 border border-[#173C73] text-[11px] text-slate-300 leading-relaxed space-y-1">
                  <p className="font-semibold text-[#FFD45A]">
                    Live Calculator Calculation:
                  </p>
                  <p className="text-slate-300">
                    Task Price is <strong>PKR {modalUnlockFee.toLocaleString()}</strong> and Account Balance is <strong>PKR {modalUserBalance.toLocaleString()}</strong>. Depositing <strong>PKR {modalRemainingNeeded.toLocaleString()}</strong> completes <strong>PKR {modalUnlockFee.toLocaleString()}</strong> in your wallet. Your funds remain in your account with zero deductions, and <strong>+PKR {modalRewardAmount.toLocaleString()}</strong> reward is added upon approval — giving you <strong>PKR {modalCompletedBalance.toLocaleString()}</strong> total balance in your account!
                  </p>
                </div>
              </div>

              {/* Status Explanation & 1-Click Action */}
              <div className="space-y-3 pt-1">
                {modalRemainingNeeded > 0 ? (
                  <>
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] leading-relaxed">
                        You need <strong className="text-[#FFD45A] font-bold">PKR {modalRemainingNeeded.toLocaleString()}</strong> more in your balance to complete the requirement of PKR {modalUnlockFee.toLocaleString()}. Deposit the remaining amount to open this task.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2.5">
                      <Link
                        to={`/app/deposits?amount=${modalRemainingNeeded}`}
                        onClick={() => setPrepaidModalTask(null)}
                        className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#1459E8] to-[#2478FF] hover:from-[#2478FF] hover:to-[#1459E8] text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <ArrowDownLeft className="w-4 h-4" />
                        <span>Deposit PKR {modalRemainingNeeded.toLocaleString()} to Complete Balance</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => setPrepaidModalTask(null)}
                        className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#020B20] border border-[#173C73] text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] leading-relaxed">
                        Your account balance is sufficient! You have <strong className="text-white font-bold">PKR {modalUserBalance.toLocaleString()}</strong> available. Opening this task will directly submit it for admin review and approval.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2.5">
                      <button
                        type="button"
                        onClick={async () => {
                          await handleUnlockTask(prepaidModalTask.id);
                          setPrepaidModalTask(null);
                        }}
                        disabled={unlockingTaskId === prepaidModalTask.id}
                        className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#10D6A0] to-emerald-400 hover:brightness-110 text-[#020B20] font-black text-xs shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {unlockingTaskId === prepaidModalTask.id ? (
                          <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Zap className="w-4 h-4 text-[#020B20]" />
                            <span>Open & Submit for Admin Review</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setPrepaidModalTask(null)}
                        className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#020B20] border border-[#173C73] text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================
          CONGRATULATIONS MODAL WITH FIREWORKS CELEBRATION
          ======================================================== */}
      {congratsModalLevel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020B20]/85 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#0B2248] via-[#071B3A] to-[#04132F] border-2 border-[#FFD45A]/60 p-6 sm:p-8 text-center shadow-2xl shadow-[#FFD45A]/30 animate-in zoom-in-95 duration-300 overflow-hidden">
            {/* Background ambient radial glow */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#FFD45A]/20 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={() => {
                setCongratsModalLevel(null);
                scrollToTasksSection();
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#061633] border border-[#173C73] text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Floating Golden Trophy / Icon */}
            <div className="relative mb-4 flex items-center justify-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#FFD45A] via-amber-400 to-[#10D6A0] p-1 shadow-2xl shadow-[#FFD45A]/40 animate-bounce">
                <div className="w-full h-full bg-[#04132F] rounded-[20px] flex items-center justify-center">
                  <Trophy className="w-10 h-10 text-[#FFD45A]" />
                </div>
              </div>
            </div>

            {/* Congratulations Banner */}
            <div className="space-y-1 mb-4">
              <span className="inline-block text-[11px] font-black tracking-widest text-[#FFD45A] uppercase bg-[#FFD45A]/15 border border-[#FFD45A]/30 px-3 py-0.5 rounded-full">
                🎉 CONGRATULATIONS! 🎉
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Level {congratsModalLevel.levelNumber} Unlocked!
              </h2>
              <p className="text-xs sm:text-sm font-bold text-[#22D3EE]">
                {congratsModalLevel.title}
              </p>
            </div>

            <p className="text-xs text-slate-300 mb-6 leading-relaxed max-w-xs mx-auto">
              You have successfully unlocked Level {congratsModalLevel.levelNumber}! Complete your new assignments to earn higher CPs and bigger PKR rewards.
            </p>

            {/* Metric Badges */}
            <div className="grid grid-cols-2 gap-2.5 mb-6 text-center">
              <div className="bg-[#061633]/80 border border-[#173C73] p-3 rounded-2xl">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Completion Bonus</span>
                <span className="text-sm sm:text-base font-black text-[#10D6A0]">
                  PKR {congratsModalLevel.completionReward?.toLocaleString() || 0}
                </span>
              </div>
              <div className="bg-[#061633]/80 border border-[#173C73] p-3 rounded-2xl">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Credit Points</span>
                <span className="text-sm sm:text-base font-black text-[#22D3EE]">
                  +{congratsModalLevel.totalCreditPoints || 100} CPs
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  setCongratsModalLevel(null);
                  scrollToTasksSection();
                }}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FFD45A] via-amber-400 to-[#10D6A0] hover:brightness-110 text-[#020B20] font-black text-sm shadow-xl shadow-[#FFD45A]/30 transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Start Level {congratsModalLevel.levelNumber} Tasks</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  triggerFireworks();
                }}
                className="w-full py-2 text-xs font-bold text-[#FFD45A] hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>More Fireworks! 🎆</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
