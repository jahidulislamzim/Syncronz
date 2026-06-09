import React from 'react';
import { ShieldCheck, Crown, XCircle, Check, X, Trash2 } from 'lucide-react';

export const AdminTabPane = ({
  adminUsers,
  searchQuery,
  filteredUsers,
  isSuperAdmin,
  user,
  handleRemoveAdmin,
  confirmDelete,
  setConfirmDelete,
  handleDeleteUser
}) => {
  const displayList = searchQuery ? filteredUsers.filter(u => u.isAdmin || isSuperAdmin(u)) : adminUsers;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900">Administrators</h2>
          <p className="text-sm text-slate-500">{adminUsers.length} admin{adminUsers.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {displayList.length === 0 ? (
        <div className="p-16 text-center">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200">
            <ShieldCheck className="w-6 h-6 text-slate-300" />
          </div>
          <p className="text-sm font-semibold text-slate-900">{searchQuery ? 'No matches found' : 'No admins yet'}</p>
          <p className="text-sm text-slate-500 mt-1">{searchQuery ? 'Try a different search term' : 'Promote members to admin from the Members tab'}</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {displayList.map((u) => {
            const superAdmin = isSuperAdmin(u);
            return (
              <div key={u.uid} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 sm:py-4 gap-3 hover:bg-slate-50/50 transition">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <img
                    src={u.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.displayName || u.uid)}`}
                    alt={u.displayName}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 truncate">{u.displayName}</span>
                      {u.uid === user?.uid && <span className="text-[10px] text-slate-400 font-mono">(you)</span>}
                      {superAdmin ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold">
                          <Crown className="w-3 h-3" /> Super Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold">
                          <ShieldCheck className="w-3 h-3" /> Admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 font-mono truncate mt-0.5" title={u.email}>{u.email || 'No email'}</p>
                    {!superAdmin && u.isAdmin && (
                      <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Promoted by workspace admin</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0 pl-[52px] sm:pl-0 border-t border-slate-100 sm:border-t-0 pt-3 sm:pt-0 justify-start sm:justify-end">
                  {u.uid !== user?.uid && !superAdmin && (
                    <button
                      onClick={() => handleRemoveAdmin(u.uid, u.displayName)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 transition cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Remove Admin
                    </button>
                  )}
                  {u.uid !== user?.uid && !superAdmin && (
                    confirmDelete === u.uid ? (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-red-600 font-semibold mr-1">Delete?</span>
                        <button
                          onClick={() => handleDeleteUser(u.uid, u.displayName)}
                          className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(u.uid)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        title="Delete user"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
