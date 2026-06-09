'use client';

import { Shield, LogOut, X } from 'lucide-react';
import { MemberRole } from '../../../types.js';
import { isUserOnline } from '../utils/helpers.js';

export function MemberRow({ member, systemUsers, isOwner, currentUserId, isArchived, onLeave, onRemove }) {
  const fullUser = systemUsers.find((u) => u.uid === member.uid);
  const online = isUserOnline(fullUser?.lastActive || member.joinedAt);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <img
            src={member.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.displayName)}`}
            alt={member.displayName}
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-lg object-cover bg-slate-100 border border-slate-200/50"
          />
          <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-800 leading-none truncate max-w-[130px]">{member.displayName}</p>
          <p className="text-[10px] text-slate-400 mt-0.5 font-mono truncate max-w-[130px]">{member.email}</p>
        </div>
      </div>

      <div className="flex items-center space-x-2 shrink-0">
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md font-mono flex items-center space-x-1 ${member.role === MemberRole.OWNER ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
          {member.role === MemberRole.OWNER ? (
            <>
              <Shield className="h-2.5 w-2.5" />
              <span>Owner</span>
            </>
          ) : (
            <span>Collab</span>
          )}
        </span>

        {!isArchived && member.role !== MemberRole.OWNER && (
          <>
            {member.uid === currentUserId && (
              <button
                onClick={onLeave}
                className="p-1 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg transition cursor-pointer"
                title="Leave Board"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            )}

            {isOwner && member.uid !== currentUserId && (
              <button
                onClick={() => onRemove(member)}
                className="p-1 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg transition cursor-pointer"
                title="Remove member"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
