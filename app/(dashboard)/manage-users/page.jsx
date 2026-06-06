'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { db } from '../../../src/lib/firebase.js';
import { getAllUsers, updateUserProfile, inviteUser, revokeInvite, getInvitedUsers, deleteUserProfile } from '../../../src/lib/services.js';
import { useAuth } from '../../../src/context/AuthContext.jsx';
import {
  Mail, ShieldCheck, Plus, Check, X, Search,
  Users, UserPlus, Clock, CheckCircle, XCircle, Ban,
  AlertTriangle, Sparkles, Copy, Crown, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ManageUsersSkeleton } from '../../../src/components/PageLoader.jsx';

function formatDate(iso) {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  } catch {
    return '-';
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

const Toast = ({ message, type, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: -20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -20, scale: 0.95 }}
    className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl border text-sm font-semibold ${
      type === 'success'
        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
        : 'bg-red-50 border-red-200 text-red-800'
    }`}
  >
    {type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
    <span>{message}</span>
    <button onClick={onClose} className="ml-3 opacity-60 hover:opacity-100 cursor-pointer"><X className="w-4 h-4" /></button>
  </motion.div>
);

export default function ManageUsers() {
  const { user, profile, adminEmail } = useAuth();
  const navigate = useRouter();

  useEffect(() => {
    if (!profile?.isAdmin) {
      navigate.replace('/');
    }
  }, [profile, navigate]);
  const [users, setUsers] = useState([]);
  const [invitedUsers, setInvitedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('invite');
  const [searchQuery, setSearchQuery] = useState('');

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviting, setInviting] = useState(false);

  const [toast, setToast] = useState(null);
  const [confirmRevoke, setConfirmRevoke] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const showToast = useCallback((message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [allUsers, invited] = await Promise.all([
        getAllUsers(),
        getInvitedUsers()
      ]);
      if (allUsers) setUsers(allUsers);
      setInvitedUsers(invited);
    } catch (err) {
      console.error(err);
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleInvite = async () => {
    const email = inviteEmail.trim();
    if (!email || !isValidEmail(email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    if (invitedUsers.some(i => i.email.toLowerCase() === email.toLowerCase())) {
      showToast('This email is already invited', 'error');
      return;
    }
    setInviting(true);
    try {
      await inviteUser(email, user?.uid || '', inviteName.trim() || undefined);
      setInvitedUsers(await getInvitedUsers());
      setInviteEmail('');
      setInviteName('');
      showToast(`Invitation sent to ${email}`, 'success');
    } catch {
      showToast('Failed to send invitation', 'error');
    } finally {
      setInviting(false);
    }
  };

  const handleRevoke = async (email) => {
    try {
      await revokeInvite(email);
      setInvitedUsers(await getInvitedUsers());
      showToast(`Revoked invitation for ${email}`, 'success');
    } catch {
      showToast('Failed to revoke invitation', 'error');
    }
    setConfirmRevoke(null);
  };

  const handleDeleteUser = async (uid, displayName) => {
    try {
      await deleteUserProfile(uid);
      setUsers(prev => prev.filter(u => u.uid !== uid));
      showToast(`Deleted user ${displayName}`, 'success');
    } catch {
      showToast('Failed to delete user', 'error');
    }
    setConfirmDelete(null);
  };

  const isSuperAdmin = (u) =>
    !!(adminEmail && u.email?.toLowerCase() === adminEmail.toLowerCase());

  const filteredInvited = invitedUsers.filter(inv =>
    !searchQuery || inv.email.toLowerCase().includes(searchQuery.toLowerCase()) || inv.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    !searchQuery || u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount = invitedUsers.filter(i => i.status === 'pending').length;
  const totalInvited = invitedUsers.length;
  const adminUsers = users.filter(u => u.isAdmin || isSuperAdmin(u));
  const memberUsers = users.filter(u => !u.isAdmin && !isSuperAdmin(u));

  if (loading) {
    return <ManageUsersSkeleton />;
  }

  return (
      <div className="max-w-5xl mx-auto w-full py-8 space-y-8">
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 md:p-10">
        <div className="absolute top-[-30%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-30%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 flex items-start gap-5">
          <div className="h-12 w-12 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-black/10">
            <ShieldCheck className="h-5.5 w-5.5 text-indigo-300" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white leading-tight">
              Access Management
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
              Invite users, manage workspace access, and control administrative privileges.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 rounded-xl"><Users className="w-5 h-5 text-indigo-600" /></div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{totalInvited}</p>
              <p className="text-xs text-slate-500 font-medium">Total Invited</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 rounded-xl"><ShieldCheck className="w-5 h-5 text-amber-600" /></div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{adminUsers.length}</p>
              <p className="text-xs text-slate-500 font-medium">Admins</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl"><CheckCircle className="w-5 h-5 text-emerald-600" /></div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{users.length}</p>
              <p className="text-xs text-slate-500 font-medium">Accepted</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-indigo-500 to-emerald-500" />
        <div className="flex items-center gap-1 p-1.5">
        <button
          onClick={() => { setActiveTab('invite'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
            activeTab === 'invite'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          Invite
          {pendingCount > 0 && (
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'invite' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
            }`}>
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => { setActiveTab('members'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
            activeTab === 'members'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          Members
          {memberUsers.length > 0 && (
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'members' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {memberUsers.length}
            </span>
          )}
        </button>
        <button
          onClick={() => { setActiveTab('admin'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
            activeTab === 'admin'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Admin
          {adminUsers.length > 0 && (
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'admin' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800'
            }`}>
              {adminUsers.length}
            </span>
          )}
        </button>
        <div className="flex-1" />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab === 'invite' ? 'invitations' : activeTab === 'admin' ? 'admins' : 'members'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-56 transition"
          />
        </div>
        </div>
      </div>

      {activeTab === 'invite' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Send Invitation</h2>
              <p className="text-sm text-slate-500 mt-0.5">Only invited email addresses can sign in with Google</p>
            </div>
            <div className="p-6">
              <div className="flex gap-3">
                <div className="flex-1 space-y-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                    placeholder="email@example.com"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition"
                  />
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                    placeholder="Display name (optional)"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>
                <button
                  onClick={handleInvite}
                  disabled={inviting || !inviteEmail.trim() || !isValidEmail(inviteEmail.trim())}
                  className="self-start px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer shadow-sm shadow-emerald-600/10"
                >
                  {inviting ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : <Plus className="w-4 h-4" />}
                  {inviting ? 'Inviting...' : 'Send Invite'}
                </button>
              </div>

              {invitedUsers.length === 0 && (
                <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                  <p className="text-xs text-slate-600">Tip: Add yourself (<span className="font-mono font-semibold text-slate-800">{adminEmail || 'your email'}</span>) to test the sign-in flow.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Invitations</h2>
                <p className="text-sm text-slate-500">{totalInvited} invitation{totalInvited !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {filteredInvited.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200">
                  <Mail className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-900">{searchQuery ? 'No matches found' : 'No invitations yet'}</p>
                <p className="text-sm text-slate-500 mt-1">{searchQuery ? 'Try a different search term' : 'Invite users above to get started'}</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredInvited.map((inv) => (
                  <div key={inv.email} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                        inv.status === 'accepted' ? 'bg-emerald-50 text-emerald-700' :
                        inv.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {inv.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 truncate">{inv.displayName || 'No name'}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            inv.status === 'accepted' ? 'bg-emerald-50 text-emerald-700' :
                            inv.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                            'bg-red-50 text-red-700'
                          }`}>
                            {inv.status === 'accepted' ? 'Active' : inv.status === 'pending' ? 'Pending' : 'Revoked'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 font-mono truncate mt-0.5">{inv.email}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Invited {formatDate(inv.invitedAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(inv.email);
                          showToast('Email copied to clipboard', 'success');
                        }}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                        title="Copy email"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      {confirmRevoke === inv.email ? (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-red-600 font-semibold mr-1">Confirm?</span>
                          <button
                            onClick={() => handleRevoke(inv.email)}
                            className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmRevoke(null)}
                            className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmRevoke(inv.email)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Revoke invitation"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Members</h2>
              <p className="text-sm text-slate-500">{memberUsers.length} member{memberUsers.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {memberUsers.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200">
                <Users className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-900">{searchQuery ? 'No matches found' : 'No members yet'}</p>
              <p className="text-sm text-slate-500 mt-1">{searchQuery ? 'Try a different search term' : 'Members appear here after they accept their invitation'}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {(searchQuery ? filteredUsers.filter(u => !u.isAdmin && !isSuperAdmin(u)) : memberUsers).map((u) => (
                <div key={u.uid} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <img
                      src={u.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.displayName || u.uid)}`}
                      alt={u.displayName}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 truncate">{u.displayName}</span>
                        {u.uid === user?.uid && <span className="text-[10px] text-slate-400 font-mono">(you)</span>}
                      </div>
                      <p className="text-sm text-slate-500 font-mono truncate mt-0.5">{u.email || 'No email'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {u.uid !== user?.uid && (
                      <button
                        onClick={async () => {
                          await updateUserProfile(u.uid, { isAdmin: true });
                          setUsers(prev => prev.map(p => p.uid === u.uid ? { ...p, isAdmin: true } : p));
                          showToast(`${u.displayName} is now an admin`, 'success');
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Make Admin
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        await updateUserProfile(u.uid, { isAuthorized: !u.isAuthorized });
                        setUsers(prev => prev.map(p => p.uid === u.uid ? { ...p, isAuthorized: !u.isAuthorized } : p));
                        showToast(`${u.displayName} ${u.isAuthorized ? 'deauthorized' : 'authorized'}`, 'success');
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        u.isAuthorized
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {u.isAuthorized ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {u.isAuthorized ? 'Authorized' : 'Authorize'}
                    </button>
                    {u.uid !== user?.uid && (
                      confirmDelete === u.uid ? (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-red-600 font-semibold mr-1">Delete?</span>
                          <button
                            onClick={() => handleDeleteUser(u.uid, u.displayName)}
                            className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(u.uid)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Delete user"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'admin' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Administrators</h2>
              <p className="text-sm text-slate-500">{adminUsers.length} admin{adminUsers.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {adminUsers.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200">
                <ShieldCheck className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-900">{searchQuery ? 'No matches found' : 'No admins yet'}</p>
              <p className="text-sm text-slate-500 mt-1">{searchQuery ? 'Try a different search term' : 'Promote members to admin from the Members tab'}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {(searchQuery ? filteredUsers.filter(u => u.isAdmin || isSuperAdmin(u)) : adminUsers).map((u) => {
                const superAdmin = isSuperAdmin(u);
                return (
                  <div key={u.uid} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <img
                        src={u.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.displayName || u.uid)}`}
                        alt={u.displayName}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-900 truncate">{u.displayName}</span>
                          {u.uid === user?.uid && <span className="text-[10px] text-slate-400 font-mono">(you)</span>}
                          {superAdmin ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold">
                              <Crown className="w-3 h-3" /> Super Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold">
                              <ShieldCheck className="w-3 h-3" /> Admin
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 font-mono truncate mt-0.5">{u.email || 'No email'}</p>
                        {!superAdmin && u.isAdmin && (
                          <p className="text-xs text-slate-400 mt-0.5">Promoted by workspace admin</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {u.uid !== user?.uid && !superAdmin && (
                        <button
                          onClick={async () => {
                            await updateUserProfile(u.uid, { isAdmin: false });
                            setUsers(prev => prev.map(p => p.uid === u.uid ? { ...p, isAdmin: false } : p));
                            showToast(`${u.displayName} is now a member`, 'success');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 transition cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Remove Admin
                        </button>
                      )}
                      {u.uid !== user?.uid && !superAdmin && (
                        confirmDelete === u.uid ? (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-red-600 font-semibold mr-1">Delete?</span>
                            <button
                              onClick={() => handleDeleteUser(u.uid, u.displayName)}
                              className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(u.uid)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Delete user"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
