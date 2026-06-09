'use client';

import { X, BarChart3 } from 'lucide-react';
import { useProgressReport } from './hooks/useProgressReport.js';
import { ProgressSummaryCards } from './subcomponents/ProgressSummaryCards.jsx';
import { SubtaskAuditList } from './subcomponents/SubtaskAuditList.jsx';
import { MemberProgressList } from './subcomponents/MemberProgressList.jsx';

export const TaskProgressReportModal = ({ isOpen, onClose, task, members }) => {
  const {
    subtasks,
    memberProgressList,
    overallCompletionPercentage,
    totalAssignedInstances,
    totalCompletedInstances,
    activeParticipantsCount,
    expandedSubtaskId,
    setExpandedSubtaskId,
  } = useProgressReport(task, members);

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">

        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
            <div>
              <h3 className="text-base font-bold text-slate-800">Checklist Audit Report</h3>
              <p className="text-xs text-slate-400 font-medium truncate max-w-md">Task: {task.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-xl transition text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto subtle-scroll space-y-6 flex-1 bg-slate-50/50">

          <ProgressSummaryCards
            overallPercentage={overallCompletionPercentage}
            completed={totalCompletedInstances}
            total={totalAssignedInstances}
            activeParticipants={activeParticipantsCount}
            totalMembers={members.length}
          />

          <SubtaskAuditList
            subtasks={subtasks}
            members={members}
            expandedSubtaskId={expandedSubtaskId}
            onToggle={setExpandedSubtaskId}
          />

          <MemberProgressList members={memberProgressList} />

        </div>

      </div>
    </div>
  );
};
