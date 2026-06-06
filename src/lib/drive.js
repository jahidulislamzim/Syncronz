/**
 * Google Drive REST API File Upload Helpers
 * Bypasses heavy SDK weight using standard Web REST API fetch targets.
 */

/**
 * Uploads a file to the authenticated user's Google Drive via standard REST API.
 * Uses 'drive.file' scope permissions.
 */
export async function uploadToGoogleDrive(
  file,
  accessToken
) {
  const boundary = 'tasksync_multipart_boundary';
  
  // We use standard multipart/related upload to create the file with name and MIME type in one request.
  // This is highly optimal and reliable across different file formats.
  const metadata = {
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
  };

  // Convert file structure into ArrayBuffer
  const fileArrayBuffer = await file.arrayBuffer();
  
  // Format the multipart/related body
  const headerSegment = 
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`;
    
  const footerSegment = `\r\n--${boundary}--`;

  // Merge headers, raw binary data and boundaries securely
  const textEncoder = new TextEncoder();
  const headerBytes = textEncoder.encode(headerSegment);
  const footerBytes = textEncoder.encode(footerSegment);

  const totalBuffer = new Uint8Array(headerBytes.byteLength + fileArrayBuffer.byteLength + footerBytes.byteLength);
  totalBuffer.set(headerBytes, 0);
  totalBuffer.set(new Uint8Array(fileArrayBuffer), headerBytes.byteLength);
  totalBuffer.set(footerBytes, headerBytes.byteLength + fileArrayBuffer.byteLength);

  // Trigger Google Drive Multipart Upload
  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: totalBuffer,
    }
  );

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    console.error('Google Drive Upload Failed Context: ', errorText);
    throw new Error(`Google Drive upload failed with status ${uploadRes.status}: ${errorText}`);
  }

  const uploadResult = await uploadRes.json();
  const fileId = uploadResult.id;

  // Query back webViewLink and metadata fields from Google Drive v3 API
  const metadataRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,webViewLink,mimeType,size`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!metadataRes.ok) {
    // Return standard fallback link if details fetch is blocked
    return {
      id: `att_${Math.random().toString(36).substring(2, 9)}`,
      name: file.name,
      url: `https://drive.google.com/file/d/${fileId}/view`,
      driveFileId: fileId,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      uploadedAt: new Date().toISOString(),
    };
  }

  const payload = await metadataRes.json();
  return {
    id: `att_${Math.random().toString(36).substring(2, 9)}`,
    name: payload.name || file.name,
    url: payload.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
    driveFileId: fileId,
    size: Number(payload.size) || file.size,
    mimeType: payload.mimeType || file.type || 'application/octet-stream',
    uploadedAt: new Date().toISOString(),
  };
}
