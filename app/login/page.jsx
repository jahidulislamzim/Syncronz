'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../src/context/AuthContext.jsx';
import { Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { user, isAllowed, signIn, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user && isAllowed) router.replace('/');
      else if (user && !isAllowed) router.replace('/access-denied');
    }
  }, [user, isAllowed, loading, router]);

  if (loading) return null;
  if (user) return null;

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left — Brand Panel */}
      <div className="hidden lg:flex flex-col justify-between w-[42%] bg-[#0B1120] p-14 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-transparent to-emerald-600/5 pointer-events-none" />
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-indigo-500/8 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/6 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-white/[0.07] backdrop-blur-lg rounded-xl flex items-center justify-center border border-white/[0.06]">
              <Sparkles className="h-[18px] w-[18px] text-indigo-400" />
            </div>
            <span className="text-sm font-bold tracking-[0.15em] text-indigo-300/80 uppercase">Syncronz</span>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-[2rem] leading-[1.15] font-extrabold tracking-tight text-white">
            Task collaboration
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-300 to-emerald-400">that actually stays in sync.</span>
          </h2>
          <p className="text-sm text-slate-400/80 leading-relaxed mt-5 max-w-sm">
            Real-time boards, atomic updates, live notifications. No stale state, no polling, no fake loading spinners.
          </p>
          <div className="mt-8 space-y-3">
            {['Real-time multi-user sync', 'Atomic board state with zero conflicts', 'Activity logs & instant notifications'].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-slate-300">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/60 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-600 font-mono tracking-tight">
          &copy; {new Date().getFullYear()} Syncronz. Invite-only workspace.
        </div>
      </div>

      {/* Right — Auth Panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm mx-auto">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="h-9 w-9 bg-slate-900 rounded-xl flex items-center justify-center">
              <Sparkles className="h-[18px] w-[18px] text-indigo-400" />
            </div>
            <span className="text-sm font-bold tracking-[0.15em] text-slate-800 uppercase">Syncronz</span>
          </div>

          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Sign in
              </h1>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Use your Google account to access your boards and tasks.
              </p>
            </div>

            <button
              onClick={signIn}
              className="group relative w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-slate-900/10 hover:shadow-xl hover:shadow-slate-900/15 cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>Continue with Google</span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors -ml-1" />
            </button>

            <div className="relative flex items-center">
              <div className="flex-1 border-t border-slate-100" />
              <span className="text-[11px] mx-4 font-semibold text-slate-400 uppercase tracking-wider">Invite only</span>
              <div className="flex-1 border-t border-slate-100" />
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">Access control</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Only invited email addresses can sign in. Contact your admin if you need access.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
