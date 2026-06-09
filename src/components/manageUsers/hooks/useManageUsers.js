import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext.jsx';
import { auth } from '../../../lib/firebase/client.js';
import { getAllUsers, updateUserProfile, inviteUser, revokeInvite, getInvitedUsers, deleteUserProfile } from '../../../lib/firebase/firestore.js';
import { isValidEmail } from '../utils/helpers.js';

export const useManageUsers = () => {
  const { user, profile, adminEmail } = useAuth();
  const navigate = useRouter();

  useEffect(() => {
    if (profile && !profile.isAdmin) {
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

      try {
        const token = await auth.currentUser?.getIdToken();
        if (token) {
          await fetch('/api/send-invite', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              email,
              displayName: inviteName.trim() || undefined,
              adminName: profile?.displayName || undefined,
            }),
          });
        }
      } catch (emailErr) {
        console.error('Failed to send invite email:', emailErr);
      }
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

  const handleMakeAdmin = async (uid, displayName) => {
    try {
      await updateUserProfile(uid, { isAdmin: true });
      setUsers(prev => prev.map(p => p.uid === uid ? { ...p, isAdmin: true } : p));
      showToast(`${displayName} is now an admin`, 'success');
    } catch {
      showToast('Failed to update user role', 'error');
    }
  };

  const handleRemoveAdmin = async (uid, displayName) => {
    try {
      await updateUserProfile(uid, { isAdmin: false });
      setUsers(prev => prev.map(p => p.uid === uid ? { ...p, isAdmin: false } : p));
      showToast(`${displayName} is now a member`, 'success');
    } catch {
      showToast('Failed to update user role', 'error');
    }
  };

  const handleToggleAuthorize = async (uid, displayName, currentAuth) => {
    try {
      await updateUserProfile(uid, { isAuthorized: !currentAuth });
      setUsers(prev => prev.map(p => p.uid === uid ? { ...p, isAuthorized: !currentAuth } : p));
      showToast(`${displayName} ${!currentAuth ? 'authorized' : 'deauthorized'}`, 'success');
    } catch {
      showToast('Failed to update authorization', 'error');
    }
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

  return {
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
  };
};
