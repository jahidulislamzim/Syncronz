'use client';

import { useState, useRef } from 'react';
import { useClickOutside } from './hooks/useClickOutside.js';
import { DropdownTrigger } from './subcomponents/DropdownTrigger.jsx';
import { SearchInput } from './subcomponents/SearchInput.jsx';
import { MemberOption } from './subcomponents/MemberOption.jsx';
import { SelectedMemberChips } from './subcomponents/SelectedMemberChips.jsx';

export const MultiSelectDropdown = ({
  members = [],
  selectedIds = [],
  onChange,
  placeholder = "Select team members..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);

  useClickOutside(containerRef, () => setIsOpen(false));

  const filteredMembers = members.filter(m =>
    !selectedIds.includes(m.uid) && (
      (m.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const toggleMember = (uid) => {
    const isSelected = selectedIds.includes(uid);
    const updated = isSelected
      ? selectedIds.filter(id => id !== uid)
      : [...selectedIds, uid];
    onChange(updated);
  };

  const removeMember = (e, uid) => {
    e.stopPropagation();
    onChange(selectedIds.filter(id => id !== uid));
  };

  const selectedMembers = members.filter(m => selectedIds.includes(m.uid));

  return (
    <div className="relative w-full" ref={containerRef}>
      <DropdownTrigger
        selectedCount={selectedMembers.length}
        placeholder={placeholder}
        isOpen={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      />

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          <SearchInput
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
          />

          <div className="max-h-[180px] overflow-y-auto py-1">
            {filteredMembers.map(m => (
              <MemberOption
                key={m.uid}
                member={m}
                isSelected={selectedIds.includes(m.uid)}
                onToggle={toggleMember}
              />
            ))}

            {filteredMembers.length === 0 && (
              <div className="py-6 text-center text-slate-400 text-[11px] italic">
                No board members found
              </div>
            )}
          </div>
        </div>
      )}

      <SelectedMemberChips
        selectedMembers={selectedMembers}
        onRemove={removeMember}
      />
    </div>
  );
};
