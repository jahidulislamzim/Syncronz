import { NextResponse } from 'next/server';
import { verifyFirebaseToken } from '../../../../src/lib/firebase/auth.js';
import { readDocument } from '../../../../src/lib/firebase/firestore.js';
import { getDriveAccessTokenForBoard } from '../../../../src/lib/drive-connection.js';
import { deleteFile } from '../../../../src/lib/drive.js';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const DATABASE_ID = process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID || '(default)';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents`;

function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function toValue(val) {
  if (val === undefined) return null;
  if (val === null) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val)
      ? { integerValue: String(val) }
      : { doubleValue: val };
  }
  if (typeof val === 'boolean') return { booleanValue: val };
  if (val instanceof Date) return { timestampValue: val.toISOString() };
  if (Array.isArray(val)) {
    const mapped = val.map(v => toValue(v)).filter(Boolean);
    return { arrayValue: mapped.length > 0 ? { values: mapped } : {} };
  }
  if (typeof val === 'object') {
    return { mapValue: { fields: toFields(val) } };
  }
  return null;
}

function toFields(obj) {
  const fields = {};
  for (const [key, value] of Object.entries(obj)) {
    const v = toValue(value);
    if (v) fields[key] = v;
  }
  return fields;
}

export async function DELETE(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 });
    }
    const idToken = authHeader.slice(7);
    const tokenUser = await verifyFirebaseToken(idToken);

    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get('boardId');
    const taskId = searchParams.get('taskId');

    if (!boardId || !taskId) {
      return NextResponse.json({ error: 'boardId and taskId are required' }, { status: 400 });
    }

    // Read the task to get attachments and title
    const taskDoc = await readDocument(`boards/${boardId}/tasks`, taskId, idToken);
    if (!taskDoc) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const { title, attachments } = taskDoc;

    // Delete associated files from Google Drive
    let deletedFiles = 0;
    let failedFiles = 0;

    if (attachments && attachments.length > 0) {
      const driveFileIds = attachments
        .filter(a => a.driveFileId)
        .map(a => ({ id: a.driveFileId, name: a.name }));

      if (driveFileIds.length > 0) {
        try {
          const accessToken = await getDriveAccessTokenForBoard(boardId, idToken);
          const results = await Promise.allSettled(
            driveFileIds.map(f => deleteFile(accessToken, f.id))
          );
          deletedFiles = results.filter(r => r.status === 'fulfilled').length;
          failedFiles = results.filter(r => r.status === 'rejected').length;
        } catch (err) {
          console.error('Failed to get Drive access token for file cleanup:', err);
          failedFiles = driveFileIds.length;
        }
      }
    }

    // Delete task document from Firestore via REST API
    const taskUrl = `${BASE_URL}/boards/${boardId}/tasks/${taskId}`;
    const deleteRes = await fetch(taskUrl, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (!deleteRes.ok) {
      const errText = await deleteRes.text();
      throw new Error(`Failed to delete task document: ${deleteRes.status} - ${errText}`);
    }

    // Add activity log entry
    const activityId = 'act_' + generateId();
    const logRef = `${BASE_URL}/boards/${boardId}/activity?documentId=${activityId}`;
    const activityData = {
      activityId,
      type: 'task_deleted',
      userId: tokenUser.uid,
      userName: tokenUser.email || 'User',
      userPhoto: '',
      details: `deleted task "${title || taskId}"`,
      createdAt: new Date().toISOString(),
    };
    await fetch(logRef, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ fields: toFields(activityData) }),
    });

    return NextResponse.json({
      success: true,
      deletedFiles,
      failedFiles,
    });
  } catch (error) {
    console.error('Task deletion error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete task' }, { status: 500 });
  }
}
