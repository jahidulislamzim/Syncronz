'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '../../../../src/lib/firebase/client.js';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../../../src/context/AuthContext.jsx';
import { restoreBoard } from '../../../../src/lib/firebase/firestore.js';
import { Archive, RotateCcw } from 'lucide-react';
import KanbanBoardShell from '../../../../src/components/kanban/index.jsx';
import { MembersRoster } from '../../../../src/components/membersRoster/index.jsx';
import { ActivityLog } from '../../../../src/components/activityLog/index.jsx';
import { BoardDetailSkeleton } from '../../../../src/components/pageLoader/index.jsx';

export default function BoardDetail() {
  const { boardId } = useParams();
  const { user, profile } = useAuth();
  const [board, setBoard] = useState(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (!boardId) return;
    setBoard(null);
    const unsubscribe = onSnapshot(doc(db, 'boards', boardId), (snap) => {
      if (snap.exists()) setBoard(snap.data());
    });
    return () => unsubscribe();
  }, [boardId]);

  const handleRestore = async () => {
    if (!boardId || !user) return;
    setRestoring(true);
    try {
      await restoreBoard(
        boardId,
        user.uid,
        profile?.displayName || user.displayName || 'User',
        profile?.photoURL || user.photoURL || ''
      );
    } catch (e) {
      console.error(e);
    }
    setRestoring(false);
  };

  if (!boardId || !board) {
    return <BoardDetailSkeleton />;
  }

  const isArchived = !!board.isArchived;

  return (
    <div className="flex flex-col h-full w-full">
      {isArchived && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-700">
              <Archive className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900">Archived Workspace</h3>
              <p className="text-xs text-amber-700 font-medium">This board has been archived by the creator and is in read-only mode.</p>
            </div>
          </div>
          {(profile?.isAdmin || board.creatorId === user?.uid) && (
            <button
              onClick={handleRestore}
              disabled={restoring}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer shrink-0 disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {restoring ? 'Restoring...' : 'Restore Board'}
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col lg:flex-row items-stretch lg:space-x-8 space-y-8 lg:space-y-0 h-full">
        <div className="flex-1 flex flex-col justify-start">
          <KanbanBoardShell boardId={boardId} isArchived={isArchived} />
        </div>
        <div className="w-full lg:w-[280px] shrink-0 space-y-6">
          <MembersRoster boardId={boardId} creatorId={board?.creatorId || ''} boardName={board?.name || 'Project Board'} isArchived={isArchived} />
          <ActivityLog boardId={boardId} />
        </div>
      </div>
    </div>
  );
}
