import React from 'react';
import { CheckSquare, Square, BarChart3 } from 'lucide-react';
import { TaskStatus } from '../../../types.js';

export const SubtaskList = ({
  task,
  user,
  members = [],
  isArchived = false,
  handleToggleSubtaskViewMode,
  setIsReportOpen
}) => {
  const visibleSubtasks = (task.subtasks || []).filter(sub => {
    if (sub.assigneeType === 'all' || !sub.assigneeType) return true;
    if (sub.assigneeType === 'individual') return true;
    if (sub.assigneeType === 'specific') {
      const assignedUids = Array.isArray(sub.assignedTo) ? sub.assignedTo : [sub.assignedTo].filter(Boolean);
      return assignedUids.includes(user?.uid);
    }
    return true;
  });

  if (visibleSubtasks.length === 0) return null;

  const completedCount = visibleSubtasks.filter(s => 
    s.assigneeType === 'individual' 
      ? s.completedBy?.includes(user?.uid) 
      : s.completed
  ).length;

  return (
    <div className="pt-4.5 mt-5 border-t border-slate-100">
      <div className="flex items-center justify-between mb-2">
        <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">
          <CheckSquare className="h-3.5 w-3.5 inline mr-1 text-emerald-500" /> Interactive Checklist
        </label>
        <div className="flex items-center space-x-1.5">
          {user?.uid === task.creatorId && (
            <button
              type="button"
              onClick={() => setIsReportOpen(true)}
              className="text-[9px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-150 border border-indigo-150 px-2 py-0.5 rounded-md transition cursor-pointer flex items-center space-x-1"
            >
              <BarChart3 className="h-2.5 w-2.5" />
              <span>Progress Report</span>
            </button>
          )}
          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md font-mono">
            {completedCount} of {visibleSubtasks.length} done
          </span>
        </div>
      </div>

      {/* Progress dynamic gauge */}
      <div className="mb-3.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/40">
        <div 
          className="h-full bg-emerald-500 transition-all duration-350"
          style={{ width: `${(completedCount / visibleSubtasks.length) * 100}%` }}
        />
      </div>

      {/* List subtasks items */}
      <div className="space-y-2 max-h-[220px] overflow-y-auto subtle-scroll mb-3">
        {visibleSubtasks.map(sub => {
          let canToggle = false;
          if (sub.assigneeType === 'individual') {
            canToggle = true;
          } else if (sub.assigneeType === 'specific') {
            const assignedUids = Array.isArray(sub.assignedTo) ? sub.assignedTo : [sub.assignedTo].filter(Boolean);
            canToggle = assignedUids.includes(user?.uid);
          } else {
            canToggle = task.assignees?.some(a => a.uid === user?.uid) || task.assigneeId === user?.uid;
          }
          
          const isCompleted = sub.assigneeType === 'individual'
            ? sub.completedBy?.includes(user?.uid)
            : sub.completed;

          let assignmentBadge = null;
          if (sub.assigneeType === 'specific') {
            const assignedUids = Array.isArray(sub.assignedTo) ? sub.assignedTo : [sub.assignedTo].filter(Boolean);
            const names = assignedUids.map(uid => {
              const m = members.find(member => member.uid === uid);
              return m ? (m.displayName || m.email.split('@')[0]) : '';
            }).filter(Boolean);
            
            assignmentBadge = (
              <span 
                className="text-[9px] px-1.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold ml-2 shrink-0 truncate max-w-[120px]"
                title={names.join(', ')}
              >
                @{names.length > 1 ? `${names.length} members` : (names[0] || 'specific user')}
              </span>
            );
          } else if (sub.assigneeType === 'individual') {
            assignmentBadge = (
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-50 border border-amber-100 text-amber-600 font-bold ml-2 shrink-0">
                indiv
              </span>
            );
          }

          const isTaskCreator = user?.uid === task.creatorId;

          return (
            <div key={sub.id} className="space-y-1">
              {canToggle && !isArchived ? (
                <button
                  type="button"
                  onClick={() => handleToggleSubtaskViewMode(task, sub.id)}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-100/50 transition-colors text-left cursor-pointer min-w-0"
                >
                  {isCompleted ? (
                    <CheckSquare className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <Square className="h-4 w-4 text-slate-350 hover:text-slate-550 shrink-0" />
                  )}
                  <span className={`text-xs font-semibold truncate ${isCompleted ? 'line-through text-slate-400' : 'text-slate-700'}`}>{sub.title}</span>
                  {assignmentBadge}
                </button>
              ) : (
                <div 
                  className="flex items-center space-x-2.5 px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/30 cursor-not-allowed min-w-0"
                  title={isArchived ? "Board is archived" : "You are not authorized to check/uncheck this checklist item"}
                >
                  {isCompleted ? (
                    <CheckSquare className="h-4 w-4 text-slate-300 shrink-0" />
                  ) : (
                    <Square className="h-4 w-4 text-slate-300 shrink-0" />
                  )}
                  <span className={`text-xs font-semibold truncate ${isCompleted ? 'line-through text-slate-400' : 'text-slate-405'}`}>{sub.title}</span>
                  {assignmentBadge}
                </div>
              )}

              {/* Creator/Manager completion tracker UI */}
              {isTaskCreator && (
                <div className="flex flex-wrap items-center gap-1.5 px-3 py-1 bg-slate-50/20 border border-slate-100/50 rounded-xl text-[10px] text-slate-500">
                  <span className="font-semibold text-slate-400 mr-1">Status:</span>
                  {sub.assigneeType === 'individual' ? (
                    <div className="flex flex-wrap items-center gap-1">
                      {members.map(m => {
                        const completed = sub.completedBy?.includes(m.uid);
                        const name = m.displayName || m.email.split('@')[0];
                        const initials = name.slice(0, 2).toUpperCase();
                        return (
                          <div 
                            key={m.uid}
                            className={`relative w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border transition-all ${
                              completed 
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                                : 'bg-slate-55 border-slate-200 text-slate-400 opacity-60'
                            }`}
                            title={`${name} - ${completed ? 'Completed' : 'Pending'}`}
                          >
                            {m.photoURL ? (
                              <img 
                                src={m.photoURL} 
                                alt={name} 
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span>{initials}</span>
                            )}
                            {completed && (
                              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 border border-white rounded-full flex items-center justify-center" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      {sub.assigneeType === 'specific' ? (
                        <>
                          <span className="font-medium text-slate-600">
                            {(Array.isArray(sub.assignedTo) ? sub.assignedTo : [sub.assignedTo].filter(Boolean)).map(uid => {
                              const m = members.find(member => member.uid === uid);
                              return m ? (m.displayName || m.email.split('@')[0]) : '';
                            }).filter(Boolean).join(', ')}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded font-semibold text-[8px] uppercase tracking-wider ${sub.completed ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                            {sub.completed ? 'Completed' : 'Pending'}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="font-medium text-slate-600">Anyone</span>
                          <span className={`px-1.5 py-0.5 rounded font-semibold text-[8px] uppercase tracking-wider ${sub.completed ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                            {sub.completed ? 'Completed' : 'Pending'}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
