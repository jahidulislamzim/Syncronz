'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../src/context/AuthContext.jsx';
import { updateUserProfile, addPushSubscription, removePushSubscription } from '../../../src/lib/firebase/firestore.js';
import { auth } from '../../../src/lib/firebase/client.js';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { 
  Sparkles, 
  User, 
  Lock, 
  Mail, 
  Camera, 
  ShieldCheck, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Calendar, 
  KeyRound, 
  Globe, 
  Copy,
  Check,
  Bell,
  BellOff,
  Download,
  Smartphone
} from 'lucide-react';

export default function UserProfilePage() {
  const { user, profile, refreshProfile } = useAuth();

  // General settings state
  const [displayName, setDisplayName] = useState('');
  const [avatarType, setAvatarType] = useState('seed'); // 'seed' or 'url'
  const [avatarSeed, setAvatarSeed] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Security settings state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI status states
  const [copied, setCopied] = useState(false);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // PWA & Web Push states
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPushLoading, setIsPushLoading] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // Listen for beforeinstallprompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Check notification permission and subscription status
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
      
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.pushManager.getSubscription().then((sub) => {
            setIsSubscribed(!!sub);
          });
        });
      }
    }
  }, []);

  const toggleNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast('Notifications are not supported by this browser.', 'error');
      return;
    }

    setIsPushLoading(true);
    try {
      if (isSubscribed) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          await removePushSubscription(profile.uid, sub.endpoint);
        }
        setIsSubscribed(false);
        setNotificationPermission(Notification.permission);
        showToast('Successfully unsubscribed from notifications.', 'success');
      } else {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        
        if (permission !== 'granted') {
          showToast('Notification permission denied. Reset site permissions in settings.', 'error');
          setIsPushLoading(false);
          return;
        }

        const reg = await navigator.serviceWorker.ready;
        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicKey) {
          throw new Error('VAPID public key not configured on client.');
        }

        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        });

        await addPushSubscription(profile.uid, subscription);
        setIsSubscribed(true);
        showToast('Successfully subscribed to native notifications!', 'success');
      }
    } catch (err) {
      console.error('Subscription error:', err);
      showToast(err instanceof Error ? err.message : 'Failed to update push subscription.', 'error');
    } finally {
      setIsPushLoading(false);
    }
  };

  const triggerInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
      setDeferredPrompt(null);
      showToast('PWA App Installed successfully!', 'success');
    }
  };

  // Sync state with profile data
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      
      const photo = profile.photoURL || '';
      if (photo.includes('api.dicebear.com')) {
        setAvatarType('seed');
        // Extract seed if possible
        try {
          const urlObj = new URL(photo);
          const seedParam = urlObj.searchParams.get('seed');
          setAvatarSeed(seedParam ? decodeURIComponent(seedParam) : profile.uid);
        } catch {
          setAvatarSeed(profile.uid);
        }
      } else {
        setAvatarType('url');
        setAvatarUrl(photo);
      }
    }
  }, [profile]);

  const showToast = (text, type = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const copyUid = () => {
    if (!profile?.uid) return;
    navigator.clipboard.writeText(profile.uid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Check login provider
  const isGoogleUser = user?.providerData?.some(p => p.providerId === 'google.com');
  const isEmailUser = !isGoogleUser;
  const hasPassword = user?.providerData?.some(p => p.providerId === 'password');

  // Computed preview photo URL
  const previewPhotoURL = avatarType === 'seed'
    ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(avatarSeed || displayName || 'User')}`
    : (avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=user');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) {
      showToast('Display Name cannot be empty.', 'error');
      return;
    }

    setSavingGeneral(true);
    try {
      const finalPhotoURL = previewPhotoURL;

      // 1. Update Firebase Auth Profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: displayName.trim(),
          photoURL: finalPhotoURL
        });
      }

      // 2. Update Firestore Doc
      await updateUserProfile(profile.uid, {
        displayName: displayName.trim(),
        photoURL: finalPhotoURL
      });

      // 3. Sync local context
      await refreshProfile();
      showToast('Profile updated successfully.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update profile settings.', 'error');
    } finally {
      setSavingGeneral(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (hasPassword && !currentPassword) {
      showToast('Please enter your current password.', 'error');
      return;
    }
    if (!newPassword) {
      showToast('Please enter a new password.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setSavingSecurity(true);
    try {
      if (auth.currentUser) {
        if (hasPassword) {
          const email = auth.currentUser.email || user.email;
          if (!email) {
            throw new Error('User email not found.');
          }
          const credential = EmailAuthProvider.credential(email, currentPassword);
          await reauthenticateWithCredential(auth.currentUser, credential);
        }
        await updatePassword(auth.currentUser, newPassword);
        showToast('Password rotated successfully.', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        throw new Error('No user authenticated.');
      }
    } catch (err) {
      console.error(err);
      if (err && (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential' || (err.message && (err.message.includes('auth/wrong-password') || err.message.includes('auth/invalid-credential'))))) {
        showToast('Incorrect current password. Please try again.', 'error');
      } else if (err instanceof Error && err.message.includes('auth/requires-recent-login')) {
        showToast('Security Action: Please sign out and sign back in to rotate your password.', 'error');
      } else {
        showToast(err instanceof Error ? err.message : 'Failed to update credentials.', 'error');
      }
    } finally {
      setSavingSecurity(false);
    }
  };

  if (!profile || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Get joined date
  const joinedDate = user.metadata.creationTime 
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Unknown';

  return (
    <div className="max-w-5xl mx-auto w-full py-8 space-y-8 px-4 relative">
      {/* Toast Alert */}
      {toastMsg && (
        <div className={`fixed bottom-5 right-5 z-[200] flex items-center gap-2.5 px-4.5 py-3 rounded-2xl shadow-xl border animate-in fade-in slide-in-from-bottom-3 duration-250 ${
          toastMsg.type === 'error'
            ? 'bg-red-600 text-white border-red-500 shadow-red-200/20'
            : 'bg-slate-900 text-white border-slate-800 shadow-slate-900/10'
        }`}>
          {toastMsg.type === 'error' ? (
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          ) : (
            <CheckCircle className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
          )}
          <span className="text-xs font-bold font-sans">{toastMsg.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative bg-slate-900 text-white p-8 md:p-10 rounded-3xl overflow-hidden border border-slate-800 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/40 via-transparent to-emerald-900/20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="relative group">
            <img
              src={previewPhotoURL}
              alt=""
              className="w-20 h-20 md:w-24 md:h-24 rounded-3xl border-2 border-indigo-500/40 bg-[#0F172A] object-cover shadow-inner"
              referrerPolicy="no-referrer"
            />
            <div className="absolute -bottom-1 -right-1 p-1.5 bg-indigo-600 rounded-lg text-white border border-indigo-400">
              <Camera className="h-3.5 w-3.5" />
            </div>
          </div>
          
          <div className="text-center md:text-left space-y-1">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <h1 className="text-xl md:text-2xl font-black tracking-tight">{profile.displayName || 'Active Member'}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                profile.isAdmin ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {profile.isAdmin ? 'Admin' : 'Member'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">{user.email}</p>
            <div className="flex items-center justify-center md:justify-start gap-1.5 text-[11px] text-slate-500 pt-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>Joined Syncronz on {joinedDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* General Settings */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
              <User className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">General Profile Settings</h3>
              <p className="text-[11px] text-slate-450 mt-0.5">Modify your display identifier and customize your profile avatar representation.</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Display Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Alex Carter"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none transition"
                />
              </div>
            </div>

            {/* Avatar Selector */}
            <div className="space-y-3">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Avatar Style</label>
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-150 w-fit">
                <button
                  type="button"
                  onClick={() => setAvatarType('seed')}
                  className={`px-4 py-1.5 rounded-xl text-[10px] font-bold transition flex items-center gap-1.5 ${
                    avatarType === 'seed' 
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Initials Seed</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarType('url')}
                  className={`px-4 py-1.5 rounded-xl text-[10px] font-bold transition flex items-center gap-1.5 ${
                    avatarType === 'url' 
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Globe className="h-3 w-3" />
                  <span>Custom URL</span>
                </button>
              </div>

              {avatarType === 'seed' ? (
                <div className="space-y-2">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Enter initials or name seed"
                      value={avatarSeed}
                      onChange={(e) => setAvatarSeed(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-semibold text-slate-850 placeholder-slate-400 outline-none transition"
                    />
                  </div>
                  <p className="text-[10px] text-slate-450 italic leading-relaxed">
                    Uses Dicebear SVG avatars. Type any custom seed text (e.g. name or username) to dynamically randomize the design.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <Globe className="h-4 w-4" />
                    </span>
                    <input
                      type="url"
                      placeholder="https://example.com/avatar.jpg"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-semibold text-slate-850 placeholder-slate-400 outline-none transition"
                    />
                  </div>
                  <p className="text-[10px] text-slate-450 italic leading-relaxed">
                    Paste an image web URL link (HTTPS). Must point directly to an image asset file.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingGeneral}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                {savingGeneral ? (
                  <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Security & System Metadata */}
        <div className="space-y-6">
          
          {/* Security Credentials */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
                <KeyRound className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Security Credentials</h3>
                <p className="text-[10px] text-slate-450 mt-0.5">Manage authentication rotation</p>
              </div>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              {isGoogleUser && (
                <div className="p-3 bg-indigo-50/50 border border-indigo-150 rounded-2xl flex items-start gap-2.5">
                  <Info className="h-4.5 w-4.5 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-slate-800">Google Connected Account</p>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      Setting a password here enables password-based login for your account alongside Google popup login.
                    </p>
                  </div>
                </div>
              )}

              {hasPassword && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Current Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-semibold text-slate-800 outline-none transition"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">New Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-semibold text-slate-800 outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Confirm Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-semibold text-slate-800 outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingSecurity}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-600/10"
              >
                {savingSecurity ? (
                  <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Rotate Password</span>
                )}
              </button>
            </form>
          </div>

          {/* System Workspace Details */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Workspace Identity</h3>
                <p className="text-[10px] text-slate-450 mt-0.5">Secure system meta records</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">System Role</span>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${profile.isAdmin ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-400'}`} />
                  <span>{profile.isAdmin ? 'System Administrator' : 'Standard Member'}</span>
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">User Identity ID (UID)</span>
                <div className="flex items-center gap-1.5">
                  <code className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-600 font-mono select-all truncate max-w-[170px] md:max-w-full">
                    {profile.uid}
                  </code>
                  <button
                    type="button"
                    onClick={copyUid}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
                    title="Copy UID"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* PWA & Native Notifications Hub */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
                <Smartphone className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">PWA & Notification Hub</h3>
                <p className="text-[10px] text-slate-450 mt-0.5">Configure device alerts & shortcuts</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* App Installation */}
              {isInstallable && deferredPrompt && (
                <div className="p-3 bg-gradient-to-br from-indigo-50/50 to-emerald-50/30 border border-indigo-100 rounded-2xl space-y-2.5">
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                      <Smartphone className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Install Native App Shortcut</span>
                    </h4>
                    <p className="text-[10px] text-slate-500 leading-normal mt-1">
                      Install Syncro as a standalone PWA on your home screen or desktop for a true Android app feel.
                    </p>
                  </div>
                  <button
                    onClick={triggerInstall}
                    className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Install App on Device</span>
                  </button>
                </div>
              )}

              {/* Status Indicators */}
              <div className="space-y-2 bg-slate-50/50 p-3 rounded-2xl border border-slate-200/50 text-[10px] font-medium text-slate-600">
                <div className="flex justify-between items-center">
                  <span>App Standalone State:</span>
                  <span className="font-bold text-slate-800">
                    {typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches ? 'Installed / Standalone' : 'Running in Browser'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Push Service Status:</span>
                  <span className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${isSubscribed ? 'bg-emerald-500 animate-pulse' : 'bg-slate-350'}`} />
                    <span className={isSubscribed ? 'text-emerald-600 font-bold' : 'text-slate-500'}>
                      {isSubscribed ? 'Subscribed' : 'Inactive'}
                    </span>
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>System Permission:</span>
                  <span className={`font-semibold capitalize ${
                    notificationPermission === 'granted' ? 'text-emerald-600' :
                    notificationPermission === 'denied' ? 'text-rose-500' : 'text-amber-500'
                  }`}>
                    {notificationPermission}
                  </span>
                </div>
              </div>

              {/* Subscription Action Button */}
              <div>
                <button
                  onClick={toggleNotifications}
                  disabled={isPushLoading}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                    isSubscribed
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-850 border border-slate-200'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/10'
                  }`}
                >
                  {isPushLoading ? (
                    <span className="h-3.5 w-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  ) : isSubscribed ? (
                    <>
                      <BellOff className="h-4 w-4 shrink-0" />
                      <span>Disable System Notifications</span>
                    </>
                  ) : (
                    <>
                      <Bell className="h-4 w-4 shrink-0 animate-bounce" />
                      <span>Enable Android & Desktop Alerts</span>
                    </>
                  )}
                </button>
                
                {notificationPermission === 'denied' && (
                  <p className="text-[9px] text-rose-500 font-medium leading-relaxed mt-2 text-center">
                    Alerts are blocked. Please click the padlock icon in your browser URL bar to re-enable notifications.
                  </p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
