'use client';

import { motion } from 'motion/react';
import { getActivityIcon, getRelativeTime } from '../utils/helpers.js';

export function ActivityItem({ activity }) {
  return (
    <motion.div
      key={activity.activityId}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="relative flex items-start space-x-3 text-xs"
    >
      <span className="absolute -left-[25.5px] top-1.5 p-1 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center">
        {getActivityIcon(activity.type)}
      </span>

      <img
        src={activity.userPhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(activity.userName)}`}
        alt={activity.userName}
        referrerPolicy="no-referrer"
        className="w-6 h-6 rounded-md object-cover bg-slate-50 border border-slate-200/30"
      />

      <div className="flex-1 min-w-0">
        <p className="text-slate-750 leading-relaxed font-medium">
          <span className="font-bold text-slate-900 mr-1">{activity.userName}</span>
          {activity.details}
        </p>
        <span className="text-[10px] text-slate-400 font-mono mt-0.5 inline-block font-semibold">
          {getRelativeTime(activity.createdAt)}
        </span>
      </div>
    </motion.div>
  );
}
