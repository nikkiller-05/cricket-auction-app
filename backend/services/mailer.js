const nodemailer = require('nodemailer');

// SMTP is optional: when the env vars are absent we degrade gracefully and the
// caller falls back to the "request to admin" flow.
const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
} = process.env;

let transporter = null;
const isConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

if (isConfigured) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    // Fail fast instead of hanging when the host/port is unreachable or blocked.
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

const mailer = {
  isConfigured,

  async sendPasswordReset(to, resetUrl, username) {
    if (!transporter) return false;
    const from = SMTP_FROM || SMTP_USER;
    await transporter.sendMail({
      from,
      to,
      subject: 'Reset your registration console password',
      text: `Hello ${username},\n\nWe received a request to reset your password. Open the link below to set a new one (valid for 1 hour):\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
      html: `<p>Hello ${username},</p><p>We received a request to reset your password. Click the button below to set a new one (valid for 1 hour):</p><p><a href="${resetUrl}" style="display:inline-block;background:#e8b84b;color:#111;padding:10px 18px;border-radius:9999px;font-weight:700;text-decoration:none">Reset password</a></p><p>Or copy this link: <br>${resetUrl}</p><p style="color:#888;font-size:12px">If you did not request this, you can safely ignore this email.</p>`,
    });
    return true;
  },

  async sendTest(to) {
    if (!transporter) throw new Error('SMTP is not configured (missing SMTP_HOST/USER/PASS)');
    const from = SMTP_FROM || SMTP_USER;
    await transporter.sendMail({
      from,
      to,
      subject: 'GoldenBidX SMTP test',
      text: 'This is a test email from GoldenBidX. If you received this, your SMTP settings are working correctly.',
      html: '<p>This is a test email from <b>GoldenBidX</b>.</p><p>If you received this, your SMTP settings are working correctly. 🎉</p>',
    });
    return true;
  },
};

module.exports = mailer;
