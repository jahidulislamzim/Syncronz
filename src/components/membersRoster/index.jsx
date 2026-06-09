'use client';

import { useMembersRoster } from './hooks/useMembersRoster.js';
import { RosterHeader } from './subcomponents/RosterHeader.jsx';
import { AddMemberForm } from './subcomponents/AddMemberForm.jsx';
import { MemberRow } from './subcomponents/MemberRow.jsx';

export function MembersRoster({ boardId, creatorId, boardName, isArchived = false }) {
  const {
    members,
    systemUsers,
    user,
    isOwner,
    isArchived: archived,
    query,
    setQuery,
    showDropdown,
    setShowDropdown,
    isCoping,
    msg,
    isSubmitting,
    filteredUsers,
    dropdownRef,
    handleSelect,
    handleLeaveBoard,
    handleRemoveMember,
    handleSubmit,
    handleCopyBoardId,
  } = useMembersRoster(boardId, creatorId, boardName, isArchived);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm">
      <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-t-2xl" />
      <div className="p-5 space-y-5">
        <RosterHeader
          memberCount={members.length}
          boardId={boardId}
          isCoping={isCoping}
          onCopyBoardId={handleCopyBoardId}
        />

        {archived ? (
          <div className="text-center text-[11px] text-amber-600 font-semibold py-3 bg-amber-50 rounded-xl border border-amber-100 font-mono">
            Roster is locked because this board is archived.
          </div>
        ) : (
          <AddMemberForm
            query={query}
            setQuery={setQuery}
            showDropdown={showDropdown}
            setShowDropdown={setShowDropdown}
            msg={msg}
            isSubmitting={isSubmitting}
            filteredUsers={filteredUsers}
            dropdownRef={dropdownRef}
            onSelect={handleSelect}
            onSubmit={handleSubmit}
          />
        )}

        <div className="pt-4 border-t border-slate-100 space-y-3.5 max-h-[220px] overflow-y-auto pr-1 subtle-scroll">
          {members.map((member) => (
            <MemberRow
              key={member.uid}
              member={member}
              systemUsers={systemUsers}
              isOwner={isOwner}
              currentUserId={user?.uid}
              isArchived={archived}
              onLeave={handleLeaveBoard}
              onRemove={handleRemoveMember}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
