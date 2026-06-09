import { PlusCircle, CheckSquare, RefreshCw, Send, Users, Compass } from 'lucide-react';
import { ActivityType } from '../../../types.js';

export function getActivityIcon(type) {
  switch (type) {
    case ActivityType.TASK_CREATED:
      return <PlusCircle className="h-3.5 w-3.5 text-emerald-500" />;
    case ActivityType.TASK_MOVED:
      return <RefreshCw className="h-3.5 w-3.5 text-blue-600" />;
    case ActivityType.TASK_ASSIGNED:
      return <Users className="h-3.5 w-3.5 text-blue-500" />;
    case ActivityType.BOARD_JOINED:
      return <Compass className="h-3.5 w-3.5 text-violet-500" />;
    case ActivityType.COMMENT_ADDED:
      return <Send className="h-3.5 w-3.5 text-amber-500" />;
    default:
      return <CheckSquare className="h-3.5 w-3.5 text-slate-500" />;
  }
}

export function getRelativeTime(timestamp) {
  if (!timestamp) return 'Just now';

  let date;
  if (typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else {
    date = new Date(timestamp);
  }

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
