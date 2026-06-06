import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { db } from '../lib/firebase.js';
import { collection, query, onSnapshot, getDocs } from 'firebase/firestore';
import { MemberRole } from '../types.js';
import { createBoard, joinBoard } from '../lib/services.js';
import { X, Plus, LogIn, Sparkles, FolderOpen, Tag, Calendar, User, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export const BoardSelector = ({ currentBoardId, onSelectBoard, onClose }) => {
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
    e.preventDefault();
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
    e.preventDefault();
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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900 cursor-pointer"
      />

      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 24, stiffness: 220 }}
        className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col border-l border-slate-200/60 z-10"
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FolderOpen className="h-5 w-5 text-indigo-500" />
            <h2 className="text-base font-bold text-slate-800">Workspace Boards</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-50 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex border-b border-slate-100 bg-slate-50/55 p-1 mx-4 my-3.5 rounded-xl border">
          <button
            onClick={() => setActiveTab('my')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'my' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            My Boards ({userBoards.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'create' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Create Board
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'join' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Join Board
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 subtle-scroll">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl leading-relaxed">
              <span className="font-bold">Error:</span> {errorMsg}
            </div>
          )}

          {activeTab === 'my' && (
            <div className="space-y-4">
              {userBoards.length === 0 ? (
                <div className="py-20 text-center text-slate-400">
                  <Sparkles className="h-10 w-10 mx-auto text-indigo-400 stroke-1 mb-3 animate-spin duration-3000" />
                  <p className="text-sm font-semibold text-slate-700">No active boards yet</p>
                  <p className="text-xs text-slate-400 max-w-[200px] mx-auto mt-1">Create a new board or join an existing board token to start collaborating.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">Joined Boards</h3>
                  {userBoards.map((board) => (
                    <button
                      key={board.boardId}
                      onClick={() => {
                        onSelectBoard(board.boardId);
                        onClose();
                      }}
                      className={`w-full p-4 rounded-xl text-left border flex items-center justify-between cursor-pointer transition-all ${currentBoardId === board.boardId ? 'bg-indigo-50/20 border-indigo-200 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
                    >
                      <div className="min-w-0 pr-3">
                        <h4 className="text-xs font-bold text-slate-800 truncate">{board.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[280px]">
                          {board.description || 'No description assigned.'}
                        </p>
                      </div>
                      <ArrowRight className={`h-4 w-4 shrink-0 transition-opacity ${currentBoardId === board.boardId ? 'text-indigo-500 opacity-100' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`} />
                    </button>
                  ))}
                </div>
              )}

              {availablePublicBoards.length > 0 && (
                <div className="pt-6 border-t border-slate-100 space-y-2">
                  <h3 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1 flex items-center space-x-1.5">
                    <User className="h-3.5 w-3.5" />
                    <span>Explore System Boards ({availablePublicBoards.length})</span>
                  </h3>
                  {availablePublicBoards.map((board) => (
                    <div
                      key={board.boardId}
                      className="p-4 bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-xl flex items-center justify-between transition"
                    >
                      <div className="min-w-0 pr-3">
                        <h4 className="text-xs font-bold text-slate-800 truncate">{board.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[220px]">
                          {board.description || 'No description assigned.'}
                        </p>
                        <p className="text-[9px] font-mono tracking-wider text-slate-400 mt-1 font-semibold">
                          ID: {board.boardId}
                        </p>
                      </div>
                      <button
                        onClick={() => handleQuickJoin(board.boardId)}
                        disabled={isSubmitting}
                        className="py-1.5 px-3 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg text-[10px] font-bold text-indigo-600 transition cursor-pointer flex items-center space-x-1 whitespace-nowrap"
                      >
                        <LogIn className="h-3 w-3" />
                        <span>Join Live</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'create' && (
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Board Name</label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  placeholder="e.g. Core Engineering, Marketing Campaign"
                  value={boardName}
                  onChange={(e) => setBoardName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Description (Optional)</label>
                <textarea
                  placeholder="Write a brief overview of what this board will manage..."
                  rows={4}
                  value={boardDesc}
                  onChange={(e) => setBoardDesc(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white outline-none transition resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !boardName.trim()}
                className="w-full py-3 bg-slate-900 lg:hover:bg-slate-800 disabled:opacity-55 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 shadow-md shadow-slate-900/10 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>{isSubmitting ? 'Creating Layout...' : 'Build Project Board'}</span>
              </button>
            </form>
          )}

          {activeTab === 'join' && (
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Enter Board ID Token</label>
                <p className="text-[11px] text-slate-400">Ask the board owner to share their Board ID (accessible in the board roster header) and paste it below.</p>
                <input
                  type="text"
                  required
                  placeholder="e.g. board_xxxxxxxxx"
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value)}
                  className="w-full text-xs font-mono px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white outline-none transition uppercase tracking-wider"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !joinId.trim()}
                className="w-full py-3 bg-slate-900 lg:hover:bg-slate-800 disabled:opacity-55 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 shadow-md cursor-pointer"
              >
                <LogIn className="h-4 w-4" />
                <span>{isSubmitting ? 'Verifying Ticket...' : 'Join Shared Board'}</span>
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
