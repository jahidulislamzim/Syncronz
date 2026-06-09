import React from 'react';
import { Plus, Sparkles, Mail, Copy, Check, X, Ban } from 'lucide-react';
import { formatDate, isValidEmail } from '../utils/helpers.js';

export const InviteTabPane = ({
  inviteEmail,
  setInviteEmail,
  inviteName,
  setInviteName,
  inviting,
  handleInvite,
  adminEmail,
  invitedUsers,
  filteredInvited,
  searchQuery,
  totalInvited,
  showToast,
  confirmRevoke,
  setConfirmRevoke,
  handleRevoke
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Send Invitation</h2>
          <p className="text-sm text-slate-500 mt-0.5">Only invited email addresses can sign in with Google</p>
        </div>
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-stretch md:items-start gap-3">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                placeholder="email@example.com"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition"
              />
              <input
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                placeholder="Display name (optional)"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition"
              />
            </div>
            <button
              onClick={handleInvite}
              disabled={inviting || !inviteEmail.trim() || !isValidEmail(inviteEmail.trim())}
              className="w-full md:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-emerald-600/10 shrink-0 h-[46px]"
            >
              {inviting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : <Plus className="w-4 h-4" />}
              {inviting ? 'Inviting...' : 'Send Invite'}
            </button>
          </div>

          {invitedUsers.length === 0 && (
            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
              <p className="text-xs text-slate-600">Tip: Add yourself (<span className="font-mono font-semibold text-slate-800">{adminEmail || 'your email'}</span>) to test the sign-in flow.</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Invitations</h2>
            <p className="text-sm text-slate-500">{totalInvited} invitation{totalInvited !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {filteredInvited.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200">
              <Mail className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-900">{searchQuery ? 'No matches found' : 'No invitations yet'}</p>
            <p className="text-sm text-slate-500 mt-1">{searchQuery ? 'Try a different search term' : 'Invite users above to get started'}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredInvited.map((inv) => (
              <div key={inv.email} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 sm:py-4 gap-3 hover:bg-slate-50/50 transition">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                    inv.status === 'accepted' ? 'bg-emerald-50 text-emerald-700' :
                    inv.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                    'bg-red-50 text-red-700'
                  }`}>
                    {inv.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 truncate">{inv.displayName || 'No name'}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        inv.status === 'accepted' ? 'bg-emerald-50 text-emerald-700' :
                        inv.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {inv.status === 'accepted' ? 'Active' : inv.status === 'pending' ? 'Pending' : 'Revoked'}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 font-mono truncate mt-0.5" title={inv.email}>{inv.email}</p>
                    <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Invited {formatDate(inv.invitedAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 justify-end pl-[52px] sm:pl-0 border-t border-slate-100 sm:border-t-0 pt-2 sm:pt-0">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(inv.email);
                      showToast('Email copied to clipboard', 'success');
                    }}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                    title="Copy email"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  {confirmRevoke === inv.email ? (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-red-600 font-semibold mr-1">Confirm?</span>
                      <button
                        onClick={() => handleRevoke(inv.email)}
                        className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmRevoke(null)}
                        className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmRevoke(inv.email)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      title="Revoke invitation"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
