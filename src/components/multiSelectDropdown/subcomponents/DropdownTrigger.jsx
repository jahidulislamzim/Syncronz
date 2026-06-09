import { ChevronDown } from 'lucide-react';

export function DropdownTrigger({ selectedCount, placeholder, isOpen, onClick }) {
  return (
    <div
      onClick={onClick}
      className="w-full min-h-[42px] text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 transition flex items-center justify-between cursor-pointer select-none gap-2"
    >
      <div className="flex items-center text-slate-700 min-w-0">
        {selectedCount === 0 ? (
          <span className="text-slate-400 italic">{placeholder}</span>
        ) : (
          <span className="font-semibold text-indigo-750 font-sans text-xs">
            {selectedCount} {selectedCount === 1 ? 'member' : 'members'} selected
          </span>
        )}
      </div>
      <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
    </div>
  );
}
