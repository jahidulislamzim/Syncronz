'use client';

import { isDeadlineOver } from '../../kanban/utils/helpers.js';

function getTasksForDate(tasksByDate, year, month, day) {
  const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return tasksByDate[key] || [];
}

const priorityColors = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-blue-500',
};

export const MonthView = ({ monthDays, currentDate, tasksByDate, isSameDay, overdueTasks, onTaskClick, onShowMore, onDateClick }) => {
  const today = new Date();

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-slate-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="px-2 py-2.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {monthDays.map((cell, idx) => {
          const dateObj = new Date(cell.year, cell.month, cell.day);
          const cellTasks = getTasksForDate(tasksByDate, cell.year, cell.month, cell.day);
          const isToday = cell.isCurrent && isSameDay(dateObj, today);
          const isOverdue = cellTasks.some(t => isDeadlineOver(t.dueDate, t.status));

          return (
            <div
              key={idx}
              className={`min-h-[90px] border-b border-r border-slate-100 p-1.5 transition-colors ${
                !cell.isCurrent ? 'bg-slate-50/50' : 'hover:bg-slate-50'
              } ${isToday ? 'bg-indigo-50/50' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  onClick={() => cell.isCurrent && onDateClick?.(cell.year, cell.month, cell.day)}
                  className={`text-xs font-bold leading-none px-1.5 py-0.5 rounded-full cursor-pointer ${
                    isToday
                      ? 'bg-indigo-600 text-white w-6 h-6 flex items-center justify-center'
                      : cell.isCurrent
                        ? 'text-slate-700 hover:text-indigo-600'
                        : 'text-slate-300'
                  }`}
                >
                  {cell.day}
                </span>
                {isOverdue && cell.isCurrent && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                )}
              </div>

              <div className="space-y-0.5">
                {cellTasks.slice(0, 3).map((task, i) => (
                  <div
                    key={task.taskId || i}
                    onClick={() => onTaskClick?.(task)}
                    className="flex items-center gap-1 group cursor-pointer hover:bg-slate-100 rounded px-0.5 transition"
                    title={`${task.title} (${task.priority})${task.status === 'done' ? ' - Completed' : ''}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        task.status === 'done' ? 'bg-emerald-400' : priorityColors[task.priority] || 'bg-slate-400'
                      }`}
                    />
                    <span className={`text-[10px] leading-tight truncate ${
                      task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-600'
                    }`}>
                      {task.title}
                    </span>
                  </div>
                ))}
                {cellTasks.length > 3 && (
                  <span
                    onClick={() => onShowMore?.(cell.year, cell.month, cell.day)}
                    className="text-[10px] text-indigo-500 font-semibold cursor-pointer hover:underline"
                  >
                    +{cellTasks.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
