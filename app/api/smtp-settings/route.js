import { NextResponse } from 'next/server';
import { encrypt, decrypt } from '../../../src/lib/crypto.js';
import { verifyFirebaseToken } from '../../../src/lib/firebase/auth.js';
import { readDocument, writeDocument } from '../../../src/lib/firebase/firestore.js';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 });
    }
    const idToken = authHeader.slice(7);
    const tokenUser = await verifyFirebaseToken(idToken);

    const body = await request.json();
    const { host, port, user, pass, fromName, fromEmail } = body;

    if (!host || !port || !user || !pass) {
      return NextResponse.json({ error: 'host, port, user, and pass are required' }, { status: 400 });
    }

    const passEncrypted = encrypt(pass, process.env.SMTP_ENCRYPTION_KEY);

    const smtpData = {
      host,
      port: parseInt(port, 10),
      user,
      passEncrypted,
      fromName: fromName || '',
      fromEmail: fromEmail || '',
      updatedBy: tokenUser.email || tokenUser.uid,
      updatedAt: new Date().toISOString(),
    };

    await writeDocument('settings', 'smtp', smtpData, idToken);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('SMTP settings error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save settings' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 });
    }
    const idToken = authHeader.slice(7);
    const tokenUser = await verifyFirebaseToken(idToken);

    const data = await readDocument('settings', 'smtp', idToken);

    if (!data) {
      return NextResponse.json({ configured: false });
    }

    let passDecrypted = '';
    if (data.passEncrypted) {
      try {
        passDecrypted = decrypt(data.passEncrypted, process.env.SMTP_ENCRYPTION_KEY);
      } catch (err) {
        console.error('Failed to decrypt SMTP password:', err);
      }
    }

    return NextResponse.json({
      configured: true,
      host: data.host || '',
      port: data.port || 587,
      user: data.user || '',
      pass: passDecrypted,
      fromName: data.fromName || '',
      fromEmail: data.fromEmail || '',
      updatedAt: data.updatedAt || null,
    });
  } catch (error) {
    console.error('SMTP settings read error:', error);
    return NextResponse.json({ error: error.message || 'Failed to read settings' }, { status: 500 });
  }
}
