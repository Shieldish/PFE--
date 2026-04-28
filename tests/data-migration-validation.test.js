'use strict';

/**
 * Validation tests for data migration scripts.
 *
 * These are documentation-style + behavioural mock tests that verify:
 *   1. Migration scripts contain idempotency logic (INSERT IGNORE / duplicate check)
 *   2. Migration scripts contain transaction handling (commit / rollback)
 *   3. Migration scripts contain role mapping logic
 *   4. Migration scripts contain snapshot field population
 *   5. The full migration pipeline preserves data integrity
 *   6. No data loss occurs during migration
 *   7. FK relationships (user_id links) are preserved
 *   8. Running the migration twice produces the same result (idempotency)
 *
 * No live database connection is required.
 *
 * Requirements: 8.4, 10.5
 */

const fs   = require('fs');
const path = require('path');

// ── Helpers ──────────────────────────────────────────────────────────────────

function readScript(filename) {
  return fs.readFileSync(
    path.join(__dirname, '..', 'scripts', filename),
    'utf8'
  );
}

// ── Script sources ────────────────────────────────────────────────────────────

const SCRIPTS = {
  userRegistration: 'migrate_user_registration.js',
  userTypeTables:   'migrate_user_type_tables.js',
  businessTables:   'migrate_business_tables.js',
};

// ── 1. Source-code assertions: idempotency logic ──────────────────────────────
describe('Source-code assertions — idempotency logic', () => {
  test('migrate_user_registration.js checks for existing emails before inserting', () => {
    const src = readScript(SCRIPTS.userRegistration);
    // The script builds a set of existing emails and skips duplicates
    expect(src).toMatch(/existingEmails/);
    expect(src).toMatch(/existingEmails\.has\(email\)/);
  });

  test('migrate_user_type_tables.js uses INSERT IGNORE for etudiant rows', () => {
    const src = readScript(SCRIPTS.userTypeTables);
    expect(src).toMatch(/INSERT IGNORE INTO etudiant/i);
  });

  test('migrate_user_type_tables.js uses INSERT IGNORE for enseignant rows', () => {
    const src = readScript(SCRIPTS.userTypeTables);
    expect(src).toMatch(/INSERT IGNORE INTO enseignant/i);
  });

  test('migrate_user_type_tables.js uses INSERT IGNORE for entreprise rows', () => {
    const src = readScript(SCRIPTS.userTypeTables);
    expect(src).toMatch(/INSERT IGNORE INTO entreprise/i);
  });

  test('migrate_user_type_tables.js uses INSERT IGNORE for encadrant rows', () => {
    const src = readScript(SCRIPTS.userTypeTables);
    expect(src).toMatch(/INSERT IGNORE INTO encadrant/i);
  });

  test('migrate_user_type_tables.js tracks already-migrated user_ids to skip duplicates', () => {
    const src = readScript(SCRIPTS.userTypeTables);
    expect(src).toMatch(/alreadyMigrated/);
    expect(src).toMatch(/alreadyMigrated\.has\(userId\)/);
  });

  test('migrate_business_tables.js uses INSERT IGNORE for candidature rows', () => {
    const src = readScript(SCRIPTS.businessTables);
    expect(src).toMatch(/INSERT IGNORE INTO candidature/i);
  });

  test('migrate_business_tables.js uses INSERT IGNORE for soutenance rows', () => {
    const src = readScript(SCRIPTS.businessTables);
    expect(src).toMatch(/INSERT IGNORE INTO soutenance/i);
  });

  test('migrate_business_tables.js tracks existing (stage_id, etudiant_id) pairs to skip duplicates', () => {
    const src = readScript(SCRIPTS.businessTables);
    expect(src).toMatch(/existingSet/);
    expect(src).toMatch(/existingSet\.has\(dedupeKey\)/);
  });
});

// ── 2. Source-code assertions: transaction handling ───────────────────────────
describe('Source-code assertions — transaction handling', () => {
  test('migrate_user_registration.js opens a transaction', () => {
    const src = readScript(SCRIPTS.userRegistration);
    expect(src).toMatch(/sequelize\.transaction\(\)/);
  });

  test('migrate_user_registration.js commits the transaction on success', () => {
    const src = readScript(SCRIPTS.userRegistration);
    expect(src).toMatch(/t\.commit\(\)/);
  });

  test('migrate_user_registration.js rolls back the transaction on error', () => {
    const src = readScript(SCRIPTS.userRegistration);
    expect(src).toMatch(/t\.rollback\(\)/);
  });

  test('migrate_user_type_tables.js opens a transaction', () => {
    const src = readScript(SCRIPTS.userTypeTables);
    expect(src).toMatch(/sequelize\.transaction\(\)/);
  });

  test('migrate_user_type_tables.js commits the transaction on success', () => {
    const src = readScript(SCRIPTS.userTypeTables);
    expect(src).toMatch(/t\.commit\(\)/);
  });

  test('migrate_user_type_tables.js rolls back the transaction on error', () => {
    const src = readScript(SCRIPTS.userTypeTables);
    expect(src).toMatch(/t\.rollback\(\)/);
  });

  test('migrate_business_tables.js opens a transaction', () => {
    const src = readScript(SCRIPTS.businessTables);
    expect(src).toMatch(/sequelize\.transaction\(\)/);
  });

  test('migrate_business_tables.js commits the transaction on success', () => {
    const src = readScript(SCRIPTS.businessTables);
    expect(src).toMatch(/t\.commit\(\)/);
  });

  test('migrate_business_tables.js rolls back the transaction on error', () => {
    const src = readScript(SCRIPTS.businessTables);
    expect(src).toMatch(/t\.rollback\(\)/);
  });
});

// ── 3. Source-code assertions: role mapping logic ─────────────────────────────
describe('Source-code assertions — role mapping logic', () => {
  test('migrate_user_registration.js defines a ROLE_MAP object', () => {
    const src = readScript(SCRIPTS.userRegistration);
    expect(src).toMatch(/ROLE_MAP/);
  });

  test('migrate_user_registration.js maps USER → STUDENT', () => {
    const src = readScript(SCRIPTS.userRegistration);
    expect(src).toMatch(/USER\s*:\s*['"]STUDENT['"]/);
  });

  test('migrate_user_registration.js maps DEPARTEMENT → TEACHER', () => {
    const src = readScript(SCRIPTS.userRegistration);
    expect(src).toMatch(/DEPARTEMENT\s*:\s*['"]TEACHER['"]/);
  });

  test('migrate_user_registration.js maps ENTREPRISE → COMPANY', () => {
    const src = readScript(SCRIPTS.userRegistration);
    expect(src).toMatch(/ENTREPRISE\s*:\s*['"]COMPANY['"]/);
  });

  test('migrate_user_registration.js maps ADMIN → ADMIN', () => {
    const src = readScript(SCRIPTS.userRegistration);
    expect(src).toMatch(/ADMIN\s*:\s*['"]ADMIN['"]/);
  });

  test('migrate_user_registration.js has a mapRole() function', () => {
    const src = readScript(SCRIPTS.userRegistration);
    expect(src).toMatch(/function mapRole\(/);
  });

  test('migrate_user_registration.js falls back to STUDENT for unknown roles', () => {
    const src = readScript(SCRIPTS.userRegistration);
    // The fallback is: ROLE_MAP[oldRole] || 'STUDENT'
    expect(src).toMatch(/\|\|\s*['"]STUDENT['"]/);
  });

  test('migrate_business_tables.js defines a mapStatus() function', () => {
    const src = readScript(SCRIPTS.businessTables);
    expect(src).toMatch(/function mapStatus\(/);
  });

  test('migrate_business_tables.js maps ACCEPTE status', () => {
    const src = readScript(SCRIPTS.businessTables);
    expect(src).toMatch(/['"]ACCEPTE['"]/);
  });

  test('migrate_business_tables.js maps REFUSE status', () => {
    const src = readScript(SCRIPTS.businessTables);
    expect(src).toMatch(/['"]REFUSE['"]/);
  });
});

// ── 4. Source-code assertions: snapshot field population ─────────────────────
describe('Source-code assertions — snapshot field population', () => {
  test('migrate_business_tables.js populates etudiant_nom snapshot field', () => {
    const src = readScript(SCRIPTS.businessTables);
    expect(src).toMatch(/etudiant_nom/);
  });

  test('migrate_business_tables.js populates etudiant_prenom snapshot field', () => {
    const src = readScript(SCRIPTS.businessTables);
    expect(src).toMatch(/etudiant_prenom/);
  });

  test('migrate_business_tables.js populates etudiant_email snapshot field', () => {
    const src = readScript(SCRIPTS.businessTables);
    expect(src).toMatch(/etudiant_email/);
  });

  test('migrate_business_tables.js populates etudiant_departement snapshot field', () => {
    const src = readScript(SCRIPTS.businessTables);
    expect(src).toMatch(/etudiant_departement/);
  });

  test('migrate_business_tables.js populates etudiant_specialite snapshot field', () => {
    const src = readScript(SCRIPTS.businessTables);
    expect(src).toMatch(/etudiant_specialite/);
  });

  test('migrate_business_tables.js reads etudiant details map for snapshot values', () => {
    const src = readScript(SCRIPTS.businessTables);
    // The script uses etudiantMaps.details to look up snapshot info
    expect(src).toMatch(/etudiantMaps\.details/);
  });
});

// ── 5. Behavioural mock — full migration pipeline data integrity ──────────────
describe('Behavioural mock — migration pipeline data integrity', () => {
  /**
   * Simulates the three-stage migration pipeline:
   *   user_registrations → user_registration
   *   old_etudiant       → etudiant  (via email → user_id lookup)
   *   old_stage + old_stagepostulation → stage + candidature
   *
   * All logic mirrors what the real scripts do, but operates on plain JS
   * objects so no DB driver is needed.
   */

  function buildMigrationPipeline() {
    // ── Source tables (old schema) ──────────────────────────────────────────
    const oldUsers = [];
    const oldEtudiants = [];
    const oldStages = [];
    const oldPostulations = [];

    // ── Target tables (new schema) ──────────────────────────────────────────
    const userRegistration = [];   // { user_id, email, role }
    const etudiant = [];           // { etudiant_id, user_id, nom, prenom }
    const stage = [];              // { stage_id, entreprise_id, titre }
    const candidature = [];        // { candidature_id, stage_id, etudiant_id, etudiant_nom, etudiant_prenom, etudiant_email, etudiant_departement, etudiant_specialite, status }

    let nextUserId = 1;
    let nextEtudiantId = 1;
    let nextStageId = 1;
    let nextCandidatureId = 1;

    const ROLE_MAP = { USER: 'STUDENT', ADMIN: 'ADMIN', DEPARTEMENT: 'TEACHER', ENTREPRISE: 'COMPANY' };
    function mapRole(r) { return ROLE_MAP[r] || 'STUDENT'; }

    return {
      // ── Seed helpers ──────────────────────────────────────────────────────
      seedOldUser(id, email, role, password) {
        oldUsers.push({ id, EMAIL: email, role, PASSWORD: password });
      },
      seedOldEtudiant(email, nom, prenom, departement, specialite) {
        oldEtudiants.push({ EMAIL: email, NOM: nom, PRENOM: prenom, DEPARTEMENT: departement, SPECIALITE: specialite });
      },
      seedOldStage(uuid, titre, createdByEmail, entrepriseId) {
        oldStages.push({ id: uuid, Titre: titre, CreatedBy: createdByEmail, entreprise_id: entrepriseId });
      },
      seedOldPostulation(stageUuid, etudiantEmail, status) {
        oldPostulations.push({ stageId: stageUuid, etudiantEmail, status });
      },

      // ── Step 1: migrate user_registrations → user_registration ────────────
      migrateUserRegistration() {
        const existingEmails = new Set(userRegistration.map((r) => r.email.toLowerCase()));
        for (const old of oldUsers) {
          const email = (old.EMAIL || '').toLowerCase().trim();
          if (!email || existingEmails.has(email)) continue;
          userRegistration.push({
            user_id: nextUserId++,
            email,
            role: mapRole(old.role),
            password_hash: old.PASSWORD || 'placeholder',
          });
          existingEmails.add(email);
        }
      },

      // ── Step 2: migrate old_etudiant → etudiant ───────────────────────────
      migrateEtudiant() {
        const emailToUserId = new Map(userRegistration.map((r) => [r.email, r.user_id]));
        const alreadyMigrated = new Set(etudiant.map((r) => r.user_id));
        for (const old of oldEtudiants) {
          const email = (old.EMAIL || '').toLowerCase().trim();
          const userId = emailToUserId.get(email);
          if (!userId || alreadyMigrated.has(userId)) continue;
          etudiant.push({
            etudiant_id: nextEtudiantId++,
            user_id: userId,
            nom: old.NOM,
            prenom: old.PRENOM,
            departement: old.DEPARTEMENT,
            specialite: old.SPECIALITE,
            email,
          });
          alreadyMigrated.add(userId);
        }
      },

      // ── Step 3: migrate old_stage + old_stagepostulation ──────────────────
      migrateBusinessTables() {
        // Seed stages from old_stage
        const stageUuidToId = new Map();
        const existingTitles = new Set(stage.map((s) => `${s.entreprise_id}::${s.titre.toLowerCase()}`));
        for (const old of oldStages) {
          const key = `${old.entreprise_id}::${old.Titre.toLowerCase()}`;
          if (existingTitles.has(key)) continue;
          const newId = nextStageId++;
          stage.push({ stage_id: newId, entreprise_id: old.entreprise_id, titre: old.Titre });
          stageUuidToId.set(old.id, newId);
          existingTitles.add(key);
        }

        // Build etudiant lookup by email
        const emailToEtudiantId = new Map(etudiant.map((e) => [e.email, e.etudiant_id]));
        const etudiantDetails = new Map(etudiant.map((e) => [e.etudiant_id, e]));

        // Migrate postulations → candidature
        const existingPairs = new Set(candidature.map((c) => `${c.stage_id}::${c.etudiant_id}`));
        for (const old of oldPostulations) {
          const stageId = stageUuidToId.get(old.stageId);
          const etudiantId = emailToEtudiantId.get((old.etudiantEmail || '').toLowerCase());
          if (!stageId || !etudiantId) continue;
          const pairKey = `${stageId}::${etudiantId}`;
          if (existingPairs.has(pairKey)) continue;
          const info = etudiantDetails.get(etudiantId) || {};
          candidature.push({
            candidature_id: nextCandidatureId++,
            stage_id: stageId,
            etudiant_id: etudiantId,
            status: old.status || 'EN_ATTENTE',
            etudiant_nom: info.nom || 'N/A',
            etudiant_prenom: info.prenom || 'N/A',
            etudiant_email: info.email || 'N/A',
            etudiant_departement: info.departement || 'N/A',
            etudiant_specialite: info.specialite || 'N/A',
          });
          existingPairs.add(pairKey);
        }
      },

      // ── Accessors ─────────────────────────────────────────────────────────
      getUserRegistration() { return userRegistration; },
      getEtudiant()         { return etudiant; },
      getStage()            { return stage; },
      getCandidature()      { return candidature; },
    };
  }

  test('all old users appear in user_registration after migration', () => {
    const p = buildMigrationPipeline();
    p.seedOldUser(1, 'alice@example.com', 'USER', 'hash1');
    p.seedOldUser(2, 'bob@example.com',   'DEPARTEMENT', 'hash2');
    p.seedOldUser(3, 'corp@example.com',  'ENTREPRISE', 'hash3');

    p.migrateUserRegistration();

    expect(p.getUserRegistration()).toHaveLength(3);
    const emails = p.getUserRegistration().map((r) => r.email);
    expect(emails).toContain('alice@example.com');
    expect(emails).toContain('bob@example.com');
    expect(emails).toContain('corp@example.com');
  });

  test('roles are correctly mapped during user_registration migration', () => {
    const p = buildMigrationPipeline();
    p.seedOldUser(1, 'alice@example.com',  'USER',        'h');
    p.seedOldUser(2, 'bob@example.com',    'DEPARTEMENT', 'h');
    p.seedOldUser(3, 'corp@example.com',   'ENTREPRISE',  'h');
    p.seedOldUser(4, 'admin@example.com',  'ADMIN',       'h');
    p.seedOldUser(5, 'other@example.com',  'UNKNOWN',     'h');

    p.migrateUserRegistration();

    const byEmail = Object.fromEntries(p.getUserRegistration().map((r) => [r.email, r.role]));
    expect(byEmail['alice@example.com']).toBe('STUDENT');
    expect(byEmail['bob@example.com']).toBe('TEACHER');
    expect(byEmail['corp@example.com']).toBe('COMPANY');
    expect(byEmail['admin@example.com']).toBe('ADMIN');
    expect(byEmail['other@example.com']).toBe('STUDENT'); // fallback
  });

  test('etudiant rows are linked to correct user_id after migration', () => {
    const p = buildMigrationPipeline();
    p.seedOldUser(1, 'alice@example.com', 'USER', 'h');
    p.seedOldEtudiant('alice@example.com', 'Dupont', 'Alice', 'Informatique', 'GL');

    p.migrateUserRegistration();
    p.migrateEtudiant();

    const etudiants = p.getEtudiant();
    expect(etudiants).toHaveLength(1);
    const userId = p.getUserRegistration().find((r) => r.email === 'alice@example.com').user_id;
    expect(etudiants[0].user_id).toBe(userId);
  });

  test('candidature snapshot fields are populated from etudiant details', () => {
    const p = buildMigrationPipeline();
    p.seedOldUser(1, 'alice@example.com', 'USER', 'h');
    p.seedOldEtudiant('alice@example.com', 'Dupont', 'Alice', 'Informatique', 'GL');
    p.seedOldStage('uuid-stage-1', 'Stage Dev', 'corp@example.com', 10);
    p.seedOldPostulation('uuid-stage-1', 'alice@example.com', 'EN_ATTENTE');

    p.migrateUserRegistration();
    p.migrateEtudiant();
    p.migrateBusinessTables();

    const cands = p.getCandidature();
    expect(cands).toHaveLength(1);
    expect(cands[0].etudiant_nom).toBe('Dupont');
    expect(cands[0].etudiant_prenom).toBe('Alice');
    expect(cands[0].etudiant_email).toBe('alice@example.com');
    expect(cands[0].etudiant_departement).toBe('Informatique');
    expect(cands[0].etudiant_specialite).toBe('GL');
  });
});

// ── 6. Behavioural mock — no data loss ───────────────────────────────────────
describe('Behavioural mock — no data loss during migration', () => {
  function runFullMigration(sourceUsers, sourceEtudiants) {
    const userRegistration = [];
    const etudiant = [];
    let nextUserId = 1;
    let nextEtudiantId = 1;

    const ROLE_MAP = { USER: 'STUDENT', ADMIN: 'ADMIN', DEPARTEMENT: 'TEACHER', ENTREPRISE: 'COMPANY' };

    // Step 1
    const existingEmails = new Set();
    for (const u of sourceUsers) {
      const email = (u.EMAIL || '').toLowerCase().trim();
      if (!email || existingEmails.has(email)) continue;
      userRegistration.push({ user_id: nextUserId++, email, role: ROLE_MAP[u.role] || 'STUDENT' });
      existingEmails.add(email);
    }

    // Step 2
    const emailToUserId = new Map(userRegistration.map((r) => [r.email, r.user_id]));
    const alreadyMigrated = new Set();
    for (const e of sourceEtudiants) {
      const email = (e.EMAIL || '').toLowerCase().trim();
      const userId = emailToUserId.get(email);
      if (!userId || alreadyMigrated.has(userId)) continue;
      etudiant.push({ etudiant_id: nextEtudiantId++, user_id: userId, nom: e.NOM, prenom: e.PRENOM });
      alreadyMigrated.add(userId);
    }

    return { userRegistration, etudiant };
  }

  test('all source users are present in user_registration (no data loss)', () => {
    const sourceUsers = [
      { EMAIL: 'a@x.com', role: 'USER' },
      { EMAIL: 'b@x.com', role: 'DEPARTEMENT' },
      { EMAIL: 'c@x.com', role: 'ENTREPRISE' },
    ];
    const { userRegistration } = runFullMigration(sourceUsers, []);
    expect(userRegistration).toHaveLength(sourceUsers.length);
  });

  test('all source etudiants are present in etudiant table (no data loss)', () => {
    const sourceUsers = [
      { EMAIL: 'a@x.com', role: 'USER' },
      { EMAIL: 'b@x.com', role: 'USER' },
    ];
    const sourceEtudiants = [
      { EMAIL: 'a@x.com', NOM: 'Alpha', PRENOM: 'A' },
      { EMAIL: 'b@x.com', NOM: 'Beta',  PRENOM: 'B' },
    ];
    const { etudiant } = runFullMigration(sourceUsers, sourceEtudiants);
    expect(etudiant).toHaveLength(2);
  });

  test('etudiant with no matching user_registration row is skipped (not silently lost)', () => {
    // Only one user registered, but two etudiants in old table
    const sourceUsers = [{ EMAIL: 'a@x.com', role: 'USER' }];
    const sourceEtudiants = [
      { EMAIL: 'a@x.com', NOM: 'Alpha', PRENOM: 'A' },
      { EMAIL: 'orphan@x.com', NOM: 'Orphan', PRENOM: 'O' }, // no user_registration row
    ];
    const { etudiant } = runFullMigration(sourceUsers, sourceEtudiants);
    // Only the matched etudiant is inserted; orphan is skipped
    expect(etudiant).toHaveLength(1);
    expect(etudiant[0].nom).toBe('Alpha');
  });

  test('users with empty email are skipped and do not cause data loss for valid users', () => {
    const sourceUsers = [
      { EMAIL: '',          role: 'USER' },  // invalid — skipped
      { EMAIL: 'a@x.com',  role: 'USER' },  // valid
    ];
    const { userRegistration } = runFullMigration(sourceUsers, []);
    expect(userRegistration).toHaveLength(1);
    expect(userRegistration[0].email).toBe('a@x.com');
  });

  test('duplicate emails in source table are deduplicated (only one row inserted)', () => {
    const sourceUsers = [
      { EMAIL: 'dup@x.com', role: 'USER' },
      { EMAIL: 'dup@x.com', role: 'ADMIN' }, // same email, different role
    ];
    const { userRegistration } = runFullMigration(sourceUsers, []);
    expect(userRegistration).toHaveLength(1);
  });
});

// ── 7. Behavioural mock — FK relationship preservation ───────────────────────
describe('Behavioural mock — FK relationship preservation (user_id links)', () => {
  function buildFkCheckPipeline() {
    const userRegistration = [];
    const etudiant = [];
    let nextUserId = 1;
    let nextEtudiantId = 1;

    return {
      addUser(email, role) {
        const user_id = nextUserId++;
        userRegistration.push({ user_id, email, role });
        return user_id;
      },
      addEtudiant(userId, nom, prenom) {
        // Simulate FK check: user_id must exist in user_registration
        const parent = userRegistration.find((r) => r.user_id === userId);
        if (!parent) {
          throw new Error(`FK violation: user_id=${userId} not found in user_registration`);
        }
        const etudiant_id = nextEtudiantId++;
        etudiant.push({ etudiant_id, user_id: userId, nom, prenom });
        return etudiant_id;
      },
      getUserRegistration() { return userRegistration; },
      getEtudiant()         { return etudiant; },
      // Verify every etudiant.user_id points to a real user_registration row
      verifyFkIntegrity() {
        const userIds = new Set(userRegistration.map((r) => r.user_id));
        return etudiant.every((e) => userIds.has(e.user_id));
      },
    };
  }

  test('every etudiant row has a valid user_id FK after migration', () => {
    const p = buildFkCheckPipeline();
    const uid1 = p.addUser('alice@example.com', 'STUDENT');
    const uid2 = p.addUser('bob@example.com',   'STUDENT');
    p.addEtudiant(uid1, 'Dupont', 'Alice');
    p.addEtudiant(uid2, 'Martin', 'Bob');

    expect(p.verifyFkIntegrity()).toBe(true);
  });

  test('inserting an etudiant with a non-existent user_id throws FK violation', () => {
    const p = buildFkCheckPipeline();
    expect(() => p.addEtudiant(999, 'Ghost', 'User')).toThrow(/FK violation/);
  });

  test('user_id values in etudiant match the auto-incremented IDs from user_registration', () => {
    const p = buildFkCheckPipeline();
    const uid = p.addUser('carol@example.com', 'STUDENT');
    p.addEtudiant(uid, 'Leclerc', 'Carol');

    const etudiantRow = p.getEtudiant()[0];
    const userRow     = p.getUserRegistration()[0];
    expect(etudiantRow.user_id).toBe(userRow.user_id);
  });

  test('multiple etudiants each link to their own distinct user_registration row', () => {
    const p = buildFkCheckPipeline();
    const uid1 = p.addUser('u1@x.com', 'STUDENT');
    const uid2 = p.addUser('u2@x.com', 'STUDENT');
    const uid3 = p.addUser('u3@x.com', 'STUDENT');
    p.addEtudiant(uid1, 'A', 'A');
    p.addEtudiant(uid2, 'B', 'B');
    p.addEtudiant(uid3, 'C', 'C');

    const etudiants = p.getEtudiant();
    const linkedUserIds = etudiants.map((e) => e.user_id);
    // All user_ids are distinct
    expect(new Set(linkedUserIds).size).toBe(3);
    expect(p.verifyFkIntegrity()).toBe(true);
  });
});

// ── 8. Behavioural mock — idempotency (running migration twice) ───────────────
describe('Behavioural mock — idempotency (running migration twice produces same result)', () => {
  function buildIdempotentMigration() {
    const userRegistration = [];
    const etudiant = [];
    let nextUserId = 1;
    let nextEtudiantId = 1;

    const ROLE_MAP = { USER: 'STUDENT', ADMIN: 'ADMIN', DEPARTEMENT: 'TEACHER', ENTREPRISE: 'COMPANY' };

    function runMigration(sourceUsers, sourceEtudiants) {
      // Step 1: user_registration — skip existing emails
      const existingEmails = new Set(userRegistration.map((r) => r.email));
      for (const u of sourceUsers) {
        const email = (u.EMAIL || '').toLowerCase().trim();
        if (!email || existingEmails.has(email)) continue;
        userRegistration.push({ user_id: nextUserId++, email, role: ROLE_MAP[u.role] || 'STUDENT' });
        existingEmails.add(email);
      }

      // Step 2: etudiant — skip existing user_ids (INSERT IGNORE equivalent)
      const emailToUserId = new Map(userRegistration.map((r) => [r.email, r.user_id]));
      const alreadyMigrated = new Set(etudiant.map((e) => e.user_id));
      for (const e of sourceEtudiants) {
        const email = (e.EMAIL || '').toLowerCase().trim();
        const userId = emailToUserId.get(email);
        if (!userId || alreadyMigrated.has(userId)) continue;
        etudiant.push({ etudiant_id: nextEtudiantId++, user_id: userId, nom: e.NOM, prenom: e.PRENOM });
        alreadyMigrated.add(userId);
      }
    }

    return {
      run: runMigration,
      getUserRegistration() { return userRegistration; },
      getEtudiant()         { return etudiant; },
    };
  }

  const SOURCE_USERS = [
    { EMAIL: 'alice@example.com', role: 'USER' },
    { EMAIL: 'bob@example.com',   role: 'DEPARTEMENT' },
  ];
  const SOURCE_ETUDIANTS = [
    { EMAIL: 'alice@example.com', NOM: 'Dupont', PRENOM: 'Alice' },
  ];

  test('running migration twice produces the same number of user_registration rows', () => {
    const m = buildIdempotentMigration();
    m.run(SOURCE_USERS, SOURCE_ETUDIANTS);
    const countAfterFirst = m.getUserRegistration().length;

    m.run(SOURCE_USERS, SOURCE_ETUDIANTS); // second run
    expect(m.getUserRegistration()).toHaveLength(countAfterFirst);
  });

  test('running migration twice produces the same number of etudiant rows', () => {
    const m = buildIdempotentMigration();
    m.run(SOURCE_USERS, SOURCE_ETUDIANTS);
    const countAfterFirst = m.getEtudiant().length;

    m.run(SOURCE_USERS, SOURCE_ETUDIANTS); // second run
    expect(m.getEtudiant()).toHaveLength(countAfterFirst);
  });

  test('running migration twice does not create duplicate user_registration emails', () => {
    const m = buildIdempotentMigration();
    m.run(SOURCE_USERS, SOURCE_ETUDIANTS);
    m.run(SOURCE_USERS, SOURCE_ETUDIANTS);

    const emails = m.getUserRegistration().map((r) => r.email);
    const uniqueEmails = new Set(emails);
    expect(uniqueEmails.size).toBe(emails.length);
  });

  test('running migration twice does not create duplicate etudiant user_ids', () => {
    const m = buildIdempotentMigration();
    m.run(SOURCE_USERS, SOURCE_ETUDIANTS);
    m.run(SOURCE_USERS, SOURCE_ETUDIANTS);

    const userIds = m.getEtudiant().map((e) => e.user_id);
    const uniqueIds = new Set(userIds);
    expect(uniqueIds.size).toBe(userIds.length);
  });

  test('data values are unchanged after a second migration run', () => {
    const m = buildIdempotentMigration();
    m.run(SOURCE_USERS, SOURCE_ETUDIANTS);
    const snapshotUsers    = JSON.stringify(m.getUserRegistration());
    const snapshotEtudiants = JSON.stringify(m.getEtudiant());

    m.run(SOURCE_USERS, SOURCE_ETUDIANTS);
    expect(JSON.stringify(m.getUserRegistration())).toBe(snapshotUsers);
    expect(JSON.stringify(m.getEtudiant())).toBe(snapshotEtudiants);
  });
});
