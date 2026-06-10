import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Calendar, MessageSquare, Paperclip, CheckSquare, Info } from 'lucide-react';
import { TaskStatus, TaskPriority } from '../../../types.js';
import { isDeadlineOver } from '../utils/helpers.js';

export const TaskCard = ({
  task,
  user,
  colId,
  isArchived = false,
  launchTaskInspector,
  handleStatusTransition
}) => {
  const getPriorityStyle = (priority) => {
    switch (priority) {
      case TaskPriority.HIGH:
        return 'bg-red-50 text-red-700 border-red-100 uppercase tracking-wider text-[9px] font-bold';
      case TaskPriority.MEDIUM:
        return 'bg-amber-50 text-amber-700 border-amber-100 uppercase tracking-wider text-[9px] font-bold';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-100 uppercase tracking-wider text-[9px] font-bold';
    }
  };

  const visibleSubs = (task.subtasks || []).filter(sub => {
    if (sub.assigneeType === 'all' || !sub.assigneeType) return true;
    if (sub.assigneeType === 'individual') return true;
    if (sub.assigneeType === 'specific') {
      const assignedUids = Array.isArray(sub.assignedTo) ? sub.assignedTo : [sub.assignedTo].filter(Boolean);
      return assignedUids.includes(user?.uid);
    }
    return true;
  });

  const completedSubs = visibleSubs.filter(s => 
    s.assigneeType === 'individual' 
      ? (s.completedBy || []).some(item => (typeof item === 'string' ? item : item.uid) === user?.uid) 
      : s.completed
  ).length;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => launchTaskInspector(task)}
      className={`bg-white border rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-left flex flex-col space-y-3.5 cursor-pointer relative group ${colId === TaskStatus.IN_PROGRESS ? 'border-l-4 border-l-blue-500 border-slate-200' : 'border-slate-200/95'}`}
    >
      <div className="flex items-start justify-between">
        <span className={`px-2 py-0.5 rounded-md border font-mono ${getPriorityStyle(task.priority)}`}>
          {task.priority}
        </span>

        {colId === TaskStatus.IN_PROGRESS && (
          <div className="flex items-center gap-1 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded text-[9px] font-bold text-blue-600 font-mono tracking-widest uppercase">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse mr-0.5 inline-block"></span>
            Live Sync
          </div>
        )}
        
        {/* Speed transit selector */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
          {colId !== TaskStatus.DONE && user?.uid === task.creatorId && !isArchived && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const nextState = colId === TaskStatus.TODO ? TaskStatus.IN_PROGRESS :
                                  colId === TaskStatus.IN_PROGRESS ? TaskStatus.REVIEW : TaskStatus.DONE;
                handleStatusTransition(task, nextState);
              }}
              className="p-1 bg-slate-50 lg:hover:bg-blue-50 rounded-md border border-slate-200 hover:border-blue-300 transition-all text-blue-600"
              title="Move forward"
            >
              <ChevronRight className="h-3 w-3 stroke-[3px]" />
            </button>
          )}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-bold text-slate-850 leading-snug line-clamp-2">{task.title}</h4>
        {task.description && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        {/* Tags view inside card */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {task.tags.map(tag => (
              <span key={tag} className="px-1.5 py-0.5 text-[8.5px] font-bold rounded-md bg-slate-100 border border-slate-200 text-slate-600 block shadow-2xs">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Interactive Checklist progress loop */}
        {visibleSubs.length > 0 && (
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-[9px] text-slate-450 font-mono font-bold">
              <span className="flex items-center gap-1">
                <CheckSquare className="h-3 w-3 text-emerald-500" />
                <span>Checklist ({completedSubs}/{visibleSubs.length})</span>
              </span>
              <span>{Math.round((completedSubs / visibleSubs.length) * 100)}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${(completedSubs / visibleSubs.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Attachments Indicator */}
        {task.attachments && task.attachments.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-dashed border-slate-100 flex items-center gap-1 text-[9px] text-slate-450 font-mono font-bold">
            <Paperclip className="h-3 w-3 text-blue-500" />
            <span>{task.attachments.length} File Attachment{task.attachments.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Task Card Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 flex-wrap gap-2 text-[10px]">
        {/* Date limit */}
        <div className="flex items-center space-x-2.5 text-slate-400">
          <div className="flex items-center space-x-1.5">
            {isDeadlineOver(task.dueDate, task.status) ? (
              <>
                <Calendar className="h-3.5 w-3.5 text-rose-500" />
                <span className="font-mono tracking-wider font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                  Deadline Over ({task.dueDate})
                </span>
              </>
            ) : (
              <>
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-mono tracking-wider font-semibold">{task.dueDate || 'No Limit'}</span>
              </>
            )}
          </div>
          {(task.comments || []).length > 0 && (
            <div className="flex items-center space-x-0.5 text-slate-400 bg-slate-50 border border-slate-200/50 px-1.5 py-0.5 rounded-md font-mono font-bold text-[9px]">
              <MessageSquare className="h-3 w-3 text-slate-400" />
              <span>{(task.comments || []).length}</span>
            </div>
          )}
        </div>

        {/* Assignees avatars */}
        <div className="flex -space-x-1.5 overflow-hidden">
          {task.assignees && task.assignees.length > 0 ? (
            task.assignees.map((assignee) => (
              <img
                key={assignee.uid}
                src={assignee.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(assignee.displayName || 'U')}`}
                alt={assignee.displayName || ''}
                title={assignee.displayName || ''}
                className="w-5.5 h-5.5 rounded-full border border-white object-cover shadow-2xs"
              />
            ))
          ) : task.assigneeName ? (
            <img
              src={task.assigneePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(task.assigneeName)}`}
              alt={task.assigneeName}
              title={task.assigneeName}
              className="w-5.5 h-5.5 rounded-full border border-white object-cover shadow-2xs"
            />
          ) : (
            <div className="w-5.5 h-5.5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[8.5px] font-bold text-slate-400">
              U
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
