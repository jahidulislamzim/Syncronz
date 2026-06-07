import { NextResponse } from 'next/server';
import { verifyFirebaseToken } from '../../../src/lib/firebase/auth.js';
import { readDocument } from '../../../src/lib/firebase/firestore.js';
import { sendActionEmail } from '../../../src/lib/email.js';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 });
    }
    const idToken = authHeader.slice(7);
    const tokenUser = await verifyFirebaseToken(idToken);
    const body = await request.json();
    const { 
      type, 
      recipientEmail, 
      recipientName, 
      actorName, 
      boardId, 
      boardName, 
      taskTitle, 
      taskId, 
      details, 
      dueDate, 
      priority,
      subtasks,
      origin 
    } = body;

    if (!type || !recipientEmail) {
      return NextResponse.json({ error: 'type and recipientEmail are required' }, { status: 400 });
    }

    const smtpConfig = await readDocument('settings', 'smtp', idToken);
    if (!smtpConfig || !smtpConfig.passEncrypted) {
      return NextResponse.json({ error: 'SMTP not configured' }, { status: 400 });
    }

    const emailOrigin = origin || request.headers.get('origin') || new URL(request.url).origin;
    const link = boardId ? `${emailOrigin}/boards/${boardId}` : `${emailOrigin}/`;

    // Process the email sending asynchronously in the background.
    // By not awaiting the promise, the server responds to the browser instantly,
    // and continues execution on Node.js process microtask queue.
    sendActionEmail({
      smtpConfig,
      type,
      to: recipientEmail,
      recipientName: recipientName || '',
      actorName: actorName || tokenUser.email || 'Someone',
      boardName: boardName || 'Project Board',
      taskTitle: taskTitle || '',
      details: details || '',
      link,
      dueDate: dueDate || '',
      priority: priority || '',
      subtasks: subtasks || [],
    }).catch((err) => {
      console.error(`[Background Email Dispatch Failed] Type: ${type}, Recipient: ${recipientEmail}`, err);
    });

    // Instantly respond to client
    return NextResponse.json({ success: true, message: 'Notification queued in background' });
  } catch (error) {
    console.error('Send email error:', error);
    return NextResponse.json({ error: error.message || 'Failed to trigger email' }, { status: 500 });
  }
}
