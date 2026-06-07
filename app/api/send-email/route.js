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
      recipients, 
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

    // Check that we have a type, and either recipientEmail or a recipients list
    const hasRecipient = recipientEmail || (Array.isArray(recipients) && recipients.length > 0);
    if (!type || !hasRecipient) {
      return NextResponse.json({ error: 'type and recipientEmail or recipients list are required' }, { status: 400 });
    }

    const smtpConfig = await readDocument('settings', 'smtp', idToken);
    if (!smtpConfig || !smtpConfig.passEncrypted) {
      return NextResponse.json({ error: 'SMTP not configured' }, { status: 400 });
    }

    const emailOrigin = origin || request.headers.get('origin') || new URL(request.url).origin;
    const link = boardId ? `${emailOrigin}/boards/${boardId}` : `${emailOrigin}/`;

    // Normalize target recipients into a unique list
    const targetRecipients = [];
    if (recipientEmail) {
      targetRecipients.push({ email: recipientEmail.trim(), name: recipientName || '' });
    }
    if (Array.isArray(recipients)) {
      recipients.forEach(r => {
        if (r.email && r.email.trim()) {
          const emailLower = r.email.trim().toLowerCase();
          if (!targetRecipients.some(x => x.email.toLowerCase() === emailLower)) {
            targetRecipients.push({ email: r.email.trim(), name: r.name || '' });
          }
        }
      });
    }

    // Send emails in parallel and await completion
    const emailPromises = targetRecipients.map(async (recipient) => {
      try {
        await sendActionEmail({
          smtpConfig,
          type,
          to: recipient.email,
          recipientName: recipient.name,
          actorName: actorName || tokenUser.email || 'Someone',
          boardName: boardName || 'Project Board',
          taskTitle: taskTitle || '',
          details: details || '',
          link,
          dueDate: dueDate || '',
          priority: priority || '',
          subtasks: subtasks || [],
        });
      } catch (err) {
        console.error(`[Background Email Dispatch Failed] Type: ${type}, Recipient: ${recipient.email}`, err);
        throw err;
      }
    });

    await Promise.all(emailPromises);

    return NextResponse.json({ success: true, message: `Notifications sent to ${targetRecipients.length} recipients` });
  } catch (error) {
    console.error('Send email error:', error);
    return NextResponse.json({ error: error.message || 'Failed to trigger email' }, { status: 500 });
  }
}
