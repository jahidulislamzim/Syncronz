import { readDocument, writeDocument } from './firebase/firestore.js';
import { encrypt, decrypt } from './crypto.js';
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

async function persistRefreshedAccessToken(connection, newAccessToken, idToken) {
  try {
    const keyHex = getEncryptionKey();
    const existing = await readDocument(COLLECTION, DOC_ID, idToken);
    const list = existing?.list || [];
    const idx = list.findIndex((c) => c.connectionId === connection.connectionId);
    if (idx !== -1) {
      list[idx].encryptedAccessToken = encrypt(newAccessToken, keyHex);
      list[idx].lastRefreshedAt = new Date().toISOString();
      await writeDocument(COLLECTION, DOC_ID, { list }, idToken);
    }
  } catch (err) {
    console.warn('Failed to persist refreshed token:', err);
  }
}

export async function getDriveAccessTokenForBoard(boardId, idToken) {
  const connection = await getBoardDriveConnection(boardId, idToken);
  if (!connection) {
    throw new Error('No Drive connection found for this board');
  }
  return getConnectionAccessToken(connection, idToken);
}

export async function getConnectionAccessToken(connection, idToken) {
  const keyHex = getEncryptionKey();

  const refreshToken = connection.encryptedRefreshToken
    ? decrypt(connection.encryptedRefreshToken, keyHex)
    : null;
  const clientId = connection.encryptedClientId
    ? decrypt(connection.encryptedClientId, keyHex)
    : null;
  const clientSecret = connection.encryptedClientSecret
    ? decrypt(connection.encryptedClientSecret, keyHex)
    : null;

  if (refreshToken && clientId && clientSecret) {
    try {
      const freshToken = await refreshOAuthAccessToken(refreshToken, clientId, clientSecret);
      await persistRefreshedAccessToken(connection, freshToken, idToken);
      return freshToken;
    } catch (refreshErr) {
      throw new Error(
        `Drive connection "${connection.label || connection.googleEmail}" authentication failed: ${refreshErr.message}`
      );
    }
  }

  if (!refreshToken) {
    throw new Error(
      `Drive connection "${connection.label || connection.googleEmail}" has no refresh token. Remove and reconnect the Drive account in Settings.`
    );
  }

  throw new Error(
    `Drive connection "${connection.label || connection.googleEmail}" has no API credentials. Click "Credentials" on this connection in Settings → Google Drive to add Client ID and Client Secret.`
  );
}
