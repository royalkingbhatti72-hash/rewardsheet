import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Search,
  Edit2,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Save,
  Zap,
} from 'lucide-react';
import { api } from '../../api/client';

export const AdminTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [search, setSearch] = useState('');

  // Editing Modal State
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'details' | 'completion'>('details');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadTasks = () => {
    setLoading(true);
    api.getAdminTasks({ level: selectedLevel, search: search.trim() })
      .then((res) => setTasks(res.tasks || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTasks();
  }, [selectedLevel]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadTasks();
  };

  const handleOpenEdit = (task: any) => {
    setEditingTask({
      id: task.id,
      title: task.title,
      description: task.description,
      taskType: task.taskType,
      rewardAmount: task.rewardAmount,
      isPaid: task.isPaid,
      unlockFee: task.unlockFee,
      protectedUrl: task.protectedUrl || '',
      instructions: task.instructions,
      lockMessage: task.lockMessage,
      submissionInstructions: task.submissionInstructions,
      externalContact: task.externalContact || '',
      requiresAdminApproval: task.requiresAdminApproval,
      status: task.status,
    });
    setActiveModalTab('details');
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await api.updateAdminTask(editingTask.id, {
        ...editingTask,
        rewardAmount: parseFloat(editingTask.rewardAmount),
        unlockFee: parseFloat(editingTask.unlockFee || 0),
      });
      // Update only this task directly without reloading the whole table!
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id
            ? {
                ...t,
                ...editingTask,
                rewardAmount: parseFloat(editingTask.rewardAmount),
                unlockFee: parseFloat(editingTask.unlockFee || 0),
              }
            : t
        )
      );
      setMessage({ type: 'success', text: res.message });
      setEditingTask(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update task configuration' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#111827]">Task Management</h1>
        <p className="text-xs text-[#6B7280] mt-0.5">
          Configure task titles, descriptions, rewards in PKR, free vs paid status, and verification settings.
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

      {/* Level Filter Bar */}
      <div className="admin-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex-shrink-0 ${
                selectedLevel === lvl
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'bg-[#F8FAFD] text-[#4B5563] border border-[#D9E4F2] hover:bg-white'
              }`}
            >
              Level {lvl}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-72">
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-[#D9E4F2] rounded-lg px-3 py-1.5 text-xs text-[#111827] focus:outline-none focus:border-[#2563EB] h-9"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-[#2563EB] text-white font-semibold text-xs rounded-lg h-9"
          >
            Search
          </button>
        </form>
      </div>

      {/* Tasks Table */}
      <div className="admin-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-[#6B7280]">Loading level tasks...</div>
        ) : tasks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Task Title</th>
                  <th>Type</th>
                  <th>Reward (PKR)</th>
                  <th>Task Model</th>
                  <th>Pending Queue</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td className="font-bold text-[#2563EB]">#{task.taskNumber}</td>
                    <td className="font-semibold text-[#111827]">
                      {task.title}
                      <span className="block text-[10px] text-[#6B7280] font-normal truncate max-w-sm">
                        {task.description}
                      </span>
                    </td>
                    <td>
                      <span className="bg-[#EAF2FF] text-[#2563EB] font-semibold px-2 py-0.5 rounded text-[10px]">
                        {task.taskType}
                      </span>
                    </td>
                    <td className="font-bold text-[#111827]">PKR {task.rewardAmount.toLocaleString()}</td>
                    <td>
                      {task.isPaid ? (
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 font-semibold px-2 py-0.5 rounded text-[10px] flex items-center gap-1 w-fit">
                          <Zap className="w-3 h-3" /> Paid (Fee: PKR {task.unlockFee.toLocaleString()})
                        </span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold px-2 py-0.5 rounded text-[10px]">
                          Free Task
                        </span>
                      )}
                    </td>
                    <td>
                      {task._count?.submissions > 0 ? (
                        <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                          {task._count.submissions} Pending
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#9CA3AF]">None</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`font-semibold text-[10px] px-2 py-0.5 rounded-full ${
                          task.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => handleOpenEdit(task)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#EAF2FF] text-[#2563EB] font-semibold hover:bg-[#2563EB] hover:text-white transition-colors text-xs"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-xs text-[#6B7280]">No tasks found.</div>
        )}
      </div>

      {/* Section 23: Admin Task Editing Modal (800px width with two tabs) */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="admin-card w-full max-w-3xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header (Stays visible) */}
            <div className="p-5 border-b border-[#D9E4F2] flex items-center justify-between bg-white rounded-t-xl flex-shrink-0">
              <div>
                <span className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wider block">
                  Level {selectedLevel} Task #{editingTask.taskNumber} Configuration
                </span>
                <h2 className="text-base font-bold text-[#111827]">Edit Task Configuration</h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="p-1.5 text-[#6B7280] hover:text-[#111827] rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs Navigation */}
            <div className="flex items-center gap-2 px-6 pt-3 border-b border-[#D9E4F2] bg-[#F8FAFD] flex-shrink-0">
              <button
                type="button"
                onClick={() => setActiveModalTab('details')}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition-all ${
                  activeModalTab === 'details'
                    ? 'border-[#2563EB] text-[#2563EB]'
                    : 'border-transparent text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                1. Task Details
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('completion')}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition-all ${
                  activeModalTab === 'completion'
                    ? 'border-[#2563EB] text-[#2563EB]'
                    : 'border-transparent text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                2. Completion Settings
              </button>
            </div>

            {/* Modal Form Body (Scrollable) */}
            <form onSubmit={handleSaveTask} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {activeModalTab === 'details' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-[#374151] mb-1">Task Title *</label>
                      <input
                        type="text"
                        required
                        value={editingTask.title}
                        onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                        className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-xs text-[#111827] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#374151] mb-1">Task Type *</label>
                      <select
                        value={editingTask.taskType}
                        onChange={(e) => setEditingTask({ ...editingTask, taskType: e.target.value })}
                        className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-xs text-[#111827] focus:outline-none bg-white"
                      >
                        <option value="Social Media">Social Media</option>
                        <option value="YouTube Promotion">YouTube Promotion</option>
                        <option value="Follow Page">Follow Page</option>
                        <option value="Comment on Post">Comment on Post</option>
                        <option value="Watch Video">Watch Video</option>
                        <option value="Join Group">Join Group</option>
                        <option value="App Installation">App Installation</option>
                        <option value="Survey">Survey</option>
                        <option value="Referral">Referral</option>
                        <option value="Custom Task">Custom Task</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#374151] mb-1">Task Description *</label>
                    <textarea
                      rows={2}
                      required
                      value={editingTask.description}
                      onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                      className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-xs text-[#111827] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-semibold text-[#374151] mb-1">Reward in PKR *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={editingTask.rewardAmount}
                        onChange={(e) => setEditingTask({ ...editingTask, rewardAmount: e.target.value })}
                        className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-xs text-[#111827] focus:outline-none font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#374151] mb-1">Task Model</label>
                      <div className="flex items-center gap-3 pt-2">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="isPaid"
                            checked={!editingTask.isPaid}
                            onChange={() => setEditingTask({ ...editingTask, isPaid: false, unlockFee: 0 })}
                          />
                          <span>Free Task</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="isPaid"
                            checked={editingTask.isPaid}
                            onChange={() => setEditingTask({ ...editingTask, isPaid: true, unlockFee: editingTask.unlockFee || 5000 })}
                          />
                          <span className="font-bold text-amber-700">Paid Task</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#374151] mb-1">Unlock Fee in PKR</label>
                      <input
                        type="number"
                        disabled={!editingTask.isPaid}
                        min="0"
                        value={editingTask.unlockFee}
                        onChange={(e) => setEditingTask({ ...editingTask, unlockFee: e.target.value })}
                        className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-xs text-[#111827] focus:outline-none disabled:bg-slate-100 font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#374151] mb-1">
                      Protected External Task URL (Masked until unlocked)
                    </label>
                    <input
                      type="url"
                      value={editingTask.protectedUrl}
                      onChange={(e) => setEditingTask({ ...editingTask, protectedUrl: e.target.value })}
                      placeholder="https://t.me/example or https://youtube.com/..."
                      className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-xs text-[#111827] focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#374151] mb-1">
                      Protected Step-by-Step Instructions *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={editingTask.instructions}
                      onChange={(e) => setEditingTask({ ...editingTask, instructions: e.target.value })}
                      className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-xs text-[#111827] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#374151] mb-1">
                      Configurable Lock Message (Displayed when locked) *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingTask.lockMessage}
                      onChange={(e) => setEditingTask({ ...editingTask, lockMessage: e.target.value })}
                      className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-xs text-[#111827] focus:outline-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="p-3 bg-[#F8FAFD] border border-[#D9E4F2] rounded-lg space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-[#111827]">
                        <input
                          type="checkbox"
                          checked={editingTask.requiresAdminApproval}
                          onChange={(e) => setEditingTask({ ...editingTask, requiresAdminApproval: e.target.checked })}
                          className="w-4 h-4 text-[#2563EB]"
                        />
                        <span>Requires Administrator Verification (Recommended)</span>
                      </label>
                      <p className="text-[11px] text-[#6B7280]">
                        When checked, task submissions queue in the Submissions dashboard for manual screenshot review before rewards are credited.
                      </p>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#374151] mb-1">
                        Submission Instructions for Users *
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={editingTask.submissionInstructions}
                        onChange={(e) => setEditingTask({ ...editingTask, submissionInstructions: e.target.value })}
                        className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-xs text-[#111827] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#374151] mb-1">
                        External Contact / Verification Desk (Optional)
                      </label>
                      <input
                        type="text"
                        value={editingTask.externalContact}
                        onChange={(e) => setEditingTask({ ...editingTask, externalContact: e.target.value })}
                        placeholder="e.g. Official WhatsApp line or support desk reference"
                        className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-xs text-[#111827] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#374151] mb-1">Task Status</label>
                      <select
                        value={editingTask.status}
                        onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}
                        className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-xs text-[#111827] focus:outline-none bg-white"
                      >
                        <option value="ACTIVE">Active (Accessible to eligible members)</option>
                        <option value="DISABLED">Disabled (Hidden / Locked)</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Footer (Stays visible) */}
              <div className="pt-4 border-t border-[#D9E4F2] flex items-center justify-end gap-3 flex-shrink-0 bg-white">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 border border-[#D9E4F2] rounded-lg text-[#4B5563] font-semibold text-xs hover:bg-[#F8FAFD]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#2563EB] text-white font-semibold text-xs rounded-lg hover:bg-[#1D4ED8] shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving ? (
                    'Saving Changes...'
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Task Configuration
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
