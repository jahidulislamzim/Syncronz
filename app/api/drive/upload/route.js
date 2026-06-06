import { NextResponse } from 'next/server';
import { verifyFirebaseToken } from '../../../../src/lib/firebase/auth.js';
import { getBoardDriveConnection, getDriveAccessTokenForBoard } from '../../../../src/lib/drive-connection.js';
import { initResumableUpload, setPublicPermission, getFileMetadata } from '../../../../src/lib/drive.js';
import { readDocument } from '../../../../src/lib/firebase/firestore.js';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 });
    }
    const idToken = authHeader.slice(7);
    await verifyFirebaseToken(idToken);

    const formData = await request.formData();
    const file = formData.get('file');
    const boardId = formData.get('boardId');
    const boardName = formData.get('boardName');

    if (!file || !boardId) {
      return NextResponse.json({ error: 'file and boardId are required' }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Invalid file' }, { status: 400 });
    }

    const fileName = file.name;
    const mimeType = file.type || 'application/octet-stream';
    const fileBuffer = await file.arrayBuffer();
    const fileSize = fileBuffer.byteLength;

    if (fileSize === 0) {
      return NextResponse.json({ error: 'File is empty' }, { status: 400 });
    }

    const board = await readDocument('boards', boardId, idToken);
    if (!board?.driveConnectionId) {
      return NextResponse.json({ error: 'Board does not have a Drive connection assigned' }, { status: 400 });
    }

    let accessToken;
    let folderId;

    if (board.driveFolderId) {
      folderId = board.driveFolderId;
      accessToken = await getDriveAccessTokenForBoard(boardId, idToken);
    } else {
      const connection = await getBoardDriveConnection(boardId, idToken);
      const { getConnectionAccessToken } = await import('../../../../src/lib/drive-connection.js');
      accessToken = await getConnectionAccessToken(connection, idToken);
      const { ensureFolder } = await import('../../../../src/lib/drive.js');
      const safeBoardName = (boardName || boardId).replace(/[^a-zA-Z0-9 _-]/g, '').trim() || boardId;
      folderId = await ensureFolder(accessToken, ['Syncronz', safeBoardName]);
    }

    const sessionUrl = await initResumableUpload(accessToken, fileName, fileSize, mimeType, folderId);

    const uploadRes = await fetch(sessionUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': mimeType,
        'Content-Length': String(fileSize),
      },
      body: fileBuffer,
    });
    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      return NextResponse.json({ error: `Drive upload failed: ${err}` }, { status: 502 });
    }
    const driveFile = await uploadRes.json();

    await setPublicPermission(accessToken, driveFile.id);
    const metadata = await getFileMetadata(accessToken, driveFile.id);

    return NextResponse.json({
      id: `drive_${Math.random().toString(36).substring(2, 9)}`,
      name: metadata.name || fileName,
      url: metadata.webViewLink || `https://drive.google.com/file/d/${driveFile.id}/view`,
      driveFileId: driveFile.id,
      size: Number(metadata.size || fileSize),
      mimeType: metadata.mimeType || mimeType,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Drive upload error:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload file' }, { status: 500 });
  }
}
