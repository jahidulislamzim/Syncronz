import React from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';

export const DashboardBanner = ({ profile, user, refreshData }) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 md:p-10">
      <div className="absolute top-[-30%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-30%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="relative z-10 flex items-start justify-between gap-5">
        <div className="flex items-start gap-5">
          <div className="h-12 w-12 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-black/10">
            <Sparkles className="h-5.5 w-5.5 text-indigo-300" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white leading-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-emerald-300">{profile?.displayName || user?.displayName || 'Developer'}</span>
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
              {profile?.isAdmin
                ? 'Overview of your entire workspace — boards, members, and activity at a glance.'
                : 'Create a new board to start collaborating, or join an existing workspace using its unique identifier.'
              }
            </p>
          </div>
        </div>
        <button
          onClick={refreshData}
          className="shrink-0 p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
          title="Refresh data"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
