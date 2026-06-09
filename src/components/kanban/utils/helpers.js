import { TaskStatus } from '../../../types.js';

/**
 * Checks if a task's due date is in the past, excluding completed tasks.
 * @param {string} dueDate - Due date in YYYY-MM-DD format.
 * @param {string} status - Current status of the task.
 * @returns {boolean}
 */
export const isDeadlineOver = (dueDate, status) => {
  if (!dueDate || status === TaskStatus.DONE) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = dueDate.split('-').map(Number);
  const due = new Date(year, month - 1, day);
  due.setHours(0, 0, 0, 0);
  return due < today;
};
