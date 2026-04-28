'use strict';

/**
 * Unit tests for auth middleware (task 9.1)
 *
 * Tests cover:
 *  - normalizeRole: old → new role mapping
 *  - authenticate middleware: JWT verification and role normalisation
 *  - checkRole middleware: accepts both old and new role names
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

const jwt = require('jsonwebtoken');

// Set a test secret before loading modules that read process.env
process.env.secretKey = 'test-secret-key';

const { normalizeRole, ROLE_MIGRATION_MAP } = require('../middlewares/auth');
const authenticate = require('../middlewares/auth');
const checkRole = require('../middlewares/roles');

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReq(overrides = {}) {
  return {
    cookies: {},
    session: {},
    originalUrl: '/some/path',
    method: 'GET',
    path: '/some/path',
    flash: jest.fn(() => []),
    ...overrides,
  };
}

function makeRes() {
  const res = {
    redirect: jest.fn(),
    render: jest.fn(),
  };
  return res;
}

// ── normalizeRole ─────────────────────────────────────────────────────────────

describe('normalizeRole', () => {
  test('maps old USER to STUDENT', () => {
    expect(normalizeRole('USER')).toBe('STUDENT');
  });

  test('maps old DEPARTEMENT to SUPERVISOR', () => {
    expect(normalizeRole('DEPARTEMENT')).toBe('SUPERVISOR');
  });

  test('maps old ENTREPRISE to COMPANY', () => {
    expect(normalizeRole('ENTREPRISE')).toBe('COMPANY');
  });

  test('ADMIN maps to ADMIN (unchanged)', () => {
    expect(normalizeRole('ADMIN')).toBe('ADMIN');
  });

  test('new role STUDENT passes through', () => {
    expect(normalizeRole('STUDENT')).toBe('STUDENT');
  });

  test('new role TEACHER passes through', () => {
    expect(normalizeRole('TEACHER')).toBe('TEACHER');
  });

  test('new role SUPERVISOR passes through', () => {
    expect(normalizeRole('SUPERVISOR')).toBe('SUPERVISOR');
  });

  test('new role COMPANY passes through', () => {
    expect(normalizeRole('COMPANY')).toBe('COMPANY');
  });

  test('is case-insensitive', () => {
    expect(normalizeRole('user')).toBe('STUDENT');
    expect(normalizeRole('Admin')).toBe('ADMIN');
  });

  test('returns null/undefined as-is', () => {
    expect(normalizeRole(null)).toBeNull();
    expect(normalizeRole(undefined)).toBeUndefined();
  });
});

// ── ROLE_MIGRATION_MAP completeness ───────────────────────────────────────────

describe('ROLE_MIGRATION_MAP', () => {
  const oldRoles = ['USER', 'DEPARTEMENT', 'ENTREPRISE', 'ADMIN'];
  const newRoles = ['STUDENT', 'TEACHER', 'SUPERVISOR', 'COMPANY', 'ADMIN'];

  oldRoles.forEach(role => {
    test(`old role ${role} is present in map`, () => {
      expect(ROLE_MIGRATION_MAP[role]).toBeDefined();
    });
  });

  newRoles.forEach(role => {
    test(`new role ${role} is present in map`, () => {
      expect(ROLE_MIGRATION_MAP[role]).toBeDefined();
    });
  });
});

// ── authenticate middleware ───────────────────────────────────────────────────

describe('authenticate middleware', () => {
  test('redirects to login when no token cookie', () => {
    const req = makeReq({ cookies: {} });
    const res = makeRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith('/connection/login');
    expect(next).not.toHaveBeenCalled();
  });

  test('stores returnTo in session when redirecting unauthenticated request', () => {
    const req = makeReq({ cookies: {}, originalUrl: '/protected/page' });
    const res = makeRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(req.session.returnTo).toBe('/protected/page');
  });

  test('does not store returnTo for ignored paths', () => {
    const req = makeReq({ cookies: {}, originalUrl: '/favicon.ico' });
    const res = makeRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(req.session.returnTo).toBeUndefined();
  });

  test('calls next() with valid JWT and sets req.userId and req.role', () => {
    const payload = { userId: 'uuid-123', email: 'test@test.com', role: 'ADMIN' };
    const token = jwt.sign(payload, process.env.secretKey);

    const req = makeReq({ cookies: { token } });
    const res = makeRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.userId).toBe('uuid-123');
    expect(req.role).toBe('ADMIN');
  });

  test('normalises old role USER to STUDENT from JWT', () => {
    const payload = { userId: 'uuid-456', email: 'student@test.com', role: 'USER' };
    const token = jwt.sign(payload, process.env.secretKey);

    const req = makeReq({ cookies: { token } });
    const res = makeRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.role).toBe('STUDENT');
  });

  test('normalises old role DEPARTEMENT to SUPERVISOR from JWT', () => {
    const payload = { userId: 'uuid-789', email: 'dept@test.com', role: 'DEPARTEMENT' };
    const token = jwt.sign(payload, process.env.secretKey);

    const req = makeReq({ cookies: { token } });
    const res = makeRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.role).toBe('SUPERVISOR');
  });

  test('normalises old role ENTREPRISE to COMPANY from JWT', () => {
    const payload = { userId: 'uuid-abc', email: 'company@test.com', role: 'ENTREPRISE' };
    const token = jwt.sign(payload, process.env.secretKey);

    const req = makeReq({ cookies: { token } });
    const res = makeRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.role).toBe('COMPANY');
  });

  test('redirects to login on invalid/expired JWT', () => {
    const req = makeReq({ cookies: { token: 'invalid.token.here' } });
    const res = makeRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith('/connection/login');
    expect(next).not.toHaveBeenCalled();
  });
});

// ── checkRole middleware ──────────────────────────────────────────────────────

describe('checkRole middleware', () => {
  function makeAuthReq(role) {
    return makeReq({ role });
  }

  test('allows access when user role matches (new role name)', () => {
    const req = makeAuthReq('ADMIN');
    const res = makeRes();
    const next = jest.fn();

    checkRole(['ADMIN'])(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('allows access when route uses old role name and user has new role', () => {
    // server.js still calls checkRole(['USER', ...]) — user has normalised STUDENT
    const req = makeAuthReq('STUDENT');
    const res = makeRes();
    const next = jest.fn();

    checkRole(['USER', 'ADMIN'])(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('allows access when route uses old DEPARTEMENT and user has SUPERVISOR', () => {
    const req = makeAuthReq('SUPERVISOR');
    const res = makeRes();
    const next = jest.fn();

    checkRole(['DEPARTEMENT', 'ADMIN'])(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('allows access when route uses old ENTREPRISE and user has COMPANY', () => {
    const req = makeAuthReq('COMPANY');
    const res = makeRes();
    const next = jest.fn();

    checkRole(['ENTREPRISE', 'ADMIN'])(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('denies access when role is not in allowed list', () => {
    const req = makeAuthReq('STUDENT');
    const res = makeRes();
    const next = jest.fn();

    checkRole(['ADMIN'])(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.render).toHaveBeenCalledWith('pages/access-denied', expect.any(Object));
  });

  test('redirects to login when no role on request', () => {
    const req = makeAuthReq(undefined);
    const res = makeRes();
    const next = jest.fn();

    checkRole(['ADMIN'])(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith('/connection/login');
    expect(next).not.toHaveBeenCalled();
  });

  test('allows TEACHER through a route that lists new role names', () => {
    const req = makeAuthReq('TEACHER');
    const res = makeRes();
    const next = jest.fn();

    checkRole(['TEACHER', 'ADMIN'])(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
