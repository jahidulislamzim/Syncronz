'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { db, auth } from '../lib/firebase/client.js';
import { collection, query, onSnapshot, doc } from 'firebase/firestore';
import { TaskStatus, TaskPriority, ActivityType } from '../types.js';
import { 
  createTask, 
  updateTaskStatus, 
  updateTaskDetails, 
  deleteTask, 
  addActivityLog 
} from '../lib/firebase/firestore.js';
import { 
  Plus, Edit, Trash2, Calendar, User, AlignLeft, Info, 
  ChevronsUp, ChevronRight, ChevronDown, Check, X, Clipboard, MessageSquare, Send,
  Search, Filter, Paperclip, Link2, CheckSquare, Square, Tag, HardDrive, Upload,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MultiSelectDropdown } from './MultiSelectDropdown.jsx';
import { TaskProgressReportModal } from './TaskProgressReportModal.jsx';
import { TaskCommentsModal } from './TaskCommentsModal.jsx';

export const KanbanBoard = ({ boardId }) => {
  const { user, profile } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);

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

  // Editing states within viewer inspector
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriority, setEditPriority] = useState(TaskPriority.MEDIUM);
  const [editDueDate, setEditDueDate] = useState('');
  const [editAssigneeId, setEditAssigneeId] = useState('');
  const [editAssigneeIds, setEditAssigneeIds] = useState([]);
  const [editSubtasks, setEditSubtasks] = useState([]);

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

  // File upload
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);

  // Task creation stage attachments & links
  const [newAttachments, setNewAttachments] = useState([]);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');
  const [uploadingCreationFile, setUploadingCreationFile] = useState(false);
  const creationFileInputRef = useRef(null);




  // Search & Filters state values
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');

  // 1. Listen to tasks under boards/{boardId}/tasks
  useEffect(() => {
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
  const [boardDrive, setBoardDrive] = useState(null);
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

  const handleCreateTask = async (e) => {
    e.preventDefault();
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

      // Trigger background email dispatch to all assignees
      try {
        const token = await auth.currentUser?.getIdToken();
        if (token) {
          assigneeObjs.forEach((assignee) => {
            if (assignee.uid !== user.uid && assignee.email) {
              fetch('/api/send-email', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                  type: 'task_assigned',
                  recipientEmail: assignee.email,
                  recipientName: assignee.displayName || '',
                  actorName: creatorObj.displayName,
                  boardId,
                  boardName: document.title || 'Project Board',
                  taskTitle: newTitle.trim(),
                  taskId: generatedTaskId,
                  dueDate: newDueDate,
                  priority: newPriority,
                  subtasks: parsedSubtasks
                })
              }).catch(err => console.error('Failed to send task assignment email:', err));
            }
          });
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
      setNewSubtaskAssignedTo('');
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
    e.preventDefault();
    if (!user || !inspectingTask || !editTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const assigneeObjs = members.filter(m => editAssigneeIds.includes(m.uid));
      const actor = {
        uid: user.uid,
        displayName: profile?.displayName || user.displayName || 'Anonymous',
        photoURL: profile?.photoURL || user.photoURL || ''
      };

      const fields = {
        title: editTitle.trim(),
        description: editDesc.trim(),
        priority: editPriority,
        dueDate: editDueDate,
        assignees: assigneeObjs,
        subtasks: editSubtasks
      };

      await updateTaskDetails(boardId, inspectingTask.taskId, fields, actor);
      
      // Email notifications for assignees (unawaited)
      try {
        const token = await auth.currentUser?.getIdToken();
        if (token) {
          const oldUids = new Set((inspectingTask.assignees || (inspectingTask.assigneeId ? [{ uid: inspectingTask.assigneeId }] : [])).map(a => a.uid));
          
          assigneeObjs.forEach((assignee) => {
            if (assignee.uid !== user.uid && assignee.email) {
              const isNewAssignment = !oldUids.has(assignee.uid);
              fetch('/api/send-email', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                  type: isNewAssignment ? 'task_assigned' : 'task_updated',
                  recipientEmail: assignee.email,
                  recipientName: assignee.displayName || '',
                  actorName: actor.displayName,
                  boardId,
                  boardName: document.title || 'Project Board',
                  taskTitle: editTitle.trim(),
                  taskId: inspectingTask.taskId,
                  dueDate: editDueDate,
                  priority: editPriority,
                  details: isNewAssignment ? 'You have been assigned this task.' : 'Task details were modified.',
                  subtasks: editSubtasks
                })
              }).catch(err => console.error('Failed to send task update email:', err));
            }
          });
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
    if (!user) return;
    if (!window.confirm('Are you ABSOLUTELY sure you want to permanently delete this task entry?')) return;

    setIsSubmitting(true);
    try {
      const actor = {
        uid: user.uid,
        displayName: profile?.displayName || user.displayName || 'Anonymous',
        photoURL: profile?.photoURL || user.photoURL || ''
      };

      await deleteTask(boardId, task.taskId, actor);
      setInspectingTask(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusTransition = async (task, targetStatus) => {
    if (!user) return;
    try {
      const actor = {
        uid: user.uid,
        displayName: profile?.displayName || user.displayName || 'Anonymous',
        photoURL: profile?.photoURL || user.photoURL || ''
      };
      await updateTaskStatus(boardId, task.taskId, targetStatus, actor);

      // Email notifications for assignees on status change (unawaited)
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

          assigneesList.forEach((assignee) => {
            const memberInfo = members.find(m => m.uid === assignee.uid);
            if (memberInfo && memberInfo.uid !== user.uid && memberInfo.email) {
              fetch('/api/send-email', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                  type: 'task_updated',
                  recipientEmail: memberInfo.email,
                  recipientName: memberInfo.displayName || '',
                  actorName: actor.displayName,
                  boardId,
                  boardName: document.title || 'Project Board',
                  taskTitle: task.title,
                  taskId: task.taskId,
                  priority: task.priority || '',
                  details: `Status was changed to "${statusLabel}"`,
                  subtasks: task.subtasks || []
                })
              }).catch(err => console.error('Failed to send status update email:', err));
            }
          });
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
    e.preventDefault();
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

      // Inject task comment thread directly as an Activity Log item on the board!
      // This displays on live sidebar activity stream instantly!
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
    setIsEditing(false);
  };

  // Synchronized live task object from current task list to prevent stale data
  const liveInspectingTask = inspectingTask ? tasks.find(t => t.taskId === inspectingTask.taskId) || inspectingTask : null;

  // 1. Toggle subtask completion (local)
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

  // 2. Add subtask (local)
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

  // 3. Delete subtask (local)
  const handleDeleteSubtask = (subtaskId) => {
    setEditSubtasks(prev => prev.filter(s => s.id !== subtaskId));
  };

  // 3b. Toggle subtask completion in view mode (restricted by assignee permissions)
  const handleToggleSubtaskViewMode = async (task, subtaskId) => {
    if (!user) return;
    const sub = task.subtasks?.find(s => s.id === subtaskId);
    if (!sub) return;

    // Enforce checklist rules
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
    // Note: 'individual' items can be checked by any board member for themselves.

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

  // 4. Toggle Tag
  const handleToggleTag = async (task, tag) => {
    if (!user) return;
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

  // 5. Add Custom Link Attachment
  const handleAddLinkAttachment = async (task, name, url) => {
    if (!user || !url.trim()) return;
    setIsSubmitting(true);
    try {
      const attachments = task.attachments ? [...task.attachments] : [];
      const safeName = name.trim() || 'Link URL';
      const newAttachment = {
        id: `link_${Math.random().toString(36).substring(2, 9)}`,
        name: safeName,
        url: url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`,
        uploadedAt: new Date().toISOString()
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

  // 6. Delete attachment
  const handleDeleteAttachment = async (task, attachmentId) => {
    if (!user) return;
    const confirmed = window.confirm('Are you sure you want to permanently detach/delete this attachment?');
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
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
      setNewAttachments(prev => [...prev, attachment]);
    } catch (error) {
      console.error('File upload error:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setUploadingCreationFile(false);
    }
  };

  // 7. Upload file to Google Drive
  const handleFileUpload = async (e, task) => {
    const file = e.target.files?.[0];
    if (!file || !task) return;
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

      const actor = {
        uid: user.uid,
        displayName: profile?.displayName || user.displayName || 'Anonymous',
        photoURL: profile?.photoURL || user.photoURL || '',
      };
      const existing = task.attachments ? [...task.attachments] : [];
      await updateTaskDetails(boardId, task.taskId, { attachments: [...existing, attachment] }, actor);

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

  const columnsDef = [
    { id: TaskStatus.TODO, label: 'To Do', color: 'border-slate-300 bg-slate-50 text-slate-700' },
    { id: TaskStatus.IN_PROGRESS, label: 'In Progress', color: 'border-blue-200 bg-blue-50/20 text-blue-700' },
    { id: TaskStatus.REVIEW, label: 'In Review', color: 'border-purple-200 bg-purple-50/20 text-purple-700' },
    { id: TaskStatus.DONE, label: 'Completed', color: 'border-emerald-200 bg-emerald-50/20 text-emerald-805' }
  ];

  // Filter tasks in-memory
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesAssignee =
      assigneeFilter === 'all' ||
      (assigneeFilter === 'unassigned' && !task.assigneeId) ||
      task.assigneeId === assigneeFilter;
    return matchesSearch && matchesPriority && matchesAssignee;
  });

  // Calculate high-level board statistics
  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === TaskStatus.TODO).length,
    doing: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
    completed: tasks.filter(t => t.status === TaskStatus.DONE).length,
    high: tasks.filter(t => t.priority === TaskPriority.HIGH).length,
  };

  return (
    <div className="flex flex-col flex-1 h-full min-h-[500px]">
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
            <span className="text-red-600 bg-red-50/80 px-2 py-0.5 rounded-lg text-[9px] font-bold font-mono">HIGH</span>
                          </div>
                        </div>
                      </div>

      {/* Board Controls Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4.5 mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 flex-1">
          {/* Search bar */}
          <div className="relative flex-1 max-w-sm">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </span>
            <input
              type="text"
              placeholder="Search in tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition"
            />
          </div>

          {/* Priority filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>

          {/* Assignee filter */}
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition max-w-[150px]"
            >
              <option value="all">All Assignees</option>
              <option value="unassigned">Unassigned Only</option>
              {members.map(m => (
                <option key={m.uid} value={m.uid}>{m.displayName}</option>
              ))}
            </select>
          </div>
          
          {(searchTerm !== '' || priorityFilter !== 'all' || assigneeFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setPriorityFilter('all');
                setAssigneeFilter('all');
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer text-left pl-1 transition"
            >
              Clear filters
            </button>
          )}
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2.5 bg-blue-600 lg:hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-md shadow-blue-600/15 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
        {columnsDef.map((col) => {
          const colTasks = filteredTasks.filter(t => t.status === col.id);

          return (
            <div 
              key={col.id}
              className="bg-slate-100/50 rounded-2xl border border-slate-200 p-4 flex flex-col max-h-[720px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border ${col.color} font-mono uppercase tracking-wider`}>
                  {col.label} &bull; {colTasks.length}
                </span>
                <button
                  onClick={() => {
                    setNewTitle('');
                    setNewDesc('');
                    setIsCreateOpen(true);
                  }}
                  className="p-1 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded-lg transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Tasks body items */}
              <div className="space-y-3.5 overflow-y-auto subtle-scroll min-h-[150px] pb-5">
                {colTasks.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                    <Info className="h-5 w-5 opacity-40 mx-auto mb-1 stroke-1" />
                    <p className="text-[11px] font-mono uppercase font-bold tracking-widest text-slate-400/80">Empty Category</p>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {colTasks.map((task) => (
                      <motion.div
                        key={task.taskId}
                        layout
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={() => launchTaskInspector(task)}
                        className={`bg-white border rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-left flex flex-col space-y-3.5 cursor-pointer relative group ${col.id === TaskStatus.IN_PROGRESS ? 'border-l-4 border-l-blue-500 border-slate-200' : 'border-slate-200/95'}`}
                      >
                        <div className="flex items-start justify-between">
                          <span className={`px-2 py-0.5 rounded-md border font-mono ${getPriorityStyle(task.priority)}`}>
                            {task.priority}
                          </span>

                          {col.id === TaskStatus.IN_PROGRESS && (
                            <div className="flex items-center gap-1 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded text-[9px] font-bold text-blue-600 font-mono tracking-widest uppercase">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse mr-0.5 inline-block"></span>
                              Live Sync
                            </div>
                          )}
                          
                          {/* Speed transit selector */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                            {col.id !== TaskStatus.DONE && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const nextState = col.id === TaskStatus.TODO ? TaskStatus.IN_PROGRESS :
                                                    col.id === TaskStatus.IN_PROGRESS ? TaskStatus.REVIEW : TaskStatus.DONE;
                                  handleStatusTransition(task, nextState);
                                }}
                                className="p-1 bg-slate-50 lg:hover:bg-blue-50 rounded-md border border-slate-200 hover:border-blue-300 transition-all text-blue-600"
                                title="Move forward"
                              >
                                <ChevronRight className="h-3 w-3 stroke-[3px]" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-slate-850 leading-snug line-clamp-2">{task.title}</h4>
                          {task.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          {/* Tags view inside card */}
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2.5">
                              {task.tags.map(tag => (
                                <span key={tag} className="px-1.5 py-0.5 text-[8.5px] font-bold rounded-md bg-slate-100 border border-slate-200 text-slate-600 block shadow-2xs">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Interactive Checklist progress loop */}
                          {(() => {
                            const visibleSubs = (task.subtasks || []).filter(sub => {
                              if (sub.assigneeType === 'all' || !sub.assigneeType) return true;
                              if (sub.assigneeType === 'individual') return true;
                              if (sub.assigneeType === 'specific') {
                                const assignedUids = Array.isArray(sub.assignedTo) ? sub.assignedTo : [sub.assignedTo].filter(Boolean);
                                return assignedUids.includes(user?.uid);
                              }
                              return true;
                            });

                            if (visibleSubs.length === 0) return null;

                            const completed = visibleSubs.filter(s => 
                              s.assigneeType === 'individual' 
                                ? s.completedBy?.includes(user?.uid) 
                                : s.completed
                            ).length;

                            return (
                              <div className="mt-3 space-y-1">
                                <div className="flex items-center justify-between text-[9px] text-slate-450 font-mono font-bold">
                                  <span className="flex items-center gap-1">
                                    <CheckSquare className="h-3 w-3 text-emerald-500" />
                                    <span>Checklist ({completed}/{visibleSubs.length})</span>
                                  </span>
                                  <span>{Math.round((completed / visibleSubs.length) * 100)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-emerald-500 transition-all duration-300"
                                    style={{ width: `${(completed / visibleSubs.length) * 100}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })()}

                          {/* Attachments Indicator */}
                          {task.attachments && task.attachments.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-dashed border-slate-100 flex items-center gap-1 text-[9px] text-slate-450 font-mono font-bold">
                              <Paperclip className="h-3 w-3 text-blue-500" />
                              <span>{task.attachments.length} File Attachment{task.attachments.length !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>

                        {/* Task Card Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 flex-wrap gap-2 text-[10px]">
                          {/* Date limit */}
                          <div className="flex items-center space-x-2.5 text-slate-400">
                            <div className="flex items-center space-x-1.5">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              <span className="font-mono tracking-wider font-semibold">{task.dueDate || 'No Limit'}</span>
                            </div>
                            {(task.comments || []).length > 0 && (
                              <div className="flex items-center space-x-0.5 text-slate-400 bg-slate-50 border border-slate-200/50 px-1.5 py-0.5 rounded-md font-mono font-bold text-[9px]">
                                <MessageSquare className="h-3 w-3 text-slate-400" />
                                <span>{(task.comments || []).length}</span>
                              </div>
                            )}
                          </div>

                          {/* Assignee display */}
                          {task.assignees && task.assignees.length > 0 ? (
                            <div className="flex items-center -space-x-1.5 overflow-hidden">
                              {task.assignees.map((assignee) => (
                                <img
                                  key={assignee.uid}
                                  className="inline-block h-5 w-5 rounded-full ring-2 ring-white object-cover border border-slate-100"
                                  src={assignee.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(assignee.displayName)}`}
                                  alt={assignee.displayName}
                                  title={assignee.displayName}
                                  referrerPolicy="no-referrer"
                                />
                              ))}
                            </div>
                          ) : task.assigneeName ? (
                            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200/60 rounded-full py-0.5 pl-0.5 pr-2.5">
                              <img
                                src={task.assigneePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(task.assigneeName)}`}
                                alt={task.assigneeName}
                                referrerPolicy="no-referrer"
                                className="h-4.5 w-4.5 rounded-full object-cover"
                              />
                              <span className="font-bold text-slate-600 truncate max-w-[65px]">{task.assigneeName.split(' ')[0]}</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 text-slate-400">
                              <User className="h-3.5 w-3.5 text-slate-400" />
                              <span className="italic font-mono">Unassigned</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* --- ADD NEW TASK DIALOG --- */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateOpen(false)}
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
                  onClick={() => setIsCreateOpen(false)}
                  className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-800 rounded-lg"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="p-6 space-y-4">
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
                      className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none cursor-pointer"
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
                      className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none cursor-pointer"
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
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${selected ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-600/10' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'}`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
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
                              className="text-red-500 hover:text-red-700 text-xs font-bold px-1 transition-colors cursor-pointer shrink-0"
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
                            createdAt: new Date().toISOString()
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
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-55 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 font-sans cursor-pointer shadow-md shadow-blue-600/10"
                >
                  <Plus className="h-4 w-4" />
                  <span>{isSubmitting ? 'Syncing backend...' : 'Create Task'}</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- TASK INSPECTOR DETAILS & COMMENT THREAD DIALOG --- */}
      <AnimatePresence>
        {inspectingTask && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
              exit={{ opacity: 0 }}
              onClick={() => setInspectingTask(null)}
              className="fixed inset-0 bg-slate-900 cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row z-10 max-h-[90vh]"
            >
              <div className="flex-1 flex flex-col max-h-[85vh] overflow-y-auto subtle-scroll">
                {/* Header info */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400">
                    ID: {inspectingTask.taskId.split('_')[1]}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setIsEditing(!isEditing);
                        if (!isEditing) {
                          setEditTitle(inspectingTask.title);
                          setEditDesc(inspectingTask.description || '');
                          setEditPriority(inspectingTask.priority);
                          setEditDueDate(inspectingTask.dueDate || '');
                          setEditAssigneeId(inspectingTask.assigneeId || '');
                          setEditSubtasks(inspectingTask.subtasks ? [...inspectingTask.subtasks] : []);
                        }
                      }}
                      className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition cursor-pointer"
                      title="Edit task text"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(inspectingTask)}
                      className="p-1.5 text-slate-400 hover:text-red-700 rounded-lg hover:bg-red-50 transition cursor-pointer"
                      title="Delete entry"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => setInspectingTask(null)}
                      className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-800 rounded-lg"
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
                          className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
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
                          className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
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

                      {/* Progress dynamic gauge */}
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
                                    <Square className="h-4 w-4 text-slate-350 hover:text-slate-555 shrink-0" />
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
                      <div className="flex items-center justify-between flex-wrap gap-2 text-[10px]">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2.5 py-0.5 rounded-md border text-[9px] uppercase font-bold font-mono tracking-wider ${getPriorityStyle(liveInspectingTask.priority)}`}>
                            {liveInspectingTask.priority}
                          </span>
                          <span className="text-[10px] text-slate-450 font-mono tracking-wider font-bold">
                            Col: {liveInspectingTask.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        {liveInspectingTask.createdAt && (
                          <span className="text-slate-450 font-mono font-semibold">
                            Created: {new Date(liveInspectingTask.createdAt.seconds ? liveInspectingTask.createdAt.seconds * 1000 : liveInspectingTask.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Main details text */}
                      <h3 className="text-sm font-bold text-slate-900 leading-snug mt-3">{liveInspectingTask.title}</h3>
                      
                      {liveInspectingTask.description && (
                        <div className="text-xs text-slate-650 bg-slate-50 border border-slate-200/60 rounded-xl p-3 leading-relaxed mt-2.5 whitespace-pre-line flex items-start space-x-2">
                          <AlignLeft className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                          <span>{liveInspectingTask.description}</span>
                        </div>
                      )}

                      {/* --- CLASSIFICATION LABELS / TAGS INTEGRATION --- */}
                      <div className="pt-4.5 mt-5 border-t border-slate-100">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2.5">
                          <Tag className="h-3 w-3 inline mr-1 text-slate-450 animate-pulse" /> Classification Tags
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {["Feature", "Bug", "Refactor", "Docs", "Urgent", "Marketing"].map(tag => {
                            const selected = liveInspectingTask.tags?.includes(tag) || false;
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => handleToggleTag(liveInspectingTask, tag)}
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
                      {(() => {
                        const visibleSubtasks = (liveInspectingTask.subtasks || []).filter(sub => {
                          if (sub.assigneeType === 'all' || !sub.assigneeType) return true;
                          if (sub.assigneeType === 'individual') return true;
                          if (sub.assigneeType === 'specific') {
                            const assignedUids = Array.isArray(sub.assignedTo) ? sub.assignedTo : [sub.assignedTo].filter(Boolean);
                            return assignedUids.includes(user?.uid);
                          }
                          return true;
                        });

                        if (visibleSubtasks.length === 0) return null;

                        const completedCount = visibleSubtasks.filter(s => 
                          s.assigneeType === 'individual' 
                            ? s.completedBy?.includes(user?.uid) 
                            : s.completed
                        ).length;

                        return (
                          <div className="pt-4.5 mt-5 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">
                                <CheckSquare className="h-3.5 w-3.5 inline mr-1 text-emerald-500" /> Interactive Checklist
                              </label>
                              <div className="flex items-center space-x-1.5">
                                {user?.uid === liveInspectingTask.creatorId && (
                                  <button
                                    type="button"
                                    onClick={() => setIsReportOpen(true)}
                                    className="text-[9px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-150 border border-indigo-150 px-2 py-0.5 rounded-md transition cursor-pointer flex items-center space-x-1"
                                  >
                                    <BarChart3 className="h-2.5 w-2.5" />
                                    <span>Progress Report</span>
                                  </button>
                                )}
                                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md font-mono">
                                  {completedCount} of {visibleSubtasks.length} done
                                </span>
                              </div>
                            </div>

                            {/* Progress dynamic gauge */}
                            <div className="mb-3.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/40">
                              <div 
                                className="h-full bg-emerald-500 transition-all duration-350"
                                style={{ width: `${(completedCount / visibleSubtasks.length) * 100}%` }}
                              />
                            </div>

                            {/* List subtasks items */}
                            <div className="space-y-2 max-h-[220px] overflow-y-auto subtle-scroll mb-3">
                              {visibleSubtasks.map(sub => {
                                let canToggle = false;
                                if (sub.assigneeType === 'individual') {
                                  canToggle = true;
                                } else if (sub.assigneeType === 'specific') {
                                  const assignedUids = Array.isArray(sub.assignedTo) ? sub.assignedTo : [sub.assignedTo].filter(Boolean);
                                  canToggle = assignedUids.includes(user?.uid);
                                } else {
                                  canToggle = liveInspectingTask.assignees?.some(a => a.uid === user?.uid) || liveInspectingTask.assigneeId === user?.uid;
                                }
                                
                                const isCompleted = sub.assigneeType === 'individual'
                                  ? sub.completedBy?.includes(user?.uid)
                                  : sub.completed;

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

                                const isTaskCreator = user?.uid === liveInspectingTask.creatorId;

                                return (
                                  <div key={sub.id} className="space-y-1">
                                    {canToggle ? (
                                      <button
                                        type="button"
                                        onClick={() => handleToggleSubtaskViewMode(liveInspectingTask, sub.id)}
                                        className="w-full flex items-center space-x-2.5 px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-100/50 transition-colors text-left cursor-pointer min-w-0"
                                      >
                                        {isCompleted ? (
                                          <CheckSquare className="h-4 w-4 text-emerald-500 shrink-0" />
                                        ) : (
                                          <Square className="h-4 w-4 text-slate-350 hover:text-slate-550 shrink-0" />
                                        )}
                                        <span className={`text-xs font-semibold truncate ${isCompleted ? 'line-through text-slate-400' : 'text-slate-700'}`}>{sub.title}</span>
                                        {assignmentBadge}
                                      </button>
                                    ) : (
                                      <div 
                                        className="flex items-center space-x-2.5 px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/30 cursor-not-allowed min-w-0"
                                        title="You are not authorized to check/uncheck this checklist item"
                                      >
                                        {isCompleted ? (
                                          <CheckSquare className="h-4 w-4 text-emerald-305 shrink-0" />
                                        ) : (
                                          <Square className="h-4 w-4 text-slate-300 shrink-0" />
                                        )}
                                        <span className={`text-xs font-semibold truncate ${isCompleted ? 'line-through text-slate-400' : 'text-slate-400'}`}>{sub.title}</span>
                                        {assignmentBadge}
                                      </div>
                                    )}

                                    {/* Creator/Manager completion tracker UI */}
                                    {isTaskCreator && (
                                      <div className="flex flex-wrap items-center gap-1.5 px-3 py-1 bg-slate-50/20 border border-slate-100/50 rounded-xl text-[10px] text-slate-500">
                                        <span className="font-semibold text-slate-400 mr-1">Status:</span>
                                        {sub.assigneeType === 'individual' ? (
                                          <div className="flex flex-wrap items-center gap-1">
                                            {members.map(m => {
                                              const completed = sub.completedBy?.includes(m.uid);
                                              const name = m.displayName || m.email.split('@')[0];
                                              const initials = name.slice(0, 2).toUpperCase();
                                              return (
                                                <div 
                                                  key={m.uid}
                                                  className={`relative w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border transition-all ${
                                                    completed 
                                                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                                                      : 'bg-slate-55 border-slate-200 text-slate-400 opacity-60'
                                                  }`}
                                                  title={`${name} - ${completed ? 'Completed' : 'Pending'}`}
                                                >
                                                  {m.photoURL ? (
                                                    <img 
                                                      src={m.photoURL} 
                                                      alt={name} 
                                                      className="w-full h-full rounded-full object-cover"
                                                    />
                                                  ) : (
                                                    <span>{initials}</span>
                                                  )}
                                                  {completed && (
                                                    <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 border border-white rounded-full flex items-center justify-center" />
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1">
                                            {sub.assigneeType === 'specific' ? (
                                              <>
                                                <span className="font-medium text-slate-600">
                                                  {(Array.isArray(sub.assignedTo) ? sub.assignedTo : [sub.assignedTo].filter(Boolean)).map(uid => {
                                                    const m = members.find(member => member.uid === uid);
                                                    return m ? (m.displayName || m.email.split('@')[0]) : '';
                                                  }).filter(Boolean).join(', ')}
                                                </span>
                                                <span className={`px-1.5 py-0.5 rounded font-semibold text-[8px] uppercase tracking-wider ${sub.completed ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                                  {sub.completed ? 'Completed' : 'Pending'}
                                                </span>
                                              </>
                                            ) : (
                                              <>
                                                <span className="font-medium text-slate-600">Anyone</span>
                                                <span className={`px-1.5 py-0.5 rounded font-semibold text-[8px] uppercase tracking-wider ${sub.completed ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                                  {sub.completed ? 'Completed' : 'Pending'}
                                                </span>
                                              </>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      {/* --- ATTACHMENTS HUB (External URLs) --- */}
                      <div className="pt-4.5 mt-5 border-t border-slate-100">
                        <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block mb-2.5">
                          <Paperclip className="h-3.5 w-3.5 inline mr-1 text-blue-500" /> Task Attachments
                        </label>

                        {liveInspectingTask.attachments && liveInspectingTask.attachments.length > 0 ? (
                          <div className="space-y-2 mb-4">
                            {liveInspectingTask.attachments.map((att, idx) => {
                              const isDrive = att.driveFileId || att.id?.startsWith('drive_');
                              return (
                                <div key={att.id || `att-${idx}`} className="flex items-center justify-between p-2.5 border border-slate-200 bg-white rounded-xl shadow-2xs">
                                  <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                                    <div className={`p-1.5 rounded-lg shrink-0 ${isDrive ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-500'}`}>
                                      {isDrive ? <HardDrive className="h-3.5 w-3.5" /> : <Paperclip className="h-3.5 w-3.5" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-bold text-slate-800 truncate leading-tight">{att.name}</p>
                                      <p className="text-[8.5px] text-slate-400 font-mono mt-0.5">{isDrive ? 'Google Drive' : 'External Web URL'}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-1 ml-2">
                                    <a
                                      href={att.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      referrerPolicy="no-referrer"
                                      className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition inline-block text-center"
                                    >
                                      Open
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteAttachment(liveInspectingTask, att.id)}
                                      className="p-1 text-slate-400 hover:text-red-500 rounded-md transition cursor-pointer"
                                      title="Delete attachment"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic font-medium mb-3">No attachments.</p>
                        )}

                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                          <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest block">Paste External Attachment Link</span>
                          <div className="space-y-1.5">
                            <div className="grid grid-cols-2 gap-1.5">
                              <input
                                type="text"
                                placeholder="Description name..."
                                value={customUrlName}
                                onChange={(e) => setCustomUrlName(e.target.value)}
                                className="text-[10px] px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition"
                              />
                              <input
                                type="text"
                                placeholder="https://example.com..."
                                value={customUrl}
                                onChange={(e) => setCustomUrl(e.target.value)}
                                className="text-[10px] px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition"
                              />
                            </div>
                            <button
                              type="button"
                              disabled={isSubmitting || !customUrl.trim()}
                              onClick={() => {
                                handleAddLinkAttachment(liveInspectingTask, customUrlName, customUrl);
                                setCustomUrl('');
                                setCustomUrlName('');
                              }}
                              className="w-full py-1.5 bg-slate-150 hover:bg-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Link2 className="h-3 w-3" /> 
                              <span>{isSubmitting ? 'Adding Link...' : 'Add Custom Attachment Link'}</span>
                            </button>
                          </div>
                        </div>

                        {boardDrive?.enabled ? (
                          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                            <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Upload File to Google Drive</span>
                            <input
                              ref={fileInputRef}
                              type="file"
                              onChange={(e) => handleFileUpload(e, liveInspectingTask)}
                              className="hidden"
                            />
                            <button
                              type="button"
                              disabled={uploadingFile}
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                            >
                              <Upload className="h-3 w-3" />
                              <span>{uploadingFile ? 'Uploading...' : 'Upload to Drive'}</span>
                            </button>
                          </div>
                        ) : (
                          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                            <p className="text-[10.5px] text-slate-400 font-medium text-center">
                              Google Drive is not enabled for this board. Ask an admin to configure it in Settings.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Controls to transit task status */}
                      <div className="pt-4.5 mt-5 border-t border-slate-100">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2.5">
                          Move Board State
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {columnsDef.map(col => (
                            <button
                              key={col.id}
                              type="button"
                              onClick={() => handleStatusTransition(liveInspectingTask, col.id)}
                              className={`py-1.5 px-3 rounded-lg border text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer shadow-sm ${liveInspectingTask.status === col.id ? 'bg-blue-600 border-blue-600 text-white shadow-blue-600/10' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'}`}
                            >
                              {liveInspectingTask.status === col.id && <Check className="h-3 w-3 stroke-[3px]" />}
                              <span>{col.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Assignee / Meta cards block */}
                      <div className="grid grid-cols-2 gap-4 pt-5 mt-5 border-t border-slate-100">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Assignees</span>
                          {liveInspectingTask.assignees && liveInspectingTask.assignees.length > 0 ? (
                            <div className="flex flex-col space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                              {liveInspectingTask.assignees.map((assignee) => (
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
                          ) : liveInspectingTask.assigneeName ? (
                            <div className="flex items-center space-x-2.5 font-sans bg-slate-50 border border-slate-200/50 rounded-xl p-2.5">
                              <img
                                src={liveInspectingTask.assigneePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(liveInspectingTask.assigneeName)}`}
                                alt={liveInspectingTask.assigneeName}
                                referrerPolicy="no-referrer"
                                className="h-7 w-7 rounded-lg object-cover"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 leading-tight truncate">{liveInspectingTask.assigneeName}</p>
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
                            <Calendar className="h-6 w-6 text-slate-450 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800">{liveInspectingTask.dueDate || 'Un-restricted'}</p>
                              <p className="text-[10px] text-slate-400">Limit Target</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* --- INNER COLLABORATIVE COMMENTS THREAD --- */}
                    <div className="border-t border-slate-100 pt-5 mt-5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-widest flex items-center space-x-1.5">
                          <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                          <span>Collaborative Discussion</span>
                        </h4>
                        <span className="text-[10px] font-bold text-slate-555 bg-slate-100 border border-slate-200/50 px-2 py-0.5 rounded-md font-mono">
                          {(liveInspectingTask?.comments || []).length} comment{(liveInspectingTask?.comments || []).length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => setIsCommentsOpen(true)}
                        className="mt-3.5 w-full py-2.5 px-4 bg-slate-50 border border-slate-200 hover:bg-slate-100/80 hover:border-slate-300 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer shadow-2xs"
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

      {/* Task Checklist Progress Audit Report Modal */}
      {isReportOpen && (
        <TaskProgressReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          task={liveInspectingTask}
          members={members}
        />
      )}

      {/* Task Comments Chat Modal */}
      {isCommentsOpen && (
        <TaskCommentsModal
          isOpen={isCommentsOpen}
          onClose={() => setIsCommentsOpen(false)}
          task={liveInspectingTask}
          boardId={boardId}
          user={user}
          profile={profile}
          updateTaskDetails={updateTaskDetails}
          addActivityLog={addActivityLog}
        />
      )}
    </div>
  );
};
