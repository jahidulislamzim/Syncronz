import { Users } from 'lucide-react';

export function MemberProgressList({ members }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-4.5 space-y-3">
      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
        <Users className="h-4 w-4 text-slate-500" /> Member Progress Report
      </h4>

      <div className="space-y-3.5">
        {members.map(({ member, assignedCount, completedCount, percentage, lateCount }) => {
          const name = member.displayName || member.email;
          const initials = name.slice(0, 2).toUpperCase();

          return (
            <div key={member.uid} className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/60 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                {member.photoURL ? (
                  <img
                    src={member.photoURL}
                    alt={name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700 truncate">{name}</span>
                  <span className="flex items-center gap-2">
                    {lateCount > 0 && (
                      <span className="text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-md">
                        Late: {lateCount}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-500 font-bold">
                      {assignedCount > 0 ? `${completedCount}/${assignedCount} items` : 'No items assigned'}
                    </span>
                  </span>
                </div>

                {assignedCount > 0 && (
                  <div className="flex items-center space-x-2.5">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          percentage === 100 ? 'bg-emerald-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 w-8 text-right">
                      {percentage}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
