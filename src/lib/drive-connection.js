import { readDocument } from './firebase/firestore.js';
import { decrypt } from './crypto.js';
import { refreshOAuthAccessToken } from './drive-auth.js';

const COLLECTION = 'settings';
const DOC_ID = 'driveConnections';
const ENCRYPTION_KEY_ENV = 'SMTP_ENCRYPTION_KEY';

function getEncryptionKey() {
  const key = process.env[ENCRYPTION_KEY_ENV];
  if (!key) throw new Error(`${ENCRYPTION_KEY_ENV} not set`);
  return key;
}

export async function getConnectionById(connectionId, idToken) {
  const data = await readDocument(COLLECTION, DOC_ID, idToken);
  const list = data?.list || [];
  return list.find((c) => c.connectionId === connectionId) || null;
}

export async function findConnectionByEmail(googleEmail, idToken) {
  const data = await readDocument(COLLECTION, DOC_ID, idToken);
  const list = data?.list || [];
  return list.find((c) => c.googleEmail === googleEmail) || null;
}

export async function getBoardDriveConnection(boardId, idToken) {
  const board = await readDocument('boards', boardId, idToken);
  if (!board?.driveConnectionId) {
    throw new Error('Board does not have a Google Drive connection assigned');
  }
  return getConnectionById(board.driveConnectionId, idToken);
}

export async function getDriveAccessTokenForBoard(boardId, idToken) {
  const connection = await getBoardDriveConnection(boardId, idToken);
  if (!connection) {
    throw new Error('No Drive connection found for this board');
  }

  const keyHex = getEncryptionKey();
  const accessToken = decrypt(connection.encryptedAccessToken, keyHex);
  const refreshToken = connection.encryptedRefreshToken
    ? decrypt(connection.encryptedRefreshToken, keyHex)
    : null;

  if (refreshToken) {
    try {
      const freshToken = await refreshOAuthAccessToken(refreshToken);
      return freshToken;
    } catch {
      return accessToken;
    }
  }

  return accessToken;
}

export async function getConnectionAccessToken(connection, idToken) {
  const keyHex = getEncryptionKey();
  const accessToken = decrypt(connection.encryptedAccessToken, keyHex);
  const refreshToken = connection.encryptedRefreshToken
    ? decrypt(connection.encryptedRefreshToken, keyHex)
    : null;

  if (refreshToken) {
    try {
      const freshToken = await refreshOAuthAccessToken(refreshToken);
      return freshToken;
    } catch {
      return accessToken;
    }
  }

  return accessToken;
}
