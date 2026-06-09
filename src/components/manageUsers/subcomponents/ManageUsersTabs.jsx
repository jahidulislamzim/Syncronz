import React from 'react';
import { UserPlus, Users, ShieldCheck, Search } from 'lucide-react';

export const ManageUsersTabs = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  pendingCount,
  memberCount,
  adminCount
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-indigo-500 to-emerald-500" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scroll-smooth">
          <button
            onClick={() => { setActiveTab('invite'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'invite'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Invite
            {pendingCount > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'invite' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
              }`}>
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('members'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'members'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            Members
            {memberCount > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'members' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {memberCount}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('admin'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'admin'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Admin
            {adminCount > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'admin' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800'
              }`}>
                {adminCount}
              </span>
            )}
          </button>
        </div>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab === 'invite' ? 'invitations' : activeTab === 'admin' ? 'admins' : 'members'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-full sm:w-56 transition"
          />
        </div>
      </div>
    </div>
  );
};
