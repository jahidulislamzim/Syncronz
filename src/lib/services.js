import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db, handleFirestoreError } from './firebase';
import { 
  TaskStatus, 
  TaskPriority, 
  MemberRole, 
  ActivityType, 
  NotificationType, 
  OperationType,
} from '../types';

export function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export async function createUserProfile(uid, displayName, photoURL, email) {
  const path = `users/${uid}`;
  try {
    const userDocRef = doc(db, 'users', uid);
    let existing;
    let isOffline = false;

    try {
      existing = await getDoc(userDocRef);
    } catch (readError) {
      if (readError instanceof Error && readError.message.includes('offline')) {
        isOffline = true;
        console.warn("Firestore client is offline during profile read; gracefully queuing setDoc with merge for offline synchronization.");
      } else {
        throw readError;
      }
    }

    const lowercaseEmail = email.toLowerCase();
    const envAdminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase();
    const shouldBeAdmin = envAdminEmail && lowercaseEmail === envAdminEmail;
    
    if (isOffline) {
      await setDoc(userDocRef, {
        uid,
        email,
        displayName: displayName || email.split('@')[0],
        photoURL: photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName || email)}`,
        lastActive: new Date().toISOString(),
        isAdmin: shouldBeAdmin,
        isAuthorized: true
      }, { merge: true });
    } else if (existing && !existing.exists()) {
      await setDoc(userDocRef, {
        uid,
        email,
        displayName: displayName || email.split('@')[0],
        photoURL: photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName || email)}`,
        lastActive: new Date().toISOString(),
        joinedBoards: [],
        isAdmin: shouldBeAdmin,
        isAuthorized: true
      });
    } else if (existing) {
      const data = existing.data();
      await updateDoc(userDocRef, {
        lastActive: new Date().toISOString(),
        email: email || data?.email,
        isAdmin: data && 'isAdmin' in data ? data.isAdmin : shouldBeAdmin,
        isAuthorized: data && 'isAuthorized' in data ? data.isAuthorized : true
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateUserProfile(uid, fields) {
  const path = `users/${uid}`;
  try {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, fields);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function addBoardToUserProfile(userId, boardId) {
  const path = `users/${userId}`;
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      joinedBoards: arrayUnion(boardId)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function removeBoardFromUserProfile(userId, boardId) {
  const path = `users/${userId}`;
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      joinedBoards: arrayRemove(boardId)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function getUserProfile(uid) {
  const path = `users/${uid}`;
  try {
    const docRef = doc(db, 'users', uid);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? snapshot.data() : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function getAllUsers() {
  const path = `users`;
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function inviteUser(email, invitedByUid, displayName) {
  const emailLower = email.toLowerCase().trim();
  const inviteRef = doc(db, 'invited_users', emailLower);
  await setDoc(inviteRef, {
    email: emailLower,
    invitedBy: invitedByUid,
    invitedAt: new Date().toISOString(),
    displayName: displayName || '',
    status: 'pending'
  });
}

export async function revokeInvite(email) {
  const emailLower = email.toLowerCase().trim();
  await deleteDoc(doc(db, 'invited_users', emailLower));
}

export async function getInvitedUsers() {
  const snapshot = await getDocs(collection(db, 'invited_users'));
  return snapshot.docs.map(d => d.data());
}

export async function getAdminEmail() {
  try {
    const docSnap = await getDoc(doc(db, 'settings', 'admin'));
    if (docSnap.exists()) {
      return docSnap.data().email || null;
    }
  } catch (_) {}
  return process.env.NEXT_PUBLIC_ADMIN_EMAIL || null;
}

export async function createBoard(name, description, creatorId, creatorProfile) {
  const boardId = 'board_' + generateId();
  const boardPath = `boards/${boardId}`;
  
  try {
    const boardDocRef = doc(db, 'boards', boardId);
    const now = serverTimestamp();
    await setDoc(boardDocRef, {
      boardId,
      name,
      description: description || '',
      creatorId,
      createdAt: now,
      updatedAt: now
    });

    const memberDocRef = doc(db, 'boards', boardId, 'members', creatorId);
    await setDoc(memberDocRef, {
      uid: creatorId,
      email: creatorProfile.email,
      displayName: creatorProfile.displayName,
      photoURL: creatorProfile.photoURL,
      role: MemberRole.OWNER,
      joinedAt: now
    });

    await addActivityLog(
      boardId,
      ActivityType.BOARD_JOINED,
      creatorId,
      creatorProfile.displayName,
      creatorProfile.photoURL,
      `created the board "${name}"`
    );

    await addBoardToUserProfile(creatorId, boardId);

    return boardId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, boardPath);
  }
}

export async function getBoards() {
  const path = `boards`;
  try {
    const snapshot = await getDocs(collection(db, 'boards'));
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function joinBoard(
  boardId, 
  user, 
  role = MemberRole.MEMBER
) {
  const path = `boards/${boardId}/members/${user.uid}`;
  try {
    const boardDoc = await getDoc(doc(db, 'boards', boardId));
    if (!boardDoc.exists()) {
      throw new Error(`Board with ID "${boardId}" not found.`);
    }

    const boardName = boardDoc.data().name;

    const memberRef = doc(db, 'boards', boardId, 'members', user.uid);
    const existing = await getDoc(memberRef);
    if (existing.exists()) {
      return;
    }

    const now = serverTimestamp();
    await setDoc(memberRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role,
      joinedAt: now
    });

    await addActivityLog(
      boardId,
      ActivityType.BOARD_JOINED,
      user.uid,
      user.displayName,
      user.photoURL,
      `joined the board as a ${role}`
    );

    await addBoardToUserProfile(user.uid, boardId);

    const boardOwnerId = boardDoc.data().creatorId;
    if (boardOwnerId !== user.uid) {
      await addNotification(
        boardOwnerId,
        boardId,
        boardName,
        undefined,
        'New Member Joined',
        `${user.displayName} joined your board "${boardName}"`,
        NotificationType.JOINED
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function leaveBoard(boardId, userId, userName, userPhoto) {
  const path = `boards/${boardId}/members/${userId}`;
  try {
    await deleteDoc(doc(db, 'boards', boardId, 'members', userId));
    
    await addActivityLog(
      boardId,
      ActivityType.BOARD_JOINED,
      userId,
      userName,
      userPhoto,
      `left the board`
    );

    await removeBoardFromUserProfile(userId, boardId);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createTask(
  boardId,
  title,
  description,
  priority,
  dueDate,
  assignee,
  creator
) {
  const taskId = 'task_' + generateId();
  const path = `boards/${boardId}/tasks/${taskId}`;
  try {
    const taskRef = doc(db, 'boards', boardId, 'tasks', taskId);
    const now = serverTimestamp();
    
    await setDoc(taskRef, {
      taskId,
      boardId,
      title,
      description: description || '',
      status: TaskStatus.TODO,
      priority,
      dueDate: dueDate || '',
      assigneeId: assignee?.uid || '',
      assigneeName: assignee?.displayName || '',
      assigneePhoto: assignee?.photoURL || '',
      creatorId: creator.uid,
      createdAt: now,
      updatedAt: now
    });

    await addActivityLog(
      boardId,
      ActivityType.TASK_CREATED,
      creator.uid,
      creator.displayName,
      creator.photoURL,
      `created task "${title}"`
    );

    if (assignee && assignee.uid !== creator.uid) {
      const boardDoc = await getDoc(doc(db, 'boards', boardId));
      const boardName = boardDoc.exists() ? boardDoc.data().name : 'Project Board';
      
      await addNotification(
        assignee.uid,
        boardId,
        boardName,
        taskId,
        'Task Assigned to You',
        `${creator.displayName} assigned "${title}" to you on board "${boardName}"`,
        NotificationType.ASSIGNMENT
      );
    }

    return taskId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateTaskStatus(
  boardId,
  taskId,
  newStatus,
  user
) {
  const path = `boards/${boardId}/tasks/${taskId}`;
  try {
    const taskRef = doc(db, 'boards', boardId, 'tasks', taskId);
    const taskSnap = await getDoc(taskRef);
    if (!taskSnap.exists()) return;
    
    const oldStatus = taskSnap.data().status;
    if (oldStatus === newStatus) return;

    await updateDoc(taskRef, {
      status: newStatus,
      updatedAt: serverTimestamp()
    });

    const statusLabels = {
      'todo': 'To Do',
      'in_progress': 'In Progress',
      'review': 'In Review',
      'done': 'Completed'
    };

    await addActivityLog(
      boardId,
      ActivityType.TASK_MOVED,
      user.uid,
      user.displayName,
      user.photoURL,
      `moved task "${taskSnap.data().title}" from ${statusLabels[oldStatus]} to ${statusLabels[newStatus]}`
    );

    const taskData = taskSnap.data();
    const boardDoc = await getDoc(doc(db, 'boards', boardId));
    const boardName = boardDoc.exists() ? boardDoc.data().name : 'Project Board';

    const notifyIds = new Set();
    if (taskData.creatorId && taskData.creatorId !== user.uid) notifyIds.add(taskData.creatorId);
    if (taskData.assigneeId && taskData.assigneeId !== user.uid) notifyIds.add(taskData.assigneeId);

    for (const notifyId of notifyIds) {
      await addNotification(
        notifyId,
        boardId,
        boardName,
        taskId,
        'Task Status Updated',
        `${user.displayName} moved "${taskData.title}" to ${statusLabels[newStatus]}`,
        NotificationType.UPDATE
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateTaskDetails(
  boardId,
  taskId,
  fields,
  user
) {
  const path = `boards/${boardId}/tasks/${taskId}`;
  try {
    const taskRef = doc(db, 'boards', boardId, 'tasks', taskId);
    const taskSnap = await getDoc(taskRef);
    if (!taskSnap.exists()) return;

    const oldTask = taskSnap.data();

    await updateDoc(taskRef, {
      ...fields,
      updatedAt: serverTimestamp()
    });

    const hasAssigneeChanged = fields.assigneeId !== undefined && fields.assigneeId !== oldTask.assigneeId;

    if (hasAssigneeChanged) {
      const actorName = user.displayName;
      const title = oldTask.title;
      const boardDoc = await getDoc(doc(db, 'boards', boardId));
      const boardName = boardDoc.exists() ? boardDoc.data().name : 'Project Board';

      const assigneeMsg = fields.assigneeName ? `assigned task "${title}" to ${fields.assigneeName}` : `removed assignee from task "${title}"`;
      await addActivityLog(
        boardId,
        ActivityType.TASK_ASSIGNED,
        user.uid,
        user.displayName,
        user.photoURL,
        assigneeMsg
      );

      if (fields.assigneeId && fields.assigneeId !== user.uid) {
        await addNotification(
          fields.assigneeId,
          boardId,
          boardName,
          taskId,
          'Task Assigned to You',
          `${actorName} assigned "${title}" to you on board "${boardName}"`,
          NotificationType.ASSIGNMENT
        );
      }
    } else {
      await addActivityLog(
        boardId,
        ActivityType.TASK_UPDATED,
        user.uid,
        user.displayName,
        user.photoURL,
        `updated task "${oldTask.title}" details`
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteTask(boardId, taskId, user) {
  const path = `boards/${boardId}/tasks/${taskId}`;
  try {
    const taskRef = doc(db, 'boards', boardId, 'tasks', taskId);
    const taskSnap = await getDoc(taskRef);
    if (!taskSnap.exists()) return;

    const taskTitle = taskSnap.data().title;
    await deleteDoc(taskRef);

    await addActivityLog(
      boardId,
      ActivityType.TASK_UPDATED,
      user.uid,
      user.displayName,
      user.photoURL,
      `deleted task "${taskTitle}"`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function addActivityLog(
  boardId,
  type,
  userId,
  userName,
  userPhoto,
  details
) {
  const activityId = 'act_' + generateId();
  try {
    const logRef = doc(db, 'boards', boardId, 'activity', activityId);
    await setDoc(logRef, {
      activityId,
      type,
      userId,
      userName,
      userPhoto,
      details,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Activity logging failed cleanly in background: ", error);
  }
}

export async function addNotification(
  targetUserId,
  boardId,
  boardName,
  taskId,
  title,
  message,
  type
) {
  const notificationId = 'notif_' + generateId();
  try {
    const notifRef = doc(db, 'users', targetUserId, 'notifications', notificationId);
    await setDoc(notifRef, {
      notificationId,
      boardId,
      boardName,
      taskId: taskId || '',
      title,
      message,
      read: false,
      type,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.warn("Notification delivery skipped or restricted per security rules: ", error);
  }
}

export async function markNotificationAsRead(userId, notificationId) {
  const path = `users/${userId}/notifications/${notificationId}`;
  try {
    const notifRef = doc(db, 'users', userId, 'notifications', notificationId);
    await updateDoc(notifRef, {
      read: true
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function clearAllNotifications(userId, notificationIds) {
  try {
    for (const notifId of notificationIds) {
      await deleteDoc(doc(db, 'users', userId, 'notifications', notifId));
    }
  } catch (error) {
    console.warn("Clearing notifications error: ", error);
  }
}

export async function deleteUserProfile(uid) {
  try {
    await deleteDoc(doc(db, 'users', uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${uid}`);
  }
}

export async function saveFocusSession(userId, session) {
  try {
    await setDoc(doc(db, 'users', userId, 'focusSessions', session.id), session);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${userId}/focusSessions/${session.id}`);
  }
}

export async function getFocusSessions(userId) {
  try {
    const snapshot = await getDocs(
      query(collection(db, 'users', userId, 'focusSessions'), orderBy('completedAt', 'desc'))
    );
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `users/${userId}/focusSessions`);
    return [];
  }
}
