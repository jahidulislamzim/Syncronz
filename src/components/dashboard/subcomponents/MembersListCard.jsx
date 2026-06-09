import React from 'react';
import { Crown } from 'lucide-react';

export const MembersListCard = ({ allUsers, stats, isSuperAdmin }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[400px]">
      <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500 shrink-0" />
      <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Members</h2>
          <p className="text-xs text-slate-400">{stats.totalUsers} registered</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 subtle-scroll">
        {allUsers.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">No users registered yet.</div>
        ) : (
          allUsers.map(u => {
            const isAdminUser = u.isAdmin || isSuperAdmin(u);
            return (
              <div key={u.uid} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/50 transition">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <img
                    src={u.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.displayName)}`}
                    alt={u.displayName}
                    className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 truncate">{u.displayName}</span>
                      {isAdminUser && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-400 font-mono truncate">{u.email}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
