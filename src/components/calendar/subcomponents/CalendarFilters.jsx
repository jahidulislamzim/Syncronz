'use client';

import { Filter, User, Users } from 'lucide-react';

const priorityOptions = [
  { value: 'all', label: 'All', color: 'bg-slate-100 text-slate-700' },
  { value: 'high', label: 'High', color: 'bg-red-50 text-red-700 border-red-200' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'low', label: 'Low', color: 'bg-blue-50 text-blue-700 border-blue-200' },
];

export const CalendarFilters = ({
  myTasksOnly,
  setMyTasksOnly,
  boardFilter,
  setBoardFilter,
  priorityFilter,
  setPriorityFilter,
  userBoards,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="flex items-center gap-1.5">
        <Filter className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filters</span>
      </div>

      <div className="h-5 w-px bg-slate-200" />

      {/* My Tasks / All Tasks Toggle */}
      <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
        <button
          onClick={() => setMyTasksOnly(false)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
            !myTasksOnly
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-3 h-3" />
          All Tasks
        </button>
        <button
          onClick={() => setMyTasksOnly(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
            myTasksOnly
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <User className="w-3 h-3" />
          My Tasks
        </button>
      </div>

      <div className="h-5 w-px bg-slate-200" />

      {/* Project filter */}
      <div className="relative">
        <select
          value={boardFilter}
          onChange={e => setBoardFilter(e.target.value)}
          className="appearance-none bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg px-2.5 py-1.5 pr-7 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
        >
          <option value="all">All Projects</option>
          {userBoards.map(b => (
            <option key={b.boardId} value={b.boardId}>{b.name}</option>
          ))}
        </select>
        <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      <div className="h-5 w-px bg-slate-200" />

      {/* Priority filter */}
      <div className="flex items-center gap-1">
        {priorityOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setPriorityFilter(opt.value)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
              priorityFilter === opt.value
                ? `${opt.color} border-2`
                : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100 hover:text-slate-600'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};
