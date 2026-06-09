'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { db, auth } from '../../../lib/firebase/client.js';
import { collection, query, onSnapshot, doc } from 'firebase/firestore';
import { TaskStatus, TaskPriority, ActivityType } from '../../../types.js';
import { 
  createTask, 
  updateTaskStatus, 
  updateTaskDetails, 
  deleteTask, 
  addActivityLog 
} from '../../../lib/firebase/firestore.js';
import { isDeadlineOver } from '../utils/helpers.js';

export const useKanbanBoard = (boardId, isArchived = false) => {
  const { user, profile } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [boardDrive, setBoardDrive] = useState(null);

  // Modals / Selection states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [inspectingTask, setInspectingTask] = useState(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  // New task form states
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState(TaskPriority.MEDIUM);
  const [newDueDate, setNewDueDate] = useState('');
  const [newAssigneeId, setNewAssigneeId] = useState('');
  const [newAssigneeIds, setNewAssigneeIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [toast, setToast] = useState(null);

  // Editing states within viewer inspector
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriority, setEditPriority] = useState(TaskPriority.MEDIUM);
  const [editDueDate, setEditDueDate] = useState('');
  const [editAssigneeId, setEditAssigneeId] = useState('');
  const [editAssigneeIds, setEditAssigneeIds] = useState([]);
  const [editSubtasks, setEditSubtasks] = useState([]);
  const [editTags, setEditTags] = useState([]);
  const [editAttachments, setEditAttachments] = useState([]);

  // Task inline thread states
  const [commentText, setCommentText] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customUrlName, setCustomUrlName] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [subtaskAssigneeType, setSubtaskAssigneeType] = useState('all');
  const [subtaskAssignedTo, setSubtaskAssignedTo] = useState([]);
  const [subtaskDropdownOpen, setSubtaskDropdownOpen] = useState(false);

  // New task form tagging/checklist extras
  const [newTags, setNewTags] = useState([]);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');
  const [newSubtaskAssigneeType, setNewSubtaskAssigneeType] = useState('all');
  const [newSubtaskAssignedTo, setNewSubtaskAssignedTo] = useState([]);
  const [newSubtaskDropdownOpen, setNewSubtaskDropdownOpen] = useState(false);
  const [inlineSubtasks, setInlineSubtasks] = useState([]);

  // File upload states
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingCreationFile, setUploadingCreationFile] = useState(false);
  const fileInputRef = useRef(null);
  const creationFileInputRef = useRef(null);

  // Task creation stage attachments & links
  const [newAttachments, setNewAttachments] = useState([]);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');

  // Search & Filters state values
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Listen to tasks under boards/{boardId}/tasks
  useEffect(() => {
    if (!boardId) return;
    const tasksRef = collection(db, 'boards', boardId, 'tasks');
    const q = query(tasksRef);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push(doc.data());
      });
      setTasks(list);
    }, (error) => {
      console.error("Tasks listener error: ", error);
    });

    return () => unsubscribe();
  }, [boardId]);

  // 2. Listen to members under boards/{boardId}/members for assignee lookup
  useEffect(() => {
    if (!boardId) return;
    const membersRef = collection(db, 'boards', boardId, 'members');
    const q = query(membersRef);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push(doc.data());
      });
      setMembers(list);
    }, (error) => {
      console.error("Members snapshot inside Kanban error: ", error);
    });

    return () => unsubscribe();
  }, [boardId]);

  // 2b. Listen to board document for Drive config
  useEffect(() => {
    if (!boardId) return;
    const unsub = onSnapshot(doc(db, 'boards', boardId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setBoardDrive({
          enabled: !!data.driveConnectionId,
          folderUrl: data.driveFolderUrl || null,
        });
      }
    });
    return () => unsub();
  }, [boardId]);

  // Clean inspect focus when board changes
  useEffect(() => {
    setInspectingTask(null);
    setIsCreateOpen(false);
  }, [boardId]);

  // Reset delete confirm when inspector closes
  useEffect(() => {
    if (!inspectingTask) setDeleteConfirm(false);
  }, [inspectingTask]);

  // Synchronized live task object from current task list to prevent stale data
  const liveInspectingTask = inspectingTask ? tasks.find(t => t.taskId === inspectingTask.taskId) || inspectingTask : null;

  // Auto-transition overdue tasks to In Review
  useEffect(() => {
    if (!user || !tasks || tasks.length === 0 || isArchived) return;

    const overdueTasks = tasks.filter(task => 
      isDeadlineOver(task.dueDate, task.status) && 
      task.status !== TaskStatus.REVIEW
    );

    if (overdueTasks.length === 0) return;

    const systemActor = {
      uid: user.uid,
      displayName: 'System (Auto-Deadline)',
      photoURL: profile?.photoURL || user.photoURL || ''
    };

    overdueTasks.forEach(async (task) => {
      try {
        await updateTaskStatus(boardId, task.taskId, TaskStatus.REVIEW, systemActor);
      } catch (err) {
        console.error(`Failed to auto-transition task ${task.taskId} to review:`, err);
      }
    });
  }, [tasks, user, boardId, profile, isArchived]);

  const handleCreateTask = async (e) => {
    if (e) e.preventDefault();
    if (isArchived) {
      showToast('This board is archived and cannot be modified.', 'error');
      return;
    }
    if (!user || !newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const assigneeObjs = members.filter(m => newAssigneeIds.includes(m.uid));
      const creatorObj = {
        uid: user.uid,
        displayName: profile?.displayName || user.displayName || 'Anonymous',
        photoURL: profile?.photoURL || user.photoURL || ''
      };

      const generatedTaskId = await createTask(
        boardId,
        newTitle.trim(),
        newDesc.trim(),
        newPriority,
        newDueDate,
        assigneeObjs,
        creatorObj
      );

      const parsedSubtasks = inlineSubtasks.map(sub => ({
        id: `sub_${Math.random().toString(36).substring(2, 9)}`,
        title: typeof sub === 'string' ? sub : sub.title,
        assigneeType: sub.assigneeType || 'all',
        assignedTo: sub.assignedTo || null,
        completed: false,
        completedBy: []
      }));

      if (generatedTaskId) {
        await updateTaskDetails(boardId, generatedTaskId, {
          tags: newTags,
          subtasks: parsedSubtasks,
          attachments: newAttachments
        }, creatorObj);
      }

      // Dispatch email notifications to all assignees
      try {
        const token = await auth.currentUser?.getIdToken();
        if (token) {
          const emailRecipients = assigneeObjs
            .filter(a => a.uid !== user.uid && a.email)
            .map(a => ({ email: a.email, name: a.displayName || '' }));
          if (emailRecipients.length > 0) {
            fetch('/api/send-email', {
              method: 'POST',
              keepalive: true,
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                type: 'task_assigned',
                recipients: emailRecipients,
                actorName: creatorObj.displayName,
                boardId,
                boardName: document.title || 'Project Board',
                taskTitle: newTitle.trim(),
                dueDate: newDueDate,
                priority: newPriority,
                subtasks: parsedSubtasks
              })
            }).catch(err => console.error('Failed to send task assignment emails:', err));
          }
        }
      } catch (emailErr) {
        console.error('Failed to dispatch task assignment email notifications:', emailErr);
      }

      // Clean
      setNewTitle('');
      setNewDesc('');
      setNewPriority(TaskPriority.MEDIUM);
      setNewDueDate('');
      setNewAssigneeId('');
      setNewAssigneeIds([]);
      setNewTags([]);
      setInlineSubtasks([]);
      setNewSubtaskInput('');
      setNewSubtaskAssigneeType('all');
      setNewSubtaskAssignedTo([]);
      setNewAttachments([]);
      setLinkUrl('');
      setLinkName('');
      setIsCreateOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTaskDetails = async (e) => {
    if (e) e.preventDefault();
    if (isArchived) {
      showToast('This board is archived and cannot be modified.', 'error');
      return;
    }
    if (!user || !inspectingTask || !editTitle.trim()) return;

    // Block saving updates if task's deadline is over (only creator can do)
    if (isDeadlineOver(inspectingTask.dueDate, inspectingTask.status) && user.uid !== inspectingTask.creatorId) {
      showToast('The deadline for this task has passed. Only the task creator can update its details.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const assigneeObjs = members.filter(m => editAssigneeIds.includes(m.uid));
      const actor = {
        uid: user.uid,
        displayName: profile?.displayName || user.displayName || 'Anonymous',
        photoURL: profile?.photoURL || user.photoURL || ''
      };

      // Merge attachments based on who is editing to preserve the other stage's attachments
      const isTaskCreator = user?.uid === inspectingTask.creatorId;
      const originalAttachments = inspectingTask.attachments || [];
      let finalAttachments = [];
      if (isTaskCreator) {
        const originalExecutionAtts = originalAttachments.filter(a => !a.addedAtCreation);
        const editedSetupAtts = editAttachments.filter(a => a.addedAtCreation);
        finalAttachments = [...editedSetupAtts, ...originalExecutionAtts];
      } else {
        const originalSetupAtts = originalAttachments.filter(a => a.addedAtCreation);
        const editedExecutionAtts = editAttachments.filter(a => !a.addedAtCreation);
        finalAttachments = [...originalSetupAtts, ...editedExecutionAtts];
      }

      const fields = {
        title: editTitle.trim(),
        description: editDesc.trim(),
        priority: editPriority,
        dueDate: editDueDate,
        assignees: assigneeObjs,
        subtasks: editSubtasks,
        tags: editTags,
        attachments: finalAttachments
      };

      await updateTaskDetails(boardId, inspectingTask.taskId, fields, actor);
      
      // Email notifications for assignees
      try {
        const token = await auth.currentUser?.getIdToken();
        if (token) {
          const currentTask = liveInspectingTask || inspectingTask;
          const oldUids = new Set(
            (currentTask.assignees || (currentTask.assigneeId ? [{ uid: currentTask.assigneeId }] : []))
              .map(a => a?.uid)
              .filter(Boolean)
          );
          const newRecipients = [];
          const updateRecipients = [];
          
          assigneeObjs.forEach((assignee) => {
            if (assignee.uid !== user.uid && assignee.email) {
              const isNewAssignment = !oldUids.has(assignee.uid);
              if (isNewAssignment) {
                newRecipients.push({ email: assignee.email, name: assignee.displayName || '' });
              } else {
                updateRecipients.push({ email: assignee.email, name: assignee.displayName || '' });
              }
            }
          });

          const sendBatch = (recipients, type, details) => {
            if (recipients.length === 0) return;
            fetch('/api/send-email', {
              method: 'POST',
              keepalive: true,
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                type,
                recipients,
                actorName: actor.displayName,
                boardId,
                boardName: document.title || 'Project Board',
                taskTitle: editTitle.trim(),
                taskId: currentTask.taskId,
                dueDate: editDueDate,
                priority: editPriority,
                details,
                subtasks: editSubtasks
              })
            }).then(async (res) => {
              if (!res.ok) {
                const text = await res.text();
                console.error(`[API Send Email ${type} Failed]`, text);
              }
            }).catch(err => console.error('Failed to send task update emails:', err));
          };

          sendBatch(newRecipients, 'task_assigned', 'You have been assigned this task.');
          sendBatch(updateRecipients, 'task_updated', 'Task details were modified.');
        }
      } catch (emailErr) {
        console.error('Failed to dispatch update/assignment email notifications:', emailErr);
      }

      // Update local inspection view
      setInspectingTask({
        ...inspectingTask,
        ...fields
      });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (task) => {
    if (isArchived) {
      showToast('This board is archived and cannot be modified.', 'error');
      return;
    }
    if (!user) return;
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    setDeleteConfirm(false);
    setInspectingTask(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Authentication failed');

      const res = await fetch(`/api/boards/tasks?boardId=${boardId}&taskId=${task.taskId}`, {
        method: 'DELETE',
        keepalive: true,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errData = await res.json();
        showToast(errData.error || 'Failed to delete task', 'error');
      }
    } catch (e) {
      showToast('Failed to delete task', 'error');
    }
  };

  const handleStatusTransition = async (task, targetStatus) => {
    if (isArchived) {
      showToast('This board is archived and cannot be modified.', 'error');
      return;
    }
    if (!user) return;

    // Only the task creator can transition status
    if (user.uid !== task.creatorId) {
      showToast('Only the task creator can transition the status of this task.', 'error');
      return;
    }

    // Block transition if task's deadline is over (only creator can do)
    if (isDeadlineOver(task.dueDate, task.status) && user.uid !== task.creatorId) {
      showToast('The deadline for this task has passed. Only the task creator can update its status.', 'error');
      return;
    }

    try {
      const actor = {
        uid: user.uid,
        displayName: profile?.displayName || user.displayName || 'Anonymous',
        photoURL: profile?.photoURL || user.photoURL || ''
      };
      await updateTaskStatus(boardId, task.taskId, targetStatus, actor);

      // Email notifications for assignees on status change
      try {
        const assigneesList = task.assignees || (task.assigneeId ? [{ uid: task.assigneeId, displayName: task.assigneeName }] : []);
        const token = await auth.currentUser?.getIdToken();
        if (token && assigneesList.length > 0) {
          const statusLabels = {
            'todo': 'To Do',
            'in_progress': 'In Progress',
            'review': 'In Review',
            'done': 'Completed'
          };
          const statusLabel = statusLabels[targetStatus] || targetStatus;

          const emailRecipients = [];
          assigneesList.forEach((assignee) => {
            const memberInfo = members.find(m => m.uid === assignee.uid);
            if (memberInfo && memberInfo.uid !== user.uid && memberInfo.email) {
              emailRecipients.push({ email: memberInfo.email, name: memberInfo.displayName || '' });
            }
          });

          if (emailRecipients.length > 0) {
            fetch('/api/send-email', {
              method: 'POST',
              keepalive: true,
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                type: 'task_updated',
                recipients: emailRecipients,
                actorName: actor.displayName,
                boardId,
                boardName: document.title || 'Project Board',
                taskTitle: task.title,
                taskId: task.taskId,
                priority: task.priority || '',
                details: `Status was changed to "${statusLabel}"`,
                subtasks: task.subtasks || []
              })
            }).catch(err => console.error('Failed to send status update emails:', err));
          }
        }
      } catch (emailErr) {
        console.error('Failed to dispatch status update email notifications:', emailErr);
      }
      
      // Sync focus view too if active
      if (inspectingTask?.taskId === task.taskId) {
        setInspectingTask({
          ...inspectingTask,
          status: targetStatus
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddComment = async (e) => {
    if (e) e.preventDefault();
    if (!user || !liveInspectingTask || !commentText.trim()) return;

    setIsSubmitting(true);
    try {
      const userName = profile?.displayName || user.displayName || 'Anonymous';
      const userPhoto = profile?.photoURL || user.photoURL || '';
      const actor = {
        uid: user.uid,
        displayName: userName,
        photoURL: userPhoto
      };
      
      const newCommentObj = {
        id: `c_${Math.random().toString(36).substring(2, 9)}`,
        text: commentText.trim(),
        userId: user.uid,
        userName: userName,
        userPhoto: userPhoto,
        createdAt: new Date().toISOString()
      };

      const currentComments = liveInspectingTask.comments || [];

      await updateTaskDetails(boardId, liveInspectingTask.taskId, {
        comments: [...currentComments, newCommentObj]
      }, actor);

      await addActivityLog(
        boardId,
        ActivityType.COMMENT_ADDED,
        user.uid,
        userName,
        userPhoto,
        `commented on layout "${liveInspectingTask.title}": "${commentText.trim()}"`
      );

      setCommentText('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleSubtask = (subtaskId) => {
    setEditSubtasks(prev => prev.map(s => {
      if (s.id !== subtaskId) return s;
      if (s.assigneeType === 'individual') {
        const completedBy = s.completedBy || [];
        const updatedCompletedBy = completedBy.includes(user.uid)
          ? completedBy.filter(uid => uid !== user.uid)
          : [...completedBy, user.uid];
        return { ...s, completedBy: updatedCompletedBy };
      }
      return { ...s, completed: !s.completed };
    }));
  };

  const handleAddSubtask = (titleText, assigneeType = 'all', assignedTo = []) => {
    if (!titleText.trim()) return;
    const newSub = {
      id: `sub_${Math.random().toString(36).substring(2, 9)}`,
      title: titleText.trim(),
      assigneeType,
      assignedTo: assigneeType === 'specific' ? (Array.isArray(assignedTo) ? assignedTo : [assignedTo].filter(Boolean)) : [],
      completed: false,
      completedBy: []
    };
    setEditSubtasks(prev => [...prev, newSub]);
  };

  const handleDeleteSubtask = (subtaskId) => {
    setEditSubtasks(prev => prev.filter(s => s.id !== subtaskId));
  };

  const handleToggleSubtaskViewMode = async (task, subtaskId) => {
    if (isArchived) {
      showToast('This board is archived and cannot be modified.', 'error');
      return;
    }
    if (!user) return;

    if (task.status !== TaskStatus.IN_PROGRESS) {
      showToast('Checklist items can only be updated when the task is In Progress.', 'error');
      return;
    }

    if (isDeadlineOver(task.dueDate, task.status) && user.uid !== task.creatorId) {
      showToast('The deadline for this task has passed. Only the task creator can update checklist items.', 'error');
      return;
    }

    const sub = task.subtasks?.find(s => s.id === subtaskId);
    if (!sub) return;

    if (sub.assigneeType === 'specific') {
      const assignedUids = Array.isArray(sub.assignedTo) ? sub.assignedTo : [sub.assignedTo].filter(Boolean);
      if (!assignedUids.includes(user.uid)) {
        alert("Only the designated team members can check/uncheck this checklist item.");
        return;
      }
    }
    if (sub.assigneeType === 'all' || !sub.assigneeType) {
      const isAssignee = task.assignees?.some(a => a.uid === user.uid) || task.assigneeId === user.uid;
      if (!isAssignee) {
        alert("Only assigned team members can check/uncheck checklist items on this task.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const subtasks = task.subtasks ? [...task.subtasks] : [];
      const updatedSubtasks = subtasks.map(s => {
        if (s.id !== subtaskId) return s;
        if (s.assigneeType === 'individual') {
          const completedBy = s.completedBy || [];
          const updatedCompletedBy = completedBy.includes(user.uid)
            ? completedBy.filter(uid => uid !== user.uid)
            : [...completedBy, user.uid];
          return { ...s, completedBy: updatedCompletedBy };
        }
        return { ...s, completed: !s.completed };
      });
      
      const actor = {
        uid: user.uid,
        displayName: profile?.displayName || user.displayName || 'Anonymous',
        photoURL: profile?.photoURL || user.photoURL || ''
      };
      await updateTaskDetails(boardId, task.taskId, { subtasks: updatedSubtasks }, actor);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleTag = async (task, tag) => {
    if (isArchived) {
      showToast('This board is archived and cannot be modified.', 'error');
      return;
    }
    if (!user) return;
    if (task.status !== TaskStatus.IN_PROGRESS) {
      showToast('Tags can only be modified when the task is In Progress.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const tags = task.tags ? [...task.tags] : [];
      const updatedTags = tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag];

      const actor = {
        uid: user.uid,
        displayName: profile?.displayName || user.displayName || 'Anonymous',
        photoURL: profile?.photoURL || user.photoURL || ''
      };
      await updateTaskDetails(boardId, task.taskId, { tags: updatedTags }, actor);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddLinkAttachment = async (task, name, url) => {
    if (isArchived) {
      showToast('This board is archived and cannot be modified.', 'error');
      return;
    }
    if (!user || !url.trim()) return;
    if (task.status !== TaskStatus.IN_PROGRESS) {
      showToast('Links can only be attached when the task is In Progress.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const attachments = task.attachments ? [...task.attachments] : [];
      const safeName = name.trim() || 'Link URL';
      const newAttachment = {
        id: `link_${Math.random().toString(36).substring(2, 9)}`,
        name: safeName,
        url: url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`,
        uploadedAt: new Date().toISOString(),
        uploadedBy: { uid: user.uid, displayName: profile?.displayName || user.displayName || '' }
      };
      const updatedAttachments = [...attachments, newAttachment];

      const actor = {
        uid: user.uid,
        displayName: profile?.displayName || user.displayName || 'Anonymous',
        photoURL: profile?.photoURL || user.photoURL || ''
      };
      await updateTaskDetails(boardId, task.taskId, { attachments: updatedAttachments }, actor);
      
      await addActivityLog(
        boardId,
        ActivityType.TASK_UPDATED,
        user.uid,
        actor.displayName,
        actor.photoURL,
        `attached link "${safeName}" to task "${task.title}"`
      );
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAttachment = async (task, attachmentId) => {
    if (isArchived) {
      showToast('This board is archived and cannot be modified.', 'error');
      return;
    }
    if (!user) return;
    if (task.status !== TaskStatus.IN_PROGRESS) {
      showToast('Attachments can only be removed when the task is In Progress.', 'error');
      return;
    }

    const attachment = task.attachments?.find(a => a.id === attachmentId);
    if (!attachment) return;

    if (attachment.addedAtCreation && task.creatorId !== user.uid) {
      showToast('Only the task creator can delete this attachment', 'error');
      return;
    }

    const confirmed = window.confirm('Are you sure you want to permanently detach/delete this attachment?');
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      if (attachment.driveFileId) {
        const token = await auth.currentUser?.getIdToken();
        if (token) {
          await fetch(`/api/drive/files?boardId=${boardId}&fileId=${attachment.driveFileId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      }

      const attachments = task.attachments ? [...task.attachments] : [];
      const updatedAttachments = attachments.filter(a => a.id !== attachmentId);

      const actor = {
        uid: user.uid,
        displayName: profile?.displayName || user.displayName || 'Anonymous',
        photoURL: profile?.photoURL || user.photoURL || ''
      };
      await updateTaskDetails(boardId, task.taskId, { attachments: updatedAttachments }, actor);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreationFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploadingCreationFile(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('boardId', boardId);
      formData.append('boardName', document.title || boardId);
      const uploadRes = await fetch('/api/drive/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!uploadRes.ok) {
        const err = await uploadRes.text();
        throw new Error(`Upload failed: ${err}`);
      }
      const attachment = await uploadRes.json();
      const enriched = {
        ...attachment,
        uploadedBy: { uid: user.uid, displayName: profile?.displayName || user.displayName || '' },
        addedAtCreation: true
      };
      setNewAttachments(prev => [...prev, enriched]);
    } catch (error) {
      console.error('File upload error:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setUploadingCreationFile(false);
    }
  };

  const handleEditDeleteAttachment = (attachmentId) => {
    setEditAttachments(prev => prev.filter(a => a.id !== attachmentId));
  };

  const handleEditAddLinkAttachment = (name, url) => {
    const isTaskCreator = user?.uid === liveInspectingTask?.creatorId;
    const safeName = name.trim() || 'Link URL';
    const newAttachment = {
      id: `link_${Math.random().toString(36).substring(2, 9)}`,
      name: safeName,
      url: url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`,
      uploadedAt: new Date().toISOString(),
      uploadedBy: { uid: user.uid, displayName: profile?.displayName || user.displayName || '' },
      addedAtCreation: isTaskCreator
    };
    setEditAttachments(prev => [...prev, newAttachment]);
  };

  const handleEditFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploadingFile(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('boardId', boardId);
      formData.append('boardName', document.title || boardId);
      const uploadRes = await fetch('/api/drive/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!uploadRes.ok) {
        const err = await uploadRes.text();
        throw new Error(`Upload failed: ${err}`);
      }
      const isTaskCreator = user?.uid === liveInspectingTask?.creatorId;
      const attachment = await uploadRes.json();
      const enriched = {
        ...attachment,
        uploadedBy: { uid: user.uid, displayName: profile?.displayName || user.displayName || '' },
        addedAtCreation: isTaskCreator
      };
      setEditAttachments(prev => [...prev, enriched]);
    } catch (error) {
      console.error('File upload error:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleFileUpload = async (e, task) => {
    if (isArchived) {
      showToast('This board is archived and cannot be modified.', 'error');
      return;
    }
    const file = e.target.files?.[0];
    if (!file || !task) return;
    if (task.status !== TaskStatus.IN_PROGRESS) {
      showToast('Files can only be uploaded when the task is In Progress.', 'error');
      return;
    }
    e.target.value = '';
    setUploadingFile(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('boardId', boardId);
      formData.append('boardName', document.title || boardId);
      const uploadRes = await fetch('/api/drive/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!uploadRes.ok) {
        const err = await uploadRes.text();
        throw new Error(`Upload failed: ${err}`);
      }
      const attachment = await uploadRes.json();
      const enriched = {
        ...attachment,
        uploadedBy: { uid: user.uid, displayName: profile?.displayName || user.displayName || '' }
      };

      const actor = {
        uid: user.uid,
        displayName: profile?.displayName || user.displayName || 'Anonymous',
        photoURL: profile?.photoURL || user.photoURL || '',
      };
      const existing = task.attachments ? [...task.attachments] : [];
      await updateTaskDetails(boardId, task.taskId, { attachments: [...existing, enriched] }, actor);

      await addActivityLog(
        boardId,
        ActivityType.TASK_UPDATED,
        user.uid,
        actor.displayName,
        actor.photoURL,
        `uploaded "${file.name}" to task "${task.title}"`
      );
    } catch (error) {
      console.error('File upload error:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setUploadingFile(false);
    }
  };

  const launchTaskInspector = (task) => {
    setInspectingTask(task);
    setEditTitle(task.title);
    setEditDesc(task.description || '');
    setEditPriority(task.priority);
    setEditDueDate(task.dueDate || '');
    setEditAssigneeId(task.assigneeId || '');
    const initialAssigneeIds = task.assignees ? task.assignees.map(a => a.uid) : (task.assigneeId ? [task.assigneeId] : []);
    setEditAssigneeIds(initialAssigneeIds);
    setEditSubtasks(task.subtasks ? [...task.subtasks] : []);
    setEditTags(task.tags ? [...task.tags] : []);
    setEditAttachments(task.attachments ? [...task.attachments] : []);
    setIsEditing(false);
  };

  // Filter tasks in-memory
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesAssignee =
      assigneeFilter === 'all' ||
      (assigneeFilter === 'unassigned' && !task.assigneeId) ||
      (task.assignees ? task.assignees.some(a => a.uid === assigneeFilter) : task.assigneeId === assigneeFilter);
    return matchesSearch && matchesPriority && matchesAssignee;
  });

  // Calculate high-level board statistics
  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === TaskStatus.TODO).length,
    doing: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
    completed: tasks.filter(t => t.status === TaskStatus.DONE).length,
    high: tasks.filter(t => t.priority === TaskPriority.HIGH && t.status !== TaskStatus.DONE).length,
  };

  return {
    user,
    profile,
    tasks,
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
    subtaskDropdownOpen,
    setSubtaskDropdownOpen,
    newTags,
    setNewTags,
    newSubtaskInput,
    setNewSubtaskInput,
    newSubtaskAssigneeType,
    setNewSubtaskAssigneeType,
    newSubtaskAssignedTo,
    setNewSubtaskAssignedTo,
    newSubtaskDropdownOpen,
    setNewSubtaskDropdownOpen,
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
    stats
  };
};
