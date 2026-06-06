const API_BASE = 'https://www.googleapis.com/drive/v3';
const UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Drive API error: ${res.status} - ${err}`);
  }
  return res;
}

export async function findFolder(accessToken, parentId, name) {
  let query = `name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  }
  const url = `${API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;
  const res = await apiFetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  return data.files?.[0] || null;
}

export async function createFolder(accessToken, name, parentId) {
  const body = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) {
    body.parents = [parentId];
  }
  const res = await apiFetch(`${API_BASE}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function ensureFolder(accessToken, pathParts) {
  let parentId = null;
  for (const name of pathParts) {
    const existing = await findFolder(accessToken, parentId, name);
    if (existing) {
      parentId = existing.id;
    } else {
      const created = await createFolder(accessToken, name, parentId);
      parentId = created.id;
    }
  }
  return parentId;
}

export async function initResumableUpload(accessToken, fileName, fileSize, mimeType, parentFolderId) {
  const metadata = { name: fileName };
  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }
  const res = await apiFetch(`${UPLOAD_BASE}/files?uploadType=resumable`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Upload-Content-Type': mimeType,
      'X-Upload-Content-Length': String(fileSize),
    },
    body: JSON.stringify(metadata),
  });
  const sessionUrl = res.headers.get('Location');
  if (!sessionUrl) {
    throw new Error('No resumable session URL returned');
  }
  return sessionUrl;
}

export async function setPublicPermission(accessToken, fileId) {
  await apiFetch(`${API_BASE}/files/${fileId}/permissions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      role: 'reader',
      type: 'anyone',
    }),
  });
}

export async function getFileMetadata(accessToken, fileId) {
  const res = await apiFetch(
    `${API_BASE}/files/${fileId}?fields=id,name,webViewLink,mimeType,size`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  return res.json();
}
