import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Copy,
  CheckCircle2,
  Disc,
  Search,
  Share2,
  Clock,
} from 'lucide-react';
import { api } from '../../api/client';

export const ReferralsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
              {copiedCode ? <CheckCircle2 className="w-3.5 h-3.5 text-[#10D6A0]" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
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
    </div>
  );
};
