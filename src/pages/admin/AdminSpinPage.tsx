import React, { useState, useEffect, useRef } from 'react';
import {
  Disc,
  Gift,
  Crown,
  UserCheck,
  Plus,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  Users,
} from 'lucide-react';
import { api } from '../../api/client';

export const AdminSpinPage: React.FC = () => {
  const [spinData, setSpinData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);

  // Search states for both user management options
  const [milestoneSearch, setMilestoneSearch] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const memberSelectRef = useRef<HTMLDivElement>(null);

  // Assign Modal
  const [selectedUserId, setSelectedUserId] = useState('');
  const [assignedPrizeId, setAssignedPrizeId] = useState('');
  const [totalSpins, setTotalSpins] = useState('1');
  const [assigning, setAssigning] = useState(false);
  const [milestonePrizes, setMilestonePrizes] = useState<Record<string, string>>({});
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = (silent = false) => {
    if (!silent && !spinData) setLoading(true);
    Promise.all([api.getAdminSpin(), api.getAdminUsers({ limit: 100 })])
      .then(([spinRes, usersRes]) => {
        setSpinData(spinRes);
        const userList = usersRes.users || [];
        setUsers(userList);
        if (userList.length > 0 && !selectedUserId) {
          setSelectedUserId(userList[0].id);
          setMemberSearchQuery(`${userList[0].name} (${userList[0].phone})`);
        }
        if (spinRes.prizes?.length > 0 && !assignedPrizeId) {
          setAssignedPrizeId(spinRes.prizes[0].id);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle click outside to close member search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (memberSelectRef.current && !memberSelectRef.current.contains(event.target as Node)) {
        setIsMemberDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced user search query to fetch users dynamically from backend if not already loaded
  useEffect(() => {
    if (!memberSearchQuery || memberSearchQuery.trim().length < 2) return;
    const timer = setTimeout(() => {
      api.getAdminUsers({ search: memberSearchQuery.trim(), limit: 50 })
        .then((res) => {
          if (res.users && res.users.length > 0) {
            setUsers((prev) => {
              const existingIds = new Set(prev.map((u) => u.id));
              const newUsers = res.users.filter((u: any) => !existingIds.has(u.id));
              return [...prev, ...newUsers];
            });
          }
        })
        .catch((err) => console.error(err));
    }, 300);
    return () => clearTimeout(timer);
  }, [memberSearchQuery]);

  const handleAssignPrize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setMessage({ type: 'error', text: 'Select a user' });
      return;
    }
    setAssigning(true);
    setMessage(null);

    try {
      const res = await api.assignSpinPrize({
        userId: selectedUserId,
        assignedPrizeId: assignedPrizeId || undefined,
        totalSpins: parseInt(totalSpins, 10) || 1,
      });
      setMessage({ type: 'success', text: res.message });
      loadData(true);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Assignment failed' });
    } finally {
      setAssigning(false);
    }
  };

  const handleAssignMilestone = async (entitlementId: string) => {
    const prizeId = milestonePrizes[entitlementId] || prizes[0]?.id;
    if (!prizeId) return;
    setActionLoadingId(entitlementId);
    try {
      const res = await api.assignMilestoneSpinPrize(entitlementId, { assignedPrizeId: prizeId });
      setMessage({ type: 'success', text: res.message });
      // Update only this milestone locally in memory without full-page re-render
      setSpinData((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          pendingMilestones: (prev.pendingMilestones || []).filter((m: any) => m.id !== entitlementId),
        };
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to assign prize' });
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading && !spinData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-[#2563EB]/20 border-t-[#2563EB] rounded-full animate-spin" />
      </div>
    );
  }

  const { prizes = [], pendingMilestones = [], history = [] } = spinData || {};

  // Filter 1: Milestone Spins awaiting decision
  const filteredMilestones = pendingMilestones.filter((m: any) => {
    if (!milestoneSearch.trim()) return true;
    const q = milestoneSearch.toLowerCase();
    const name = m.user?.name?.toLowerCase() || '';
    const phone = m.user?.phone?.toLowerCase() || '';
    const email = m.user?.email?.toLowerCase() || '';
    const reason = (m.triggerReason || `Level ${m.levelNumber} Task ${m.taskNumber}`).toLowerCase();
    return name.includes(q) || phone.includes(q) || email.includes(q) || reason.includes(q);
  });

  // Filter 2: Manual Spin Grant member search
  const filteredMembers = users.filter((u) => {
    if (!memberSearchQuery.trim()) return true;
    const q = memberSearchQuery.toLowerCase();
    const name = u.name?.toLowerCase() || '';
    const phone = u.phone?.toLowerCase() || '';
    const email = u.email?.toLowerCase() || '';
    return name.includes(q) || phone.includes(q) || email.includes(q);
  });

  const selectedUser = users.find((u) => u.id === selectedUserId);

  // Filter 3: Recent executed spin history
  const filteredHistory = history.filter((h: any) => {
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase();
    const name = h.user?.name?.toLowerCase() || '';
    const phone = h.user?.phone?.toLowerCase() || '';
    const prize = (h.resultLabel || '').toLowerCase();
    return name.includes(q) || phone.includes(q) || prize.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#111827]">Spin Wheel & Prize Management</h1>
        <p className="text-xs text-[#6B7280] mt-0.5">
          Assign specific prizes and spin counts to individual members. Wheel results are strictly validated on the backend.
        </p>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================
          OPTION 1: TASK 3 & 7 MILESTONE SPINS AWAITING ADMIN REVIEW
          Search user by name, phone, or milestone reason.
          ======================================================== */}
      <div className="admin-card p-6 space-y-4 border-2 border-[#2563EB]/40 bg-gradient-to-r from-blue-50/40 via-white to-amber-50/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
              <Crown className="w-4 h-4 text-[#2563EB]" /> Task 3 & 7 Milestone Spins (Awaiting Prize Decision)
            </h2>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Clients who completed the 3rd or 7th task of a level. Select what prize (Cash PKR or Physical Product) they will win upon spinning.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Live Search Option for Milestone Users */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search user name or phone..."
                value={milestoneSearch}
                onChange={(e) => setMilestoneSearch(e.target.value)}
                className="w-full bg-white border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg pl-8 pr-7 py-1.5 text-xs text-[#111827] focus:outline-none placeholder:text-[#9CA3AF] shadow-xs"
              />
              {milestoneSearch && (
                <button
                  type="button"
                  onClick={() => setMilestoneSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <span className="bg-[#2563EB]/10 border border-[#2563EB]/30 text-[#2563EB] text-xs font-black px-3 py-1 rounded-full whitespace-nowrap">
              {milestoneSearch ? `${filteredMilestones.length} / ${pendingMilestones.length}` : `${pendingMilestones.length} Pending`}
            </span>
          </div>
        </div>

        {filteredMilestones.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs admin-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Milestone Reached</th>
                  <th>Date Earned</th>
                  <th>Select Win Outcome</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredMilestones.map((m: any) => {
                  const selectedPrize = milestonePrizes[m.id] || prizes[0]?.id;
                  return (
                    <tr key={m.id} className="hover:bg-blue-50/50">
                      <td>
                        <span className="font-bold text-[#111827] block">{m.user?.name}</span>
                        <span className="text-[11px] text-[#6B7280] block font-mono">{m.user?.phone}</span>
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/25">
                          <Crown className="w-3 h-3 text-amber-500" />
                          {m.triggerReason || `Level ${m.levelNumber} Task ${m.taskNumber}`}
                        </span>
                      </td>
                      <td className="text-[#6B7280] whitespace-nowrap">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </td>
                      <td className="min-w-[220px]">
                        <select
                          value={selectedPrize}
                          onChange={(e) => setMilestonePrizes({ ...milestonePrizes, [m.id]: e.target.value })}
                          className="w-full bg-white border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-1.5 text-xs text-[#111827] focus:outline-none"
                        >
                          {prizes.map((p: any) => (
                            <option key={p.id} value={p.id}>
                              {p.name} {p.prizeType === 'CASH' ? `(Cash PKR ${p.monetaryValue})` : `(Physical Product)`}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          onClick={() => handleAssignMilestone(m.id)}
                          disabled={actionLoadingId === m.id}
                          className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-lg text-xs shadow-sm disabled:opacity-50 transition-all flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {actionLoadingId === m.id ? 'Granting...' : 'Assign & Unlock Spin'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : pendingMilestones.length > 0 ? (
          <div className="p-6 bg-white/70 border border-dashed border-[#D9E4F2] rounded-xl text-center text-xs text-[#6B7280] space-y-2">
            <p>No milestone spins found matching "<strong>{milestoneSearch}</strong>".</p>
            <button
              type="button"
              onClick={() => setMilestoneSearch('')}
              className="text-[#2563EB] underline font-semibold hover:text-[#1D4ED8]"
            >
              Clear Search Filter
            </button>
          </div>
        ) : (
          <div className="p-4 bg-white/70 border border-dashed border-[#D9E4F2] rounded-xl text-center text-xs text-[#6B7280]">
            All milestone spins have been assigned. New entries appear as users complete Task 3 and Task 7.
          </div>
        )}
      </div>

      {/* ========================================================
          OPTION 2: MANUAL SPIN GRANT TO MEMBER
          Searchable member selector with instant filter & debounced query
          ======================================================== */}
      <div className="admin-card p-6 space-y-4">
        <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-[#2563EB]" /> Manual Spin Grant to Member
        </h2>

        <form onSubmit={handleAssignPrize} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs items-end">
          {/* Searchable Member Combobox */}
          <div className="relative" ref={memberSelectRef}>
            <label className="block font-semibold text-[#374151] mb-1">
              Target Member * {selectedUser && <span className="text-emerald-600 font-bold ml-1">✓ Selected</span>}
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search member by name or phone..."
                value={memberSearchQuery}
                onFocus={() => setIsMemberDropdownOpen(true)}
                onChange={(e) => {
                  setMemberSearchQuery(e.target.value);
                  setIsMemberDropdownOpen(true);
                }}
                className="w-full bg-white border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg pl-8 pr-7 p-2 text-[#111827] focus:outline-none shadow-xs"
              />
              {memberSearchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setMemberSearchQuery('');
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Selected User Indicator */}
            {selectedUser && (
              <div className="mt-1 px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-[10px] text-[#2563EB] flex items-center justify-between">
                <span className="truncate">
                  {selectedUser.name} <span className="font-mono text-[#6B7280]">({selectedUser.phone})</span>
                </span>
                <CheckCircle2 className="w-3 h-3 text-[#2563EB] flex-shrink-0 ml-1" />
              </div>
            )}

            {/* Dropdown list of filtered members */}
            {isMemberDropdownOpen && (
              <div className="absolute z-30 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-[#D9E4F2] rounded-xl shadow-xl py-1 text-xs">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((u: any) => {
                    const isSelected = selectedUserId === u.id;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setSelectedUserId(u.id);
                          setMemberSearchQuery(`${u.name} (${u.phone})`);
                          setIsMemberDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-blue-50/80 transition-colors border-b border-slate-50 last:border-b-0 ${
                          isSelected ? 'bg-blue-50/90 font-bold text-[#2563EB]' : 'text-[#374151]'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <span className="block font-semibold text-[#111827] truncate">{u.name}</span>
                          <span className="block text-[11px] text-[#6B7280] font-mono">{u.phone}</span>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] flex-shrink-0" />
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="p-3 text-center text-xs text-[#6B7280]">
                    No members found matching "{memberSearchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-[#374151] mb-1">Pre-Assigned Prize *</label>
            <select
              value={assignedPrizeId}
              onChange={(e) => setAssignedPrizeId(e.target.value)}
              className="w-full bg-white border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2 text-[#111827] focus:outline-none"
            >
              {prizes.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.prizeType === 'CASH' ? `PKR ${p.monetaryValue}` : 'Physical'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#374151] mb-1">Spins to Grant</label>
            <input
              type="number"
              min="1"
              value={totalSpins}
              onChange={(e) => setTotalSpins(e.target.value)}
              className="w-full bg-white border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2 text-[#111827] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={assigning}
            className="w-full py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-lg shadow-sm text-xs h-9 disabled:opacity-50 transition-colors"
          >
            {assigning ? 'Assigning...' : 'Grant Entitlement'}
          </button>
        </form>
      </div>

      {/* Configured Prizes Grid */}
      <div className="admin-card p-6 space-y-4">
        <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
          <Gift className="w-4 h-4 text-[#2563EB]" /> Configured Spin Wheel Prizes
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {prizes.map((p: any) => (
            <div key={p.id} className="p-3 bg-[#F8FAFD] border border-[#EDF1F7] rounded-lg text-xs space-y-1">
              <span className="font-bold text-[#111827] block">{p.name}</span>
              <span className="text-[11px] text-[#2563EB] font-semibold block">
                {p.prizeType === 'CASH' ? `PKR ${p.monetaryValue.toLocaleString()}` : 'Physical Gift'}
              </span>
              <span className="text-[10px] text-[#6B7280] block">Type: {p.prizeType}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent User Spin Histories Table with Search */}
      <div className="admin-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
          <h2 className="text-sm font-bold text-[#111827]">Recent Executed Spins</h2>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search spin history..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="w-full bg-white border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg pl-8 pr-7 py-1.5 text-xs text-[#111827] focus:outline-none placeholder:text-[#9CA3AF] shadow-xs"
            />
            {historySearch && (
              <button
                type="button"
                onClick={() => setHistorySearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {filteredHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs admin-table">
              <thead>
                <tr>
                  <th>Spun Date</th>
                  <th>Member</th>
                  <th>Prize Result</th>
                  <th>Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((h: any) => (
                  <tr key={h.id}>
                    <td className="text-[#6B7280] whitespace-nowrap">{new Date(h.createdAt).toLocaleString()}</td>
                    <td className="font-semibold text-[#111827]">{h.user?.name} ({h.user?.phone})</td>
                    <td className="font-bold text-[#2563EB]">{h.resultLabel}</td>
                    <td className="font-bold text-[#111827]">PKR {h.prizeValue.toLocaleString()}</td>
                    <td>
                      <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded text-[10px]">
                        {h.rewardStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : history.length > 0 ? (
          <div className="p-4 bg-white/70 border border-dashed border-[#D9E4F2] rounded-xl text-center text-xs text-[#6B7280] space-y-1">
            <p>No executed spins match "<strong>{historySearch}</strong>".</p>
            <button
              type="button"
              onClick={() => setHistorySearch('')}
              className="text-[#2563EB] underline font-semibold hover:text-[#1D4ED8]"
            >
              Clear Filter
            </button>
          </div>
        ) : (
          <p className="text-xs text-[#6B7280]">No spins recorded yet.</p>
        )}
      </div>
    </div>
  );
};
