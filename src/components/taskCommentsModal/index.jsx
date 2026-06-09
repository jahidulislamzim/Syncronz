'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityType } from '../../types.js';
import { ModalHeader } from './subcomponents/ModalHeader.jsx';
import { CommentBubble } from './subcomponents/CommentBubble.jsx';
import { CommentInput } from './subcomponents/CommentInput.jsx';
import { CommentsEmptyState } from './subcomponents/CommentsEmptyState.jsx';

export const TaskCommentsModal = ({
  isOpen,
  onClose,
  task,
  boardId,
  user,
  profile,
  updateTaskDetails,
  addActivityLog,
  isArchived = false
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
      setTimeout(scrollToBottom, 60);
    }
  }, [isOpen, comments.length]);

  if (!isOpen || !task) return null;

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (isArchived || !commentText.trim() || !user) return;

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
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <ModalHeader taskTitle={task.title} onClose={onClose} />

        <div className="p-6 overflow-y-auto subtle-scroll flex-1 bg-slate-50/20 space-y-4">
          {comments.map((comment) => (
            <CommentBubble
              key={comment.id}
              comment={comment}
              isMe={comment.userId === user?.uid}
            />
          ))}

          {comments.length === 0 && <CommentsEmptyState />}

          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-slate-100 bg-white">
          <CommentInput
            isArchived={isArchived}
            taskStatus={task.status}
            commentText={commentText}
            isSubmitting={isSubmitting}
            onCommentChange={setCommentText}
            onSubmit={handleSendComment}
          />
        </div>
      </div>
    </div>
  );
};
