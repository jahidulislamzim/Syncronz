import React from 'react';
import { Users, Plus } from 'lucide-react';

export const QuickActionsCard = ({ navigate }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-slate-500 to-slate-600" />
      <div className="p-5">
        <h2 className="text-sm font-bold text-slate-900">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <button
            onClick={() => navigate.push('/manage-users')}
            className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition text-left cursor-pointer"
          >
            <Users className="w-5 h-5 text-indigo-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-slate-900">Manage Users</p>
              <p className="text-xs text-slate-400">Invite & manage access</p>
            </div>
          </button>
          <button
            onClick={() => navigate.push('/boards/new')}
            className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition text-left cursor-pointer"
          >
            <Plus className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-slate-900">Board Management</p>
              <p className="text-xs text-slate-400">Create or join a workspace</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
