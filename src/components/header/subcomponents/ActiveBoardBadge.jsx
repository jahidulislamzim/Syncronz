import React from 'react';

export const ActiveBoardBadge = ({ currentBoardName }) => {
  return (
    <div className="hidden min-[1400px]:flex items-center gap-3">
      <h1 className="text-lg font-bold text-slate-900">
        {currentBoardName || 'No Board Selected'}
      </h1>
      <div className="flex items-center px-2 py-1 bg-emerald-50 rounded text-[10px] font-bold text-emerald-700 uppercase tracking-tighter">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span> Real-time Synced
      </div>
    </div>
  );
};
