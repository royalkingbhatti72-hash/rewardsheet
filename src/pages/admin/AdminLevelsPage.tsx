import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Edit2, CheckCircle2, Save, X, MessageSquare, AlertCircle } from 'lucide-react';
import { api } from '../../api/client';

export const AdminLevelsPage: React.FC = () => {
  const [levels, setLevels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'levels' | 'withdrawal_notices'>('levels');
  const [editingLevel, setEditingLevel] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingNoticeId, setSavingNoticeId] = useState<string | null>(null);
  const [noticeInputs, setNoticeInputs] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadLevels = () => {
    setLoading(true);
    api.getAdminLevels()
      .then((res) => {
        const lvls = res.levels || [];
        setLevels(lvls);
        const notices: Record<string, string> = {};
        for (const l of lvls) {
          notices[l.id] = l.withdrawalNotice || '';
        }
        setNoticeInputs(notices);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLevels();
  }, []);

  const handleSaveLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLevel) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await api.updateAdminLevel(editingLevel.id, {
        title: editingLevel.title,
        description: editingLevel.description,
        completionReward: 0,
        status: editingLevel.status,
        withdrawalNotice: editingLevel.withdrawalNotice || null,
      });

      setLevels((prev) =>
        prev.map((l) =>
          l.id === editingLevel.id
            ? {
                ...l,
                title: editingLevel.title,
                description: editingLevel.description,
                completionReward: 0,
                status: editingLevel.status,
                withdrawalNotice: editingLevel.withdrawalNotice,
              }
            : l
        )
      );
      setNoticeInputs((prev) => ({
        ...prev,
        [editingLevel.id]: editingLevel.withdrawalNotice || '',
      }));
      setMessage({ type: 'success', text: res.message || 'Level updated successfully' });
      setEditingLevel(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Level update failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNoticeOnly = async (level: any) => {
    const noticeText = noticeInputs[level.id] ?? level.withdrawalNotice ?? '';
    setSavingNoticeId(level.id);
    setMessage(null);

    try {
      const res = await api.updateAdminLevel(level.id, {
        title: level.title,
        description: level.description,
        completionReward: 0,
        status: level.status,
        withdrawalNotice: noticeText,
      });

      setLevels((prev) =>
        prev.map((l) =>
          l.id === level.id ? { ...l, withdrawalNotice: noticeText } : l
        )
      );
      setMessage({
        type: 'success',
        text: `Level ${level.levelNumber} withdrawal notice updated successfully!`,
      });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || `Failed to update Level ${level.levelNumber} notice`,
      });
    } finally {
      setSavingNoticeId(null);
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#111827]">Level Management</h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Configure the 10 standard levels, descriptions, and level-specific withdrawal requirement notices.
          </p>
        </div>

        {/* View Tabs */}
        <div className="flex items-center bg-[#F1F5F9] p-1 rounded-xl self-start sm:self-auto border border-[#E2E8F0]">
          <button
            onClick={() => setActiveTab('levels')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'levels'
                ? 'bg-white text-[#2563EB] shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Level Cards</span>
          </button>
          <button
            onClick={() => setActiveTab('withdrawal_notices')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'withdrawal_notices'
                ? 'bg-white text-[#2563EB] shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
            <span>Withdrawal Notices (10 Levels)</span>
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Tab 1: Level Cards View */}
      {activeTab === 'levels' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {levels.map((lvl) => (
            <div key={lvl.id} className="admin-card p-5 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-[#EAF2FF] text-[#2563EB] font-bold text-xs flex items-center justify-center">
                      L{lvl.levelNumber}
                    </span>
                    <div>
                      <h3 className="font-bold text-sm text-[#111827]">{lvl.title}</h3>
                      <span className="text-[10px] text-[#6B7280]">10 Standard Task Slots</span>
                    </div>
                  </div>
                  <span className="bg-blue-50 text-[#2563EB] font-bold px-2.5 py-1 rounded-full text-xs">
                    {lvl.requiredTaskCount || 10} Tasks
                  </span>
                </div>

                <p className="text-xs text-[#4B5563]">{lvl.description}</p>

                {/* Level-Specific Withdrawal Notice Display */}
                <div className="bg-[#F8FAFD] border border-[#D9E4F2] rounded-lg p-2.5 text-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] flex items-center gap-1">
                    <MessageSquare className="w-3 h-3 text-amber-500" /> Withdrawal Page Notice
                  </span>
                  <p className="text-[#374151] font-medium text-xs leading-relaxed">
                    💡 {lvl.withdrawalNotice || 'Complete this level to unlock the withdrawal panel.'}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#D9E4F2] flex items-center justify-between text-xs mt-auto">
                <Link
                  to={`/adminpanal/tasks?level=${lvl.levelNumber}`}
                  className="text-[#2563EB] font-semibold hover:underline"
                >
                  View 10 Tasks →
                </Link>
                <button
                  onClick={() => setEditingLevel(lvl)}
                  className="px-2.5 py-1 rounded bg-[#F8FAFD] border border-[#D9E4F2] text-[#111827] font-semibold hover:bg-white text-xs flex items-center gap-1 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Level
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Withdrawal Notices Quick Management (All 10 Levels) */}
      {activeTab === 'withdrawal_notices' && (
        <div className="space-y-4">
          <div className="admin-card p-5 bg-gradient-to-r from-blue-50/70 to-indigo-50/50 border border-blue-200/70">
            <h2 className="text-sm font-bold text-[#1E3A8A] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#2563EB]" />
              Manage Level-Specific Withdrawal Page Notices
            </h2>
            <p className="text-xs text-[#3B82F6] mt-1 leading-relaxed">
              Customize the exact prompt or instruction displayed in the client's Withdrawal Panel for each level. For example, specify completing Level 1 for Level 1 withdrawal, or completing any single Level 4 task for Level 4 reward withdrawal.
            </p>
          </div>

          <div className="space-y-3">
            {levels.map((lvl) => {
              const currentInput = noticeInputs[lvl.id] ?? lvl.withdrawalNotice ?? '';
              const isSavingThis = savingNoticeId === lvl.id;
              const hasChanged = currentInput !== (lvl.withdrawalNotice || '');

              return (
                <div
                  key={lvl.id}
                  className="admin-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3.5 hover:border-[#2563EB]/40 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-[180px]">
                    <span className="w-9 h-9 rounded-xl bg-[#2563EB] text-white font-black text-xs flex items-center justify-center shadow-sm">
                      L{lvl.levelNumber}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-[#111827]">{lvl.title}</h4>
                      <span className="text-[10px] text-[#6B7280]">
                        {lvl.levelNumber === 4 ? 'Any 1 Task unlocks L5' : `${lvl.requiredTaskCount || 10} Tasks Required`}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <label className="block text-[10px] uppercase font-bold text-[#6B7280] mb-1">
                      Withdrawal Notice for Users on Level {lvl.levelNumber}
                    </label>
                    <textarea
                      rows={2}
                      value={currentInput}
                      onChange={(e) =>
                        setNoticeInputs((prev) => ({ ...prev, [lvl.id]: e.target.value }))
                      }
                      placeholder={
                        lvl.levelNumber === 4
                          ? 'e.g. Complete any of the tasks from Level 4 to unlock the withdrawal panel for Level 4 reward'
                          : `e.g. Complete Level ${lvl.levelNumber} to unlock the withdrawal panel for the withdrawal`
                      }
                      className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-xs text-[#111827] bg-[#F8FAFD] focus:bg-white focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      type="button"
                      disabled={isSavingThis}
                      onClick={() => handleSaveNoticeOnly(lvl)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                        hasChanged
                          ? 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'
                          : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                      }`}
                    >
                      {isSavingThis ? (
                        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>{isSavingThis ? 'Saving...' : 'Save Notice'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Level Modal */}
      {editingLevel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="admin-card p-6 w-full max-w-lg bg-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#D9E4F2]">
              <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-[#2563EB] text-white text-xs flex items-center justify-center font-bold">
                  L{editingLevel.levelNumber}
                </span>
                Edit Level {editingLevel.levelNumber} Configuration
              </h2>
              <button onClick={() => setEditingLevel(null)} className="p-1 text-[#6B7280]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLevel} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#374151] mb-1">Level Title *</label>
                <input
                  type="text"
                  required
                  value={editingLevel.title}
                  onChange={(e) => setEditingLevel({ ...editingLevel, title: e.target.value })}
                  className="w-full border border-[#D9E4F2] rounded-lg p-2 text-xs focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">Description *</label>
                <textarea
                  rows={2}
                  required
                  value={editingLevel.description}
                  onChange={(e) => setEditingLevel({ ...editingLevel, description: e.target.value })}
                  className="w-full border border-[#D9E4F2] rounded-lg p-2 text-xs focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              {/* Level-Specific Withdrawal Notice Input */}
              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  Withdrawal Page Notice for Level {editingLevel.levelNumber} *
                </label>
                <p className="text-[11px] text-[#6B7280] mb-1.5 leading-relaxed">
                  Shown dynamically in the user's Withdrawal panel when they are on Level {editingLevel.levelNumber}.
                </p>
                <textarea
                  rows={2}
                  required
                  placeholder={
                    editingLevel.levelNumber === 4
                      ? 'e.g. Complete any of the tasks from Level 4 to unlock the withdrawal panel for Level 4 reward'
                      : `e.g. Complete Level ${editingLevel.levelNumber} to unlock the withdrawal panel for the withdrawal`
                  }
                  value={editingLevel.withdrawalNotice || ''}
                  onChange={(e) =>
                    setEditingLevel({ ...editingLevel, withdrawalNotice: e.target.value })
                  }
                  className="w-full border border-[#D9E4F2] rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#D9E4F2]">
                <button
                  type="button"
                  onClick={() => setEditingLevel(null)}
                  className="px-4 py-2 border border-[#D9E4F2] rounded-lg text-[#4B5563] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-[#2563EB] text-white font-semibold rounded-lg hover:bg-[#1D4ED8]"
                >
                  {saving ? 'Saving...' : 'Save Level'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
