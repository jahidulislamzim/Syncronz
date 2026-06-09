import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const ManageUsersHeader = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 md:p-10">
      <div className="absolute top-[-30%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-30%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="relative z-10 flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
        <div className="h-12 w-12 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-black/10">
          <ShieldCheck className="h-5.5 w-5.5 text-indigo-300" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white leading-tight">
            Access Management
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
            Invite users, manage workspace access, and control administrative privileges.
          </p>
        </div>
      </div>
    </div>
  );
};
