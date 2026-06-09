import React from 'react';
import { Sparkles, ArrowRight, User, LogIn } from 'lucide-react';

export const MyBoardsTabPane = ({
  userBoards,
  currentBoardId,
  onSelectBoard,
  onClose,
  availablePublicBoards,
  handleQuickJoin,
  isSubmitting
}) => {
  return (
    <div className="space-y-4">
      {userBoards.length === 0 ? (
        <div className="py-20 text-center text-slate-400">
          <Sparkles className="h-10 w-10 mx-auto text-indigo-400 stroke-1 mb-3 animate-spin duration-3000" />
          <p className="text-sm font-semibold text-slate-700">No active boards yet</p>
          <p className="text-xs text-slate-400 max-w-[200px] mx-auto mt-1">Create a new board or join an existing board token to start collaborating.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <h3 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">Joined Boards</h3>
          {userBoards.map((board) => (
            <button
              key={board.boardId}
              onClick={() => {
                onSelectBoard(board.boardId);
                onClose();
              }}
              className={`w-full p-4 rounded-xl text-left border flex items-center justify-between cursor-pointer transition-all ${currentBoardId === board.boardId ? 'bg-indigo-50/20 border-indigo-200 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
            >
              <div className="min-w-0 pr-3">
                <h4 className="text-xs font-bold text-slate-800 truncate">{board.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[280px]">
                  {board.description || 'No description assigned.'}
                </p>
              </div>
              <ArrowRight className={`h-4 w-4 shrink-0 transition-opacity ${currentBoardId === board.boardId ? 'text-indigo-500 opacity-100' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`} />
            </button>
          ))}
        </div>
      )}

      {availablePublicBoards.length > 0 && (
        <div className="pt-6 border-t border-slate-100 space-y-2">
          <h3 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1 flex items-center space-x-1.5">
            <User className="h-3.5 w-3.5" />
            <span>Explore System Boards ({availablePublicBoards.length})</span>
          </h3>
          {availablePublicBoards.map((board) => (
            <div
              key={board.boardId}
              className="p-4 bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-xl flex items-center justify-between transition"
            >
              <div className="min-w-0 pr-3">
                <h4 className="text-xs font-bold text-slate-800 truncate">{board.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[220px]">
                  {board.description || 'No description assigned.'}
                </p>
                <p className="text-[9px] font-mono tracking-wider text-slate-400 mt-1 font-semibold">
                  ID: {board.boardId}
                </p>
              </div>
              <button
                onClick={() => handleQuickJoin(board.boardId)}
                disabled={isSubmitting}
                className="py-1.5 px-3 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg text-[10px] font-bold text-indigo-600 transition cursor-pointer flex items-center space-x-1 whitespace-nowrap"
              >
                <LogIn className="h-3 w-3" />
                <span>Join Live</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
