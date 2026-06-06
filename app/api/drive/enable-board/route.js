import { NextResponse } from 'next/server';
import { verifyFirebaseToken } from '../../../../src/lib/firebase/auth.js';
import { readDocument, writeDocument } from '../../../../src/lib/firebase/firestore.js';
import { getConnectionById, getConnectionAccessToken } from '../../../../src/lib/drive-connection.js';
import { ensureFolder, getFileMetadata } from '../../../../src/lib/drive.js';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 });
    }
    const idToken = authHeader.slice(7);
    const tokenUser = await verifyFirebaseToken(idToken);

    const body = await request.json();
    let { boardId, boardName, connectionId } = body;
    boardId = boardId?.trim();
    connectionId = connectionId?.trim();

    if (!boardId || !connectionId) {
      return NextResponse.json({ error: `boardId and connectionId are required (got boardId=${JSON.stringify(boardId)}, connectionId=${JSON.stringify(connectionId)})` }, { status: 400 });
    }

    const connection = await getConnectionById(connectionId, idToken);
    if (!connection) {
      return NextResponse.json({ error: 'Drive connection not found' }, { status: 400 });
    }

    const accessToken = await getConnectionAccessToken(connection, idToken);

    const safeBoardName = (boardName || boardId).replace(/[^a-zA-Z0-9 _-]/g, '').trim() || boardId;
    const folderId = await ensureFolder(accessToken, ['Syncronz', safeBoardName]);
    const metadata = await getFileMetadata(accessToken, folderId);

    const updateData = {
      driveEnabled: true,
      driveConnectionId: connectionId,
      driveFolderId: folderId,
      driveFolderUrl: metadata.webViewLink || `https://drive.google.com/drive/folders/${folderId}`,
      driveUpdatedBy: tokenUser.email || tokenUser.uid,
      driveUpdatedAt: new Date().toISOString(),
    };

    await writeDocument('boards', boardId, updateData, idToken);

    return NextResponse.json({
      success: true,
      folderId,
      folderUrl: updateData.driveFolderUrl,
      folderName: safeBoardName,
      connectionEmail: connection.googleEmail,
    });
  } catch (error) {
    console.error('Enable board Drive error:', error);
    return NextResponse.json({ error: error.message || 'Failed to enable Google Drive' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 });
    }
    const idToken = authHeader.slice(7);
    await verifyFirebaseToken(idToken);

    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get('boardId');

    if (!boardId) {
      return NextResponse.json({ error: 'boardId query param is required' }, { status: 400 });
    }

    const updateData = {
      driveEnabled: false,
      driveConnectionId: null,
      driveFolderId: null,
      driveFolderUrl: null,
      driveUpdatedAt: new Date().toISOString(),
    };

    await writeDocument('boards', boardId, updateData, idToken);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Disable board Drive error:', error);
    return NextResponse.json({ error: error.message || 'Failed to disable Google Drive' }, { status: 500 });
  }
}
