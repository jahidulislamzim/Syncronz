import { X } from 'lucide-react';

export function SelectedMemberChips({ selectedMembers, onRemove }) {
  if (selectedMembers.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2 animate-in fade-in slide-in-from-top-1 duration-150">
      {selectedMembers.map(m => (
        <div
          key={m.uid}
          className="flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl py-1 pl-2 pr-1.5 transition min-w-0"
        >
          <img
            src={m.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.displayName)}`}
            alt={m.displayName}
            className="h-5 w-5 rounded-full object-cover shrink-0"
          />
          <div className="flex flex-col min-w-0 pr-1">
            <span className="font-semibold text-[11px] leading-tight truncate">{m.displayName}</span>
            <span className="text-[9px] text-slate-400 leading-none truncate mt-0.5">{m.email}</span>
          </div>
          <button
            type="button"
            onClick={(e) => onRemove(e, m.uid)}
            className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
