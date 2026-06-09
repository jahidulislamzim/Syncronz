import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext.jsx';
import { db } from '../../../lib/firebase/client.js';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { getAllUsers, getInvitedUsers } from '../../../lib/firebase/firestore.js';

export const useDashboard = () => {
  const { user, profile, adminEmail } = useAuth();
  const navigate = useRouter();
  const [errorMsg, setErrorMsg] = useState('');
  const [pageLoading, setPageLoading] = useState(true);

  const [allBoards, setAllBoards] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [invitedUsers, setInvitedUsers] = useState([]);
  const [boardTaskCounts, setBoardTaskCounts] = useState({});

  const isSuperAdmin = useCallback((u) => {
    return !!(adminEmail && u.email?.toLowerCase() === adminEmail.toLowerCase());
  }, [adminEmail]);

  const refreshData = useCallback(async () => {
    try {
      const u = await getAllUsers();
      if (u) setAllUsers(u);
      const invited = await getInvitedUsers();
      setInvitedUsers(invited);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to refresh workspace roster.');
    }
  }, []);

  useEffect(() => {
    if (!profile) return;
    if (!profile?.isAdmin) {
      setPageLoading(false);
      return;
    }
    setPageLoading(true);
    const q = query(collection(db, 'boards'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.boardId && !data.isArchived) list.push(data);
      });
      setAllBoards(list);
    }, (err) => {
      console.error(err);
      setErrorMsg('Failed to sync boards.');
    });

    Promise.all([
      getAllUsers().then(u => { if (u) setAllUsers(u); }),
      getInvitedUsers().then(setInvitedUsers)
    ]).then(() => setPageLoading(false))
      .catch(() => setPageLoading(false));

    return () => unsubscribe();
  }, [profile]);

  useEffect(() => {
    if (!profile?.isAdmin) return;
    const unsubs = [];
    allBoards.forEach(board => {
      const unsub = onSnapshot(query(collection(db, 'boards', board.boardId, 'tasks')), (snap) => {
        setBoardTaskCounts(prev => ({ ...prev, [board.boardId]: snap.size }));
      }, (err) => {
        console.error(err);
      });
      unsubs.push(unsub);
    });
    return () => unsubs.forEach(u => u());
  }, [allBoards, profile?.isAdmin]);

  const stats = {
    totalBoards: allBoards.length,
    totalUsers: allUsers.length,
    acceptedUsers: allUsers.length,
    pendingInvites: invitedUsers.filter(i => i.status === 'pending').length,
    admins: allUsers.filter(u => u.isAdmin || isSuperAdmin(u)).length,
    totalTasks: Object.values(boardTaskCounts).reduce((a, b) => a + b, 0),
  };

  return {
    user,
    profile,
    adminEmail,
    navigate,
    errorMsg,
    pageLoading,
    allBoards,
    allUsers,
    invitedUsers,
    boardTaskCounts,
    isSuperAdmin,
    refreshData,
    stats
  };
};
