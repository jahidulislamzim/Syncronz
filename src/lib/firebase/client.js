import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { firebaseConfig } from './config.js';

let app;
let auth;
let db;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);

  db = firebaseConfig.firestoreDatabaseId
    ? initializeFirestore(app, {
        experimentalForceLongPolling: true,
        useFetchStreams: false,
      }, firebaseConfig.firestoreDatabaseId)
    : initializeFirestore(app, {
        experimentalForceLongPolling: true,
        useFetchStreams: false,
      });

  async function validateDatabaseConnection() {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.warn("Firebase: running in offline-sync state");
      }
    }
  }
  validateDatabaseConnection();
} catch (e) {
  console.error('Firebase initialization failed:', e);
}

export { auth, db };
