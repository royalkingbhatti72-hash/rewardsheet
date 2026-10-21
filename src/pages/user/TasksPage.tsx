import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
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
  ExternalLink,
  Layers,
  ChevronDown,
  Target,
  TrendingUp,
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

// Rich professional tier metadata for every level
const TIER_METADATA: Record<number, {
  tierName: string;
  badge: string;
  themeColor: string;
  borderColor: string;
  glowColor: string;
  description: string;
}> = {
  1: {
    tierName: 'Novice Rewards Tier',
    badge: 'TIER 01 • STARTER',
    themeColor: '#FFD45A',
    borderColor: '#FFD45A',
    glowColor: 'rgba(255, 212, 90, 0.25)',
    description: 'Complete 10 foundational YouTube engagements to claim PKR 500 bonus + 100 Credit Points.',
  },
  2: {
    tierName: 'Bronze Earner Tier',
    badge: 'TIER 02 • BRONZE',
    themeColor: '#CD7F32',
    borderColor: '#E59866',
    glowColor: 'rgba(205, 127, 50, 0.25)',
    description: 'Elevated commission rates across all 10 tasks with bonus payout of PKR 400 + 100 Credit Points.',
  },
  3: {
    tierName: 'Silver Verified Tier',
    badge: 'TIER 03 • SILVER',
    themeColor: '#93C5FD',
    borderColor: '#60A5FA',
    glowColor: 'rgba(147, 197, 253, 0.25)',
    description: 'Master tier assignments with PKR 80 base commission and PKR 600 completion bonus reward.',
  },
  4: {
    tierName: 'Gold Sovereign Tier',
    badge: 'TIER 04 • GOLD',
    themeColor: '#F59E0B',
    borderColor: '#FBBF24',
    glowColor: 'rgba(245, 158, 11, 0.25)',
    description: 'High-earning tier assignments yielding PKR 100 commission per standard task + PKR 800 bonus.',
  },
  5: {
    tierName: 'Platinum Master Tier',
    badge: 'TIER 05 • PLATINUM',
    themeColor: '#22D3EE',
    borderColor: '#06B6D4',
    glowColor: 'rgba(34, 211, 238, 0.25)',
    description: 'Multiplied task commissions with high-yield prepaid assignments and PKR 1,000 completion bonus.',
  },
  6: {
    tierName: 'Diamond Prestige Tier',
    badge: 'TIER 06 • DIAMOND',
    themeColor: '#A78BFA',
    borderColor: '#8B5CF6',
    glowColor: 'rgba(167, 139, 250, 0.25)',
    description: 'Executive assignments with expedited verification and PKR 1,200 level completion bonus.',
  },
  7: {
    tierName: 'Ruby Champion Tier',
    badge: 'TIER 07 • RUBY',
    themeColor: '#F43F5E',
    borderColor: '#FB7185',
    glowColor: 'rgba(244, 63, 94, 0.25)',
    description: 'Vanguard level with accelerated credit point accumulation and PKR 1,500 bonus reward.',
  },
  8: {
    tierName: 'Emerald Sovereign Tier',
    badge: 'TIER 08 • EMERALD',
    themeColor: '#10D6A0',
    borderColor: '#34D399',
    glowColor: 'rgba(16, 214, 160, 0.25)',
    description: 'Top-tier master rewards with enhanced payouts and PKR 2,000 completion milestone bonus.',
  },
  9: {
    tierName: 'Sapphire Royal Tier',
    badge: 'TIER 09 • SAPPHIRE',
    themeColor: '#38BDF8',
    borderColor: '#0284C7',
    glowColor: 'rgba(56, 189, 248, 0.25)',
    description: 'Pre-final prestige tier unlocking highest yield assignments and PKR 2,500 cash reward.',
  },
  10: {
    tierName: 'Imperial Crown Pinnacle',
    badge: 'TIER 10 • IMPERIAL',
    themeColor: '#FFD45A',
    borderColor: '#F59E0B',
    glowColor: 'rgba(255, 212, 90, 0.35)',
    description: 'Final milestone: unlock 1,000 total Credit Points, big withdrawal clearance, and PKR 3,000 bonus!',
  },
};

const triggerFireworks = () => {
  const duration = 3.5 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 99999 };
  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  const interval: any = setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return clearInterval(interval);

    const particleCount = 50 * (timeLeft / duration);
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ['#FFD45A', '#1459E8', '#22D3EE', '#10D6A0', '#FF4D6D', '#F59E0B'],
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ['#FFD45A', '#1459E8', '#22D3EE', '#10D6A0', '#FF4D6D', '#F59E0B'],
    });
  }, 250);
};

const cleanTaskTitle = (title: string) => {
  if (!title) return '';
  if (title.startsWith('Prepaid Task')) return title;
  return title.replace(/\s+Task\s*#?\d+$/i, '').trim();
};

// Helper to generate 10 locked tasks locally with full details
const createLockedTasks = (lvlNum: number, lvlSummary?: any) => {
  const baseReward = lvlNum === 1 ? 40 : lvlNum * 40;
  return Array.from({ length: 10 }, (_, i) => {
    const isPrepaid = i === 4 || i === 9;
    const taskNum = i + 1;
    const taskType = isPrepaid
      ? (i === 4 ? 'Prepaid Task #1' : 'Prepaid Task #2')
      : (taskNum % 4 === 1 ? 'Subscribe' : taskNum % 4 === 2 ? 'Like and Comment' : taskNum % 4 === 3 ? 'Watch Video (30s)' : 'Watch Video (45s)');
    const unlockFee = isPrepaid ? (lvlSummary?.requiredPrepaidAmount || (i === 4 ? lvlNum * 1000 : lvlNum * 3500)) : 0;
    const reward = isPrepaid ? (baseReward * 2) : baseReward;
    const cps = isPrepaid ? 30 : 5;

    return {
      id: `locked-lvl-${lvlNum}-task-${taskNum}`,
      taskNumber: taskNum,
      title: isPrepaid ? `${taskType} (PKR ${unlockFee.toLocaleString()})` : `YouTube ${taskType}`,
      description: isPrepaid
        ? `Prepaid task requiring deposit unlock fee of PKR ${unlockFee.toLocaleString()}. Yields commission of PKR ${reward} and 30 credit points upon completion.`
        : `Complete the ${taskType} action on YouTube. Watch, engage, and submit confirmation proof for admin verification to earn PKR ${reward} and 5 credit points.`,
      rewardAmount: reward,
      userStatus: 'LOCKED',
      status: 'LOCKED',
      taskType,
      isPaid: isPrepaid,
      creditPoints: cps,
      levelId: lvlSummary?.id || `lvl-${lvlNum}`,
      unlockFee,
    };
  });
};

// Helper to generate 10 completed tasks locally with full details
const createCompletedTasks = (lvlNum: number, lvlSummary?: any) => {
  const baseReward = lvlNum === 1 ? 40 : lvlNum * 40;
  return Array.from({ length: 10 }, (_, i) => {
    const isPrepaid = i === 4 || i === 9;
    const taskNum = i + 1;
    const taskType = isPrepaid
      ? (i === 4 ? 'Prepaid Task #1' : 'Prepaid Task #2')
      : (taskNum % 4 === 1 ? 'Subscribe' : taskNum % 4 === 2 ? 'Like and Comment' : taskNum % 4 === 3 ? 'Watch Video (30s)' : 'Watch Video (45s)');
    const unlockFee = isPrepaid ? (lvlSummary?.requiredPrepaidAmount || (i === 4 ? lvlNum * 1000 : lvlNum * 3500)) : 0;
    const reward = isPrepaid ? (baseReward * 2) : baseReward;
    const cps = isPrepaid ? 30 : 5;

    return {
      id: `completed-lvl-${lvlNum}-task-${taskNum}`,
      taskNumber: taskNum,
      title: isPrepaid ? `${taskType} (PKR ${unlockFee.toLocaleString()})` : `YouTube ${taskType}`,
      description: `Task ${taskNum} completed and verified. Reward credited to wallet.`,
      rewardAmount: reward,
      userStatus: 'APPROVED',
      status: 'APPROVED',
      taskType,
      isPaid: isPrepaid,
      creditPoints: cps,
      levelId: lvlSummary?.id || `lvl-${lvlNum}`,
      unlockFee: 0,
    };
  });
};

export const TasksPage: React.FC = () => {
  const navigate = useNavigate();
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
    completionReward: i === 0 ? 500 : (i + 1) * 200,
    totalCreditPoints: 100,
  }));
  const cachedLevels = api.getCachedData<any>('/tasks/levels');
  const [levels, setLevels] = useState<any[]>(cachedLevels?.levels || DEFAULT_FALLBACK_LEVELS);

  // Compute User's ACTUAL CURRENT ELIGIBLE Level
  const userCurrentLevel = useMemo(() => {
    return (
      levels.find(
        (l: any) =>
          l.isUnlocked &&
          !l.isCompleted &&
          (l.approvedTaskCount || 0) < 10 &&
          (typeof window === 'undefined' || localStorage.getItem(`royal_completed_lvl_${l.levelNumber}`) !== 'true')
      ) ||
      levels.filter((l: any) => l.isUnlocked).slice(-1)[0] ||
      levels[0]
    );
  }, [levels]);
  const userCurrentLevelNumber = userCurrentLevel?.levelNumber || 1;

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

  // Prevent background scrolling while any popup modal is active
  useBodyScrollLock(Boolean(prepaidModalTask || congratsModalLevel));

  const carouselRef = useRef<HTMLDivElement>(null);
  const tasksSectionRef = useRef<HTMLDivElement>(null);

  // Smooth scroll card into view inside carousel without layout thrashing
  const scrollToSelectedCard = (levelNum: number) => {
    const card = document.getElementById(`carousel-card-${levelNum}`);
    const container = carouselRef.current;
    if (card && container) {
      const containerRect = container.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const currentScrollLeft = container.scrollLeft;
      const targetScrollLeft =
        currentScrollLeft +
        (cardRect.left - containerRect.left) -
        containerRect.width / 2 +
        cardRect.width / 2;
      container.scrollTo({ left: targetScrollLeft, behavior: 'smooth' });
    }
  };

  // Instant level selection with zero lag
  const handleSelectLevel = (levelNumber: number) => {
    if (levelNumber < 1 || levelNumber > 10) return;
    setActiveLevelNumber(levelNumber);
    setSearchParams({ level: String(levelNumber) });
    scrollToSelectedCard(levelNumber);
    setActionError(null);
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

  // Fetch all 10 levels
  const fetchLevels = async (keepCurrentSelection = false) => {
    try {
      const res = await api.getLevels();
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

  // Fetch tasks whenever selected level number changes (Zero Lag & Smart Cache)
  useEffect(() => {
    if (!activeLevelNumber) return;
    setActionError(null);
    setActionSuccess(null);

    const targetLvl = levels.find((l) => l.levelNumber === activeLevelNumber);
    const isLocked = targetLvl ? !targetLvl.isUnlocked : (activeLevelNumber > userCurrentLevelNumber);
    const isCompleted =
      Boolean(targetLvl?.isCompleted) ||
      (targetLvl?.approvedTaskCount ?? 0) >= 10 ||
      activeLevelNumber < userCurrentLevelNumber ||
      Boolean(unlockedLevels[activeLevelNumber + 1]) ||
      (typeof window !== 'undefined' && localStorage.getItem(`royal_unlocked_lvl_${activeLevelNumber + 1}`) === 'true') ||
      (typeof window !== 'undefined' && localStorage.getItem(`royal_completed_lvl_${activeLevelNumber}`) === 'true');

    if (isLocked) {
      setCurrentLevelData({
        level: targetLvl || { levelNumber: activeLevelNumber, title: `Level ${activeLevelNumber}` },
        tasks: createLockedTasks(activeLevelNumber, targetLvl),
        isLevelUnlocked: false,
      });
      setTasksLoading(false);
      return;
    }

    if (isCompleted) {
      const cached = api.getCachedData<any>(`/tasks/levels/${activeLevelNumber}`);
      if (cached && cached.tasks && cached.tasks.length > 0) {
        setCurrentLevelData(cached);
        setTasksLoading(false);
      } else {
        setCurrentLevelData({
          level: targetLvl,
          tasks: createCompletedTasks(activeLevelNumber, targetLvl),
          isLevelUnlocked: true,
        });
        setTasksLoading(false);
      }
      return;
    }

    // Active in-progress level
    const cached = api.getCachedData<any>(`/tasks/levels/${activeLevelNumber}`);
    if (cached) {
      setCurrentLevelData(cached);
      setTasksLoading(false);
    } else {
      setTasksLoading(true);
    }

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
  }, [activeLevelNumber, userCurrentLevelNumber, levels]);

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
        if (activeLevelNumber === userCurrentLevelNumber) {
          api
            .getLevelTasks(activeLevelNumber)
            .then((data) => setCurrentLevelData(data))
            .catch(() => {});
        }
      }
    };

    window.addEventListener('royal_live_update', handleLiveEvent);
    return () => {
      window.removeEventListener('royal_live_update', handleLiveEvent);
    };
  }, [activeLevelNumber, userCurrentLevelNumber]);

  const scrollToTasksSection = () => {
    if (tasksSectionRef.current) {
      tasksSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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

  const summaryApprovedCount = selectedLevelSummary?.approvedTaskCount ?? 0;
  const approvedTaskCount = Math.max(summaryApprovedCount, liveApprovedTasksCount);
  const progressPercent = Math.min(100, Math.round((approvedTaskCount / 10) * 100));

  const isSelectedLevelCompleted =
    Boolean(selectedLevelSummary?.isCompleted) ||
    Boolean(level?.isCompleted) ||
    approvedTaskCount >= 10 ||
    liveApprovedTasksCount >= 10 ||
    summaryApprovedCount >= 10 ||
    (tasks.length >= 10 && tasks.every((t: any) => {
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
    })) ||
    (tasks.length > 0 && liveApprovedTasksCount >= (level?.requiredTaskCount || 10)) ||
    (activeLevelNumber < userCurrentLevelNumber) ||
    Boolean(unlockedLevels[activeLevelNumber + 1]) ||
    (typeof window !== 'undefined' && localStorage.getItem(`royal_unlocked_lvl_${activeLevelNumber + 1}`) === 'true') ||
    (typeof window !== 'undefined' && localStorage.getItem(`royal_completed_lvl_${activeLevelNumber}`) === 'true');

  const previousLevelSummary =
    activeLevelNumber > 1 ? levels.find((l) => l.levelNumber === activeLevelNumber - 1) : null;
  const previousLevelApprovedTasks = previousLevelSummary?.approvedTaskCount || 0;

  useEffect(() => {
    if (isSelectedLevelCompleted && activeLevelNumber) {
      try {
        localStorage.setItem(`royal_completed_lvl_${activeLevelNumber}`, 'true');
      } catch {}
    }
  }, [isSelectedLevelCompleted, activeLevelNumber]);

  const activeMetadata = TIER_METADATA[activeLevelNumber] || TIER_METADATA[1];
  const ActiveIcon = LEVEL_ICONS[activeLevelNumber] || Crown;

  return (
    <div className="relative max-w-5xl mx-auto space-y-6 sm:space-y-8 select-none">
      {/* Luxury Ambient Lighting Glow */}
      <div className="absolute -top-20 left-1/3 w-[500px] h-[500px] bg-[#1459E8]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-96 right-10 w-[450px] h-[450px] bg-[#FFD45A]/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Action Messages */}
      {actionSuccess && (
        <div className="p-4 bg-[#10D6A0]/15 border border-[#10D6A0]/40 rounded-2xl text-[#10D6A0] text-xs sm:text-sm flex items-center gap-3 animate-in fade-in shadow-xl backdrop-blur-md">
          <CheckCircle2 className="w-5 h-5 text-[#10D6A0] flex-shrink-0" />
          <span className="font-semibold">{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-4 bg-[#EF4444]/15 border border-[#EF4444]/40 rounded-2xl text-[#EF4444] text-xs sm:text-sm flex items-center gap-3 animate-in fade-in shadow-xl backdrop-blur-md">
          <AlertCircle className="w-5 h-5 text-[#EF4444] flex-shrink-0" />
          <span className="font-semibold">{actionError}</span>
        </div>
      )}

      {/* ========================================================
          1. QUICK TIER NAVIGATOR (Zero-Lag Level Selector)
          Instant clicking, clear indicator status, no re-render delays
          ======================================================== */}
      <section className="bg-[#041228]/80 border border-[#163363]/70 backdrop-blur-xl p-2 sm:p-2.5 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto scrollbar-none py-0.5">
          {levels.map((lvl) => {
            const isSelected = lvl.levelNumber === activeLevelNumber;
            const isCompleted =
              Boolean(lvl.isCompleted) ||
              (lvl.approvedTaskCount || 0) >= 10 ||
              lvl.levelNumber < userCurrentLevelNumber ||
              Boolean(unlockedLevels[lvl.levelNumber + 1]) ||
              (typeof window !== 'undefined' && localStorage.getItem(`royal_completed_lvl_${lvl.levelNumber}`) === 'true');
            const isLocked = !lvl.isUnlocked && !isCompleted;
            const isCurrent = lvl.levelNumber === userCurrentLevelNumber;
            const meta = TIER_METADATA[lvl.levelNumber] || TIER_METADATA[1];

            return (
              <button
                key={lvl.id}
                onClick={() => handleSelectLevel(lvl.levelNumber)}
                className={`flex-1 min-w-[76px] sm:min-w-[88px] py-2 px-2.5 rounded-xl font-bold text-xs transition-all flex flex-col items-center gap-1 relative cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-b from-[#1459E8] to-[#0A3CB3] text-white shadow-lg shadow-[#1459E8]/35 ring-2 ring-[#FFD45A]/70 scale-[1.02]'
                    : isCompleted
                    ? 'bg-[#06242B]/80 text-emerald-400 border border-emerald-500/30 hover:bg-[#08333D]'
                    : isLocked
                    ? 'bg-[#030B1A]/60 text-slate-500 border border-[#102447]/60 hover:bg-[#05132B]'
                    : 'bg-[#061838]/80 text-slate-300 border border-[#16386E]/70 hover:bg-[#0A2454]'
                }`}
              >
                <div className="flex items-center gap-1">
                  {isCompleted ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : isLocked ? (
                    <Lock className="w-3 h-3 text-slate-500" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-[#FFD45A] animate-ping" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]" />
                  )}
                  <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider">
                    Lvl {lvl.levelNumber}
                  </span>
                </div>
                <span className={`text-[9px] font-semibold truncate max-w-full ${isSelected ? 'text-[#FFD45A]' : 'text-slate-400'}`}>
                  {isCompleted ? 'Done' : isLocked ? 'Locked' : isCurrent ? 'Active' : 'Ready'}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ========================================================
          2. EXTENDED LENGTH LEVEL CAROUSEL / SHOWCASE
          Substantially increased card width/length, rich badges,
          KPI chips, 10-step progress visualization, and smooth scrolling
          ======================================================== */}
      <section className="relative px-1 select-none">
        {/* Floating Carousel Arrows */}
        <button
          onClick={handlePrevLevel}
          disabled={activeLevelNumber === 1}
          className="absolute -left-2 sm:-left-3 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-2xl bg-[#061633]/95 hover:bg-[#0C2454] border border-[#1C3E75] hover:border-[#FFD45A] text-white flex items-center justify-center shadow-2xl backdrop-blur-md disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
          title="Previous Tier"
        >
          <ChevronLeft className="w-6 h-6 text-slate-200" />
        </button>

        <button
          onClick={handleNextLevel}
          disabled={activeLevelNumber === 10}
          className="absolute -right-2 sm:-right-3 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-2xl bg-[#061633]/95 hover:bg-[#0C2454] border border-[#1C3E75] hover:border-[#FFD45A] text-white flex items-center justify-center shadow-2xl backdrop-blur-md disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
          title="Next Tier"
        >
          <ChevronRight className="w-6 h-6 text-slate-200" />
        </button>

        {/* Carousel Track with Extended-Length Cards */}
        <div
          ref={carouselRef}
          className="flex items-center gap-4 sm:gap-6 overflow-x-auto scroll-smooth py-3 scrollbar-none justify-start select-none"
          style={{
            paddingLeft: 'max(0.75rem, calc(50% - 220px))',
            paddingRight: 'max(0.75rem, calc(50% - 220px))',
            touchAction: 'pan-y',
          }}
        >
          {levels.map((lvl) => {
            const isSelected = lvl.levelNumber === activeLevelNumber;
            const isCompleted =
              Boolean(lvl.isCompleted) ||
              (lvl.approvedTaskCount || 0) >= 10 ||
              lvl.levelNumber < userCurrentLevelNumber ||
              Boolean(unlockedLevels[lvl.levelNumber + 1]) ||
              (typeof window !== 'undefined' && localStorage.getItem(`royal_completed_lvl_${lvl.levelNumber}`) === 'true');
            const isLocked = !lvl.isUnlocked && !isCompleted;
            const isReadyToUnlock = lvl.isUnlocked && !isCompleted && !isLevelUnlockedByUser(lvl);
            const isCurrent = lvl.levelNumber === userCurrentLevelNumber;
            const approved = isCompleted ? 10 : Math.max(lvl.approvedTaskCount || 0, isSelected ? approvedTaskCount : 0);
            const lvlProgressPercent = Math.min(100, Math.round((approved / (lvl.requiredTaskCount || 10)) * 100));
            const LevelIconComponent = LEVEL_ICONS[lvl.levelNumber] || Crown;
            const meta = TIER_METADATA[lvl.levelNumber] || TIER_METADATA[1];

            return (
              <div
                id={`carousel-card-${lvl.levelNumber}`}
                key={lvl.id}
                onClick={() => handleSelectLevel(lvl.levelNumber)}
                className={`flex-shrink-0 rounded-[28px] p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between relative overflow-hidden select-none backdrop-blur-2xl cursor-pointer ${
                  isSelected
                    ? isLocked
                      ? 'w-[320px] sm:w-[390px] md:w-[440px] bg-gradient-to-b from-[#0D2659]/95 via-[#081B3E]/95 to-[#030D1E]/95 border-2 border-[#F59E0B] shadow-[0_20px_50px_rgba(245,158,11,0.25)] ring-2 ring-[#FFD45A]/50 z-20 scale-100'
                      : 'w-[320px] sm:w-[390px] md:w-[440px] bg-gradient-to-b from-[#0F2D6B]/95 via-[#0A1E4A]/95 to-[#030E24]/95 border-2 border-[#FFD45A] shadow-[0_20px_50px_rgba(20,89,232,0.35),0_0_25px_rgba(255,212,90,0.2)] ring-2 ring-[#FFD45A]/50 z-20 scale-100'
                    : isCompleted
                    ? 'w-[260px] sm:w-[300px] md:w-[330px] bg-gradient-to-b from-[#06242B]/85 via-[#061B30]/90 to-[#020E22]/95 border-2 border-emerald-400/40 shadow-lg opacity-85 hover:opacity-100 scale-95'
                    : isLocked
                    ? 'w-[260px] sm:w-[300px] md:w-[330px] bg-[#040F24]/80 border border-[#163363]/60 opacity-65 hover:opacity-90 scale-95'
                    : 'w-[260px] sm:w-[300px] md:w-[330px] bg-[#071D42]/85 border border-[#1A3E75] opacity-80 hover:opacity-100 scale-95'
                }`}
              >
                {/* Top Subtle Metallic Accent Line */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    isSelected
                      ? 'bg-gradient-to-r from-transparent via-[#FFD45A] to-transparent'
                      : isCompleted
                      ? 'bg-gradient-to-r from-transparent via-emerald-400 to-transparent'
                      : 'bg-transparent'
                  }`}
                />

                {/* Extended Card Header: Level Number Bullion Badge + Tier Badge + Status Pill */}
                <div className="space-y-2.5 z-10">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-[#FFD45A] to-amber-500 text-slate-950 font-black text-xs shadow-md tracking-wider flex items-center gap-1.5">
                      <LevelIconComponent className="w-3.5 h-3.5 text-slate-950" />
                      LEVEL {lvl.levelNumber < 10 ? `0${lvl.levelNumber}` : lvl.levelNumber}
                    </span>

                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-sm ${
                        isReadyToUnlock
                          ? 'bg-gradient-to-r from-[#FFD45A]/25 to-emerald-400/25 text-[#FFD45A] border border-[#FFD45A]/60 animate-pulse'
                          : isCurrent
                          ? 'bg-[#1459E8]/30 text-[#22D3EE] border border-[#22D3EE]/50'
                          : isCompleted
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/40'
                          : isLocked
                          ? 'bg-[#040D1F] text-slate-400 border border-[#163363]'
                          : 'bg-[#061836] text-[#B7C6E4] border border-[#173C73]'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isCompleted
                            ? 'bg-emerald-400'
                            : isCurrent || isReadyToUnlock
                            ? 'bg-[#FFD45A] animate-ping'
                            : isLocked
                            ? 'bg-slate-500'
                            : 'bg-[#22D3EE]'
                        }`}
                      />
                      {isReadyToUnlock
                        ? 'Ready to Unlock'
                        : isCurrent
                        ? 'Current Active Tier'
                        : isCompleted
                        ? 'Tier Completed'
                        : isLocked
                        ? 'Locked Tier'
                        : 'Available'}
                    </span>
                  </div>

                  {/* Tier Title and Subtitle */}
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white tracking-wide flex items-center gap-2">
                      <span>{meta.tierName}</span>
                    </h3>
                    <p className="text-[11px] text-[#A6BCD9] font-medium leading-relaxed line-clamp-2">
                      {meta.description}
                    </p>
                  </div>
                </div>

                {/* Middle Section: Segmented 10-Task Step Visualizer */}
                <div className="py-3.5 space-y-2 z-10">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5 text-[11px] text-[#FFD45A]">
                      <Target className="w-3.5 h-3.5" />
                      Assignment Progress
                    </span>
                    <span className="text-[11px] font-black text-white">
                      {approved} / 10 Tasks Done ({lvlProgressPercent}%)
                    </span>
                  </div>

                  {/* 10 Individual Segmented Step Blocks */}
                  <div className="grid grid-cols-10 gap-1 sm:gap-1.5 h-2.5">
                    {Array.from({ length: 10 }, (_, idx) => {
                      const isStepApproved = idx < approved;
                      const isStepPrepaid = idx === 4 || idx === 9;
                      return (
                        <div
                          key={idx}
                          className={`rounded-sm transition-all duration-300 ${
                            isStepApproved
                              ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,214,160,0.6)]'
                              : isSelected && idx === approved
                              ? 'bg-[#FFD45A] animate-pulse shadow-[0_0_8px_rgba(255,212,90,0.8)]'
                              : isStepPrepaid
                              ? 'bg-amber-500/40 border border-amber-400/50'
                              : 'bg-[#0E244E]/80 border border-[#16386E]/50'
                          }`}
                          title={`Task ${idx + 1}${isStepPrepaid ? ' (Prepaid Milestone)' : ''}`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Metrics Row: Bonus Amount, Total CPs, and Task Yield Labels */}
                <div className="pt-1 pb-3 flex items-center justify-between gap-2 flex-wrap z-10">
                  <div className="px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 text-[10px] sm:text-xs font-black flex items-center gap-1 shadow-sm">
                    <Trophy className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>Bonus: PKR {lvl.completionReward?.toLocaleString()}</span>
                  </div>

                  <div className="px-2.5 py-1 rounded-xl bg-[#22D3EE]/15 border border-[#22D3EE]/35 text-[#22D3EE] text-[10px] sm:text-xs font-black flex items-center gap-1 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-[#22D3EE] flex-shrink-0" />
                    <span>+{lvl.totalCreditPoints || 100} CPs</span>
                  </div>

                  <div className="px-2.5 py-1 rounded-xl bg-[#081F48] border border-[#1A4580] text-slate-300 text-[10px] sm:text-xs font-bold flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>10 Tasks</span>
                  </div>
                </div>

                {/* Extended Card Action Button */}
                <div className="w-full z-10 pt-1">
                  {isReadyToUnlock ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectLevel(lvl.levelNumber);
                        handleUnlockLevelAction(lvl);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-black shadow-lg flex items-center justify-center gap-1.5 transition-all transform hover:scale-[1.02] active:scale-98 bg-gradient-to-r from-[#FFD45A] via-amber-400 to-[#10D6A0] text-[#020B20] shadow-[#FFD45A]/30 animate-pulse cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Unlock Level {lvl.levelNumber} Assignments 🎉</span>
                    </button>
                  ) : isSelected ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        scrollToTasksSection();
                      }}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-black shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] active:scale-98 cursor-pointer ${
                        isLocked
                          ? 'bg-gradient-to-r from-[#F59E0B] to-[#FFD45A] text-[#020B20] shadow-[#F59E0B]/20'
                          : 'bg-gradient-to-r from-[#1459E8] via-[#2478FF] to-[#22D3EE] text-white shadow-[#1459E8]/35'
                      }`}
                    >
                      <span>{isLocked ? 'Locked Level Details' : 'View 10 Level Tasks'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="w-full py-2 px-3 rounded-xl bg-[#040E24] border border-[#163363] text-center text-xs text-slate-300 font-bold flex items-center justify-center gap-1.5">
                      {isLocked ? (
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                      ) : isCompleted ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-[#22D3EE]" />
                      )}
                      <span>{isLocked ? 'Locked Tier' : isCompleted ? 'Completed Tier' : 'Select Level'}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================
          3. ACTIVE LEVEL EXECUTIVE COMMAND BANNER (Featured Entity)
          Extended width, clear metrics, milestone indicators
          ======================================================== */}
      <section className="p-5 sm:p-7 rounded-3xl bg-gradient-to-r from-[#071D48] via-[#09255E] to-[#04122D] border-2 border-[#1E4A96]/80 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          {/* Left: Medallion & Title Details */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#1264F5] via-[#FFD45A] to-[#10D6A0] p-0.5 shadow-xl shadow-[#1459E8]/30 flex-shrink-0">
              <div className="w-full h-full bg-[#030E24] rounded-[22px] flex items-center justify-center">
                <ActiveIcon className="w-8 h-8 sm:w-10 sm:h-10 text-[#FFD45A]" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-lg bg-[#FFD45A]/20 border border-[#FFD45A]/50 text-[#FFD45A] font-black text-[11px] tracking-wider uppercase">
                  Level {activeLevelNumber}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-[#22D3EE]/20 border border-[#22D3EE]/50 text-[#22D3EE] font-black text-[11px] tracking-wider uppercase">
                  {activeMetadata.badge}
                </span>
                {isSelectedLevelCompleted ? (
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-400/50 text-emerald-400 font-bold text-[11px]">
                    Completed ✓
                  </span>
                ) : isSelectedLevelLocked ? (
                  <span className="px-2.5 py-0.5 rounded-lg bg-red-500/20 border border-red-400/50 text-red-300 font-bold text-[11px]">
                    Locked 🔒
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-lg bg-blue-500/20 border border-blue-400/50 text-blue-300 font-bold text-[11px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FFD45A] animate-ping" />
                    In Progress
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                {activeMetadata.tierName}
              </h2>
              <p className="text-xs sm:text-sm text-[#A6BCD9] font-medium max-w-xl">
                {activeMetadata.description}
              </p>
            </div>
          </div>

          {/* Right: Key Stats Summary Badges */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <div className="p-3 bg-[#061838] border border-[#173C73] rounded-2xl min-w-[130px] shadow-inner text-center sm:text-left">
              <span className="text-[10px] text-[#A6BCD9] block font-bold uppercase tracking-wider">Completion Bonus</span>
              <span className="text-base sm:text-lg font-black text-emerald-400">
                PKR {activeLevelNumber === 1 ? '500' : (level?.completionReward?.toLocaleString() || (activeLevelNumber * 200).toLocaleString())}
              </span>
            </div>

            <div className="p-3 bg-[#061838] border border-[#173C73] rounded-2xl min-w-[130px] shadow-inner text-center sm:text-left">
              <span className="text-[10px] text-[#A6BCD9] block font-bold uppercase tracking-wider">Tier Credit Points</span>
              <span className="text-base sm:text-lg font-black text-[#22D3EE]">
                +{level?.totalCreditPoints || 100} CPs
              </span>
            </div>
          </div>
        </div>

        {/* 10-Task Segmented Status Bar inside Executive Banner */}
        <div className="mt-6 pt-5 border-t border-[#16386E]/80">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
            <span className="flex items-center gap-1.5 text-xs text-[#FFD45A]">
              <Target className="w-4 h-4 text-[#FFD45A]" />
              Level Progression Metric
            </span>
            <span className="font-black text-white text-xs sm:text-sm">
              {approvedTaskCount} of 10 Assignments Approved ({progressPercent}%)
            </span>
          </div>

          <div className="w-full bg-[#030C1C] rounded-full h-3 p-0.5 border border-[#16386E]/70 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#1459E8] via-[#22D3EE] to-[#10D6A0] transition-all duration-500 shadow-md shadow-[#22D3EE]/30"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </section>

      {/* Locked Notice if selected level is locked */}
      {isSelectedLevelLocked && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0B1E48] via-[#071838] to-[#041026] border border-[#F59E0B]/50 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <p className="font-bold text-[#FFD45A] text-sm flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#F59E0B]" />
              Level {activeLevelNumber} is currently locked
            </p>
            <p className="text-slate-300 text-xs">
              Complete all tasks in Level {activeLevelNumber - 1} to unlock this tier and claim assignments.
              {previousLevelSummary && (
                <span className="block text-[#A6BCD9] mt-0.5">
                  Previous Tier Status: {previousLevelApprovedTasks} / 10 tasks approved.
                </span>
              )}
            </p>
          </div>

          <button
            onClick={() => handleSelectLevel(userCurrentLevelNumber)}
            className="inline-flex items-center gap-2 bg-[#1264F5] hover:bg-[#168BFF] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md self-start sm:self-auto flex-shrink-0 cursor-pointer"
          >
            <span>Switch to Active Level {userCurrentLevelNumber}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================
          4. LEVEL UNLOCK GATEWAY (Ready to Unlock Celebration)
          ======================================================== */}
      {selectedLevelSummary && !isSelectedLevelLocked && !isLevelUnlockedByUser(selectedLevelSummary) && (
        <section className="p-8 sm:p-10 text-center rounded-3xl bg-gradient-to-b from-[#091E42] via-[#071B3A] to-[#04132F] border-2 border-[#FFD45A]/60 shadow-2xl shadow-[#FFD45A]/20 space-y-5 relative overflow-hidden backdrop-blur-xl">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#1264F5] via-[#FFD45A] to-[#10D6A0] p-1 mx-auto shadow-xl shadow-[#FFD45A]/30">
            <div className="w-full h-full bg-[#04132F] rounded-[22px] flex items-center justify-center">
              <Trophy className="w-10 h-10 text-[#FFD45A] animate-bounce" />
            </div>
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFD45A]/20 border border-[#FFD45A]/50 text-[#FFD45A] text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Tier {activeLevelNumber} Ready for Activation
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Unlock Level {activeLevelNumber}: {activeMetadata.tierName}
            </h3>
            <p className="text-xs sm:text-sm text-[#B7C6E4] leading-relaxed">
              Congratulations on completing your prior requirements! Click below to celebrate with fireworks and activate your new assignments.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => handleUnlockLevelAction(selectedLevelSummary)}
              className="py-3.5 px-8 rounded-full bg-gradient-to-r from-[#FFD45A] via-amber-400 to-[#10D6A0] hover:brightness-110 text-[#020B20] font-black text-sm shadow-xl shadow-[#FFD45A]/30 transition-all transform hover:scale-105 active:scale-95 inline-flex items-center gap-2 cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock Level {activeLevelNumber} Assignments 🎉</span>
            </button>
          </div>
        </section>
      )}

      {/* ========================================================
          5. EVERY TASK AS A DISTINCT, SEPARATE ENTITY CARD
          Full visual entity: Task number, category, commission chip,
          CPs badge, requirement details, and clear interactive CTA
          ======================================================== */}
      <section ref={tasksSectionRef} className="space-y-5 scroll-mt-24">
        {/* Section Header */}
        <div className="flex items-center justify-between gap-4 border-b border-[#16386E]/80 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#22D3EE]" />
              <span>Level {activeLevelNumber} Task Assignments</span>
            </h3>
            <p className="text-xs text-[#A6BCD9]">
              Complete tasks sequentially in this tier. Standard tasks earn 5 CPs; Prepaid milestones (Tasks 5 & 10) award 30 CPs.
            </p>
          </div>

          <span className="px-3 py-1 rounded-xl bg-[#0B2556] border border-[#16386E] text-[#FFD45A] font-black text-xs hidden sm:inline-flex items-center gap-1.5">
            <span>{tasks.length} Tasks in Tier</span>
          </span>
        </div>

        {tasksLoading && (!tasks || tasks.length === 0) ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-[#1264F5]/30 border-t-[#FFD45A] rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#8194B7] font-medium">Loading task entities...</p>
          </div>
        ) : tasks && tasks.length > 0 ? (
          /* Responsive 2-column Grid of Distinct Task Entity Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {tasks.map((task: any) => {
              const userBalance = wallet?.availableBalance || 0;
              const unlockFee = task.unlockFee || 0;
              const isPrepaid = Boolean(
                task.isPaid ||
                (task.unlockFee && task.unlockFee > 0) ||
                task.taskNumber === 5 ||
                task.taskNumber === 10 ||
                task.taskType?.toLowerCase().includes('prepaid')
              );
              const remainingDepositNeeded = Math.max(0, unlockFee - userBalance);
              const hasSufficientBalance = userBalance >= unlockFee;

              const isTaskLocked = isSelectedLevelLocked || task.userStatus === 'LOCKED';
              const isApproved = !isSelectedLevelLocked && task.userStatus === 'APPROVED';
              const isPending = !isSelectedLevelLocked && task.userStatus === 'PENDING_VERIFICATION';
              const isRejected = !isSelectedLevelLocked && task.userStatus === 'REJECTED';
              const isAvailable =
                !isSelectedLevelLocked &&
                !isApproved &&
                !isPending &&
                !isRejected &&
                !isTaskLocked;

              const taskCPs = isPrepaid
                ? (task.creditPoints && task.creditPoints > 5 ? task.creditPoints : 30)
                : (task.creditPoints && task.creditPoints > 0 ? task.creditPoints : 5);

              return (
                <div
                  id={`task-card-${task.taskNumber}`}
                  key={task.id}
                  onClick={() => {
                    if (!isTaskLocked) {
                      navigate(`/app/tasks/${task.id}`);
                    }
                  }}
                  className={`rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 relative overflow-hidden backdrop-blur-xl ${
                    isTaskLocked
                      ? 'bg-[#040E24]/70 border border-[#142C56]/60 opacity-60 cursor-not-allowed select-none'
                      : isApproved
                      ? 'bg-gradient-to-b from-[#06242B]/80 to-[#031822]/90 border border-emerald-500/40 shadow-lg shadow-emerald-500/5 hover:border-emerald-400 cursor-pointer'
                      : isPending
                      ? 'bg-gradient-to-b from-[#08224C]/80 to-[#041433]/90 border border-[#168BFF]/50 shadow-lg shadow-[#168BFF]/10 hover:border-[#22D3EE] cursor-pointer'
                      : isPrepaid
                      ? 'bg-gradient-to-b from-[#162E5C]/90 via-[#0B214A]/95 to-[#05142E]/95 border-2 border-[#FFD45A]/70 shadow-xl shadow-[#FFD45A]/15 hover:border-[#FFD45A] hover:shadow-[#FFD45A]/25 cursor-pointer transform hover:-translate-y-0.5'
                      : 'bg-gradient-to-b from-[#071D42]/85 to-[#04122B]/95 border border-[#1A4580]/70 shadow-lg hover:border-[#22D3EE] hover:shadow-[#1459E8]/20 cursor-pointer transform hover:-translate-y-0.5'
                  }`}
                >
                  {/* Prepaid Milestone Ribbon */}
                  {isPrepaid && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-[#FFD45A] to-amber-500 text-slate-950 font-black text-[9px] uppercase tracking-widest px-3 py-0.5 rounded-bl-xl shadow-md flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5" />
                      PREPAID MILESTONE • 30 CPS
                    </div>
                  )}

                  {/* Entity Header: Task Number & Status Pill */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shadow-md flex-shrink-0 ${
                          isApproved
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : isPending
                            ? 'bg-[#1264F5]/20 text-[#22D3EE] border border-[#22D3EE]/40'
                            : isPrepaid
                            ? 'bg-gradient-to-br from-[#FFD45A] to-amber-500 text-slate-950 shadow-amber-500/30'
                            : 'bg-[#1459E8]/25 text-white border border-[#1A4580]'
                        }`}
                      >
                        {isApproved ? (
                          <Check className="w-5 h-5 text-emerald-400" />
                        ) : isPending ? (
                          <Clock className="w-5 h-5 text-[#22D3EE]" />
                        ) : isTaskLocked ? (
                          <Lock className="w-4 h-4 text-slate-500" />
                        ) : (
                          <span>#{task.taskNumber < 10 ? `0${task.taskNumber}` : task.taskNumber}</span>
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#A6BCD9] block">
                          {isPrepaid ? 'High-Yield Assignment' : 'Standard Verification'}
                        </span>
                        <h4 className="text-sm sm:text-base font-black text-white tracking-wide">
                          Task {task.taskNumber}: {cleanTaskTitle(task.title)}
                        </h4>
                      </div>
                    </div>

                    {/* Right Status Badge */}
                    <div className="flex-shrink-0 pt-0.5">
                      {isApproved ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm">
                          <CheckCircle2 className="w-3 h-3" /> Approved
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1 bg-[#1264F5]/25 border border-[#168BFF]/40 text-[#22D3EE] text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm animate-pulse">
                          <Clock className="w-3 h-3" /> In Review
                        </span>
                      ) : isRejected ? (
                        <span className="inline-flex items-center gap-1 bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm">
                          <XCircle className="w-3 h-3" /> Rejected
                        </span>
                      ) : isTaskLocked ? (
                        <span className="inline-flex items-center gap-1 bg-[#061633] text-slate-500 text-[10px] font-bold px-2.5 py-1 rounded-full border border-[#142C56]">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-[#1459E8]/20 border border-[#22D3EE]/40 text-[#22D3EE] text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm">
                          <Sparkles className="w-3 h-3 text-[#FFD45A]" /> Ready
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Entity Body: Task Description & Objective */}
                  <p className="text-xs text-[#A6BCD9] leading-relaxed mb-4 line-clamp-2">
                    {task.description || 'Complete the required assignment on YouTube and submit verification proof to earn commission.'}
                  </p>

                  {/* Financial & Yield Row (Commission + Credit Points + Requirement) */}
                  <div className="p-3 rounded-xl bg-[#030D1E]/70 border border-[#16386E]/50 mb-4 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#A6BCD9] uppercase tracking-wider">Reward:</span>
                      <span className="text-xs sm:text-sm font-black text-[#FFD45A]">
                        PKR {task.rewardAmount?.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black text-[#22D3EE] bg-[#22D3EE]/15 border border-[#22D3EE]/30 px-2 py-0.5 rounded-md">
                        +{taskCPs} CPs
                      </span>

                      {isPrepaid ? (
                        <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-400/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5" />
                          PKR {unlockFee.toLocaleString()} Deposit
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-300 bg-slate-800/60 border border-slate-700/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                          Free Task
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Entity Footer CTA Button */}
                  <div>
                    {isTaskLocked ? (
                      <div className="w-full py-2.5 px-4 rounded-xl bg-[#040E24] border border-[#142C56] text-center text-xs text-slate-500 font-bold flex items-center justify-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Prerequisite Locked • Complete Prior Tasks</span>
                      </div>
                    ) : isApproved ? (
                      <div className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-center text-xs text-emerald-400 font-black flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verified & Completed ✓</span>
                      </div>
                    ) : isPending ? (
                      <div className="w-full py-2.5 px-4 rounded-xl bg-[#1264F5]/20 border border-[#168BFF]/40 text-center text-xs text-[#22D3EE] font-black flex items-center justify-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>Submitted • Under Admin Verification</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/app/tasks/${task.id}`);
                        }}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] active:scale-98 cursor-pointer ${
                          isPrepaid
                            ? 'bg-gradient-to-r from-[#FFD45A] via-amber-400 to-[#FFD45A] text-slate-950 shadow-[#FFD45A]/25'
                            : 'bg-gradient-to-r from-[#1459E8] to-[#168BFF] text-white shadow-[#1459E8]/30 hover:brightness-110'
                        }`}
                      >
                        <span>{isPrepaid ? 'Start Prepaid Assignment' : `Start Task #${task.taskNumber}`}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-10 text-center rounded-2xl bg-[#071B3A] border border-[#173C73]">
            <p className="text-[#8194B7] text-xs sm:text-sm">No tasks configured for this tier yet.</p>
          </div>
        )}
      </section>

      {/* ========================================================
          6. LEVEL COMPLETION MOTIVATION & REWARD BANNER
          ======================================================== */}
      {isSelectedLevelCompleted ? (
        <section className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500/15 via-[#071F42] to-teal-500/15 border-2 border-emerald-400/40 shadow-xl backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h4 className="text-base font-black text-white">
                Level {activeLevelNumber} Fully Completed! 🎉
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-slate-300">
              All 10 tasks have been approved. Completion reward of PKR{' '}
              {activeLevelNumber === 1 ? '500' : (level?.completionReward?.toLocaleString() || 0)} and +100 CPs credited to your wallet!
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
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FFD45A] to-amber-400 hover:brightness-110 text-[#020B20] text-xs sm:text-sm font-black px-6 py-3 rounded-xl transition-all shadow-lg shadow-[#FFD45A]/25 self-start sm:self-auto flex-shrink-0 cursor-pointer animate-pulse"
            >
              <Sparkles className="w-4 h-4" />
              <span>Advance to Level {activeLevelNumber + 1} 🎉</span>
            </button>
          )}
        </section>
      ) : (
        <section className="p-5 rounded-2xl bg-gradient-to-r from-[#071D42]/90 via-[#0B2556]/80 to-[#071D42]/90 border border-[#1B3E75]/60 shadow-lg backdrop-blur-md flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#FFD45A]" />
              <span>Level {activeLevelNumber} Tier Completion Reward</span>
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-300">
              Complete all 10 assignments in this tier to claim your PKR{' '}
              {activeLevelNumber === 1 ? '500' : (level?.completionReward?.toLocaleString() || 0)} bonus and +100 Credit Points!
            </p>
          </div>

          <span className="text-xs font-black text-[#FFD45A] bg-[#FFD45A]/15 border border-[#FFD45A]/40 px-3 py-1.5 rounded-xl shadow-sm hidden sm:inline">
            +PKR {activeLevelNumber === 1 ? '500' : (level?.completionReward?.toLocaleString() || 0)}
          </span>
        </section>
      )}

      {/* Motivational Milestone Notification */}
      {!isSelectedLevelCompleted && approvedTaskCount < 10 && liveApprovedTasksCount < 10 && (
        <section className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#1459E8]/20 via-[#081F48] to-[#FFD45A]/15 border border-[#FFD45A]/50 shadow-xl backdrop-blur-md space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FFD45A]" />
            <h4 className="text-xs sm:text-sm font-black text-white">
              Level {activeLevelNumber} Milestone Objective
            </h4>
          </div>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
            {activeLevelNumber === 10
              ? 'Level 10 mukammal karein! 1000 credit points pura karke apna highest withdrawal unlock karein!'
              : `Level ${activeLevelNumber} complete karein! Baqi ${Math.max(0, 10 - activeLevelNumber)} levels unlock karein, 1000 credit points collect karein aur big withdraw unlock karein!`}
          </p>
        </section>
      )}

      {/* ========================================================
          7. TEMPORARY POPUP: PREPAID TASK BALANCE MODAL
          ======================================================== */}
      {prepaidModalTask && (() => {
        const modalUnlockFee = prepaidModalTask.unlockFee || 0;
        const modalRewardAmount = prepaidModalTask.rewardAmount || 80;
        const modalUserBalance = wallet?.availableBalance || 0;
        const modalRemainingNeeded = Math.max(0, modalUnlockFee - modalUserBalance);
        const modalCompletedBalance = (modalUserBalance >= modalUnlockFee ? modalUserBalance : modalUnlockFee) + modalRewardAmount;
        const isSufficient = modalRemainingNeeded === 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto overscroll-contain">
            <div className="royal-card w-full max-w-lg max-h-[90dvh] overflow-y-auto overscroll-contain p-6 sm:p-7 rounded-3xl border border-[#FFD45A]/50 bg-gradient-to-b from-[#071B3A] to-[#041228] shadow-2xl relative space-y-5">
              <button
                type="button"
                onClick={() => setPrepaidModalTask(null)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-[#020B20] text-slate-400 hover:text-white border border-[#173C73] hover:border-[#FFD45A]/50 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

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
                      +30 Credit Points
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    Task {prepaidModalTask.taskNumber}: {cleanTaskTitle(prepaidModalTask.title)}
                  </h3>
                  <p className="text-xs text-[#B7C6E4]">
                    Prepaid assignments require account verification balance. After completing the task, your unlock fee is immediately refunded with full commission.
                  </p>
                </div>
              </div>

              {/* Balance Ledger */}
              <div className="p-4 rounded-2xl bg-[#040F24] border border-[#173C73] space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-[#B7C6E4]">
                  <span>Required Account Balance</span>
                  <span className="font-bold text-white">PKR {modalUnlockFee.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-[#B7C6E4]">
                  <span>Current Available Balance</span>
                  <span className="font-bold text-[#22D3EE]">PKR {modalUserBalance.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-[#B7C6E4]">
                  <span>Task Commission Profit</span>
                  <span className="font-bold text-emerald-400">+PKR {modalRewardAmount.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-[#173C73] flex items-center justify-between">
                  <span className="font-bold text-white">Projected Balance After Completion</span>
                  <span className="font-black text-[#FFD45A] text-sm">
                    PKR {modalCompletedBalance.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                {isSufficient ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPrepaidModalTask(null);
                      navigate(`/app/tasks/${prepaidModalTask.id}`);
                    }}
                    className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-[#FFD45A] to-amber-400 text-[#020B20] font-black text-xs shadow-lg shadow-[#FFD45A]/25 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Proceed to Assignment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setPrepaidModalTask(null);
                        navigate(`/app/wallet?action=deposit&amount=${modalRemainingNeeded}`);
                      }}
                      className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-[#1459E8] to-[#2478FF] text-white font-black text-xs shadow-lg shadow-[#1459E8]/30 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ArrowDownLeft className="w-4 h-4 text-[#FFD45A]" />
                      <span>Deposit PKR {modalRemainingNeeded.toLocaleString()}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPrepaidModalTask(null);
                        navigate(`/app/tasks/${prepaidModalTask.id}`);
                      }}
                      className="py-3 px-4 rounded-xl bg-[#0B2248] border border-[#173C73] text-slate-300 font-bold text-xs hover:text-white transition-all cursor-pointer"
                    >
                      View Details
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================
          8. LEVEL UNLOCKED CELEBRATION MODAL
          ======================================================== */}
      {congratsModalLevel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="royal-card w-full max-w-md p-6 sm:p-8 rounded-3xl border-2 border-[#FFD45A]/60 bg-gradient-to-b from-[#091E42] via-[#071A38] to-[#041228] shadow-2xl text-center space-y-5 relative">
            <button
              onClick={() => setCongratsModalLevel(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-[#020B20] text-slate-400 hover:text-white border border-[#173C73] transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#FFD45A] to-[#10D6A0] p-1 mx-auto shadow-xl shadow-[#FFD45A]/30">
              <div className="w-full h-full bg-[#04132F] rounded-[22px] flex items-center justify-center">
                <Trophy className="w-8 h-8 text-[#FFD45A] animate-bounce" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Level {congratsModalLevel.levelNumber} Unlocked!
              </h3>
              <p className="text-xs text-[#B7C6E4] leading-relaxed">
                Congratulations! You have unlocked{' '}
                <strong className="text-[#FFD45A] font-bold">
                  {congratsModalLevel.title || `Level ${congratsModalLevel.levelNumber}`}
                </strong>
                . Complete all 10 assignments in this tier to earn your completion reward.
              </p>
            </div>

            <button
              onClick={() => {
                setCongratsModalLevel(null);
                scrollToTasksSection();
              }}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-[#FFD45A] via-amber-400 to-[#10D6A0] text-[#020B20] font-black text-xs shadow-xl shadow-[#FFD45A]/30 transition-all transform hover:scale-[1.02] cursor-pointer"
            >
              Start Level {congratsModalLevel.levelNumber} Assignments
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
