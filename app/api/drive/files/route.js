import { NextResponse } from 'next/server';
import { verifyFirebaseToken } from '../../../../src/lib/firebase/auth.js';
import { getConnectionById, getConnectionAccessToken } from '../../../../src/lib/drive-connection.js';
import { deleteFile } from '../../../../src/lib/drive.js';
import { readDocument } from '../../../../src/lib/firebase/firestore.js';

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
    const driveFileId = searchParams.get('fileId');

    if (!boardId || !driveFileId) {
      return NextResponse.json({ error: 'boardId and fileId are required' }, { status: 400 });
    }

    const board = await readDocument('boards', boardId, idToken);
    if (!board?.driveConnectionId) {
      return NextResponse.json({ error: 'Board has no Drive connection' }, { status: 400 });
    }

    const connection = await getConnectionById(board.driveConnectionId, idToken);
    if (!connection) {
      return NextResponse.json({ error: 'Drive connection not found' }, { status: 400 });
    }

    const accessToken = await getConnectionAccessToken(connection, idToken);
    await deleteFile(accessToken, driveFileId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Drive file delete error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete file from Drive' }, { status: 500 });
  }
}
