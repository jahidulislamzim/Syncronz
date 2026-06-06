import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { joinBoard } from '../lib/services.js';
import { LogIn, Sparkles } from 'lucide-react';

export const JoinBoard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [joinId, setJoinId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !joinId.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const memberDetails = {
        uid: user.uid,
        displayName: profile?.displayName || user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        photoURL: profile?.photoURL || user.photoURL || 'https://api.dicebear.com/7.x/initials/svg?seed=user'
      };
      await joinBoard(joinId.trim(), memberDetails);
      navigate(`/boards/${joinId.trim()}`);
    } catch {
      setError('Board not found or permissions mismatch. Ensure the Board ID is accurate.');
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto w-full py-8 space-y-8">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 md:p-10">
        <div className="absolute top-[-30%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-30%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 flex items-start gap-5">
          <div className="h-12 w-12 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-black/10">
            <LogIn className="h-5.5 w-5.5 text-emerald-300" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white leading-tight">Join Board</h1>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
              Connect to an existing workspace by entering its unique Board ID.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600" />
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-900">Board ID</label>
            <input
              type="text"
              required
              placeholder="e.g. board_xxxxxxxxxxxxxx"
              value={joinId}
              onChange={e => setJoinId(e.target.value)}
              className="w-full text-sm font-mono px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all uppercase tracking-wider"
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !joinId.trim()}
            className="w-full py-2.5 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-slate-950 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition cursor-pointer shadow-lg shadow-slate-900/15"
          >
            {submitting ? 'Joining...' : 'Join Board'}
          </button>
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-sm rounded-xl leading-relaxed flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
