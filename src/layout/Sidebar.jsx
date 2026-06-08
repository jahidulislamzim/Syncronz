'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext.jsx';
import { db } from '../lib/firebase/client.js';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { Landmark, ShieldCheck, Plus, Timer, Settings, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, profile } = useAuth();
  const pathname = usePathname();
  const [allBoards, setAllBoards] = useState([]);

  const isActive = (path) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'boards'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data());
      });
      setAllBoards(list);
    });
    return () => unsubscribe();
  }, [user]);

  const userBoards = allBoards.filter(b =>
    !b.isArchived && (
      profile?.isAdmin ||
      b.creatorId === user?.uid ||
      profile?.joinedBoards?.includes(b.boardId)
    )
  );

  const content = (
    <div className="flex flex-col flex-1 overflow-y-auto subtle-scroll">
      <div className="p-6 pt-7 space-y-0.5 flex items-center justify-between">
        <div>
          <span className="text-white font-extrabold text-xl tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}>Syncronz</span>
          <p className="text-[9px] text-slate-500 font-mono tracking-wider">by Jahidul Islam Zim</p>
        </div>
        <button onClick={onClose} className="min-[1400px]:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer">
          <X className="w-5 h-5" />
        </button>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        <div className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 px-2 font-mono">Admin</div>
        {profile?.isAdmin && (
          <Link
            href="/"
            onClick={onClose}
            className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl text-sm transition cursor-pointer ${isActive('/') && pathname === '/' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-100 hover:bg-slate-800/60 hover:text-white font-medium'}`}
          >
            <Landmark className="w-4 h-4 text-blue-400" />
            <span>Dashboard</span>
          </Link>
        )}
        {profile?.isAdmin && (
          <Link
            href="/manage-users"
            onClick={onClose}
            className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl text-sm transition cursor-pointer ${isActive('/manage-users') ? 'bg-slate-800 text-white font-semibold' : 'text-slate-100 hover:bg-slate-800/60 hover:text-white font-medium'}`}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Users</span>
          </Link>
        )}
        {profile?.isAdmin && (
          <Link
            href="/settings"
            onClick={onClose}
            className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl text-sm transition cursor-pointer ${isActive('/settings') ? 'bg-slate-800 text-white font-semibold' : 'text-slate-100 hover:bg-slate-800/60 hover:text-white font-medium'}`}
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Settings</span>
          </Link>
        )}

        <div className="mt-8 text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 px-2 font-mono">Workspaces</div>

        <Link
          href="/boards/new"
          onClick={onClose}
          className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl text-sm transition cursor-pointer ${isActive('/boards/new') ? 'bg-slate-800 text-white font-semibold' : 'text-slate-100 hover:bg-slate-800/60 hover:text-white font-medium'}`}
        >
          <Plus className="w-4 h-4 text-indigo-400" />
          <span>Manage Boards</span>
        </Link>

        <Link
          href="/focus"
          onClick={onClose}
          className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl text-sm transition cursor-pointer ${isActive('/focus') ? 'bg-slate-800 text-white font-semibold' : 'text-slate-100 hover:bg-slate-800/60 hover:text-white font-medium'}`}
        >
          <Timer className="w-4 h-4 text-emerald-400" />
          <span>Focus</span>
        </Link>

        <div className="mt-3 mb-1 border-t border-slate-800/60" />

        {userBoards.length === 0 ? (
          <p className="text-xs text-slate-300 px-2 italic">No active workspaces.</p>
        ) : (
          <div className="space-y-1.5">
            {userBoards.map((b, idx) => {
              const boardActive = pathname === `/boards/${b.boardId}`;
              return (
                <Link
                  key={b.boardId || `sb-board-${idx}`}
                  href={`/boards/${b.boardId}`}
                  onClick={onClose}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-xl text-sm transition cursor-pointer truncate ${boardActive ? 'bg-slate-800 text-white font-semibold' : 'text-slate-100 hover:bg-slate-800/60 hover:text-white font-medium'}`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${boardActive ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'}`} />
                  <span className="truncate">{b.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </nav>
    </div>
  );

  const profileBlock = (
    <div className="p-4 border-t border-slate-800/80 bg-slate-950/20 space-y-3">
      <div className="flex items-center gap-3 bg-slate-800/20 p-2.5 rounded-xl border border-slate-800/30">
        <img
          src={profile?.photoURL || 'https://api.dicebear.com/7.x/initials/svg?seed=user'}
          alt=""
          className="w-8 h-8 rounded-full border border-slate-700 object-cover"
        />
        <div className="flex-1 overflow-hidden">
          <p className="text-xs font-semibold text-white truncate">{profile?.displayName || 'Active Member'}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${profile?.isAdmin ? 'bg-indigo-400 animate-pulse' : 'bg-emerald-400'}`} />
            <p className="text-[10px] text-slate-400 truncate font-mono">{profile?.isAdmin ? 'System Admin' : 'Member'}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden min-[1400px]:flex w-64 bg-[#0F172A] text-slate-200 flex-col shrink-0 border-r border-[#1E293B] justify-between h-full">
        {content}
        {profileBlock}
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm min-[1400px]:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-[#0F172A] text-slate-200 flex flex-col border-r border-[#1E293B] shadow-2xl min-[1400px]:hidden"
            >
              {content}
              {profileBlock}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};


