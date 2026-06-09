import { useState } from 'react';

export function useProgressReport(task, members) {
  const [expandedSubtaskId, setExpandedSubtaskId] = useState(null);

  const subtasks = task?.subtasks || [];

  let totalAssignedInstances = 0;
  let totalCompletedInstances = 0;

  const memberProgressList = members.map(member => {
    let assignedCount = 0;
    let completedCount = 0;

    subtasks.forEach(sub => {
      let isAssigned = false;
      let isDone = false;

      if (sub.assigneeType === 'all' || !sub.assigneeType) {
        isAssigned = true;
        isDone = !!sub.completed;
      } else if (sub.assigneeType === 'individual') {
        isAssigned = true;
        isDone = Array.isArray(sub.completedBy) && sub.completedBy.includes(member.uid);
      } else if (sub.assigneeType === 'specific') {
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

  return {
    subtasks,
    memberProgressList,
    overallCompletionPercentage,
    totalAssignedInstances,
    totalCompletedInstances,
    activeParticipantsCount,
    expandedSubtaskId,
    setExpandedSubtaskId,
  };
}
