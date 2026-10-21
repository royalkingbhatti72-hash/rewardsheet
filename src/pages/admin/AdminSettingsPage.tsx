import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, AlertCircle, Users, ShieldCheck, Info } from 'lucide-react';
import { api } from '../../api/client';

export const AdminSettingsPage: React.FC = () => {
  const [settingsList, setSettingsList] = useState<any[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
          Configure official receiving bank & mobile accounts, limits, referral bonuses, and brand details.
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

        {/* 3. Affiliate & Referral Network Architecture (Complete Management) */}
        <div className="admin-card p-6 space-y-6">
          <div className="border-b border-[#D9E4F2] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#2563EB]" />
                <span>3. Affiliate & Referral Program Settings</span>
              </h2>
              <p className="text-[11px] text-[#6B7280] mt-0.5">
                Configure commission values, qualification triggers, ambassador tier thresholds, and anti-fraud rules.
              </p>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1 w-fit">
              <ShieldCheck className="w-3 h-3 text-emerald-600" /> Auto-Payout Active
            </span>
          </div>

          {/* Easy-to-Understand Affiliate Pipeline Explainer */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 via-slate-50 to-indigo-50 border border-blue-200 text-xs space-y-3">
            <h3 className="font-bold text-[#1E3A8A] flex items-center gap-1.5 text-xs">
              <Info className="w-4 h-4 text-[#2563EB]" /> How the Affiliate Commission Pipeline Works
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 text-[11px]">
              <div className="p-2.5 bg-white rounded-lg border border-blue-100 space-y-0.5">
                <span className="font-bold text-[#2563EB] block">1. Member Shares Link</span>
                <p className="text-[#4B5563]">Member copies referral link or displays Royal QR Code.</p>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-blue-100 space-y-0.5">
                <span className="font-bold text-[#2563EB] block">2. Partner Registers</span>
                <p className="text-[#4B5563]">Partner joins. Relationship is tracked in system.</p>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-blue-100 space-y-0.5">
                <span className="font-bold text-emerald-700 block">3. Qualification Met</span>
                <p className="text-[#4B5563]">Partner fulfills the qualification rule chosen below.</p>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-blue-100 space-y-0.5">
                <span className="font-bold text-amber-700 block">4. Instant Cash Credit</span>
                <p className="text-[#4B5563]">Commission is automatically added to inviter's wallet.</p>
              </div>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Commission per Referral */}
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Commission per Qualified Referral (PKR)
              </label>
              <input
                type="number"
                value={formData.referral_reward || '250'}
                onChange={(e) => handleChange('referral_reward', e.target.value)}
                className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-xs text-[#111827] focus:outline-none font-bold"
              />
              <span className="text-[10px] text-[#6B7280] mt-1 block">
                Cash credited directly to the inviter's wallet balance upon partner qualification.
              </span>
            </div>

            {/* Qualification Trigger Rule */}
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Partner Qualification Trigger Criteria
              </label>
              <select
                value={formData.referral_qualifying_condition || 'FIRST_TASK_APPROVED'}
                onChange={(e) => handleChange('referral_qualifying_condition', e.target.value)}
                className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-xs text-[#111827] focus:outline-none bg-white font-semibold"
              >
                <option value="FIRST_TASK_APPROVED">First Task Approved — Partner completes 1st task (Recommended)</option>
                <option value="LEVEL_1_COMPLETED">Level 1 Completed — Partner completes all 10 Level 1 tasks</option>
                <option value="FIRST_DEPOSIT_COMPLETED">First Deposit — Partner makes a verified deposit</option>
                <option value="INSTANT_ON_REGISTRATION">Instant — Commission credits immediately on sign-up</option>
              </select>
              <span className="text-[10px] text-[#6B7280] mt-1 block">
                Determines when a pending referral transitions to "QUALIFIED" and triggers the bonus.
              </span>
            </div>

            {/* Bronze Ambassador Target */}
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Bronze Ambassador Target (Invites)
              </label>
              <input
                type="number"
                value={formData.affiliate_bronze_target || '5'}
                onChange={(e) => handleChange('affiliate_bronze_target', e.target.value)}
                className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-xs text-[#111827] focus:outline-none"
              />
              <span className="text-[10px] text-[#6B7280] mt-1 block">
                Starter tier for new affiliates (Standard PKR 250 commissions).
              </span>
            </div>

            {/* Silver Ambassador Target */}
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Silver Ambassador Target (Invites)
              </label>
              <input
                type="number"
                value={formData.affiliate_silver_target || '15'}
                onChange={(e) => handleChange('affiliate_silver_target', e.target.value)}
                className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-xs text-[#111827] focus:outline-none"
              />
              <span className="text-[10px] text-[#6B7280] mt-1 block">
                Unlocks Free Milestone Spin entitlement upon reaching this count.
              </span>
            </div>

            {/* Gold Ambassador Target */}
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Gold Ambassador Target (Invites)
              </label>
              <input
                type="number"
                value={formData.affiliate_gold_target || '30'}
                onChange={(e) => handleChange('affiliate_gold_target', e.target.value)}
                className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-xs text-[#111827] focus:outline-none"
              />
              <span className="text-[10px] text-[#6B7280] mt-1 block">
                Unlocks PKR 5,000 Milestone Cash Bonus + VIP Fast Withdrawal priority.
              </span>
            </div>

            {/* Global Affiliate Program Status */}
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Affiliate Program System Status
              </label>
              <select
                value={formData.affiliate_program_enabled || 'true'}
                onChange={(e) => handleChange('affiliate_program_enabled', e.target.value)}
                className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-xs text-[#111827] focus:outline-none bg-white font-semibold"
              >
                <option value="true">Enabled (Accepting referrals & payouts)</option>
                <option value="false">Paused / Disabled</option>
              </select>
              <span className="text-[10px] text-[#6B7280] mt-1 block">
                Toggle global affiliate tracking on or off.
              </span>
            </div>

            {/* Anti-Fraud Multi-Account Protection */}
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Anti-Fraud Multi-Account Filter
              </label>
              <select
                value={formData.affiliate_anti_fraud || 'true'}
                onChange={(e) => handleChange('affiliate_anti_fraud', e.target.value)}
                className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-xs text-[#111827] focus:outline-none bg-white font-semibold"
              >
                <option value="true">Enabled (Prevents self-referrals & fake signups)</option>
                <option value="false">Disabled (Testing Mode)</option>
              </select>
              <span className="text-[10px] text-[#6B7280] mt-1 block">
                Protects platform treasury against automated self-referrals.
              </span>
            </div>

            {/* Global Spin Status */}
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

            {/* Default Affiliate Share Template */}
            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#374151] mb-1">
                Default 1-Click Social Share Template (WhatsApp / Telegram)
              </label>
              <textarea
                rows={2}
                value={formData.affiliate_share_template || ''}
                onChange={(e) => handleChange('affiliate_share_template', e.target.value)}
                placeholder="👑 Join Earn Street with code {CODE} and earn daily cash rewards! Register here: {LINK}"
                className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-xs text-[#111827] focus:outline-none font-mono"
              />
              <span className="text-[10px] text-[#6B7280] mt-1 block">
                Use {'{CODE}'} for member referral code and {'{LINK}'} for personal invite URL.
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
