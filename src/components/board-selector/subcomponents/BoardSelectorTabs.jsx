import React from 'react';

export const BoardSelectorTabs = ({ activeTab, setActiveTab, userBoardsCount }) => {
  return (
    <div className="flex border-b border-slate-100 bg-slate-50/55 p-1 mx-4 my-3.5 rounded-xl border">
      <button
        onClick={() => setActiveTab('my')}
        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'my' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
      >
        My Boards ({userBoardsCount})
      </button>
      <button
        onClick={() => setActiveTab('create')}
        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'create' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
      >
        Create Board
      </button>
      <button
        onClick={() => setActiveTab('join')}
        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'join' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
      >
        Join Board
      </button>
    </div>
  );
};
