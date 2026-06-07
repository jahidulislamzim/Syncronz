'use client';

import { useEffect, useState } from 'react';

export default function DriveCallbackPage() {
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');
      const error = params.get('error');

      if (error) {
        setStatus(`Authorization failed: ${error}`);
        if (window.opener) {
          window.opener.postMessage(
            { type: 'drive-oauth-callback', error },
            window.location.origin
          );
        }
        return;
      }

      if (!code) {
        setStatus('No authorization code received. This page should be reached from a Google OAuth redirect.');
        return;
      }

      if (window.opener) {
        window.opener.postMessage(
          { type: 'drive-oauth-callback', code, state },
          window.location.origin
        );
        setStatus('Authentication successful!');
        try { window.close(); } catch (e) {}
      } else {
        setStatus('No parent window found. Please close this tab and try again.');
      }
    } catch (e) {
      setStatus(`Error: ${e.message}`);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-lg p-8 max-w-sm text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center">
          <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-bold text-slate-900">Google Drive Connection</p>
        <p className="text-xs text-slate-500">{status}</p>
      </div>
    </div>
  );
}
