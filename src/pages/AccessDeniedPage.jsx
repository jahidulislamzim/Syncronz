import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ShieldCheck } from 'lucide-react';

export const AccessDeniedPage = () => {
  const { user, isAllowed, adminEmail, signOut, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (isAllowed) return <Navigate to="/" replace />;
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <ShieldCheck className="h-16 w-16 text-slate-300 mx-auto" />
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
          <p className="text-slate-500">
            This workspace is invite-only. Your account (<span className="font-mono text-slate-700">{user?.email}</span>) is not authorized.
          </p>
          {adminEmail && (
            <p className="text-slate-500 text-sm">
              Contact your admin at <span className="font-mono text-indigo-600">{adminEmail}</span> to request access.
            </p>
          )}
        </div>
        <button
          onClick={signOut}
          className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-xl transition cursor-pointer shadow-lg shadow-slate-900/15"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};
