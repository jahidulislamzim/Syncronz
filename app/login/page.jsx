'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../src/context/AuthContext.jsx';
import { Sparkles, ShieldCheck, ArrowRight, Mail, Lock, User, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { user, isAllowed, signIn, signInWithEmail, signUpWithEmail, loading } = useAuth();
  const router = useRouter();

  const [authMode, setAuthMode] = useState('signin'); // 'signin' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (user && isAllowed) router.replace('/');
      else if (user && !isAllowed) router.replace('/access-denied');
    }
  }, [user, isAllowed, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (authMode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        if (!fullName.trim()) {
          throw new Error('Please enter your full name.');
        }
        await signUpWithEmail(email, password, fullName.trim());
      }
    } catch (err) {
      console.error('Auth error:', err);
      let errMsg = 'Authentication failed. Please check your credentials.';
      if (err instanceof Error) {
        if (err.message.includes('auth/invalid-credential') || err.message.includes('auth/user-not-found') || err.message.includes('auth/wrong-password')) {
          errMsg = 'Invalid email or password. Please try again.';
        } else if (err.message.includes('auth/email-already-in-use')) {
          errMsg = 'An account with this email address already exists.';
        } else if (err.message.includes('auth/weak-password')) {
          errMsg = 'Password must be at least 6 characters long.';
        } else if (err.message.includes('auth/invalid-email')) {
          errMsg = 'Please enter a valid email address.';
        } else {
          errMsg = err.message;
        }
      }
      setError(errMsg);
      setSubmitting(false);
    }
  };

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

          {/* Invite Only Notice */}
          <div className="mt-10 p-5 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-white">Invite-Only Access</p>
                <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                  Only authorized email addresses can access workspace boards. If you register a new email address, you must be invited by an administrator first.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-600 font-mono tracking-tight">
          &copy; {new Date().getFullYear()} Syncronz. Invite-only workspace.
        </div>
      </div>

      {/* Right — Auth Panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-50/35">
        <div className="w-full max-w-md bg-white border border-slate-200/80 p-8 rounded-3xl shadow-xl shadow-slate-100/40">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="h-9 w-9 bg-slate-900 rounded-xl flex items-center justify-center">
              <Sparkles className="h-[18px] w-[18px] text-indigo-400" />
            </div>
            <span className="text-sm font-bold tracking-[0.15em] text-slate-800 uppercase">Syncronz</span>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-black text-slate-900">
                {authMode === 'signin' ? 'Welcome Back' : 'Create Account'}
              </h1>
              <p className="text-xs text-slate-500 mt-1.5">
                {authMode === 'signin' 
                  ? 'Access your workspace to continue collaborating with your team.' 
                  : 'Register your email address to access workspace boards.'
                }
              </p>
            </div>

            {/* Auth Mode Toggle Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-150">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setError('');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                  authMode === 'signin' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setError('');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                  authMode === 'signup' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Register
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-655 font-medium animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Credential Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {authMode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Full Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <User className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Alex Carter"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10 cursor-pointer"
              >
                {submitting ? (
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{authMode === 'signin' ? 'Sign In' : 'Register Account'}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>

            <div className="relative flex items-center py-2">
              <div className="flex-1 border-t border-slate-200" />
              <span className="text-[9px] mx-3 font-extrabold text-slate-400 uppercase tracking-widest">Or continue with</span>
              <div className="flex-1 border-t border-slate-200" />
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={signIn}
              className="group relative w-full py-2.5 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-3 shadow-sm cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 shrink-0" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>Sign in with Google</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
