import React from 'react';
import { LogOut } from 'lucide-react';

export const UserProfileCard = ({ profile, loggingOut, handleSignOutClick }) => {
  if (!profile) return null;
  
  return (
    <div className="flex items-center gap-3 bg-slate-50/50 p-1.5 border border-slate-200/60 rounded-xl">
      <img
        src={profile.photoURL}
        alt={profile.displayName}
        referrerPolicy="no-referrer"
        className="w-7 h-7 rounded-xl object-cover border border-slate-200/50"
      />
      <div className="hidden min-[1400px]:block min-w-0 pr-1.5">
        <p className="text-xs font-bold text-slate-800 truncate max-w-[100px]">{profile.displayName}</p>
      </div>
      <button
        onClick={handleSignOutClick}
        disabled={loggingOut}
        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer disabled:opacity-50"
        title="Sign Out"
      >
        {loggingOut ? (
          <span className="w-4 h-4 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin" />
        ) : (
          <LogOut className="h-4 w-4" />
        )}
      </button>
    </div>
  );
};
