'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext.jsx';
import { db } from '../lib/firebase.js';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { Landmark, ShieldCheck, Plus, Timer } from 'lucide-react';

export const Sidebar = () => {
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
    profile?.isAdmin ||
    b.creatorId === user?.uid ||
    profile?.joinedBoards?.includes(b.boardId)
  );

  return (
    <aside className="hidden md:flex w-64 bg-[#0F172A] text-slate-200 flex-col shrink-0 border-r border-[#1E293B] justify-between h-full">
      <div className="flex flex-col flex-1 overflow-y-auto subtle-scroll">
        <div className="p-6 pt-7 space-y-0.5">
          <span className="text-white font-extrabold text-xl tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}>Syncro</span>
          <p className="text-[9px] text-slate-500 font-mono tracking-wider">by Jahidul Islam Zim</p>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          <div className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 px-2 font-mono">Navigation</div>
          {profile?.isAdmin && (
            <Link
              href="/"
              className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl text-sm transition cursor-pointer ${isActive('/') && pathname === '/' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-100 hover:bg-slate-800/60 hover:text-white font-medium'}`}
            >
              <Landmark className="w-4 h-4 text-blue-400" />
              <span>Dashboard Home</span>
            </Link>
          )}
          {profile?.isAdmin && (
            <Link
              href="/manage-users"
              className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl text-sm transition cursor-pointer ${isActive('/manage-users') ? 'bg-slate-800 text-white font-semibold' : 'text-slate-100 hover:bg-slate-800/60 hover:text-white font-medium'}`}
            >
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Manage Users</span>
            </Link>
          )}

          <div className="mt-8 text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 px-2 font-mono">Boards</div>

          <Link
            href="/boards/new"
            className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl text-sm transition cursor-pointer ${isActive('/boards/new') ? 'bg-slate-800 text-white font-semibold' : 'text-slate-100 hover:bg-slate-800/60 hover:text-white font-medium'}`}
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>Board Management</span>
          </Link>

          <Link
            href="/focus"
            className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl text-sm transition cursor-pointer ${isActive('/focus') ? 'bg-slate-800 text-white font-semibold' : 'text-slate-100 hover:bg-slate-800/60 hover:text-white font-medium'}`}
          >
            <Timer className="w-4 h-4 text-emerald-400" />
            <span>Focus Timer</span>
          </Link>

          <div className="mt-3 mb-1 border-t border-slate-800/60" />

          {userBoards.length === 0 ? (
            <p className="text-xs text-slate-300 px-2 italic">No active environments.</p>
          ) : (
            <div className="space-y-1.5">
              {userBoards.map((b) => {
                const boardActive = pathname === `/boards/${b.boardId}`;
                return (
                  <Link
                    key={b.boardId}
                    href={`/boards/${b.boardId}`}
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
    </aside>
  );
};
