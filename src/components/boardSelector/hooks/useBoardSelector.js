import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { db } from '../../../lib/firebase/client.js';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { MemberRole } from '../../../types.js';
import { createBoard, joinBoard } from '../../../lib/firebase/firestore.js';

export const useBoardSelector = (currentBoardId, onSelectBoard, onClose) => {
  const { user, profile } = useAuth();
  const [boards, setBoards] = useState([]);
  const [activeTab, setActiveTab] = useState('my');
  
  const [boardName, setBoardName] = useState('');
  const [boardDesc, setBoardDesc] = useState('');
  
  const [joinId, setJoinId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const boardsQuery = query(collection(db, 'boards'));
    const unsubscribe = onSnapshot(boardsQuery, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push(doc.data());
      });
      setBoards(list);
    }, (error) => {
      console.error("Board fetching error: ", error);
    });

    return () => unsubscribe();
  }, []);

  const handleCreate = async (e) => {
    if (e) e.preventDefault();
    if (!user || !boardName.trim()) return;

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const creatorProfile = {
        displayName: profile?.displayName || user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        photoURL: profile?.photoURL || user.photoURL || 'https://api.dicebear.com/7.x/initials/svg?seed=user'
      };

      const boardId = await createBoard(
        boardName.trim(),
        boardDesc.trim(),
        user.uid,
        creatorProfile
      );

      if (boardId) {
        onSelectBoard(boardId);
        setBoardName('');
        setBoardDesc('');
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create board.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = async (e) => {
    if (e) e.preventDefault();
    if (!user || !joinId.trim()) return;

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const memberDetails = {
        uid: user.uid,
        displayName: profile?.displayName || user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        photoURL: profile?.photoURL || user.photoURL || 'https://api.dicebear.com/7.x/initials/svg?seed=user'
      };

      await joinBoard(joinId.trim(), memberDetails, MemberRole.MEMBER);
      onSelectBoard(joinId.trim());
      setJoinId('');
      onClose();
    } catch (err) {
      try {
        const decoded = JSON.parse(err.message);
        setErrorMsg(decoded.error || err.message);
      } catch {
        setErrorMsg(err.message || 'Workspace board not found or insufficient access permissions.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickJoin = async (boardId) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const memberDetails = {
        uid: user.uid,
        displayName: profile?.displayName || user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        photoURL: profile?.photoURL || user.photoURL || 'https://api.dicebear.com/7.x/initials/svg?seed=user'
      };

      await joinBoard(boardId, memberDetails, MemberRole.MEMBER);
      onSelectBoard(boardId);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const userBoards = boards.filter(b => 
    profile?.isAdmin || 
    b.creatorId === user?.uid || 
    profile?.joinedBoards?.includes(b.boardId)
  );

  const availablePublicBoards = boards.filter(b => 
    !profile?.isAdmin && 
    b.creatorId !== user?.uid && 
    !profile?.joinedBoards?.includes(b.boardId)
  );

  return {
    boards,
    activeTab,
    setActiveTab,
    boardName,
    setBoardName,
    boardDesc,
    setBoardDesc,
    joinId,
    setJoinId,
    isSubmitting,
    errorMsg,
    handleCreate,
    handleJoin,
    handleQuickJoin,
    userBoards,
    availablePublicBoards
  };
};
