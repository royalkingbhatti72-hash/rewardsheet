import React, { useState, useEffect } from 'react';
import { BarChart3, Download, TrendingUp, DollarSign, Users, Award } from 'lucide-react';
import { api } from '../../api/client';

export const AdminReportsPage: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminReports()
      .then(setReport)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleExportCSV = () => {
    if (!report?.summary) return;
    const rows = [
      ['Metric', 'Value (PKR / Count)'],
      ['Total Registered Members', report.summary.totalUsers],
      ['Total Approved Deposits', report.summary.totalDeposited],
      ['Total Disbursed Payouts (Paid)', report.summary.totalPaidWithdrawals],
      ['Pending Withdrawal Reservations', report.summary.totalPendingWithdrawals],
      ['Total Approved Task Rewards', report.summary.totalTaskRewards],
      ['Total Collected Unlock Fees', report.summary.totalUnlockFees],
      ['Total Referral Bonuses Paid', report.summary.totalReferralRewards],
      ['Total Spin Rewards Awarded', report.summary.totalSpinRewards],
      ['Platform Net Cashflow', report.summary.platformNetYield],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `royal_rewards_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-[#2563EB]/20 border-t-[#2563EB] rounded-full animate-spin" />
      </div>
    );
  }

  const { summary } = report || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#111827]">Financial Reports & Intelligence</h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Aggregated metrics computed directly from database ledger records with exportable CSV data.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs rounded-lg shadow-sm transition-all self-start sm:self-center"
        >
          <Download className="w-4 h-4" /> Export CSV Report
        </button>
      </div>

      {/* Primary Financial Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="admin-card p-5 space-y-1">
          <span className="text-xs font-semibold text-[#6B7280] block">Total Inflow (Deposits)</span>
          <span className="text-2xl font-black text-emerald-700 block">
            PKR {summary?.totalDeposited?.toLocaleString() || 0}
          </span>
          <span className="text-[10px] text-[#6B7280]">Verified deposits credited to wallets</span>
        </div>

        <div className="admin-card p-5 space-y-1">
          <span className="text-xs font-semibold text-[#6B7280] block">Total Outflow (Paid Payouts)</span>
          <span className="text-2xl font-black text-blue-700 block">
            PKR {summary?.totalPaidWithdrawals?.toLocaleString() || 0}
          </span>
          <span className="text-[10px] text-[#6B7280]">Completed withdrawal disbursements</span>
        </div>

        <div className="admin-card p-5 space-y-1">
          <span className="text-xs font-semibold text-[#6B7280] block">Platform Net Yield</span>
          <span className="text-2xl font-black text-[#111827] block">
            PKR {summary?.platformNetYield?.toLocaleString() || 0}
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold">Net liquid platform balance</span>
        </div>

        <div className="admin-card p-5 space-y-1">
          <span className="text-xs font-semibold text-[#6B7280] block">Approved Task Rewards</span>
          <span className="text-2xl font-black text-[#111827] block">
            PKR {summary?.totalTaskRewards?.toLocaleString() || 0}
          </span>
          <span className="text-[10px] text-[#6B7280]">Earned by members on 10 tiers</span>
        </div>

        <div className="admin-card p-5 space-y-1">
          <span className="text-xs font-semibold text-[#6B7280] block">Collected Unlock Fees</span>
          <span className="text-2xl font-black text-amber-700 block">
            PKR {summary?.totalUnlockFees?.toLocaleString() || 0}
          </span>
          <span className="text-[10px] text-[#6B7280]">VIP paid task unlocking transactions</span>
        </div>

        <div className="admin-card p-5 space-y-1">
          <span className="text-xs font-semibold text-[#6B7280] block">Spin Wheel Cash Won</span>
          <span className="text-2xl font-black text-purple-700 block">
            PKR {summary?.totalSpinRewards?.toLocaleString() || 0}
          </span>
          <span className="text-[10px] text-[#6B7280]">Disbursed via royal spin wheels</span>
        </div>
      </div>
    </div>
  );
};
