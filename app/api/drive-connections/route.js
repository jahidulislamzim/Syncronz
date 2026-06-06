import { NextResponse } from 'next/server';
import { verifyFirebaseToken } from '../../../src/lib/firebase/auth.js';
import { readDocument, writeDocument, generateId } from '../../../src/lib/firebase/firestore.js';
import { encrypt, decrypt } from '../../../src/lib/crypto.js';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 });
    }
    const idToken = authHeader.slice(7);
    await verifyFirebaseToken(idToken);

    const data = await readDocument('settings', 'driveConnections', idToken);
    const connections = data?.list || [];

    return NextResponse.json({
      connections: connections.map((c) => ({
        connectionId: c.connectionId,
        label: c.label,
        googleEmail: c.googleEmail,
        createdAt: c.createdAt,
        createdBy: c.createdBy,
        lastUsedAt: c.lastUsedAt,
      })),
    });
  } catch (error) {
    console.error('Drive connections read error:', error);
    return NextResponse.json({ error: error.message || 'Failed to read connections' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 });
    }
    const idToken = authHeader.slice(7);
    const tokenUser = await verifyFirebaseToken(idToken);

    const body = await request.json();
    const { accessToken, refreshToken, googleEmail, label } = body;

    if (!accessToken || !googleEmail) {
      return NextResponse.json({ error: 'accessToken and googleEmail are required' }, { status: 400 });
    }

    const keyHex = process.env.SMTP_ENCRYPTION_KEY;
    const connectionId = 'conn_' + generateId();

    const connection = {
      connectionId,
      label: label || googleEmail,
      googleEmail,
      encryptedAccessToken: encrypt(accessToken, keyHex),
      encryptedRefreshToken: refreshToken ? encrypt(refreshToken, keyHex) : null,
      scope: 'https://www.googleapis.com/auth/drive.file',
      createdAt: new Date().toISOString(),
      createdBy: tokenUser.email || tokenUser.uid,
      lastUsedAt: new Date().toISOString(),
    };

    const existing = await readDocument('settings', 'driveConnections', idToken);
    const list = existing?.list || [];
    list.push(connection);

    await writeDocument('settings', 'driveConnections', { list }, idToken);

    return NextResponse.json({
      success: true,
      connection: {
        connectionId,
        label: connection.label,
        googleEmail: connection.googleEmail,
        createdAt: connection.createdAt,
      },
    });
  } catch (error) {
    console.error('Drive connection save error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save connection' }, { status: 500 });
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
    const connectionId = searchParams.get('connectionId');

    if (!connectionId) {
      return NextResponse.json({ error: 'connectionId query param is required' }, { status: 400 });
    }

    const existing = await readDocument('settings', 'driveConnections', idToken);
    const list = existing?.list || [];
    const filtered = list.filter((c) => c.connectionId !== connectionId);

    if (filtered.length === list.length) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    await writeDocument('settings', 'driveConnections', { list: filtered }, idToken);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Drive connection delete error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete connection' }, { status: 500 });
  }
}
