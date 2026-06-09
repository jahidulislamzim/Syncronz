import React from 'react';
import { LayoutDashboard, Users, CheckCircle, Clock, ShieldCheck } from 'lucide-react';

export const StatsGrid = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-xl"><LayoutDashboard className="w-4.5 h-4.5 text-indigo-600" /></div>
          <div>
            <p className="text-xl font-bold text-slate-900">{stats.totalBoards}</p>
            <p className="text-[11px] text-slate-500 font-medium">Boards</p>
          </div>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-xl"><Users className="w-4.5 h-4.5 text-blue-600" /></div>
          <div>
            <p className="text-xl font-bold text-slate-900">{stats.totalUsers}</p>
            <p className="text-[11px] text-slate-500 font-medium">Users</p>
          </div>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-xl"><CheckCircle className="w-4.5 h-4.5 text-emerald-600" /></div>
          <div>
            <p className="text-xl font-bold text-slate-900">{stats.acceptedUsers}</p>
            <p className="text-[11px] text-slate-500 font-medium">Accepted</p>
          </div>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-50 rounded-xl"><Clock className="w-4.5 h-4.5 text-amber-600" /></div>
          <div>
            <p className="text-xl font-bold text-slate-900">{stats.pendingInvites}</p>
            <p className="text-[11px] text-slate-500 font-medium">Pending</p>
          </div>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-xl"><ShieldCheck className="w-4.5 h-4.5 text-purple-600" /></div>
          <div>
            <p className="text-xl font-bold text-slate-900">{stats.admins}</p>
            <p className="text-[11px] text-slate-500 font-medium">Admins</p>
          </div>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-50 rounded-xl"><LayoutDashboard className="w-4.5 h-4.5 text-rose-600" /></div>
          <div>
            <p className="text-xl font-bold text-slate-900">{stats.totalTasks}</p>
            <p className="text-[11px] text-slate-500 font-medium">Tasks</p>
          </div>
        </div>
      </div>
    </div>
  );
};
