import { PieChart, Users } from 'lucide-react';

export function ProgressSummaryCards({ overallPercentage, completed, total, activeParticipants, totalMembers }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Overall Completion</span>
          <PieChart className="h-4 w-4 text-emerald-500" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-slate-800">{overallPercentage}%</span>
          <span className="text-xs text-slate-450 font-semibold">({completed}/{total} instances)</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${overallPercentage}%` }}
          />
        </div>
      </div>

      <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Participation</span>
          <Users className="h-4 w-4 text-indigo-500" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-slate-800">{activeParticipants}</span>
          <span className="text-xs text-slate-450 font-semibold">of {totalMembers} members participated</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${totalMembers > 0 ? (activeParticipants / totalMembers) * 100 : 0}%` }}
          />
        </div>
      </div>
    </div>
  );
}
