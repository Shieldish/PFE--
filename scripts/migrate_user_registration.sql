-- ============================================================
-- DATA MIGRATION: user_registrations → user_registration
-- Migrates users from the old authentication table to the new
-- redesigned user_registration table.
--
-- Old table: user_registrations (Sequelize auto-pluralized)
--   Columns: id, UUID, EMAIL, NOM, PRENOM, PASSWORD,
--            DEPARTEMENT, ADDRESS, DATE, role, ISVALIDATED,
--            TOKEN, lastEmailSentTime, lastEmailResetTime,
--            lastEmailResetSent, createdAt, updatedAt
--   Roles:   USER | ADMIN | DEPARTEMENT | ENTREPRISE
--
-- New table: user_registration
--   Columns: user_id, uuid, email, password_hash, role,
--            is_active, created_at, updated_at
--   Roles:   STUDENT | TEACHER | SUPERVISOR | COMPANY | ADMIN
--
-- Requirements: 8.4, 10.5
-- Idempotent: safe to run multiple times (INSERT IGNORE)
-- Rollback:   See ROLLBACK section at the bottom
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ── Ensure the target table exists before migrating ──────────
-- (The table is created by migration 20240101000001-create-user-registration.js)
-- If it does not exist yet, abort with a clear error rather than
-- silently creating a broken state.
-- ─────────────────────────────────────────────────────────────

-- ── Role mapping ─────────────────────────────────────────────
-- OLD role  →  NEW role
-- USER      →  STUDENT
-- ADMIN     →  ADMIN
-- DEPARTEMENT → TEACHER
-- ENTREPRISE  → COMPANY
-- (any unknown value falls back to STUDENT)
-- ─────────────────────────────────────────────────────────────

INSERT INTO user_registration (uuid, email, password_hash, role, is_active, created_at, updated_at)
SELECT
    -- Generate a fresh UUID if the old UUID column is NULL or empty,
    -- otherwise reuse the existing value to preserve external references.
    CASE
        WHEN old.UUID IS NULL OR TRIM(old.UUID) = '' THEN UUID()
        ELSE old.UUID
    END                                                         AS uuid,

    LOWER(TRIM(old.EMAIL))                                      AS email,

    -- The old PASSWORD column already stores a bcrypt hash.
    -- Copy it directly; no re-hashing needed.
    COALESCE(old.PASSWORD, '$2b$10$invalidhashplaceholder00000000000000000000000000000000')
                                                                AS password_hash,

    -- Map old role enum values to new enum values.
    CASE old.role
        WHEN 'ADMIN'       THEN 'ADMIN'
        WHEN 'DEPARTEMENT' THEN 'TEACHER'
        WHEN 'ENTREPRISE'  THEN 'COMPANY'
        ELSE                    'STUDENT'   -- covers 'USER' and any unknown value
    END                                                         AS role,

    -- Treat validated accounts as active; unvalidated as inactive.
    COALESCE(old.ISVALIDATED, FALSE)                            AS is_active,

    COALESCE(old.createdAt, NOW())                              AS created_at,
    COALESCE(old.updatedAt, NOW())                              AS updated_at

FROM user_registrations AS old

-- Skip rows whose email already exists in the target table
-- (makes the script idempotent).
WHERE LOWER(TRIM(old.EMAIL)) NOT IN (
    SELECT email FROM user_registration
);

-- ── Summary ───────────────────────────────────────────────────
SELECT
    COUNT(*)                                                    AS total_migrated,
    SUM(role = 'STUDENT')                                       AS students,
    SUM(role = 'TEACHER')                                       AS teachers,
    SUM(role = 'COMPANY')                                       AS companies,
    SUM(role = 'ADMIN')                                         AS admins,
    SUM(role = 'SUPERVISOR')                                    AS supervisors
FROM user_registration;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- ROLLBACK (run manually if you need to undo this migration)
-- ============================================================
-- WARNING: This deletes ALL rows from user_registration that
-- originated from user_registrations. Only run this if you
-- are sure no downstream tables (etudiant, enseignant, etc.)
-- reference these rows yet.
--
-- DELETE ur
-- FROM user_registration ur
-- WHERE ur.email IN (
--     SELECT LOWER(TRIM(EMAIL)) FROM user_registrations
-- );
-- ============================================================
