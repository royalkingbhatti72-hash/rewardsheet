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
  Gift,
  Lock,
  Award,
  ShieldAlert,
  Sparkles,
  Check,
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

          {/* Quick Copy Link, Code & Terms Action */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowTermsModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFD45A]/15 hover:bg-[#FFD45A]/25 border border-[#FFD45A]/40 text-xs font-bold text-[#FFD45A] rounded-lg transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95"
              title="View Referral & Spin Terms & Conditions"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Terms & Conditions</span>
            </button>

            <button
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#061633] border border-[#173C73] hover:border-[#22D3EE]/50 text-xs text-white rounded-lg transition-all cursor-pointer"
              title="Copy Referral Code"
            >
              <span className="text-slate-400">Code:</span>
              <strong className="font-mono text-[#FFD45A]">{referralCode}</strong>
              {copiedCode ? <Check className="w-3.5 h-3.5 text-[#10D6A0]" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1459E8] hover:bg-[#2478FF] active:scale-95 text-xs font-semibold text-white rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedLink ? 'Copied Link!' : 'Copy Invite Link'}</span>
            </button>
          </div>
        </div>

        {/* Spin Condition Status Strip */}
        <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300 flex-wrap">
            <Disc className="w-4 h-4 text-[#FFD45A] flex-shrink-0 animate-spin-slow" />
            <span>
              <strong>Spin Program:</strong> 1 Free Spin on Level Completion + Extra Spin every 24h by inviting 3 friends.
            </span>
            <button
              onClick={() => setShowTermsModal(true)}
              className="text-[#22D3EE] hover:underline font-bold cursor-pointer inline-flex items-center gap-0.5 ml-1"
            >
              <span>View Terms</span>
              <FileText className="w-3 h-3" />
            </button>
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

      {/* ========================================================
          TERMS & CONDITIONS POPUP MODAL (Visible on Popup Only)
          ======================================================== */}
      {showTermsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setShowTermsModal(false)}
        >
          <div
            className="bg-gradient-to-b from-[#0B2248] via-[#071B3A] to-[#04132F] border border-[#1C3E75] rounded-3xl max-w-lg w-full max-h-[88vh] overflow-y-auto shadow-2xl p-5 sm:p-7 space-y-5 text-white relative animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#FFD45A] to-[#F59E0B] p-0.5 shadow-md flex items-center justify-center flex-shrink-0">
                  <div className="w-full h-full bg-[#020B20] rounded-[14px] flex items-center justify-center text-[#FFD45A]">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Terms & Conditions
                  </h3>
                  <p className="text-xs text-[#8194B7]">
                    Referral Program & Lucky Spin Official Rules
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowTermsModal(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Rules & Conditions */}
            <div className="space-y-3.5 text-xs">
              {/* Section 1: Level Completion Spin */}
              <div className="p-3.5 rounded-2xl bg-[#061633] border border-[#173C73]/60 space-y-1.5">
                <div className="flex items-center gap-2 text-[#FFD45A] font-bold text-xs">
                  <Award className="w-4 h-4 text-[#FFD45A] flex-shrink-0" />
                  <span>1. Level Completion Spin (Har Level Par Spin)</span>
                </div>
                <p className="text-[#B7C6E4] leading-relaxed">
                  Har level complete karne par client ko automatically <strong>1 Free Spin</strong> milega. Level 1 se lekar Level 10 tak har level ke tamam tasks mukammal karne par ye reward unlock hota hai.
                </p>
                <p className="text-[11px] text-[#8194B7] italic">
                  Every user earns 1 Free Spin automatically upon completing all tasks in each level.
                </p>
              </div>

              {/* Section 2: 24h 3 Friends Rule */}
              <div className="p-3.5 rounded-2xl bg-[#061633] border border-[#173C73]/60 space-y-1.5">
                <div className="flex items-center gap-2 text-[#22D3EE] font-bold text-xs">
                  <Gift className="w-4 h-4 text-[#22D3EE] flex-shrink-0" />
                  <span>2. Extra Spin Rule (24 Hours Mein 3 Friends)</span>
                </div>
                <p className="text-[#B7C6E4] leading-relaxed">
                  Aur azafi spin hasil karne ke liye <strong>24 hours mein ek dafa aapko 3 friends invite karne honge</strong> jis se client ko azafi ek spin milega 24 hours mein.
                </p>
                <p className="text-[11px] text-[#8194B7] italic">
                  To earn an extra spin via invitations, you must invite a minimum of 3 friends within 24 hours. Upon successful registration, you receive 1 additional spin.
                </p>
              </div>

              {/* Section 3: 24h Lock Policy */}
              <div className="p-3.5 rounded-2xl bg-[#061633] border border-[#173C73]/60 space-y-1.5">
                <div className="flex items-center gap-2 text-[#F59E0B] font-bold text-xs">
                  <Lock className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
                  <span>3. 24-Hour Invite Lock Policy (Invite Friend Lock)</span>
                </div>
                <p className="text-[#B7C6E4] leading-relaxed">
                  <strong>Iske ilawa invite friend lock rahega.</strong> Extra referral spin sirf 24 hours mein ek martaba hasil kiya ja sakta hai. Baqi waqt invite friend extra spin feature locked rahega jab tak naya 24-hour quota mukammal na ho.
                </p>
                <p className="text-[11px] text-[#8194B7] italic">
                  Outside of qualifying 3 friends in the active 24-hour window, the referral bonus spin remains locked.
                </p>
              </div>

              {/* Section 4: Genuine Active Accounts */}
              <div className="p-3.5 rounded-2xl bg-[#061633] border border-[#173C73]/60 space-y-1.5">
                <div className="flex items-center gap-2 text-[#10D6A0] font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-[#10D6A0] flex-shrink-0" />
                  <span>4. Client Qualification & Level 1 Progress</span>
                </div>
                <p className="text-[#B7C6E4] leading-relaxed">
                  Invited doston ka unique aur real hona lazmi hai. Unka Level 1 progress aur account activity system ke automated ledger mein verify hoti hai.
                </p>
                <p className="text-[11px] text-[#8194B7] italic">
                  Invited friends must be genuine active accounts and complete Level 1 tasks for standard partner tracking.
                </p>
              </div>

              {/* Section 5: Strict Anti-Fraud Policy */}
              <div className="p-3.5 rounded-2xl bg-[#061633] border border-[#EF4444]/40 space-y-1.5">
                <div className="flex items-center gap-2 text-[#EF4444] font-bold text-xs">
                  <ShieldAlert className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
                  <span>5. Anti-Fraud & Fair Play (Sakht Pabandi)</span>
                </div>
                <p className="text-[#B7C6E4] leading-relaxed">
                  Ek hi mobile/device ya ek hi IP/WiFi address se multiple accounts banana, clone apps, ya VPN ka istemal karna sakht mana hai. Aisa karne par user ka account fori tor par permanently suspend kar diya jayega.
                </p>
                <p className="text-[11px] text-[#8194B7] italic">
                  Self-referrals, clone apps, and multi-accounting on the same IP or device will result in immediate disqualification and permanent account ban.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-white/10">
              <button
                onClick={() => setShowTermsModal(false)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#FFD45A] to-[#F59E0B] hover:from-[#F59E0B] hover:to-[#FFD45A] text-[#020B20] text-xs font-black shadow-lg shadow-[#FFD45A]/20 transition-all active:scale-95 cursor-pointer"
              >
                I Understand & Accept (Theek Hai)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
