'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../src/context/AuthContext.jsx';
import { auth } from '../../../src/lib/firebase/client.js';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../../src/lib/firebase/client.js';
import { Settings, Save, CheckCircle, AlertTriangle, Eye, EyeOff, X, Sparkles, HardDrive, RefreshCw, FileText, FolderOpen, ExternalLink, Trash2, Plus, Mail, UserCheck, Unlink, Key, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Toast = ({ message, type, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: -20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -20, scale: 0.95 }}
    className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl border text-sm font-semibold ${
      type === 'success'
        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
        : type === 'info'
        ? 'bg-blue-50 border-blue-200 text-blue-800'
        : 'bg-red-50 border-red-200 text-red-800'
    }`}
  >
    {type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
    <span>{message}</span>
    <button onClick={onClose} className="ml-3 opacity-60 hover:opacity-100 cursor-pointer"><X className="w-4 h-4" /></button>
  </motion.div>
);

export default function SettingsPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('email');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (profile && !profile.isAdmin) {
      router.replace('/');
    }
  }, [profile, router]);

  // ─── SMTP State ───────────────────────────────────────────────
  const [emailForm, setEmailForm] = useState({
    host: '', port: '587', user: '', pass: '', fromName: 'Syncronz', fromEmail: '',
  });

  useEffect(() => {
    if (!profile?.isAdmin) return;
    (async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        const res = await fetch('/api/smtp-settings', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.configured) {
          setEmailForm(prev => ({
            ...prev,
            host: data.host || '',
            port: String(data.port || '587'),
            user: data.user || '',
            pass: data.pass || '',
            fromName: data.fromName || 'Syncronz',
            fromEmail: data.fromEmail || '',
          }));
        }
      } catch (e) {
        console.error('Failed to load SMTP settings:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [profile]);

  const handleEmailChange = (field) => (e) => {
    setEmailForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleEmailSave = async () => {
    if (!emailForm.host || !emailForm.port || !emailForm.user || !emailForm.pass) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    setSaving(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/smtp-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          host: emailForm.host,
          port: parseInt(emailForm.port, 10),
          user: emailForm.user,
          pass: emailForm.pass,
          fromName: emailForm.fromName,
          fromEmail: emailForm.fromEmail,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }
      showToast('SMTP settings saved successfully', 'success');
    } catch (e) {
      showToast(e.message || 'Failed to save SMTP settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ─── Edit Connection Credentials State ───────────────────────
  const [editCredsConnection, setEditCredsConnection] = useState(null);
  const [editCredsForm, setEditCredsForm] = useState({ clientId: '', clientSecret: '' });
  const [savingCreds, setSavingCreds] = useState(false);
  const [showEditCredsSecret, setShowEditCredsSecret] = useState(false);


  const handleSaveConnCreds = async () => {
    if (!editCredsConnection) return;
    setSavingCreds(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/drive-connections', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          connectionId: editCredsConnection.connectionId,
          clientId: editCredsForm.clientId,
          clientSecret: editCredsForm.clientSecret,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update credentials');
      }
      const data = await res.json();
      // Update local connections list
      setConnections((prev) =>
        prev.map((c) =>
          c.connectionId === editCredsConnection.connectionId
            ? { ...c, clientId: data.connection.clientId, hasCustomCredentials: data.connection.hasCustomCredentials }
            : c
        )
      );
      showToast('Credentials saved successfully', 'success');
      setEditCredsConnection(null);
      setEditCredsForm({ clientId: '', clientSecret: '' });
      setShowEditCredsSecret(false);
    } catch (e) {
      showToast(e.message || 'Failed to save credentials', 'error');
    } finally {
      setSavingCreds(false);
    }
  };

  // ─── Google Drive Connections State ──────────────────────────
  const [driveLoading, setDriveLoading] = useState(true);
  const [connections, setConnections] = useState([]);
  const [connectingDrive, setConnectingDrive] = useState(false);
  const [showDriveNamePopup, setShowDriveNamePopup] = useState(false);
  const [driveName, setDriveName] = useState('');
  const [customDriveClientId, setCustomDriveClientId] = useState('');
  const [customDriveClientSecret, setCustomDriveClientSecret] = useState('');
  const [showCustomDriveSecret, setShowCustomDriveSecret] = useState(false);
  const [testingConnectionId, setTestingConnectionId] = useState(null);
  const [redirectUri, setRedirectUri] = useState('');
  useEffect(() => {
    setRedirectUri(typeof window !== 'undefined' ? `${window.location.origin}/drive-callback` : '');
  }, []);
  const [testResults, setTestResults] = useState({});

  // ─── Board Drive Management State ────────────────────────────
  const [boards, setBoards] = useState([]);
  const [selectedBoardId, setSelectedBoardId] = useState('');
  const [selectedConnectionId, setSelectedConnectionId] = useState('');
  const [enablingDrive, setEnablingDrive] = useState(false);
  const [showEnablePopup, setShowEnablePopup] = useState(false);
  const [drivesByBoard, setDrivesByBoard] = useState({});

  // Load Drive connections
  useEffect(() => {
    if (!profile?.isAdmin) return;
    (async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        const res = await fetch('/api/drive-connections', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setConnections(data.connections || []);
      } catch (e) {
        console.error('Failed to load Drive connections:', e);
      } finally {
        setDriveLoading(false);
      }
    })();
  }, [profile]);

  // Fetch boards + their Drive status
  useEffect(() => {
    if (!profile?.isAdmin) return;
    const q = query(collection(db, 'boards'));
    const unsub = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => list.push(doc.data()));
      setBoards(list);
      const driveMap = {};
      list.forEach((b) => {
        if (b.driveEnabled) {
          driveMap[b.boardId] = {
            driveEnabled: b.driveEnabled,
            driveConnectionId: b.driveConnectionId,
            driveFolderId: b.driveFolderId,
            driveFolderUrl: b.driveFolderUrl,
          };
        }
      });
      setDrivesByBoard(driveMap);
    });
    return () => unsub();
  }, [profile]);

  // Connect a new Google Drive via custom OAuth
  const handleConnectDrive = async () => {
    if (!customDriveClientId || !customDriveClientSecret) {
      showToast('Google Client ID and Client Secret are required', 'error');
      return;
    }

    setConnectingDrive(true);
    let popup = null;
    let closeTimer = null;
    let authCompleted = false;
    try {
      const label = driveName.trim();
      const redirectUri = `${window.location.origin}/drive-callback`;
      const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      sessionStorage.setItem('drive-oauth-state', state);

      const params = new URLSearchParams({
        client_id: customDriveClientId.trim(),
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'https://www.googleapis.com/auth/drive.file',
        access_type: 'offline',
        prompt: 'consent',
        state,
      });

      popup = window.open(
        `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
        'google-oauth',
        'width=600,height=700'
      );

      if (!popup) {
        showToast('Popup was blocked. Allow popups for this site and try again.', 'error');
        setConnectingDrive(false);
        return;
      }

      const handleMessage = (event) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type !== 'drive-oauth-callback') return;

        authCompleted = true;
        if (closeTimer) clearInterval(closeTimer);
        window.removeEventListener('message', handleMessage);

        if (event.data.error) {
          showToast(`Authorization failed: ${event.data.error}`, 'error');
          setConnectingDrive(false);
          return;
        }

        const savedState = sessionStorage.getItem('drive-oauth-state');
        sessionStorage.removeItem('drive-oauth-state');

        if (event.data.state && event.data.state !== savedState) {
          showToast('Security verification failed. Please try again.', 'error');
          setConnectingDrive(false);
          return;
        }

        exchangeDriveCode(event.data.code, label, redirectUri);
      };

      window.addEventListener('message', handleMessage);

      closeTimer = setInterval(() => {
        if (popup.closed && !authCompleted) {
          clearInterval(closeTimer);
          window.removeEventListener('message', handleMessage);
          showToast(
            'Popup closed before authentication completed. Make sure you added this redirect URI to your Google Cloud OAuth client: ' + redirectUri,
            'error'
          );
          setConnectingDrive(false);
        }
      }, 500);
    } catch (e) {
      if (closeTimer) clearInterval(closeTimer);
      showToast(e.message || 'Failed to connect Google Drive', 'error');
      setConnectingDrive(false);
    }
  };

  const exchangeDriveCode = async (code, label, redirectUri) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/drive/exchange-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code,
          clientId: customDriveClientId.trim(),
          clientSecret: customDriveClientSecret.trim(),
          label,
          redirectUri,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save connection');
      }

      showToast(`Connected ${label}`, 'success');
      setDriveName('');
      setCustomDriveClientId('');
      setCustomDriveClientSecret('');
      setShowDriveNamePopup(false);

      const refreshRes = await fetch('/api/drive-connections', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        setConnections(data.connections || []);
      }
    } catch (e) {
      showToast(e.message || 'Failed to connect Google Drive', 'error');
    } finally {
      setConnectingDrive(false);
    }
  };

  // Test a Drive connection
  const handleTestConnection = async (connectionId) => {
    setTestingConnectionId(connectionId);
    setTestResults((prev) => ({ ...prev, [connectionId]: null }));
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/drive/health?connectionId=${connectionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTestResults((prev) => ({ ...prev, [connectionId]: data }));
    } catch (e) {
      setTestResults((prev) => ({ ...prev, [connectionId]: { ok: false, error: e.message } }));
    } finally {
      setTestingConnectionId(null);
    }
  };

  // Remove a Drive connection
  const handleRemoveConnection = async (connectionId) => {
    const conn = connections.find((c) => c.connectionId === connectionId);
    const label = conn?.label || conn?.googleEmail || connectionId;
    const usedBy = boards.filter((b) => b.driveConnectionId === connectionId);
    if (usedBy.length > 0) {
      showToast(`"${label}" is used by ${usedBy.length} board(s). Disconnect those boards first.`, 'error');
      return;
    }
    if (!window.confirm(`Remove "${label}"? This cannot be undone.`)) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/drive-connections?connectionId=${connectionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to remove');
      }
      setConnections((prev) => prev.filter((c) => c.connectionId !== connectionId));
      showToast(`Removed "${label}"`, 'success');
    } catch (e) {
      showToast(e.message || 'Failed to remove connection', 'error');
    }
  };

  // Assign a connection to a board
  const handleAssignBoardDrive = async () => {
    if (!selectedBoardId || !selectedConnectionId) return;
    setEnablingDrive(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const board = boards.find((b) => b.boardId === selectedBoardId);
      const bId = selectedBoardId?.trim();
      const cId = selectedConnectionId?.trim();
      if (!bId || !cId) {
        throw new Error(`Invalid selection (board: ${JSON.stringify(bId)}, connection: ${JSON.stringify(cId)})`);
      }
      const res = await fetch('/api/drive/enable-board', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          boardId: bId,
          boardName: board?.name,
          connectionId: cId,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to assign Drive');
      }
      showToast(`Drive assigned to "${board?.name || selectedBoardId}"`, 'success');
      setShowEnablePopup(false);
    } catch (e) {
      showToast(e.message || 'Failed to assign Google Drive', 'error');
    } finally {
      setEnablingDrive(false);
    }
  };

  // Disconnect Drive from a board
  const handleDisconnectBoardDrive = async (boardId) => {
    const board = boards.find((b) => b.boardId === boardId);
    if (!window.confirm(`Remove Drive from "${board?.name || boardId}"? Files will remain in Drive.`)) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/drive/enable-board?boardId=${boardId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to disconnect');
      }
      showToast(`Drive removed from "${board?.name || boardId}"`, 'success');
    } catch (e) {
      showToast(e.message || 'Failed to disconnect Drive', 'error');
    }
  };

  // ─── Render ──────────────────────────────────────────────────
  if (loading || driveLoading) {
    return (
      <div className="max-w-2xl mx-auto w-full py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-slate-200 rounded-3xl" />
          <div className="h-12 bg-slate-200 rounded-xl" />
          <div className="h-64 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full py-8 space-y-8">
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 md:p-10">
        <div className="absolute top-[-30%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-30%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 flex items-start gap-5">
          <div className="h-12 w-12 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-black/10">
            <Settings className="h-5.5 w-5.5 text-indigo-300" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white leading-tight">
              Workspace Settings
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
              Configure email sending and Google Drive integration for your workspace.
            </p>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-indigo-500 to-emerald-500" />
        <div className="flex items-center gap-1 p-1.5">
          <button
            onClick={() => setActiveTab('email')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
              activeTab === 'email'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-4 h-4" />
            Email
          </button>
          <button
            onClick={() => setActiveTab('drive')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
              activeTab === 'drive'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            Google Drive
            {connections.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Connected
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Email Tab */}
      {activeTab === 'email' && (
        <>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-6 md:p-8 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">SMTP Host</label>
                  <input
                    type="text"
                    value={emailForm.host}
                    onChange={handleEmailChange('host')}
                    placeholder="smtp.gmail.com"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">SMTP Port</label>
                  <input
                    type="number"
                    value={emailForm.port}
                    onChange={handleEmailChange('port')}
                    placeholder="587"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">SMTP User</label>
                  <input
                    type="text"
                    value={emailForm.user}
                    onChange={handleEmailChange('user')}
                    placeholder="noreply@yourcompany.com"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">SMTP Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={emailForm.pass}
                      onChange={handleEmailChange('pass')}
                      placeholder="Enter password"
                      className="w-full px-4 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">From Name</label>
                  <input
                    type="text"
                    value={emailForm.fromName}
                    onChange={handleEmailChange('fromName')}
                    placeholder="Syncronz"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">From Email</label>
                  <input
                    type="email"
                    value={emailForm.fromEmail}
                    onChange={handleEmailChange('fromEmail')}
                    placeholder="noreply@syncro.app"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 md:px-8 pb-6 md:pb-8 flex flex-wrap items-center gap-3">
              <button
                onClick={handleEmailSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition shadow-sm cursor-pointer"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-slate-900">How it works</p>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-500 leading-relaxed">
                  <li>• SMTP password is encrypted using AES-256-GCM before being stored in Firestore</li>
                  <li>• The encryption key is stored in your server environment only</li>
                  <li>• Invitation emails include a branded HTML template</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Google Drive Tab */}
      {activeTab === 'drive' && (
        <>

          {/* Connected Google Accounts */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-6 md:p-8 space-y-5">

              <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                <HardDrive className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-slate-900">Connected Google Accounts</p>
                  <p className="text-xs text-slate-500">These Drive accounts can be assigned to any board. Team members use them without individual authorization.</p>
                </div>
              </div>

              {connections.length > 0 ? (
                <div className="space-y-3">
                  {connections.map((conn, idx) => {
                    const boardCount = boards.filter((b) => b.driveConnectionId === conn.connectionId).length;
                    const testResult = testResults[conn.connectionId];
                    return (
                      <div key={conn.connectionId || `conn-${idx}`} className="space-y-2">
                        <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 bg-emerald-50 rounded-xl shrink-0">
                              <HardDrive className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 truncate">{conn.label}</p>
                              <p className="text-xs text-slate-500 flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {conn.googleEmail}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                Connected {conn.createdAt ? new Date(conn.createdAt).toLocaleDateString() : ''}
                                {boardCount > 0 && ` · ${boardCount} board(s) assigned`}
                              </p>
                              {conn.hasCustomCredentials && (
                                <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[9px] font-extrabold rounded-md uppercase tracking-wider">
                                  <Sparkles className="w-2.5 h-2.5 text-indigo-500 shrink-0" /> Custom credentials: {conn.clientId ? `${conn.clientId.substring(0, 15)}...` : 'Active'}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleTestConnection(conn.connectionId)}
                              disabled={testingConnectionId === conn.connectionId}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-emerald-300 hover:text-emerald-600 text-slate-500 rounded-lg text-[11px] font-bold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                              title="Test Drive connection"
                            >
                              {testingConnectionId === conn.connectionId ? (
                                <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                              ) : (
                                <RefreshCw className="w-3.5 h-3.5" />
                              )}
                              {testingConnectionId === conn.connectionId ? 'Testing...' : 'Test'}
                            </button>
                            <button
                              onClick={() => {
                                setEditCredsConnection(conn);
                                setEditCredsForm({ clientId: conn.clientId || '', clientSecret: '' });
                                setShowEditCredsSecret(false);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-500 rounded-lg text-[11px] font-bold transition cursor-pointer"
                              title="Manage API Credentials"
                            >
                              <Key className="w-3.5 h-3.5" />
                              Credentials
                            </button>
                            <button
                              onClick={() => handleRemoveConnection(conn.connectionId)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-red-300 hover:text-red-600 text-slate-500 rounded-lg text-[11px] font-bold transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Remove
                            </button>
                          </div>
                        </div>
                        {testResult && (
                          <div className={`px-3 py-2 rounded-xl text-[11px] font-medium ${
                            testResult.ok
                              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                              : 'bg-red-50 border border-red-200 text-red-700'
                          }`}>
                            {testResult.ok ? (
                              <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 shrink-0" /> {testResult.message}</span>
                            ) : (
                              <span className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {testResult.error}</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">No Google Drive accounts connected yet.</p>
              )}

              <button
                onClick={() => {
                  setDriveName('');
                  setShowDriveNamePopup(true);
                }}
                disabled={connectingDrive}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition shadow-sm cursor-pointer"
              >
                {connectingDrive ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {connectingDrive ? 'Connecting...' : 'Connect New Google Drive'}
              </button>
            </div>
          </div>

          {/* Board Drive Management */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-6 md:p-8 space-y-5">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                <FolderOpen className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-slate-900">Board Assignments</p>
                  <p className="text-xs text-slate-500">Assign a connected Google Drive account to a board. Each board gets its own Syncronz/BoardName/ folder.</p>
                </div>
              </div>

              {connections.length === 0 ? (
                <p className="text-sm text-amber-600 font-medium">Connect a Google Drive account above first.</p>
              ) : boards.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No boards found.</p>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-end gap-3">
                    <div className="flex-1 space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Select a Board</label>
                      <select
                        value={selectedBoardId}
                        onChange={(e) => {
                          setSelectedBoardId(e.target.value);
                          const boardDrive = drivesByBoard[e.target.value];
                          setSelectedConnectionId(boardDrive?.driveConnectionId || '');
                        }}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                      >
                        <option value="">— Choose a board —</option>
                        {boards.map((b, idx) => (
                          <option key={b.boardId || `board-${idx}`} value={b.boardId}>
                            {b.name} {drivesByBoard[b.boardId]?.driveEnabled ? '(Drive connected)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {selectedBoardId && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                      {drivesByBoard[selectedBoardId]?.driveEnabled ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 truncate">
                                {boards.find((b) => b.boardId === selectedBoardId)?.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                Connected via {connections.find((c) => c.connectionId === drivesByBoard[selectedBoardId]?.driveConnectionId)?.googleEmail || 'Unknown'}
                              </p>
                              <a
                                href={drivesByBoard[selectedBoardId]?.driveFolderUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-indigo-600 hover:text-indigo-800 underline inline-flex items-center gap-1 mt-0.5"
                              >
                                Open Drive folder <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDisconnectBoardDrive(selectedBoardId)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-red-300 hover:text-red-600 text-slate-500 rounded-lg text-[11px] font-bold transition cursor-pointer shrink-0"
                          >
                            <Unlink className="w-3.5 h-3.5" />
                            Disconnect
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">No Drive connected for this board yet.</p>
                      )}

                      <div className="flex items-end gap-3 pt-2 border-t border-slate-200">
                        <div className="flex-1 space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            {drivesByBoard[selectedBoardId]?.driveEnabled ? 'Change Drive Account' : 'Select Drive Account'}
                          </label>
                          <select
                            value={selectedConnectionId}
                            onChange={(e) => setSelectedConnectionId(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                          >
                            <option value="">— Choose an account —</option>
                            {connections.map((c, idx) => (
                              <option key={c.connectionId || `conn-${idx}`} value={c.connectionId}>
                                {c.label} ({c.googleEmail})
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={() => setShowEnablePopup(true)}
                          disabled={!selectedConnectionId}
                          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition shadow-sm cursor-pointer shrink-0"
                        >
                          <HardDrive className="w-4 h-4" />
                          {drivesByBoard[selectedBoardId]?.driveEnabled ? 'Reassign' : 'Assign'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Boards summary */}
          {Object.keys(drivesByBoard).length > 0 && connections.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6">
              <div className="flex items-start gap-3">
                <HardDrive className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">Drive-Enabled Boards ({Object.keys(drivesByBoard).length})</p>
                  <div className="mt-3 space-y-2">
                    {boards.filter((b) => drivesByBoard[b.boardId]?.driveEnabled).map((b) => {
                      const conn = connections.find((c) => c.connectionId === drivesByBoard[b.boardId]?.driveConnectionId);
                      return (
                        <div key={b.boardId} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-800 truncate block">{b.name}</span>
                            {conn && (
                              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                <UserCheck className="w-3 h-3" /> {conn.googleEmail}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-3">
                            <a
                              href={drivesByBoard[b.boardId]?.driveFolderUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                            >
                              Open <ExternalLink className="w-3 h-3" />
                            </a>
                            <button
                              onClick={() => handleDisconnectBoardDrive(b.boardId)}
                              className="text-[10px] font-bold text-red-500 hover:text-red-700 inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 transition cursor-pointer"
                            >
                              Disconnect
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Name Your Drive Popup */}
          <AnimatePresence>
            {showDriveNamePopup && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 rounded-xl">
                        <HardDrive className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-slate-900">Connect Google Drive</p>
                        <p className="text-xs text-slate-500">Give this Drive a name so your team can identify it</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDriveNamePopup(false)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Drive Name</label>
                    <input
                      type="text"
                      value={driveName}
                      onChange={(e) => setDriveName(e.target.value)}
                      placeholder="e.g. Zim's Drive, Marketing Drive, Team Drive"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                      autoFocus
                    />
                    <p className="text-[11px] text-slate-400">This name will appear in dropdowns when assigning Drive to boards. Connecting does not assign this Drive to any board — use the Board Assignments section below to assign it.</p>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Google API Credentials (required)</p>

                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl space-y-1.5">
                      <p className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Add this redirect URI to your OAuth client
                      </p>
                      <p className="text-[10px] text-amber-700">In Google Cloud Console → APIs & Services → Credentials → edit your Web OAuth client → add under Authorized redirect URIs:</p>
                      <div className="flex items-center gap-2 bg-white border border-amber-300 rounded-lg px-3 py-2 mt-1">
                        <code className="text-[11px] font-mono text-amber-900 break-all flex-1">{redirectUri || 'Loading...'}</code>
                        <button
                          onClick={() => {
                            if (redirectUri) {
                              navigator.clipboard.writeText(redirectUri);
                              showToast('Redirect URI copied to clipboard', 'success');
                            }
                          }}
                          className="shrink-0 px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-[10px] font-bold transition cursor-pointer"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Google Client ID</label>
                        <input
                          type="text"
                          value={customDriveClientId}
                          onChange={(e) => setCustomDriveClientId(e.target.value)}
                          placeholder="xxx.apps.googleusercontent.com"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Google Client Secret</label>
                        <div className="relative">
                          <input
                            type={showCustomDriveSecret ? 'text' : 'password'}
                            value={customDriveClientSecret}
                            onChange={(e) => setCustomDriveClientSecret(e.target.value)}
                            placeholder="GOCSPX-xxxx"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition pr-8"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCustomDriveSecret(!showCustomDriveSecret)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                          >
                            {showCustomDriveSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDriveNamePopup(false)}
                      className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConnectDrive}
                      disabled={connectingDrive || !driveName.trim() || !customDriveClientId.trim() || !customDriveClientSecret.trim()}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {connectingDrive ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      {connectingDrive ? 'Authorizing...' : 'Continue to Google Auth'}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Manage Credentials Popup */}
          <AnimatePresence>
            {editCredsConnection && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                onClick={(e) => { if (e.target === e.currentTarget) { setEditCredsConnection(null); } }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-5"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 rounded-xl">
                        <Key className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-slate-900">Manage API Credentials</p>
                        <p className="text-xs text-slate-500 truncate max-w-[220px]">{editCredsConnection.label || editCredsConnection.googleEmail}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditCredsConnection(null)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Status badge */}
                  <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border ${editCredsConnection.hasCustomCredentials ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-200'}`}>
                    <ShieldCheck className={`w-5 h-5 shrink-0 ${editCredsConnection.hasCustomCredentials ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <div>
                      <p className={`text-xs font-bold ${editCredsConnection.hasCustomCredentials ? 'text-indigo-800' : 'text-slate-600'}`}>
                        {editCredsConnection.hasCustomCredentials ? 'Custom credentials are active' : 'Using global / environment credentials'}
                      </p>
                      {editCredsConnection.hasCustomCredentials && editCredsConnection.clientId && (
                        <p className="text-[10px] text-indigo-500 mt-0.5 font-mono truncate">{editCredsConnection.clientId}</p>
                      )}
                    </div>
                  </div>

                  {/* Form */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Google Client ID</label>
                      <input
                        type="text"
                        value={editCredsForm.clientId}
                        onChange={(e) => setEditCredsForm(prev => ({ ...prev, clientId: e.target.value }))}
                        placeholder="xxx.apps.googleusercontent.com"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Google Client Secret
                        {editCredsConnection.hasCustomCredentials && (
                          <span className="ml-2 font-normal text-slate-400 normal-case tracking-normal">(enter new value to update)</span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type={showEditCredsSecret ? 'text' : 'password'}
                          value={editCredsForm.clientSecret}
                          onChange={(e) => setEditCredsForm(prev => ({ ...prev, clientSecret: e.target.value }))}
                          placeholder={editCredsConnection.hasCustomCredentials ? '••••••••  (leave blank to keep existing)' : 'GOCSPX-xxxx'}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowEditCredsSecret(!showEditCredsSecret)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                        >
                          {showEditCredsSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Info note */}
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    These credentials override the global OAuth settings for this specific connection only. Leave both fields empty to clear and revert to global credentials.
                  </p>

                  {/* Actions */}
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => setEditCredsConnection(null)}
                      className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveConnCreds}
                      disabled={savingCreds}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {savingCreds ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {savingCreds ? 'Saving...' : 'Save Credentials'}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Assign Drive Popup */}
          <AnimatePresence>
            {showEnablePopup && selectedBoardId && selectedConnectionId && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 rounded-xl">
                        <HardDrive className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-slate-900">Assign Google Drive</p>
                        <p className="text-xs text-slate-500">{boards.find((b) => b.boardId === selectedBoardId)?.name}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowEnablePopup(false)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <p className="text-xs font-bold text-slate-700">A Drive folder will be created at:</p>
                    <p className="text-sm font-mono text-indigo-700 bg-white border border-slate-200 rounded-lg px-3 py-2">
                      Syncronz/{boards.find((b) => b.boardId === selectedBoardId)?.name || selectedBoardId}
                    </p>
                    <p className="text-xs text-slate-500">
                      Using: {connections.find((c) => c.connectionId === selectedConnectionId)?.googleEmail || 'Unknown'}
                    </p>
                    <p className="text-[11px] text-slate-400">Team members will access files through this connection automatically.</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowEnablePopup(false)}
                      className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAssignBoardDrive}
                      disabled={enablingDrive}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {enablingDrive ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <HardDrive className="w-4 h-4" />
                      )}
                      {enablingDrive ? 'Assigning...' : 'Confirm Assign'}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Instructions */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-slate-900">How Google Drive Integration Works</p>
                <ol className="mt-2 space-y-1.5 text-xs text-slate-500 leading-relaxed list-decimal list-inside">
                  <li>Click <strong>Connect New Google Drive</strong> and sign in with any Google account that has access to Google Drive</li>
                  <li>The connection is encrypted and stored securely — team members never need to authorize Drive individually</li>
                  <li>Select a board below and choose the Drive account to assign</li>
                  <li>A <span className="font-mono">Syncronz/BoardName/</span> folder is created in that Drive account</li>
                  <li>Files uploaded in task attachments go directly to that board&apos;s Drive folder</li>
                  <li>One Drive account can power multiple boards; one board uses exactly one Drive account</li>
                  <li>If a token expires, reconnect the same account with <strong>Connect New Google Drive</strong> to refresh</li>
                </ol>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
