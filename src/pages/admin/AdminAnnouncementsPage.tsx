import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../api/client';

export const AdminAnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadAnnouncements = () => {
    setLoading(true);
    api.getAdminAnnouncements()
      .then((res) => setAnnouncements(res.announcements || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setPublishing(true);
    setMessage(null);

    try {
      const res = await api.createAnnouncement({ title, content, audience: 'ALL', status: 'ACTIVE' });
      setMessage({ type: 'success', text: res.message });
      setTitle('');
      setContent('');
      loadAnnouncements();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Publishing failed' });
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteAnnouncement(id);
      loadAnnouncements();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#111827]">Announcement Management</h1>
        <p className="text-xs text-[#6B7280] mt-0.5">
          Publish real-time news bulletins and notifications to all registered members.
        </p>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-center justify-between ${
            message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{message.text}</span>
        </div>
      )}

      {/* Publish Form */}
      <div className="admin-card p-6 space-y-4">
        <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-[#2563EB]" /> Publish New Bulletin
        </h2>

        <form onSubmit={handleCreate} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-[#374151] mb-1">Bulletin Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Grand Multiplier Launch"
              className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-xs text-[#111827] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#374151] mb-1">Message Content *</label>
            <textarea
              rows={3}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter announcement text visible on user dashboard..."
              className="w-full border border-[#D9E4F2] focus:border-[#2563EB] rounded-lg p-2.5 text-xs text-[#111827] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={publishing}
            className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs rounded-lg shadow-sm transition-all disabled:opacity-50"
          >
            {publishing ? 'Publishing...' : 'Publish Announcement'}
          </button>
        </form>
      </div>

      {/* Current Bulletins */}
      <div className="admin-card p-6 space-y-4">
        <h2 className="text-sm font-bold text-[#111827]">Active Platform Bulletins</h2>

        {announcements.length > 0 ? (
          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="p-4 bg-[#F8FAFD] border border-[#EDF1F7] rounded-lg flex items-start justify-between gap-4 text-xs"
              >
                <div>
                  <h3 className="font-bold text-sm text-[#111827]">{ann.title}</h3>
                  <p className="text-[#4B5563] mt-1 leading-relaxed">{ann.content}</p>
                  <span className="text-[10px] text-[#6B7280] block mt-2">
                    Published: {new Date(ann.createdAt).toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(ann.id)}
                  className="p-1.5 text-[#6B7280] hover:text-red-600 rounded-md"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#6B7280]">No active bulletins published.</p>
        )}
      </div>
    </div>
  );
};
