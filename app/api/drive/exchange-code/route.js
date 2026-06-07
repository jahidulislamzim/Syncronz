import { NextResponse } from 'next/server';
import { verifyFirebaseToken } from '../../../../src/lib/firebase/auth.js';
import { readDocument, writeDocument, generateId } from '../../../../src/lib/firebase/firestore.js';
import { encrypt } from '../../../../src/lib/crypto.js';

function decodeIdToken(idToken) {
  try {
    const payload = idToken.split('.')[1];
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
    return decoded;
  } catch {
    return {};
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
    const { code, clientId, clientSecret, label, redirectUri } = body;

    if (!code || !clientId || !clientSecret || !redirectUri) {
      return NextResponse.json({ error: 'code, clientId, clientSecret, and redirectUri are required' }, { status: 400 });
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      return NextResponse.json({ error: `Token exchange failed: ${errText}` }, { status: 502 });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token || null;

    if (!accessToken) {
      return NextResponse.json({ error: 'No access token received from Google' }, { status: 502 });
    }

    let googleEmail = '';
    if (tokenData.id_token) {
      const payload = decodeIdToken(tokenData.id_token);
      googleEmail = payload.email || '';
    }

    if (!googleEmail) {
      try {
        const infoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (infoRes.ok) {
          const info = await infoRes.json();
          googleEmail = info.email || '';
        }
      } catch (e) {
        console.warn('Failed to fetch user email:', e);
      }
    }

    const keyHex = process.env.SMTP_ENCRYPTION_KEY;
    const connectionId = 'conn_' + generateId();
    const connectionLabel = label || googleEmail || 'My Drive';

    const connection = {
      connectionId,
      label: connectionLabel,
      googleEmail: googleEmail || '',
      encryptedAccessToken: encrypt(accessToken, keyHex),
      encryptedRefreshToken: refreshToken ? encrypt(refreshToken, keyHex) : null,
      encryptedClientId: encrypt(clientId.trim(), keyHex),
      encryptedClientSecret: encrypt(clientSecret.trim(), keyHex),
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
        hasCustomCredentials: true,
      },
    });
  } catch (error) {
    console.error('Drive exchange code error:', error);
    return NextResponse.json({ error: error.message || 'Failed to exchange authorization code' }, { status: 500 });
  }
}
