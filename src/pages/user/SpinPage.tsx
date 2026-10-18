import React, { useState, useEffect, useRef } from 'react';
import {
  Crown,
  Disc,
  Sparkles,
  Gift,
  Coins,
  Trophy,
  History,
  AlertCircle,
  CheckCircle2,
  Lock,
  Volume2,
  VolumeX,
  Flame,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const DEFAULT_FALLBACK_PRIZES = [
  { id: 'p1', displayLabel: 'PKR 50', name: 'PKR 50', prizeType: 'CASH', monetaryValue: 50, color: '#1459E8' },
  { id: 'p2', displayLabel: 'PKR 100', name: 'PKR 100', prizeType: 'CASH', monetaryValue: 100, color: '#792BFF' },
  { id: 'p3', displayLabel: 'PKR 250', name: 'PKR 250', prizeType: 'CASH', monetaryValue: 250, color: '#059669' },
  { id: 'p4', displayLabel: 'PKR 500', name: 'PKR 500', prizeType: 'CASH', monetaryValue: 500, color: '#DC2626' },
  { id: 'p5', displayLabel: 'PKR 1,000', name: 'PKR 1,000', prizeType: 'CASH', monetaryValue: 1000, color: '#0284C7' },
  { id: 'p6', displayLabel: 'PKR 5,000 Mega', name: 'PKR 5,000', prizeType: 'CASH', monetaryValue: 5000, color: '#D97706' },
  { id: 'p7', displayLabel: 'Gold Watch', name: 'Royal Gold Watch', prizeType: 'PHYSICAL', monetaryValue: 15000, color: '#4F46E5', icon: 'watch' },
  { id: 'p8', displayLabel: 'Smartphone Pro', name: 'Smartphone Pro', prizeType: 'PHYSICAL', monetaryValue: 75000, color: '#EAB308', icon: 'smartphone' },
];

const getPrizeProductImage = (prize: any) => {
  if (!prize) return null;
  if (prize.imageUrl) return prize.imageUrl;
  if (prize.image) return prize.image;

  const type = (prize.prizeType || '').toUpperCase();
  const name = (prize.name || '').toLowerCase();
  const label = (prize.displayLabel || '').toLowerCase();
  const icon = (prize.icon || '').toLowerCase();

  // Smartphone Pro
  if (name.includes('phone') || label.includes('phone') || icon.includes('phone') || icon.includes('mobile')) {
    return '/images/spin/product-smartphone.svg';
  }
  // Royal Gold Watch
  if (name.includes('watch') || label.includes('watch') || icon.includes('watch') || icon.includes('clock')) {
    return '/images/spin/product-watch.svg';
  }
  // Physical gift / general physical product
  if (type === 'PHYSICAL' || name.includes('gift') || label.includes('gift') || icon.includes('gift')) {
    return '/images/spin/product-gift.svg';
  }
  // Cash jackpot
  if (name.includes('5,000') || label.includes('5,000') || name.includes('mega') || icon === 'trophy') {
    return '/images/spin/product-cash.svg';
  }
  return null;
};

const getFormattedWheelText = (rawLabel: string) => {
  const label = (rawLabel || '').trim();
  if (!label) return { line1: '', line2: null, fontSize: '2.5' };

  if (label.includes(' ') && label.length > 6) {
    const words = label.split(' ');
    if (words.length === 2) {
      const maxLen = Math.max(words[0].length, words[1].length);
      const fs = maxLen > 10 ? '2.1' : maxLen > 7 ? '2.3' : '2.5';
      return { line1: words[0], line2: words[1], fontSize: fs };
    }
    const mid = Math.ceil(words.length / 2);
    const line1 = words.slice(0, mid).join(' ');
    const line2 = words.slice(mid).join(' ');
    const maxLen = Math.max(line1.length, line2.length);
    const fs = maxLen > 10 ? '2.0' : maxLen > 7 ? '2.2' : '2.4';
    return { line1, line2, fontSize: fs };
  }

  const fs = label.length > 10 ? '2.0' : label.length > 7 ? '2.3' : '2.6';
  return { line1: label, line2: null, fontSize: fs };
};

// Synthesize pleasant casino audio clicks using Web Audio API
const playTick = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(650, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (_) {}
};

const playFanfare = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const chords = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    chords.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.12);
      osc.stop(ctx.currentTime + idx * 0.12 + 0.55);
    });
  } catch (_) {}
};

export const SpinPage: React.FC = () => {
  const { refreshUser } = useAuth();
  const cachedSpin = api.getCachedData<any>('/spin/status');
  const [spinData, setSpinData] = useState<any>(cachedSpin);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [wonPrize, setWonPrize] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeLedPhase, setActiveLedPhase] = useState(0);
  const [liveNotice, setLiveNotice] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Blinking casino rim lights
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLedPhase((p) => (p + 1) % 2);
    }, 450);
    return () => clearInterval(interval);
  }, []);

  const loadSpinStatus = (silent = false) => {
    if (!silent) setIsSyncing(true);
    api
      .getSpinStatus()
      .then((res) => {
        setSpinData(res);
        setError(null);
      })
      .catch((err) => {
        if (!spinData) setError(err.message || 'Failed to load spin wheel');
      })
      .finally(() => {
        setIsSyncing(false);
      });
  };

  useEffect(() => {
    loadSpinStatus(!!spinData);
  }, []);

  // Realtime Live Update Listener (Zero Reload Strategy)
  // When admin approves a spin or sends a command, update immediately without page refresh
  useEffect(() => {
    const handleLiveEvent = (e: any) => {
      const type = e.detail?.type;
      if (type === 'spin' || type === 'notification' || type === 'command' || type === 'all') {
        api.invalidateCache('/spin');
        loadSpinStatus(true);
        setLiveNotice('⚡ Instant Sync: Spin entitlements updated live!');
        setTimeout(() => setLiveNotice(null), 4500);
      }
    };

    const handleHeartbeat = () => {
      loadSpinStatus(true);
    };

    window.addEventListener('royal_live_update', handleLiveEvent);
    window.addEventListener('royal_live_heartbeat', handleHeartbeat);
    return () => {
      window.removeEventListener('royal_live_update', handleLiveEvent);
      window.removeEventListener('royal_live_heartbeat', handleHeartbeat);
    };
  }, []);

  const handleSpin = async () => {
    if (isSpinning || !spinData?.isEligible || spinData?.remainingSpins <= 0) return;

    setError(null);
    setWonPrize(null);
    setIsSpinning(true);

    try {
      const res = await api.playSpin();
      const prizes = (spinData?.prizes && spinData.prizes.length > 0) ? spinData.prizes : DEFAULT_FALLBACK_PRIZES;
      const prizeCount = prizes.length;
      const segmentAngle = 360 / prizeCount;

      const prizeIndex = res.prizeIndex >= 0 ? res.prizeIndex : 0;
      const extraRotations = 360 * 6;
      const targetAngle = extraRotations + (360 - (prizeIndex * segmentAngle + segmentAngle / 2));

      setRotationDegrees((prev) => prev + targetAngle);

      // Sound ticks during deceleration
      if (soundEnabled) {
        let tickCount = 0;
        const tickInterval = setInterval(() => {
          tickCount++;
          playTick();
          if (tickCount > 28) clearInterval(tickInterval);
        }, 120);
      }

      // 4.5 seconds for wheel deceleration
      setTimeout(async () => {
        setIsSpinning(false);
        setWonPrize(res.prize);

        if (soundEnabled) {
          playFanfare();
        }

        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#FFD45A', '#1459E8', '#22D3EE', '#792BFF', '#FFFFFF'],
        });

        await refreshUser();
        loadSpinStatus(true);
      }, 4500);
    } catch (err: any) {
      setIsSpinning(false);
      setError(err.message || 'Spin failed');
    }
  };

  const {
    remainingSpins = 0,
    isEligible = false,
    pendingMilestone = false,
    prizes: backendPrizes = [],
    history = [],
  } = spinData || {};

  const prizes = backendPrizes && backendPrizes.length > 0 ? backendPrizes : DEFAULT_FALLBACK_PRIZES;
  const segmentAngle = 360 / (prizes.length || 1);

  // 24 LED casino lights around the bezel
  const ledBulbs = Array.from({ length: 24 });

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Realtime Live Update Toast */}
      {liveNotice && (
        <div className="p-3 bg-gradient-to-r from-emerald-600/30 via-emerald-500/20 to-teal-600/30 border border-emerald-400/50 rounded-2xl text-emerald-200 text-xs flex items-center justify-center gap-2.5 max-w-md mx-auto shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-[#FFD45A] animate-spin" />
          <span className="font-bold">{liveNotice}</span>
        </div>
      )}

      {/* Clean Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <span>Daily Fortune Wheel</span>
            <Crown className="w-6 h-6 text-[#FFD45A]" />
          </h1>
          <p className="text-xs text-slate-400">Spin the wheel to win verified instant rewards</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 transition-colors"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-[#FFD45A]" />
                <span>Sound ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                <span>Sound OFF</span>
              </>
            )}
          </button>
          <div className="px-4 py-1.5 bg-[#FFD45A]/15 border border-[#FFD45A]/40 rounded-xl text-xs font-bold text-[#FFD45A] flex items-center gap-1.5">
            <span>Available Spins: </span>
            <strong className="text-base text-white ml-0.5">{remainingSpins}</strong>
            {isSyncing && <RefreshCw className="w-3 h-3 text-[#FFD45A] animate-spin ml-1" />}
          </div>
        </div>
      </div>

      {/* Milestone Spin Under Review Banner */}
      {pendingMilestone && (
        <div className="p-4 bg-gradient-to-r from-[#FFD45A]/15 via-[#0B2248] to-[#1264F5]/20 border border-[#FFD45A]/50 rounded-2xl text-slate-200 text-xs max-w-3xl mx-auto shadow-lg backdrop-blur-md">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#FFD45A] uppercase tracking-wider text-[11px]">
                Milestone Free Spin Under Review
              </span>
              <span className="bg-[#FFD45A]/20 text-[#FFD45A] text-[10px] font-bold px-2 py-0.5 rounded-full">
                Task Milestone
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              You completed a milestone assignment! Administration is currently preparing your exclusive prize allocation. Once approved, your wheel spin unlocks automatically in real time without reloading!
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/15 border border-red-500/50 rounded-2xl text-red-300 text-sm flex items-center gap-3 max-w-xl mx-auto shadow-lg backdrop-blur-md">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Winner Celebration Modal Banner */}
      {wonPrize && (
        <div className="p-8 rounded-3xl border-2 border-[#FFD45A] bg-gradient-to-br from-[#0B1E48] via-[#04132F] to-[#020B20] text-center space-y-4 animate-in fade-in zoom-in duration-300 max-w-xl mx-auto shadow-2xl shadow-[#FFD45A]/30 relative overflow-hidden">
          <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden shadow-2xl border-2 border-[#FFD45A] bg-black">
            <img
              src="/images/spin/spin-jackpot-treasure.jpg"
              alt="Won Prize"
              className="w-full h-full object-cover animate-pulse"
            />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFD45A]/20 border border-[#FFD45A] text-[#FFD45A] rounded-full text-xs font-bold uppercase tracking-wider">
            <Crown className="w-3.5 h-3.5" />
            <span>Winner Announcement</span>
          </div>
          <h2 className="text-3xl font-black text-white">Congratulations! 🎉</h2>
          <div className="p-4 bg-[#FFD45A]/10 border border-[#FFD45A]/30 rounded-2xl">
            <p className="text-2xl font-black text-[#FFD45A]">{wonPrize.name}</p>
            <p className="text-xs text-slate-200 mt-1 font-medium">
              {wonPrize.prizeType === 'CASH'
                ? `PKR ${wonPrize.monetaryValue.toLocaleString()} has been credited straight into your wallet balance!`
                : 'Exclusive physical product reward! Our VIP team will contact your phone number for immediate delivery.'}
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              to="/wallet"
              className="px-6 py-2.5 bg-[#1459E8] hover:bg-[#1048bf] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg"
            >
              <span>View Wallet Balance</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* The 3D Casino Wheel Main Stage */}
      <div className="relative rounded-3xl p-6 sm:p-12 flex flex-col items-center justify-center bg-gradient-to-b from-[#0B1E48]/80 via-[#04132F] to-[#020B20] border border-[#214B91]/50 shadow-2xl overflow-hidden">
        {/* Glow backdrop aura */}
        <div className="absolute w-96 h-96 bg-[#1459E8]/20 rounded-full blur-3xl pointer-events-none -top-10" />
        <div className="absolute w-96 h-96 bg-[#FFD45A]/15 rounded-full blur-3xl pointer-events-none -bottom-10" />

        {/* Realistic Pointer Needle at Top */}
        <div className="relative z-30 -mb-7 flex flex-col items-center">
          <div
            className={`w-12 h-16 sm:w-14 sm:h-18 relative transition-transform duration-100 ${
              isSpinning ? 'rotate-[-3deg] scale-105' : 'rotate-0'
            }`}
          >
            <img
              src="/images/spin/spin-golden-pointer.svg"
              alt="Golden Pointer Needle"
              className="w-full h-full object-contain filter drop-shadow-[0_10px_16px_rgba(0,0,0,0.85)] drop-shadow-[0_0_15px_rgba(255,212,90,0.7)]"
            />
          </div>
        </div>

        {/* Outer Casino Bezel with 24 Blinking LED Bulbs */}
        <div className="relative w-80 h-80 sm:w-[420px] sm:h-[420px] rounded-full p-4 sm:p-5 flex items-center justify-center bg-gradient-to-b from-[#FFE58F] via-[#B8860B] to-[#78590A] shadow-[0_0_50px_rgba(255,212,90,0.35),inset_0_0_20px_rgba(0,0,0,0.8)] border-4 border-[#FFD45A]">
          {/* LED Bulbs placed circularly */}
          {ledBulbs.map((_, i) => {
            const angle = (i * 360) / ledBulbs.length;
            const isLightOn = (i + activeLedPhase) % 2 === 0;
            return (
              <div
                key={i}
                className="absolute w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full transition-all duration-300"
                style={{
                  top: `calc(50% - 6px + ${48 * Math.sin((angle * Math.PI) / 180)}%)`,
                  left: `calc(50% - 6px + ${48 * Math.cos((angle * Math.PI) / 180)}%)`,
                  backgroundColor: isLightOn ? '#FFD45A' : '#1459E8',
                  boxShadow: isLightOn
                    ? '0 0 10px #FFD45A, 0 0 20px #FFD45A'
                    : '0 0 8px #22D3EE',
                }}
              />
            );
          })}

          {/* Inner Golden Rim Frame */}
          <div className="w-full h-full rounded-full p-2 bg-[#020B20] border-2 border-[#FFE58F]/60 shadow-[inset_0_0_25px_rgba(0,0,0,0.9)] relative flex items-center justify-center overflow-hidden">
            {/* The Rotating Wheel SVG */}
            <svg
              className="w-full h-full rounded-full shadow-2xl transition-transform duration-[4500ms] cubic-bezier(0.12, 0.95, 0.22, 1)"
              viewBox="0 0 100 100"
              style={{ transform: `rotate(${rotationDegrees}deg)` }}
            >
              <defs>
                <radialGradient id="royalWheelGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0B1E48" />
                  <stop offset="85%" stopColor="#020B20" />
                  <stop offset="100%" stopColor="#000000" />
                </radialGradient>
                <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="0.8" floodColor="#FFD45A" floodOpacity="0.8" />
                </filter>
              </defs>

              {prizes.map((p: any, idx: number) => {
                const startAngle = idx * segmentAngle;
                const endAngle = (idx + 1) * segmentAngle;
                const x1 = 50 + 50 * Math.cos((Math.PI * (startAngle - 90)) / 180);
                const y1 = 50 + 50 * Math.sin((Math.PI * (startAngle - 90)) / 180);
                const x2 = 50 + 50 * Math.cos((Math.PI * (endAngle - 90)) / 180);
                const y2 = 50 + 50 * Math.sin((Math.PI * (endAngle - 90)) / 180);
                const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;

                // Mid angle for text label and icon placement
                const midAngle = startAngle + segmentAngle / 2;
                const rad = (Math.PI * (midAngle - 90)) / 180;

                // Center of text label placed at r=34
                const tx = 50 + 34 * Math.cos(rad);
                const ty = 50 + 34 * Math.sin(rad);

                // Small adjusted picture of physical product placed at r=20.5 (ideal gap between center hub and text)
                const ix = 50 + 20.5 * Math.cos(rad);
                const iy = 50 + 20.5 * Math.sin(rad);
                const productImg = getPrizeProductImage(p);

                // Segment color schemes
                const segmentStyles = [
                  { fill: '#1459E8', text: '#FFFFFF' },
                  { fill: '#792BFF', text: '#FFFFFF' },
                  { fill: '#059669', text: '#FFFFFF' },
                  { fill: '#DC2626', text: '#FFFFFF' },
                  { fill: '#0284C7', text: '#FFFFFF' },
                  { fill: '#D97706', text: '#020B20' },
                  { fill: '#4F46E5', text: '#FFFFFF' },
                  { fill: '#EAB308', text: '#020B20' },
                ];
                const currentStyle = segmentStyles[idx % segmentStyles.length];
                const wheelText = getFormattedWheelText(p.displayLabel || p.name);

                return (
                  <g key={p.id || idx}>
                    <path
                      d={pathData}
                      fill={p.color || currentStyle.fill}
                      stroke="#FFD45A"
                      strokeWidth="0.75"
                    />

                    {/* Physical product small picture adjusted to slice width */}
                    {productImg && (
                      <image
                        href={productImg}
                        xlinkHref={productImg}
                        x={ix - 3.75}
                        y={iy - 3.75}
                        width="7.5"
                        height="7.5"
                        preserveAspectRatio="xMidYMid meet"
                        transform={`rotate(${midAngle}, ${ix}, ${iy})`}
                        style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.85))' }}
                      />
                    )}

                    {/* Prize display text */}
                    <text
                      x={tx}
                      y={ty}
                      fill={currentStyle.text}
                      fontSize={wheelText.fontSize}
                      fontWeight="800"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      filter="drop-shadow(0px 0.8px 1.5px rgba(0,0,0,0.9))"
                      transform={`rotate(${midAngle}, ${tx}, ${ty})`}
                    >
                      {wheelText.line2 ? (
                        <>
                          <tspan x={tx} dy="-1.3">{wheelText.line1}</tspan>
                          <tspan x={tx} dy="2.7">{wheelText.line2}</tspan>
                        </>
                      ) : (
                        wheelText.line1
                      )}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* 3D Realistic Gold Center Medallion */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-[#FFD45A] shadow-[0_0_25px_rgba(255,212,90,0.8)] bg-[#020B20] relative flex items-center justify-center">
                <img
                  src="/images/spin/spin-gold-center-hub.jpg"
                  alt="Royal Crown Hub"
                  className="w-full h-full object-cover scale-110"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Spin Button & Status */}
        <div className="text-center space-y-4 mt-8 z-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#020B20]/90 border border-[#214B91] rounded-full text-xs text-slate-300">
            <span>Remaining Daily Spins:</span>
            <strong className="text-[#FFD45A] font-black text-sm">{remainingSpins}</strong>
          </div>

          <div>
            {isEligible && remainingSpins > 0 ? (
              <button
                onClick={handleSpin}
                disabled={isSpinning}
                className="group relative px-12 py-5 bg-gradient-to-r from-[#FFD45A] via-yellow-400 to-[#FFD45A] hover:from-yellow-400 hover:to-amber-300 active:scale-95 text-[#020B20] font-black text-lg rounded-2xl shadow-[0_0_35px_rgba(255,212,90,0.5)] transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-3 mx-auto cursor-pointer"
              >
                {isSpinning ? (
                  <>
                    <span className="w-6 h-6 border-3 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span className="tracking-wide">SPINNING FORTUNE...</span>
                  </>
                ) : (
                  <>
                    <Disc className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
                    <span className="tracking-wide">SPIN NOW & WIN</span>
                  </>
                )}
              </button>
            ) : pendingMilestone ? (
              <div className="px-8 py-4 bg-[#FFD45A]/10 border border-[#FFD45A]/40 text-[#FFD45A] rounded-2xl text-xs font-semibold max-w-md mx-auto shadow-lg flex items-center justify-center gap-2">
                <Lock className="w-4 h-4 flex-shrink-0" />
                <span>Milestone spin under review. Unlocks automatically live when approved.</span>
              </div>
            ) : (
              <div className="px-8 py-4 bg-[#0B2248]/80 border border-[#1459E8]/40 text-slate-300 rounded-2xl text-xs font-semibold max-w-md mx-auto shadow-lg flex items-center justify-center gap-2">
                <Lock className="w-4 h-4 text-[#FFD45A] flex-shrink-0" />
                <span>Complete Task 3, Task 7, or reach Level 10 to receive free spins.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rules & Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#07132B]/70 border border-[#162E5B] space-y-2">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Coins className="w-4 h-4 text-[#FFD45A]" />
            <span>Instant Cash Rewards</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            All cash amounts won from the wheel are directly credited to your wallet balance in real time.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#07132B]/70 border border-[#162E5B] space-y-2">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Gift className="w-4 h-4 text-[#22D3EE]" />
            <span>Physical Luxury Products</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Win verified physical products like smartphones and luxury watches delivered directly to your address.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#07132B]/70 border border-[#162E5B] space-y-2">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Trophy className="w-4 h-4 text-[#10D6A0]" />
            <span>Milestone Allocation</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Free spins are awarded when reaching Task 3 and Task 7 milestones, reviewed directly by administration.
          </p>
        </div>
      </div>

      {/* Recent Won Prizes History */}
      {history && history.length > 0 && (
        <div className="rounded-2xl bg-[#07132B]/70 border border-[#162E5B] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-[#FFD45A]" />
              <span>Your Spin History</span>
            </h3>
            <span className="text-xs text-slate-400">{history.length} records</span>
          </div>
          <div className="space-y-2">
            {history.slice(0, 5).map((item: any, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-[#0B2248]/50 border border-[#162E5B]/50 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-white">{item.prize?.name || 'Spin Prize'}</span>
                </div>
                <span className="text-slate-400">
                  {new Date(item.spunAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
