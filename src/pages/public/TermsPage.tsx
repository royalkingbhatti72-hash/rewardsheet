import React from 'react';
import { Link } from 'react-router-dom';
import { Crown, ArrowLeft, ShieldCheck } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#04132F] text-slate-100 py-12 px-4 sm:px-8">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-[#FFD45A] hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <div className="royal-card p-8 rounded-3xl space-y-6">
          <div className="flex items-center gap-3 border-b border-[#214B91]/50 pb-4">
            <Crown className="w-8 h-8 text-[#FFD45A]" />
            <div>
              <h1 className="text-2xl font-black text-white">Terms of Service</h1>
              <p className="text-xs text-[#22D3EE]">Earn Street Platform Guidelines</p>
            </div>
          </div>

          <div className="text-xs text-slate-300 space-y-4 leading-relaxed">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">1. Account & Membership</h2>
            <p>
              Users must provide a valid mobile number during registration. Multiple fraudulent accounts or automated bot interactions will result in immediate suspension and forfeiture of unapproved balances.
            </p>

            <h2 className="text-sm font-bold text-white uppercase tracking-wider">2. Sequential Task Progression</h2>
            <p>
              Tasks must be completed strictly in sequential order from Task 1 through Task 10 across 10 progressive tiers. Tasks are verified manually by authorized platform administrators. Submitting falsified screenshots or altered proof will trigger account rejection.
            </p>

            <h2 className="text-sm font-bold text-white uppercase tracking-wider">3. Task Unlock Fees & Rewards</h2>
            <p>
              Specific high-tier tasks may require an unlock fee. Paying an unlock fee unlocks access to the protected instructions and does not automatically complete the task. Tasks must still be completed and approved by administration.
            </p>

            <h2 className="text-sm font-bold text-white uppercase tracking-wider">4. Deposits and Withdrawals</h2>
            <p>
              Deposits and withdrawals are processed in Pakistani Rupees (PKR) through Easypaisa, JazzCash, and supported banking networks. All transactions are reviewed manually to guarantee financial ledger integrity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
