'use strict';

/**
 * Unit tests for UserRegistration model constraints.
 *
 * These tests validate model-level logic without a live DB connection.
 * We test:
 *   1. Email uniqueness / format validation logic
 *   2. Role enum validation logic
 *   3. UUID generation and format validation
 *
 * The validators are extracted from UserRegistrationModel.js and tested
 * as pure functions so no DB driver is required.
 *
 * Requirements: 1.7
 */

const { v4: uuidv4, validate: uuidValidate } = require('uuid');

// ── Constants mirroring the model definition ─────────────────────────────────
const VALID_ROLES = ['STUDENT', 'TEACHER', 'SUPERVISOR', 'COMPANY', 'ADMIN'];
const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Pure validator functions (mirror model validation rules) ─────────────────

/**
 * Validates an email value the same way the Sequelize model does:
 *   - allowNull: false  → null/undefined rejected
 *   - notEmpty          → '' rejected
 *   - isEmail           → must match basic email format
 */
function validateEmail(value) {
  if (value === null || value === undefined) {
    throw new Error('email is required');
  }
  if (value === '') {
    throw new Error('email cannot be empty');
  }
  if (!EMAIL_PATTERN.test(value)) {
    throw new Error('email must be a valid email address');
  }
}

/**
 * Validates a role value the same way the Sequelize model does:
 *   - allowNull: false  → null/undefined rejected
 *   - isIn(VALID_ROLES) → must be one of the enum values
 */
function validateRole(value) {
  if (value === null || value === undefined) {
    throw new Error('role is required');
  }
  if (!VALID_ROLES.includes(value)) {
    throw new Error(`role must be one of ${VALID_ROLES.join(', ')}`);
  }
}

/**
 * Validates a UUID value the same way the Sequelize model does:
 *   - allowNull: false  → null/undefined rejected
 *   - notEmpty          → '' rejected
 *   - isValidUUID       → must pass uuid.validate()
 */
function validateUUID(value) {
  if (value === null || value === undefined) {
    throw new Error('uuid is required');
  }
  if (value === '') {
    throw new Error('uuid cannot be empty');
  }
  if (!uuidValidate(value)) {
    throw new Error('uuid must be a valid UUID v4');
  }
}

/**
 * Simulates the beforeCreate hook: generates a UUID if none is set.
 */
function applyBeforeCreateHook(instance) {
  if (!instance.uuid) {
    instance.uuid = uuidv4();
  }
  return instance;
}

// ── 1. Unique email constraint ───────────────────────────────────────────────
describe('email validation', () => {
  test('valid email passes', () => {
    expect(() => validateEmail('alice@example.com')).not.toThrow();
  });

  test('null email fails', () => {
    expect(() => validateEmail(null)).toThrow('email is required');
  });

  test('undefined email fails', () => {
    expect(() => validateEmail(undefined)).toThrow('email is required');
  });

  test('empty string email fails', () => {
    expect(() => validateEmail('')).toThrow('email cannot be empty');
  });

  test('string without @ fails', () => {
    expect(() => validateEmail('notanemail')).toThrow(
      'email must be a valid email address'
    );
  });

  test('string with @ but no domain fails', () => {
    expect(() => validateEmail('user@')).toThrow(
      'email must be a valid email address'
    );
  });

  test('string with @ but no TLD fails', () => {
    expect(() => validateEmail('user@domain')).toThrow(
      'email must be a valid email address'
    );
  });

  test('two different valid emails both pass', () => {
    expect(() => validateEmail('alice@example.com')).not.toThrow();
    expect(() => validateEmail('bob@example.com')).not.toThrow();
  });

  // Uniqueness at DB level: verify the model schema declares unique: true
  test('UserRegistrationModel declares email as unique', () => {
    const src = require('fs').readFileSync(
      require('path').join(__dirname, '../model/UserRegistrationModel.js'),
      'utf8'
    );
    // The model source should contain unique: true near the email field
    expect(src).toMatch(/email[\s\S]{0,200}unique\s*:\s*true/);
  });
});

// ── 2. Role enum validation ──────────────────────────────────────────────────
describe('role enum validation', () => {
  VALID_ROLES.forEach((role) => {
    test(`valid role "${role}" passes`, () => {
      expect(() => validateRole(role)).not.toThrow();
    });
  });

  test('invalid role "INVALID_ROLE" fails', () => {
    expect(() => validateRole('INVALID_ROLE')).toThrow();
  });

  test('null role fails', () => {
    expect(() => validateRole(null)).toThrow('role is required');
  });

  test('undefined role fails', () => {
    expect(() => validateRole(undefined)).toThrow('role is required');
  });

  test('lowercase "student" fails (enum is case-sensitive)', () => {
    expect(() => validateRole('student')).toThrow();
  });

  test('numeric value fails', () => {
    expect(() => validateRole(1)).toThrow();
  });

  test('empty string fails', () => {
    expect(() => validateRole('')).toThrow();
  });

  // Verify the model source defines all five roles
  test('UserRegistrationModel defines all five ENUM roles', () => {
    const src = require('fs').readFileSync(
      require('path').join(__dirname, '../model/UserRegistrationModel.js'),
      'utf8'
    );
    VALID_ROLES.forEach((role) => {
      expect(src).toContain(`'${role}'`);
    });
  });
});

// ── 3. UUID generation and uniqueness ────────────────────────────────────────
describe('UUID field presence and format', () => {
  test('valid UUID v4 passes validation', () => {
    expect(() => validateUUID(uuidv4())).not.toThrow();
  });

  test('null uuid fails', () => {
    expect(() => validateUUID(null)).toThrow('uuid is required');
  });

  test('undefined uuid fails', () => {
    expect(() => validateUUID(undefined)).toThrow('uuid is required');
  });

  test('empty string uuid fails', () => {
    expect(() => validateUUID('')).toThrow('uuid cannot be empty');
  });

  test('non-UUID string fails', () => {
    expect(() => validateUUID('not-a-uuid')).toThrow(
      'uuid must be a valid UUID v4'
    );
  });

  test('UUID v4 matches RFC 4122 pattern', () => {
    const id = uuidv4();
    expect(UUID_V4_PATTERN.test(id)).toBe(true);
  });

  test('generated UUID is exactly 36 characters', () => {
    expect(uuidv4()).toHaveLength(36);
  });

  test('two generated UUIDs are always different', () => {
    const a = uuidv4();
    const b = uuidv4();
    expect(a).not.toBe(b);
  });

  test('beforeCreate hook generates UUID when none is provided', () => {
    const instance = { email: 'hook@example.com', password_hash: 'hash', role: 'ADMIN' };
    applyBeforeCreateHook(instance);
    expect(instance.uuid).toBeDefined();
    expect(uuidValidate(instance.uuid)).toBe(true);
  });

  test('beforeCreate hook does not overwrite an existing UUID', () => {
    const existingUuid = uuidv4();
    const instance = { uuid: existingUuid, email: 'x@example.com', role: 'STUDENT' };
    applyBeforeCreateHook(instance);
    expect(instance.uuid).toBe(existingUuid);
  });

  // Verify the model source declares uuid as unique
  test('UserRegistrationModel declares uuid as unique', () => {
    const src = require('fs').readFileSync(
      require('path').join(__dirname, '../model/UserRegistrationModel.js'),
      'utf8'
    );
    expect(src).toMatch(/uuid[\s\S]{0,200}unique\s*:\s*true/);
  });
});
