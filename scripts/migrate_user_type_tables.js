#!/usr/bin/env node
/**
 * migrate_user_type_tables.js
 *
 * Migrates user profile data from the old schema into the new
 * etudiant, enseignant, encadrant, and entreprise tables.
 *
 * Usage:
 *   node scripts/migrate_user_type_tables.js
 *
 * Requirements: 8.4, 10.5
 *
 * Prerequisites:
 *   1. migrate_user_registration.js must have run first so that
 *      user_registration rows exist with valid user_id values.
 *   2. The new schema migrations (20240101000002 through 000005)
 *      must have run so the new tables exist with the correct structure.
 *
 * Old schema (pre-redesign):
 *   etudiant    — EMAIL PK, NOM, PRENOM, SEXE, DEPARTEMENT, SPECIALITE, ID (uuid)
 *   enseignant  — EMAIL PK, NOM, PRENOM, SEXE, DEPARTEMENT
 *   encadrant   — EMAIL PK, NOM, PRENOM, SEXE, DEPARTEMENT
 *   entreprise  — EMAIL PK, NOM, DOMAINE, VILLE, ADDRESSE, TELEPHONE
 *
 * Strategy:
 *   The old and new tables share the same names. This script reads from
 *   backup tables (old_etudiant, old_enseignant, old_encadrant, old_entreprise)
 *   if they exist. If no backup tables are found, it attempts to detect
 *   old-style rows in the current tables (rows with EMAIL column but no user_id).
 *
 * Idempotent: rows whose user_id already exists in the target table are skipped.
 */

'use strict';

require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('../config/database');

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Normalise an email string: lowercase + trim. Returns null if empty. */
function normaliseEmail(raw) {
  if (!raw) return null;
  const s = String(raw).toLowerCase().trim();
  return s.length > 0 ? s : null;
}

/** Return a non-empty trimmed string or a fallback value. */
function coalesceStr(value, fallback = 'N/A') {
  if (!value) return fallback;
  const s = String(value).trim();
  return s.length > 0 ? s : fallback;
}

/** Map old SEXE values to the new ENUM('M', 'F'). Defaults to 'M'. */
function mapSexe(raw) {
  if (!raw) return 'M';
  const s = String(raw).toUpperCase().trim();
  if (s === 'F' || s === 'FEMME' || s === 'FEMALE') return 'F';
  return 'M';
}

/**
 * Try to parse a date string in YYYY-MM-DD format.
 * Returns a Date object or null.
 */
function parseDate(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Check whether a table exists in the current database.
 * Returns true/false.
 */
async function tableExists(tableName) {
  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.tables
     WHERE table_schema = DATABASE()
       AND table_name   = :tableName`,
    { replacements: { tableName }, type: sequelize.QueryTypes.SELECT }
  );
  return Number(rows.cnt) > 0;
}

// ── Migration functions ───────────────────────────────────────────────────────

/**
 * Fetch all rows from a backup table (old_<name>).
 * Returns an empty array if the table does not exist.
 */
async function fetchOldRows(backupTable) {
  const exists = await tableExists(backupTable);
  if (!exists) {
    console.log(`  ℹ  Backup table '${backupTable}' not found — skipping.`);
    return [];
  }
  const rows = await sequelize.query(
    `SELECT * FROM \`${backupTable}\``,
    { type: sequelize.QueryTypes.SELECT }
  );
  console.log(`  ℹ  Found ${rows.length} row(s) in '${backupTable}'.`);
  return rows;
}

/**
 * Build a Map<email → user_id> from user_registration for fast lookups.
 */
async function buildEmailToUserIdMap() {
  const rows = await sequelize.query(
    'SELECT user_id, email FROM user_registration',
    { type: sequelize.QueryTypes.SELECT }
  );
  const map = new Map();
  for (const r of rows) {
    const email = normaliseEmail(r.email);
    if (email) map.set(email, r.user_id);
  }
  return map;
}

/**
 * Fetch the set of user_ids already present in a target table.
 */
async function existingUserIds(tableName) {
  const rows = await sequelize.query(
    `SELECT user_id FROM \`${tableName}\``,
    { type: sequelize.QueryTypes.SELECT }
  );
  return new Set(rows.map((r) => r.user_id));
}

// ── Per-table migration logic ─────────────────────────────────────────────────

async function migrateEtudiant(emailToUserId, transaction) {
  const oldRows = await fetchOldRows('old_etudiant');
  if (oldRows.length === 0) return 0;

  const alreadyMigrated = await existingUserIds('etudiant');
  const toInsert = [];

  for (const old of oldRows) {
    const email = normaliseEmail(old.EMAIL);
    if (!email) {
      console.warn(`    ⚠  etudiant row skipped: empty EMAIL.`);
      continue;
    }
    const userId = emailToUserId.get(email);
    if (!userId) {
      console.warn(`    ⚠  etudiant '${email}': no matching user_registration row — skipped.`);
      continue;
    }
    if (alreadyMigrated.has(userId)) continue;

    toInsert.push({
      user_id:        userId,
      uuid:           (old.ID && String(old.ID).trim()) ? String(old.ID).trim() : uuidv4(),
      nom:            coalesceStr(old.NOM),
      prenom:         coalesceStr(old.PRENOM),
      sexe:           mapSexe(old.SEXE),
      departement:    coalesceStr(old.DEPARTEMENT),
      specialite:     coalesceStr(old.SPECIALITE),
      date_naissance: parseDate(old.DATE),
      telephone:      null,
      created_at:     old.createdAt || new Date(),
      updated_at:     old.updatedAt || new Date(),
    });
    alreadyMigrated.add(userId); // prevent duplicates within the same batch
  }

  for (const row of toInsert) {
    await sequelize.query(
      `INSERT IGNORE INTO etudiant
         (user_id, uuid, nom, prenom, sexe, departement, specialite,
          date_naissance, telephone, created_at, updated_at)
       VALUES
         (:user_id, :uuid, :nom, :prenom, :sexe, :departement, :specialite,
          :date_naissance, :telephone, :created_at, :updated_at)`,
      { replacements: row, transaction }
    );
  }

  return toInsert.length;
}

async function migrateEnseignant(emailToUserId, transaction) {
  const oldRows = await fetchOldRows('old_enseignant');
  if (oldRows.length === 0) return 0;

  const alreadyMigrated = await existingUserIds('enseignant');
  const toInsert = [];

  for (const old of oldRows) {
    const email = normaliseEmail(old.EMAIL);
    if (!email) {
      console.warn(`    ⚠  enseignant row skipped: empty EMAIL.`);
      continue;
    }
    const userId = emailToUserId.get(email);
    if (!userId) {
      console.warn(`    ⚠  enseignant '${email}': no matching user_registration row — skipped.`);
      continue;
    }
    if (alreadyMigrated.has(userId)) continue;

    toInsert.push({
      user_id:    userId,
      email,
      nom:        coalesceStr(old.NOM),
      prenom:     coalesceStr(old.PRENOM),
      sexe:       mapSexe(old.SEXE),
      departement: coalesceStr(old.DEPARTEMENT),
      grade:      null,
      telephone:  null,
      created_at: old.createdAt || new Date(),
      updated_at: old.updatedAt || new Date(),
    });
    alreadyMigrated.add(userId);
  }

  for (const row of toInsert) {
    await sequelize.query(
      `INSERT IGNORE INTO enseignant
         (user_id, email, nom, prenom, sexe, departement, grade,
          telephone, created_at, updated_at)
       VALUES
         (:user_id, :email, :nom, :prenom, :sexe, :departement, :grade,
          :telephone, :created_at, :updated_at)`,
      { replacements: row, transaction }
    );
  }

  return toInsert.length;
}

async function migrateEntreprise(emailToUserId, transaction) {
  const oldRows = await fetchOldRows('old_entreprise');
  if (oldRows.length === 0) return 0;

  const alreadyMigrated = await existingUserIds('entreprise');
  const toInsert = [];

  for (const old of oldRows) {
    const email = normaliseEmail(old.EMAIL);
    if (!email) {
      console.warn(`    ⚠  entreprise row skipped: empty EMAIL.`);
      continue;
    }
    const userId = emailToUserId.get(email);
    if (!userId) {
      console.warn(`    ⚠  entreprise '${email}': no matching user_registration row — skipped.`);
      continue;
    }
    if (alreadyMigrated.has(userId)) continue;

    toInsert.push({
      user_id:    userId,
      nom:        coalesceStr(old.NOM),
      domaine:    coalesceStr(old.DOMAINE),
      ville:      coalesceStr(old.VILLE),
      adresse:    coalesceStr(old.ADDRESSE),
      telephone:  coalesceStr(old.TELEPHONE),
      email,
      site_web:   null,
      created_at: old.createdAt || new Date(),
      updated_at: old.updatedAt || new Date(),
    });
    alreadyMigrated.add(userId);
  }

  for (const row of toInsert) {
    await sequelize.query(
      `INSERT IGNORE INTO entreprise
         (user_id, nom, domaine, ville, adresse, telephone, email,
          site_web, created_at, updated_at)
       VALUES
         (:user_id, :nom, :domaine, :ville, :adresse, :telephone, :email,
          :site_web, :created_at, :updated_at)`,
      { replacements: row, transaction }
    );
  }

  return toInsert.length;
}

async function migrateEncadrant(emailToUserId, transaction) {
  const oldRows = await fetchOldRows('old_encadrant');
  if (oldRows.length === 0) return 0;

  const alreadyMigrated = await existingUserIds('encadrant');
  const toInsert = [];

  for (const old of oldRows) {
    const email = normaliseEmail(old.EMAIL);
    if (!email) {
      console.warn(`    ⚠  encadrant row skipped: empty EMAIL.`);
      continue;
    }
    const userId = emailToUserId.get(email);
    if (!userId) {
      console.warn(`    ⚠  encadrant '${email}': no matching user_registration row — skipped.`);
      continue;
    }
    if (alreadyMigrated.has(userId)) continue;

    toInsert.push({
      user_id:       userId,
      email,
      nom:           coalesceStr(old.NOM),
      prenom:        coalesceStr(old.PRENOM),
      sexe:          mapSexe(old.SEXE),
      entreprise_id: null, // old schema had no company link for encadrant
      poste:         null,
      telephone:     null,
      created_at:    old.createdAt || new Date(),
      updated_at:    old.updatedAt || new Date(),
    });
    alreadyMigrated.add(userId);
  }

  for (const row of toInsert) {
    await sequelize.query(
      `INSERT IGNORE INTO encadrant
         (user_id, email, nom, prenom, sexe, entreprise_id, poste,
          telephone, created_at, updated_at)
       VALUES
         (:user_id, :email, :nom, :prenom, :sexe, :entreprise_id, :poste,
          :telephone, :created_at, :updated_at)`,
      { replacements: row, transaction }
    );
  }

  return toInsert.length;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function migrate() {
  // 1. Connect
  try {
    await sequelize.authenticate();
    console.log('✔  Database connection established.');
  } catch (err) {
    console.error('✘  Cannot connect to database:', err.message);
    process.exit(1);
  }

  // 2. Build email → user_id lookup from the already-migrated user_registration
  let emailToUserId;
  try {
    emailToUserId = await buildEmailToUserIdMap();
    console.log(`ℹ  Loaded ${emailToUserId.size} user(s) from user_registration.`);
  } catch (err) {
    console.error('✘  Could not read user_registration:', err.message);
    console.error('   Run migrate_user_registration.js first.');
    process.exit(1);
  }

  if (emailToUserId.size === 0) {
    console.log('ℹ  user_registration is empty — run migrate_user_registration.js first.');
    await sequelize.close();
    return;
  }

  // 3. Run all four migrations inside a single transaction
  const t = await sequelize.transaction();
  let counts = { etudiant: 0, enseignant: 0, entreprise: 0, encadrant: 0 };

  try {
    console.log('\n── Migrating etudiant ──────────────────────────────────');
    counts.etudiant = await migrateEtudiant(emailToUserId, t);

    console.log('\n── Migrating enseignant ────────────────────────────────');
    counts.enseignant = await migrateEnseignant(emailToUserId, t);

    // entreprise must come before encadrant (FK dependency)
    console.log('\n── Migrating entreprise ────────────────────────────────');
    counts.entreprise = await migrateEntreprise(emailToUserId, t);

    console.log('\n── Migrating encadrant ─────────────────────────────────');
    counts.encadrant = await migrateEncadrant(emailToUserId, t);

    await t.commit();
    console.log('\n✔  Transaction committed successfully.');
  } catch (err) {
    await t.rollback();
    console.error('\n✘  Migration failed — transaction rolled back:', err.message);
    process.exit(1);
  }

  // 4. Print summary
  console.log('\n── Migration summary ───────────────────────────────────');
  console.log(`  etudiant    inserted : ${counts.etudiant}`);
  console.log(`  enseignant  inserted : ${counts.enseignant}`);
  console.log(`  entreprise  inserted : ${counts.entreprise}`);
  console.log(`  encadrant   inserted : ${counts.encadrant}`);
  console.log('────────────────────────────────────────────────────────');

  // 5. Final row counts from the new tables
  try {
    const tables = ['etudiant', 'enseignant', 'encadrant', 'entreprise'];
    console.log('\n── Current row counts ──────────────────────────────────');
    for (const tbl of tables) {
      const [row] = await sequelize.query(
        `SELECT COUNT(*) AS cnt FROM \`${tbl}\``,
        { type: sequelize.QueryTypes.SELECT }
      );
      console.log(`  ${tbl.padEnd(12)}: ${row.cnt} row(s)`);
    }
    console.log('────────────────────────────────────────────────────────\n');
  } catch (err) {
    console.warn('  ⚠  Could not fetch final row counts:', err.message);
  }

  await sequelize.close();
}

migrate();
