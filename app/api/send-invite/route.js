import { NextResponse } from 'next/server';
import { verifyFirebaseToken } from '../../../src/lib/firebase/auth.js';
import { readDocument } from '../../../src/lib/firebase/firestore.js';
import { sendInviteEmail } from '../../../src/lib/email.js';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 });
    }
    const idToken = authHeader.slice(7);
    const tokenUser = await verifyFirebaseToken(idToken);

    const body = await request.json();
    const { email, displayName, adminName } = body;

    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    const smtpConfig = await readDocument('settings', 'smtp', idToken);
    if (!smtpConfig || !smtpConfig.passEncrypted) {
      return NextResponse.json({ error: 'SMTP not configured' }, { status: 400 });
    }

    await sendInviteEmail({
      smtpConfig,
      to: email,
      displayName: displayName || '',
      adminName: adminName || tokenUser.email || 'An admin',
      inviteLink: `${BASE_URL}/login`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Send invite error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }
}
