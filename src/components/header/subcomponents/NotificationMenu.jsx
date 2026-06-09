import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, Check, Trash2, Radio, Sparkles } from 'lucide-react';
import { NotificationType } from '../../../types.js';

export const NotificationMenu = ({
  showNotifMenu,
  setShowNotifMenu,
  unreadCount,
  notifications,
  handleClearAll,
  handleMarkAsRead,
  notifMenuRef
}) => {
  const getNotifIconStyle = (type) => {
    switch (type) {
      case NotificationType.ASSIGNMENT:
        return 'bg-blue-100 text-blue-600 border border-blue-200';
      case NotificationType.JOINED:
        return 'bg-emerald-100 text-emerald-600 border border-emerald-200';
      case NotificationType.UPDATE:
        return 'bg-amber-100 text-amber-600 border border-amber-200';
      default:
        return 'bg-slate-100 text-slate-600 border border-slate-200';
    }
  };

  return (
    <div className="relative" ref={notifMenuRef}>
      <button
        id="notif_bell_button"
        onClick={() => setShowNotifMenu(!showNotifMenu)}
        className="relative p-2 text-slate-400 hover:text-blue-600 bg-white hover:bg-slate-50 rounded-xl transition cursor-pointer border border-slate-200/80 shadow-sm"
      >
        <Bell className="h-5 w-5" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"
            />
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {showNotifMenu && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-3 w-80 max-h-[480px] overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-xl z-50 flex flex-col"
          >
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span>Notifications ({unreadCount})</span>
              </span>
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-[11px] text-slate-500 hover:text-rose-600 transition flex items-center space-x-1 font-semibold cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            <div className="overflow-y-auto max-h-[380px] divide-y divide-slate-100 subtle-scroll">
              {notifications.length === 0 ? (
                <div className="py-12 px-4 text-center text-slate-400 text-xs">
                  <Bell className="h-8 w-8 mx-auto stroke-1.5 stroke-slate-300 mb-2" />
                  <p>All clean! No new notifications.</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.notificationId}
                    className={`p-3.5 hover:bg-slate-50 transition flex items-start space-x-3 relative ${!notif.read ? 'bg-blue-50/20' : ''}`}
                  >
                    <div className={`p-1.5 rounded-lg mt-0.5 ${getNotifIconStyle(notif.type)}`}>
                      <Radio className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider truncate mr-1">
                          {notif.boardName}
                        </span>
                        {!notif.read && (
                          <button
                            onClick={() => handleMarkAsRead(notif.notificationId)}
                            className="text-blue-600 hover:text-blue-800 p-0.5 rounded-md hover:bg-blue-50 cursor-pointer"
                            title="Mark as read"
                          >
                            <Check className="h-3.5 w-3.5 stroke-[3px]" />
                          </button>
                        )}
                      </div>
                      <h4 className={`text-xs font-bold leading-tight truncate mt-0.5 ${!notif.read ? 'text-slate-900 font-semibold' : 'text-slate-700 font-normal'}`}>
                        {notif.title}
                      </h4>
                      <p className="text-xs text-slate-500 leading-normal mt-0.5 break-words">
                        {notif.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
