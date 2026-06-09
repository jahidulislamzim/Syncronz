'use client';

import { AnimatePresence } from 'motion/react';
import { Clock, Compass } from 'lucide-react';
import { useActivityLog } from './hooks/useActivityLog.js';
import { ActivityItem } from './subcomponents/ActivityItem.jsx';
import { ActivityEmptyState } from './subcomponents/ActivityEmptyState.jsx';

export function ActivityLog({ boardId }) {
  const activities = useActivityLog(boardId);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
      <div className="p-5 space-y-4">
        <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center space-x-1.5">
          <Clock className="h-4 w-4 text-slate-500" />
          <span>Activity Stream</span>
        </h3>

        <div className="overflow-y-auto max-h-[300px] pr-1 subtle-scroll">
          {activities.length === 0 ? (
            <ActivityEmptyState />
          ) : (
            <div className="relative border-l-2 border-slate-100 pl-4 space-y-4.5 py-1">
              <AnimatePresence initial={false}>
                {activities.map((act) => (
                  <ActivityItem key={act.activityId} activity={act} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
