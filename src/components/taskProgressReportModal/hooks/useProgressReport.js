import { useState } from 'react';

const normalizeCompletedBy = (completedBy) => {
  return (completedBy || []).map(item => typeof item === 'string' ? { uid: item, completedAt: null } : item);
};

export function useProgressReport(task, members) {
  const [expandedSubtaskId, setExpandedSubtaskId] = useState(null);

  const subtasks = task?.subtasks || [];
  const attachments = task?.attachments || [];

  let totalAssignedInstances = 0;
  let totalCompletedInstances = 0;

  const memberProgressList = members.map(member => {
    let assignedCount = 0;
    let completedCount = 0;
    let lateCount = 0;

    // Count late attachments for this member
    attachments.forEach(att => {
      if (att.lateSubmit && att.uploadedBy?.uid === member.uid) {
        lateCount++;
      }
    });

    subtasks.forEach(sub => {
      let isAssigned = false;
      let isDone = false;
      let isLate = false;

      if (sub.assigneeType === 'all' || !sub.assigneeType) {
        isAssigned = true;
        isDone = !!sub.completed;
        isLate = !!sub.completedAt && sub.completedByUid === member.uid;
      } else if (sub.assigneeType === 'individual') {
        isAssigned = true;
        const completedBy = normalizeCompletedBy(sub.completedBy);
        const doneItem = completedBy.find(item => item.uid === member.uid);
        isDone = !!doneItem;
        isLate = doneItem?.completedAt != null;
      } else if (sub.assigneeType === 'specific') {
        const assignedUids = Array.isArray(sub.assignedTo) ? sub.assignedTo : [sub.assignedTo].filter(Boolean);
        if (assignedUids.includes(member.uid)) {
          isAssigned = true;
          isDone = !!sub.completed;
          isLate = !!sub.completedAt && sub.completedByUid === member.uid;
        }
      }

      if (isAssigned) {
        assignedCount++;
        totalAssignedInstances++;
        if (isDone) {
          completedCount++;
          totalCompletedInstances++;
          if (isLate) lateCount++;
        }
      }
    });

    return {
      member,
      assignedCount,
      completedCount,
      lateCount,
      percentage: assignedCount > 0 ? Math.round((completedCount / assignedCount) * 100) : 0
    };
  });

  const overallCompletionPercentage = totalAssignedInstances > 0
    ? Math.round((totalCompletedInstances / totalAssignedInstances) * 100)
    : 0;

  const activeParticipantsCount = members.filter(m => {
    return subtasks.some(sub => {
      if (sub.assigneeType === 'individual') {
        return normalizeCompletedBy(sub.completedBy).some(item => item.uid === m.uid);
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
