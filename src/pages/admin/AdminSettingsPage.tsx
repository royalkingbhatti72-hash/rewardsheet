import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  AlertCircle,
  Users,
  ShieldCheck,
  Info,
  Wrench,
  Clock,
  AlertTriangle,
  Power,
  PlusCircle,
} from 'lucide-react';
import { api } from '../../api/client';

export const AdminSettingsPage: React.FC = () => {
  const [settingsList, setSettingsList] = useState<any[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [customExtendMins, setCustomExtendMins] = useState<string>('30');

  const loadSettings = () => {
    setLoading(true);
    api.getAdminSettings()
      .then((res) => {
        setSettingsList(res.settings || []);
        const map: Record<string, string> = {};
        for (const item of res.settings || []) {
          map[item.key] = item.value;
        }
        setFormData(map);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (key: string, val: string) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  const formatDatetimeLocal = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  const getRemainingTimeBadge = (isoString?: string) => {
    if (!isoString) return null;
    const target = new Date(isoString).getTime();
    if (isNaN(target)) return null;
    const diff = target - Date.now();
    if (diff <= 0) {
      return {
        isPast: true,
        text: 'Time window passed (Overdue)',
        className: 'text-red-700 bg-red-50 border-red-200 font-semibold',
      };
    }
    const totalMinutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;

    let timeStr = '';
    if (days > 0) timeStr += `${days}d `;
    if (remHours > 0 || days > 0) timeStr += `${remHours}h `;
    timeStr += `${mins}m remaining`;

    return {
      isPast: false,
      text: timeStr,
      className: 'text-amber-800 bg-amber-50 border-amber-300 font-bold',
    };
  };

  const handleToggleMaintenance = async (enable: boolean) => {
    setSaving(true);
    setMessage(null);
    try {
      let expectedEnd = formData.maintenance_expected_end || '';
      if (enable && (!expectedEnd || new Date(expectedEnd).getTime() <= Date.now())) {
        expectedEnd = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      }

      const updated = {
        ...formData,
        maintenance_mode: enable ? 'true' : 'false',
        maintenance_expected_end: expectedEnd,
      };
      setFormData(updated);

      const payload = {
        settings: Object.entries(updated).map(([key, value]) => ({
          key,
          value: value === null || value === undefined ? '' : String(value),
        })),
      };
      const res = await api.updateAdminSettings(payload);
      api.invalidateCache('/settings');
      setMessage({
        type: 'success',
        text: enable
          ? '⚠️ Maintenance Mode is now ON. Regular visitors & members are presented with the Maintenance Screen.'
          : '✅ Maintenance Mode is now OFF. Platform is LIVE for all visitors and members.',
      });
      loadSettings();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to toggle maintenance mode' });
    } finally {
      setSaving(false);
    }
  };

  const handleExtendTime = async (minutes: number) => {
    setSaving(true);
    setMessage(null);
    try {
      let baseTime = Date.now();
      if (formData.maintenance_expected_end) {
        const existing = new Date(formData.maintenance_expected_end).getTime();
        if (!isNaN(existing) && existing > baseTime) {
          baseTime = existing;
        }
      }

      const newDate = new Date(baseTime + minutes * 60 * 1000);
      const newIso = newDate.toISOString();

      const updated = {
        ...formData,
        maintenance_expected_end: newIso,
      };
      setFormData(updated);

      const payload = {
        settings: Object.entries(updated).map(([key, value]) => ({
          key,
          value: value === null || value === undefined ? '' : String(value),
        })),
      };
      const res = await api.updateAdminSettings(payload);
      api.invalidateCache('/settings');
      const timeLabel = minutes >= 60 ? `${minutes / 60} hour(s)` : `${minutes} minutes`;
      setMessage({
        type: 'success',
        text: `⏳ Maintenance extended by +${timeLabel}. New target completion: ${newDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })} (${newDate.toLocaleDateString()}).`,
      });
      loadSettings();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to extend maintenance time' });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        settings: Object.entries(formData).map(([key, value]) => ({
          key,
          value: value === null || value === undefined ? '' : String(value),
        })),
      };
      const res = await api.updateAdminSettings(payload);
      setMessage({ type: 'success', text: res.message });
      api.invalidateCache('/settings');
      loadSettings();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-[#2563EB]/20 border-t-[#2563EB] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#111827]">Website Settings</h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Configure official receiving bank & mobile accounts, limits, and brand details.
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
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Maintenance Mode Controller Card */}
        <div
          className={`admin-card p-6 space-y-5 border-2 transition-all rounded-xl ${
            formData.maintenance_mode === 'true'
              ? 'border-amber-400 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 shadow-md'
              : 'border-[#CBD5E1] bg-white'
          }`}
        >
          {/* Header & Main Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D9E4F2] pb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  formData.maintenance_mode === 'true'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 animate-pulse'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#111827]">Maintenance Mode Controller</h2>
                  <span
                    className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full border ${
                      formData.maintenance_mode === 'true'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {formData.maintenance_mode === 'true' ? '● ON (Active)' : '● OFF (Live)'}
                  </span>
                </div>
                <p className="text-[11px] text-[#6B7280] mt-0.5">
                  Temporarily lock regular member & visitor access during upgrades. Administrators always retain access to this portal.
                </p>
              </div>
            </div>

            {/* Quick Switch Button (ON / OFF) */}
            <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-100 p-1 rounded-xl border border-[#CBD5E1]">
              <button
                type="button"
                onClick={() => handleToggleMaintenance(false)}
                disabled={saving}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  formData.maintenance_mode !== 'true'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>OFF (Platform Live)</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleMaintenance(true)}
                disabled={saving}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  formData.maintenance_mode === 'true'
                    ? 'bg-amber-500 text-white shadow-xs animate-pulse'
                    : 'text-amber-800 hover:text-amber-900 hover:bg-amber-100/50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>ON (Maintenance)</span>
              </button>
            </div>
          </div>

          {/* Status Alert Banner */}
          {formData.maintenance_mode === 'true' ? (
            <div className="p-3.5 rounded-xl bg-amber-100/70 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block">
                  ⚠️ Platform is Currently in Maintenance Mode
                </span>
                <p className="text-[11.5px] text-amber-800 leading-relaxed">
                  Regular members and visitors are blocked and shown the Royal Maintenance Screen with the countdown timer below. As an administrator, your access to <code>/adminpanal</code> is never blocked.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                <strong>Platform is fully LIVE:</strong> All user tasks, deposits, spins, and withdrawals are operating normally.
              </span>
            </div>
          )}

          {/* Expected Completion Time & Remaining Countdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-[#374151] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Expected Completion Date & Time</span>
                </label>
                {formData.maintenance_expected_end && (
                  (() => {
                    const badge = getRemainingTimeBadge(formData.maintenance_expected_end);
                    return badge ? (
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${badge.className}`}>
                        {badge.text}
                      </span>
                    ) : null;
                  })()
                )}
              </div>

              <input
                type="datetime-local"
                value={formatDatetimeLocal(formData.maintenance_expected_end)}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    handleChange('maintenance_expected_end', '');
                  } else {
                    handleChange('maintenance_expected_end', new Date(val).toISOString());
                  }
                }}
                className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-xs text-[#111827] focus:outline-none font-mono bg-white"
              />
              <span className="text-[10.5px] text-[#6B7280] block">
                The countdown on the maintenance screen counts down to this exact timestamp.
              </span>
            </div>

            {/* Quick Time Extension Options */}
            <div className="space-y-1.5">
              <label className="font-bold text-[#374151] flex items-center gap-1.5">
                <PlusCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Extend Maintenance Time (+ Quick Add)</span>
              </label>

              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleExtendTime(15)}
                  disabled={saving}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-[#2563EB] border border-[#CBD5E1] text-[#374151] text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                  title="Extend completion time by 15 minutes"
                >
                  +15 Mins
                </button>
                <button
                  type="button"
                  onClick={() => handleExtendTime(30)}
                  disabled={saving}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-[#2563EB] border border-[#CBD5E1] text-[#374151] text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                  title="Extend completion time by 30 minutes"
                >
                  +30 Mins
                </button>
                <button
                  type="button"
                  onClick={() => handleExtendTime(60)}
                  disabled={saving}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-[#2563EB] border border-[#CBD5E1] text-[#374151] text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                  title="Extend completion time by 1 hour"
                >
                  +1 Hour
                </button>
                <button
                  type="button"
                  onClick={() => handleExtendTime(120)}
                  disabled={saving}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-[#2563EB] border border-[#CBD5E1] text-[#374151] text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                  title="Extend completion time by 2 hours"
                >
                  +2 Hours
                </button>
                <button
                  type="button"
                  onClick={() => handleExtendTime(240)}
                  disabled={saving}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-[#2563EB] border border-[#CBD5E1] text-[#374151] text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                  title="Extend completion time by 4 hours"
                >
                  +4 Hours
                </button>
                <button
                  type="button"
                  onClick={() => handleExtendTime(1440)}
                  disabled={saving}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-[#2563EB] border border-[#CBD5E1] text-[#374151] text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                  title="Extend completion time by 24 hours"
                >
                  +1 Day
                </button>
              </div>

              {/* Custom minute extension */}
              <div className="flex items-center gap-1.5 pt-1">
                <input
                  type="number"
                  min="1"
                  max="10080"
                  value={customExtendMins}
                  onChange={(e) => setCustomExtendMins(e.target.value)}
                  placeholder="Minutes"
                  className="w-24 border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg px-2.5 py-1 text-xs text-[#111827] focus:outline-none font-bold"
                />
                <button
                  type="button"
                  onClick={() => {
                    const mins = parseInt(customExtendMins, 10);
                    if (!isNaN(mins) && mins > 0) handleExtendTime(mins);
                  }}
                  disabled={saving || !customExtendMins}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors"
                >
                  + Add Custom Minutes
                </button>
              </div>
            </div>
          </div>

          {/* Customizable Maintenance Title & Message */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1 border-t border-[#D9E4F2]">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Maintenance Headline / Title
              </label>
              <input
                type="text"
                value={formData.maintenance_title || ''}
                placeholder="System Maintenance & Core Upgrade"
                onChange={(e) => handleChange('maintenance_title', e.target.value)}
                className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-xs text-[#111827] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Notice Message Displayed to Visitors
              </label>
              <textarea
                rows={2}
                value={formData.maintenance_message || ''}
                placeholder="We are currently upgrading server systems and verifying database ledgers. Services will resume shortly."
                onChange={(e) => handleChange('maintenance_message', e.target.value)}
                className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2 text-xs text-[#111827] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* General & Support Section */}
        <div className="admin-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-[#111827] border-b border-[#D9E4F2] pb-2">
            1. General & Support Lines
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">Platform Brand Name</label>
              <input
                type="text"
                value={formData.site_name || ''}
                onChange={(e) => handleChange('site_name', e.target.value)}
                className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-xs text-[#111827] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#374151] mb-1">Official WhatsApp Support</label>
              <input
                type="text"
                value={formData.support_whatsapp || ''}
                onChange={(e) => handleChange('support_whatsapp', e.target.value)}
                className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-xs text-[#111827] focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#374151] mb-1">Official Telegram Support Link</label>
              <input
                type="text"
                placeholder="https://t.me/earnsheet_official"
                value={formData.support_telegram || ''}
                onChange={(e) => handleChange('support_telegram', e.target.value)}
                className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-xs text-[#111827] focus:outline-none font-mono"
              />
              <span className="text-[10px] text-[#6B7280] mt-1 block">
                Clients are automatically redirected here from the deposit section and when accounts are unavailable.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-[#374151] mb-1">Official Support Email</label>
              <input
                type="email"
                value={formData.support_email || ''}
                onChange={(e) => handleChange('support_email', e.target.value)}
                className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-xs text-[#111827] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#374151] mb-1">Base Currency</label>
              <input
                type="text"
                value={formData.currency || 'PKR'}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-xs text-[#111827] focus:outline-none font-bold"
              />
            </div>
          </div>
        </div>

        {/* Financial Limits & Receiving Accounts */}
        <div className="admin-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-[#111827] border-b border-[#D9E4F2] pb-2">
            2. Receiving Payment Accounts & Limits
          </h2>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
            <span className="font-bold block text-amber-900">
              ⚠️ Deposit Accounts Availability Rule:
            </span>
            <p className="text-[11px] leading-relaxed text-amber-900">
              To make Easypaisa, JazzCash, or Bank Transfer available, enter the receiving title and account number below.
              <strong> If an account number is left empty, the deposit screen will display "Account Unavailable" and automatically guide the client to the Telegram application.</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">Minimum Deposit (PKR)</label>
              <input
                type="number"
                value={formData.min_deposit || '500'}
                onChange={(e) => handleChange('min_deposit', e.target.value)}
                className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-xs text-[#111827] focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#374151] mb-1">Minimum Withdrawal (PKR)</label>
              <input
                type="number"
                value={formData.min_withdrawal || '1000'}
                onChange={(e) => handleChange('min_withdrawal', e.target.value)}
                className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-xs text-[#111827] focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#374151] mb-1">Easypaisa Account Title</label>
              <input
                type="text"
                value={formData.easypaisa_title || ''}
                onChange={(e) => handleChange('easypaisa_title', e.target.value)}
                className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-xs text-[#111827] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#374151] mb-1">Easypaisa Account Number</label>
              <input
                type="text"
                value={formData.easypaisa_number || ''}
                onChange={(e) => handleChange('easypaisa_number', e.target.value)}
                className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-xs text-[#111827] focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#374151] mb-1">JazzCash Account Title</label>
              <input
                type="text"
                value={formData.jazzcash_title || ''}
                onChange={(e) => handleChange('jazzcash_title', e.target.value)}
                className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-xs text-[#111827] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#374151] mb-1">JazzCash Account Number</label>
              <input
                type="text"
                value={formData.jazzcash_number || ''}
                onChange={(e) => handleChange('jazzcash_number', e.target.value)}
                className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-xs text-[#111827] focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#374151] mb-1">Bank Name</label>
              <input
                type="text"
                value={formData.bank_name || ''}
                onChange={(e) => handleChange('bank_name', e.target.value)}
                className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-xs text-[#111827] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#374151] mb-1">Bank Account Title</label>
              <input
                type="text"
                value={formData.bank_title || ''}
                onChange={(e) => handleChange('bank_title', e.target.value)}
                className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-xs text-[#111827] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#374151] mb-1">Bank Account Number</label>
              <input
                type="text"
                value={formData.bank_account || ''}
                onChange={(e) => handleChange('bank_account', e.target.value)}
                className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-xs text-[#111827] focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#374151] mb-1">Bank IBAN</label>
              <input
                type="text"
                value={formData.bank_iban || ''}
                onChange={(e) => handleChange('bank_iban', e.target.value)}
                className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-xs text-[#111827] focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* 3. Spin Wheel System Status */}
        <div className="admin-card p-6 space-y-4">
          <div className="border-b border-[#D9E4F2] pb-3">
            <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#2563EB]" />
              <span>3. Spin Wheel System Status</span>
            </h2>
            <p className="text-[11px] text-[#6B7280] mt-0.5">
              Control global availability of the royal fortune wheel for entitled members.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">Global Spin Wheel Status</label>
              <select
                value={formData.spin_enabled || 'true'}
                onChange={(e) => handleChange('spin_enabled', e.target.value)}
                className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-xs text-[#111827] focus:outline-none bg-white font-semibold"
              >
                <option value="true">Enabled (Members can spin with entitlement)</option>
                <option value="false">Paused / Disabled Globally</option>
              </select>
              <span className="text-[10px] text-[#6B7280] mt-1 block">
                Controls the royal fortune wheel availability.
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Saving Settings...' : (
              <>
                <Save className="w-4 h-4" /> Save System Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
