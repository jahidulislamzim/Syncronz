'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { useHeader } from './hooks/useHeader.js';
import { BrandDisplay } from './subcomponents/BrandDisplay.jsx';
import { NotificationMenu } from './subcomponents/NotificationMenu.jsx';
import { UserProfileCard } from './subcomponents/UserProfileCard.jsx';
import { ActiveBoardBadge } from './subcomponents/ActiveBoardBadge.jsx';

export default function HeaderShell({ currentBoardName: propBoardName, onOpenBoardSelector: propSelector, onToggleSidebar }) {
  const {
    user,
    profile,
    boardName,
    loggingOut,
    notifications,
    showNotifMenu,
    setShowNotifMenu,
    unreadCount,
    onOpenBoardSelector,
    handleSignOutClick,
    handleMarkAsRead,
    handleClearAll,
    notifMenuRef
  } = useHeader(propBoardName, propSelector);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shrink-0 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <BrandDisplay onToggleSidebar={onToggleSidebar} />
        <ActiveBoardBadge currentBoardName={boardName} />
        
        {/* Board switcher */}
        <button 
          onClick={onOpenBoardSelector}
          className="hidden sm:flex items-center space-x-1 px-2.5 py-1 bg-slate-50 border border-slate-200 hover:border-slate-350 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 transition cursor-pointer shadow-sm"
        >
          <Sparkles className="h-3.5 w-3.5 text-blue-600" />
          <span>Switch Workspace</span>
        </button>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <NotificationMenu
            showNotifMenu={showNotifMenu}
            setShowNotifMenu={setShowNotifMenu}
            unreadCount={unreadCount}
            notifications={notifications}
            handleClearAll={handleClearAll}
            handleMarkAsRead={handleMarkAsRead}
            notifMenuRef={notifMenuRef}
          />
        )}

        {profile && (
          <UserProfileCard
            profile={profile}
            loggingOut={loggingOut}
            handleSignOutClick={handleSignOutClick}
          />
        )}
      </div>
    </header>
  );
}
