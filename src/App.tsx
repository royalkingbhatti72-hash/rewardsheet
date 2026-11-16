import React from 'react';
import { Crown, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export function App() {
  return (
    <div className="min-h-screen bg-[#07070A] text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md rounded-3xl bg-gradient-to-b from-[#170B10] via-[#0E0A0D] to-[#09090C] border border-red-900/50 p-7 sm:p-8 shadow-2xl text-center space-y-6">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent rounded-t-3xl" />

        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-400 p-0.5 shadow-lg shadow-red-600/30">
          <div className="w-full h-full bg-[#09090C] rounded-[14px] flex items-center justify-center">
            <Crown className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Official Platform Upgrade</span>
        </div>

        <div className="space-y-2.5">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Earn Street Pro
          </h1>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Earn Street has been upgraded to the new <strong className="text-white">Pro &amp; Updated Version</strong>. Please continue to the official Pro portal to log in and access your account, tasks, and rewards.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-black/50 border border-red-900/35 flex items-center justify-center gap-2 text-xs text-zinc-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>All your existing account data &amp; wallet balance are 100% secure.</span>
        </div>

        <div className="pt-1 space-y-3">
          <a
            href="https://www.streetearnpro.site/login"
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm sm:text-base shadow-xl shadow-red-600/30 flex items-center justify-center gap-2.5 transition-all transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <span>Login on Pro &amp; Updated Version</span>
            <ArrowRight className="w-4 h-4" />
          </a>

          <a
            href="https://www.streetearnpro.site"
            className="block text-xs font-semibold text-zinc-400 hover:text-red-400 transition-colors"
          >
            www.streetearnpro.site
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;
