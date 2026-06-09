import React from 'react';
import { Plus } from 'lucide-react';

export const CreateBoardForm = ({
  boardName,
  setBoardName,
  boardDesc,
  setBoardDesc,
  handleCreate,
  isSubmitting
}) => {
  return (
    <form onSubmit={handleCreate} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700">Board Name</label>
        <input
          type="text"
          required
          maxLength={100}
          placeholder="e.g. Core Engineering, Marketing Campaign"
          value={boardName}
          onChange={(e) => setBoardName(e.target.value)}
          className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white outline-none transition"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700">Description (Optional)</label>
        <textarea
          placeholder="Write a brief overview of what this board will manage..."
          rows={4}
          value={boardDesc}
          onChange={(e) => setBoardDesc(e.target.value)}
          className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white outline-none transition resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !boardName.trim()}
        className="w-full py-3 bg-slate-900 lg:hover:bg-slate-800 disabled:opacity-55 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 shadow-md shadow-slate-900/10 cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        <span>{isSubmitting ? 'Creating Layout...' : 'Build Project Board'}</span>
      </button>
    </form>
  );
};
