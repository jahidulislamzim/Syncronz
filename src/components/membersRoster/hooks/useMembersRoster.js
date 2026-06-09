'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext.jsx';
import { db, auth } from '../../../lib/firebase/client.js';
import { collection, query as firestoreQuery, onSnapshot } from 'firebase/firestore';
import { MemberRole } from '../../../types.js';
import { getAllUsers, joinBoard, leaveBoard } from '../../../lib/firebase/firestore.js';

export function useMembersRoster(boardId, creatorId, boardName, isArchived) {
  const router = useRouter();
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [systemUsers, setSystemUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isCoping, setIsCoping] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dropdownRef = useRef(null);

  const currentUserMember = members.find(m => m.uid === user?.uid);
  const isOwner = currentUserMember?.role === MemberRole.OWNER || user?.uid === creatorId;

  useEffect(() => {
    const membersQuery = firestoreQuery(collection(db, 'boards', boardId, 'members'));
    const unsubscribe = onSnapshot(membersQuery, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push(doc.data());
      });
      setMembers(list);
    }, (error) => {
      console.error("Board members snapshot error: ", error);
    });

    return () => unsubscribe();
  }, [boardId]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const uList = await getAllUsers();
        if (uList) setSystemUsers(uList);
      } catch (e) {
        console.warn("Could not query general users: ", e);
      }
    };
    loadUsers();
  }, [boardId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const memberEmails = new Set(members.map(m => m.email?.toLowerCase()));
  const availableUsers = systemUsers.filter(
    u => u.email && !memberEmails.has(u.email.toLowerCase())
  );

  const filteredUsers = query.trim()
    ? availableUsers.filter(u =>
        u.email?.toLowerCase().includes(query.toLowerCase()) ||
        u.displayName?.toLowerCase().includes(query.toLowerCase())
      )
    : availableUsers;

  const handleSelect = useCallback(async (targetUser) => {
    if (isArchived) return;
    setShowDropdown(false);
    setIsSubmitting(true);
    setMsg({ type: '', text: '' });

    try {
      await joinBoard(boardId, {
        uid: targetUser.uid,
        displayName: targetUser.displayName,
        email: targetUser.email,
        photoURL: targetUser.photoURL
      }, MemberRole.MEMBER);

      try {
        const token = await auth.currentUser?.getIdToken();
        if (token && targetUser.email) {
          fetch('/api/send-email', {
            method: 'POST',
            keepalive: true,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              type: 'board_joined',
              recipients: [{ email: targetUser.email, name: targetUser.displayName || '' }],
              actorName: user?.displayName || user?.email || 'An admin',
              boardId,
              boardName: boardName || 'Project Board'
            })
          }).catch(err => console.error('Failed to dispatch board join email:', err));
        }
      } catch (emailErr) {
        console.error('Failed to get token or trigger join email:', emailErr);
      }

      setMsg({ type: 'success', text: `Added ${targetUser.displayName} to board` });
      setQuery('');
      setTimeout(() => setMsg({ type: '', text: '' }), 4000);
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to add member.' });
    } finally {
      setIsSubmitting(false);
    }
  }, [isArchived, boardId, boardName, user]);

  const handleLeaveBoard = useCallback(async () => {
    if (isArchived) return;
    if (!window.confirm('Are you sure you want to leave this board?')) return;
    try {
      await leaveBoard(boardId, user.uid, user.displayName || user.email || 'Someone', user.photoURL || '');
      router.push('/');
    } catch (err) {
      console.error('Failed to leave board:', err);
      alert('Failed to leave board: ' + err.message);
    }
  }, [isArchived, boardId, user, router]);

  const handleRemoveMember = useCallback(async (member) => {
    if (isArchived) return;
    if (!window.confirm(`Are you sure you want to remove ${member.displayName || member.email || 'this member'} from the board?`)) return;
    try {
      await leaveBoard(boardId, member.uid, member.displayName || member.email || 'Someone', member.photoURL || '');
    } catch (err) {
      console.error('Failed to remove member:', err);
      alert('Failed to remove member: ' + err.message);
    }
  }, [isArchived, boardId]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (isArchived) return;
    const trimmed = query.trim();
    if (!trimmed) return;

    const exact = availableUsers.find(
      u => u.email?.toLowerCase() === trimmed.toLowerCase()
    );
    if (exact) {
      await handleSelect(exact);
      return;
    }

    setMsg({ type: 'error', text: `"${trimmed}" is not a registered user. Only users who have signed in can be added.` });
    setTimeout(() => setMsg({ type: '', text: '' }), 4000);
  }, [isArchived, query, availableUsers, handleSelect]);

  const handleCopyBoardId = useCallback(() => {
    navigator.clipboard.writeText(boardId);
    setIsCoping(true);
    setTimeout(() => setIsCoping(false), 2000);
  }, [boardId]);

  return {
    members,
    systemUsers,
    user,
    isOwner,
    isArchived,
    query,
    setQuery,
    showDropdown,
    setShowDropdown,
    isCoping,
    msg,
    isSubmitting,
    filteredUsers,
    dropdownRef,
    handleSelect,
    handleLeaveBoard,
    handleRemoveMember,
    handleSubmit,
    handleCopyBoardId,
  };
}
