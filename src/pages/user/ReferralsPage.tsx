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

          {/* Quick Copy Link & Code */}
          <div className="flex items-center gap-2 flex-wrap">
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

      {/* 3. Bottom of Page: Terms & Conditions Button */}
      <div className="flex justify-center sm:justify-end pt-1 pb-6">
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
          TERMS & CONDITIONS POPUP MODAL (Clean Written View)
          ======================================================== */}
      {showTermsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setShowTermsModal(false)}
        >
          <div
            className="bg-gradient-to-b from-[#0B2248] via-[#071B3A] to-[#04132F] border border-[#1C3E75] rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl p-6 sm:p-7 text-white relative animate-scale-up space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  Terms & Conditions
                </h3>
                <p className="text-xs text-[#8194B7] mt-0.5">
                  Referral Program & Lucky Spin Rules
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

            {/* Written Document View (Clean typography, no nested boxes) */}
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div>
                <h4 className="font-bold text-white text-[13px] mb-1 text-[#FFD45A]">
                  1. Level Completion Spin
                </h4>
                <p className="text-[#C5D5F0]">
                  Har level complete karne par spin milega. Level 1 se lekar Level 10 tak har level ke tamam tasks mukammal karne par client ko automatically 1 Free Spin milta hai.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white text-[13px] mb-1 text-[#22D3EE]">
                  2. Extra Spin Requirement (24 Hours)
                </h4>
                <p className="text-[#C5D5F0]">
                  Aur azafi spin hasil karne ke liye 24 hours mein ek dafa aapko 3 friends invite karne honge jis se client ko azafi ek spin milega 24 hours mein.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white text-[13px] mb-1 text-[#F59E0B]">
                  3. 24-Hour Invite Lock Policy
                </h4>
                <p className="text-[#C5D5F0]">
                  Iske ilawa invite friend lock rahega. Extra referral spin sirf 24 hours mein ek dafa hasil kiya ja sakta hai. Baqi waqt invite friend feature lock rahega jab tak agla 24-hour cycle na aye.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white text-[13px] mb-1 text-[#10D6A0]">
                  4. Client Qualification & Level Progress
                </h4>
                <p className="text-[#C5D5F0]">
                  Invited clients ka unique aur real hona lazmi hai. Unka Level 1 progress aur account activity system ke automated ledger mein verify hoti hai.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white text-[13px] mb-1 text-[#EF4444]">
                  5. Anti-Fraud & Fair Play Policy
                </h4>
                <p className="text-[#C5D5F0]">
                  Ek hi mobile/device ya ek hi IP/WiFi address se multiple fake accounts banana, clone apps, ya VPN ka istemal karna sakht mana hai. Aisa karne par user ka account fori tor par permanently suspend kar diya jayega.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setShowTermsModal(false)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FFD45A] to-[#F59E0B] hover:from-[#F59E0B] hover:to-[#FFD45A] text-[#020B20] text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
