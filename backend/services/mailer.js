const axios = require('axios');
const nodemailer = require('nodemailer');

// Email can be sent three ways, in priority order:
//   1. Resend  (HTTP API)  — set RESEND_API_KEY
//   2. Brevo   (HTTP API)  — set BREVO_API_KEY
//   3. SMTP    (nodemailer)— set SMTP_HOST/USER/PASS
// HTTP APIs use port 443 and work on hosts (like Render) that block outbound SMTP.
const {
  RESEND_API_KEY,
  BREVO_API_KEY,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
} = process.env;

// Parse "Name <email@host>" (or a bare email) into { name, email }.
const parseFrom = (raw) => {
  const s = (raw || '').trim();
  const m = s.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1] || undefined, email: m[2] };
  return { name: undefined, email: s };
};

const provider = RESEND_API_KEY ? 'resend'
  : BREVO_API_KEY ? 'brevo'
  : (SMTP_HOST && SMTP_USER && SMTP_PASS) ? 'smtp'
  : null;

let transporter = null;
if (provider === 'smtp') {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

async function deliver({ to, subject, text, html }) {
  const from = SMTP_FROM || SMTP_USER || 'onboarding@resend.dev';

  if (provider === 'resend') {
    await axios.post('https://api.resend.com/emails',
      { from, to: [to], subject, html, text },
      { headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' }, timeout: 15000 });
    return true;
  }

  if (provider === 'brevo') {
    const sender = parseFrom(from);
    await axios.post('https://api.brevo.com/v3/smtp/email',
      { sender, to: [{ email: to }], subject, htmlContent: html, textContent: text },
      { headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json', accept: 'application/json' }, timeout: 15000 });
    return true;
  }

  if (provider === 'smtp') {
    await transporter.sendMail({ from, to, subject, text, html });
    return true;
  }

  throw new Error('No email provider configured (set RESEND_API_KEY, BREVO_API_KEY or SMTP_*).');
}

// Surface a readable reason from HTTP-API failures.
const cleanError = (e) => {
  const d = e.response?.data;
  if (d) return typeof d === 'string' ? d : (d.message || d.error || JSON.stringify(d));
  return e.message || 'Email send failed';
};

const mailer = {
  isConfigured: Boolean(provider),
  provider,

  async sendPasswordReset(to, resetUrl, username) {
    if (!provider) return false;
    try {
      await deliver({
        to,
        subject: 'Reset your GoldenBidX password',
        text: `Hello ${username},\n\nWe received a request to reset your password. Open the link below to set a new one (valid for 1 hour):\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
        html: `<p>Hello ${username},</p><p>We received a request to reset your password. Click the button below to set a new one (valid for 1 hour):</p><p><a href="${resetUrl}" style="display:inline-block;background:#e8b84b;color:#111;padding:10px 18px;border-radius:9999px;font-weight:700;text-decoration:none">Reset password</a></p><p>Or copy this link:<br>${resetUrl}</p><p style="color:#888;font-size:12px">If you did not request this, you can safely ignore this email.</p>`,
      });
      return true;
    } catch (e) {
      throw new Error(cleanError(e));
    }
  },

  async sendOrganizerWelcome(to, username, setupUrl) {
    if (!provider) return false;
    try {
      const linkBlock = setupUrl
        ? `<p>To set your password, click the button below (valid for 7 days):</p><p><a href="${setupUrl}" style="display:inline-block;background:#e8b84b;color:#111;padding:10px 18px;border-radius:9999px;font-weight:700;text-decoration:none">Set your password</a></p><p>Or copy this link:<br>${setupUrl}</p>`
        : '<p>Your administrator will share your password with you.</p>';
      await deliver({
        to,
        subject: 'Welcome to GoldenBidX',
        text: `Hi,\n\nAn organizer account has been created for you on GoldenBidX.\n\nUsername: ${username}\n\n${setupUrl ? `Set your password (valid for 7 days): ${setupUrl}` : 'Your administrator will share your password with you.'}\n\nSee you inside!`,
        html: `<p>Hi,</p><p>An organizer account has been created for you on <b>GoldenBidX</b>.</p><p><b>Username:</b> ${username}</p>${linkBlock}<p style="color:#888;font-size:12px">If you weren't expecting this, you can ignore this email.</p>`,
      });
      return true;
    } catch (e) {
      throw new Error(cleanError(e));
    }
  },

  async sendSignupWelcome(to, username, loginUrl) {
    if (!provider) return false;
    try {
      const linkBlock = loginUrl
        ? `<p><a href="${loginUrl}" style="display:inline-block;background:#e8b84b;color:#111;padding:10px 18px;border-radius:9999px;font-weight:700;text-decoration:none">Go to GoldenBidX</a></p>`
        : '';
      await deliver({
        to,
        subject: 'Welcome to GoldenBidX 🎉',
        text: `Hi ${username},\n\nYour GoldenBidX organizer account is ready. You can sign in anytime and start creating events.\n\nUsername: ${username}${loginUrl ? `\n\n${loginUrl}` : ''}\n\nSee you inside!`,
        html: `<p>Hi ${username},</p><p>Your <b>GoldenBidX</b> organizer account is ready. Sign in anytime to create events and collect player registrations.</p><p><b>Username:</b> ${username}</p>${linkBlock}<p style="color:#888;font-size:12px">If you didn't create this account, please contact us.</p>`,
      });
      return true;
    } catch (e) {
      throw new Error(cleanError(e));
    }
  },

  async sendNewOrganizerNotice(to, org) {
    if (!provider) return false;
    try {
      await deliver({
        to,
        subject: `New GoldenBidX organizer signup: ${org.username}`,
        text: `A new organizer just signed up.\n\nUsername: ${org.username}\nName: ${org.name || '-'}\nEmail: ${org.email || '-'}\nPhone: ${org.phone || '-'}`,
        html: `<p>A new organizer just signed up on GoldenBidX.</p><ul><li><b>Username:</b> ${org.username}</li><li><b>Name:</b> ${org.name || '-'}</li><li><b>Email:</b> ${org.email || '-'}</li><li><b>Phone:</b> ${org.phone || '-'}</li></ul>`,
      });
      return true;
    } catch (e) {
      throw new Error(cleanError(e));
    }
  },

  async sendTest(to) {
    if (!provider) throw new Error('No email provider configured (set RESEND_API_KEY, BREVO_API_KEY or SMTP_*).');
    try {
      await deliver({
        to,
        subject: 'GoldenBidX email test',
        text: 'This is a test email from GoldenBidX. If you received this, email delivery is working correctly.',
        html: '<p>This is a test email from <b>GoldenBidX</b>.</p><p>If you received this, your email delivery is working correctly. 🎉</p>',
      });
      return true;
    } catch (e) {
      throw new Error(cleanError(e));
    }
  },
};

module.exports = mailer;
