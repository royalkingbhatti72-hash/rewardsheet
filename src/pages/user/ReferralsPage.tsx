import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Copy,
  CheckCircle2,
  Disc,
  Search,
  Share2,
  Clock,
  FileText,
  X,
  Check,
  ShieldCheck,
  Ticket,
} from 'lucide-react';
import { api } from '../../api/client';
import { useBodyScrollLock } from '../../utils/useBodyScrollLock';

export const ReferralsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Lock body scroll when Terms & Conditions modal is active
  useBodyScrollLock(showTermsModal);

  useEffect(() => {
    api
      .getReferrals()
      .then(setData)
      .catch((err) => console.error('Failed to load referrals:', err))
      .finally(() => setLoading(false));
  }, []);

  const referralCode = data?.referralCode || '';
  const totalReferrals = data?.totalReferrals || 0;
  const qualifiedReferrals = data?.qualifiedReferrals || 0;
  const pendingReferrals = data?.pendingReferrals || 0;
  const spinsEarned = data?.spinsEarned || 0;
  const referrals = data?.referrals || [];

  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const filteredReferrals = useMemo(() => {
    if (!searchQuery.trim()) return referrals;
    const query = searchQuery.toLowerCase().trim();
    return referrals.filter((ref: any) => {
      const nameMatch = ref.name?.toLowerCase().includes(query);
      const phoneMatch = ref.maskedPhone?.toLowerCase().includes(query);
      return nameMatch || phoneMatch;
    });
  }, [referrals, searchQuery]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-10 h-10 border-4 border-[#1459E8]/30 border-t-[#FFD45A] rounded-full animate-spin" />
        <p className="text-xs text-slate-400">Loading your invited clients...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* 1. Header & Spin Unlock Condition Card */}
      <div className="royal-card p-5 sm:p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#22D3EE]" />
              <span>Invited Clients</span>
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Track your invited clients' level progress and spin availability.
            </p>
          </div>

          {/* Official Invitation Policy Badge */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/30 text-xs text-[#FFD45A] font-semibold rounded-xl">
              <ShieldCheck className="w-4 h-4 text-[#FFD45A]" />
              <span>Admin Referral Code System</span>
            </span>
          </div>
        </div>

        {/* Notice Strip */}
        <div className="p-3.5 bg-gradient-to-r from-blue-900/40 via-[#0B2248] to-[#04132F] border border-[#2478FF]/30 rounded-xl text-xs text-slate-300 space-y-1">
          <div className="flex items-center gap-2 text-white font-bold text-xs">
            <Ticket className="w-4 h-4 text-[#FFD45A]" />
            <span>Exclusive Admin Referral Invitation Only</span>
          </div>
          <p className="text-[11.5px] leading-relaxed text-slate-300">
            Personal member invitation links are disabled. New member registrations strictly require an official invitation code provided directly by administration.
          </p>
        </div>

        {/* Spin Condition Status Strip */}
        <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Disc className="w-4 h-4 text-[#FFD45A] flex-shrink-0 animate-spin-slow" />
            <span>
              <strong>Next Spin Condition:</strong> You get <strong>1 Free Spin</strong> whenever an invited client completes <strong>Level 1</strong>.
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs flex-shrink-0">
            <span className="text-slate-400">
              Total Clients: <strong className="text-white">{totalReferrals}</strong>
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-emerald-400 font-semibold">
              Spins Earned: {spinsEarned} 🎰
            </span>
          </div>
        </div>
      </div>

      {/* 2. Client List */}
      <div className="royal-card p-5 sm:p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white">Clients & Level Progress</h2>
            <span className="text-xs bg-[#061633] text-slate-400 px-2 py-0.5 rounded-full border border-[#173C73]">
              {filteredReferrals.length}
            </span>
          </div>

          {/* Search bar */}
          {referrals.length > 0 && (
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search client by name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#020B20] border border-[#173C73] focus:border-[#22D3EE] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        {filteredReferrals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Client</th>
                  <th className="py-2.5 px-3">Registered</th>
                  <th className="py-2.5 px-3">Current Level</th>
                  <th className="py-2.5 px-3 text-right">Spin Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredReferrals.map((client: any) => (
                  <tr key={client.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-white">{client.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{client.maskedPhone}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(client.registeredAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-[#1459E8]/15 border border-[#1459E8]/40 text-[#22D3EE]">
                        <span>{client.currentLevelTitle || `Level ${client.currentLevelNumber || 1}`}</span>
                        {client.tasksInCurrentLevel !== undefined && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({client.tasksInCurrentLevel}/{client.requiredTasksInCurrentLevel || 10} Tasks)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      {client.spinAwarded ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Spin Unlocked 🎰</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/15 border border-amber-500/30 text-[#FFD45A]">
                          <Clock className="w-3 h-3" />
                          <span>Pending Level 1</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <Users className="w-8 h-8 text-slate-500 mx-auto opacity-50" />
            <p>
              {searchQuery
                ? 'No clients found matching your search.'
                : 'No clients registered with your invite link yet.'}
            </p>
          </div>
        )}
      </div>

      {/* 3. Bottom Page Section with Terms & Conditions Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 pb-6 text-xs text-slate-400">
        <p className="text-slate-400 text-xs">
          Earn Street Referral Program & Community Guidelines
        </p>

        <button
          onClick={() => setShowTermsModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFD45A]/15 hover:bg-[#FFD45A]/25 border border-[#FFD45A]/40 text-xs font-bold text-[#FFD45A] rounded-lg transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95"
          title="View Referral & Spin Terms & Conditions"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Terms & Conditions</span>
        </button>
      </div>

      {/* ========================================================
          TERMS & CONDITIONS POPUP MODAL (Clean Written Document View)
          ======================================================== */}
      {showTermsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setShowTermsModal(false)}
        >
          <div
            className="bg-[#071B3A] border border-[#1C3E75] rounded-3xl max-w-lg w-full max-h-[88vh] overflow-y-auto shadow-2xl p-6 sm:p-7 space-y-5 text-white relative animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  Terms & Conditions
                </h3>
                <p className="text-xs text-[#8194B7] mt-0.5">
                  Referral Program & Lucky Spin Official Policy
                </p>
              </div>

              <button
                onClick={() => setShowTermsModal(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Clean Written Document View (Zero Useless Boxes) */}
            <div className="space-y-4 text-xs sm:text-[13px] text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <h4 className="font-bold text-[#FFD45A] text-sm mb-1">
                  1. Level Completion Spin (Har Level Par Spin)
                </h4>
                <p className="text-slate-300">
                  Har level complete karne par client ko automatically 1 Free Lucky Spin milta hai. Level 1 se lekar Level 10 tak har level ke tamam 10 tasks mukammal karne par ye reward diya jata hai.
                </p>
                <p className="text-[11px] text-[#8194B7] mt-0.5 italic">
                  Every user earns 1 Free Spin automatically upon completing all tasks in each level.
                </p>
              </div>

              <div className="border-t border-white/5 pt-3">
                <h4 className="font-bold text-[#22D3EE] text-sm mb-1">
                  2. Extra Spin Requirement (24 Hours Mein 3 Friends)
                </h4>
                <p className="text-slate-300">
                  Aur azafi spin hasil karne ke liye 24 hours mein ek dafa aapko kam az kam 3 friends invite karne honge jis se client ko azafi ek spin milega 24 hours mein.
                </p>
                <p className="text-[11px] text-[#8194B7] mt-0.5 italic">
                  To earn an extra spin via invitations, you must invite a minimum of 3 friends within 24 hours. Upon successful registration of 3 friends, you receive 1 additional spin.
                </p>
              </div>

              <div className="border-t border-white/5 pt-3">
                <h4 className="font-bold text-[#F59E0B] text-sm mb-1">
                  3. 24-Hour Invite Lock Policy (Invite Friend Lock)
                </h4>
                <p className="text-slate-300">
                  Iske ilawa invite friend lock rahega. Extra referral spin sirf 24 hours mein ek martaba hasil kiya ja sakta hai. Baqi waqt invite friend extra spin feature locked rahega jab tak agla 24-hour quota mukammal na ho.
                </p>
                <p className="text-[11px] text-[#8194B7] mt-0.5 italic">
                  Outside of qualifying 3 friends in the active 24-hour window, the referral bonus spin remains locked.
                </p>
              </div>

              <div className="border-t border-white/5 pt-3">
                <h4 className="font-bold text-[#10D6A0] text-sm mb-1">
                  4. Client Qualification & Level 1 Progress
                </h4>
                <p className="text-slate-300">
                  Invited doston ka unique aur genuine hona lazmi hai. Unka Level 1 progress aur account activity system ke automated ledger mein verify hoti hai.
                </p>
                <p className="text-[11px] text-[#8194B7] mt-0.5 italic">
                  Invited friends must be genuine active accounts and complete Level 1 tasks for standard partner tracking.
                </p>
              </div>

              <div className="border-t border-white/5 pt-3">
                <h4 className="font-bold text-[#EF4444] text-sm mb-1">
                  5. Anti-Fraud & Fair Play (Sakht Pabandi)
                </h4>
                <p className="text-slate-300">
                  Ek hi mobile/device ya ek hi IP/WiFi address se multiple accounts banana, clone apps, ya VPN ka istemal karna sakht mana hai. Aisa karne par user ka account fori tor par permanently suspend kar diya jayega.
                </p>
                <p className="text-[11px] text-[#8194B7] mt-0.5 italic">
                  Self-referrals, clone apps, and multi-accounting on the same IP or device will result in immediate disqualification and permanent account ban.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-white/10">
              <button
                onClick={() => setShowTermsModal(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#1264F5] to-[#2563EB] hover:from-[#1D4ED8] hover:to-[#1264F5] text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                I Understand & Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
