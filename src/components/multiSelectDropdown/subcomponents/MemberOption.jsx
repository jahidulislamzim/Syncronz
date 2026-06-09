import { Check } from 'lucide-react';

export function MemberOption({ member, isSelected, onToggle }) {
  return (
    <div
      onClick={() => onToggle(member.uid)}
      className={`flex items-center justify-between px-3 py-2.5 text-xs cursor-pointer transition-colors ${
        isSelected ? 'bg-indigo-50/50 text-indigo-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
      }`}
    >
      <div className="flex items-center space-x-2.5 min-w-0">
        <img
          src={member.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.displayName)}`}
          alt={member.displayName}
          className="h-5.5 w-5.5 rounded-full object-cover shrink-0"
        />
        <div className="min-w-0">
          <p className="text-slate-800 font-medium leading-none truncate">{member.displayName}</p>
          <p className="text-[10px] text-slate-400 leading-tight truncate mt-0.5">{member.email}</p>
        </div>
      </div>

      <div className={`h-4.5 w-4.5 rounded-md border flex items-center justify-center transition ${
        isSelected
          ? 'bg-indigo-600 border-indigo-600 text-white'
          : 'border-slate-350 bg-white hover:border-slate-400'
      }`}>
        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
      </div>
    </div>
  );
}
