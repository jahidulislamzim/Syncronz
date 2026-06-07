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
    const keyHex = process.env.SMTP_ENCRYPTION_KEY;

    return NextResponse.json({
      connections: connections.map((c) => {
        let clientId = null;
        try {
          if (c.encryptedClientId) {
            clientId = decrypt(c.encryptedClientId, keyHex);
          }
        } catch (e) {
          console.warn('Failed to decrypt connection clientId:', e);
        }
        return {
          connectionId: c.connectionId,
          label: c.label,
          googleEmail: c.googleEmail,
          createdAt: c.createdAt,
          createdBy: c.createdBy,
          lastUsedAt: c.lastUsedAt,
          clientId,
          hasCustomCredentials: !!c.encryptedClientSecret,
        };
      }),
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
    const { accessToken, refreshToken, googleEmail, label, clientId, clientSecret } = body;

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
      encryptedClientId: clientId ? encrypt(clientId.trim(), keyHex) : null,
      encryptedClientSecret: clientSecret ? encrypt(clientSecret.trim(), keyHex) : null,
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
        clientId: clientId || null,
        hasCustomCredentials: !!clientSecret,
      },
    });
  } catch (error) {
    console.error('Drive connection save error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save connection' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 });
    }
    const idToken = authHeader.slice(7);
    const tokenUser = await verifyFirebaseToken(idToken);

    // Verify admin
    const { readDocument: readDoc } = await import('../../../src/lib/firebase/firestore.js');
    const userProfile = await readDoc('users', tokenUser.uid, idToken);
    if (!userProfile?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { connectionId, clientId, clientSecret } = body;

    if (!connectionId) {
      return NextResponse.json({ error: 'connectionId is required' }, { status: 400 });
    }

    const keyHex = process.env.SMTP_ENCRYPTION_KEY;
    const existing = await readDocument('settings', 'driveConnections', idToken);
    const list = existing?.list || [];
    const idx = list.findIndex((c) => c.connectionId === connectionId);

    if (idx === -1) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Update credentials - allow clearing by passing empty string
    list[idx] = {
      ...list[idx],
      encryptedClientId: clientId?.trim() ? encrypt(clientId.trim(), keyHex) : null,
      encryptedClientSecret: clientSecret?.trim() ? encrypt(clientSecret.trim(), keyHex) : null,
      credentialsUpdatedAt: new Date().toISOString(),
      credentialsUpdatedBy: tokenUser.email || tokenUser.uid,
    };

    await writeDocument('settings', 'driveConnections', { list }, idToken);

    const updatedClientId = clientId?.trim() ? clientId.trim() : null;

    return NextResponse.json({
      success: true,
      connection: {
        connectionId,
        clientId: updatedClientId,
        hasCustomCredentials: !!(clientSecret?.trim()),
      },
    });
  } catch (error) {
    console.error('Drive connection update error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update connection' }, { status: 500 });
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
