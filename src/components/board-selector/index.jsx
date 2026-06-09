'use client';

import React from 'react';
import { motion } from 'motion/react';
import { useBoardSelector } from './hooks/useBoardSelector.js';
import { BoardSelectorHeader } from './subcomponents/BoardSelectorHeader.jsx';
import { BoardSelectorTabs } from './subcomponents/BoardSelectorTabs.jsx';
import { MyBoardsTabPane } from './subcomponents/MyBoardsTabPane.jsx';
import { CreateBoardForm } from './subcomponents/CreateBoardForm.jsx';
import { JoinBoardForm } from './subcomponents/JoinBoardForm.jsx';

export const BoardSelector = ({ currentBoardId, onSelectBoard, onClose }) => {
  const {
    activeTab,
    setActiveTab,
    boardName,
    setBoardName,
    boardDesc,
    setBoardDesc,
    joinId,
    setJoinId,
    isSubmitting,
    errorMsg,
    handleCreate,
    handleJoin,
    handleQuickJoin,
    userBoards,
    availablePublicBoards
  } = useBoardSelector(currentBoardId, onSelectBoard, onClose);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900 cursor-pointer"
      />

      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 24, stiffness: 220 }}
        className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col border-l border-slate-200/60 z-10"
      >
        <BoardSelectorHeader onClose={onClose} />

        <BoardSelectorTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          userBoardsCount={userBoards.length}
        />

        <div className="flex-1 overflow-y-auto px-6 pb-6 subtle-scroll">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl leading-relaxed">
              <span className="font-bold">Error:</span> {errorMsg}
            </div>
          )}

          {activeTab === 'my' && (
            <MyBoardsTabPane
              userBoards={userBoards}
              currentBoardId={currentBoardId}
              onSelectBoard={onSelectBoard}
              onClose={onClose}
              availablePublicBoards={availablePublicBoards}
              handleQuickJoin={handleQuickJoin}
              isSubmitting={isSubmitting}
            />
          )}

          {activeTab === 'create' && (
            <CreateBoardForm
              boardName={boardName}
              setBoardName={setBoardName}
              boardDesc={boardDesc}
              setBoardDesc={setBoardDesc}
              handleCreate={handleCreate}
              isSubmitting={isSubmitting}
            />
          )}

          {activeTab === 'join' && (
            <JoinBoardForm
              joinId={joinId}
              setJoinId={setJoinId}
              handleJoin={handleJoin}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
};
