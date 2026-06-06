import { NextResponse } from 'next/server';
import { encrypt } from '../../../src/lib/crypto.js';
import { decrypt } from '../../../src/lib/crypto.js';
import { verifyFirebaseToken } from '../../../src/lib/firebase/auth.js';
import { readDocument, writeDocument } from '../../../src/lib/firebase/firestore.js';
import { getAccessToken } from '../../../src/lib/drive-auth.js';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 });
    }
    const idToken = authHeader.slice(7);
    await verifyFirebaseToken(idToken);

    const data = await readDocument('settings', 'drive', idToken);
    if (!data || !data.encryptedKey) {
      return NextResponse.json({ configured: false });
    }

    const keyHex = process.env.SMTP_ENCRYPTION_KEY;
    let saJson;
    try {
      const decrypted = decrypt(data.encryptedKey, keyHex);
      saJson = JSON.parse(decrypted);
    } catch {
      return NextResponse.json({ configured: false });
    }

    return NextResponse.json({
      configured: true,
      clientEmail: saJson.client_email || '',
      projectId: saJson.project_id || '',
      updatedAt: data.updatedAt || null,
    });
  } catch (error) {
    console.error('Drive settings read error:', error);
    return NextResponse.json({ error: error.message || 'Failed to read settings' }, { status: 500 });
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
    const { serviceAccountJson } = body;

    if (!serviceAccountJson) {
      return NextResponse.json({ error: 'serviceAccountJson is required' }, { status: 400 });
    }

    let sa;
    try {
      sa = JSON.parse(serviceAccountJson);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 });
    }

    if (!sa.client_email || !sa.private_key) {
      return NextResponse.json({ error: 'JSON must contain client_email and private_key' }, { status: 400 });
    }

    const keyHex = process.env.SMTP_ENCRYPTION_KEY;
    const encryptedKey = encrypt(serviceAccountJson, keyHex);

    const driveData = {
      encryptedKey,
      updatedBy: tokenUser.email || tokenUser.uid,
      updatedAt: new Date().toISOString(),
    };

    await writeDocument('settings', 'drive', driveData, idToken);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Drive settings save error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save settings' }, { status: 500 });
  }
}
