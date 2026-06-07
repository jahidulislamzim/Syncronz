import { NextResponse } from 'next/server';
import { verifyFirebaseToken } from '../../../src/lib/firebase/auth.js';
import { readDocument, writeDocument } from '../../../src/lib/firebase/firestore.js';
import { encrypt, decrypt } from '../../../src/lib/crypto.js';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 });
    }
    const idToken = authHeader.slice(7);
    const tokenUser = await verifyFirebaseToken(idToken);

    // Verify if user is admin
    const userProfile = await readDocument('users', tokenUser.uid, idToken);
    if (!userProfile?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await readDocument('settings', 'googleCredentials', idToken);
    if (!data || !data.encryptedClientId) {
      return NextResponse.json({ configured: false });
    }

    const keyHex = process.env.SMTP_ENCRYPTION_KEY;
    const clientId = decrypt(data.encryptedClientId, keyHex);
    const clientSecret = decrypt(data.encryptedClientSecret, keyHex);

    // Mask the secret for response security
    const maskedSecret = clientSecret.length > 8
      ? `${clientSecret.substring(0, 8)}...`
      : '********';

    return NextResponse.json({
      configured: true,
      clientId,
      clientSecret: maskedSecret,
      updatedAt: data.updatedAt || null,
      updatedBy: data.updatedBy || null,
    });
  } catch (error) {
    console.error('Google credentials read error:', error);
    return NextResponse.json({ error: error.message || 'Failed to read credentials' }, { status: 500 });
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

    // Verify if user is admin
    const userProfile = await readDocument('users', tokenUser.uid, idToken);
    if (!userProfile?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { clientId, clientSecret } = body;

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'clientId and clientSecret are required' }, { status: 400 });
    }

    const keyHex = process.env.SMTP_ENCRYPTION_KEY;
    const encryptedClientId = encrypt(clientId.trim(), keyHex);
    const encryptedClientSecret = encrypt(clientSecret.trim(), keyHex);

    const credentialData = {
      encryptedClientId,
      encryptedClientSecret,
      updatedBy: tokenUser.email || tokenUser.uid,
      updatedAt: new Date().toISOString(),
    };

    await writeDocument('settings', 'googleCredentials', credentialData, idToken);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Google credentials save error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save credentials' }, { status: 500 });
  }
}
