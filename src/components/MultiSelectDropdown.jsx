'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export const MultiSelectDropdown = ({ 
  members = [], 
  selectedIds = [], 
  onChange, 
  placeholder = "Select team members..." 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter members based on search query and remove already selected members
  const filteredMembers = members.filter(m => 
    !selectedIds.includes(m.uid) && (
      (m.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const toggleMember = (uid) => {
    const isSelected = selectedIds.includes(uid);
    let updated;
    if (isSelected) {
      updated = selectedIds.filter(id => id !== uid);
    } else {
      updated = [...selectedIds, uid];
    }
    onChange(updated);
  };

  const removeMember = (e, uid) => {
    e.stopPropagation();
    onChange(selectedIds.filter(id => id !== uid));
  };

  const selectedMembers = members.filter(m => selectedIds.includes(m.uid));

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Button */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-h-[42px] text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 transition flex items-center justify-between cursor-pointer select-none gap-2"
      >
        <div className="flex items-center text-slate-700 min-w-0">
          {selectedMembers.length === 0 ? (
            <span className="text-slate-400 italic">{placeholder}</span>
          ) : (
            <span className="font-semibold text-indigo-750 font-sans text-xs">
              {selectedMembers.length} {selectedMembers.length === 1 ? 'member' : 'members'} selected
            </span>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Search Input */}
          <div className="flex items-center px-3 py-2 border-b border-slate-100 bg-slate-50/50">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0 mr-2" />
            <input
              type="text"
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-transparent text-xs text-slate-700 outline-none placeholder-slate-400"
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); setSearchQuery(''); }}
                className="p-0.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Members List */}
          <div className="max-h-[180px] overflow-y-auto py-1">
            {filteredMembers.map(m => {
              const isSelected = selectedIds.includes(m.uid);
              return (
                <div
                  key={m.uid}
                  onClick={() => toggleMember(m.uid)}
                  className={`flex items-center justify-between px-3 py-2.5 text-xs cursor-pointer transition-colors ${
                    isSelected ? 'bg-indigo-50/50 text-indigo-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <img
                      src={m.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.displayName)}`}
                      alt={m.displayName}
                      className="h-5.5 w-5.5 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-slate-800 font-medium leading-none truncate">{m.displayName}</p>
                      <p className="text-[10px] text-slate-400 leading-tight truncate mt-0.5">{m.email}</p>
                    </div>
                  </div>
                  
                  {/* Check icon or checkbox visual */}
                  <div className={`h-4.5 w-4.5 rounded-md border flex items-center justify-center transition ${
                    isSelected 
                      ? 'bg-indigo-600 border-indigo-600 text-white' 
                      : 'border-slate-350 bg-white hover:border-slate-400'
                  }`}>
                    {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                </div>
              );
            })}

            {filteredMembers.length === 0 && (
              <div className="py-6 text-center text-slate-400 text-[11px] italic">
                No board members found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected Members Display (at the bottom) */}
      {selectedMembers.length > 0 && (
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
                onClick={(e) => removeMember(e, m.uid)}
                className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
