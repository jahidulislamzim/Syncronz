import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Edit, Trash2, AlignLeft, Tag, Check, Calendar, MessageSquare, CheckSquare, Square, Upload, User, BarChart3 } from 'lucide-react';
import { MultiSelectDropdown } from '../../MultiSelectDropdown.jsx';
import { TaskStatus, TaskPriority } from '../../../types.js';
import { SubtaskList } from './SubtaskList.jsx';
import { AttachmentList, AttachmentRow } from './AttachmentList.jsx';
import { isDeadlineOver } from '../utils/helpers.js';

export const TaskInspectorModal = ({
  isOpen,
  onClose,
  task,
  user,
  profile,
  members = [],
  isArchived = false,

  // Edit states
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

  // Action handlers
  handleUpdateTaskDetails,
  handleDeleteTask,
  deleteConfirm,
  setDeleteConfirm,
  handleToggleSubtask,
  handleDeleteSubtask,
  subtaskAssigneeType,
  setSubtaskAssigneeType,
  subtaskAssignedTo,
  setSubtaskAssignedTo,
  newSubtaskTitle,
  setNewSubtaskTitle,
  handleAddSubtask,
  handleToggleTag,
  handleToggleSubtaskViewMode,
  setIsReportOpen,
  setIsCommentsOpen,

  // Attachments handlers
  boardDrive,
  fileInputRef,
  handleFileUpload,
  uploadingFile,
  customUrl,
  setCustomUrl,
  customUrlName,
  setCustomUrlName,
  handleAddLinkAttachment,
  handleDeleteAttachment,
  isSubmitting,
  handleStatusTransition,

  // Edit mode attachments/links actions
  handleEditDeleteAttachment,
  handleEditFileUpload,
  handleEditAddLinkAttachment
}) => {
  if (!task) return null;

  const taskCreator = members.find(m => m.uid === task.creatorId);
  const creatorName = taskCreator?.displayName || task.creatorName || 'Anonymous';
  const creatorPhoto = taskCreator?.photoURL || task.creatorPhoto || '';

  const columnsDef = [
    { id: TaskStatus.TODO, label: 'To Do' },
    { id: TaskStatus.IN_PROGRESS, label: 'In Progress' },
    { id: TaskStatus.REVIEW, label: 'In Review' },
    { id: TaskStatus.DONE, label: 'Completed' }
  ];

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case TaskPriority.HIGH:
        return 'bg-red-50 text-red-700 border-red-100 uppercase tracking-wider text-[9px] font-bold';
      case TaskPriority.MEDIUM:
        return 'bg-amber-50 text-amber-700 border-amber-100 uppercase tracking-wider text-[9px] font-bold';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-100 uppercase tracking-wider text-[9px] font-bold';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900 cursor-pointer"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 max-h-[90vh]"
          >
            <div className="flex-1 flex flex-col overflow-y-auto subtle-scroll">
              {/* Header info */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 flex-shrink-0">
                <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400">
                  ID: {task.taskId?.split('_')[1] || ''}
                </span>
                <div className="flex items-center space-x-2">
                  {!isArchived && (
                    <button
                      onClick={() => {
                        setIsEditing(!isEditing);
                        if (!isEditing) {
                          setEditTitle(task.title);
                          setEditDesc(task.description || '');
                          setEditPriority(task.priority);
                          setEditDueDate(task.dueDate || '');
                          setEditAssigneeId(task.assigneeId || '');
                          setEditSubtasks(task.subtasks ? [...task.subtasks] : []);
                          setEditTags(task.tags ? [...task.tags] : []);
                          setEditAttachments(task.attachments ? [...task.attachments] : []);
                        }
                      }}
                      className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition cursor-pointer"
                      title="Edit task text"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  {!isArchived && (
                    deleteConfirm ? (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleDeleteTask(task)}
                          className="px-2 py-1 text-[11px] font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition cursor-pointer"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(false)}
                          className="px-2 py-1 text-[11px] font-bold text-slate-650 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDeleteTask(task)}
                        className="p-1.5 text-slate-400 hover:text-red-700 rounded-lg hover:bg-red-50 transition cursor-pointer"
                        title="Delete task"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )
                  )}
                  <button 
                    onClick={onClose}
                    className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-800 rounded-lg cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {isEditing ? (
                <form onSubmit={handleUpdateTaskDetails} className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Task Title</label>
                    <input
                      type="text"
                      required
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white outline-none transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Task Description</label>
                    <textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      rows={3}
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white outline-none transition resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Priority Tier</label>
                      <select
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value)}
                        className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700 font-semibold"
                      >
                        <option value={TaskPriority.LOW}>Low Priority</option>
                        <option value={TaskPriority.MEDIUM}>Medium Priority</option>
                        <option value={TaskPriority.HIGH}>High Priority</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Due Date</label>
                      <input
                        type="date"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                        className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Assign To Team Members</label>
                    <MultiSelectDropdown
                      members={members}
                      selectedIds={editAssigneeIds}
                      onChange={(ids) => setEditAssigneeIds(ids)}
                      placeholder="Search and select team members..."
                    />
                  </div>

                  {/* Edit Tags selection */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-bold text-slate-700 block">Task Classification Labels</label>
                    <div className="flex flex-wrap gap-1.5">
                      {["Feature", "Bug", "Refactor", "Docs", "Urgent", "Marketing"].map(tag => {
                        const selected = editTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              if (selected) {
                                setEditTags(editTags.filter(t => t !== tag));
                              } else {
                                setEditTags([...editTags, tag]);
                              }
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${selected ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-600/10' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-650'}`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* --- PROGRESS CHECKLIST EDITOR (Subtasks) --- */}
                  <div className="pt-4.5 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">
                        <CheckSquare className="h-4 w-4 inline mr-1 text-emerald-500" /> Interactive Checklist
                      </label>
                      {editSubtasks && editSubtasks.length > 0 && (
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md font-mono">
                          {editSubtasks.filter(s => s.completed).length} of {editSubtasks.length} done
                        </span>
                      )}
                    </div>

                    {/* Progress gauge */}
                    {editSubtasks && editSubtasks.length > 0 && (
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/40">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-350"
                          style={{ width: `${(editSubtasks.filter(s => s.completed).length / editSubtasks.length) * 100}%` }}
                        />
                      </div>
                    )}

                    {/* List subtasks items */}
                    {editSubtasks && editSubtasks.length > 0 && (
                      <div className="space-y-1.5 max-h-[160px] overflow-y-auto subtle-scroll py-1">
                        {editSubtasks.map(sub => {
                          let assignmentBadge = null;
                          if (sub.assigneeType === 'specific') {
                            const assignedUids = Array.isArray(sub.assignedTo) ? sub.assignedTo : [sub.assignedTo].filter(Boolean);
                            const names = assignedUids.map(uid => {
                              const m = members.find(member => member.uid === uid);
                              return m ? (m.displayName || m.email.split('@')[0]) : '';
                            }).filter(Boolean);
                            
                            assignmentBadge = (
                              <span 
                                className="text-[9px] px-1.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold ml-2 shrink-0 truncate max-w-[120px]"
                                title={names.join(', ')}
                              >
                                @{names.length > 1 ? `${names.length} members` : (names[0] || 'specific user')}
                              </span>
                            );
                          } else if (sub.assigneeType === 'individual') {
                            assignmentBadge = (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-50 border border-amber-100 text-amber-600 font-bold ml-2 shrink-0">
                                indiv
                              </span>
                            );
                          }
                          
                          const isCompleted = sub.assigneeType === 'individual' 
                            ? sub.completedBy?.includes(user?.uid) 
                            : sub.completed;

                          return (
                            <div key={sub.id} className="flex items-center justify-between group/sub px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-55 transition-colors">
                              <button
                                type="button"
                                onClick={() => handleToggleSubtask(sub.id)}
                                className="flex items-center space-x-2.5 text-left flex-1 min-w-0 cursor-pointer"
                              >
                                {isCompleted ? (
                                  <CheckSquare className="h-4 w-4 text-emerald-500 shrink-0" />
                                ) : (
                                  <Square className="h-4 w-4 text-slate-355 hover:text-slate-555 shrink-0" />
                                )}
                                <span className={`text-xs font-semibold truncate ${isCompleted ? 'line-through text-slate-400' : 'text-slate-700'}`}>{sub.title}</span>
                                {assignmentBadge}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSubtask(sub.id)}
                                className="opacity-0 group-hover/sub:opacity-100 p-1 text-slate-400 hover:text-red-500 rounded-md transition cursor-pointer shrink-0 ml-1"
                                title="Remove subtask"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add subtask item options row */}
                    <div className="space-y-2 py-2 border-t border-slate-100/50">
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="text-slate-500 font-bold">Assign to:</span>
                        <select
                          value={subtaskAssigneeType}
                          onChange={(e) => {
                            setSubtaskAssigneeType(e.target.value);
                            if (e.target.value !== 'specific') {
                              setSubtaskAssignedTo([]);
                            }
                          }}
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none text-[11px] text-slate-700 font-semibold cursor-pointer"
                        >
                          <option value="all">Anyone</option>
                          <option value="specific">Specific Person</option>
                          <option value="individual">Each person individually</option>
                        </select>
                      </div>

                      {subtaskAssigneeType === 'specific' && (
                        <div className="w-full">
                          <MultiSelectDropdown
                            members={members}
                            selectedIds={subtaskAssignedTo}
                            onChange={(uids) => setSubtaskAssignedTo(uids)}
                            placeholder="Assign members..."
                          />
                        </div>
                      )}
                    </div>

                    {/* Add subtask item inline input */}
                    <div className="flex space-x-1.5">
                      <input
                        type="text"
                        placeholder="Add item to checklist..."
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newSubtaskTitle.trim()) {
                              if (subtaskAssigneeType === 'specific' && (!subtaskAssignedTo || subtaskAssignedTo.length === 0)) {
                                alert('Please select at least one team member for this subtask.');
                                return;
                              }
                              handleAddSubtask(newSubtaskTitle.trim(), subtaskAssigneeType, subtaskAssignedTo);
                              setNewSubtaskTitle('');
                              setSubtaskAssigneeType('all');
                              setSubtaskAssignedTo([]);
                            }
                          }
                        }}
                        className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-none transition"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newSubtaskTitle.trim()) {
                            if (subtaskAssigneeType === 'specific' && (!subtaskAssignedTo || subtaskAssignedTo.length === 0)) {
                                alert('Please select at least one team member for this subtask.');
                                return;
                            }
                            handleAddSubtask(newSubtaskTitle.trim(), subtaskAssigneeType, subtaskAssignedTo);
                            setNewSubtaskTitle('');
                            setSubtaskAssigneeType('all');
                            setSubtaskAssignedTo([]);
                          }
                        }}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-sm"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Existing attachments display in editing mode */}
                  {editAttachments.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 mt-2">
                      <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block mb-2.5">
                        <Paperclip className="h-3.5 w-3.5 inline mr-1 text-blue-500" /> Existing Attachments
                      </label>
                      <div className="space-y-3">
                        {(() => {
                          const isTaskCreator = user?.uid === task.creatorId;
                          const creationAtts = editAttachments.filter(a => a.addedAtCreation);
                          const updateAtts = editAttachments.filter(a => !a.addedAtCreation);

                          if (isTaskCreator) {
                            return (
                              creationAtts.length > 0 ? (
                                <div>
                                  <p className="text-[8.5px] font-bold text-amber-600 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    From Task Setup
                                  </p>
                                  <div className="space-y-1.5">
                                    {creationAtts.map((att, idx) => (
                                      <AttachmentRow
                                        key={att.id || `edit-creation-${idx}`}
                                        att={att}
                                        task={task}
                                        isProtected={false}
                                        onDelete={() => handleEditDeleteAttachment(att.id)}
                                      />
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-[10px] text-slate-400 italic">No setup attachments.</p>
                              )
                            );
                          } else {
                            return (
                              updateAtts.length > 0 ? (
                                <div>
                                  <p className="text-[8.5px] font-bold text-blue-600 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    Added When Doing Task
                                  </p>
                                  <div className="space-y-1.5">
                                    {updateAtts.map((att, idx) => (
                                      <AttachmentRow
                                        key={att.id || `edit-update-${idx}`}
                                        att={att}
                                        task={task}
                                        onDelete={() => handleEditDeleteAttachment(att.id)}
                                      />
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-[10px] text-slate-400 italic">No task-doing attachments.</p>
                              )
                            );
                          }
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Attachments & Links add section in editing mode */}
                  <div className="space-y-1.5 pt-3 border-t border-slate-100 mt-2">
                    <label className="text-xs font-bold text-slate-700 block">Add New Attachments</label>
                    <div className="flex items-center space-x-2">
                      {boardDrive?.enabled && (
                        <>
                          <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleEditFileUpload}
                            className="hidden"
                            accept=".pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          />
                          <button
                            type="button"
                            disabled={uploadingFile}
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
                          >
                            <Upload className="h-3.5 w-3.5 text-slate-500" />
                            <span>{uploadingFile ? 'Uploading File...' : 'Upload PDF / Document'}</span>
                          </button>
                        </>
                      )}
                      {!boardDrive?.enabled && (
                        <div className="flex-1 text-[10px] text-slate-400 italic font-medium text-center py-2">
                          Google Drive is not enabled. Ask an admin to configure it in Settings.
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-1.5">
                      <input
                        type="url"
                        placeholder="Paste URL Link..."
                        value={customUrl}
                        onChange={(e) => setCustomUrl(e.target.value)}
                        className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition"
                      />
                      <input
                        type="text"
                        placeholder="Title"
                        value={customUrlName}
                        onChange={(e) => setCustomUrlName(e.target.value)}
                        className="w-1/4 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition"
                      />
                      <button
                        type="button"
                        disabled={isSubmitting || !customUrl.trim()}
                        onClick={() => {
                          handleEditAddLinkAttachment(customUrlName, customUrl);
                          setCustomUrl('');
                          setCustomUrlName('');
                        }}
                        className="px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition cursor-pointer border border-indigo-150 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Add Link
                      </button>
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? 'Saving...' : 'Save layout'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-6 space-y-6 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Priority + Column identifiers */}
                    <div className="flex items-center justify-between flex-wrap gap-2 text-[10px] flex-shrink-0">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2.5 py-0.5 rounded-md border text-[9px] uppercase font-bold font-mono tracking-wider ${getPriorityStyle(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className="text-[10px] text-slate-450 font-mono tracking-wider font-bold">
                          Col: {task.status?.replace('_', ' ').toUpperCase() || ''}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-slate-500 font-mono text-[9px]">
                        <span>Created by</span>
                        <div className="flex items-center space-x-1 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">
                          <img
                            src={creatorPhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(creatorName)}`}
                            alt=""
                            className="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                          />
                          <span className="font-bold text-slate-700 truncate max-w-[80px]">{creatorName}</span>
                        </div>
                        {task.createdAt && (
                          <span className="text-slate-450 font-semibold">
                            on {new Date(task.createdAt.seconds ? task.createdAt.seconds * 1000 : task.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Main details text */}
                    <h3 className="text-sm font-bold text-slate-900 leading-snug mt-3">{task.title}</h3>
                    
                    {task.description && (
                      <div className="text-xs text-slate-655 bg-slate-50 border border-slate-200/60 rounded-xl p-3 leading-relaxed mt-2.5 whitespace-pre-line flex items-start space-x-2">
                        <AlignLeft className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                        <span>{task.description}</span>
                      </div>
                    )}

                    {/* --- CLASSIFICATION LABELS / TAGS INTEGRATION --- */}
                    <div className="pt-4.5 mt-5 border-t border-slate-100">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2.5">
                        <Tag className="h-3 w-3 inline mr-1 text-slate-450 animate-pulse" /> Classification Tags
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {["Feature", "Bug", "Refactor", "Docs", "Urgent", "Marketing"].map(tag => {
                          const selected = task.tags?.includes(tag) || false;
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => handleToggleTag(task, tag)}
                              className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border transition-all cursor-pointer ${selected ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-600/10' : 'bg-slate-50 hover:bg-slate-150 border-slate-200 text-slate-600'}`}
                            >
                              {selected && <Check className="h-2.5 w-2.5 inline mr-0.5 stroke-[3px]" />}
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* --- PROGRESS CHECKLIST (Subtasks) --- */}
                    <SubtaskList
                      task={task}
                      user={user}
                      members={members}
                      isArchived={isArchived}
                      handleToggleSubtaskViewMode={handleToggleSubtaskViewMode}
                      setIsReportOpen={setIsReportOpen}
                    />

                    {/* --- ATTACHMENTS HUB (External URLs) --- */}
                    <AttachmentList
                      task={task}
                      user={user}
                      boardDrive={boardDrive}
                      uploadingFile={uploadingFile}
                      fileInputRef={fileInputRef}
                      handleFileUpload={handleFileUpload}
                      customUrl={customUrl}
                      setCustomUrl={setCustomUrl}
                      customUrlName={customUrlName}
                      setCustomUrlName={setCustomUrlName}
                      handleAddLinkAttachment={handleAddLinkAttachment}
                      handleDeleteAttachment={handleDeleteAttachment}
                      isSubmitting={isSubmitting}
                      isArchived={isArchived}
                    />

                    {/* Controls to transit task status */}
                    <div className="pt-4.5 mt-5 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-2.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                          Move Board State
                        </label>
                        {isArchived ? (
                          <span className="text-[9px] font-bold text-amber-600 font-mono uppercase bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                            Board Archived
                          </span>
                        ) : user?.uid !== task.creatorId ? (
                          <span className="text-[9px] font-bold text-rose-505 font-mono uppercase bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                            Creator Only
                          </span>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {columnsDef.map(col => {
                          const isSelected = task.status === col.id;
                          const isCreator = user?.uid === task.creatorId;
                          return (
                            <button
                              key={col.id}
                              type="button"
                              disabled={isArchived || (!isCreator && !isSelected)}
                              onClick={() => handleStatusTransition(task, col.id)}
                              className={`py-1.5 px-3 rounded-lg border text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer shadow-sm ${
                                isSelected 
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-blue-600/10' 
                                  : isArchived || !isCreator 
                                    ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed opacity-60' 
                                    : 'bg-white hover:bg-slate-55 border-slate-200 text-slate-705'
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3 stroke-[3px]" />}
                              <span>{col.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Assignee / Meta cards block */}
                    <div className="grid grid-cols-2 gap-4 pt-5 mt-5 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Assignees</span>
                        {task.assignees && task.assignees.length > 0 ? (
                          <div className="flex flex-col space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                            {task.assignees.map((assignee) => (
                              <div key={assignee.uid} className="flex items-center space-x-2 bg-slate-50 border border-slate-200/50 rounded-xl p-2">
                                <img
                                  src={assignee.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(assignee.displayName)}`}
                                  alt={assignee.displayName}
                                  referrerPolicy="no-referrer"
                                  className="h-6 w-6 rounded-lg object-cover"
                                />
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-800 leading-tight truncate">{assignee.displayName}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : task.assigneeName ? (
                          <div className="flex items-center space-x-2.5 font-sans bg-slate-50 border border-slate-200/50 rounded-xl p-2.5">
                            <img
                              src={task.assigneePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(task.assigneeName)}`}
                              alt={task.assigneeName}
                              referrerPolicy="no-referrer"
                              className="h-7 w-7 rounded-lg object-cover"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 leading-tight truncate">{task.assigneeName}</p>
                              <p className="text-[10px] text-slate-400 font-mono">Assigned</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-450 italic font-mono flex items-center space-x-1 pt-1">
                            <User className="h-4 w-4 shrink-0" />
                            <span>Not Assigned</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Completion Date</span>
                        <div className="flex items-center space-x-2 font-sans bg-slate-50 border border-slate-200/50 rounded-xl p-2.5 font-mono">
                          {task.status === TaskStatus.DONE ? (
                            <>
                              <Calendar className="h-6 w-6 text-emerald-500 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded-md">
                                  Completed
                                </p>
                                <p className="text-[10px] text-slate-400">Task Closed</p>
                              </div>
                            </>
                          ) : isDeadlineOver(task.dueDate, task.status) ? (
                            <>
                              <Calendar className="h-6 w-6 text-rose-500 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-150 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                  Deadline Over ({task.dueDate})
                                </p>
                                <p className="text-[10px] text-rose-450 font-semibold">Overdue Task</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <Calendar className="h-6 w-6 text-slate-450 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800">{task.dueDate || 'Un-restricted'}</p>
                                <p className="text-[10px] text-slate-400">Limit Target</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* --- INNER COLLABORATIVE COMMENTS THREAD --- */}
                  <div className="border-t border-slate-100 pt-5 mt-5 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-widest flex items-center space-x-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                        <span>Collaborative Discussion</span>
                      </h4>
                      <span className="text-[10px] font-bold text-slate-555 bg-slate-100 border border-slate-200/50 px-2 py-0.5 rounded-md font-mono">
                        {(task.comments || []).length} comment{(task.comments || []).length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => setIsCommentsOpen(true)}
                      className="mt-3.5 w-full py-2.5 px-4 bg-slate-50 border border-slate-200 hover:bg-slate-100/80 hover:border-slate-300 text-slate-705 hover:text-slate-900 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer shadow-2xs"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Open Task Discussion Thread</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
