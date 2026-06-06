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
      if (error instanceof Error) {
        const errMsg = error.message || '';
        const errCode = error.code || '';
        
        if (errMsg.includes('the client is offline')) {
          console.warn("Firebase: running in offline-sync state");
        } else if (
          errCode === 'not-found' || 
          errMsg.includes('not-found') || 
          errMsg.includes('NOT_FOUND') ||
          errMsg.includes('database')
        ) {
          const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
          console.error(
            `%c[Firebase Setup Error] Cloud Firestore Database "${dbId}" not found or not initialized in project "${firebaseConfig.projectId}".\n\n` +
            `To fix this:\n` +
            `1. Open the Firebase Console: https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore\n` +
            `2. Click "Create database" if you haven't already.\n` +
            `3. Make sure to use the "${dbId}" database ID (or create it with this ID) and select your preferred location.\n` +
            `4. Start the database in Test mode or Production mode depending on your needs.\n`,
            "color: #ff3333; font-weight: bold; font-size: 12px;"
          );
        } else {
          console.error("Firebase database connection validation failed:", error);
        }
      }
    }
  }
  validateDatabaseConnection();
} catch (e) {
  console.error('Firebase initialization failed:', e);
}

export { auth, db };
