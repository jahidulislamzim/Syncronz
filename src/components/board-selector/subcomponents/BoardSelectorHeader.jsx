import React from 'react';
import { FolderOpen, X } from 'lucide-react';

export const BoardSelectorHeader = ({ onClose }) => {
  return (
    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <FolderOpen className="h-5 w-5 text-indigo-500" />
        <h2 className="text-base font-bold text-slate-800">Workspace Boards</h2>
      </div>
      <button 
        onClick={onClose}
        className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-50 transition cursor-pointer"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
};
