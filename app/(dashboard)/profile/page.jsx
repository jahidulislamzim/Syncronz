'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../src/context/AuthContext.jsx';
import { updateUserProfile } from '../../../src/lib/firebase/firestore.js';
import { auth } from '../../../src/lib/firebase/client.js';
import { updateProfile, updatePassword } from 'firebase/auth';
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
  Check
} from 'lucide-react';

export default function UserProfilePage() {
  const { user, profile, refreshProfile } = useAuth();

  // General settings state
  const [displayName, setDisplayName] = useState('');
  const [avatarType, setAvatarType] = useState('seed'); // 'seed' or 'url'
  const [avatarSeed, setAvatarSeed] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Security settings state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI status states
  const [copied, setCopied] = useState(false);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

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
        await updatePassword(auth.currentUser, newPassword);
        showToast('Password rotated successfully.', 'success');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        throw new Error('No user authenticated.');
      }
    } catch (err) {
      console.error(err);
      if (err instanceof Error && err.message.includes('auth/requires-recent-login')) {
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

        </div>
      </div>
    </div>
  );
}
