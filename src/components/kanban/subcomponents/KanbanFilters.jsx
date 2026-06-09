import React from 'react';
import { Search, Filter, User, Plus } from 'lucide-react';

export const KanbanFilters = ({
  searchTerm,
  setSearchTerm,
  priorityFilter,
  setPriorityFilter,
  assigneeFilter,
  setAssigneeFilter,
  members = [],
  isArchived = false,
  setIsCreateOpen
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4.5 mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-sm">
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 flex-1">
        {/* Search bar */}
        <div className="relative flex-1 max-w-sm">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </span>
          <input
            type="text"
            placeholder="Search in tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition"
          />
        </div>

        {/* Priority filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
        </div>

        {/* Assignee filter */}
        <div className="flex items-center gap-2">
          <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition max-w-[150px]"
          >
            <option value="all">All Assignees</option>
            <option value="unassigned">Unassigned Only</option>
            {members.map(m => (
              <option key={m.uid} value={m.uid}>{m.displayName}</option>
            ))}
          </select>
        </div>
        
        {(searchTerm !== '' || priorityFilter !== 'all' || assigneeFilter !== 'all') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setPriorityFilter('all');
              setAssigneeFilter('all');
            }}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer text-left pl-1 transition"
          >
            Clear filters
          </button>
        )}
      </div>

      {!isArchived && (
        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2.5 bg-blue-600 lg:hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-md shadow-blue-600/15 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>New Task</span>
        </button>
      )}
    </div>
  );
};
