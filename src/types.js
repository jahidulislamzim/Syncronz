export const TaskStatus = { TODO: 'todo', IN_PROGRESS: 'in_progress', REVIEW: 'review', DONE: 'done' };

export const TaskPriority = { LOW: 'low', MEDIUM: 'medium', HIGH: 'high' };

export const MemberRole = { OWNER: 'owner', MEMBER: 'member' };

export const ActivityType = {
  TASK_CREATED: 'task_created',
  TASK_UPDATED: 'task_updated',
  TASK_MOVED: 'task_moved',
  TASK_ASSIGNED: 'task_assigned',
  BOARD_JOINED: 'board_joined',
  COMMENT_ADDED: 'comment_added',
};

export const NotificationType = {
  ASSIGNMENT: 'assignment',
  UPDATE: 'update',
  COMMENT: 'comment',
  MENTION: 'mention',
  JOINED: 'joined',
};

export const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
};
