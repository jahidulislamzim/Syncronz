'use client';

import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';
import { useManageUsers } from './hooks/useManageUsers.js';
import { ManageUsersHeader } from './subcomponents/ManageUsersHeader.jsx';
import { ManageUsersStats } from './subcomponents/ManageUsersStats.jsx';
import { ManageUsersTabs } from './subcomponents/ManageUsersTabs.jsx';
import { InviteTabPane } from './subcomponents/InviteTabPane.jsx';
import { MembersTabPane } from './subcomponents/MembersTabPane.jsx';
import { AdminTabPane } from './subcomponents/AdminTabPane.jsx';
import { ManageUsersSkeleton } from '../PageLoader.jsx';

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

export const ManageUsers = () => {
  const {
    user,
    profile,
    adminEmail,
    users,
    invitedUsers,
    loading,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    inviteEmail,
    setInviteEmail,
    inviteName,
    setInviteName,
    inviting,
    toast,
    setToast,
    confirmRevoke,
    setConfirmRevoke,
    confirmDelete,
    setConfirmDelete,
    showToast,
    handleInvite,
    handleRevoke,
    handleDeleteUser,
    handleMakeAdmin,
    handleRemoveAdmin,
    handleToggleAuthorize,
    isSuperAdmin,
    filteredInvited,
    filteredUsers,
    pendingCount,
    totalInvited,
    adminUsers,
    memberUsers
  } = useManageUsers();

  if (loading) {
    return <ManageUsersSkeleton />;
  }

  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-6 md:py-8 space-y-6 md:space-y-8">
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      <ManageUsersHeader />

      <ManageUsersStats
        totalInvited={totalInvited}
        adminCount={adminUsers.length}
        acceptedCount={users.length}
      />

      <ManageUsersTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        pendingCount={pendingCount}
        memberCount={memberUsers.length}
        adminCount={adminUsers.length}
      />

      {activeTab === 'invite' && (
        <InviteTabPane
          inviteEmail={inviteEmail}
          setInviteEmail={setInviteEmail}
          inviteName={inviteName}
          setInviteName={setInviteName}
          inviting={inviting}
          handleInvite={handleInvite}
          adminEmail={adminEmail}
          invitedUsers={invitedUsers}
          filteredInvited={filteredInvited}
          searchQuery={searchQuery}
          totalInvited={totalInvited}
          showToast={showToast}
          confirmRevoke={confirmRevoke}
          setConfirmRevoke={setConfirmRevoke}
          handleRevoke={handleRevoke}
        />
      )}

      {activeTab === 'members' && (
        <MembersTabPane
          memberUsers={memberUsers}
          searchQuery={searchQuery}
          filteredUsers={filteredUsers}
          user={user}
          handleMakeAdmin={handleMakeAdmin}
          handleToggleAuthorize={handleToggleAuthorize}
          confirmDelete={confirmDelete}
          setConfirmDelete={setConfirmDelete}
          handleDeleteUser={handleDeleteUser}
        />
      )}

      {activeTab === 'admin' && (
        <AdminTabPane
          adminUsers={adminUsers}
          searchQuery={searchQuery}
          filteredUsers={filteredUsers}
          isSuperAdmin={isSuperAdmin}
          user={user}
          handleRemoveAdmin={handleRemoveAdmin}
          confirmDelete={confirmDelete}
          setConfirmDelete={setConfirmDelete}
          handleDeleteUser={handleDeleteUser}
        />
      )}
    </div>
  );
};
