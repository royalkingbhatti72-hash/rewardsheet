import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  CheckCheck,
  Crown,
  Clock,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../../api/client';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = () => {
    setLoading(true);
    api.getNotifications()
      .then((res) => setNotifications(res.notifications || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Bell className="w-7 h-7 text-[#FFD45A]" /> Notifications
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Real-time updates regarding your tasks, deposit approvals, and spin rewards.
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-[#214B91] text-xs font-semibold text-slate-200 transition-colors"
          >
            <CheckCheck className="w-4 h-4 text-[#22D3EE]" /> Mark All as Read
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading notifications...</div>
      ) : notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && handleMarkAsRead(n.id)}
              className={`royal-card p-4 rounded-2xl flex items-start justify-between gap-4 transition-all cursor-pointer ${
                !n.isRead ? 'border-[#2478FF] bg-[#1459E8]/10' : 'opacity-85'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    n.notificationType === 'SPIN_REWARD'
                      ? 'bg-[#792BFF]/20 text-[#792BFF]'
                      : n.notificationType.includes('STATUS')
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-[#1459E8]/20 text-[#22D3EE]'
                  }`}
                >
                  <Crown className="w-4 h-4" />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-white">{n.title}</h3>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#FFD45A]" />
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-slate-400 block pt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {!n.isRead && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkAsRead(n.id);
                  }}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                  title="Mark read"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#22D3EE]" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="royal-card p-12 text-center rounded-3xl">
          <p className="text-xs text-slate-400">You don't have any notifications right now.</p>
        </div>
      )}
    </div>
  );
};
