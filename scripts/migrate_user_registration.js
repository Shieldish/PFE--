#!/usr/bin/env node
/**
 * migrate_user_registration.js
 *
 * Migrates users from the old `user_registrations` table to the new
 * `user_registration` table using Sequelize.
 *
 * Usage:
 *   node scripts/migrate_user_registration.js
 *
 * Requirements: 8.4, 10.5
 *
 * Idempotent: rows whose email already exists in the target table are
 * skipped (INSERT … ON DUPLICATE KEY UPDATE is a no-op for existing rows).
 *
 * Role mapping (old → new):
 *   USER        → STUDENT
 *   ADMIN       → ADMIN
 *   DEPARTEMENT → TEACHER
 *   ENTREPRISE  → COMPANY
 *   <unknown>   → STUDENT  (safe fallback)
 */

'use strict';

require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('../config/database');

// ── Role mapping ──────────────────────────────────────────────────────────────
const ROLE_MAP = {
  USER:        'STUDENT',
  ADMIN:       'ADMIN',
  DEPARTEMENT: 'TEACHER',
  ENTREPRISE:  'COMPANY',
};

function mapRole(oldRole) {
  return ROLE_MAP[oldRole] || 'STUDENT';
}

// ── Placeholder hash used when a user has no password stored ─────────────────
// This is an intentionally invalid bcrypt hash so the account cannot be used
// until the user resets their password.
const INVALID_HASH = '$2b$10$invalidhashplaceholderXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

// ── Main migration ────────────────────────────────────────────────────────────
async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('✔  Database connection established.');
  } catch (err) {
    console.error('✘  Cannot connect to database:', err.message);
    process.exit(1);
  }

  // ── 1. Fetch all rows from the old table ──────────────────────────────────
  let oldUsers;
  try {
    oldUsers = await sequelize.query(
      'SELECT id, UUID, EMAIL, PASSWORD, role, ISVALIDATED, createdAt, updatedAt FROM user_registrations',
      { type: sequelize.QueryTypes.SELECT }
    );
  } catch (err) {
    console.error('✘  Could not read from user_registrations:', err.message);
    console.error('   Make sure the old table exists before running this script.');
    process.exit(1);
  }

  if (oldUsers.length === 0) {
    console.log('ℹ  No rows found in user_registrations — nothing to migrate.');
    await sequelize.close();
    return;
  }

  console.log(`ℹ  Found ${oldUsers.length} user(s) in user_registrations.`);

  // ── 2. Fetch emails already present in the new table ─────────────────────
  const existingRows = await sequelize.query(
    'SELECT email FROM user_registration',
    { type: sequelize.QueryTypes.SELECT }
  );
  const existingEmails = new Set(existingRows.map((r) => r.email.toLowerCase().trim()));

  // ── 3. Build the list of rows to insert ───────────────────────────────────
  const toInsert = [];
  const skipped  = [];

  for (const user of oldUsers) {
    const email = (user.EMAIL || '').toLowerCase().trim();

    if (!email) {
      console.warn(`  ⚠  Skipping user id=${user.id}: empty email.`);
      skipped.push(user);
      continue;
    }

    if (existingEmails.has(email)) {
      skipped.push(user);
      continue;
    }

    toInsert.push({
      uuid:          user.UUID && user.UUID.trim() ? user.UUID.trim() : uuidv4(),
      email,
      password_hash: user.PASSWORD || INVALID_HASH,
      role:          mapRole(user.role),
      is_active:     user.ISVALIDATED ? 1 : 0,
      created_at:    user.createdAt || new Date(),
      updated_at:    user.updatedAt || new Date(),
    });

    // Track the email so duplicate rows within the old table are also skipped.
    existingEmails.add(email);
  }

  console.log(`ℹ  ${toInsert.length} row(s) to insert, ${skipped.length} already exist / skipped.`);

  if (toInsert.length === 0) {
    console.log('✔  Nothing to do — all users already migrated.');
    await sequelize.close();
    return;
  }

  // ── 4. Insert in a transaction ────────────────────────────────────────────
  const t = await sequelize.transaction();
  let inserted = 0;

  try {
    for (const row of toInsert) {
      await sequelize.query(
        `INSERT INTO user_registration
           (uuid, email, password_hash, role, is_active, created_at, updated_at)
         VALUES
           (:uuid, :email, :password_hash, :role, :is_active, :created_at, :updated_at)`,
        { replacements: row, transaction: t }
      );
      inserted++;
    }

    await t.commit();
    console.log(`✔  Successfully inserted ${inserted} user(s) into user_registration.`);
  } catch (err) {
    await t.rollback();
    console.error('✘  Migration failed — transaction rolled back:', err.message);
    process.exit(1);
  }

  // ── 5. Print summary ──────────────────────────────────────────────────────
  const [summary] = await sequelize.query(
    `SELECT
       COUNT(*)                AS total,
       SUM(role = 'STUDENT')   AS students,
       SUM(role = 'TEACHER')   AS teachers,
       SUM(role = 'COMPANY')   AS companies,
       SUM(role = 'ADMIN')     AS admins,
       SUM(role = 'SUPERVISOR') AS supervisors
     FROM user_registration`,
    { type: sequelize.QueryTypes.SELECT }
  );

  console.log('\n── user_registration summary ──────────────────────────');
  console.log(`  Total rows : ${summary.total}`);
  console.log(`  STUDENT    : ${summary.students}`);
  console.log(`  TEACHER    : ${summary.teachers}`);
  console.log(`  COMPANY    : ${summary.companies}`);
  console.log(`  ADMIN      : ${summary.admins}`);
  console.log(`  SUPERVISOR : ${summary.supervisors}`);
  console.log('───────────────────────────────────────────────────────\n');

  await sequelize.close();
}

migrate();
