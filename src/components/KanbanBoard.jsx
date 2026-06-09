'use client';

import React from 'react';
import KanbanBoardShell from './kanban/index.jsx';

export const KanbanBoard = ({ boardId, isArchived = false }) => {
  return <KanbanBoardShell boardId={boardId} isArchived={isArchived} />;
};
