import { NextResponse } from 'next/server';
import { verifyFirebaseToken } from '../../../../src/lib/firebase/auth.js';
import { readDocument } from '../../../../src/lib/firebase/firestore.js';
import { getConnectionById, getConnectionAccessToken } from '../../../../src/lib/drive-connection.js';
import { setPublicPermission, getFileMetadata } from '../../../../src/lib/drive.js';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 });
    }
    const idToken = authHeader.slice(7);
    await verifyFirebaseToken(idToken);

    const body = await request.json();
    const { fileId, boardId } = body;

    if (!fileId || !boardId) {
      return NextResponse.json({ error: 'fileId and boardId are required' }, { status: 400 });
    }

    const board = await readDocument('boards', boardId, idToken);
    let accessToken;

    if (board?.driveConnectionId) {
      const connection = await getConnectionById(board.driveConnectionId, idToken);
      if (!connection) {
        return NextResponse.json({ error: 'Assigned Drive connection not found' }, { status: 400 });
      }
      accessToken = await getConnectionAccessToken(connection, idToken);
    } else {
      const driveData = await readDocument('settings', 'drive', idToken);
      if (!driveData?.encryptedKey) {
        return NextResponse.json({ error: 'Google Drive not configured' }, { status: 400 });
      }
      const { decrypt } = await import('../../../../src/lib/crypto.js');
      const { getAccessToken } = await import('../../../../src/lib/drive-auth.js');
      const keyHex = process.env.SMTP_ENCRYPTION_KEY;
      const decrypted = decrypt(driveData.encryptedKey, keyHex);
      const saJson = JSON.parse(decrypted);
      accessToken = await getAccessToken(saJson);
    }

    await setPublicPermission(accessToken, fileId);
    const metadata = await getFileMetadata(accessToken, fileId);

    return NextResponse.json({
      id: `drive_${Math.random().toString(36).substring(2, 9)}`,
      name: metadata.name || 'Unnamed',
      url: metadata.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
      driveFileId: fileId,
      size: Number(metadata.size) || 0,
      mimeType: metadata.mimeType || 'application/octet-stream',
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Drive finalize error:', error);
    return NextResponse.json({ error: error.message || 'Failed to finalize upload' }, { status: 500 });
  }
}
