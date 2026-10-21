import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  KeyRound,
  Wallet,
  Eye,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  X,
  Filter,
  Sparkles,
  RefreshCw,
  Edit3,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';
import { api } from '../../api/client';

const COLUMN_KEYS = [
  'name',
  'phone',
  'referralCode',
  'approvedTasks',
  'creditPoints',
  'walletBalance',
  'status',
  'actions',
] as const;

type ColumnKey = (typeof COLUMN_KEYS)[number];

interface ColumnMeta {
  key: ColumnKey;
  label: string;
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  align?: 'left' | 'right';
}

const TABLE_COLUMNS: ColumnMeta[] = [
  { key: 'name', label: 'Member Name', defaultWidth: 200, minWidth: 120, maxWidth: 500, align: 'left' },
  { key: 'phone', label: 'Phone', defaultWidth: 135, minWidth: 90, maxWidth: 280, align: 'left' },
  { key: 'referralCode', label: 'Referral Code', defaultWidth: 125, minWidth: 85, maxWidth: 240, align: 'left' },
  { key: 'approvedTasks', label: 'Approved Tasks', defaultWidth: 130, minWidth: 90, maxWidth: 240, align: 'left' },
  { key: 'creditPoints', label: 'Credit Points', defaultWidth: 130, minWidth: 90, maxWidth: 240, align: 'left' },
  { key: 'walletBalance', label: 'Wallet Balance', defaultWidth: 140, minWidth: 95, maxWidth: 280, align: 'left' },
  { key: 'status', label: 'Status', defaultWidth: 110, minWidth: 80, maxWidth: 200, align: 'left' },
  { key: 'actions', label: 'Actions', defaultWidth: 240, minWidth: 160, maxWidth: 450, align: 'right' },
];

const DEFAULT_WIDTHS: Record<ColumnKey, number> = {
  name: 200,
  phone: 135,
  referralCode: 125,
  approvedTasks: 130,
  creditPoints: 130,
  walletBalance: 140,
  status: 110,
  actions: 240,
};

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingUsers, setUpdatingUsers] = useState<Record<string, boolean>>({});

  // Modals state
  const [resetModalUser, setResetModalUser] = useState<any | null>(null);
  const [tempPassword, setTempPassword] = useState('');
  const [resetReason, setResetReason] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const [balanceModalUser, setBalanceModalUser] = useState<any | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>('');
  const [adjustType, setAdjustType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);

  // Credit Points Adjustment Modal state
  const [pointsModalUser, setPointsModalUser] = useState<any | null>(null);
  const [adjustPoints, setAdjustPoints] = useState<string>('');
  const [pointsActionType, setPointsActionType] = useState<'ADD' | 'DEDUCT'>('ADD');
  const [pointsReason, setPointsReason] = useState('');
  const [pointsLoading, setPointsLoading] = useState(false);
  const [reloadingAll, setReloadingAll] = useState(false);

  // Edit User Details Modal state (sends only changed fields to backend/Supabase)
  const [editModalUser, setEditModalUser] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'SUSPENDED'>('ACTIVE');
  const [editReason, setEditReason] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadUsers = (p = 1, isManualReload = false) => {
    if (isManualReload) {
      setReloadingAll(true);
    } else if (users.length === 0) {
      setLoading(true);
    }
    api.getAdminUsers({ search: search.trim(), status, page: p, limit: 15 })
      .then((res) => {
        setUsers(res.users || []);
        setTotalPages(res.pagination?.totalPages || 1);
        setPage(p);
        if (isManualReload) {
          setMessage({ type: 'success', text: 'All user accounts reloaded successfully from database.' });
        }
      })
      .catch((err: any) => {
        console.error(err);
        setMessage({ type: 'error', text: err.message || 'Failed to load users' });
      })
      .finally(() => {
        setLoading(false);
        setReloadingAll(false);
      });
  };

  useEffect(() => {
    loadUsers(1);
  }, [status]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers(1);
  };

  // Treat each user as a separate entity: refresh ONLY this user's data
  const handleRefreshSingleUser = async (userId: string) => {
    setUpdatingUsers((prev) => ({ ...prev, [userId]: true }));
    try {
      const res = await api.getAdminUserSummary(userId);
      if (res?.user) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, ...res.user } : u))
        );
        setMessage({ type: 'success', text: `Refreshed data for ${res.user.name}.` });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to refresh user' });
    } finally {
      setUpdatingUsers((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    }
  };

  const handleToggleStatus = async (user: any) => {
    const newStatus = user.accountStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setUpdatingUsers((prev) => ({ ...prev, [user.id]: true }));
    try {
      const res = await api.updateUserStatus(user.id, newStatus, `Admin manual status toggle to ${newStatus}`);
      // Update ONLY this single user in local state directly without reloading the entire table!
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, accountStatus: newStatus } : u))
      );
      setMessage({ type: 'success', text: `User ${user.name} status changed to ${newStatus}` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Status update failed' });
    } finally {
      setUpdatingUsers((prev) => {
        const next = { ...prev };
        delete next[user.id];
        return next;
      });
    }
  };

  // Edit User details: send ONLY changed fields to backend/Supabase and update in place
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalUser) return;

    // Diff against current user values: send ONLY changed fields!
    const changedFields: Record<string, any> = {};
    if (editName.trim() && editName.trim() !== editModalUser.name) {
      changedFields.name = editName.trim();
    }
    if (editPhone.trim() && editPhone.trim() !== editModalUser.phone) {
      changedFields.phone = editPhone.trim();
    }
    if (editStatus && editStatus !== editModalUser.accountStatus) {
      changedFields.accountStatus = editStatus;
    }
    if (editReason.trim()) {
      changedFields.reason = editReason.trim();
    }

    if (Object.keys(changedFields).filter((k) => k !== 'reason').length === 0) {
      setMessage({ type: 'success', text: 'No fields were modified. User profile is unchanged.' });
      setEditModalUser(null);
      return;
    }

    const targetUser = editModalUser;
    setEditModalUser(null);
    setUpdatingUsers((prev) => ({ ...prev, [targetUser.id]: true }));
    try {
      const res = await api.updateUser(targetUser.id, changedFields);
      // Update that user's data instantly on the live page without reloading it
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, ...res.user } : u))
      );
      setMessage({ type: 'success', text: res.message || `Updated ${res.user?.name || targetUser.name} successfully.` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update user' });
    } finally {
      setUpdatingUsers((prev) => {
        const next = { ...prev };
        delete next[targetUser.id];
        return next;
      });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser) return;
    const targetUser = resetModalUser;
    setResetModalUser(null);
    setUpdatingUsers((prev) => ({ ...prev, [targetUser.id]: true }));
    try {
      const res = await api.resetUserPassword(targetUser.id, {
        temporaryPassword: tempPassword,
        requireChangeOnLogin: true,
        reason: resetReason,
      });
      setMessage({ type: 'success', text: res.message });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Reset failed' });
    } finally {
      setUpdatingUsers((prev) => {
        const next = { ...prev };
        delete next[targetUser.id];
        return next;
      });
    }
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!balanceModalUser) return;
    const targetUser = balanceModalUser;
    const numAmount = parseFloat(adjustAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setMessage({ type: 'error', text: 'Enter a valid positive adjustment amount' });
      return;
    }
    // Immediately remove popup from screen & activate loading indicator on this specific user
    setBalanceModalUser(null);
    setUpdatingUsers((prev) => ({ ...prev, [targetUser.id]: true }));
    try {
      const res = await api.adjustUserBalance(targetUser.id, {
        amount: numAmount,
        actionType: adjustType,
        reason: adjustReason?.trim() || 'Admin adjustment',
      });
      // Update ONLY this single user in local state directly without reloading the entire table!
      const newBalance = res.wallet?.availableBalance ?? (
        targetUser.walletBalance + (adjustType === 'CREDIT' ? numAmount : -numAmount)
      );
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, walletBalance: newBalance } : u))
      );
      setMessage({ type: 'success', text: res.message });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Balance adjustment failed' });
    } finally {
      setUpdatingUsers((prev) => {
        const next = { ...prev };
        delete next[targetUser.id];
        return next;
      });
    }
  };

  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pointsModalUser) return;
    const targetUser = pointsModalUser;
    const numPoints = parseInt(adjustPoints, 10);
    if (isNaN(numPoints) || numPoints <= 0) {
      setMessage({ type: 'error', text: 'Enter a valid positive number of credit points' });
      return;
    }
    // Immediately remove popup from screen & activate loading indicator on this specific user
    setPointsModalUser(null);
    setUpdatingUsers((prev) => ({ ...prev, [targetUser.id]: true }));
    try {
      const res = await api.adjustUserCreditPoints(targetUser.id, {
        points: numPoints,
        actionType: pointsActionType,
        reason: pointsReason,
      });
      // Update ONLY this single user in local state directly without reloading the entire table!
      const newPoints = res.creditPoints ?? (
        (targetUser.creditPoints ?? 0) + (pointsActionType === 'ADD' ? numPoints : -numPoints)
      );
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, creditPoints: newPoints } : u))
      );
      setMessage({ type: 'success', text: res.message });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Credit points adjustment failed' });
    } finally {
      setUpdatingUsers((prev) => {
        const next = { ...prev };
        delete next[targetUser.id];
        return next;
      });
    }
  };

  // Column Resizing & Sticky Table Header state
  const [colWidths, setColWidths] = useState<Record<ColumnKey, number>>(() => {
    try {
      const saved = localStorage.getItem('royal_admin_users_col_widths');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_WIDTHS, ...parsed };
      }
    } catch {}
    return DEFAULT_WIDTHS;
  });
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const resizingColRef = useRef<{
    key: ColumnKey;
    startX: number;
    startWidth: number;
  } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('royal_admin_users_col_widths', JSON.stringify(colWidths));
    } catch {}
  }, [colWidths]);

  const handleStartResize = (key: ColumnKey, clientX: number) => {
    resizingColRef.current = {
      key,
      startX: clientX,
      startWidth: colWidths[key] || DEFAULT_WIDTHS[key] || 150,
    };
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingColRef.current) return;
      const { key, startX, startWidth } = resizingColRef.current;
      const diff = e.clientX - startX;
      const col = TABLE_COLUMNS.find((c) => c.key === key);
      const min = col ? col.minWidth : 80;
      const max = col ? col.maxWidth : 600;
      const newWidth = Math.max(min, Math.min(max, startWidth + diff));
      setColWidths((prev) => ({
        ...prev,
        [key]: Math.round(newWidth),
      }));
    };

    const handleMouseUp = () => {
      if (resizingColRef.current) {
        resizingColRef.current = null;
        setIsResizing(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!resizingColRef.current || !e.touches[0]) return;
      const { key, startX, startWidth } = resizingColRef.current;
      const diff = e.touches[0].clientX - startX;
      const col = TABLE_COLUMNS.find((c) => c.key === key);
      const min = col ? col.minWidth : 80;
      const max = col ? col.maxWidth : 600;
      const newWidth = Math.max(min, Math.min(max, startWidth + diff));
      setColWidths((prev) => ({
        ...prev,
        [key]: Math.round(newWidth),
      }));
    };

    const handleTouchEnd = () => {
      if (resizingColRef.current) {
        resizingColRef.current = null;
        setIsResizing(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  const adjustColumnWidth = (key: ColumnKey, delta: number) => {
    setColWidths((prev) => {
      const current = prev[key] || DEFAULT_WIDTHS[key] || 150;
      const col = TABLE_COLUMNS.find((c) => c.key === key);
      const min = col ? col.minWidth : 80;
      const max = col ? col.maxWidth : 600;
      const updated = Math.max(min, Math.min(max, current + delta));
      return { ...prev, [key]: Math.round(updated) };
    });
  };

  const resetColumnWidth = (key: ColumnKey) => {
    setColWidths((prev) => ({
      ...prev,
      [key]: DEFAULT_WIDTHS[key] || 150,
    }));
  };

  const resetAllColumnWidths = () => {
    setColWidths(DEFAULT_WIDTHS);
    try {
      localStorage.removeItem('royal_admin_users_col_widths');
    } catch {}
  };

  const totalTableWidth = Object.values(colWidths).reduce((sum, w) => sum + w, 0);

  return (
    <div className="space-y-6">
      {/* Filter and Search Bar */}
      <div className="admin-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Name, Phone, or Referral Code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#111827] focus:outline-none h-9"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 bg-[#2563EB] text-white font-semibold text-xs rounded-lg hover:bg-[#1D4ED8] transition-colors h-9"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-white border border-[#D9E4F2] rounded-lg px-3 py-1.5 text-xs text-[#111827] focus:outline-none h-9"
          >
            <option value="">All Account Statuses</option>
            <option value="ACTIVE">Active Accounts</option>
            <option value="SUSPENDED">Suspended Accounts</option>
          </select>

          <button
            type="button"
            onClick={() => setShowColumnManager(!showColumnManager)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all h-9 whitespace-nowrap shadow-xs ${
              showColumnManager
                ? 'bg-[#2563EB] text-white border-[#2563EB]'
                : 'bg-white border-[#D9E4F2] text-[#4B5563] hover:text-[#111827] hover:bg-[#F8FAFD]'
            }`}
            title="Manage and adjust table column widths"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Column Sizes</span>
          </button>

          <button
            type="button"
            onClick={() => loadUsers(page, true)}
            disabled={reloadingAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2563EB] bg-[#2563EB]/5 hover:bg-[#2563EB]/10 text-[#2563EB] font-bold text-xs transition-all h-9 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap shadow-xs"
            title="Explicitly fetch all member accounts from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reloadingAll ? 'animate-spin' : ''}`} />
            <span>{reloadingAll ? 'Reloading...' : 'Reload All Users'}</span>
          </button>
        </div>
      </div>

      {/* Column Sizes Controller Panel */}
      {showColumnManager && (
        <div className="admin-card p-4 bg-white border border-[#D9E4F2] shadow-md rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E2E8F0]">
            <div>
              <h3 className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#2563EB]" />
                Manage Field Sizes & Column Widths
              </h3>
              <p className="text-[11px] text-[#6B7280]">
                Increase or decrease any field width using buttons, sliders, or by dragging column dividers directly in the table.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetAllColumnWidths}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-[#4B5563] bg-[#F1F5F9] hover:bg-[#E2E8F0] transition-colors"
                title="Reset all column widths to default"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Defaults
              </button>
              <button
                type="button"
                onClick={() => setShowColumnManager(false)}
                className="p-1 rounded text-[#6B7280] hover:text-[#111827] hover:bg-[#F1F5F9]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {TABLE_COLUMNS.map((col) => (
              <div
                key={col.key}
                className="p-2.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFD] flex flex-col justify-between gap-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#111827]">{col.label}</span>
                  <span className="font-mono text-[11px] font-bold text-[#2563EB]">
                    {colWidths[col.key]}px
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => adjustColumnWidth(col.key, -15)}
                    className="w-6 h-6 rounded bg-white border border-[#D9E4F2] hover:bg-[#E2E8F0] font-bold text-xs flex items-center justify-center text-[#374151] transition-colors active:scale-95 shadow-2xs"
                    title="Decrease width (-15px)"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min={col.minWidth}
                    max={col.maxWidth}
                    value={colWidths[col.key]}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setColWidths((prev) => ({ ...prev, [col.key]: val }));
                    }}
                    className="flex-1 accent-[#2563EB] cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => adjustColumnWidth(col.key, 15)}
                    className="w-6 h-6 rounded bg-white border border-[#D9E4F2] hover:bg-[#E2E8F0] font-bold text-xs flex items-center justify-center text-[#374151] transition-colors active:scale-95 shadow-2xs"
                    title="Increase width (+15px)"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="admin-card overflow-hidden">
        {loading && users.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#6B7280]">Loading users...</div>
        ) : users.length > 0 ? (
          <div className="overflow-auto max-h-[calc(100vh-270px)] min-h-[380px] relative border-b border-[#D9E4F2]">
            <table
              className="text-left text-xs admin-table border-collapse"
              style={{
                tableLayout: 'fixed',
                width: `${totalTableWidth}px`,
                minWidth: '100%',
              }}
            >
              <thead className="sticky top-0 z-20">
                <tr className="bg-[#F1F5F9]">
                  {TABLE_COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      style={{
                        width: `${colWidths[col.key]}px`,
                        minWidth: `${colWidths[col.key]}px`,
                        maxWidth: `${colWidths[col.key]}px`,
                      }}
                      className={`sticky top-0 z-20 bg-[#F1F5F9] text-[#334155] border-b-2 border-[#CBD5E1] shadow-[0_1px_3px_rgba(0,0,0,0.06)] px-3.5 py-3 font-bold text-[11px] uppercase tracking-wider relative select-none group transition-colors hover:bg-[#E2E8F0] ${
                        col.align === 'right' ? 'text-right' : 'text-left'
                      }`}
                    >
                      <div className={`flex items-center gap-1.5 ${col.align === 'right' ? 'justify-end pr-2' : 'justify-between pr-2'}`}>
                        <span className="truncate" title={col.label}>
                          {col.label}
                        </span>
                        {/* Micro +/- adjusters visible on hover */}
                        <div className="hidden group-hover:inline-flex items-center gap-0.5 flex-shrink-0 bg-white/90 backdrop-blur rounded px-1 py-0.5 shadow-2xs border border-[#CBD5E1]">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              adjustColumnWidth(col.key, -15);
                            }}
                            title={`Decrease ${col.label} width (-15px)`}
                            className="w-4 h-4 flex items-center justify-center rounded text-[10px] font-black text-slate-700 hover:bg-[#2563EB] hover:text-white transition-colors"
                          >
                            -
                          </button>
                          <span className="text-[9px] font-mono font-bold text-[#2563EB] px-0.5">
                            {colWidths[col.key]}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              adjustColumnWidth(col.key, 15);
                            }}
                            title={`Increase ${col.label} width (+15px)`}
                            className="w-4 h-4 flex items-center justify-center rounded text-[10px] font-black text-slate-700 hover:bg-[#2563EB] hover:text-white transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Interactive Drag Handle */}
                      <div
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          handleStartResize(col.key, e.clientX);
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          if (e.touches[0]) handleStartResize(col.key, e.touches[0].clientX);
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          resetColumnWidth(col.key);
                        }}
                        title="Drag to resize column. Double click to reset width."
                        className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize select-none flex items-center justify-center hover:bg-[#2563EB]/25 active:bg-[#2563EB] z-30 group/handle"
                      >
                        <div className="w-[2px] h-4 bg-slate-300 group-hover/handle:bg-[#2563EB] group-active/handle:bg-[#2563EB] rounded-full transition-colors" />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#F8FAFD] transition-colors">
                    <td
                      style={{
                        width: `${colWidths.name}px`,
                        minWidth: `${colWidths.name}px`,
                        maxWidth: `${colWidths.name}px`,
                      }}
                      className="font-semibold text-[#111827] px-3.5 py-3 border-b border-[#E2E8F0] overflow-hidden"
                    >
                      <Link
                        to={`/adminpanal/users/${u.id}`}
                        className="hover:text-[#2563EB] hover:underline block truncate"
                        title={u.name}
                      >
                        {u.name}
                      </Link>
                      <span className="block text-[10px] text-[#6B7280] font-mono truncate">
                        ID: {u.id.slice(-6)}
                      </span>
                    </td>
                    <td
                      style={{
                        width: `${colWidths.phone}px`,
                        minWidth: `${colWidths.phone}px`,
                        maxWidth: `${colWidths.phone}px`,
                      }}
                      className="font-mono text-[#4B5563] px-3.5 py-3 border-b border-[#E2E8F0] overflow-hidden text-ellipsis whitespace-nowrap"
                      title={u.phone}
                    >
                      {u.phone}
                    </td>
                    <td
                      style={{
                        width: `${colWidths.referralCode}px`,
                        minWidth: `${colWidths.referralCode}px`,
                        maxWidth: `${colWidths.referralCode}px`,
                      }}
                      className="font-mono font-bold text-[#2563EB] px-3.5 py-3 border-b border-[#E2E8F0] overflow-hidden text-ellipsis whitespace-nowrap"
                      title={u.referralCode}
                    >
                      {u.referralCode}
                    </td>
                    <td
                      style={{
                        width: `${colWidths.approvedTasks}px`,
                        minWidth: `${colWidths.approvedTasks}px`,
                        maxWidth: `${colWidths.approvedTasks}px`,
                      }}
                      className="px-3.5 py-3 border-b border-[#E2E8F0] overflow-hidden whitespace-nowrap"
                    >
                      <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded text-[11px]">
                        {u.approvedTasksCount} / 100
                      </span>
                    </td>
                    <td
                      style={{
                        width: `${colWidths.creditPoints}px`,
                        minWidth: `${colWidths.creditPoints}px`,
                        maxWidth: `${colWidths.creditPoints}px`,
                      }}
                      className="font-semibold text-[#111827] px-3.5 py-3 border-b border-[#E2E8F0] overflow-hidden whitespace-nowrap"
                    >
                      <span>
                        {(u.creditPoints ?? 0).toLocaleString()}{' '}
                        <span className="text-[11px] text-[#6B7280] font-normal">CPs</span>
                      </span>
                    </td>
                    <td
                      style={{
                        width: `${colWidths.walletBalance}px`,
                        minWidth: `${colWidths.walletBalance}px`,
                        maxWidth: `${colWidths.walletBalance}px`,
                      }}
                      className="font-bold text-[#111827] px-3.5 py-3 border-b border-[#E2E8F0] overflow-hidden whitespace-nowrap"
                    >
                      {updatingUsers[u.id] ? (
                        <span className="inline-flex items-center gap-1 text-[#2563EB] text-xs font-semibold animate-pulse">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Updating...</span>
                        </span>
                      ) : (
                        `PKR ${u.walletBalance.toLocaleString()}`
                      )}
                    </td>
                    <td
                      style={{
                        width: `${colWidths.status}px`,
                        minWidth: `${colWidths.status}px`,
                        maxWidth: `${colWidths.status}px`,
                      }}
                      className="px-3.5 py-3 border-b border-[#E2E8F0] overflow-hidden whitespace-nowrap"
                    >
                      <span
                        className={`font-semibold text-[10px] px-2 py-0.5 rounded-full ${
                          u.accountStatus === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {u.accountStatus}
                      </span>
                    </td>
                    <td
                      style={{
                        width: `${colWidths.actions}px`,
                        minWidth: `${colWidths.actions}px`,
                        maxWidth: `${colWidths.actions}px`,
                      }}
                      className="text-right px-3.5 py-3 border-b border-[#E2E8F0] whitespace-nowrap"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        {updatingUsers[u.id] ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 animate-pulse">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#2563EB]" />
                            <span>Updating...</span>
                          </span>
                        ) : (
                          <>
                            <Link
                              to={`/adminpanal/users/${u.id}`}
                              className="p-1.5 rounded-md hover:bg-[#F8FAFD] text-[#4B5563] hover:text-[#2563EB]"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => {
                                setEditModalUser(u);
                                setEditName(u.name);
                                setEditPhone(u.phone);
                                setEditStatus(u.accountStatus || 'ACTIVE');
                                setEditReason('');
                              }}
                              className="p-1.5 rounded-md hover:bg-blue-50 text-[#4B5563] hover:text-[#2563EB]"
                              title={`Edit Details for ${u.name}`}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setAdjustPoints('');
                                setPointsReason('');
                                setPointsActionType('ADD');
                                setPointsModalUser(u);
                              }}
                              className="p-1.5 rounded-md hover:bg-slate-100 text-[#4B5563] hover:text-[#111827] transition-colors"
                              title={`Edit / Adjust Credit Points for ${u.name}`}
                            >
                              <Sparkles className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setAdjustAmount('');
                                setAdjustReason('');
                                setBalanceModalUser(u);
                              }}
                              className="p-1.5 rounded-md hover:bg-emerald-50 text-[#4B5563] hover:text-emerald-700"
                              title="Adjust Balance"
                            >
                              <Wallet className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setTempPassword('');
                                setResetReason('');
                                setResetModalUser(u);
                              }}
                              className="p-1.5 rounded-md hover:bg-blue-50 text-[#4B5563] hover:text-[#2563EB]"
                              title="Reset Password"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                                u.accountStatus === 'ACTIVE'
                                  ? 'text-red-600 hover:bg-red-50'
                                  : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={u.accountStatus === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                            >
                              {u.accountStatus === 'ACTIVE' ? 'Suspend' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleRefreshSingleUser(u.id)}
                              className="p-1.5 rounded-md hover:bg-[#F8FAFD] text-[#6B7280] hover:text-[#2563EB]"
                              title={`Refresh fresh data for ${u.name} only`}
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-xs text-[#6B7280]">No users found matching query.</div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#D9E4F2] flex items-center justify-between text-xs text-[#4B5563]">
            <button
              onClick={() => loadUsers(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="px-3 py-1 rounded bg-[#F8FAFD] border border-[#D9E4F2] disabled:opacity-40"
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => loadUsers(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 rounded bg-[#F8FAFD] border border-[#D9E4F2] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Password Reset Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="admin-card p-6 w-full max-w-md bg-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#D9E4F2]">
              <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#2563EB]" /> Reset Password: {resetModalUser.name}
              </h2>
              <button onClick={() => setResetModalUser(null)} className="p-1 text-[#6B7280]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  Temporary Password *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter temporary password"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  className="w-full bg-white border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2 font-mono text-[#111827] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  Audit Logging Reason (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Enter reason for password reset (optional)"
                  value={resetReason}
                  onChange={(e) => setResetReason(e.target.value)}
                  className="w-full bg-white border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2 text-[#111827] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-4 py-2 border border-[#D9E4F2] rounded-lg text-[#4B5563] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2563EB] text-white font-semibold rounded-lg hover:bg-[#1D4ED8]"
                >
                  Confirm Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Balance Adjustment Modal */}
      {balanceModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="admin-card p-6 w-full max-w-md bg-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#D9E4F2]">
              <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#2563EB]" /> Adjust Balance: {balanceModalUser.name}
              </h2>
              <button onClick={() => setBalanceModalUser(null)} className="p-1 text-[#6B7280]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#F8FAFD] border border-[#D9E4F2] rounded-lg text-xs flex justify-between">
              <span className="text-[#6B7280]">Current Available Balance:</span>
              <strong className="text-[#111827] font-bold">
                PKR {balanceModalUser.walletBalance.toLocaleString()}
              </strong>
            </div>

            <form onSubmit={handleAdjustBalance} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  Action Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('CREDIT')}
                    className={`py-2 rounded-lg font-bold border text-xs ${
                      adjustType === 'CREDIT'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'border-[#D9E4F2] text-[#4B5563]'
                    }`}
                  >
                    + Credit Funds
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('DEBIT')}
                    className={`py-2 rounded-lg font-bold border text-xs ${
                      adjustType === 'DEBIT'
                        ? 'bg-red-50 border-red-300 text-red-800'
                        : 'border-[#D9E4F2] text-[#4B5563]'
                    }`}
                  >
                    - Debit Funds
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  Adjustment Amount in PKR *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Enter amount in PKR (e.g. 500)"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full bg-white border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2 font-bold text-sm text-[#111827] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBalanceModalUser(null)}
                  className="px-4 py-2 border border-[#D9E4F2] rounded-lg text-[#4B5563] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2563EB] text-white font-semibold rounded-lg hover:bg-[#1D4ED8]"
                >
                  Confirm Balance Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credit Points Adjustment Modal */}
      {pointsModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="admin-card p-6 w-full max-w-md bg-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#D9E4F2]">
              <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" /> Adjust Credit Points: {pointsModalUser.name}
              </h2>
              <button onClick={() => setPointsModalUser(null)} className="p-1 text-[#6B7280]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-xs flex justify-between items-center">
              <span className="text-amber-900 font-medium">Current Credit Points Balance:</span>
              <strong className="text-amber-800 font-black text-sm flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                {(pointsModalUser.creditPoints ?? 0).toLocaleString()} CPs
              </strong>
            </div>

            <form onSubmit={handleAdjustPoints} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  Action Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPointsActionType('ADD')}
                    className={`py-2 rounded-lg font-bold border text-xs flex items-center justify-center gap-1.5 ${
                      pointsActionType === 'ADD'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'border-[#D9E4F2] text-[#4B5563]'
                    }`}
                  >
                    + Add Points (Reward)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPointsActionType('DEDUCT')}
                    className={`py-2 rounded-lg font-bold border text-xs flex items-center justify-center gap-1.5 ${
                      pointsActionType === 'DEDUCT'
                        ? 'bg-red-50 border-red-300 text-red-800'
                        : 'border-[#D9E4F2] text-[#4B5563]'
                    }`}
                  >
                    - Deduct Points (Decrease)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  Credit Points Amount (CPs) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  placeholder="Enter CPs (e.g. 5, 10, 30, 50)"
                  value={adjustPoints}
                  onChange={(e) => setAdjustPoints(e.target.value)}
                  className="w-full bg-white border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2 font-bold text-sm text-[#111827] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  Audit Logging Reason (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Enter reason (e.g. Task reward manual correction, bonus reward points) - optional"
                  value={pointsReason}
                  onChange={(e) => setPointsReason(e.target.value)}
                  className="w-full bg-white border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2 text-[#111827] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPointsModalUser(null)}
                  className="px-4 py-2 border border-[#D9E4F2] rounded-lg text-[#4B5563] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Confirm Points Adjustment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Details Modal */}
      {editModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="admin-card p-6 w-full max-w-md bg-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#D9E4F2]">
              <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#2563EB]" /> Edit Member: {editModalUser.name}
              </h2>
              <button onClick={() => setEditModalUser(null)} className="p-1 text-[#6B7280]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter full name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-white border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2 font-medium text-[#111827] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  Phone Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 03001234567"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-white border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2 font-mono text-[#111827] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  Account Status *
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full bg-white border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2 font-medium text-[#111827] focus:outline-none"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  Audit Logging Reason (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Reason for profile update"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="w-full bg-white border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2 text-[#111827] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalUser(null)}
                  className="px-4 py-2 border border-[#D9E4F2] rounded-lg text-[#4B5563] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2563EB] text-white font-semibold rounded-lg hover:bg-[#1D4ED8]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
