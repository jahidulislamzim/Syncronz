'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Send, MessageSquare } from 'lucide-react';
import { ActivityType } from '../types.js';

export const TaskCommentsModal = ({ 
  isOpen, 
  onClose, 
  task, 
  boardId, 
  user, 
  profile, 
  updateTaskDetails, 
  addActivityLog 
}) => {
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef(null);

  const comments = task?.comments || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      // Small timeout to ensure DOM has rendered
      setTimeout(scrollToBottom, 60);
    }
  }, [isOpen, comments.length]);

  if (!isOpen || !task) return null;

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;

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

      await updateTaskDetails(boardId, task.taskId, {
        comments: [...comments, newCommentObj]
      }, actor);

      await addActivityLog(
        boardId,
        ActivityType.COMMENT_ADDED,
        user.uid,
        userName,
        userPhoto,
        `commented on task "${task.title}": "${commentText.trim()}"`
      );

      setCommentText('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      {/* Backdrop Closer */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
              <MessageSquare className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-800 leading-none mb-1">Task Discussion</h3>
              <p className="text-[11px] text-slate-400 font-medium truncate max-w-[280px] sm:max-w-xs">{task.title}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-xl transition text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Scrollable Chat Area */}
        <div className="p-6 overflow-y-auto subtle-scroll flex-1 bg-slate-50/20 space-y-4">
          {comments.map((comment) => {
            const isMe = comment.userId === user?.uid;
            return (
              <div key={comment.id} className={`flex space-x-2.5 items-start ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {/* User Avatar */}
                <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200/65 flex items-center justify-center text-[10px] font-bold text-slate-650 shrink-0">
                  {comment.userPhoto ? (
                    <img 
                      src={comment.userPhoto} 
                      alt={comment.userName} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full rounded-full object-cover" 
                    />
                  ) : (
                    <span>{comment.userName.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>

                {/* Chat Bubble */}
                <div className={`max-w-[75%] p-3 rounded-2xl text-xs flex flex-col ${isMe ? 'bg-indigo-600 text-white rounded-tr-none shadow-sm shadow-indigo-600/5' : 'bg-slate-150/80 text-slate-800 rounded-tl-none border border-slate-200/20'}`}>
                  <div className="flex items-center space-x-1.5 mb-1 text-[9px] font-medium leading-none">
                    <span className={isMe ? 'text-indigo-200' : 'text-slate-500'}>{comment.userName}</span>
                    <span className={isMe ? 'text-indigo-300/80' : 'text-slate-400'}>
                      {comment.createdAt ? new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <p className="leading-relaxed whitespace-pre-line text-left font-sans">{comment.text}</p>
                </div>
              </div>
            );
          })}
          
          {comments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <MessageSquare className="h-8 w-8 text-slate-300 stroke-1 mb-2" />
              <p className="text-xs italic">No comments yet. Start the conversation!</p>
            </div>
          )}

          {/* Dummy element for scroll anchoring */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="p-4 border-t border-slate-100 bg-white">
          {task.status !== 'in_progress' ? (
            <div className="text-center text-xs text-rose-500 font-semibold py-2.5 bg-rose-50 rounded-2xl border border-rose-100 font-mono">
              Comments can only be added when the task is In Progress.
            </div>
          ) : (
            <form onSubmit={handleSendComment} className="flex space-x-2">
              <input
                type="text"
                required
                placeholder="Leave your comment or notes..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-2xl outline-none transition"
              />
              <button
                type="submit"
                disabled={isSubmitting || !commentText.trim()}
                className="py-2.5 px-4 bg-indigo-600 border border-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 rounded-2xl text-xs font-bold transition flex items-center justify-center cursor-pointer shadow-sm shadow-indigo-600/10"
              >
                {isSubmitting ? (
                  <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
