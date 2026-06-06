'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../src/context/AuthContext.jsx';
import { db } from '../../../../src/lib/firebase/client.js';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { createBoard, joinBoard, getAllUsers } from '../../../../src/lib/firebase/firestore.js';
import { Plus, LogIn, LayoutDashboard, Search, X, UserPlus, Users, Crown, ArrowRight } from 'lucide-react';
import { BoardManagementSkeleton } from '../../../../src/components/PageLoader.jsx';

export default function BoardManagement() {
  const { user, profile, adminEmail } = useAuth();
  const navigate = useRouter();

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const [joinId, setJoinId] = useState('');
  const [joinSubmitting, setJoinSubmitting] = useState(false);
  const [joinError, setJoinError] = useState('');

  const [allBoards, setAllBoards] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allUsersCount, setAllUsersCount] = useState(0);
  const [boardTaskCounts, setBoardTaskCounts] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, 'boards'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data());
      });
      setAllBoards(list);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    getAllUsers().then(u => {
      if (u) {
        setAllUsers(u);
        setAllUsersCount(u.length);
      }
      setPageLoading(false);
    });
  }, []);

  useEffect(() => {
    const unsubs = [];
    allBoards.forEach(board => {
      const unsub = onSnapshot(query(collection(db, 'boards', board.boardId, 'tasks')), (snap) => {
        setBoardTaskCounts(prev => ({ ...prev, [board.boardId]: snap.size }));
      });
      unsubs.push(unsub);
    });
    return () => unsubs.forEach(u => u());
  }, [allBoards]);

  const userBoards = allBoards.filter(b =>
    b.creatorId === user?.uid ||
    profile?.joinedBoards?.includes(b.boardId)
  );

  const filteredUsers = allUsers.filter(u =>
    u.uid !== user?.uid &&
    !selectedMembers.some(m => m.uid === u.uid) &&
    (!searchQuery || u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const addMember = (u) => {
    setSelectedMembers(prev => [...prev, u]);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const removeMember = (uid) => {
    setSelectedMembers(prev => prev.filter(m => m.uid !== uid));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setCreateSubmitting(true);
    try {
      const creatorProfile = {
        displayName: profile?.displayName || user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        photoURL: profile?.photoURL || user.photoURL || 'https://api.dicebear.com/7.x/initials/svg?seed=user'
      };
      const bId = await createBoard(name.trim(), desc.trim(), user.uid, creatorProfile);
      if (bId) {
        for (const m of selectedMembers) {
          await joinBoard(bId, {
            uid: m.uid,
            displayName: m.displayName,
            email: m.email || '',
            photoURL: m.photoURL
          });
        }
        navigate.push(`/boards/${bId}`);
      }
    } catch {}
    setCreateSubmitting(false);
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!user || !joinId.trim()) return;
    setJoinSubmitting(true);
    setJoinError('');
    try {
      const memberDetails = {
        uid: user.uid,
        displayName: profile?.displayName || user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        photoURL: profile?.photoURL || user.photoURL || 'https://api.dicebear.com/7.x/initials/svg?seed=user'
      };
      await joinBoard(joinId.trim(), memberDetails);
      navigate.push(`/boards/${joinId.trim()}`);
    } catch {
      setJoinError('Board not found or permissions mismatch.');
    }
    setJoinSubmitting(false);
  };

  const memberBoards = allBoards.filter(b => userBoards.some(ub => ub.boardId === b.boardId));
  const totalUserTasks = memberBoards.reduce((sum, b) => sum + (boardTaskCounts[b.boardId] || 0), 0);

  if (pageLoading) return <BoardManagementSkeleton />;

  return (
    <div className="max-w-5xl mx-auto w-full py-8 space-y-8">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="absolute top-[-30%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-30%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative z-10 px-8 md:px-10 py-8 md:py-10">
          <div className="flex items-start gap-5">
            <div className="h-14 w-14 bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-black/10">
              <LayoutDashboard className="h-6 w-6 text-indigo-300" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white">Board Management</h1>
                <span className="px-2.5 py-0.5 bg-emerald-500/15 border border-emerald-500/30 rounded-full text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Workspace</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
                Manage your boards, create new ones, or join existing workspaces.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl"><LayoutDashboard className="w-4.5 h-4.5 text-blue-600" /></div>
            <div>
              <p className="text-xl font-bold text-slate-900">{userBoards.length}</p>
              <p className="text-[11px] text-slate-500 font-medium">My Boards</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-xl"><ArrowRight className="w-4.5 h-4.5 text-indigo-600" /></div>
            <div>
              <p className="text-xl font-bold text-slate-900">{totalUserTasks}</p>
              <p className="text-[11px] text-slate-500 font-medium">My Tasks</p>
            </div>
          </div>
        </div>
        {profile?.isAdmin && (
          <>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-xl"><LayoutDashboard className="w-4.5 h-4.5 text-emerald-600" /></div>
                <div>
                  <p className="text-xl font-bold text-slate-900">{allBoards.length}</p>
                  <p className="text-[11px] text-slate-500 font-medium">Total Boards</p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-xl"><Users className="w-4.5 h-4.5 text-purple-600" /></div>
                <div>
                  <p className="text-xl font-bold text-slate-900">{allUsersCount}</p>
                  <p className="text-[11px] text-slate-500 font-medium">Total Users</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 to-blue-600" />
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm shadow-blue-500/15">
                <Plus className="h-4.5 w-4.5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Create Board</h3>
                <p className="text-xs text-slate-400">Start a new workspace from scratch</p>
              </div>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                type="text"
                required
                maxLength={100}
                placeholder="Board name (e.g. Sprint Goals)"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={desc}
                onChange={e => setDesc(e.target.value)}
                className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
              />

              <div className="pt-2">
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">Add People</label>
                <div className="relative" ref={dropdownRef}>
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search registered users..."
                      value={searchQuery}
                      onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                      onFocus={() => setShowDropdown(true)}
                      className="flex-1 text-sm bg-transparent outline-none"
                    />
                  </div>
                  {showDropdown && searchQuery && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
                      {filteredUsers.length === 0 ? (
                        <div className="p-3 text-xs text-slate-400 text-center">No users found</div>
                      ) : (
                        filteredUsers.map(u => (
                          <button
                            key={u.uid}
                            type="button"
                            onClick={() => addMember(u)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition text-left cursor-pointer border-b border-slate-50 last:border-0"
                          >
                            <img
                              src={u.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.displayName)}`}
                              alt={u.displayName}
                              className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-800 truncate">{u.displayName}</p>
                              <p className="text-xs text-slate-500 font-mono truncate">{u.email}</p>
                            </div>
                            <UserPlus className="w-4 h-4 text-blue-500 shrink-0" />
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {selectedMembers.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selectedMembers.map(m => (
                      <span
                        key={m.uid}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg text-xs font-semibold text-blue-700"
                      >
                        {m.displayName}
                        <button
                          type="button"
                          onClick={() => removeMember(m.uid)}
                          className="text-blue-400 hover:text-blue-700 transition cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={createSubmitting || !name.trim()}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition cursor-pointer shadow-lg shadow-blue-600/15"
              >
                {createSubmitting ? 'Creating...' : 'Create Board'}
              </button>
            </form>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600" />
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm shadow-emerald-500/15">
                <LogIn className="h-4.5 w-4.5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Join Board</h3>
                <p className="text-xs text-slate-400">Connect to an existing workspace</p>
              </div>
            </div>
            <form onSubmit={handleJoin} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Board ID (e.g. board_xxxxxxxx)"
                value={joinId}
                onChange={e => setJoinId(e.target.value)}
                className="w-full text-sm font-mono px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all uppercase tracking-wider"
              />
              <button
                type="submit"
                disabled={joinSubmitting || !joinId.trim()}
                className="w-full py-2.5 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-slate-950 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition cursor-pointer shadow-lg shadow-slate-900/15"
              >
                {joinSubmitting ? 'Joining...' : 'Join Board'}
              </button>
              {joinError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl leading-relaxed flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                  {joinError}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
