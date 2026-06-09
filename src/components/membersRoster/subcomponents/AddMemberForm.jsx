'use client';

import { UserPlus, Search, X } from 'lucide-react';

export function AddMemberForm({
  query,
  setQuery,
  showDropdown,
  setShowDropdown,
  msg,
  isSubmitting,
  filteredUsers,
  dropdownRef,
  onSelect,
  onSubmit,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-2 relative">
      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1">
        <UserPlus className="h-3 w-3" />
        <span>Add Team Member</span>
      </h4>

      {msg.text && (
        <div className={`p-2.5 rounded-xl border text-[10px] font-medium leading-relaxed ${msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {msg.text}
        </div>
      )}

      <div className="relative" ref={dropdownRef}>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              required
              placeholder="Search registered users..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg outline-none transition"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); setShowDropdown(false); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !query.trim()}
            className="py-2 px-3 bg-blue-600 border border-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer shadow-sm"
          >
            {isSubmitting ? 'Adding...' : 'Add'}
          </button>
        </div>

        {showDropdown && filteredUsers.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-36 overflow-y-auto">
            {filteredUsers.map((u) => (
              <button
                key={u.uid}
                type="button"
                onClick={() => onSelect(u)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition text-left cursor-pointer border-b border-slate-100 last:border-0"
              >
                <img
                  src={u.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.displayName || u.uid)}`}
                  alt={u.displayName}
                  className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 truncate">{u.displayName}</p>
                  <p className="text-[10px] text-slate-500 font-mono truncate">{u.email}</p>
                </div>
                <UserPlus className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              </button>
            ))}
          </div>
        )}

        {showDropdown && query.trim() && filteredUsers.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-3 text-center">
            <p className="text-xs text-slate-500">No registered users match "{query}"</p>
            <p className="text-[10px] text-slate-400 mt-1">Only users who have signed in can be added</p>
          </div>
        )}
      </div>
    </form>
  );
}
