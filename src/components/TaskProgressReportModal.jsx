'use client';

import React, { useState } from 'react';
import { X, CheckSquare, Users, CheckCircle2, BarChart3, PieChart, ChevronDown, ChevronUp } from 'lucide-react';

export const TaskProgressReportModal = ({ isOpen, onClose, task, members }) => {
  const [expandedSubtaskId, setExpandedSubtaskId] = useState(null);
  
  if (!isOpen || !task) return null;

  const subtasks = task.subtasks || [];
  const totalSubtasksCount = subtasks.length;

  // Calculate global & individual stats
  let totalAssignedInstances = 0;
  let totalCompletedInstances = 0;

  const memberProgressList = members.map(member => {
    let assignedCount = 0;
    let completedCount = 0;

    subtasks.forEach(sub => {
      let isAssigned = false;
      let isDone = false;

      if (sub.assigneeType === 'all' || !sub.assigneeType) {
        // 'all' counts as assigned to everyone
        isAssigned = true;
        isDone = !!sub.completed;
      } else if (sub.assigneeType === 'individual') {
        // 'individual' counts as assigned to everyone
        isAssigned = true;
        isDone = Array.isArray(sub.completedBy) && sub.completedBy.includes(member.uid);
      } else if (sub.assigneeType === 'specific') {
        // 'specific' is only assigned if user's UID is listed
        const assignedUids = Array.isArray(sub.assignedTo) ? sub.assignedTo : [sub.assignedTo].filter(Boolean);
        if (assignedUids.includes(member.uid)) {
          isAssigned = true;
          isDone = !!sub.completed;
        }
      }

      if (isAssigned) {
        assignedCount++;
        totalAssignedInstances++;
        if (isDone) {
          completedCount++;
          totalCompletedInstances++;
        }
      }
    });

    return {
      member,
      assignedCount,
      completedCount,
      percentage: assignedCount > 0 ? Math.round((completedCount / assignedCount) * 100) : 0
    };
  });

  const overallCompletionPercentage = totalAssignedInstances > 0 
    ? Math.round((totalCompletedInstances / totalAssignedInstances) * 100) 
    : 0;

  // Active participants count
  const activeParticipantsCount = members.filter(m => {
    return subtasks.some(sub => {
      if (sub.assigneeType === 'individual') {
        return sub.completedBy?.includes(m.uid);
      }
      return sub.completed && (
        sub.assigneeType === 'all' || 
        (sub.assigneeType === 'specific' && (Array.isArray(sub.assignedTo) ? sub.assignedTo : [sub.assignedTo]).includes(m.uid))
      );
    });
  }).length;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      {/* Backdrop Closer */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
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

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto subtle-scroll space-y-6 flex-1 bg-slate-50/50">
          
          {/* Dashboard Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1: Overall progress */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Overall Completion</span>
                <PieChart className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-slate-800">{overallCompletionPercentage}%</span>
                <span className="text-xs text-slate-450 font-semibold">({totalCompletedInstances}/{totalAssignedInstances} instances)</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${overallCompletionPercentage}%` }}
                />
              </div>
            </div>

            {/* Card 2: Participated Members */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Participation</span>
                <Users className="h-4 w-4 text-indigo-500" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-slate-800">{activeParticipantsCount}</span>
                <span className="text-xs text-slate-450 font-semibold">of {members.length} members participated</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${members.length > 0 ? (activeParticipantsCount / members.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Subtasks Audit Section */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-4.5 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare className="h-4 w-4 text-slate-500" /> Subtask Breakdown
            </h4>

            {totalSubtasksCount === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No checklist items created yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {subtasks.map((sub, idx) => {
                  let badgeColor = 'bg-slate-100 text-slate-600 border-slate-200';
                  let badgeText = 'Anyone';
                  let completionText = sub.completed ? 'Completed' : 'Pending';
                  let completedCount = sub.completed ? 1 : 0;
                  let totalTarget = 1;

                  if (sub.assigneeType === 'individual') {
                    badgeColor = 'bg-amber-50 text-amber-600 border-amber-150';
                    badgeText = 'Individual';
                    completedCount = Array.isArray(sub.completedBy) ? sub.completedBy.length : 0;
                    totalTarget = members.length;
                    completionText = `${completedCount}/${totalTarget} done`;
                  } else if (sub.assigneeType === 'specific') {
                    badgeColor = 'bg-indigo-50 text-indigo-600 border-indigo-150';
                    badgeText = 'Specific';
                  }

                  const percent = totalTarget > 0 ? Math.round((completedCount / totalTarget) * 100) : 0;
                  const isExpanded = expandedSubtaskId === sub.id;

                  // Calculate Completed and Pending Lists
                  let completedList = [];
                  let pendingList = [];

                  if (sub.assigneeType === 'individual') {
                    completedList = members.filter(m => Array.isArray(sub.completedBy) && sub.completedBy.includes(m.uid));
                    pendingList = members.filter(m => !Array.isArray(sub.completedBy) || !sub.completedBy.includes(m.uid));
                  } else if (sub.assigneeType === 'specific') {
                    const assignedUids = Array.isArray(sub.assignedTo) ? sub.assignedTo : [sub.assignedTo].filter(Boolean);
                    const assignedMembers = members.filter(m => assignedUids.includes(m.uid));
                    if (sub.completed) {
                      completedList = assignedMembers;
                      pendingList = [];
                    } else {
                      completedList = [];
                      pendingList = assignedMembers;
                    }
                  } else { // 'all'
                    if (sub.completed) {
                      completedList = members;
                      pendingList = [];
                    } else {
                      completedList = [];
                      pendingList = members;
                    }
                  }

                  return (
                    <div key={sub.id || idx} className="py-3">
                      {/* Clickable Header Row */}
                      <div 
                        onClick={() => setExpandedSubtaskId(isExpanded ? null : sub.id)}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer hover:bg-slate-50/70 p-2 -mx-2 rounded-xl transition"
                      >
                        <div className="flex items-start space-x-2.5 min-w-0">
                          <CheckCircle2 className={`h-4 w-4 mt-0.5 shrink-0 ${percent === 100 ? 'text-emerald-500' : 'text-slate-300'}`} />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-700 truncate max-w-sm sm:max-w-md">{sub.title}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border ${badgeColor}`}>
                                {badgeText}
                              </span>
                              <span className="text-[10px] text-slate-450 font-semibold">{completionText}</span>
                            </div>
                          </div>
                        </div>

                        {/* Small progress meter */}
                        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                          <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-indigo-500 h-full rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 w-8 text-right">{percent}%</span>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Detailed Report Panel */}
                      {isExpanded && (
                        <div className="mt-2.5 p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-2.5 animate-in slide-in-from-top-2 duration-150">
                          <div className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                            Detailed Participant Audit
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Completed List */}
                            <div className="space-y-1.5">
                              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-55 border border-emerald-100 px-1.5 py-0.5 rounded uppercase tracking-wide">
                                Completed ({completedList.length})
                              </span>
                              {completedList.length > 0 ? (
                                <div className="space-y-1">
                                  {completedList.map(m => (
                                    <div key={m.uid} className="flex items-center space-x-1.5 text-slate-600">
                                      <div className="w-3.5 h-3.5 rounded-full bg-emerald-100 flex items-center justify-center text-[7px] text-emerald-700 font-bold shrink-0">✓</div>
                                      <span className="text-[10px] font-semibold truncate">{m.displayName || m.email.split('@')[0]}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-[10px] italic text-slate-400">None completed yet</p>
                              )}
                            </div>

                            {/* Pending List */}
                            <div className="space-y-1.5">
                              <span className="text-[9px] font-bold text-amber-600 bg-amber-55 border border-amber-100 px-1.5 py-0.5 rounded uppercase tracking-wide">
                                Pending ({pendingList.length})
                              </span>
                              {pendingList.length > 0 ? (
                                <div className="space-y-1">
                                  {pendingList.map(m => (
                                    <div key={m.uid} className="flex items-center space-x-1.5 text-slate-500">
                                      <div className="w-3.5 h-3.5 rounded-full bg-slate-200 flex items-center justify-center text-[7px] text-slate-600 font-bold shrink-0">-</div>
                                      <span className="text-[10px] font-semibold truncate">{m.displayName || m.email.split('@')[0]}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-[10px] italic text-slate-400">No pending participants</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Member Leaderboard Progress Report */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-4.5 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="h-4 w-4 text-slate-500" /> Member Progress Report
            </h4>

            <div className="space-y-3.5">
              {memberProgressList.map(({ member, assignedCount, completedCount, percentage }) => {
                const name = member.displayName || member.email;
                const initials = name.slice(0, 2).toUpperCase();

                return (
                  <div key={member.uid} className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/60 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                      {member.photoURL ? (
                        <img 
                          src={member.photoURL} 
                          alt={name} 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>

                    {/* Member Progress Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700 truncate">{name}</span>
                        <span className="text-[11px] text-slate-500 font-bold">
                          {assignedCount > 0 ? `${completedCount}/${assignedCount} items` : 'No items assigned'}
                        </span>
                      </div>
                      
                      {/* Member Progress Bar */}
                      {assignedCount > 0 && (
                        <div className="flex items-center space-x-2.5">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                percentage === 100 ? 'bg-emerald-500' : 'bg-indigo-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 w-8 text-right">
                            {percentage}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
