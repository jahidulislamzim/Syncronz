import React from 'react';
import { ArrowRight } from 'lucide-react';

export const BoardsListCard = ({ allBoards, stats, boardTaskCounts, navigate }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[400px]">
      <div className="h-1 bg-gradient-to-r from-indigo-500 to-blue-500 shrink-0" />
      <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-sm font-bold text-slate-900">All Boards</h2>
          <p className="text-xs text-slate-400">{stats.totalBoards} total</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 subtle-scroll">
        {allBoards.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">No boards created yet.</div>
        ) : (
          allBoards.map((board, idx) => (
            <div
              key={board.boardId || `db-board-${idx}`}
              onClick={() => navigate.push(`/boards/${board.boardId}`)}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/50 transition cursor-pointer"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                  <span className="text-sm font-semibold text-slate-900 truncate">{board.name}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{board.description || 'No description'}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-3">
                <span className="text-xs font-mono font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                  {boardTaskCounts[board.boardId] || 0} tasks
                </span>
                <ArrowRight className="w-4 h-4 text-slate-300" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
