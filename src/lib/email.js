import nodemailer from 'nodemailer';
import { decrypt } from './crypto.js';

function buildTransport(smtpConfig) {
  return nodemailer.createTransport({
    host: smtpConfig.host,
    port: parseInt(smtpConfig.port, 10) || 587,
    secure: parseInt(smtpConfig.port, 10) === 465,
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.pass,
    },
  });
}

function buildInviteHtml({ displayName, adminName, inviteLink }) {
  const name = displayName || 'there';
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <tr>
            <td style="background:linear-gradient(135deg,#1e293b,#0f172a);padding:32px 40px;text-align:center;">
              <div style="display:inline-block;width:48px;height:48px;background:rgba(255,255,255,0.1);border-radius:12px;line-height:48px;font-size:22px;font-weight:800;color:#818cf8;border:1px solid rgba(255,255,255,0.08);">S</div>
              <h1 style="color:#ffffff;font-size:22px;font-weight:800;margin:16px 0 0 0;letter-spacing:-0.3px;">Syncronz</h1>
              <p style="color:#94a3b8;font-size:13px;margin:4px 0 0 0;">Collaborative Task Management</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="color:#1e293b;font-size:20px;font-weight:700;margin:0 0 8px 0;">You're Invited</h2>
              <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px 0;">Hi ${name},</p>
              <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px 0;">
                <strong style="color:#1e293b;">${adminName}</strong> has invited you to join <strong style="color:#1e293b;">Syncronz</strong> — a collaborative task management workspace where your team can track, organize, and complete work together in real time.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${inviteLink}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:12px;box-shadow:0 4px 12px rgba(99,102,241,0.3);">Accept Invitation</a>
                  </td>
                </tr>
              </table>
              <p style="color:#94a3b8;font-size:12px;line-height:1.5;margin:0 0 4px 0;">This invitation was sent to you because you were invited to join the Syncronz workspace.</p>
              <p style="color:#94a3b8;font-size:12px;line-height:1.5;margin:0;">If you weren't expecting this, you can safely ignore this email.</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="color:#94a3b8;font-size:11px;margin:0;">&copy; ${new Date().getFullYear()} Syncronz. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

function buildInviteText({ displayName, adminName, inviteLink }) {
  const name = displayName || 'there';
  return [
    `Hi ${name},`,
    '',
    `${adminName} has invited you to join Syncronz — a collaborative task management workspace.`,
    '',
    `Accept your invitation here: ${inviteLink}`,
    '',
    'If you weren\'t expecting this, you can safely ignore this email.',
    '',
    '— Syncronz Team',
  ].join('\n');
}

export async function sendInviteEmail({ smtpConfig, to, displayName, adminName, inviteLink }) {
  const keyHex = process.env.SMTP_ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error('SMTP_ENCRYPTION_KEY not configured');
  }
  const pass = decrypt(smtpConfig.passEncrypted, keyHex);
  const transport = buildTransport({ ...smtpConfig, pass });
  const html = buildInviteHtml({ displayName, adminName, inviteLink });
  const text = buildInviteText({ displayName, adminName, inviteLink });
  await transport.sendMail({
    from: `"${smtpConfig.fromName || 'Syncronz'}" <${smtpConfig.fromEmail || smtpConfig.user}>`,
    to,
    subject: `You've been invited to Syncronz by ${adminName}`,
    html,
    text,
  });
}
