'use client';

import { isDeadlineOver } from '../../kanban/utils/helpers.js';

function formatDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const priorityBadges = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-blue-100 text-blue-700 border-blue-200',
};

export const DayView = ({ currentDate, tasksByDate, isSameDay, overdueTasks, unscheduledTasks, onTaskClick }) => {
  const today = new Date();
  const isToday = isSameDay(currentDate, today);
  const key = formatDateKey(currentDate);
  const dayTasks = tasksByDate[key] || [];
  const isOverdue = dayTasks.some(t => isDeadlineOver(t.dueDate, t.status));

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Day header */}
      <div className={`px-5 py-4 border-b border-slate-200 ${isToday ? 'bg-indigo-50/50' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className={`text-3xl font-extrabold ${isToday ? 'text-indigo-600' : 'text-slate-800'}`}>
              {currentDate.getDate()}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][currentDate.getDay()]}
            </div>
          </div>
          <div>
            <div className="text-sm font-bold text-slate-800">
              {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][currentDate.getMonth()]} {currentDate.getFullYear()}
            </div>
            <div className="text-xs text-slate-400">
              {dayTasks.length} task{dayTasks.length !== 1 ? 's' : ''}
              {isOverdue ? ' · Overdue' : ''}
            </div>
          </div>
          {isToday && (
            <span className="ml-auto text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
              Today
            </span>
          )}
        </div>
      </div>

      {/* Task list */}
      <div className="p-4">
        {dayTasks.length === 0 && (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-slate-200">
              <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-900">No tasks scheduled</p>
            <p className="text-xs text-slate-400 mt-1">No tasks are due on this day</p>
          </div>
        )}

        <div className="space-y-2">
          {dayTasks.map((task, i) => {
            const isPast = isDeadlineOver(task.dueDate, task.status);

            return (
              <div
                key={task.taskId || i}
                onClick={() => onTaskClick?.(task)}
                className={`p-3 rounded-xl border transition hover:shadow-sm cursor-pointer ${
                  task.status === 'done'
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : isPast
                      ? 'border-red-200 bg-red-50/30'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-1 self-stretch rounded-full shrink-0 ${
                    task.status === 'done' ? 'bg-emerald-400' :
                    task.priority === 'high' ? 'bg-red-500' :
                    task.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-bold truncate ${
                        task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-900'
                      }`}>
                        {task.title}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                        priorityBadges[task.priority] || 'bg-slate-100 text-slate-600'
                      }`}>
                        {task.priority?.toUpperCase() || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      {task.boardName && (
                        <span className="truncate">{task.boardName}</span>
                      )}
                      {task.assigneeName && (
                        <>
                          <span>·</span>
                          <span className="truncate">{task.assigneeName}</span>
                        </>
                      )}
                      {isPast && task.status !== 'done' && (
                        <>
                          <span>·</span>
                          <span className="text-red-500 font-semibold">Overdue</span>
                        </>
                      )}
                      {task.status === 'done' && (
                        <>
                          <span>·</span>
                          <span className="text-emerald-600 font-semibold">Completed</span>
                        </>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2">{task.description}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Unscheduled tasks */}
      {unscheduledTasks.length > 0 && (
        <div className="border-t border-slate-200 p-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Unscheduled Tasks ({unscheduledTasks.length})
          </h3>
          <div className="space-y-1.5">
            {unscheduledTasks.slice(0, 5).map((task, i) => (
              <div
                key={task.taskId || i}
                onClick={() => onTaskClick?.(task)}
                className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer hover:bg-slate-50 rounded px-1 py-0.5 transition"
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  task.priority === 'high' ? 'bg-red-500' :
                  task.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                }`} />
                <span className="truncate">{task.title}</span>
                <span className="text-[10px] text-slate-400 ml-auto shrink-0">{task.boardName}</span>
              </div>
            ))}
            {unscheduledTasks.length > 5 && (
              <span className="text-[10px] text-indigo-500 font-semibold">+{unscheduledTasks.length - 5} more</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
