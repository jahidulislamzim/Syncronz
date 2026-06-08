'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../src/context/AuthContext.jsx';
import { db } from '../../../../src/lib/firebase/client.js';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { 
  createBoard, 
  joinBoard, 
  getAllUsers,
  archiveBoard,
  restoreBoard,
  deleteBoardPermanently
} from '../../../../src/lib/firebase/firestore.js';
import { 
  Plus, LogIn, LayoutDashboard, Search, X, UserPlus, Users, Crown, 
  ArrowRight, FolderKanban, Archive, RefreshCw, Trash2, ChevronRight, 
  ShieldAlert, CheckCircle, Info, FolderLock, Sparkles, LogOut
} from 'lucide-react';
import { BoardManagementSkeleton } from '../../../../src/components/PageLoader.jsx';

export default function BoardManagement() {
  const { user, profile } = useAuth();
  const navigate = useRouter();

  // Create form states
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Join form states
  const [joinId, setJoinId] = useState('');
  const [joinSubmitting, setJoinSubmitting] = useState(false);
  const [joinError, setJoinError] = useState('');

  // Workspace datasets
  const [allBoards, setAllBoards] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allUsersCount, setAllUsersCount] = useState(0);
  const [boardTaskCounts, setBoardTaskCounts] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const dropdownRef = useRef(null);

  // Tabbed view and modal toggles
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('create'); // 'create' | 'join'
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'archived'
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (text, type = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

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

  // Click outside to close user search dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userBoards = allBoards.filter(b =>
    b.creatorId === user?.uid ||
    profile?.joinedBoards?.includes(b.boardId)
  );

  const activeUserBoards = userBoards.filter(b => !b.isArchived);
  const archivedUserBoards = userBoards.filter(b => b.isArchived);

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
        setIsModalOpen(false);
        setName('');
        setDesc('');
        setSelectedMembers([]);
        showToast(`Successfully created board "${name.trim()}"`, 'success');
        navigate.push(`/boards/${bId}`);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to create board', 'error');
    }
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
      setIsModalOpen(false);
      setJoinId('');
      showToast('Joined workspace successfully', 'success');
      navigate.push(`/boards/${joinId.trim()}`);
    } catch (err) {
      setJoinError('Board not found or permissions mismatch.');
      showToast('Failed to join workspace', 'error');
    }
    setJoinSubmitting(false);
  };

  const handleArchive = async (board) => {
    if (!user) return;
    const confirmed = window.confirm(`Are you sure you want to archive "${board.name}"? Active tasks will be hidden, but all board content will be preserved.`);
    if (!confirmed) return;
    
    try {
      await archiveBoard(
        board.boardId, 
        user.uid, 
        profile?.displayName || user.displayName || 'Anonymous', 
        profile?.photoURL || user.photoURL || ''
      );
      showToast(`Archived workspace "${board.name}"`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to archive workspace', 'error');
    }
  };

  const handleRestore = async (board) => {
    if (!user) return;
    try {
      await restoreBoard(
        board.boardId, 
        user.uid, 
        profile?.displayName || user.displayName || 'Anonymous', 
        profile?.photoURL || user.photoURL || ''
      );
      showToast(`Restored workspace "${board.name}"`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to restore workspace', 'error');
    }
  };

  const handleDeletePermanently = async (board) => {
    if (!user) return;
    const confirmed = window.confirm(`WARNING: Are you sure you want to permanently delete workspace "${board.name}"? This will delete all tasks, comments, and members forever. This action CANNOT be undone!`);
    if (!confirmed) return;
    
    try {
      await deleteBoardPermanently(board.boardId);
      showToast(`Permanently deleted workspace "${board.name}"`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete workspace', 'error');
    }
  };

  const memberBoards = allBoards.filter(b => userBoards.some(ub => ub.boardId === b.boardId) && !b.isArchived);
  const totalUserTasks = memberBoards.reduce((sum, b) => sum + (boardTaskCounts[b.boardId] || 0), 0);

  if (pageLoading) return <BoardManagementSkeleton />;

  return (
    <div className="max-w-5xl mx-auto w-full py-8 space-y-8 px-4">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[200] animate-in fade-in slide-in-from-bottom-5 duration-350">
          <div className={`flex items-center space-x-3 px-4.5 py-3.5 rounded-2xl border shadow-xl ${
            toastMsg.type === 'error'
              ? 'bg-rose-50 border-rose-250 text-rose-850'
              : 'bg-emerald-50 border-emerald-250 text-emerald-850'
          }`}>
            {toastMsg.type === 'error' ? (
              <ShieldAlert className="w-5 h-5 shrink-0 text-rose-500" />
            ) : (
              <CheckCircle className="w-5 h-5 shrink-0 text-emerald-500" />
            )}
            <span className="text-xs font-bold font-sans">{toastMsg.text}</span>
            <button onClick={() => setToastMsg(null)} className="ml-3 opacity-60 hover:opacity-100 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="absolute top-[-30%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-30%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative z-10 px-8 md:px-10 py-8 md:py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="h-14 w-14 bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-black/10">
              <FolderKanban className="h-6 w-6 text-indigo-300" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white">Board Workspaces</h1>
                <span className="px-2.5 py-0.5 bg-emerald-500/15 border border-emerald-500/30 rounded-full text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Workspace</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
                Create new workspaces, enter your boards, or restore archived items.
              </p>
            </div>
          </div>
          
          <button
            onClick={() => {
              setIsModalOpen(true);
              setModalTab('create');
            }}
            className="px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-750 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/25 cursor-pointer shrink-0"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Add Workspace</span>
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl text-blue-600">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900 leading-none mb-1">{activeUserBoards.length}</p>
              <p className="text-[11px] text-slate-500 font-semibold font-sans">Active Boards</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
              <ArrowRight className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900 leading-none mb-1">{totalUserTasks}</p>
              <p className="text-[11px] text-slate-500 font-semibold font-sans">Active Tasks</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-xl text-amber-600">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900 leading-none mb-1">{archivedUserBoards.length}</p>
              <p className="text-[11px] text-slate-500 font-semibold font-sans">Archived Boards</p>
            </div>
          </div>
        </div>
        {profile?.isAdmin && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-50 border border-purple-100 rounded-xl text-purple-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900 leading-none mb-1">{allUsersCount}</p>
                <p className="text-[11px] text-slate-500 font-semibold font-sans">Total Users</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-3.5 px-5 text-xs font-bold border-b-2 transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'active' 
              ? 'border-indigo-600 text-indigo-650' 
              : 'border-transparent text-slate-450 hover:text-slate-700'
          }`}
        >
          <FolderKanban className="h-4 w-4" />
          <span>Active Workspaces</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'active' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'
          }`}>{activeUserBoards.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('archived')}
          className={`pb-3.5 px-5 text-xs font-bold border-b-2 transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'archived' 
              ? 'border-indigo-600 text-indigo-650' 
              : 'border-transparent text-slate-450 hover:text-slate-700'
          }`}
        >
          <Archive className="h-4 w-4" />
          <span>Archived Workspaces</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'archived' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'
          }`}>{archivedUserBoards.length}</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === 'active' ? (
          activeUserBoards.length === 0 ? (
            <div className="col-span-full py-20 px-8 text-center bg-slate-50/50 border border-dashed border-slate-300 rounded-3xl flex flex-col items-center justify-center space-y-4 max-w-xl mx-auto w-full my-4">
              <div className="h-14 w-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm">
                <FolderKanban className="h-6 w-6 stroke-[1.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">No Active Workspaces</h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                  Create a workspace from scratch or join an existing board to collaborate with your team.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(true);
                  setModalTab('create');
                }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm shadow-indigo-600/10"
              >
                Create new workspace
              </button>
            </div>
          ) : (
            activeUserBoards.map(board => (
              <BoardCard
                key={board.boardId}
                board={board}
                user={user}
                taskCount={boardTaskCounts[board.boardId] || 0}
                isOwner={board.creatorId === user?.uid}
                onArchive={handleArchive}
              />
            ))
          )
        ) : (
          archivedUserBoards.length === 0 ? (
            <div className="col-span-full py-20 px-8 text-center bg-slate-50/50 border border-dashed border-slate-300 rounded-3xl flex flex-col items-center justify-center space-y-4 max-w-xl mx-auto w-full my-4">
              <div className="h-14 w-14 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm">
                <Archive className="h-6 w-6 stroke-[1.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">No Archived Workspaces</h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                  Archived workspaces will be stored here. Owners can restore them back to active state or delete them permanently.
                </p>
              </div>
            </div>
          ) : (
            archivedUserBoards.map(board => (
              <BoardCard
                key={board.boardId}
                board={board}
                user={user}
                taskCount={boardTaskCounts[board.boardId] || 0}
                isOwner={board.creatorId === user?.uid}
                onRestore={handleRestore}
                onDeletePermanently={handleDeletePermanently}
              />
            ))
          )
        )}
      </div>

      {/* Add Workspace Modal Popup */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-150 max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 z-10">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/55 shrink-0">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-650">
                  <Plus className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Add Workspace</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl transition text-slate-400 hover:text-slate-655 cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setModalTab('create')}
                className={`flex-1 py-3 text-xs font-bold border-b-2 text-center transition cursor-pointer ${
                  modalTab === 'create' 
                    ? 'border-indigo-650 text-indigo-600' 
                    : 'border-transparent text-slate-450 hover:text-slate-650'
                }`}
              >
                Create Workspace
              </button>
              <button
                type="button"
                onClick={() => setModalTab('join')}
                className={`flex-1 py-3 text-xs font-bold border-b-2 text-center transition cursor-pointer ${
                  modalTab === 'join' 
                    ? 'border-indigo-655 text-indigo-600' 
                    : 'border-transparent text-slate-450 hover:text-slate-650'
                }`}
              >
                Join Workspace
              </button>
            </div>

            {/* Scrollable Tab Content */}
            <div className="p-6 overflow-y-auto subtle-scroll flex-1 space-y-4">
              {modalTab === 'create' ? (
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Board Name</label>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      placeholder="Board name (e.g. Sprint Goals)"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full text-xs px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 transition-all font-sans"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Description</label>
                    <textarea
                      placeholder="Description (optional)"
                      value={desc}
                      onChange={e => setDesc(e.target.value)}
                      rows={3}
                      className="w-full text-xs px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 transition-all font-sans resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Add Team Members</label>
                    <div className="relative" ref={dropdownRef}>
                      <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus-within:border-indigo-500 transition-all">
                        <Search className="w-4 h-4 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          placeholder="Search registered users..."
                          value={searchQuery}
                          onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                          onFocus={() => setShowDropdown(true)}
                          className="flex-1 text-xs bg-transparent outline-none font-sans"
                        />
                      </div>
                      {showDropdown && searchQuery && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-40 overflow-y-auto">
                          {filteredUsers.length === 0 ? (
                            <div className="p-3 text-xs text-slate-400 text-center italic">No users found</div>
                          ) : (
                            filteredUsers.map(u => (
                              <button
                                key={u.uid}
                                type="button"
                                onClick={() => addMember(u)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition text-left cursor-pointer border-b border-slate-50 last:border-0"
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
                                <UserPlus className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    {selectedMembers.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {selectedMembers.map(m => (
                          <span
                            key={m.uid}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-150 rounded-lg text-[11px] font-semibold text-indigo-700 font-sans"
                          >
                            {m.displayName}
                            <button
                              type="button"
                              onClick={() => removeMember(m.uid)}
                              className="text-indigo-400 hover:text-indigo-700 transition cursor-pointer"
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
                    className="w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-755 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md shadow-indigo-600/10"
                  >
                    {createSubmitting ? 'Creating...' : 'Create Board'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleJoin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Board ID</label>
                    <input
                      type="text"
                      required
                      placeholder="Board ID (e.g. board_xxxxxxxx)"
                      value={joinId}
                      onChange={e => setJoinId(e.target.value)}
                      className="w-full text-xs font-mono px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 transition-all uppercase tracking-wider font-sans"
                    />
                  </div>
                  {joinError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-[11px] font-medium rounded-xl leading-relaxed flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-red-500 shrink-0" />
                      <span>{joinError}</span>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={joinSubmitting || !joinId.trim()}
                    className="w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-755 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md shadow-indigo-600/10"
                  >
                    {joinSubmitting ? 'Joining...' : 'Join Board'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-Component for Board Card ──────────────────────────────────────
function BoardCard({ board, user, taskCount, isOwner, onArchive, onRestore, onDeletePermanently }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const q = query(collection(db, 'boards', board.boardId, 'members'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data());
      });
      setMembers(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [board.boardId]);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 group relative">
      <div className="space-y-2.5">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-indigo-500 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-all duration-200">
              <FolderKanban className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-1">
                {board.name}
              </h4>
              <p className="text-[10px] text-slate-400 font-mono font-semibold">ID: {board.boardId.split('_')[1]}</p>
            </div>
          </div>
          {board.isArchived && (
            <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-lg text-[9px] font-bold text-amber-600 font-mono uppercase tracking-wider">
              Archived
            </span>
          )}
        </div>

        {board.description ? (
          <p className="text-xs text-slate-505 line-clamp-2 leading-relaxed">
            {board.description}
          </p>
        ) : (
          <p className="text-xs text-slate-400 italic">No description provided.</p>
        )}
      </div>

      <div className="pt-3 border-t border-slate-100/70 flex items-center justify-between">
        <div className="flex -space-x-2 overflow-hidden">
          {members.slice(0, 4).map((member) => (
            <img
              key={member.uid}
              className="inline-block h-6.5 w-6.5 rounded-full ring-2 ring-white object-cover"
              src={member.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.displayName || member.uid)}`}
              alt={member.displayName}
              title={member.displayName}
              referrerPolicy="no-referrer"
            />
          ))}
          {members.length > 4 && (
            <div className="inline-flex items-center justify-center h-6.5 w-6.5 rounded-full ring-2 ring-white bg-slate-100 text-[9px] font-bold text-slate-500">
              +{members.length - 4}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400 font-mono">
          <span>{taskCount} Tasks</span>
          <span>&bull;</span>
          <span>{members.length} Members</span>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        {!board.isArchived ? (
          <>
            <button
              onClick={() => router.push(`/boards/${board.boardId}`)}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm shadow-indigo-600/10 cursor-pointer"
            >
              <span>Enter Board</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            {isOwner && (
              <button
                onClick={() => onArchive(board)}
                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl border border-transparent hover:border-amber-100 transition cursor-pointer"
                title="Archive Board"
              >
                <Archive className="h-4 w-4" />
              </button>
            )}
          </>
        ) : (
          <>
            {isOwner ? (
              <>
                <button
                  onClick={() => onRestore(board)}
                  className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Restore</span>
                </button>
                <button
                  onClick={() => onDeletePermanently(board)}
                  className="p-2 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition cursor-pointer"
                  title="Delete Permanently"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            ) : (
              <div className="w-full text-center py-2 text-[10px] text-slate-400 font-medium bg-slate-50 border border-slate-100 rounded-xl italic flex items-center justify-center space-x-1">
                <FolderLock className="h-3 w-3" />
                <span>Locked (Read Only)</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
