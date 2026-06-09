import { MessageSquare } from 'lucide-react';

export function CommentsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
      <MessageSquare className="h-8 w-8 text-slate-300 stroke-1 mb-2" />
      <p className="text-xs italic">No comments yet. Start the conversation!</p>
    </div>
  );
}
