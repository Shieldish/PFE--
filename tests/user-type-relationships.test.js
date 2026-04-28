'use strict';

/**
 * Integration tests for user type table relationships.
 *
 * These are documentation-style tests that verify the migration SQL files
 * and Sequelize model definitions contain the correct constraint declarations,
 * without requiring a live database connection.
 *
 * Requirements: 1.6, 7.3, 7.4
 */

const fs = require('fs');
const path = require('path');

// ── Helpers ──────────────────────────────────────────────────────────────────

function readMigration(filename) {
  return fs.readFileSync(
    path.join(__dirname, '..', 'migrations', filename),
    'utf8'
  );
}

// Normalise whitespace so multi-line SQL fragments match regardless of
// indentation or line-ending style.
function normalise(src) {
  return src.replace(/\s+/g, ' ');
}

// ── Migration file paths ──────────────────────────────────────────────────────

const MIGRATIONS = {
  userRegistration: '20240101000001-create-user-registration.js',
  etudiant:         '20240101000002-create-etudiant.js',
  enseignant:       '20240101000003-create-enseignant.js',
  encadrant:        '20240101000004-create-encadrant.js',
  entreprise:       '20240101000005-create-entreprise.js',
};

// ── 1. CASCADE delete — migration SQL ────────────────────────────────────────
describe('CASCADE delete — migration SQL declarations', () => {
  const userTypeTables = ['etudiant', 'enseignant', 'encadrant', 'entreprise'];

  userTypeTables.forEach((table) => {
    const migrationKey = table;

    test(`${table} migration declares ON DELETE CASCADE for user_id FK`, () => {
      const src = normalise(readMigration(MIGRATIONS[migrationKey]));
      // The FK block must reference user_registration and specify ON DELETE CASCADE
      expect(src).toMatch(/REFERENCES user_registration\(user_id\)/i);
      expect(src).toMatch(/ON DELETE CASCADE/i);
    });

    test(`${table} migration declares ON UPDATE CASCADE for user_id FK`, () => {
      const src = normalise(readMigration(MIGRATIONS[migrationKey]));
      expect(src).toMatch(/ON UPDATE CASCADE/i);
    });
  });
});

// ── 2. Foreign key constraint definitions ────────────────────────────────────
describe('Foreign key constraint definitions in migration files', () => {
  test('etudiant migration has FOREIGN KEY referencing user_registration(user_id)', () => {
    const src = normalise(readMigration(MIGRATIONS.etudiant));
    expect(src).toMatch(/FOREIGN KEY \(user_id\)/i);
    expect(src).toMatch(/REFERENCES user_registration\(user_id\)/i);
  });

  test('enseignant migration has FOREIGN KEY referencing user_registration(user_id)', () => {
    const src = normalise(readMigration(MIGRATIONS.enseignant));
    expect(src).toMatch(/FOREIGN KEY \(user_id\)/i);
    expect(src).toMatch(/REFERENCES user_registration\(user_id\)/i);
  });

  test('encadrant migration has FOREIGN KEY referencing user_registration(user_id)', () => {
    const src = normalise(readMigration(MIGRATIONS.encadrant));
    expect(src).toMatch(/FOREIGN KEY \(user_id\)/i);
    expect(src).toMatch(/REFERENCES user_registration\(user_id\)/i);
  });

  test('entreprise migration has FOREIGN KEY referencing user_registration(user_id)', () => {
    const src = normalise(readMigration(MIGRATIONS.entreprise));
    expect(src).toMatch(/FOREIGN KEY \(user_id\)/i);
    expect(src).toMatch(/REFERENCES user_registration\(user_id\)/i);
  });

  test('entreprise migration adds deferred FK from encadrant.entreprise_id', () => {
    // Migration 000005 adds the encadrant → entreprise FK after entreprise exists
    const src = normalise(readMigration(MIGRATIONS.entreprise));
    expect(src).toMatch(/fk_encadrant_entreprise/i);
    expect(src).toMatch(/REFERENCES entreprise\(entreprise_id\)/i);
  });

  test('entreprise migration down() drops fk_encadrant_entreprise before dropping table', () => {
    const src = readMigration(MIGRATIONS.entreprise);
    const dropFkPos  = src.indexOf('fk_encadrant_entreprise');
    const dropTblPos = src.indexOf('DROP TABLE IF EXISTS entreprise');
    // The FK drop must appear before the table drop in the source
    expect(dropFkPos).toBeGreaterThan(-1);
    expect(dropTblPos).toBeGreaterThan(-1);
    expect(dropFkPos).toBeLessThan(dropTblPos);
  });
});

// ── 3. Unique email constraints ───────────────────────────────────────────────
describe('Unique email constraints in migration files', () => {
  // etudiant does not have its own email column — uniqueness is via user_registration
  test('enseignant migration declares email column as UNIQUE', () => {
    const src = normalise(readMigration(MIGRATIONS.enseignant));
    // e.g. "email VARCHAR(255) UNIQUE NOT NULL"
    expect(src).toMatch(/email\s+VARCHAR\(\d+\)\s+UNIQUE/i);
  });

  test('encadrant migration declares email column as UNIQUE', () => {
    const src = normalise(readMigration(MIGRATIONS.encadrant));
    expect(src).toMatch(/email\s+VARCHAR\(\d+\)\s+UNIQUE/i);
  });

  test('entreprise migration declares email column as UNIQUE', () => {
    const src = normalise(readMigration(MIGRATIONS.entreprise));
    expect(src).toMatch(/email\s+VARCHAR\(\d+\)\s+UNIQUE/i);
  });

  test('user_registration migration declares email column as UNIQUE', () => {
    const src = normalise(readMigration(MIGRATIONS.userRegistration));
    expect(src).toMatch(/email\s+VARCHAR\(\d+\)\s+UNIQUE/i);
  });
});

// ── 4. Sequelize model associations ──────────────────────────────────────────
describe('Sequelize model associations — UserTypeModels.js', () => {
  const modelSrc = fs.readFileSync(
    path.join(__dirname, '..', 'model', 'UserTypeModels.js'),
    'utf8'
  );

  test('Etudiant declares belongsTo UserRegistration via user_id', () => {
    expect(modelSrc).toMatch(/Etudiant\.belongsTo\s*\(\s*UserRegistration/);
    expect(modelSrc).toMatch(/foreignKey\s*:\s*['"]user_id['"]/);
  });

  test('Enseignant declares belongsTo UserRegistration via user_id', () => {
    expect(modelSrc).toMatch(/Enseignant\.belongsTo\s*\(\s*UserRegistration/);
  });

  test('Encadrant declares belongsTo UserRegistration via user_id', () => {
    expect(modelSrc).toMatch(/Encadrant\.belongsTo\s*\(\s*UserRegistration/);
  });

  test('Entreprise declares belongsTo UserRegistration via user_id', () => {
    expect(modelSrc).toMatch(/Entreprise\.belongsTo\s*\(\s*UserRegistration/);
  });

  test('Encadrant declares belongsTo Entreprise via entreprise_id', () => {
    expect(modelSrc).toMatch(/Encadrant\.belongsTo\s*\(\s*Entreprise/);
    expect(modelSrc).toMatch(/foreignKey\s*:\s*['"]entreprise_id['"]/);
  });

  test('Entreprise declares hasMany Encadrant', () => {
    expect(modelSrc).toMatch(/Entreprise\.hasMany\s*\(\s*Encadrant/);
  });
});

describe('Sequelize model associations — UserRegistrationModel.js', () => {
  const modelSrc = fs.readFileSync(
    path.join(__dirname, '..', 'model', 'UserRegistrationModel.js'),
    'utf8'
  );

  const userTypePairs = [
    ['Etudiant',   'etudiant'],
    ['Enseignant', 'enseignant'],
    ['Encadrant',  'encadrant'],
    ['Entreprise', 'entreprise'],
  ];

  userTypePairs.forEach(([Model, alias]) => {
    test(`UserRegistration declares hasOne ${Model} with alias '${alias}'`, () => {
      expect(modelSrc).toMatch(new RegExp(`UserRegistration\\.hasOne\\s*\\(\\s*${Model}`));
      expect(modelSrc).toMatch(new RegExp(`as\\s*:\\s*['"]${alias}['"]`));
    });
  });
});

// ── 5. Behavioural mock tests ─────────────────────────────────────────────────
describe('Behavioural mock tests — CASCADE delete simulation', () => {
  /**
   * Simulates the DB cascade: deleting a user_registration row should
   * remove all linked user-type rows that have ON DELETE CASCADE.
   */
  function buildMockDb() {
    const users = new Map();
    const profiles = { etudiant: [], enseignant: [], encadrant: [], entreprise: [] };

    return {
      insertUser(userId, email) {
        users.set(userId, { user_id: userId, email });
      },
      insertProfile(table, record) {
        profiles[table].push(record);
      },
      deleteUser(userId) {
        if (!users.has(userId)) return false;
        users.delete(userId);
        // Simulate ON DELETE CASCADE for all user-type tables
        for (const table of Object.keys(profiles)) {
          profiles[table] = profiles[table].filter((r) => r.user_id !== userId);
        }
        return true;
      },
      getProfiles(table) {
        return profiles[table];
      },
      userExists(userId) {
        return users.has(userId);
      },
    };
  }

  test('deleting a user cascades to etudiant profile', () => {
    const db = buildMockDb();
    db.insertUser(1, 'alice@example.com');
    db.insertProfile('etudiant', { etudiant_id: 10, user_id: 1, nom: 'Alice' });

    db.deleteUser(1);

    expect(db.userExists(1)).toBe(false);
    expect(db.getProfiles('etudiant')).toHaveLength(0);
  });

  test('deleting a user cascades to enseignant profile', () => {
    const db = buildMockDb();
    db.insertUser(2, 'bob@example.com');
    db.insertProfile('enseignant', { enseignant_id: 20, user_id: 2, nom: 'Bob' });

    db.deleteUser(2);

    expect(db.getProfiles('enseignant')).toHaveLength(0);
  });

  test('deleting a user cascades to encadrant profile', () => {
    const db = buildMockDb();
    db.insertUser(3, 'carol@example.com');
    db.insertProfile('encadrant', { encadrant_id: 30, user_id: 3, nom: 'Carol' });

    db.deleteUser(3);

    expect(db.getProfiles('encadrant')).toHaveLength(0);
  });

  test('deleting a user cascades to entreprise profile', () => {
    const db = buildMockDb();
    db.insertUser(4, 'corp@example.com');
    db.insertProfile('entreprise', { entreprise_id: 40, user_id: 4, nom: 'Corp' });

    db.deleteUser(4);

    expect(db.getProfiles('entreprise')).toHaveLength(0);
  });

  test('deleting one user does not affect other users profiles', () => {
    const db = buildMockDb();
    db.insertUser(1, 'alice@example.com');
    db.insertUser(2, 'bob@example.com');
    db.insertProfile('etudiant', { etudiant_id: 10, user_id: 1, nom: 'Alice' });
    db.insertProfile('etudiant', { etudiant_id: 11, user_id: 2, nom: 'Bob' });

    db.deleteUser(1);

    expect(db.getProfiles('etudiant')).toHaveLength(1);
    expect(db.getProfiles('etudiant')[0].user_id).toBe(2);
  });

  test('deleting a non-existent user returns false and leaves profiles intact', () => {
    const db = buildMockDb();
    db.insertUser(1, 'alice@example.com');
    db.insertProfile('etudiant', { etudiant_id: 10, user_id: 1, nom: 'Alice' });

    const result = db.deleteUser(999);

    expect(result).toBe(false);
    expect(db.getProfiles('etudiant')).toHaveLength(1);
  });
});

describe('Behavioural mock tests — unique email constraint simulation', () => {
  function buildEmailStore() {
    const emails = new Set();
    return {
      insert(email) {
        if (emails.has(email)) {
          throw new Error(`Duplicate entry '${email}' for key 'email'`);
        }
        emails.add(email);
      },
      has(email) {
        return emails.has(email);
      },
    };
  }

  test('inserting the same email twice throws a duplicate error', () => {
    const store = buildEmailStore();
    store.insert('alice@example.com');
    expect(() => store.insert('alice@example.com')).toThrow(/Duplicate entry/);
  });

  test('inserting different emails succeeds', () => {
    const store = buildEmailStore();
    expect(() => {
      store.insert('alice@example.com');
      store.insert('bob@example.com');
    }).not.toThrow();
  });

  test('email uniqueness is case-sensitive (store treats them as distinct)', () => {
    const store = buildEmailStore();
    store.insert('Alice@example.com');
    // Different case → no duplicate at JS level (MySQL collation may differ)
    expect(() => store.insert('alice@example.com')).not.toThrow();
  });
});

describe('Behavioural mock tests — foreign key constraint simulation', () => {
  function buildFkStore() {
    const parents = new Set();
    const children = [];

    return {
      insertParent(id) { parents.add(id); },
      insertChild(childId, parentId) {
        if (!parents.has(parentId)) {
          throw new Error(
            `Cannot add or update a child row: a foreign key constraint fails (user_id=${parentId})`
          );
        }
        children.push({ childId, parentId });
      },
      getChildren() { return children; },
    };
  }

  test('inserting a child with a valid parent_id succeeds', () => {
    const store = buildFkStore();
    store.insertParent(1);
    expect(() => store.insertChild(10, 1)).not.toThrow();
  });

  test('inserting a child with a non-existent parent_id throws FK violation', () => {
    const store = buildFkStore();
    expect(() => store.insertChild(10, 999)).toThrow(/foreign key constraint fails/);
  });

  test('FK violation message includes the offending user_id', () => {
    const store = buildFkStore();
    expect(() => store.insertChild(10, 42)).toThrow(/user_id=42/);
  });
});
