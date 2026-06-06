import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../lib/firebase.js';
import { doc, onSnapshot } from 'firebase/firestore';
import { KanbanBoard } from '../components/KanbanBoard.jsx';
import { MembersRoster } from '../components/MembersRoster.jsx';
import { ActivityLog } from '../components/ActivityLog.jsx';
import { BoardDetailSkeleton } from '../components/PageLoader.jsx';

export const BoardDetail = () => {
  const { boardId } = useParams();
  const [board, setBoard] = useState(null);

  useEffect(() => {
    if (!boardId) return;
    setBoard(null);
    const unsubscribe = onSnapshot(doc(db, 'boards', boardId), (snap) => {
      if (snap.exists()) setBoard(snap.data());
    });
    return () => unsubscribe();
  }, [boardId]);

  if (!boardId || !board) {
    return <BoardDetailSkeleton />;
  }

  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:space-x-8 space-y-8 lg:space-y-0 h-full">
      <div className="flex-1 flex flex-col justify-start">
        <KanbanBoard boardId={boardId} />
      </div>
      <div className="w-full lg:w-[280px] shrink-0 space-y-6">
        <MembersRoster boardId={boardId} creatorId={board?.creatorId || ''} />
        <ActivityLog boardId={boardId} />
      </div>
    </div>
  );
};
