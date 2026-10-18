import React, { useState, useEffect } from 'react';
import { Share2, Users, CheckCircle2 } from 'lucide-react';
import { api } from '../../api/client';

export const AdminReferralsPage: React.FC = () => {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminReferrals()
      .then((res) => setReferrals(res.referrals || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#111827]">Referral Program Management</h1>
        <p className="text-xs text-[#6B7280] mt-0.5">
          Monitor referral relationships, partner milestones, and anti-fraud verification.
        </p>
      </div>

      <div className="admin-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-[#6B7280]">Loading referrals...</div>
        ) : referrals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs admin-table">
              <thead>
                <tr>
                  <th>Created Date</th>
                  <th>Inviter (Referrer)</th>
                  <th>Invited Member</th>
                  <th>Qualifying State</th>
                  <th>Reward Status</th>
                  <th className="text-right">Bonus (PKR)</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r) => (
                  <tr key={r.id}>
                    <td className="text-[#6B7280]">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="font-semibold text-[#111827]">
                      {r.referrer?.name} ({r.referrer?.phone})
                    </td>
                    <td className="font-semibold text-[#2563EB]">
                      {r.referee?.name} ({r.referee?.phone})
                    </td>
                    <td>
                      <span className="bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded text-[10px]">
                        {r.qualifyingStatus}
                      </span>
                    </td>
                    <td>
                      <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded text-[10px]">
                        {r.rewardStatus}
                      </span>
                    </td>
                    <td className="text-right font-bold text-[#111827]">PKR {r.rewardAmount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-xs text-[#6B7280]">No referral relationships found.</div>
        )}
      </div>
    </div>
  );
};
