'use client';

import React from 'react';
import { useDashboard } from './hooks/useDashboard.js';
import { DashboardBanner } from './subcomponents/DashboardBanner.jsx';
import { StatsGrid } from './subcomponents/StatsGrid.jsx';
import { BoardsListCard } from './subcomponents/BoardsListCard.jsx';
import { MembersListCard } from './subcomponents/MembersListCard.jsx';
import { QuickActionsCard } from './subcomponents/QuickActionsCard.jsx';
import { DashboardSkeleton } from '../PageLoader.jsx';

export const Dashboard = () => {
  const {
    user,
    profile,
    navigate,
    errorMsg,
    pageLoading,
    allBoards,
    allUsers,
    boardTaskCounts,
    isSuperAdmin,
    refreshData,
    stats
  } = useDashboard();

  if (pageLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="max-w-5xl mx-auto w-full py-8 space-y-8">
      <DashboardBanner 
        profile={profile}
        user={user}
        refreshData={refreshData}
      />

      {profile?.isAdmin && (
        <>
          <StatsGrid stats={stats} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BoardsListCard
              allBoards={allBoards}
              stats={stats}
              boardTaskCounts={boardTaskCounts}
              navigate={navigate}
            />

            <MembersListCard
              allUsers={allUsers}
              stats={stats}
              isSuperAdmin={isSuperAdmin}
            />
          </div>

          <QuickActionsCard navigate={navigate} />
        </>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded-xl leading-relaxed flex items-center gap-3">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
          {errorMsg}
        </div>
      )}
    </div>
  );
};
