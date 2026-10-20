import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Crown, ShieldAlert, ArrowLeft, Phone, Mail } from 'lucide-react';
import { api } from '../../api/client';

export const ForgotPasswordPage: React.FC = () => {
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    api.getPublicSettings().then(setSettings).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#04132F] text-slate-100 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <Crown className="w-8 h-8 text-[#FFD45A]" />
            <span className="text-2xl font-black text-white">EARN STREET</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Account Recovery</h1>
        </div>

        <div className="royal-card p-6 sm:p-8 rounded-3xl text-left space-y-4">
          <div className="flex items-start gap-3 p-4 bg-[#1459E8]/20 border border-[#214B91] rounded-2xl">
            <ShieldAlert className="w-6 h-6 text-[#FFD45A] flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 space-y-1">
              <p className="font-bold text-white text-sm">Official Account Verification</p>
              <p>
                To maintain the integrity of wallet funds and prevent unauthorized access, password resets are processed securely through manual administrator verification.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Contact Official Support:
            </p>
            <div className="p-3 bg-[#020B20] border border-[#214B91] rounded-xl flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-slate-300">
                <Phone className="w-4 h-4 text-[#22D3EE]" /> WhatsApp Support:
              </span>
              <span className="font-bold text-[#FFD45A] font-mono">
                {settings.supportWhatsapp || '+92 300 1234567'}
              </span>
            </div>
            <div className="p-3 bg-[#020B20] border border-[#214B91] rounded-xl flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-slate-300">
                <Mail className="w-4 h-4 text-[#22D3EE]" /> Email Assistance:
              </span>
              <span className="font-bold text-white font-mono">
                {settings.supportEmail || 'support@royalrewards.com'}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed pt-2">
            Provide your registered Mobile Number and national ID verification to the administration desk. You will receive a secure temporary password once identity is confirmed.
          </p>

          <div className="pt-4 border-t border-[#214B91]/50 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#FFD45A] hover:underline"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
