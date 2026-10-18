import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CheckSquare,
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  Share2,
  Clock,
  Layers,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  FileCheck2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../api/client';

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [gridData, setGridData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getAdminDashboard(), api.getTaskGrid()])
      .then(([dashRes, gridRes]) => {
        setData(dashRes);
        setGridData(gridRes.grid || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-[#2563EB]/20 border-t-[#2563EB] rounded-full animate-spin" />
      </div>
    );
  }

  const { metrics, recentActivity = [], recentTransactions = [] } = data || {};

  return (
    <div className="space-y-6">
      {/* Top Header Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#111827]">Administrative Overview</h1>
        <p className="text-xs text-[#6B7280] mt-0.5">
          Real-time platform metrics, 10x10 task grid, financial queues, and audit trails.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Users */}
        <div className="admin-card p-4">
          <span className="text-[11px] font-semibold text-[#6B7280] block">Total Members</span>
          <span className="text-xl font-bold text-[#111827] block mt-1">
            {metrics?.totalUsers?.toLocaleString() || 0}
          </span>
          <span className="text-[10px] text-emerald-600 font-medium">
            {metrics?.activeUsers?.toLocaleString() || 0} active
          </span>
        </div>

        {/* Pending Task Submissions */}
        <Link to="/adminpanal/submissions" className="admin-card p-4 hover:border-[#2563EB] transition-colors">
          <span className="text-[11px] font-semibold text-[#6B7280] block">Pending Tasks</span>
          <span className="text-xl font-bold text-[#2563EB] block mt-1">
            {metrics?.pendingSubmissions || 0}
          </span>
          <span className="text-[10px] text-[#2563EB] font-medium flex items-center gap-1">
            Review Queue <ChevronRight className="w-3 h-3" />
          </span>
        </Link>

        {/* Pending Deposits */}
        <Link to="/adminpanal/deposits" className="admin-card p-4 hover:border-[#2563EB] transition-colors">
          <span className="text-[11px] font-semibold text-[#6B7280] block">Pending Deposits</span>
          <span className="text-xl font-bold text-amber-600 block mt-1">
            {metrics?.pendingDeposits || 0}
          </span>
          <span className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
            Verify Payments <ChevronRight className="w-3 h-3" />
          </span>
        </Link>

        {/* Pending Withdrawals */}
        <Link to="/adminpanal/withdrawals" className="admin-card p-4 hover:border-[#2563EB] transition-colors">
          <span className="text-[11px] font-semibold text-[#6B7280] block">Pending Payouts</span>
          <span className="text-xl font-bold text-red-600 block mt-1">
            {metrics?.pendingWithdrawals || 0}
          </span>
          <span className="text-[10px] text-red-600 font-medium flex items-center gap-1">
            Review Requests <ChevronRight className="w-3 h-3" />
          </span>
        </Link>

        {/* Total Deposits Sum */}
        <div className="admin-card p-4">
          <span className="text-[11px] font-semibold text-[#6B7280] block">Deposited PKR</span>
          <span className="text-xl font-bold text-emerald-700 block mt-1 truncate">
            PKR {metrics?.totalDepositsAmount?.toLocaleString() || 0}
          </span>
          <span className="text-[10px] text-[#6B7280]">Approved in bank</span>
        </div>

        {/* Total Paid Withdrawals Sum */}
        <div className="admin-card p-4">
          <span className="text-[11px] font-semibold text-[#6B7280] block">Paid Payouts</span>
          <span className="text-xl font-bold text-blue-700 block mt-1 truncate">
            PKR {metrics?.totalPaidWithdrawalsAmount?.toLocaleString() || 0}
          </span>
          <span className="text-[10px] text-[#6B7280]">Disbursed to members</span>
        </div>
      </div>

      {/* 10x10 Task Status Overview Grid (Section 15) */}
      <div className="admin-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#2563EB]" /> 10x10 Task Status Overview Grid
            </h2>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Matrix of all 100 task slots across Levels 1–10. Shows configuration status and pending submissions.
            </p>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-2 text-[10px]">
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
              Active Task
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              Pending Submissions
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
              VIP Paid Task
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
              Disabled
            </span>
          </div>
        </div>

        {/* The 10x10 Table */}
        <div className="overflow-x-auto border border-[#D9E4F2] rounded-lg">
          <table className="w-full text-center text-xs">
            <thead>
              <tr className="bg-[#F8FAFD] border-b border-[#D9E4F2] text-[#4B5563] font-semibold text-[11px]">
                <th className="py-2.5 px-3 text-left w-32 border-r border-[#D9E4F2]">Level</th>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((t) => (
                  <th key={t} className="py-2.5 px-1.5 border-r border-[#D9E4F2] w-16">
                    Task {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9E4F2]">
              {gridData.map((row) => (
                <tr key={row.levelId} className="hover:bg-[#F8FAFD]/50 transition-colors">
                  <td className="py-2.5 px-3 text-left font-bold text-[#111827] border-r border-[#D9E4F2] whitespace-nowrap bg-[#FAFCFF]">
                    <span className="text-[#2563EB]">Level {row.levelNumber}</span>
                    <span className="block text-[10px] text-[#6B7280] font-normal truncate max-w-[120px]">
                      {row.levelTitle}
                    </span>
                  </td>

                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((t) => {
                    const task = row.tasks[`task${t}`];
                    const hasPending = (task?.pendingSubmissionsCount || 0) > 0;
                    const isPaid = task?.isPaid;

                    let bgClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                    let label = 'Active';

                    if (hasPending) {
                      bgClass = 'bg-blue-100 text-blue-800 border-blue-300 font-bold animate-pulse';
                      label = `${task.pendingSubmissionsCount} Rev`;
                    } else if (isPaid) {
                      bgClass = 'bg-amber-50 text-amber-800 border-amber-200 font-semibold';
                      label = 'VIP Fee';
                    } else if (task?.status === 'DISABLED') {
                      bgClass = 'bg-slate-100 text-slate-500 border-slate-200';
                      label = 'Off';
                    }

                    return (
                      <td key={t} className="p-1 border-r border-[#D9E4F2]">
                        <Link
                          to={hasPending ? `/adminpanal/submissions?level=${row.levelNumber}` : `/adminpanal/tasks?level=${row.levelNumber}`}
                          className={`block py-1.5 px-1 rounded border text-[10px] transition-all hover:scale-105 ${bgClass}`}
                          title={`${task?.title || ''} (Reward: PKR ${task?.rewardAmount || 0})`}
                        >
                          <span className="block font-bold">{label}</span>
                          <span className="block text-[8px] opacity-75">
                            {task?.rewardAmount ? `PKR ${task.rewardAmount}` : ''}
                          </span>
                        </Link>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Layout: Recent Transactions & Recent Admin Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="admin-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#111827]">Recent Platform Ledger Transactions</h3>
            <Link to="/adminpanal/transactions" className="text-xs text-[#2563EB] font-semibold hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-2">
            {recentTransactions.map((tx: any) => (
              <div
                key={tx.id}
                className="p-3 bg-[#F8FAFD] border border-[#EDF1F7] rounded-lg flex items-center justify-between text-xs"
              >
                <div className="min-w-0 pr-3">
                  <p className="font-semibold text-[#111827] truncate">{tx.reason}</p>
                  <p className="text-[10px] text-[#6B7280]">
                    Member: {tx.user?.name || 'User'} ({tx.user?.phone || 'N/A'}) • {new Date(tx.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right whitespace-nowrap">
                  <span className={`font-bold block ${tx.amount > 0 ? 'text-emerald-600' : 'text-[#111827]'}`}>
                    {tx.amount > 0 ? '+' : ''}PKR {Math.abs(tx.amount).toLocaleString()}
                  </span>
                  <span className="text-[9px] text-[#6B7280] uppercase">{tx.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Logs */}
        <div className="admin-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#111827]">Recent Administrator Audit Logs</h3>
            <Link to="/adminpanal/activity-logs" className="text-xs text-[#2563EB] font-semibold hover:underline">
              View Audit Log
            </Link>
          </div>

          <div className="space-y-2">
            {recentActivity.map((log: any) => (
              <div
                key={log.id}
                className="p-3 bg-[#F8FAFD] border border-[#EDF1F7] rounded-lg text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#111827]">{log.action.replace(/_/g, ' ')}</span>
                  <span className="text-[10px] text-[#6B7280]">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-[11px] text-[#4B5563]">
                  Admin: <strong className="text-[#2563EB]">{log.adminUsername}</strong> • Entity: {log.entityType} ({log.entityId.slice(-6)})
                </p>
                {log.reason && (
                  <p className="text-[10px] text-[#6B7280] italic">Reason: {log.reason}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
