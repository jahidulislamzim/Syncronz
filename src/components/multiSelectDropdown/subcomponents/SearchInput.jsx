import { Search, X } from 'lucide-react';

export function SearchInput({ searchQuery, onSearchChange, onClear }) {
  return (
    <div className="flex items-center px-3 py-2 border-b border-slate-100 bg-slate-50/50">
      <Search className="h-3.5 w-3.5 text-slate-400 shrink-0 mr-2" />
      <input
        type="text"
        placeholder="Search team members..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-transparent text-xs text-slate-700 outline-none placeholder-slate-400"
      />
      {searchQuery && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onClear(); }}
          className="p-0.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
