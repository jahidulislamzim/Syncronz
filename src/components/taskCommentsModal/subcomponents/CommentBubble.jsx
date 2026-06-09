export function CommentBubble({ comment, isMe }) {
  return (
    <div className={`flex space-x-2.5 items-start ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}>
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
}
