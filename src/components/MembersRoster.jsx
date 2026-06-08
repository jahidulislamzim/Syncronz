'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext.jsx';
import { db, auth } from '../lib/firebase/client.js';
import { collection, query as firestoreQuery, onSnapshot } from 'firebase/firestore';
import { MemberRole } from '../types.js';
import { getAllUsers, joinBoard, leaveBoard } from '../lib/firebase/firestore.js';
import { Users, UserPlus, Shield, Copy, Check, LogOut, Radio, X, Search } from 'lucide-react';

export const MembersRoster = ({ boardId, creatorId, boardName, isArchived = false }) => {
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

  const handleSelect = async (targetUser) => {
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

      // Send email notification
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
  };

  const handleLeaveBoard = async () => {
    if (isArchived) return;
    if (!window.confirm('Are you sure you want to leave this board?')) return;
    try {
      await leaveBoard(boardId, user.uid, user.displayName || user.email || 'Someone', user.photoURL || '');
      router.push('/');
    } catch (err) {
      console.error('Failed to leave board:', err);
      alert('Failed to leave board: ' + err.message);
    }
  };

  const handleRemoveMember = async (member) => {
    if (isArchived) return;
    if (!window.confirm(`Are you sure you want to remove ${member.displayName || member.email || 'this member'} from the board?`)) return;
    try {
      await leaveBoard(boardId, member.uid, member.displayName || member.email || 'Someone', member.photoURL || '');
    } catch (err) {
      console.error('Failed to remove member:', err);
      alert('Failed to remove member: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
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
  };

  const handleCopyBoardId = () => {
    navigator.clipboard.writeText(boardId);
    setIsCoping(true);
    setTimeout(() => setIsCoping(false), 2000);
  };

  const isUserOnline = (lastActiveString) => {
    if (!lastActiveString) return false;
    const lastActive = new Date(lastActiveString).getTime();
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return lastActive > fiveMinutesAgo;
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm">
      <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-t-2xl" />
      <div className="p-5 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center space-x-1.5">
            <Users className="h-4 w-4 text-slate-500" />
            <span>Roster ({members.length})</span>
          </h3>
          <button
            onClick={handleCopyBoardId}
            className="flex items-center space-x-1.5 px-2 py-1 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-[10px] font-mono font-bold text-slate-500 transition cursor-pointer"
            title="Click to copy Board ID"
          >
            {isCoping ? (
              <>
                <Check className="h-3 w-3 text-emerald-500" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span className="truncate max-w-[80px]">ID: {boardId.split('_')[1]}</span>
              </>
            )}
          </button>
        </div>

      {isArchived ? (
        <div className="text-center text-[11px] text-amber-600 font-semibold py-3 bg-amber-50 rounded-xl border border-amber-100 font-mono">
          Roster is locked because this board is archived.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2 relative">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1">
            <UserPlus className="h-3 w-3" />
            <span>Add Team Member</span>
          </h4>

          {msg.text && (
            <div className={`p-2.5 rounded-xl border text-[10px] font-medium leading-relaxed ${msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
              {msg.text}
            </div>
          )}

          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="Search registered users..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg outline-none transition"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => { setQuery(''); setShowDropdown(false); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={isSubmitting || !query.trim()}
                className="py-2 px-3 bg-blue-600 border border-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer shadow-sm"
              >
                {isSubmitting ? 'Adding...' : 'Add'}
              </button>
            </div>

            {showDropdown && filteredUsers.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-36 overflow-y-auto">
                {filteredUsers.map((u) => (
                  <button
                    key={u.uid}
                    type="button"
                    onClick={() => handleSelect(u)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition text-left cursor-pointer border-b border-slate-100 last:border-0"
                  >
                    <img
                      src={u.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.displayName || u.uid)}`}
                      alt={u.displayName}
                      className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 truncate">{u.displayName}</p>
                      <p className="text-[10px] text-slate-500 font-mono truncate">{u.email}</p>
                    </div>
                    <UserPlus className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {showDropdown && query.trim() && filteredUsers.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-3 text-center">
                <p className="text-xs text-slate-500">No registered users match "{query}"</p>
                <p className="text-[10px] text-slate-400 mt-1">Only users who have signed in can be added</p>
              </div>
            )}
          </div>
        </form>
      )}

      <div className="pt-4 border-t border-slate-100 space-y-3.5 max-h-[220px] overflow-y-auto pr-1 subtle-scroll">
        {members.map((member) => {
          const fullUser = systemUsers.find((u) => u.uid === member.uid);
          const online = isUserOnline(fullUser?.lastActive || member.joinedAt);

          return (
            <div key={member.uid} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img
                    src={member.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.displayName)}`}
                    alt={member.displayName}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-lg object-cover bg-slate-100 border border-slate-200/50"
                  />
                  <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 leading-none truncate max-w-[130px]">{member.displayName}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-mono truncate max-w-[130px]">{member.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md font-mono flex items-center space-x-1 ${member.role === MemberRole.OWNER ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
                  {member.role === MemberRole.OWNER ? (
                    <>
                      <Shield className="h-2.5 w-2.5" />
                      <span>Owner</span>
                    </>
                  ) : (
                    <span>Collab</span>
                  )}
                </span>
                
                {/* Actions */}
                {!isArchived && member.role !== MemberRole.OWNER && (
                  <>
                    {/* If this is the current user themselves, they can Leave */}
                    {member.uid === user?.uid && (
                      <button
                        onClick={handleLeaveBoard}
                        className="p-1 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg transition cursor-pointer"
                        title="Leave Board"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                      </button>
                    )}
                    
                    {/* If current user is owner, they can remove other members */}
                    {isOwner && member.uid !== user?.uid && (
                      <button
                        onClick={() => handleRemoveMember(member)}
                        className="p-1 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg transition cursor-pointer"
                        title="Remove member"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
};
