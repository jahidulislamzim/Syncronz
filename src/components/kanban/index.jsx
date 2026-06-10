'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import { useKanbanBoard } from './hooks/useKanbanBoard.js';
import { KanbanFilters } from './subcomponents/KanbanFilters.jsx';
import { KanbanColumn } from './subcomponents/KanbanColumn.jsx';
import { TaskCreateModal } from './subcomponents/TaskCreateModal.jsx';
import { TaskInspectorModal } from './subcomponents/TaskInspectorModal.jsx';
import { TaskProgressReportModal } from '../taskProgressReportModal/index.jsx';
import { TaskCommentsModal } from '../taskCommentsModal/index.jsx';
import { TaskStatus, TaskPriority } from '../../types.js';

export default function KanbanBoardShell({ boardId, isArchived = false }) {
  const {
    user,
    profile,
    members,
    boardDrive,
    isCreateOpen,
    setIsCreateOpen,
    inspectingTask,
    setInspectingTask,
    liveInspectingTask,
    isReportOpen,
    setIsReportOpen,
    isCommentsOpen,
    setIsCommentsOpen,
    newTitle,
    setNewTitle,
    newDesc,
    setNewDesc,
    newPriority,
    setNewPriority,
    newDueDate,
    setNewDueDate,
    newAssigneeId,
    setNewAssigneeId,
    newAssigneeIds,
    setNewAssigneeIds,
    isSubmitting,
    deleteConfirm,
    setDeleteConfirm,
    toast,
    setToast,
    isEditing,
    setIsEditing,
    editTitle,
    setEditTitle,
    editDesc,
    setEditDesc,
    editPriority,
    setEditPriority,
    editDueDate,
    setEditDueDate,
    editAssigneeId,
    setEditAssigneeId,
    editAssigneeIds,
    setEditAssigneeIds,
    editSubtasks,
    setEditSubtasks,
    editTags,
    setEditTags,
    editAttachments,
    setEditAttachments,
    commentText,
    setCommentText,
    customUrl,
    setCustomUrl,
    customUrlName,
    setCustomUrlName,
    newSubtaskTitle,
    setNewSubtaskTitle,
    subtaskAssigneeType,
    setSubtaskAssigneeType,
    subtaskAssignedTo,
    setSubtaskAssignedTo,
    newTags,
    setNewTags,
    newSubtaskInput,
    setNewSubtaskInput,
    newSubtaskAssigneeType,
    setNewSubtaskAssigneeType,
    newSubtaskAssignedTo,
    setNewSubtaskAssignedTo,
    inlineSubtasks,
    setInlineSubtasks,
    uploadingFile,
    uploadingCreationFile,
    fileInputRef,
    creationFileInputRef,
    newAttachments,
    setNewAttachments,
    linkUrl,
    setLinkUrl,
    linkName,
    setLinkName,
    searchTerm,
    setSearchTerm,
    priorityFilter,
    setPriorityFilter,
    assigneeFilter,
    setAssigneeFilter,
    showToast,
    handleCreateTask,
    handleUpdateTaskDetails,
    handleDeleteTask,
    handleStatusTransition,
    handleAddComment,
    handleToggleSubtask,
    handleAddSubtask,
    handleDeleteSubtask,
    handleToggleSubtaskViewMode,
    handleToggleTag,
    handleAddLinkAttachment,
    handleDeleteAttachment,
    handleCreationFileUpload,
    handleEditDeleteAttachment,
    handleEditAddLinkAttachment,
    handleEditFileUpload,
    handleFileUpload,
    launchTaskInspector,
    filteredTasks,
    stats,
    newAcceptLateSubmit,
    setNewAcceptLateSubmit,
    editAcceptLateSubmit,
    setEditAcceptLateSubmit,
    isDeadlineEnforced
  } = useKanbanBoard(boardId, isArchived);

  const columnsDef = [
    { id: TaskStatus.TODO, label: 'To Do', color: 'border-slate-300 bg-slate-50/80 text-slate-700' },
    { id: TaskStatus.IN_PROGRESS, label: 'In Progress', color: 'border-blue-200 bg-blue-50/20 text-blue-700' },
    { id: TaskStatus.REVIEW, label: 'In Review', color: 'border-purple-200 bg-purple-50/20 text-purple-700' },
    { id: TaskStatus.DONE, label: 'Completed', color: 'border-emerald-200 bg-emerald-50/20 text-emerald-805' }
  ];

  return (
    <div className="flex flex-col flex-1 h-full min-h-[500px]">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl border text-sm font-semibold ${
              toast.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            {toast.type === 'error' ? <AlertTriangle className="w-5 h-5 shrink-0" /> : <CheckCircle className="w-5 h-5 shrink-0" />}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-3 opacity-60 hover:opacity-100 cursor-pointer"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Board KPI Stats Header */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
          <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-widest block">Total Tasks</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-extrabold text-slate-900">{stats.total}</span>
            <span className="text-[10px] text-slate-400 font-mono">100% total</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col justify-between shadow-sm border-l-4 border-l-slate-450">
          <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-widest block">To Do</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-extrabold text-slate-700">{stats.todo}</span>
            <span className="text-[10px] text-slate-400 font-mono">{stats.total > 0 ? Math.round((stats.todo / stats.total) * 100) : 0}%</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col justify-between shadow-sm border-l-4 border-l-blue-500">
          <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-widest block">In Progress</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-extrabold text-blue-600">{stats.doing}</span>
            <span className="text-[10px] text-slate-400 font-mono">{stats.total > 0 ? Math.round((stats.doing / stats.total) * 100) : 0}%</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col justify-between shadow-sm border-l-4 border-l-emerald-500">
          <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-widest block">Completed</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-extrabold text-emerald-600">{stats.completed}</span>
            <span className="text-[10px] text-slate-400 font-mono">{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col justify-between shadow-sm border-l-4 border-l-red-500 col-span-2 lg:col-span-1">
          <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-widest block">Urgent Action</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-extrabold text-red-650">{stats.high}</span>
            <span className="text-red-600 bg-red-50/80 px-2 py-0.5 rounded-lg text-[9px] font-bold font-mono font-sans">HIGH</span>
          </div>
        </div>
      </div>

      {/* Board Controls Toolbar */}
      <KanbanFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        assigneeFilter={assigneeFilter}
        setAssigneeFilter={setAssigneeFilter}
        members={members}
        isArchived={isArchived}
        setIsCreateOpen={setIsCreateOpen}
      />

      {/* Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
        {columnsDef.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            tasks={filteredTasks.filter((t) => t.status === col.id)}
            user={user}
            isArchived={isArchived}
            setNewTitle={setNewTitle}
            setNewDesc={setNewDesc}
            setIsCreateOpen={setIsCreateOpen}
            launchTaskInspector={launchTaskInspector}
            handleStatusTransition={handleStatusTransition}
          />
        ))}
      </div>

      {/* --- ADD NEW TASK DIALOG --- */}
      <TaskCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        newTitle={newTitle}
        setNewTitle={setNewTitle}
        newDesc={newDesc}
        setNewDesc={setNewDesc}
        newPriority={newPriority}
        setNewPriority={setNewPriority}
        newDueDate={newDueDate}
        setNewDueDate={setNewDueDate}
        newAssigneeIds={newAssigneeIds}
        setNewAssigneeIds={setNewAssigneeIds}
        newTags={newTags}
        setNewTags={setNewTags}
        newSubtaskAssigneeType={newSubtaskAssigneeType}
        setNewSubtaskAssigneeType={setNewSubtaskAssigneeType}
        newSubtaskAssignedTo={newSubtaskAssignedTo}
        setNewSubtaskAssignedTo={setNewSubtaskAssignedTo}
        newSubtaskInput={newSubtaskInput}
        setNewSubtaskInput={setNewSubtaskInput}
        inlineSubtasks={inlineSubtasks}
        setInlineSubtasks={setInlineSubtasks}
        creationFileInputRef={creationFileInputRef}
        handleCreationFileUpload={handleCreationFileUpload}
        uploadingCreationFile={uploadingCreationFile}
        linkUrl={linkUrl}
        setLinkUrl={setLinkUrl}
        linkName={linkName}
        setLinkName={setLinkName}
        newAttachments={newAttachments}
        setNewAttachments={setNewAttachments}
        newAcceptLateSubmit={newAcceptLateSubmit}
        setNewAcceptLateSubmit={setNewAcceptLateSubmit}
        handleCreateTask={handleCreateTask}
        isSubmitting={isSubmitting}
        members={members}
        user={user}
        profile={profile}
      />

      {/* --- DETAILED VIEW/EDIT MODAL INSPECTOR --- */}
      <TaskInspectorModal
        isOpen={!!inspectingTask}
        onClose={() => setInspectingTask(null)}
        task={liveInspectingTask}
        user={user}
        profile={profile}
        members={members}
        isArchived={isArchived}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        editTitle={editTitle}
        setEditTitle={setEditTitle}
        editDesc={editDesc}
        setEditDesc={setEditDesc}
        editPriority={editPriority}
        setEditPriority={setEditPriority}
        editDueDate={editDueDate}
        setEditDueDate={setEditDueDate}
        editAssigneeId={editAssigneeId}
        setEditAssigneeId={setEditAssigneeId}
        editAssigneeIds={editAssigneeIds}
        setEditAssigneeIds={setEditAssigneeIds}
        editSubtasks={editSubtasks}
        setEditSubtasks={setEditSubtasks}
        editTags={editTags}
        setEditTags={setEditTags}
        editAttachments={editAttachments}
        setEditAttachments={setEditAttachments}
        handleUpdateTaskDetails={handleUpdateTaskDetails}
        handleDeleteTask={handleDeleteTask}
        deleteConfirm={deleteConfirm}
        setDeleteConfirm={setDeleteConfirm}
        handleToggleSubtask={handleToggleSubtask}
        handleDeleteSubtask={handleDeleteSubtask}
        subtaskAssigneeType={subtaskAssigneeType}
        setSubtaskAssigneeType={setSubtaskAssigneeType}
        subtaskAssignedTo={subtaskAssignedTo}
        setSubtaskAssignedTo={setSubtaskAssignedTo}
        newSubtaskTitle={newSubtaskTitle}
        setNewSubtaskTitle={setNewSubtaskTitle}
        handleAddSubtask={handleAddSubtask}
        handleToggleTag={handleToggleTag}
        handleToggleSubtaskViewMode={handleToggleSubtaskViewMode}
        setIsReportOpen={setIsReportOpen}
        setIsCommentsOpen={setIsCommentsOpen}
        boardDrive={boardDrive}
        fileInputRef={fileInputRef}
        handleFileUpload={handleFileUpload}
        uploadingFile={uploadingFile}
        customUrl={customUrl}
        setCustomUrl={setCustomUrl}
        customUrlName={customUrlName}
        setCustomUrlName={setCustomUrlName}
        handleAddLinkAttachment={handleAddLinkAttachment}
        handleDeleteAttachment={handleDeleteAttachment}
        isSubmitting={isSubmitting}
        handleStatusTransition={handleStatusTransition}
        handleEditDeleteAttachment={handleEditDeleteAttachment}
        handleEditFileUpload={handleEditFileUpload}
        handleEditAddLinkAttachment={handleEditAddLinkAttachment}
        editAcceptLateSubmit={editAcceptLateSubmit}
        setEditAcceptLateSubmit={setEditAcceptLateSubmit}
        isDeadlineEnforced={isDeadlineEnforced}
      />

      {/* --- TASK STATUS PROGRESS REPORT MODAL --- */}
      <TaskProgressReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        task={liveInspectingTask}
        members={members}
      />

      {/* --- COLLABORATIVE DISCUSSIONS OVERLAY THREAD --- */}
      <TaskCommentsModal
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        task={liveInspectingTask}
        user={user}
        profile={profile}
        isSubmitting={isSubmitting}
        commentText={commentText}
        setCommentText={setCommentText}
        handleAddComment={handleAddComment}
      />
    </div>
  );
}
