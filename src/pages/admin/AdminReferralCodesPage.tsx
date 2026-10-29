import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Copy,
  Check,
  Search,
  Plus,
  RefreshCw,
  CheckCircle2,
  Users,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { api } from '../../api/client';

export const AdminReferralCodesPage: React.FC = () => {
  const [data, setData] = useState<{
    availableCodes: any[];
    usedCodes: any[];
    stats: { total: number; available: number; used: number };
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'used'>('available');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [quickCopied, setQuickCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [customCode, setCustomCode] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadCodes = (silent = false) => {
    if (!silent) setLoading(true);
    api
      .getAdminReferralCodes()
      .then((res: any) => {
        setData(res);
      })
      .catch((err) => {
        console.error('Failed to load referral codes:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadCodes();
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleQuickCopyNext = () => {
    if (!data?.availableCodes || data.availableCodes.length === 0) return;
    const nextCode = data.availableCodes[0].code;
    navigator.clipboard.writeText(nextCode);
    setQuickCopied(true);
    setActionNotice(`Copied available code "${nextCode}" to clipboard!`);
    setTimeout(() => {
      setQuickCopied(false);
      setActionNotice(null);
    }, 3500);
  };

  const handleGenerateMore = async (count = 10) => {
    setGenerating(true);
    try {
      const res: any = await api.generateAdminReferralCodes({ count });
      setData(res);
      setActionNotice(`Successfully generated ${count} additional exclusive invitation codes!`);
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to generate codes');
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCode.trim()) return;

    try {
      const res: any = await api.createAdminReferralCode({ code: customCode.trim() });
      setData(res);
      setCustomCode('');
      setShowCustomModal(false);
      setActionNotice(`Custom code created successfully!`);
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to create code');
    }
  };

  const availableList = (data?.availableCodes || []).filter((item: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return item.code.toLowerCase().includes(q) || (item.notes && item.notes.toLowerCase().includes(q));
  });

  const usedList = (data?.usedCodes || []).filter((item: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const codeMatch = item.code.toLowerCase().includes(q);
    const nameMatch = item.usedByName && item.usedByName.toLowerCase().includes(q);
    const phoneMatch = item.usedByPhone && item.usedByPhone.toLowerCase().includes(q);
    return codeMatch || nameMatch || phoneMatch;
  });

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-10 h-10 border-4 border-[#2563EB]/20 border-t-[#2563EB] rounded-full animate-spin" />
        <p className="text-xs text-[#6B7280]">Loading official invitation codes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#111827] flex items-center gap-2.5">
            <Ticket className="w-6 h-6 text-[#2563EB]" />
            <span>100 Official Invitation Codes</span>
          </h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Client self-invites are disabled. Invitation codes are provided exclusively by admin.
            Every code is strictly single-use; once used by a client, it is permanently moved from Available Codes to Used Codes.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => loadCodes(false)}
            className="p-2 border border-[#D9E4F2] hover:bg-white text-[#4B5563] rounded-lg transition-colors cursor-pointer"
            title="Refresh Codes"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleQuickCopyNext}
            disabled={!data?.availableCodes?.length}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-lg text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            {quickCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>Copy Next Available Code</span>
          </button>
          <button
            onClick={() => handleGenerateMore(10)}
            disabled={generating}
            className="px-3.5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-lg text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>{generating ? 'Generating...' : '+10 Codes'}</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="admin-card p-4 sm:p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#111827]">{data?.stats?.total || 0}</div>
            <div className="text-xs text-[#6B7280]">Total Code Pool</div>
          </div>
        </div>

        <div className="admin-card p-4 sm:p-5 flex items-center gap-4 border-l-4 border-l-emerald-500">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-700">{data?.stats?.available || 0}</div>
            <div className="text-xs text-[#6B7280]">Available for New Users</div>
          </div>
        </div>

        <div className="admin-card p-4 sm:p-5 flex items-center gap-4 border-l-4 border-l-slate-400">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{data?.stats?.used || 0}</div>
            <div className="text-xs text-[#6B7280]">Redeemed & Registered</div>
          </div>
        </div>
      </div>

      {/* Tabs & Search Controls */}
      <div className="admin-card p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D9E4F2] pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('available')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'available'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-[#4B5563] hover:bg-[#F3F4F6]'
              }`}
            >
              <span>Available Codes</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeTab === 'available' ? 'bg-white/20 text-white' : 'bg-[#E5E7EB] text-[#4B5563]'
                }`}
              >
                {data?.stats?.available || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('used')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'used'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-[#4B5563] hover:bg-[#F3F4F6]'
              }`}
            >
              <span>Used Codes</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeTab === 'used' ? 'bg-white/20 text-white' : 'bg-[#E5E7EB] text-[#4B5563]'
                }`}
              >
                {data?.stats?.used || 0}
              </span>
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={activeTab === 'available' ? 'Search available codes...' : 'Search code, name or phone...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg text-xs text-[#111827] focus:outline-none"
            />
          </div>
        </div>

        {/* Tab 1: Available Codes */}
        {activeTab === 'available' && (
          <div className="space-y-4">
            {availableList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {availableList.map((item: any) => {
                  const isCopied = copiedCode === item.code;
                  return (
                    <div
                      key={item.id}
                      className="p-3.5 bg-[#F8FAFD] border border-[#D9E4F2] hover:border-[#2563EB]/40 rounded-xl flex items-center justify-between transition-all group"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <strong className="font-mono text-sm text-[#111827] tracking-wider">
                            {item.code}
                          </strong>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#6B7280]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="text-emerald-700 font-semibold uppercase">Available</span>
                          <span>•</span>
                          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCopy(item.code)}
                        className={`p-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                          isCopied
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white border border-[#D9E4F2] text-[#4B5563] hover:text-[#2563EB] hover:border-[#2563EB]'
                        }`}
                        title="Copy Code"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="text-[11px]">{isCopied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-[#6B7280] space-y-3">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="text-xs font-medium">
                  {searchQuery ? 'No available referral codes matched your search query.' : 'All referral codes have been used!'}
                </p>
                <button
                  onClick={() => handleGenerateMore(10)}
                  className="px-4 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-lg cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Generate +10 New Codes</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Used Codes */}
        {activeTab === 'used' && (
          <div className="overflow-x-auto">
            {usedList.length > 0 ? (
              <table className="admin-table w-full text-xs">
                <thead>
                  <tr>
                    <th>Referral Code</th>
                    <th>Status</th>
                    <th>Redeemed By Member</th>
                    <th>Phone Number</th>
                    <th>Date &amp; Time Redeemed</th>
                  </tr>
                </thead>
                <tbody>
                  {usedList.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td>
                        <strong className="font-mono text-xs text-[#111827] bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                          {item.code}
                        </strong>
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          <Users className="w-3 h-3 text-slate-500" />
                          <span>USED</span>
                        </span>
                      </td>
                      <td>
                        <strong className="text-[#111827]">{item.usedByName || 'Registered User'}</strong>
                        {item.usedById && (
                          <span className="block text-[10px] text-[#9CA3AF] font-mono">
                            ID: {item.usedById}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="font-mono text-[#374151]">{item.usedByPhone || '—'}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1 text-[#4B5563]">
                          <Clock className="w-3.5 h-3.5 text-[#9CA3AF]" />
                          <span>
                            {item.usedAt ? new Date(item.usedAt).toLocaleString() : new Date(item.updatedAt).toLocaleString()}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 text-[#6B7280] space-y-2">
                <Users className="w-8 h-8 text-[#9CA3AF] mx-auto" />
                <p className="text-xs font-medium">
                  {searchQuery ? 'No used codes match your search query.' : 'No referral codes have been used yet. Newly registered members will appear here.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
