import { NextResponse } from 'next/server';
import { verifyFirebaseToken } from '../../../src/lib/firebase/auth.js';
import { readCollection } from '../../../src/lib/firebase/firestore.js';
import webpush from 'web-push';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 });
    }
    const idToken = authHeader.slice(7);
    
    // Verify client identity
    const tokenUser = await verifyFirebaseToken(idToken);
    
    const body = await request.json();
    const { targetUserId, boardId, boardName, taskId, title, message, type } = body;
    
    if (!targetUserId || !title || !message) {
      return NextResponse.json({ error: 'targetUserId, title, and message are required' }, { status: 400 });
    }

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:support@syncro.example.com';

    if (!publicKey || !privateKey) {
      console.warn('VAPID credentials not configured on server. Skipping push notifications.');
      return NextResponse.json({ error: 'Web Push not configured' }, { status: 500 });
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);

    // Fetch target user's registered push subscriptions
    const subPath = `users/${targetUserId}/pushSubscriptions`;
    const subscriptions = await readCollection(subPath, idToken);

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: true, message: 'No registered push endpoints found.' });
    }

    const payload = JSON.stringify({
      title,
      body: message,
      url: boardId ? `/boards/${boardId}` : '/',
      tag: taskId ? `task-${taskId}` : 'syncro-alert',
      icon: '/icon.svg',
      badge: '/badge.png'
    });

    const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const DATABASE_ID = process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID || '(default)';
    const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents`;

    const pushPromises = subscriptions.map(async (sub) => {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys?.p256dh,
            auth: sub.keys?.auth
          }
        };
        await webpush.sendNotification(pushSubscription, payload);
      } catch (err) {
        console.error('Web Push delivery error:', err);
        
        // Remove subscription from Firestore if subscription is expired (410) or not found (404)
        if (err.statusCode === 410 || err.statusCode === 404) {
          try {
            const deleteUrl = `${FIRESTORE_BASE}/${subPath}/${sub.subscriptionId}`;
            await fetch(deleteUrl, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${idToken}` }
            });
            console.log(`Cleaned up obsolete push subscription endpoint: ${sub.subscriptionId}`);
          } catch (delErr) {
            console.error('Failed to clean up obsolete subscription from Firestore:', delErr);
          }
        }
      }
    });

    await Promise.all(pushPromises);

    return NextResponse.json({ success: true, message: `Dispatched push to ${subscriptions.length} endpoints.` });
  } catch (error) {
    console.error('Push notification delivery error:', error);
    return NextResponse.json({ error: error.message || 'Failed to dispatch push notification' }, { status: 500 });
  }
}
