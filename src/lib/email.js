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

function buildChecklistHtml(subtasks) {
  if (!subtasks || subtasks.length === 0) return '';
  const itemsHtml = subtasks.map(sub => {
    let assignmentText = '';
    let completedInfo = '';
    const isCompleted = sub.assigneeType === 'individual' ? false : (sub.completed || false);
    
    if (sub.assigneeType === 'specific') {
      const uids = Array.isArray(sub.assignedTo) ? sub.assignedTo : [sub.assignedTo].filter(Boolean);
      assignmentText = ` <span style="font-size:11px;color:#6366f1;font-weight:bold;">(Assigned to ${uids.length > 1 ? `${uids.length} members` : 'specific member'})</span>`;
    } else if (sub.assigneeType === 'individual') {
      assignmentText = ' <span style="font-size:11px;color:#f59e0b;font-weight:bold;">(Individual tracker)</span>';
      const count = sub.completedBy?.length || 0;
      if (count > 0) {
        completedInfo = ` <span style="font-size:11px;color:#10b981;font-weight:bold;">(${count} checked)</span>`;
      }
    }

    return `
    <tr style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:#475569;line-height:1.6;">
      <td style="padding:6px 0;width:24px;vertical-align:middle;text-align:left;">
        ${isCompleted ? 
          '<span style="display:inline-block;width:14px;height:14px;border:1px solid #10b981;background-color:#10b981;color:#ffffff;font-size:10px;line-height:14px;text-align:center;border-radius:4px;font-weight:bold;">&#10003;</span>' : 
          '<span style="display:inline-block;width:14px;height:14px;border:1px solid #cbd5e1;background-color:#ffffff;border-radius:4px;"></span>'
        }
      </td>
      <td style="padding:6px 0;vertical-align:middle;${isCompleted ? 'text-decoration:line-through;color:#94a3b8;' : ''}">
        ${sub.title}${assignmentText}${completedInfo}
      </td>
    </tr>
  `}).join('');

  return `
    <div style="margin:16px 0 0 0;padding-top:14px;border-top:1px dashed #e2e8f0;">
      <p style="color:#1e293b;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px 0;">Interactive Checklist</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${itemsHtml}
      </table>
    </div>
  `;
}

function buildChecklistText(subtasks) {
  if (!subtasks || subtasks.length === 0) return '';
  return '\nChecklist:\n' + subtasks.map(sub => {
    let extra = '';
    if (sub.assigneeType === 'specific') {
      const uids = Array.isArray(sub.assignedTo) ? sub.assignedTo : [sub.assignedTo].filter(Boolean);
      extra = ` (Assigned to ${uids.length > 1 ? `${uids.length} members` : 'specific member'})`;
    } else if (sub.assigneeType === 'individual') {
      const count = sub.completedBy?.length || 0;
      extra = ` (Individual - ${count} checked)`;
    }
    const isCompleted = sub.assigneeType === 'individual' ? false : (sub.completed || false);
    return `  ${isCompleted ? '[x]' : '[ ]'} ${sub.title}${extra}`;
  }).join('\n');
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
              <h1 style="color:#ffffff;font-size:24px;font-weight:850;margin:12px 0 0 0;letter-spacing:-0.5px;">Syncro</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="color:#1e293b;font-size:20px;font-weight:700;margin:0 0 8px 0;">You're Invited</h2>
              <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px 0;">Hi ${name},</p>
              <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px 0;">
                You have been invited to join <strong style="color:#1e293b;">Syncro</strong> by <strong style="color:#1e293b;">${adminName || 'an administrator'}</strong>.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${inviteLink}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:12px;box-shadow:0 4px 12px rgba(99,102,241,0.3);">Accept Invitation</a>
                  </td>
                </tr>
              </table>
              <p style="color:#94a3b8;font-size:12px;line-height:1.5;margin:0 0 4px 0;">This invitation was sent to you from Syncro.</p>
              <p style="color:#94a3b8;font-size:12px;line-height:1.5;margin:0;">If you weren't expecting this, you can safely ignore this email.</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="color:#94a3b8;font-size:11px;margin:0;">&copy; ${new Date().getFullYear()} Syncro. All rights reserved.</p>
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
    `You have been invited to join Syncro.`,
    '',
    `Accept your invitation here: ${inviteLink}`,
    '',
    'If you weren\'t expecting this, you can safely ignore this email.',
    '',
    'Syncro Team',
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
    from: `"${smtpConfig.fromName || 'Syncro'}" <${smtpConfig.fromEmail || smtpConfig.user}>`,
    to,
    subject: `You've been invited to join Syncro`,
    html,
    text,
  });
}

function buildBoardJoinedHtml({ boardName, inviterName, link }) {
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
              <h1 style="color:#ffffff;font-size:24px;font-weight:850;margin:12px 0 0 0;letter-spacing:-0.5px;">Syncro</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="color:#1e293b;font-size:20px;font-weight:700;margin:0 0 8px 0;">Added to Board</h2>
              <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px 0;">Hello,</p>
              <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px 0;">
                You have been added to the board <strong style="color:#1e293b;">${boardName}</strong> by <strong style="color:#1e293b;">${inviterName}</strong> on Syncro.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:12px;box-shadow:0 4px 12px rgba(99,102,241,0.3);">Open Board</a>
                  </td>
                </tr>
              </table>
              <p style="color:#94a3b8;font-size:12px;line-height:1.5;margin:0 0 4px 0;">This email was sent from Syncro.</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="color:#94a3b8;font-size:11px;margin:0;">&copy; ${new Date().getFullYear()} Syncro. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

function buildBoardJoinedText({ boardName, inviterName, link }) {
  return [
    `Hello,`,
    '',
    `You have been added to the board "${boardName}" by ${inviterName} on Syncro.`,
    '',
    `Open the board here: ${link}`,
    '',
    'Syncro Team',
  ].join('\n');
}

function buildTaskAssignedHtml({ taskTitle, boardName, actorName, dueDate, priority, subtasks, link }) {
  const priorityColor = priority?.toLowerCase() === 'high' ? '#ef4444' : priority?.toLowerCase() === 'medium' ? '#f59e0b' : '#10b981';
  const checklistSection = buildChecklistHtml(subtasks);
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
              <h1 style="color:#ffffff;font-size:24px;font-weight:850;margin:12px 0 0 0;letter-spacing:-0.5px;">Syncro</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="color:#1e293b;font-size:20px;font-weight:700;margin:0 0 8px 0;">New Task Assigned</h2>
              <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px 0;">Hello,</p>
              <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px 0;">
                You have been assigned a new task <strong style="color:#1e293b;">"${taskTitle}"</strong> on board <strong style="color:#1e293b;">${boardName}</strong> by <strong style="color:#1e293b;">${actorName}</strong>.
              </p>
              <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 16px;margin:0 0 24px 0;">
                ${priority ? `<p style="color:#475569;font-size:13px;margin:0 0 6px 0;line-height:1.4;"><strong>Priority:</strong> <span style="color:${priorityColor};font-weight:bold;text-transform:capitalize;">${priority}</span></p>` : ''}
                ${dueDate ? `<p style="color:#475569;font-size:13px;margin:0;line-height:1.4;"><strong>Due Date:</strong> ${dueDate}</p>` : ''}
                ${checklistSection}
              </div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:12px;box-shadow:0 4px 12px rgba(99,102,241,0.3);">View Task</a>
                  </td>
                </tr>
              </table>
              <p style="color:#94a3b8;font-size:12px;line-height:1.5;margin:0 0 4px 0;">This email was sent from Syncro.</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="color:#94a3b8;font-size:11px;margin:0;">&copy; ${new Date().getFullYear()} Syncro. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

function buildTaskAssignedText({ taskTitle, boardName, actorName, dueDate, priority, subtasks, link }) {
  return [
    `Hello,`,
    '',
    `You have been assigned a new task "${taskTitle}" on board "${boardName}" by ${actorName}.`,
    priority ? `Priority: ${priority}` : '',
    dueDate ? `Due Date: ${dueDate}` : '',
    buildChecklistText(subtasks),
    '',
    `View the task here: ${link}`,
    '',
    'Syncro Team',
  ].filter(Boolean).join('\n');
}

function buildTaskUpdatedHtml({ taskTitle, boardName, actorName, details, priority, subtasks, link }) {
  const priorityColor = priority?.toLowerCase() === 'high' ? '#ef4444' : priority?.toLowerCase() === 'medium' ? '#f59e0b' : '#10b981';
  const checklistSection = buildChecklistHtml(subtasks);
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
              <h1 style="color:#ffffff;font-size:24px;font-weight:850;margin:12px 0 0 0;letter-spacing:-0.5px;">Syncro</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="color:#1e293b;font-size:20px;font-weight:700;margin:0 0 8px 0;">Task Updated</h2>
              <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px 0;">Hello,</p>
              <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px 0;">
                The task <strong style="color:#1e293b;">"${taskTitle}"</strong> on board <strong style="color:#1e293b;">${boardName}</strong> has been updated by <strong style="color:#1e293b;">${actorName}</strong>.
              </p>
              ${priority ? `<p style="color:#475569;font-size:13px;margin:0 0 12px 0;"><strong>Priority:</strong> <span style="color:${priorityColor};font-weight:bold;text-transform:capitalize;">${priority}</span></p>` : ''}
              ${details ? `<p style="color:#475569;font-size:13px;background-color:#f8fafc;border-left:4px solid #818cf8;padding:12px;margin:0 0 20px 0;font-style:italic;">${details}</p>` : ''}
              ${checklistSection ? `<div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 16px;margin:0 0 24px 0;">${checklistSection}</div>` : ''}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:12px;box-shadow:0 4px 12px rgba(99,102,241,0.3);">View Task</a>
                  </td>
                </tr>
              </table>
              <p style="color:#94a3b8;font-size:12px;line-height:1.5;margin:0 0 4px 0;">This email was sent from Syncro.</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="color:#94a3b8;font-size:11px;margin:0;">&copy; ${new Date().getFullYear()} Syncro. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

function buildTaskUpdatedText({ taskTitle, boardName, actorName, details, priority, subtasks, link }) {
  return [
    `Hello,`,
    '',
    `The task "${taskTitle}" on board "${boardName}" has been updated by ${actorName}.`,
    priority ? `Priority: ${priority}` : '',
    details ? `Details: ${details}` : '',
    buildChecklistText(subtasks),
    '',
    `View the task here: ${link}`,
    '',
    'Syncro Team',
  ].filter(Boolean).join('\n');
}

async function withRetry(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

async function sendSingleMail({ smtpConfig, type, to, recipientName, actorName, boardName, taskTitle, details, link, dueDate, priority, subtasks }) {
  let html = '';
  let text = '';
  let subject = '';

  if (type === 'board_joined') {
    html = buildBoardJoinedHtml({ boardName, inviterName: actorName, link });
    text = buildBoardJoinedText({ boardName, inviterName: actorName, link });
    subject = `You've been added to the board "${boardName}"`;
  } else if (type === 'task_assigned') {
    html = buildTaskAssignedHtml({ taskTitle, boardName, actorName, dueDate, priority, subtasks, link });
    text = buildTaskAssignedText({ taskTitle, boardName, actorName, dueDate, priority, subtasks, link });
    subject = `New Task Assigned: "${taskTitle}"`;
  } else if (type === 'task_updated') {
    html = buildTaskUpdatedHtml({ taskTitle, boardName, actorName, details, priority, subtasks, link });
    text = buildTaskUpdatedText({ taskTitle, boardName, actorName, details, priority, subtasks, link });
    subject = `Task Updated: "${taskTitle}"`;
  } else {
    throw new Error(`Unsupported email notification type: ${type}`);
  }

  await withRetry(() => transport.sendMail({
    from: `"${smtpConfig.fromName || 'Syncro'}" <${smtpConfig.fromEmail || smtpConfig.user}>`,
    to,
    subject,
    html,
    text,
  }));
}

let transport = null;

export async function sendActionEmail({ smtpConfig, type, to, recipientName, actorName, boardName, taskTitle, details, link, dueDate, priority, subtasks }) {
  const keyHex = process.env.SMTP_ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error('SMTP_ENCRYPTION_KEY not configured');
  }
  const pass = decrypt(smtpConfig.passEncrypted, keyHex);
  transport = buildTransport({ ...smtpConfig, pass });

  await sendSingleMail({ smtpConfig, type, to, recipientName, actorName, boardName, taskTitle, details, link, dueDate, priority, subtasks });
}

export async function sendActionEmails({ smtpConfig, type, recipients, actorName, boardName, taskTitle, details, link, dueDate, priority, subtasks }) {
  const keyHex = process.env.SMTP_ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error('SMTP_ENCRYPTION_KEY not configured');
  }
  const pass = decrypt(smtpConfig.passEncrypted, keyHex);
  transport = buildTransport({ ...smtpConfig, pass });

  const results = await Promise.allSettled(
    recipients.map(r =>
      sendSingleMail({
        smtpConfig,
        type,
        to: r.email,
        recipientName: r.name || '',
        actorName,
        boardName,
        taskTitle,
        details,
        link,
        dueDate,
        priority,
        subtasks,
      })
    )
  );
  const failures = results.filter(r => r.status === 'rejected');
  if (failures.length > 0) {
    console.error(`[sendActionEmails] ${failures.length}/${recipients.length} emails failed:`, failures.map(f => f.reason));
  }
  return { sent: recipients.length - failures.length, failed: failures.length };
}
