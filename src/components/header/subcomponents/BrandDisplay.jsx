import React from 'react';
import { Menu, Sparkles } from 'lucide-react';

export const BrandDisplay = ({ onToggleSidebar }) => {
  return (
    <>
      {/* Sidebar toggle — mobile */}
      <button
        onClick={onToggleSidebar}
        className="min-[1400px]:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer -ml-1"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile brand */}
      <div className="flex items-center gap-2 min-[1400px]:hidden">
        <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-indigo-400" />
        </div>
        <span className="text-slate-900 font-bold tracking-tight text-sm">Syncro</span>
      </div>
    </>
  );
};
