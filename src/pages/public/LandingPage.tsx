import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Crown,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Disc,
  Zap,
  Lock,
  ChevronRight,
  HelpCircle,
  Smartphone,
  Layers,
  Award,
} from 'lucide-react';
import { api } from '../../api/client';

export const LandingPage: React.FC = () => {
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    api.getPublicSettings().then(setSettings).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#04132F] text-slate-100 flex flex-col selection:bg-[#1459E8] selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-[#020B20]/90 backdrop-blur-md border-b border-[#214B91]/50 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1459E8] to-[#FFD45A] p-0.5 shadow-lg shadow-[#1459E8]/30">
              <div className="w-full h-full bg-[#04132F] rounded-[10px] flex items-center justify-center">
                <Crown className="w-5 h-5 text-[#FFD45A]" />
              </div>
            </div>
            <div>
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-[#FFD45A] bg-clip-text text-transparent">
                EARN STREET
              </span>
              <span className="block text-[10px] text-[#22D3EE] font-bold tracking-widest uppercase">
                Premier Rewards Platform
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-white px-3 sm:px-4 py-2 rounded-xl transition-colors"
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="text-xs sm:text-sm font-bold bg-gradient-to-r from-[#1459E8] to-[#2478FF] hover:from-[#2478FF] hover:to-[#1459E8] text-white px-4 sm:px-5 py-2.5 rounded-xl shadow-lg shadow-[#1459E8]/40 border border-[#2478FF]/50 transition-all hover:scale-105"
            >
              Register Now
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-32 px-4 sm:px-8">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#1459E8]/20 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-[#792BFF]/15 blur-3xl rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#1459E8]/20 border border-[#214B91] px-4 py-1.5 rounded-full mb-6 text-xs sm:text-sm text-[#22D3EE] font-semibold">
            <Sparkles className="w-4 h-4 text-[#FFD45A] animate-spin" style={{ animationDuration: '6s' }} />
            <span>Verified Sequential PKR Rewards & Daily Wheel</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-tight mb-6">
            Ascend The Throne Of <br />
            <span className="bg-gradient-to-r from-[#FFD45A] via-amber-200 to-[#FFD45A] bg-clip-text text-transparent">
              Earn Street
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Experience Pakistan’s leading 10-level reward progression ecosystem. Complete sequential tasks, unlock VIP tiers, spin for instant cash prizes, and withdraw directly to Easypaisa and JazzCash.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Link
              to="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-[#FFD45A] to-amber-400 text-[#020B20] font-black text-base px-8 py-4 rounded-xl shadow-xl shadow-[#FFD45A]/20 hover:scale-105 transition-all"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#020B20]/80 hover:bg-[#020B20] border border-[#214B91] text-white font-bold text-base px-8 py-4 rounded-xl transition-all"
            >
              <span>Sign In</span>
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto">
            <div className="royal-card p-4 rounded-2xl">
              <span className="text-2xl sm:text-3xl font-black text-[#FFD45A] block">10</span>
              <span className="text-xs text-slate-400 font-medium">Progressive Tiers</span>
            </div>
            <div className="royal-card p-4 rounded-2xl">
              <span className="text-2xl sm:text-3xl font-black text-[#22D3EE] block">100</span>
              <span className="text-xs text-slate-400 font-medium">Sequential Tasks</span>
            </div>
            <div className="royal-card p-4 rounded-2xl">
              <span className="text-2xl sm:text-3xl font-black text-[#22C55E] block">PKR 50k+</span>
              <span className="text-xs text-slate-400 font-medium">Level 10 Prize</span>
            </div>
            <div className="royal-card p-4 rounded-2xl">
              <span className="text-2xl sm:text-3xl font-black text-[#60A5FA] block">100%</span>
              <span className="text-xs text-slate-400 font-medium">Verified Manual Payouts</span>
            </div>
          </div>
        </div>
      </section>

      {/* 10-Level System Showcase */}
      <section className="py-16 bg-[#020B20] border-y border-[#214B91]/50 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#FFD45A] uppercase tracking-wider mb-2">
              <Layers className="w-4 h-4" /> 10 Levels & 100 Standard Tasks
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Strict Sequential Tier Progression
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto mt-2">
              Every level contains exactly 10 tasks. Complete Task 1 to unlock Task 2. Clear all 10 to unlock the next prestige level!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { lvl: 1, name: 'Apprentice Tier', desc: '10 free tasks at PKR 15 per task', tasksInfo: 'PKR 15 / Task' },
              { lvl: 2, name: 'Bronze Sovereign', desc: '9 free tasks (PKR 40) + 1 prepaid task', tasksInfo: 'Up to PKR 544' },
              { lvl: 3, name: 'Silver Monarch', desc: '8 free tasks (PKR 60) + 2 prepaid tasks', tasksInfo: 'Up to PKR 2,200' },
              { lvl: 4, name: 'Gold Viceroy', desc: '10 VIP prepaid tasks with 40% commission', tasksInfo: '40% Commission' },
              { lvl: 5, name: 'Emerald Regent', desc: '10 standard tasks unlocked after Level 4', tasksInfo: '10 Tasks' },
              { lvl: 10, name: 'Royal Emperor (Final)', desc: 'The apex tier of Earn Street progression', tasksInfo: '10 Tasks' },
            ].map((tier) => (
              <div key={tier.lvl} className="royal-card p-6 rounded-2xl relative overflow-hidden group">
                <div className="flex items-center justify-between mb-4">
                  <span className="w-8 h-8 rounded-lg bg-[#1459E8]/30 border border-[#214B91] flex items-center justify-center font-bold text-sm text-[#FFD45A]">
                    L{tier.lvl}
                  </span>
                  <span className="text-xs font-bold text-[#22C55E] bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                    {tier.tasksInfo}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#FFD45A] transition-colors">
                  {tier.name}
                </h3>
                <p className="text-xs text-slate-400 mb-4">{tier.desc}</p>
                <div className="flex items-center justify-between pt-3 border-t border-[#214B91]/40 text-xs text-slate-300">
                  <span>10 Sequential Tasks</span>
                  <span className="text-[#2478FF] font-semibold flex items-center gap-1">
                    Verified by Admin <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Royal Spin Feature */}
      <section className="py-16 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto royal-card rounded-3xl p-8 sm:p-12 relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FFD45A] uppercase tracking-wider mb-2">
                <Disc className="w-4 h-4 text-[#FFD45A] animate-spin" /> Daily Royal Spin Wheel
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-4">
                Spin & Win Up To <br />
                <span className="text-[#FFD45A]">PKR 5,000 & Gadgets</span>
              </h2>
              <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                Eligible members receive royal spin entitlements. Spin the wheel to claim real cash deposited directly to your wallet, gold watches, and high-end smartphones!
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/app/spin"
                  className="bg-[#1459E8] hover:bg-[#2478FF] text-white font-bold text-sm px-6 py-3 rounded-xl transition-all"
                >
                  Explore Spin Wheel
                </Link>
                <Link
                  to="/register"
                  className="bg-white/5 hover:bg-white/10 border border-[#214B91] text-white font-bold text-sm px-6 py-3 rounded-xl transition-all"
                >
                  Create Account
                </Link>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-full border-4 border-[#FFD45A] shadow-2xl shadow-[#FFD45A]/20 flex items-center justify-center bg-gradient-to-tr from-[#1459E8] via-[#792BFF] to-[#020B20] p-4 text-center">
                <div>
                  <Crown className="w-12 h-12 text-[#FFD45A] mx-auto mb-2 animate-bounce" />
                  <span className="text-lg font-black text-white block">ROYAL WHEEL</span>
                  <span className="text-xs text-[#22D3EE] font-bold">100% Backend Determined</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="py-12 bg-[#020B20] border-t border-[#214B91]/50 px-4 sm:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-4">
            Supported Deposit & Withdrawal Channels
          </span>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12">
            <div className="flex items-center gap-2 bg-[#04132F] px-4 py-2 rounded-xl border border-[#214B91]">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="font-bold text-sm text-white">Easypaisa</span>
            </div>
            <div className="flex items-center gap-2 bg-[#04132F] px-4 py-2 rounded-xl border border-[#214B91]">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="font-bold text-sm text-white">JazzCash</span>
            </div>
            <div className="flex items-center gap-2 bg-[#04132F] px-4 py-2 rounded-xl border border-[#214B91]">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="font-bold text-sm text-white">All Pakistan Banks</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-[#020B20] border-t border-[#214B91]/40 px-4 sm:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-[#FFD45A]" />
            <span className="font-bold text-slate-200">Earn Street Platform</span>
            <span>© 2026. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
