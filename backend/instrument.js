// Loaded as the VERY FIRST thing in server.js (before app/http/express) so
// Sentry can auto-instrument them. Loads dotenv first so SENTRY_DSN is available.
// Safe no-op when SENTRY_DSN isn't set — local/dev/test runs are unaffected.
require('dotenv').config();
const Sentry = require('@sentry/node');

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    // Errors are always captured; sample a fraction of traces for performance.
    tracesSampleRate: 0.1,
  });
  console.log('🛡️  Sentry error monitoring enabled');
} else {
  console.log('ℹ️  Sentry disabled (no SENTRY_DSN set)');
}

module.exports = Sentry;
