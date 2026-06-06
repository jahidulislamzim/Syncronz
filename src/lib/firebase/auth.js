import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from './client.js';

const googleProvider = new GoogleAuthProvider();

export async function loginWithGoogle() {
  if (!auth || !googleProvider) throw new Error('Firebase not initialized');
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function logoutUser() {
  if (!auth) throw new Error('Firebase not initialized');
  await signOut(auth);
}

export function handleFirestoreError(error, operationType, path) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Detailed Info: ', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

export async function verifyFirebaseToken(idToken) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    throw new Error('Firebase API key not configured');
  }
  const url = `https://www.googleapis.com/identitytoolkit/v3/relyingparty/getAccountInfo?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) {
    throw new Error('Invalid or expired Firebase token');
  }
  const data = await res.json();
  const user = data.users?.[0];
  if (!user) {
    throw new Error('No user found for token');
  }
  return {
    uid: user.localId,
    email: user.email || '',
    emailVerified: user.emailVerified || false,
  };
}
