import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Sparkles, Landmark, ShieldCheck } from 'lucide-react';

export const LoginPage = () => {
  const { user, isAllowed, signIn, loading } = useAuth();

  if (loading) return null;
  if (user && isAllowed) return <Navigate to="/" replace />;
  if (user && !isAllowed) return <Navigate to="/access-denied" replace />;
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row items-stretch justify-stretch overflow-hidden">
      <div className="flex-1 bg-slate-900 text-white p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-15%] left-[-15%] w-[60%] h-[60%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="flex items-center space-x-3 z-10">
          <div className="h-10 w-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
            <Sparkles className="h-5 w-5 text-indigo-400" />
          </div>
          <span className="font-bold text-sm tracking-widest font-mono text-indigo-300 uppercase">Syncro</span>
        </div>
        <div className="my-auto max-w-md z-10 py-12 md:py-0">
          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
            Real-time Task Collaboration.
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400"> Fully Multiuser.</span>
          </h2>
          <p className="text-slate-400 text-xs leading-relaxed mt-4">
            Durable, zero-delay task Boards synchronized atomically across all team browsers. Features real-time notifications, activity log, and zero faked simulation logic.
          </p>
        </div>
        <div className="z-10 flex items-center space-x-2 text-[10px] text-slate-500 font-mono">
          <Landmark className="h-3.5 w-3.5" />
          <span>Syncro &bull; Invite-only Workspace</span>
        </div>
      </div>
      <div className="flex-1 bg-white p-8 lg:p-16 flex flex-col justify-center max-w-xl mx-auto w-full">
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Access Your Workspace</h1>
            <p className="text-slate-500 text-xs leading-relaxed mt-1">
              This workspace is invite-only. Sign in with your Google account to access your boards.
            </p>
          </div>
          <button
            onClick={signIn}
            className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-3.5 shadow-md shadow-slate-900/10 cursor-pointer"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            <span>Sign in with Google</span>
          </button>
          <div className="relative py-2 flex items-center">
            <div className="flex-1 border-t border-slate-100" />
            <span className="text-[10px] mx-4 font-mono font-semibold text-slate-400 uppercase">Invite-only</span>
            <div className="flex-1 border-t border-slate-100" />
          </div>
          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-start space-x-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-800 leading-tight">Email-based Access Control</p>
              <p className="text-[10px] text-slate-400 leading-normal mt-0.5">Only invited email addresses can access this workspace. Contact your admin for access.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
