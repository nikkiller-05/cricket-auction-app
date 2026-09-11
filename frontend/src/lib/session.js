// Single source of truth for client-side auth sessions.
//
// The app has two independent JWT sessions, both stored in localStorage:
//   - `adminToken`               → auction admin/operator (routes to /dashboard)
//   - `regToken` + `regUser`     → organizer console      (routes to /console)
//
// This module reads/decodes/validates them in one place so every surface
// (landing nav, dashboard, console) agrees on who is logged in and expires
// sessions consistently. JWTs are signed with a 24h expiry on the backend.

const ADMIN_TOKEN = 'adminToken';
const REG_TOKEN = 'regToken';
const REG_USER = 'regUser';

// Decode a JWT payload without verifying the signature (client-side display
// only — the backend still verifies on every request). Returns null on any
// malformed input.
export function decodeToken(token) {
  if (!token || typeof token !== 'string') return null;
  const part = token.split('.')[1];
  if (!part) return null;
  try {
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

// True when a decoded payload carries an `exp` (seconds since epoch) in the past.
export function isExpired(payload) {
  if (!payload || typeof payload.exp !== 'number') return false;
  return payload.exp * 1000 <= Date.now();
}

// Returns the decoded payload if the token is present and unexpired, else null.
function validPayload(token) {
  const payload = decodeToken(token);
  if (!payload || isExpired(payload)) return null;
  return payload;
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_TOKEN);
}

export function clearConsoleSession() {
  localStorage.removeItem(REG_TOKEN);
  localStorage.removeItem(REG_USER);
}

export function clearAllSessions() {
  clearAdminSession();
  clearConsoleSession();
}

// Inspect both stored sessions, purging any that are expired/malformed.
// Returns { admin, console } where each is null or { token, user, destination }.
export function getSessions() {
  const result = { admin: null, console: null };

  const adminToken = localStorage.getItem(ADMIN_TOKEN);
  const adminPayload = validPayload(adminToken);
  if (adminPayload) {
    result.admin = {
      token: adminToken,
      user: { username: adminPayload.username, role: adminPayload.role },
      destination: '/dashboard',
    };
  } else if (adminToken) {
    clearAdminSession(); // drop stale/expired token
  }

  const regToken = localStorage.getItem(REG_TOKEN);
  const regPayload = validPayload(regToken);
  if (regPayload) {
    let user = { username: regPayload.username, role: regPayload.role };
    try {
      const stored = localStorage.getItem(REG_USER);
      if (stored) user = { ...user, ...JSON.parse(stored) };
    } catch {
      /* fall back to token payload */
    }
    result.console = { token: regToken, user, destination: '/console' };
  } else if (regToken) {
    clearConsoleSession(); // drop stale/expired token
  }

  return result;
}

// A single "primary" session for the landing-page CTA. The organizer console
// is the main hub, so it wins when both exist.
export function getPrimarySession() {
  const { admin, console: consoleSession } = getSessions();
  const active = consoleSession || admin;
  if (!active) return null;
  return {
    ...active,
    destinationLabel: active.destination === '/console' ? 'Console' : 'Dashboard',
  };
}
