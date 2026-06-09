import { Send } from 'lucide-react';

export function CommentInput({ isArchived, taskStatus, commentText, isSubmitting, onCommentChange, onSubmit }) {
  if (isArchived) {
    return (
      <div className="text-center text-xs text-amber-600 font-semibold py-2.5 bg-amber-50 rounded-2xl border border-amber-100 font-mono">
        Comments are disabled because this board is archived.
      </div>
    );
  }

  if (taskStatus !== 'in_progress') {
    return (
      <div className="text-center text-xs text-rose-500 font-semibold py-2.5 bg-rose-50 rounded-2xl border border-rose-100 font-mono">
        Comments can only be added when the task is In Progress.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex space-x-2">
      <input
        type="text"
        required
        placeholder="Leave your comment or notes..."
        value={commentText}
        onChange={(e) => onCommentChange(e.target.value)}
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
  );
}
