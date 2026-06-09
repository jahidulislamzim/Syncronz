import React from 'react';
import { Users, ShieldCheck, CheckCircle } from 'lucide-react';

export const ManageUsersStats = ({ totalInvited, adminCount, acceptedCount }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-xl"><Users className="w-5 h-5 text-indigo-600" /></div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{totalInvited}</p>
            <p className="text-xs text-slate-500 font-medium">Total Invited</p>
          </div>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 rounded-xl"><ShieldCheck className="w-5 h-5 text-amber-600" /></div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{adminCount}</p>
            <p className="text-xs text-slate-500 font-medium">Admins</p>
          </div>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 rounded-xl"><CheckCircle className="w-5 h-5 text-emerald-600" /></div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{acceptedCount}</p>
            <p className="text-xs text-slate-500 font-medium">Accepted</p>
          </div>
        </div>
      </div>
    </div>
  );
};
