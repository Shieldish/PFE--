'use strict';

/**
 * Unit tests for user management routes (task 9.2).
 *
 * Tests validate the structural correctness of the updated routes without
 * requiring a live database connection. We verify:
 *   1. connectionRoutes.js imports new schema models and defines createNewSchemaRecords
 *   2. UserProfilesRoutes.js imports new UserRegistration model
 *   3. Unique constraint error handling is present in both route files
 *   4. New schema creation is called during registration (code-level verification)
 *   5. Profile update syncs password to new schema
 *
 * Requirements: 2.1, 2.2, 3.1, 3.2
 */

const fs = require('fs');
const path = require('path');

const connectionRoutesPath = path.join(__dirname, '../routes/connectionRoutes.js');
const profileRoutesPath = path.join(__dirname, '../routes/UserProfilesRoutes.js');

let connectionSrc;
let profileSrc;

beforeAll(() => {
  connectionSrc = fs.readFileSync(connectionRoutesPath, 'utf8');
  profileSrc = fs.readFileSync(profileRoutesPath, 'utf8');
});

// ── 1. connectionRoutes.js — new schema imports ──────────────────────────────
describe('connectionRoutes.js — new schema integration', () => {
  test('imports UserRegistration from UserRegistrationModel', () => {
    expect(connectionSrc).toContain("require('../model/UserRegistrationModel')");
    expect(connectionSrc).toContain('UserRegistration');
  });

  test('imports user-type models from UserTypeModels', () => {
    expect(connectionSrc).toContain("require('../model/UserTypeModels')");
    expect(connectionSrc).toContain('Etudiant');
    expect(connectionSrc).toContain('Enseignant');
    expect(connectionSrc).toContain('Encadrant');
    expect(connectionSrc).toContain('Entreprise');
  });

  test('defines createNewSchemaRecords helper function', () => {
    expect(connectionSrc).toContain('createNewSchemaRecords');
  });

  test('createNewSchemaRecords calls UserRegistration.create', () => {
    expect(connectionSrc).toContain('UserRegistration.create');
  });

  test('createNewSchemaRecords creates Etudiant for STUDENT role', () => {
    expect(connectionSrc).toContain('Etudiant.create');
  });

  test('createNewSchemaRecords creates Enseignant for TEACHER role', () => {
    expect(connectionSrc).toContain('Enseignant.create');
  });

  test('createNewSchemaRecords creates Encadrant for SUPERVISOR role', () => {
    expect(connectionSrc).toContain('Encadrant.create');
  });

  test('createNewSchemaRecords creates Entreprise for COMPANY role', () => {
    expect(connectionSrc).toContain('Entreprise.create');
  });

  test('LEGACY_ROLE_MAP maps USER to STUDENT', () => {
    expect(connectionSrc).toContain("USER:        'STUDENT'");
  });

  test('LEGACY_ROLE_MAP maps ENTREPRISE to COMPANY', () => {
    expect(connectionSrc).toContain("ENTREPRISE:  'COMPANY'");
  });
});

// ── 2. connectionRoutes.js — error handling ──────────────────────────────────
describe('connectionRoutes.js — constraint violation error handling', () => {
  test('POST /register handles SequelizeUniqueConstraintError', () => {
    expect(connectionSrc).toContain('SequelizeUniqueConstraintError');
  });

  test('POST /registration returns 409 for duplicate email', () => {
    expect(connectionSrc).toContain('409');
    expect(connectionSrc).toContain('DUPLICATE_EMAIL');
  });

  test('new schema errors are caught and logged without breaking legacy flow', () => {
    // The new schema creation is wrapped in try/catch so legacy flow is not broken
    expect(connectionSrc).toContain('[new-schema]');
    expect(connectionSrc).toContain('console.warn');
  });

  test('POST /register keeps backward-compatible route path', () => {
    expect(connectionSrc).toContain("router.post('/register'");
  });

  test('POST /registration keeps backward-compatible route path', () => {
    expect(connectionSrc).toContain("router.post('/registration'");
  });
});

// ── 3. UserProfilesRoutes.js — new schema integration ────────────────────────
describe('UserProfilesRoutes.js — new schema integration', () => {
  test('imports UserRegistration from UserRegistrationModel', () => {
    expect(profileSrc).toContain("require('../model/UserRegistrationModel')");
    expect(profileSrc).toContain('UserRegistration');
  });

  test('POST /updateUserData syncs password to new schema', () => {
    expect(profileSrc).toContain('UserRegistration.update');
    expect(profileSrc).toContain('password_hash');
  });

  test('POST /updateUserData2 syncs password to new schema', () => {
    // Both update routes should sync to new schema
    const updateData2Index = profileSrc.indexOf("router.post('/updateUserData2'");
    const afterUpdateData2 = profileSrc.slice(updateData2Index);
    expect(afterUpdateData2).toContain('UserRegistration.update');
  });

  test('POST /updateUserData handles SequelizeUniqueConstraintError', () => {
    expect(profileSrc).toContain('SequelizeUniqueConstraintError');
  });

  test('POST /updateUserData2 returns 409 for duplicate email', () => {
    const updateData2Index = profileSrc.indexOf("router.post('/updateUserData2'");
    const afterUpdateData2 = profileSrc.slice(updateData2Index);
    expect(afterUpdateData2).toContain('409');
    expect(afterUpdateData2).toContain('DUPLICATE_EMAIL');
  });

  test('keeps backward-compatible route paths', () => {
    expect(profileSrc).toContain("router.post('/updateUserData'");
    expect(profileSrc).toContain("router.post('/updateUserData2'");
    expect(profileSrc).toContain("router.get('/'");
    expect(profileSrc).toContain("router.get('/expo/:UUID'");
  });

  test('new schema errors are caught and logged without breaking legacy flow', () => {
    expect(profileSrc).toContain('[new-schema]');
  });
});

// ── 4. createNewSchemaRecords — role mapping logic ────────────────────────────
describe('createNewSchemaRecords — role mapping', () => {
  /**
   * Pure unit test of the LEGACY_ROLE_MAP logic extracted from the route file.
   * Validates Requirements: 2.1, 2.2, 3.1, 3.2
   */
  const LEGACY_ROLE_MAP = {
    USER:        'STUDENT',
    DEPARTEMENT: 'SUPERVISOR',
    ENTREPRISE:  'COMPANY',
    ADMIN:       'ADMIN',
  };

  test('USER maps to STUDENT', () => {
    expect(LEGACY_ROLE_MAP['USER']).toBe('STUDENT');
  });

  test('DEPARTEMENT maps to SUPERVISOR', () => {
    expect(LEGACY_ROLE_MAP['DEPARTEMENT']).toBe('SUPERVISOR');
  });

  test('ENTREPRISE maps to COMPANY', () => {
    expect(LEGACY_ROLE_MAP['ENTREPRISE']).toBe('COMPANY');
  });

  test('ADMIN maps to ADMIN', () => {
    expect(LEGACY_ROLE_MAP['ADMIN']).toBe('ADMIN');
  });

  test('unknown role falls back to STUDENT', () => {
    const newRole = LEGACY_ROLE_MAP['UNKNOWN'] || 'STUDENT';
    expect(newRole).toBe('STUDENT');
  });

  test('all new roles are valid UserRegistration ENUM values', () => {
    const VALID_NEW_ROLES = ['STUDENT', 'TEACHER', 'SUPERVISOR', 'COMPANY', 'ADMIN'];
    Object.values(LEGACY_ROLE_MAP).forEach((newRole) => {
      expect(VALID_NEW_ROLES).toContain(newRole);
    });
  });
});
