import React from 'react';
import { LogIn } from 'lucide-react';

export const JoinBoardForm = ({
  joinId,
  setJoinId,
  handleJoin,
  isSubmitting
}) => {
  return (
    <form onSubmit={handleJoin} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700">Enter Board ID Token</label>
        <p className="text-[11px] text-slate-400">Ask the board owner to share their Board ID (accessible in the board roster header) and paste it below.</p>
        <input
          type="text"
          required
          placeholder="e.g. board_xxxxxxxxx"
          value={joinId}
          onChange={(e) => setJoinId(e.target.value)}
          className="w-full text-xs font-mono px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white outline-none transition uppercase tracking-wider"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !joinId.trim()}
        className="w-full py-3 bg-slate-900 lg:hover:bg-slate-800 disabled:opacity-55 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 shadow-md cursor-pointer"
      >
        <LogIn className="h-4 w-4" />
        <span>{isSubmitting ? 'Verifying Ticket...' : 'Join Shared Board'}</span>
      </button>
    </form>
  );
};
