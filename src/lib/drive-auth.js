import crypto from 'crypto';

function base64UrlEncode(buf) {
  return buf.toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signRsaSha256(data, privateKey) {
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(data);
  return sign.sign(privateKey, 'base64');
}

export async function getAccessToken(saJson) {
  const scope = 'https://www.googleapis.com/auth/drive';
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600;

  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: saJson.client_email,
    scope,
    aud: 'https://oauth2.googleapis.com/token',
    exp: expiry,
    iat: now,
  };

  const headerB64 = base64UrlEncode(Buffer.from(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(Buffer.from(JSON.stringify(payload)));
  const signatureInput = `${headerB64}.${payloadB64}`;
  const signature = signRsaSha256(signatureInput, saJson.private_key);
  const signatureB64 = base64UrlEncode(Buffer.from(signature, 'base64'));
  const jwt = `${headerB64}.${payloadB64}.${signatureB64}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to get access token: ${err}`);
  }

  const data = await res.json();
  return data.access_token;
}

export async function refreshOAuthAccessToken(refreshToken, idToken, customClientId = null, customClientSecret = null) {
  let clientId = customClientId || process.env.GOOGLE_CLIENT_ID;
  let clientSecret = customClientSecret || process.env.GOOGLE_CLIENT_SECRET;

  const isEnvOrCustomConfigured = clientId && clientSecret && 
    !clientId.includes('xxx') && !clientSecret.includes('xxx');

  if (!isEnvOrCustomConfigured) {
    if (!idToken) {
      throw new Error('idToken required to fetch Google credentials from settings');
    }
    try {
      const { readDocument } = await import('./firebase/firestore.js');
      const { decrypt } = await import('./crypto.js');
      const data = await readDocument('settings', 'googleCredentials', idToken);
      if (data?.encryptedClientId && data?.encryptedClientSecret) {
        const keyHex = process.env.SMTP_ENCRYPTION_KEY;
        clientId = decrypt(data.encryptedClientId, keyHex);
        clientSecret = decrypt(data.encryptedClientSecret, keyHex);
      }
    } catch (dbErr) {
      console.warn('Failed to load Google credentials from settings:', dbErr);
    }
  }

  if (!clientId || !clientSecret || clientId.includes('xxx') || clientSecret.includes('xxx')) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env or configured in Settings');
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to refresh access token: ${err}`);
  }

  const data = await res.json();
  return data.access_token;
}
