import React from 'react';
import { Plus, Info } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { TaskCard } from './TaskCard.jsx';

export const KanbanColumn = ({
  column,
  tasks = [],
  user,
  isArchived = false,
  setNewTitle,
  setNewDesc,
  setIsCreateOpen,
  launchTaskInspector,
  handleStatusTransition
}) => {
  return (
    <div className="bg-slate-100/50 rounded-2xl border border-slate-200 p-4 flex flex-col max-h-[720px]">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border ${column.color} font-mono uppercase tracking-wider`}>
          {column.label} &bull; {tasks.length}
        </span>
        {!isArchived && (
          <button
            onClick={() => {
              setNewTitle('');
              setNewDesc('');
              setIsCreateOpen(true);
            }}
            className="p-1 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded-lg transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Tasks body items */}
      <div className="space-y-3.5 overflow-y-auto subtle-scroll min-h-[150px] pb-5 flex-grow">
        {tasks.length === 0 ? (
          <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
            <Info className="h-5 w-5 opacity-40 mx-auto mb-1 stroke-1" />
            <p className="text-[11px] font-mono uppercase font-bold tracking-widest text-slate-400/80">Empty Category</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {tasks.map((task) => (
              <TaskCard
                key={task.taskId}
                task={task}
                user={user}
                colId={column.id}
                isArchived={isArchived}
                launchTaskInspector={launchTaskInspector}
                handleStatusTransition={handleStatusTransition}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
