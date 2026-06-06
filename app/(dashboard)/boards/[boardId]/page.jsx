'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '../../../../src/lib/firebase.js';
import { doc, onSnapshot } from 'firebase/firestore';
import { KanbanBoard } from '../../../../src/components/KanbanBoard.jsx';
import { MembersRoster } from '../../../../src/components/MembersRoster.jsx';
import { ActivityLog } from '../../../../src/components/ActivityLog.jsx';
import { BoardDetailSkeleton } from '../../../../src/components/PageLoader.jsx';

export default function BoardDetail() {
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
}
