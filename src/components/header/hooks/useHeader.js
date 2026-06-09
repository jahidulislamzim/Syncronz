import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext.jsx';
import { db } from '../../../lib/firebase/client.js';
import { collection, query, orderBy, limit, onSnapshot, doc } from 'firebase/firestore';
import { markNotificationAsRead, clearAllNotifications } from '../../../lib/firebase/firestore.js';
import { playChime } from '../utils/audio.js';

export const useHeader = (propBoardName, propSelector) => {
  const { user, profile, signOut } = useAuth();
  const navigate = useRouter();
  const params = useParams();
  
  const [boardName, setBoardName] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [activeToast, setActiveToast] = useState(null);
  
  const notifMenuRef = useRef(null);
  const isFirstMount = useRef(true);

  // Derive board name from route parameter or prop value
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

  const onOpenBoardSelector = propSelector || (() => navigate.push('/boards/new'));

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

  // Request browser notification permissions
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Listen to real-time notification collection
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

      // Handle unread toast and system alerts
      if (newUnreadFound && targetToastNotif) {
        setActiveToast(targetToastNotif);
        playChime();

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
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

  // Click outside listener for notification menu
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

  return {
    user,
    profile,
    boardName,
    loggingOut,
    notifications,
    showNotifMenu,
    setShowNotifMenu,
    activeToast,
    setActiveToast,
    notifMenuRef,
    unreadCount,
    onOpenBoardSelector,
    handleSignOutClick,
    handleMarkAsRead,
    handleClearAll
  };
};
