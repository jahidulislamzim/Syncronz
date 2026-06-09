import { CheckSquare } from 'lucide-react';
import { SubtaskAuditItem } from './SubtaskAuditItem.jsx';

export function SubtaskAuditList({ subtasks, members, expandedSubtaskId, onToggle }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-4.5 space-y-3">
      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
        <CheckSquare className="h-4 w-4 text-slate-500" /> Subtask Breakdown
      </h4>

      {subtasks.length === 0 ? (
        <p className="text-xs text-slate-400 py-3 text-center">No checklist items created yet.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {subtasks.map((sub, idx) => (
            <SubtaskAuditItem
              key={sub.id || idx}
              sub={sub}
              index={idx}
              members={members}
              isExpanded={expandedSubtaskId === sub.id}
              onToggle={() => onToggle(expandedSubtaskId === sub.id ? null : sub.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
