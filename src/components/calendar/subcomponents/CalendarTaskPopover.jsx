'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, Calendar, User, AlignLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TaskStatus, TaskPriority } from '../../../types.js';
import { isDeadlineOver } from '../../kanban/utils/helpers.js';

const priorityConfig = {
  high: {
    label: 'High',
    bar: 'bg-red-500',
    badge: 'bg-red-50 text-red-700 border-red-200',
  },
  medium: {
    label: 'Medium',
    bar: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  low: {
    label: 'Low',
    bar: 'bg-blue-500',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
  },
};

const statusLabels = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'In Review',
  done: 'Completed',
};

export const CalendarTaskPopover = ({ task, isOpen, onClose }) => {
  const router = useRouter();
  if (!task) return null;

  const pConfig = priorityConfig[task.priority] || priorityConfig.low;
  const isOverdue = isDeadlineOver(task.dueDate, task.status);
  const isCompleted = task.status === TaskStatus.DONE;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900 cursor-pointer"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-10"
          >
            {/* Accent bar */}
            <div className={`h-1 ${isCompleted ? 'bg-emerald-400' : isOverdue ? 'bg-red-500' : pConfig.bar}`} />

            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${pConfig.badge}`}>
                  {pConfig.label}
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  {statusLabels[task.status] || task.status}
                </span>
                {isCompleted && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    Completed
                  </span>
                )}
                {isOverdue && (
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    Overdue
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer -mr-1 -mt-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Title */}
              <h3 className={`text-sm font-bold leading-snug ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                {task.title}
              </h3>

              {/* Description */}
              {task.description && (
                <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200/60 rounded-xl p-3 leading-relaxed flex items-start gap-2">
                  <AlignLeft className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-3">{task.description}</span>
                </div>
              )}

              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-3">
                {task.boardName && (
                  <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-2.5">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Project</div>
                    <div className="text-xs font-semibold text-slate-800 mt-0.5 truncate">{task.boardName}</div>
                  </div>
                )}
                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-2.5">
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Due Date
                  </div>
                  <div className={`text-xs font-semibold mt-0.5 ${isOverdue ? 'text-red-600' : 'text-slate-800'}`}>
                    {task.dueDate || 'Not set'}
                  </div>
                </div>
              </div>

              {/* Assignee */}
              {task.assignees && task.assignees.length > 0 && (
                <div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Assignees
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {task.assignees.map(a => (
                      <div key={a.uid} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                        <img
                          src={a.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(a.displayName)}`}
                          alt=""
                          className="w-4 h-4 rounded-full object-cover"
                        />
                        <span className="text-[11px] font-semibold text-slate-700">{a.displayName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(!task.assignees || task.assignees.length === 0) && task.assigneeName && (
                <div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Assignee
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 w-fit">
                    <img
                      src={task.assigneePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(task.assigneeName)}`}
                      alt=""
                      className="w-4 h-4 rounded-full object-cover"
                    />
                    <span className="text-[11px] font-semibold text-slate-700">{task.assigneeName}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => {
                  router.push(`/boards/${task.boardId}`);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open in Board
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 border border-slate-200 hover:bg-white text-slate-600 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
