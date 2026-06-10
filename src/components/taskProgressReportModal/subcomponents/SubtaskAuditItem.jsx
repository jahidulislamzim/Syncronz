import { CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

const normalizeCompletedBy = (completedBy) => {
  return (completedBy || []).map(item => typeof item === 'string' ? { uid: item, completedAt: null } : item);
};

function ParticipantAuditPanel({ completedList, pendingList, isLateMap }) {
  return (
    <div className="mt-2.5 p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-2.5 animate-in slide-in-from-top-2 duration-150">
      <div className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">
        Detailed Participant Audit
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-55 border border-emerald-100 px-1.5 py-0.5 rounded uppercase tracking-wide">
            Completed ({completedList.length})
          </span>
          {completedList.length > 0 ? (
            <div className="space-y-1">
              {completedList.map(m => (
                <div key={m.uid} className="flex items-center justify-between text-slate-600">
                  <div className="flex items-center space-x-1.5 min-w-0">
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-100 flex items-center justify-center text-[7px] text-emerald-700 font-bold shrink-0">&#10003;</div>
                    <span className="text-[10px] font-semibold truncate">{m.displayName || m.email?.split('@')[0]}</span>
                  </div>
                  {isLateMap?.[m.uid] && (
                    <span className="text-[8px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1 py-0.5 rounded shrink-0 ml-1">
                      Late
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] italic text-slate-400">None completed yet</p>
          )}
        </div>

        <div className="space-y-1.5">
          <span className="text-[9px] font-bold text-amber-600 bg-amber-55 border border-amber-100 px-1.5 py-0.5 rounded uppercase tracking-wide">
            Pending ({pendingList.length})
          </span>
          {pendingList.length > 0 ? (
            <div className="space-y-1">
              {pendingList.map(m => (
                <div key={m.uid} className="flex items-center space-x-1.5 text-slate-500">
                  <div className="w-3.5 h-3.5 rounded-full bg-slate-200 flex items-center justify-center text-[7px] text-slate-600 font-bold shrink-0">-</div>
                  <span className="text-[10px] font-semibold truncate">{m.displayName || m.email?.split('@')[0]}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] italic text-slate-400">No pending participants</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function SubtaskAuditItem({ sub, index, members, isExpanded, onToggle }) {
  let badgeColor = 'bg-slate-100 text-slate-600 border-slate-200';
  let badgeText = 'Anyone';
  let completionText = sub.completed ? 'Completed' : 'Pending';
  let completedCount = sub.completed ? 1 : 0;
  let totalTarget = 1;

  if (sub.assigneeType === 'individual') {
    badgeColor = 'bg-amber-50 text-amber-600 border-amber-150';
    badgeText = 'Individual';
    const cb = normalizeCompletedBy(sub.completedBy);
    completedCount = cb.length;
    totalTarget = members.length;
    completionText = `${completedCount}/${totalTarget} done`;
  } else if (sub.assigneeType === 'specific') {
    badgeColor = 'bg-indigo-50 text-indigo-600 border-indigo-150';
    badgeText = 'Specific';
  }

  const percent = totalTarget > 0 ? Math.round((completedCount / totalTarget) * 100) : 0;

  let completedList = [];
  let pendingList = [];
  const isLateMap = {};

  if (sub.assigneeType === 'individual') {
    const cb = normalizeCompletedBy(sub.completedBy);
    const completedUids = cb.map(item => item.uid);
    completedList = members.filter(m => completedUids.includes(m.uid));
    pendingList = members.filter(m => !completedUids.includes(m.uid));
    cb.forEach(item => {
      if (item.completedAt) isLateMap[item.uid] = true;
    });
  } else if (sub.assigneeType === 'specific') {
    const assignedUids = Array.isArray(sub.assignedTo) ? sub.assignedTo : [sub.assignedTo].filter(Boolean);
    const assignedMembers = members.filter(m => assignedUids.includes(m.uid));
    if (sub.completed) {
      completedList = assignedMembers;
      pendingList = [];
      if (sub.completedAt && sub.completedByUid) {
        isLateMap[sub.completedByUid] = true;
      }
    } else {
      completedList = [];
      pendingList = assignedMembers;
    }
  } else {
    if (sub.completed) {
      completedList = members;
      pendingList = [];
      if (sub.completedAt && sub.completedByUid) {
        isLateMap[sub.completedByUid] = true;
      }
    } else {
      completedList = [];
      pendingList = members;
    }
  }

  return (
    <div className="py-3">
      <div
        onClick={onToggle}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer hover:bg-slate-50/70 p-2 -mx-2 rounded-xl transition"
      >
        <div className="flex items-start space-x-2.5 min-w-0">
          <CheckCircle2 className={`h-4 w-4 mt-0.5 shrink-0 ${percent === 100 ? 'text-emerald-500' : 'text-slate-300'}`} />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-700 truncate max-w-sm sm:max-w-md">{sub.title}</p>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border ${badgeColor}`}>
                {badgeText}
              </span>
              <span className="text-[10px] text-slate-450 font-semibold">{completionText}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
          <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-slate-500 w-8 text-right">{percent}%</span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
          )}
        </div>
      </div>

      {isExpanded && (
        <ParticipantAuditPanel completedList={completedList} pendingList={pendingList} isLateMap={isLateMap} />
      )}
    </div>
  );
}
