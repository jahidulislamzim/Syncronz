import { X, MessageSquare } from 'lucide-react';

export function ModalHeader({ taskTitle, onClose }) {
  return (
    <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/50">
      <div className="flex items-center space-x-2.5 min-w-0">
        <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
          <MessageSquare className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-800 leading-none mb-1">Task Discussion</h3>
          <p className="text-[11px] text-slate-400 font-medium truncate max-w-[280px] sm:max-w-xs">{taskTitle}</p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="p-1.5 hover:bg-slate-100 rounded-xl transition text-slate-400 hover:text-slate-600 cursor-pointer"
      >
        <X className="h-4.5 w-4.5" />
      </button>
    </div>
  );
}
