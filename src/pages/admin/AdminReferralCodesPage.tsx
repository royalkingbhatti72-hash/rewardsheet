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
  AlertCircle,
  Clock,
  Send,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { api } from '../../api/client';

export const AdminReferralCodesPage: React.FC = () => {
  const [data, setData] = useState<{
    availableCodes: any[];
    usedCodes: any[];
    stats: { total: number; available: number; used: number };
  } | null>(null);

  const [telegramUsers, setTelegramUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTg, setLoadingTg] = useState(false);
  const [activeTab, setActiveTab] = useState<'available' | 'used' | 'telegram'>('available');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [quickCopied, setQuickCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [grantingChatId, setGrantingChatId] = useState<string | null>(null);
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

  const loadTelegramUsers = (silent = false) => {
    if (!silent) setLoadingTg(true);
    api
      .getAdminTelegramUsers()
      .then((res: any) => {
        setTelegramUsers(res.users || []);
      })
      .catch((err) => {
        console.error('Failed to load telegram users:', err);
      })
      .finally(() => {
        setLoadingTg(false);
      });
  };

  useEffect(() => {
    loadCodes();
    loadTelegramUsers(true);
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
    setActionNotice(`Copied available 6-letter code "${nextCode}" to clipboard!`);
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
      setActionNotice(`Successfully generated ${count} additional 6-letter referral codes!`);
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to generate codes');
    } finally {
      setGenerating(false);
    }
  };

  const handleGrantCodes = async (chatId: string, amount: number) => {
    setGrantingChatId(chatId);
    try {
      const res: any = await api.grantTelegramUserCodes(chatId, amount);
      if (res.user) {
        setTelegramUsers((prev) =>
          prev.map((u) => (String(u.chatId) === String(chatId) ? res.user : u))
        );
      }
      setActionNotice(
        `Granted +${amount} referral codes to Telegram client (Chat ID: ${chatId})! Client has been notified via bot.`
      );
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to grant codes');
    } finally {
      setGrantingChatId(null);
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

  const tgList = telegramUsers.filter((u: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (u.firstName && u.firstName.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      String(u.chatId).includes(q)
    );
  });

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <RefreshCw className="w-8 h-8 text-[#2563EB] animate-spin" />
        <p className="text-xs text-[#6B7280]">Loading official referral code pool...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#111827]">
            Official Admin Referral Codes &amp; Telegram Bot
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Admin-only single-use 6-letter referral codes. Automatically replenished to maintain 100 codes. Clients generate codes via Telegram Bot.
          </p>
        </div>

        <div className="flex items-center gap-2">
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
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
            <div className="text-xs text-[#6B7280]">Available 6-Letter Codes (Auto-100)</div>
          </div>
        </div>

        <div className="admin-card p-4 sm:p-5 flex items-center gap-4 border-l-4 border-l-slate-400">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{data?.stats?.used || 0}</div>
            <div className="text-xs text-[#6B7280]">Used &amp; Redeemed Codes</div>
          </div>
        </div>

        <div className="admin-card p-4 sm:p-5 flex items-center gap-4 border-l-4 border-l-sky-500">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-sky-700">{telegramUsers.length}</div>
            <div className="text-xs text-[#6B7280]">Telegram Bot Clients</div>
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

            <button
              onClick={() => {
                setActiveTab('telegram');
                loadTelegramUsers();
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'telegram'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-[#4B5563] hover:bg-[#F3F4F6]'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Telegram Clients &amp; Quota</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeTab === 'telegram' ? 'bg-white/20 text-white' : 'bg-[#E5E7EB] text-[#4B5563]'
                }`}
              >
                {telegramUsers.length}
              </span>
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={
                activeTab === 'available'
                  ? 'Search available 6-letter codes...'
                  : activeTab === 'used'
                  ? 'Search code, name or phone...'
                  : 'Search telegram client name, @username, or chat ID...'
              }
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
                          <strong className="font-mono text-base text-[#111827] tracking-widest">
                            {item.code}
                          </strong>
                          <span className="text-[10px] font-mono text-[#6B7280] bg-white px-1.5 py-0.5 rounded border border-[#E2E8F0]">
                            {String(item.code).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#6B7280]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="text-emerald-700 font-semibold uppercase">Single-Use</span>
                          <span>•</span>
                          <span>Case-Insensitive</span>
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
                        <strong className="font-mono text-xs text-[#111827] bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 tracking-wider">
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

        {/* Tab 3: Telegram Bot Clients & Quota Management */}
        {activeTab === 'telegram' && (
          <div className="space-y-4">
            <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-bold flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-sky-600" /> Telegram Invitation Bot Management
                </span>
                <p className="text-[11px] text-sky-800">
                  Clients register by entering the access password (<code>9989GHYRT89</code>) in the Telegram bot. Each registered client gets an initial quota of <strong>10 codes</strong>. You can grant more codes below at any time.
                </p>
              </div>
              <button
                onClick={() => loadTelegramUsers()}
                className="px-3 py-1.5 bg-white border border-sky-300 hover:bg-sky-100 text-sky-700 font-bold rounded-lg text-xs flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingTg ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              {tgList.length > 0 ? (
                <table className="admin-table w-full text-xs">
                  <thead>
                    <tr>
                      <th>Client Name</th>
                      <th>Telegram Chat ID</th>
                      <th>Codes Generated</th>
                      <th>Remaining Quota</th>
                      <th>Registered On</th>
                      <th className="text-right">Grant More Codes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tgList.map((client: any) => {
                      const isGranting = grantingChatId === String(client.chatId);
                      const isExhausted = client.remainingQuota <= 0;
                      return (
                        <tr key={client.id} className="hover:bg-slate-50/70">
                          <td>
                            <div className="font-bold text-[#111827]">
                              {client.firstName || 'Client'}
                            </div>
                            {client.username && (
                              <div className="text-[10px] text-sky-600 font-mono">
                                @{client.username}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="font-mono text-xs text-[#374151] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {client.chatId}
                            </span>
                          </td>
                          <td>
                            <span className="font-bold text-[#111827]">
                              {client.codesGenerated || 0}
                            </span>
                            <span className="text-[10px] text-[#6B7280]"> / {client.totalQuota || 10}</span>
                          </td>
                          <td>
                            {isExhausted ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <AlertCircle className="w-3 h-3 text-amber-600" />
                                <span>0 Left (Quota Full)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>{client.remainingQuota} Codes Left</span>
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="flex items-center gap-1 text-[#4B5563]">
                              <Clock className="w-3.5 h-3.5 text-[#9CA3AF]" />
                              <span>{new Date(client.createdAt).toLocaleString()}</span>
                            </div>
                          </td>
                          <td className="text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                disabled={isGranting}
                                onClick={() => handleGrantCodes(client.chatId, 10)}
                                className="px-2.5 py-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[11px] font-bold rounded shadow-sm disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1"
                                title="Add 10 more codes"
                              >
                                {isGranting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                <span>+10 Codes</span>
                              </button>
                              <button
                                disabled={isGranting}
                                onClick={() => handleGrantCodes(client.chatId, 20)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-[#111827] text-[11px] font-bold rounded border border-slate-300 disabled:opacity-50 transition-all cursor-pointer"
                                title="Add 20 more codes"
                              >
                                +20
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12 text-[#6B7280] space-y-2">
                  <Send className="w-8 h-8 text-sky-400 mx-auto" />
                  <p className="text-xs font-medium">
                    No clients have started the Telegram Bot yet.
                  </p>
                  <p className="text-[11px] text-[#9CA3AF]">
                    When your clients start the bot and send <code>9989GHYRT89</code>, they will appear here with an initial 10-code quota.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
