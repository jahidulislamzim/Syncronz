import { NextResponse } from 'next/server';
import { verifyFirebaseToken } from '../../../../src/lib/firebase/auth.js';
import { readDocument } from '../../../../src/lib/firebase/firestore.js';
import { getDriveAccessTokenForBoard, getConnectionById, getConnectionAccessToken } from '../../../../src/lib/drive-connection.js';
import { ensureFolder, initResumableUpload } from '../../../../src/lib/drive.js';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 });
    }
    const idToken = authHeader.slice(7);
    await verifyFirebaseToken(idToken);

    const body = await request.json();
    const { fileName, fileSize, mimeType, boardId, boardName } = body;

    if (!fileName || !fileSize || !mimeType || !boardId) {
      return NextResponse.json({ error: 'fileName, fileSize, mimeType, and boardId are required' }, { status: 400 });
    }

    // Try board-assigned connection first
    const board = await readDocument('boards', boardId, idToken);
    let accessToken;
    let folderId;

    if (board?.driveConnectionId) {
      const connection = await getConnectionById(board.driveConnectionId, idToken);
      if (!connection) {
        return NextResponse.json({ error: 'Assigned Drive connection not found' }, { status: 400 });
      }
      accessToken = await getConnectionAccessToken(connection, idToken);

      if (board.driveFolderId) {
        folderId = board.driveFolderId;
      } else {
        const safeBoardName = (boardName || boardId).replace(/[^a-zA-Z0-9 _-]/g, '').trim() || boardId;
        folderId = await ensureFolder(accessToken, ['Syncronz', safeBoardName]);
      }
    } else {
      // Fallback: check for legacy global settings/drive SA
      const driveData = await readDocument('settings', 'drive', idToken);
      if (!driveData?.encryptedKey) {
        return NextResponse.json({ error: 'Google Drive not configured for this board' }, { status: 400 });
      }
      const { decrypt } = await import('../../../../src/lib/crypto.js');
      const { getAccessToken } = await import('../../../../src/lib/drive-auth.js');
      const keyHex = process.env.SMTP_ENCRYPTION_KEY;
      const decrypted = decrypt(driveData.encryptedKey, keyHex);
      const saJson = JSON.parse(decrypted);
      accessToken = await getAccessToken(saJson);

      const safeBoardName = (boardName || boardId).replace(/[^a-zA-Z0-9 _-]/g, '').trim() || boardId;
      folderId = await ensureFolder(accessToken, ['Syncronz', safeBoardName]);
    }

    const sessionUrl = await initResumableUpload(accessToken, fileName, fileSize, mimeType, folderId);

    return NextResponse.json({ sessionUrl, parentFolderId: folderId });
  } catch (error) {
    console.error('Drive init upload error:', error);
    return NextResponse.json({ error: error.message || 'Failed to initialize upload' }, { status: 500 });
  }
}
