'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext.jsx';
import { db } from '../lib/firebase/client.js';
import { collection, query, orderBy, limit, onSnapshot, doc } from 'firebase/firestore';
import { Bell, Check, Trash2, Shield, Radio, Sparkles, LogOut, Menu } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { markNotificationAsRead, clearAllNotifications } from '../lib/firebase/firestore.js';
import { NotificationType } from '../types.js';

export const Header = ({ currentBoardName: propBoardName, onOpenBoardSelector: propSelector, onToggleSidebar }) => {
  const { user, profile, signOut } = useAuth();
  const navigate = useRouter();
  const params = useParams();
  const [boardName, setBoardName] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleSignOutClick = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      navigate.replace('/login');
    } catch (e) {
      console.error(e);
      setLoggingOut(false);
    }
  };

  // Derive board name from route or prop
  const boardId = params.boardId;
  useEffect(() => {
    if (propBoardName !== undefined) {
      setBoardName(propBoardName);
      return;
    }
    if (!boardId) {
      setBoardName(null);
      return;
    }
    const unsubscribe = onSnapshot(doc(db, 'boards', boardId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setBoardName(data.name);
      }
    });
    return () => unsubscribe();
  }, [boardId, propBoardName]);

  const currentBoardName = boardName;
  const onOpenBoardSelector = propSelector || (() => navigate.push('/boards/new'));
  const [notifications, setNotifications] = useState([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [activeToast, setActiveToast] = useState(null);
  const notifMenuRef = useRef(null);
  const isFirstMount = useRef(true);

  // Sound chime synthesizer using native Web Audio API (craftsmanship touch, no external files)
  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc1.frequency.value = 523.25; // C5
      osc2.frequency.value = 659.25; // E5
      
      osc1.type = 'sine';
      osc2.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
      
      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime + 0.08); // Arpeggiated chime
      
      osc1.stop(ctx.currentTime + 0.8);
      osc2.stop(ctx.currentTime + 0.8);
    } catch (e) {
      // Ignored if browser policy blocks instant audio
    }
  };

  // 1. Request Browser standard notification permissions
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // 2. Real-time Notifications Hook
  useEffect(() => {
    if (!user) return;

    const notifRef = collection(db, 'users', user.uid, 'notifications');
    const q = query(
      notifRef,
      orderBy('createdAt', 'desc'),
      limit(40)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      let newUnreadFound = false;
      let targetToastNotif = null;
      
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const item = change.doc.data();
          if (!isFirstMount.current && !item.read) {
            newUnreadFound = true;
            targetToastNotif = item;
          }
        }
      });

      snapshot.docs.forEach(docSnap => {
        list.push(docSnap.data());
      });

      setNotifications(list);
      isFirstMount.current = false;

      // Unread notifications push trigger
      if (newUnreadFound && targetToastNotif) {
        // Trigger visual toast banner
        setActiveToast(targetToastNotif);
        playChime();

        // Trigger native OS notifications if allowed
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(targetToastNotif.title, {
            body: targetToastNotif.message,
            icon: 'https://api.dicebear.com/7.x/shapes/svg?seed=notif'
          });
        }

        setTimeout(() => {
          setActiveToast(curr => curr?.notificationId === targetToastNotif?.notificationId ? null : curr);
        }, 5500);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Click outside notification menu closer
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target)) {
        setShowNotifMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (notifId) => {
    if (!user) return;
    try {
      await markNotificationAsRead(user.uid, notifId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAll = async () => {
    if (!user) return;
    try {
      const ids = notifications.map(n => n.notificationId);
      await clearAllNotifications(user.uid, ids);
      setShowNotifMenu(false);
    } catch (e) {
      console.error(e);
    }
  };

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
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shrink-0 sticky top-0 z-40">
      {/* Brand logo & Active Board display */}
      <div className="flex items-center gap-3">
        {/* Sidebar toggle — mobile */}
        <button
          onClick={onToggleSidebar}
          className="min-[1400px]:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer -ml-1"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile brand */}
        <div className="flex items-center gap-2 min-[1400px]:hidden">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-slate-900 font-bold tracking-tight text-sm">Syncronz</span>
        </div>

        {/* Desktop board title */}
        <div className="hidden min-[1400px]:flex items-center gap-3">
          <h1 className="text-lg font-bold text-slate-900">
            {currentBoardName || 'No Board Selected'}
          </h1>
          <div className="flex items-center px-2 py-1 bg-emerald-50 rounded text-[10px] font-bold text-emerald-700 uppercase tracking-tighter">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span> Real-time Synced
          </div>
        </div>

        {/* Board switcher */}
        <button 
          onClick={onOpenBoardSelector}
          className="hidden sm:flex items-center space-x-1 px-2.5 py-1 bg-slate-50 border border-slate-200 hover:border-slate-350 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 transition cursor-pointer shadow-sm"
        >
          <Sparkles className="h-3.5 w-3.5 text-blue-600" />
          <span>Switch Workspace</span>
        </button>
      </div>

      {/* Quick controls */}
      <div className="flex items-center gap-4">
        {/* Real-time Notifications Bell */}
        {user && (
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

            {/* Notification Menu Content */}
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
                                  className="text-blue-600 hover:text-blue-800 p-0.5 rounded-md hover:bg-blue-50"
                                  title="Mark as read"
                                >
                                  <Check className="h-3.5 w-3.5 stroke-[3px]" />
                                </button>
                              )}
                            </div>
                            <h4 className={`text-xs font-bold leading-tight truncate mt-0.5 ${!notif.read ? 'text-slate-900 font-semibold' : 'text-slate-705 font-normal'}`}>
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
        )}

        {profile && (
          <div className="flex items-center gap-3 bg-slate-50/50 p-1.5 border border-slate-200/60 rounded-xl">
            <img
              src={profile.photoURL}
              alt={profile.displayName}
              referrerPolicy="no-referrer"
              className="w-7 h-7 rounded-xl object-cover border border-slate-200/50"
            />
            <div className="hidden min-[1400px]:block min-w-0 pr-1.5">
              <p className="text-xs font-bold text-slate-800 truncate max-w-[100px]">{profile.displayName}</p>
            </div>
            <button
              onClick={handleSignOutClick}
              disabled={loggingOut}
              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer disabled:opacity-50"
              title="Sign Out"
            >
              {loggingOut ? (
                <span className="w-4 h-4 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* --- LIVE REAL-TIME CHIME PUSH TOAST BANNER --- */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, x: 100, y: 0, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="fixed top-20 right-6 z-50 max-w-sm w-full bg-[#0F172A] text-slate-200 rounded-2xl shadow-xl overflow-hidden border border-slate-800 flex flex-col pointer-events-auto"
          >
            {/* Header glow */}
            <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500" />
            <div className="p-4 flex items-start space-x-3">
              <div className="p-2 ml-1 rounded-xl bg-slate-800 text-blue-400 border border-slate-700 shadow-inner">
                <Bell className="h-4 w-4 animate-bounce text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 tracking-widest font-mono uppercase">
                    {activeToast.boardName} &bull; Broadcast
                  </span>
                  <button 
                    onClick={() => {
                      handleMarkAsRead(activeToast.notificationId);
                      setActiveToast(null);
                    }}
                    className="text-slate-400 hover:text-white transition"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </div>
                <h3 className="text-xs font-bold text-white leading-tight mt-1 truncate">{activeToast.title}</h3>
                <p className="text-xs text-slate-300 mt-1 leading-normal break-words">{activeToast.message}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
