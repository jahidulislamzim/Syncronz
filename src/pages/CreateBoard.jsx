import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { createBoard } from '../lib/services.js';
import { Plus, Sparkles } from 'lucide-react';

export const CreateBoard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setSubmitting(true);
    try {
      const creatorProfile = {
        displayName: profile?.displayName || user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        photoURL: profile?.photoURL || user.photoURL || 'https://api.dicebear.com/7.x/initials/svg?seed=user'
      };
      const bId = await createBoard(name.trim(), desc.trim(), user.uid, creatorProfile);
      if (bId) navigate(`/boards/${bId}`);
    } catch {}
    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto w-full py-8 space-y-8">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 md:p-10">
        <div className="absolute top-[-30%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-30%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 flex items-start gap-5">
          <div className="h-12 w-12 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-black/10">
            <Plus className="h-5.5 w-5.5 text-blue-300" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white leading-tight">Create Board</h1>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
              Start a new workspace from scratch. Give it a name and an optional description.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-blue-500 to-blue-600" />
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-900">Board Name</label>
            <input
              type="text"
              required
              maxLength={100}
              placeholder="e.g. Sprint Goals"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-900">Description</label>
            <input
              type="text"
              placeholder="Describe the purpose of this board (optional)"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition cursor-pointer shadow-lg shadow-blue-600/15"
          >
            {submitting ? 'Creating...' : 'Create Board'}
          </button>
        </form>
      </div>
    </div>
  );
};
