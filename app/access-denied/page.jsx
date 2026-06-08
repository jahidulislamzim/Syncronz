'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../src/context/AuthContext.jsx';
import { ShieldCheck } from 'lucide-react';

export default function AccessDeniedPage() {
  const { user, isAllowed, adminEmail, signOut, loading } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      router.replace('/login');
    } catch (e) {
      console.error(e);
      setSigningOut(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace('/login');
      else if (isAllowed) router.replace('/');
    }
  }, [user, isAllowed, loading, router]);
  if (loading || !user || isAllowed) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="h-16 w-16 bg-gradient-to-br from-indigo-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20">
              <span className="text-white font-extrabold text-xl tracking-tight">S</span>
            </div>
            <div className="absolute -inset-2 bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 rounded-3xl blur-xl animate-pulse" />
          </div>
          <div className="text-center space-y-1.5">
            <h1 className="text-lg font-extrabold text-white tracking-tight">Syncronz</h1>
            <p className="text-sm text-slate-400 font-medium">Loading...</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <ShieldCheck className="h-16 w-16 text-slate-300 mx-auto" />
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
          <p className="text-slate-500">
            This workspace is invite-only. Your account (<span className="font-mono text-slate-700">{user?.email}</span>) is not authorized.
          </p>
          {adminEmail && (
            <p className="text-slate-500 text-sm">
              Contact your admin at <span className="font-mono text-indigo-600">{adminEmail}</span> to request access.
            </p>
          )}
        </div>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-xl transition cursor-pointer shadow-lg shadow-slate-900/15 flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
        >
          {signingOut ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Signing Out...</span>
            </>
          ) : (
            'Sign Out'
          )}
        </button>
      </div>
    </div>
  );
}
