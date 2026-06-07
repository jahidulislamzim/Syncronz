import { NextResponse } from 'next/server';
import { verifyFirebaseToken } from '../../../../src/lib/firebase/auth.js';
import { getConnectionById, getConnectionAccessToken } from '../../../../src/lib/drive-connection.js';

export async function GET(request) {
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
      return NextResponse.json({ ok: false, error: 'connectionId query param is required' }, { status: 400 });
    }

    const connection = await getConnectionById(connectionId, idToken);
    if (!connection) {
      return NextResponse.json({ ok: false, error: 'Drive connection not found' }, { status: 404 });
    }

    const hasCredentials = !!(connection.encryptedClientId && connection.encryptedClientSecret);
    const hasRefreshToken = !!connection.encryptedRefreshToken;

    if (!hasCredentials) {
      return NextResponse.json({
        ok: false,
        hasCredentials: false,
        hasRefreshToken,
        error: 'No API credentials stored for this connection. Click "Credentials" to add Client ID and Client Secret.',
      });
    }

    if (!hasRefreshToken) {
      return NextResponse.json({
        ok: false,
        hasCredentials: true,
        hasRefreshToken: false,
        error: 'No refresh token. Remove and reconnect this Drive account.',
      });
    }

    try {
      const accessToken = await getConnectionAccessToken(connection, idToken);
      return NextResponse.json({
        ok: true,
        hasCredentials: true,
        hasRefreshToken: true,
        message: 'Authentication successful. Drive connection is working.',
      });
    } catch (authErr) {
      return NextResponse.json({
        ok: false,
        hasCredentials: true,
        hasRefreshToken: true,
        error: authErr.message,
      });
    }
  } catch (error) {
    console.error('Drive health check error:', error);
    return NextResponse.json({ ok: false, error: error.message || 'Health check failed' }, { status: 500 });
  }
}
