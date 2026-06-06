'use client';

import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase.js';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { ActivityType } from '../types.js';
import { Clock, PlusCircle, CheckSquare, RefreshCw, Send, Users, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ActivityLog = ({ boardId }) => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const actRef = collection(db, 'boards', boardId, 'activity');
    const q = query(
      actRef,
      orderBy('createdAt', 'desc'),
      limit(25)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push(doc.data());
      });
      setActivities(list);
    }, (error) => {
      console.error("Activity stream snapshot error: ", error);
    });

    return () => unsubscribe();
  }, [boardId]);

  const getActivityIcon = (type) => {
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
  };

  const getRelativeTime = (timestamp) => {
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
  };

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
          <div className="py-12 text-center text-slate-400 text-xs">
            <Compass className="h-6 w-6 text-slate-300 mx-auto mb-2 animate-spin duration-10000" />
            <p>Waiting for actions... Board is quiet.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-100 pl-4 space-y-4.5 py-1">
            <AnimatePresence initial={false}>
              {activities.map((act) => (
                <motion.div
                  key={act.activityId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="relative flex items-start space-x-3 text-xs"
                >
                  <span className="absolute -left-[25.5px] top-1.5 p-1 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center">
                    {getActivityIcon(act.type)}
                  </span>

                  <img
                    src={act.userPhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(act.userName)}`}
                    alt={act.userName}
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 rounded-md object-cover bg-slate-50 border border-slate-200/30"
                  />

                  <div className="flex-1 min-w-0">
                    <p className="text-slate-750 leading-relaxed font-medium">
                      <span className="font-bold text-slate-900 mr-1">{act.userName}</span>
                      {act.details}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 inline-block font-semibold">
                      {getRelativeTime(act.createdAt)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};
