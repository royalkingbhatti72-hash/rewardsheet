import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Edit2, CheckCircle2, Crown, Save, X } from 'lucide-react';
import { api } from '../../api/client';

export const AdminLevelsPage: React.FC = () => {
  const [levels, setLevels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLevel, setEditingLevel] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadLevels = () => {
    setLoading(true);
    api.getAdminLevels()
      .then((res) => setLevels(res.levels || []))
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
        completionReward: parseFloat(editingLevel.completionReward),
        status: editingLevel.status,
      });
      // Update only this level directly without reloading the whole table!
      setLevels((prev) =>
        prev.map((l) =>
          l.id === editingLevel.id
            ? {
                ...l,
                title: editingLevel.title,
                description: editingLevel.description,
                completionReward: parseFloat(editingLevel.completionReward),
                status: editingLevel.status,
              }
            : l
        )
      );
      setMessage({ type: 'success', text: res.message });
      setEditingLevel(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Level update failed' });
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
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#111827]">Level Management</h1>
        <p className="text-xs text-[#6B7280] mt-0.5">
          Configure the 10 standard levels, completion rewards, and descriptions. Level 10 is the final standard level.
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {levels.map((lvl) => (
          <div key={lvl.id} className="admin-card p-5 space-y-3">
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
              <span className="bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full text-xs">
                Bonus: PKR {lvl.completionReward.toLocaleString()}
              </span>
            </div>

            <p className="text-xs text-[#4B5563]">{lvl.description}</p>

            <div className="pt-3 border-t border-[#D9E4F2] flex items-center justify-between text-xs">
              <Link
                to={`/adminpanal/tasks?level=${lvl.levelNumber}`}
                className="text-[#2563EB] font-semibold hover:underline"
              >
                View 10 Tasks →
              </Link>
              <button
                onClick={() => setEditingLevel(lvl)}
                className="px-2.5 py-1 rounded bg-[#F8FAFD] border border-[#D9E4F2] text-[#111827] font-semibold hover:bg-white text-xs flex items-center gap-1"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Level
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Level Modal */}
      {editingLevel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="admin-card p-6 w-full max-w-md bg-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#D9E4F2]">
              <h2 className="text-sm font-bold text-[#111827]">
                Edit Level {editingLevel.levelNumber}
              </h2>
              <button onClick={() => setEditingLevel(null)} className="p-1 text-[#6B7280]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLevel} className="space-y-3 text-xs">
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

              <div>
                <label className="block font-semibold text-[#374151] mb-1">Completion Reward in PKR *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={editingLevel.completionReward}
                  onChange={(e) => setEditingLevel({ ...editingLevel, completionReward: e.target.value })}
                  className="w-full border border-[#D9E4F2] rounded-lg p-2 text-xs font-bold focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
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
