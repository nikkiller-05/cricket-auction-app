import {
  decodeToken,
  isExpired,
  getSessions,
  getPrimarySession,
  clearAllSessions,
} from './session';

// Build an unsigned JWT-shaped string with the given payload (only the payload
// segment is read client-side).
function makeToken(payload) {
  const body = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_');
  return `header.${body}.sig`;
}

const future = () => Math.floor(Date.now() / 1000) + 3600;
const past = () => Math.floor(Date.now() / 1000) - 3600;

beforeEach(() => {
  localStorage.clear();
});

describe('decodeToken', () => {
  test('decodes a well-formed token payload', () => {
    const token = makeToken({ username: 'sa', role: 'super-admin', exp: future() });
    expect(decodeToken(token)).toMatchObject({ username: 'sa', role: 'super-admin' });
  });

  test('returns null for malformed input', () => {
    expect(decodeToken(null)).toBeNull();
    expect(decodeToken('not-a-jwt')).toBeNull();
    expect(decodeToken('a.@@@.c')).toBeNull();
  });
});

describe('isExpired', () => {
  test('true when exp is in the past', () => {
    expect(isExpired({ exp: past() })).toBe(true);
  });
  test('false when exp is in the future or missing', () => {
    expect(isExpired({ exp: future() })).toBe(false);
    expect(isExpired({})).toBe(false);
  });
});

describe('getSessions', () => {
  test('returns an admin session for a valid adminToken', () => {
    localStorage.setItem('adminToken', makeToken({ username: 'op', role: 'admin', exp: future() }));
    const { admin, console: c } = getSessions();
    expect(c).toBeNull();
    expect(admin).toMatchObject({ destination: '/dashboard', user: { username: 'op', role: 'admin' } });
  });

  test('returns a console session and merges stored regUser', () => {
    localStorage.setItem('regToken', makeToken({ username: 'org', role: 'organizer', exp: future() }));
    localStorage.setItem('regUser', JSON.stringify({ username: 'org', name: 'Org Name', role: 'organizer' }));
    const { console: c } = getSessions();
    expect(c).toMatchObject({ destination: '/console', user: { name: 'Org Name' } });
  });

  test('purges an expired adminToken', () => {
    localStorage.setItem('adminToken', makeToken({ username: 'op', role: 'admin', exp: past() }));
    expect(getSessions().admin).toBeNull();
    expect(localStorage.getItem('adminToken')).toBeNull();
  });

  test('purges an expired regToken and its user', () => {
    localStorage.setItem('regToken', makeToken({ username: 'org', role: 'organizer', exp: past() }));
    localStorage.setItem('regUser', JSON.stringify({ username: 'org' }));
    expect(getSessions().console).toBeNull();
    expect(localStorage.getItem('regToken')).toBeNull();
    expect(localStorage.getItem('regUser')).toBeNull();
  });
});

describe('getPrimarySession', () => {
  test('prefers the console session when both exist', () => {
    localStorage.setItem('adminToken', makeToken({ username: 'op', role: 'admin', exp: future() }));
    localStorage.setItem('regToken', makeToken({ username: 'org', role: 'organizer', exp: future() }));
    expect(getPrimarySession()).toMatchObject({ destination: '/console', destinationLabel: 'Console' });
  });

  test('falls back to the admin session when only it exists', () => {
    localStorage.setItem('adminToken', makeToken({ username: 'op', role: 'admin', exp: future() }));
    expect(getPrimarySession()).toMatchObject({ destination: '/dashboard', destinationLabel: 'Dashboard' });
  });

  test('returns null when no session exists', () => {
    expect(getPrimarySession()).toBeNull();
  });
});

describe('clearAllSessions', () => {
  test('removes all stored tokens', () => {
    localStorage.setItem('adminToken', 'x');
    localStorage.setItem('regToken', 'y');
    localStorage.setItem('regUser', 'z');
    clearAllSessions();
    expect(localStorage.getItem('adminToken')).toBeNull();
    expect(localStorage.getItem('regToken')).toBeNull();
    expect(localStorage.getItem('regUser')).toBeNull();
  });
});
