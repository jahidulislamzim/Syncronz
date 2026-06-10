'use client';

import { isDeadlineOver } from '../../kanban/utils/helpers.js';

function formatDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const priorityStyles = {
  high: 'border-l-2 border-red-500 bg-red-50/50',
  medium: 'border-l-2 border-amber-500 bg-amber-50/50',
  low: 'border-l-2 border-blue-500 bg-blue-50/50',
};

const statusStyles = {
  done: 'border-l-2 border-emerald-500 bg-emerald-50/50 line-through text-slate-400',
};

export const WeekView = ({ weekDays, tasksByDate, isSameDay, onTaskClick }) => {
  const today = new Date();

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-slate-200">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, idx) => {
          const day = weekDays.find(w => {
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            return dayNames[w.date.getDay()] === d;
          });
          const isToday = day && isSameDay(day.date, today);

          return (
            <div key={d} className={`px-2 py-3 text-center border-r border-slate-100 last:border-r-0 ${isToday ? 'bg-indigo-50/50' : ''}`}>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{d}</div>
              {day && (
                <div className={`text-lg font-extrabold mt-0.5 ${isToday ? 'text-indigo-600' : 'text-slate-800'}`}>
                  {day.date.getDate()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Day content */}
      <div className="grid grid-cols-7">
        {weekDays.map((day, idx) => {
          const key = formatDateKey(day.date);
          const dayTasks = tasksByDate[key] || [];
          const isToday = isSameDay(day.date, today);

          return (
            <div
              key={idx}
              className={`min-h-[300px] border-r border-slate-100 last:border-r-0 p-2 space-y-1.5 ${
                isToday ? 'bg-indigo-50/30' : ''
              }`}
            >
              {dayTasks.length === 0 && (
                <div className="text-[10px] text-slate-300 text-center italic mt-4">No tasks</div>
              )}
              {dayTasks.map((task, i) => {
                const isOverdue = isDeadlineOver(task.dueDate, task.status);
                const styleClass = task.status === 'done'
                  ? statusStyles.done
                  : priorityStyles[task.priority] || 'border-l-2 border-slate-300';

                return (
                  <div
                    key={task.taskId || i}
                    onClick={() => onTaskClick?.(task)}
                    className={`px-2 py-1.5 rounded-md text-xs cursor-pointer hover:shadow-sm transition ${styleClass} ${
                      isOverdue ? 'ring-1 ring-red-300' : ''
                    }`}
                    title={`${task.title} - ${task.boardName || ''}`}
                  >
                    <div className="flex items-center gap-1">
                      {isOverdue && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                      )}
                      <span className={`font-semibold truncate ${
                        task.status === 'done' ? 'text-slate-400' : 'text-slate-800'
                      }`}>
                        {task.title}
                      </span>
                    </div>
                    {task.boardName && (
                      <div className="text-[9px] text-slate-400 mt-0.5 truncate">{task.boardName}</div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
