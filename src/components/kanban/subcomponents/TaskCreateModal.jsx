import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Paperclip, Link2, Plus } from 'lucide-react';
import { MultiSelectDropdown } from '../../multiSelectDropdown/index.jsx';
import { TaskPriority } from '../../../types.js';
import { Toggle } from '../../ui/Toggle.jsx';

export const TaskCreateModal = ({
  isOpen,
  onClose,
  newTitle,
  setNewTitle,
  newDesc,
  setNewDesc,
  newPriority,
  setNewPriority,
  newDueDate,
  setNewDueDate,
  newAssigneeIds,
  setNewAssigneeIds,
  newTags,
  setNewTags,
  newSubtaskAssigneeType,
  setNewSubtaskAssigneeType,
  newSubtaskAssignedTo,
  setNewSubtaskAssignedTo,
  newSubtaskInput,
  setNewSubtaskInput,
  inlineSubtasks,
  setInlineSubtasks,
  creationFileInputRef,
  handleCreationFileUpload,
  uploadingCreationFile,
  linkUrl,
  setLinkUrl,
  linkName,
  setLinkName,
  newAttachments,
  setNewAttachments,
  newAcceptLateSubmit,
  setNewAcceptLateSubmit,
  handleCreateTask,
  isSubmitting,
  members = [],
  user,
  profile
}) => {
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
            className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10"
          >
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">Assign New Task</h3>
              <button 
                onClick={onClose}
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-800 rounded-lg cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto subtle-scroll">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Task Title</label>
                <input
                  type="text"
                  required
                  maxLength={140}
                  placeholder="e.g. Implement user login middleware, write specs"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Task Description</label>
                <textarea
                  placeholder="Provide a detailed layout or guide for this specific action..."
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Priority Tier</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none cursor-pointer text-slate-700 font-semibold"
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
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none cursor-pointer text-slate-700 font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Assign To Team Members</label>
                <MultiSelectDropdown
                  members={members}
                  selectedIds={newAssigneeIds}
                  onChange={(ids) => setNewAssigneeIds(ids)}
                  placeholder="Search and select team members..."
                />
              </div>

              {/* Initial Tags selection */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-slate-700 block">Task Classification Labels</label>
                <div className="flex flex-wrap gap-1.5">
                  {["Feature", "Bug", "Refactor", "Docs", "Urgent", "Marketing"].map(tag => {
                    const selected = newTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (selected) {
                            setNewTags(newTags.filter(t => t !== tag));
                          } else {
                            setNewTags([...newTags, tag]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${selected ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-600/10' : 'bg-slate-55 hover:bg-slate-100 border-slate-200 text-slate-600'}`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <Toggle
                  checked={newAcceptLateSubmit}
                  onChange={setNewAcceptLateSubmit}
                  label="Accept Late Submissions"
                />
              </div>

              {/* Initial Checklist construction */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-slate-700 block">Pre-Plan Checklist Items</label>
                
                {/* New subtask assignee selection row */}
                <div className="space-y-2 py-1.5">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-slate-500 font-bold">Assign to:</span>
                    <select
                      value={newSubtaskAssigneeType}
                      onChange={(e) => {
                        setNewSubtaskAssigneeType(e.target.value);
                        if (e.target.value !== 'specific') {
                          setNewSubtaskAssignedTo([]);
                        }
                      }}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none text-[11px] text-slate-700 font-semibold cursor-pointer"
                    >
                      <option value="all">Anyone</option>
                      <option value="specific">Specific Person</option>
                      <option value="individual">Each person individually</option>
                    </select>
                  </div>

                  {newSubtaskAssigneeType === 'specific' && (
                    <div className="w-full">
                      <MultiSelectDropdown
                        members={members}
                        selectedIds={newSubtaskAssignedTo}
                        onChange={(uids) => setNewSubtaskAssignedTo(uids)}
                        placeholder="Assign members..."
                      />
                    </div>
                  )}
                </div>

                <div className="flex space-x-1.5">
                  <input
                    type="text"
                    placeholder="e.g. Write integration test scripts"
                    value={newSubtaskInput}
                    onChange={(e) => setNewSubtaskInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newSubtaskInput.trim()) {
                          if (newSubtaskAssigneeType === 'specific' && (!newSubtaskAssignedTo || newSubtaskAssignedTo.length === 0)) {
                            alert('Please select at least one team member for this subtask.');
                            return;
                          }
                          setInlineSubtasks([...inlineSubtasks, {
                            title: newSubtaskInput.trim(),
                            assigneeType: newSubtaskAssigneeType,
                            assignedTo: newSubtaskAssignedTo
                          }]);
                          setNewSubtaskInput('');
                          setNewSubtaskAssigneeType('all');
                          setNewSubtaskAssignedTo([]);
                        }
                      }
                    }}
                    className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newSubtaskInput.trim()) {
                        if (newSubtaskAssigneeType === 'specific' && (!newSubtaskAssignedTo || newSubtaskAssignedTo.length === 0)) {
                          alert('Please select at least one team member for this subtask.');
                          return;
                        }
                        setInlineSubtasks([...inlineSubtasks, {
                          title: newSubtaskInput.trim(),
                          assigneeType: newSubtaskAssigneeType,
                          assignedTo: newSubtaskAssignedTo
                        }]);
                        setNewSubtaskInput('');
                        setNewSubtaskAssigneeType('all');
                        setNewSubtaskAssignedTo([]);
                      }
                    }}
                    className="px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                {inlineSubtasks.length > 0 && (
                  <div className="mt-2 bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-1.5 max-h-[120px] overflow-y-auto subtle-scroll">
                    {inlineSubtasks.map((sub, idx) => {
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

                      return (
                        <div key={idx} className="flex items-center justify-between text-[11px] text-slate-650 bg-white px-2.5 py-1 rounded-lg border border-slate-150 shadow-2xs">
                          <div className="flex items-center min-w-0 pr-2">
                            <span className="truncate font-medium">{sub.title}</span>
                            {assignmentBadge}
                          </div>
                          <button
                            type="button"
                            onClick={() => setInlineSubtasks(inlineSubtasks.filter((_, i) => i !== idx))}
                            className="text-red-500 hover:text-red-750 text-xs font-bold px-1 transition-colors cursor-pointer shrink-0"
                          >
                            &times;
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Creation Stage Attachments & Links */}
              <div className="space-y-1.5 pt-3 border-t border-slate-100 mt-2">
                <label className="text-xs font-bold text-slate-700 block">Task Assets & Links</label>
                
                {/* File Upload Row */}
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    ref={creationFileInputRef}
                    onChange={handleCreationFileUpload}
                    className="hidden"
                    accept=".pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  />
                  <button
                    type="button"
                    disabled={uploadingCreationFile}
                    onClick={() => creationFileInputRef.current?.click()}
                    className="flex-1 py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
                  >
                    <Upload className="h-3.5 w-3.5 text-slate-500" />
                    <span>{uploadingCreationFile ? 'Uploading File...' : 'Upload PDF / Document'}</span>
                  </button>
                </div>

                {/* Add Web Link Row */}
                <div className="flex flex-col space-y-1.5 pt-1">
                  <div className="flex space-x-1.5">
                    <input
                      type="url"
                      placeholder="Paste URL Link..."
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition"
                    />
                    <input
                      type="text"
                      placeholder="Title"
                      value={linkName}
                      onChange={(e) => setLinkName(e.target.value)}
                      className="w-1/4 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!linkUrl.trim()) return;
                        let url = linkUrl.trim();
                        if (!url.startsWith('http://') && !url.startsWith('https://')) {
                          url = 'https://' + url;
                        }
                        const newLink = {
                          id: `link_${Math.random().toString(36).substring(2, 9)}`,
                          name: linkName.trim() || url,
                          url: url,
                          type: 'link',
                          createdAt: new Date().toISOString(),
                          uploadedBy: { uid: user?.uid, displayName: profile?.displayName || user?.displayName || '' },
                          addedAtCreation: true
                        };
                        setNewAttachments([...newAttachments, newLink]);
                        setLinkUrl('');
                        setLinkName('');
                      }}
                      className="px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition cursor-pointer border border-indigo-150"
                    >
                      Add Link
                    </button>
                  </div>
                </div>

                {/* List of currently added attachments in creation modal */}
                {newAttachments.length > 0 && (
                  <div className="mt-2.5 bg-slate-50 border border-slate-100 rounded-xl p-2.5 space-y-1.5 max-h-[120px] overflow-y-auto subtle-scroll">
                    {newAttachments.map((att) => (
                      <div key={att.id} className="flex items-center justify-between text-[11px] text-slate-650 bg-white px-2.5 py-1.5 rounded-lg border border-slate-150 shadow-2xs">
                        <div className="flex items-center space-x-1.5 min-w-0 pr-2">
                          {att.type === 'link' ? (
                            <Link2 className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                          ) : (
                            <Paperclip className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                          )}
                          <span className="truncate font-semibold">{att.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewAttachments(newAttachments.filter(a => a.id !== att.id))}
                          className="text-red-500 hover:text-red-700 text-xs font-bold px-1 transition-colors cursor-pointer shrink-0"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !newTitle.trim()}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-55 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 font-sans cursor-pointer shadow-md shadow-blue-600/10 mt-6"
              >
                <Plus className="h-4 w-4" />
                <span>{isSubmitting ? 'Syncing backend...' : 'Create Task'}</span>
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
