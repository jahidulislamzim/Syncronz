import { Users, Copy, Check } from 'lucide-react';

export function RosterHeader({ memberCount, boardId, isCoping, onCopyBoardId }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center space-x-1.5">
        <Users className="h-4 w-4 text-slate-500" />
        <span>Roster ({memberCount})</span>
      </h3>
      <button
        onClick={onCopyBoardId}
        className="flex items-center space-x-1.5 px-2 py-1 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-[10px] font-mono font-bold text-slate-500 transition cursor-pointer"
        title="Click to copy Board ID"
      >
        {isCoping ? (
          <>
            <Check className="h-3 w-3 text-emerald-500" />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <Copy className="h-3 w-3" />
            <span className="truncate max-w-[80px]">ID: {boardId.split('_')[1]}</span>
          </>
        )}
      </button>
    </div>
  );
}
