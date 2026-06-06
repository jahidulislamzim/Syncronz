'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { db } from '../lib/firebase.js';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { TaskStatus, TaskPriority, ActivityType } from '../types.js';
import { 
  createTask, 
  updateTaskStatus, 
  updateTaskDetails, 
  deleteTask, 
  addActivityLog 
} from '../lib/services.js';
import { 
  Plus, Edit, Trash2, Calendar, User, AlignLeft, Info, 
  ChevronsUp, ChevronRight, Check, X, Clipboard, MessageSquare, Send,
  Search, Filter, Paperclip, Link2, CheckSquare, Square, Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const KanbanBoard = ({ boardId }) => {
  const { user, profile } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);

  // Modals / Selection states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [inspectingTask, setInspectingTask] = useState(null);

  // New task form states
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState(TaskPriority.MEDIUM);
  const [newDueDate, setNewDueDate] = useState('');
  const [newAssigneeId, setNewAssigneeId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Editing states within viewer inspector
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriority, setEditPriority] = useState(TaskPriority.MEDIUM);
  const [editDueDate, setEditDueDate] = useState('');
  const [editAssigneeId, setEditAssigneeId] = useState('');

  // Task inline thread states
  const [commentText, setCommentText] = useState('');

  const [customUrl, setCustomUrl] = useState('');
  const [customUrlName, setCustomUrlName] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  
  // New task form tagging/checklist extras
  const [newTags, setNewTags] = useState([]);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');
  const [inlineSubtasks, setInlineSubtasks] = useState([]);




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
      const assigneeObj = members.find(m => m.uid === newAssigneeId) || null;
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
        assigneeObj,
        creatorObj
      );

      if (generatedTaskId && (newTags.length > 0 || inlineSubtasks.length > 0)) {
        const parsedSubtasks = inlineSubtasks.map(text => ({
          id: `sub_${Math.random().toString(36).substring(2, 9)}`,
          title: text,
          completed: false
        }));

        await updateTaskDetails(boardId, generatedTaskId, {
          tags: newTags,
          subtasks: parsedSubtasks,
          attachments: []
        }, creatorObj);
      }

      // Clean
      setNewTitle('');
      setNewDesc('');
      setNewPriority(TaskPriority.MEDIUM);
      setNewDueDate('');
      setNewAssigneeId('');
      setNewTags([]);
      setInlineSubtasks([]);
      setNewSubtaskInput('');
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
      const assigneeObj = members.find(m => m.uid === editAssigneeId) || null;
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
        assigneeId: assigneeObj?.uid || '',
        assigneeName: assigneeObj?.displayName || '',
        assigneePhoto: assigneeObj?.photoURL || ''
      };

      await updateTaskDetails(boardId, inspectingTask.taskId, fields, actor);
      
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
    if (!user || !inspectingTask || !commentText.trim()) return;

    try {
      const userName = profile?.displayName || user.displayName || 'Anonymous';
      const userPhoto = profile?.photoURL || user.photoURL || '';
      
      // Inject task comment thread directly as an Activity Log item on the board!
      // This displays on live sidebar activity stream instantly!
      await addActivityLog(
        boardId,
        ActivityType.COMMENT_ADDED,
        user.uid,
        userName,
        userPhoto,
        `commented on layout "${inspectingTask.title}": "${commentText.trim()}"`
      );

      setCommentText('');
    } catch (err) {
      console.error(err);
    }
  };

  const launchTaskInspector = (task) => {
    setInspectingTask(task);
    setEditTitle(task.title);
    setEditDesc(task.description || '');
    setEditPriority(task.priority);
    setEditDueDate(task.dueDate || '');
    setEditAssigneeId(task.assigneeId || '');
    setIsEditing(false);
  };

  // Synchronized live task object from current task list to prevent stale data
  const liveInspectingTask = inspectingTask ? tasks.find(t => t.taskId === inspectingTask.taskId) || inspectingTask : null;

  // 1. Toggle subtask completion
  const handleToggleSubtask = async (task, subtaskId) => {
    if (!user) return;
    const subtasks = task.subtasks ? [...task.subtasks] : [];
    const updatedSubtasks = subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s);
    
    const actor = {
      uid: user.uid,
      displayName: profile?.displayName || user.displayName || 'Anonymous',
      photoURL: profile?.photoURL || user.photoURL || ''
    };
    await updateTaskDetails(boardId, task.taskId, { subtasks: updatedSubtasks }, actor);
  };

  // 2. Add subtask
  const handleAddSubtask = async (task, titleText) => {
    if (!user || !titleText.trim()) return;
    const subtasks = task.subtasks ? [...task.subtasks] : [];
    const newSub = {
      id: `sub_${Math.random().toString(36).substring(2, 9)}`,
      title: titleText.trim(),
      completed: false
    };
    const updatedSubtasks = [...subtasks, newSub];

    const actor = {
      uid: user.uid,
      displayName: profile?.displayName || user.displayName || 'Anonymous',
      photoURL: profile?.photoURL || user.photoURL || ''
    };
    await updateTaskDetails(boardId, task.taskId, { subtasks: updatedSubtasks }, actor);
  };

  // 3. Delete subtask
  const handleDeleteSubtask = async (task, subtaskId) => {
    if (!user) return;
    const subtasks = task.subtasks ? [...task.subtasks] : [];
    const updatedSubtasks = subtasks.filter(s => s.id !== subtaskId);

    const actor = {
      uid: user.uid,
      displayName: profile?.displayName || user.displayName || 'Anonymous',
      photoURL: profile?.photoURL || user.photoURL || ''
    };
    await updateTaskDetails(boardId, task.taskId, { subtasks: updatedSubtasks }, actor);
  };

  // 4. Toggle Tag
  const handleToggleTag = async (task, tag) => {
    if (!user) return;
    const tags = task.tags ? [...task.tags] : [];
    const updatedTags = tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag];

    const actor = {
      uid: user.uid,
      displayName: profile?.displayName || user.displayName || 'Anonymous',
      photoURL: profile?.photoURL || user.photoURL || ''
    };
    await updateTaskDetails(boardId, task.taskId, { tags: updatedTags }, actor);
  };

  // 5. Add Custom Link Attachment
  const handleAddLinkAttachment = async (task, name, url) => {
    if (!user || !url.trim()) return;
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
  };

  // 6. Delete attachment
  const handleDeleteAttachment = async (task, attachmentId) => {
    if (!user) return;
    const confirmed = window.confirm('Are you sure you want to permanently detach/delete this attachment?');
    if (!confirmed) return;

    const attachments = task.attachments ? [...task.attachments] : [];
    const updatedAttachments = attachments.filter(a => a.id !== attachmentId);

    const actor = {
      uid: user.uid,
      displayName: profile?.displayName || user.displayName || 'Anonymous',
      photoURL: profile?.photoURL || user.photoURL || ''
    };
    await updateTaskDetails(boardId, task.taskId, { attachments: updatedAttachments }, actor);
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
                          {task.subtasks && task.subtasks.length > 0 && (
                            <div className="mt-3 space-y-1">
                              <div className="flex items-center justify-between text-[9px] text-slate-450 font-mono font-bold">
                                <span className="flex items-center gap-1">
                                  <CheckSquare className="h-3 w-3 text-emerald-500" />
                                  <span>Checklist ({task.subtasks.filter(s => s.completed).length}/{task.subtasks.length})</span>
                                </span>
                                <span>{Math.round((task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100)}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-emerald-500 transition-all duration-300"
                                  style={{ width: `${(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}%` }}
                                />
                              </div>
                            </div>
                          )}

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
                          <div className="flex items-center space-x-1.5 text-slate-400">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span className="font-mono tracking-wider font-semibold">{task.dueDate || 'No Limit'}</span>
                          </div>

                          {/* Assignee display */}
                          {task.assigneeName ? (
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
                  <label className="text-xs font-bold text-slate-700">Assign To Team Member</label>
                  <select
                    value={newAssigneeId}
                    onChange={(e) => setNewAssigneeId(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {members.map(m => (
                      <option key={m.uid} value={m.uid}>{m.displayName} ({m.email})</option>
                    ))}
                  </select>
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
                            setInlineSubtasks([...inlineSubtasks, newSubtaskInput.trim()]);
                            setNewSubtaskInput('');
                          }
                        }
                      }}
                      className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newSubtaskInput.trim()) {
                          setInlineSubtasks([...inlineSubtasks, newSubtaskInput.trim()]);
                          setNewSubtaskInput('');
                        }
                      }}
                      className="px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                  {inlineSubtasks.length > 0 && (
                    <div className="mt-2 bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-1.5 max-h-[120px] overflow-y-auto subtle-scroll">
                      {inlineSubtasks.map((text, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px] text-slate-650 bg-white px-2.5 py-1 rounded-lg border border-slate-150 shadow-2xs">
                          <span className="truncate pr-2 font-medium">{text}</span>
                          <button
                            type="button"
                            onClick={() => setInlineSubtasks(inlineSubtasks.filter((_, i) => i !== idx))}
                            className="text-red-500 hover:text-red-700 text-xs font-bold px-1 transition-colors cursor-pointer"
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
                      <label className="text-xs font-bold text-slate-700">Reassign Board Member</label>
                      <select
                        value={editAssigneeId}
                        onChange={(e) => setEditAssigneeId(e.target.value)}
                        className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <option value="">Unassigned</option>
                        {members.map(m => (
                          <option key={m.uid} value={m.uid}>{m.displayName}</option>
                        ))}
                      </select>
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
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        Save layout
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
                      <div className="pt-4.5 mt-5 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">
                            <CheckSquare className="h-3.5 w-3.5 inline mr-1 text-emerald-500" /> Interactive Checklist
                          </label>
                          {liveInspectingTask.subtasks && liveInspectingTask.subtasks.length > 0 && (
                            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md font-mono">
                              {liveInspectingTask.subtasks.filter(s => s.completed).length} of {liveInspectingTask.subtasks.length} done
                            </span>
                          )}
                        </div>

                        {/* Progress dynamic gauge */}
                        {liveInspectingTask.subtasks && liveInspectingTask.subtasks.length > 0 && (
                          <div className="mb-3.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/40">
                            <div 
                              className="h-full bg-emerald-500 transition-all duration-350"
                              style={{ width: `${(liveInspectingTask.subtasks.filter(s => s.completed).length / liveInspectingTask.subtasks.length) * 100}%` }}
                            />
                          </div>
                        )}

                        {/* List subtasks items */}
                        {liveInspectingTask.subtasks && liveInspectingTask.subtasks.length > 0 && (
                          <div className="space-y-1.5 max-h-[160px] overflow-y-auto subtle-scroll mb-3">
                            {liveInspectingTask.subtasks.map(sub => (
                              <div key={sub.id} className="flex items-center justify-between group/sub px-3 py-2 border border-slate-250/70 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                <button
                                  type="button"
                                  onClick={() => handleToggleSubtask(liveInspectingTask, sub.id)}
                                  className="flex items-center space-x-2.5 text-left flex-1 cursor-pointer"
                                >
                                  {sub.completed ? (
                                    <CheckSquare className="h-4 w-4 text-emerald-500 shrink-0" />
                                  ) : (
                                    <Square className="h-4 w-4 text-slate-350 hover:text-slate-550 shrink-0" />
                                  )}
                                  <span className={`text-xs font-semibold ${sub.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{sub.title}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSubtask(liveInspectingTask, sub.id)}
                                  className="opacity-0 group-hover/sub:opacity-100 p-1 text-slate-400 hover:text-red-500 rounded-md transition cursor-pointer"
                                  title="Remove subtask"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add subtask item inline input */}
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (newSubtaskTitle.trim()) {
                              handleAddSubtask(liveInspectingTask, newSubtaskTitle.trim());
                              setNewSubtaskTitle('');
                            }
                          }}
                          className="flex space-x-1.5"
                        >
                          <input
                            type="text"
                            required
                            placeholder="Add item to checklist..."
                            value={newSubtaskTitle}
                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                            className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-none transition"
                          />
                          <button
                            type="submit"
                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-sm"
                          >
                            Add
                          </button>
                        </form>
                      </div>

                      {/* --- ATTACHMENTS HUB (External URLs) --- */}
                      <div className="pt-4.5 mt-5 border-t border-slate-100">
                        <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block mb-2.5">
                          <Paperclip className="h-3.5 w-3.5 inline mr-1 text-blue-500" /> Task Attachments
                        </label>

                        {liveInspectingTask.attachments && liveInspectingTask.attachments.length > 0 ? (
                          <div className="space-y-2 mb-4">
                            {liveInspectingTask.attachments.map(att => (
                              <div key={att.id} className="flex items-center justify-between p-2.5 border border-slate-200 bg-white rounded-xl shadow-2xs">
                                <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                                  <div className="p-1.5 bg-blue-50 rounded-lg text-blue-500 shrink-0">
                                    <Paperclip className="h-3.5 w-3.5" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-slate-800 truncate leading-tight">{att.name}</p>
                                    <p className="text-[8.5px] text-slate-400 font-mono mt-0.5">External Web URL</p>
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
                                    title="Delete attachment link"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
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
                              disabled={!customUrl.trim()}
                              onClick={() => {
                                handleAddLinkAttachment(liveInspectingTask, customUrlName, customUrl);
                                setCustomUrl('');
                                setCustomUrlName('');
                              }}
                              className="w-full py-1.5 bg-slate-150 hover:bg-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Link2 className="h-3 w-3" /> 
                              <span>Add Custom Attachment Link</span>
                            </button>
                          </div>
                        </div>
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
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Assignee</span>
                          {liveInspectingTask.assigneeName ? (
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
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1.5 mb-2.5">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Interactive Board Thread (Comments)</span>
                      </h4>

                      <form onSubmit={handleAddComment} className="flex space-x-2">
                        <input
                          type="text"
                          required
                          placeholder="Add comment, discuss, or leave logs..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          className="flex-1 text-xs px-3.5 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl outline-none transition"
                        />
                        <button
                          type="submit"
                          disabled={!commentText.trim()}
                          className="py-2 px-3 bg-slate-900 border border-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer shadow-sm"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
