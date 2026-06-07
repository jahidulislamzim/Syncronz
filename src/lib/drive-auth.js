export async function refreshOAuthAccessToken(refreshToken, clientId, clientSecret) {
  if (!refreshToken) {
    throw new Error('No refresh token available. Reconnect the Drive account in Settings.');
  }
  if (!clientId || !clientSecret) {
    throw new Error(
      'Drive connection has no API credentials. Click "Credentials" on the connection in Settings → Google Drive to add Client ID and Client Secret.'
    );
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
    throw new Error(`Token refresh failed: ${err}`);
  }

  const data = await res.json();
  return data.access_token;
}
