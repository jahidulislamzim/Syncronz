import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { db } from '../lib/firebase.js';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { getAllUsers, getInvitedUsers } from '../lib/services.js';
import { Sparkles, LayoutDashboard, Users, ShieldCheck, ArrowRight, Crown, CheckCircle, Clock, RefreshCw, Plus } from 'lucide-react';
import { DashboardSkeleton } from '../components/PageLoader.jsx';

export const DashboardHome = () => {
  const { user, profile, adminEmail } = useAuth();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');
  const [pageLoading, setPageLoading] = useState(!!profile?.isAdmin);

  const [allBoards, setAllBoards] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [invitedUsers, setInvitedUsers] = useState([]);
  const [boardTaskCounts, setBoardTaskCounts] = useState({});

  useEffect(() => {
    if (!profile?.isAdmin) { setPageLoading(false); return; }
    const q = query(collection(db, 'boards'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data());
      });
      setAllBoards(list);
    });
    return () => unsubscribe();
  }, [profile?.isAdmin]);

  useEffect(() => {
    if (!profile?.isAdmin) return;
    Promise.all([
      getAllUsers().then(u => { if (u) setAllUsers(u); }),
      getInvitedUsers().then(setInvitedUsers)
    ]).then(() => setPageLoading(false));
  }, [profile?.isAdmin]);

  useEffect(() => {
    if (!profile?.isAdmin) return;
    const unsubs = [];
    allBoards.forEach(board => {
      const unsub = onSnapshot(query(collection(db, 'boards', board.boardId, 'tasks')), (snap) => {
        setBoardTaskCounts(prev => ({ ...prev, [board.boardId]: snap.size }));
      });
      unsubs.push(unsub);
    });
    return () => unsubs.forEach(u => u());
  }, [allBoards, profile?.isAdmin]);

  const isSuperAdmin = (u) =>
    !!(adminEmail && u.email?.toLowerCase() === adminEmail.toLowerCase());

  const stats = {
    totalBoards: allBoards.length,
    totalUsers: allUsers.length,
    acceptedUsers: allUsers.length,
    pendingInvites: invitedUsers.filter(i => i.status === 'pending').length,
    admins: allUsers.filter(u => u.isAdmin || isSuperAdmin(u)).length,
    totalTasks: Object.values(boardTaskCounts).reduce((a, b) => a + b, 0),
  };

  return (
    <div className="max-w-5xl mx-auto w-full py-8 space-y-8">
      {/* Welcome Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 md:p-10">
        <div className="absolute top-[-30%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-30%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 flex items-start justify-between gap-5">
          <div className="flex items-start gap-5">
            <div className="h-12 w-12 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-black/10">
              <Sparkles className="h-5.5 w-5.5 text-indigo-300" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white leading-tight">
                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-emerald-300">{profile?.displayName || user?.displayName || 'Developer'}</span>
              </h1>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
                {profile?.isAdmin
                  ? 'Overview of your entire workspace — boards, members, and activity at a glance.'
                  : 'Create a new board to start collaborating, or join an existing workspace using its unique identifier.'
                }
              </p>
            </div>
          </div>
          <button
            onClick={() => {
    getAllUsers().then(u => { if (u) setAllUsers(u); });
              getInvitedUsers().then(setInvitedUsers);
            }}
            className="shrink-0 p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
            title="Refresh data"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Admin Dashboard Stats */}
      {profile?.isAdmin && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-xl"><LayoutDashboard className="w-4.5 h-4.5 text-indigo-600" /></div>
                <div>
                  <p className="text-xl font-bold text-slate-900">{stats.totalBoards}</p>
                  <p className="text-[11px] text-slate-500 font-medium">Boards</p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-xl"><Users className="w-4.5 h-4.5 text-blue-600" /></div>
                <div>
                  <p className="text-xl font-bold text-slate-900">{stats.totalUsers}</p>
                  <p className="text-[11px] text-slate-500 font-medium">Users</p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-xl"><CheckCircle className="w-4.5 h-4.5 text-emerald-600" /></div>
                <div>
                  <p className="text-xl font-bold text-slate-900">{stats.acceptedUsers}</p>
                  <p className="text-[11px] text-slate-500 font-medium">Accepted</p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 rounded-xl"><Clock className="w-4.5 h-4.5 text-amber-600" /></div>
                <div>
                  <p className="text-xl font-bold text-slate-900">{stats.pendingInvites}</p>
                  <p className="text-[11px] text-slate-500 font-medium">Pending</p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-xl"><ShieldCheck className="w-4.5 h-4.5 text-purple-600" /></div>
                <div>
                  <p className="text-xl font-bold text-slate-900">{stats.admins}</p>
                  <p className="text-[11px] text-slate-500 font-medium">Admins</p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-50 rounded-xl"><LayoutDashboard className="w-4.5 h-4.5 text-rose-600" /></div>
                <div>
                  <p className="text-xl font-bold text-slate-900">{stats.totalTasks}</p>
                  <p className="text-[11px] text-slate-500 font-medium">Tasks</p>
                </div>
              </div>
            </div>
          </div>

          {/* Boards & Users panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-indigo-500 to-blue-500" />
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">All Boards</h2>
                  <p className="text-xs text-slate-400">{stats.totalBoards} total</p>
                </div>
              </div>
              <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto subtle-scroll">
                {allBoards.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-400">No boards created yet.</div>
                ) : (
                  allBoards.map(board => (
                    <div
                      key={board.boardId}
                      onClick={() => navigate(`/boards/${board.boardId}`)}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/50 transition cursor-pointer"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                          <span className="text-sm font-semibold text-slate-900 truncate">{board.name}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{board.description || 'No description'}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <span className="text-xs font-mono font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                          {boardTaskCounts[board.boardId] || 0} tasks
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-300" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Members</h2>
                  <p className="text-xs text-slate-400">{stats.totalUsers} registered</p>
                </div>
              </div>
              <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto subtle-scroll">
                {allUsers.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-400">No users registered yet.</div>
                ) : (
                  allUsers.map(u => {
                    const isAdminUser = u.isAdmin || isSuperAdmin(u);
  if (pageLoading) return <DashboardSkeleton />;

  return (
                      <div key={u.uid} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/50 transition">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <img
                            src={u.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.displayName)}`}
                            alt={u.displayName}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-900 truncate">{u.displayName}</span>
                              {isAdminUser && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                            </div>
                            <p className="text-xs text-slate-400 font-mono truncate">{u.email}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-slate-500 to-slate-600" />
            <div className="p-5">
              <h2 className="text-sm font-bold text-slate-900">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() => navigate('/manage-users')}
                  className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition text-left cursor-pointer"
                >
                  <Users className="w-5 h-5 text-indigo-500 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">Manage Users</p>
                    <p className="text-xs text-slate-400">Invite & manage access</p>
                  </div>
                </button>
                <button
                  onClick={() => navigate('/boards/new')}
                  className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition text-left cursor-pointer"
                >
                  <Plus className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">Board Management</p>
                    <p className="text-xs text-slate-400">Create or join a workspace</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded-xl leading-relaxed flex items-center gap-3">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
          {errorMsg}
        </div>
      )}
    </div>
  );
};
