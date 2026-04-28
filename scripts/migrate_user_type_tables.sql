-- ============================================================
-- DATA MIGRATION: old user-type tables → new user-type tables
-- Migrates user profile data from the old schema into the new
-- etudiant, enseignant, encadrant, and entreprise tables.
--
-- Prerequisites:
--   1. migrate_user_registration.sql (or .js) must have run first
--      so that user_registration rows exist with valid user_id values.
--   2. The new schema migrations (20240101000002 through 000005)
--      must have run so the new tables exist.
--
-- Old tables (pre-redesign, Sequelize auto-pluralized names):
--   etudiant    — EMAIL PK, NOM, PRENOM, SEXE, DEPARTEMENT, SPECIALITE, ID (uuid)
--   enseignant  — EMAIL PK, NOM, PRENOM, SEXE, DEPARTEMENT
--   encadrant   — EMAIL PK, NOM, PRENOM, SEXE, DEPARTEMENT
--   entreprise  — EMAIL PK, NOM, DOMAINE, VILLE, ADDRESSE, TELEPHONE
--
-- New tables (post-redesign):
--   etudiant    — etudiant_id PK, user_id FK, uuid, nom, prenom, sexe,
--                 departement, specialite, date_naissance, telephone
--   enseignant  — enseignant_id PK, user_id FK, email, nom, prenom, sexe,
--                 departement, grade, telephone
--   encadrant   — encadrant_id PK, user_id FK, email, nom, prenom, sexe,
--                 entreprise_id, poste, telephone
--   entreprise  — entreprise_id PK, user_id FK, nom, domaine, ville,
--                 adresse, telephone, email, site_web
--
-- Strategy:
--   The old and new tables share the same names. After the schema
--   migrations run, the tables already have the new structure.
--   We use the old data stored in backup tables (old_etudiant, etc.)
--   if they exist, or fall back to reading from the current tables
--   if they still contain old-style rows (EMAIL as a non-null string
--   but no user_id yet).
--
--   This script uses a staging approach:
--     1. Read old data from backup tables (old_etudiant, old_enseignant,
--        old_encadrant, old_entreprise) if they exist.
--     2. JOIN with user_registration on email to get user_id.
--     3. INSERT IGNORE into the new tables (idempotent).
--
-- Idempotent: safe to run multiple times (INSERT IGNORE / ON DUPLICATE KEY)
-- Requirements: 8.4, 10.5
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- SECTION 1: etudiant (students)
-- Old role in user_registration: STUDENT
-- Old table backup: old_etudiant (if it exists)
-- ============================================================

-- Migrate from old_etudiant backup table if it exists
INSERT IGNORE INTO etudiant
    (user_id, uuid, nom, prenom, sexe, departement, specialite,
     date_naissance, telephone, created_at, updated_at)
SELECT
    ur.user_id,
    -- Reuse the old UUID if valid, otherwise generate a new one
    CASE
        WHEN old.ID IS NOT NULL AND TRIM(old.ID) != '' THEN old.ID
        ELSE UUID()
    END                                                     AS uuid,
    COALESCE(NULLIF(TRIM(old.NOM),    ''), 'N/A')           AS nom,
    COALESCE(NULLIF(TRIM(old.PRENOM), ''), 'N/A')           AS prenom,
    -- Map old SEXE values; default to 'M' if unknown
    CASE UPPER(TRIM(old.SEXE))
        WHEN 'F'      THEN 'F'
        WHEN 'FEMME'  THEN 'F'
        WHEN 'FEMALE' THEN 'F'
        ELSE               'M'
    END                                                     AS sexe,
    COALESCE(NULLIF(TRIM(old.DEPARTEMENT), ''), 'N/A')      AS departement,
    COALESCE(NULLIF(TRIM(old.SPECIALITE),  ''), 'N/A')      AS specialite,
    -- DATE column in old schema is VARCHAR; try to cast to DATE
    CASE
        WHEN old.DATE IS NOT NULL AND old.DATE REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
            THEN STR_TO_DATE(old.DATE, '%Y-%m-%d')
        ELSE NULL
    END                                                     AS date_naissance,
    NULL                                                    AS telephone,
    COALESCE(old.createdAt, NOW())                          AS created_at,
    COALESCE(old.updatedAt, NOW())                          AS updated_at
FROM old_etudiant AS old
INNER JOIN user_registration AS ur
    ON LOWER(TRIM(ur.email)) = LOWER(TRIM(old.EMAIL))
-- Skip rows whose user_id is already in the new etudiant table
WHERE ur.user_id NOT IN (SELECT user_id FROM etudiant);


-- ============================================================
-- SECTION 2: enseignant (academic teachers/supervisors)
-- Old role in user_registration: TEACHER
-- Old table backup: old_enseignant (if it exists)
-- ============================================================

INSERT IGNORE INTO enseignant
    (user_id, email, nom, prenom, sexe, departement, grade,
     telephone, created_at, updated_at)
SELECT
    ur.user_id,
    LOWER(TRIM(old.EMAIL))                                  AS email,
    COALESCE(NULLIF(TRIM(old.NOM),    ''), 'N/A')           AS nom,
    COALESCE(NULLIF(TRIM(old.PRENOM), ''), 'N/A')           AS prenom,
    CASE UPPER(TRIM(old.SEXE))
        WHEN 'F'      THEN 'F'
        WHEN 'FEMME'  THEN 'F'
        WHEN 'FEMALE' THEN 'F'
        ELSE               'M'
    END                                                     AS sexe,
    COALESCE(NULLIF(TRIM(old.DEPARTEMENT), ''), 'N/A')      AS departement,
    NULL                                                    AS grade,
    NULL                                                    AS telephone,
    COALESCE(old.createdAt, NOW())                          AS created_at,
    COALESCE(old.updatedAt, NOW())                          AS updated_at
FROM old_enseignant AS old
INNER JOIN user_registration AS ur
    ON LOWER(TRIM(ur.email)) = LOWER(TRIM(old.EMAIL))
WHERE ur.user_id NOT IN (SELECT user_id FROM enseignant);


-- ============================================================
-- SECTION 3: entreprise (companies)
-- Must be migrated BEFORE encadrant because encadrant.entreprise_id
-- references entreprise(entreprise_id).
-- Old role in user_registration: COMPANY
-- Old table backup: old_entreprise (if it exists)
-- ============================================================

INSERT IGNORE INTO entreprise
    (user_id, nom, domaine, ville, adresse, telephone, email,
     site_web, created_at, updated_at)
SELECT
    ur.user_id,
    COALESCE(NULLIF(TRIM(old.NOM),       ''), 'N/A')        AS nom,
    COALESCE(NULLIF(TRIM(old.DOMAINE),   ''), 'N/A')        AS domaine,
    COALESCE(NULLIF(TRIM(old.VILLE),     ''), 'N/A')        AS ville,
    COALESCE(NULLIF(TRIM(old.ADDRESSE),  ''), 'N/A')        AS adresse,
    COALESCE(NULLIF(TRIM(old.TELEPHONE), ''), 'N/A')        AS telephone,
    LOWER(TRIM(old.EMAIL))                                  AS email,
    NULL                                                    AS site_web,
    COALESCE(old.createdAt, NOW())                          AS created_at,
    COALESCE(old.updatedAt, NOW())                          AS updated_at
FROM old_entreprise AS old
INNER JOIN user_registration AS ur
    ON LOWER(TRIM(ur.email)) = LOWER(TRIM(old.EMAIL))
WHERE ur.user_id NOT IN (SELECT user_id FROM entreprise);


-- ============================================================
-- SECTION 4: encadrant (professional supervisors)
-- Old role in user_registration: SUPERVISOR
-- Old table backup: old_encadrant (if it exists)
-- Note: entreprise_id is left NULL because the old schema did not
-- store a company link for encadrant rows.
-- ============================================================

INSERT IGNORE INTO encadrant
    (user_id, email, nom, prenom, sexe, entreprise_id, poste,
     telephone, created_at, updated_at)
SELECT
    ur.user_id,
    LOWER(TRIM(old.EMAIL))                                  AS email,
    COALESCE(NULLIF(TRIM(old.NOM),    ''), 'N/A')           AS nom,
    COALESCE(NULLIF(TRIM(old.PRENOM), ''), 'N/A')           AS prenom,
    CASE UPPER(TRIM(old.SEXE))
        WHEN 'F'      THEN 'F'
        WHEN 'FEMME'  THEN 'F'
        WHEN 'FEMALE' THEN 'F'
        ELSE               'M'
    END                                                     AS sexe,
    NULL                                                    AS entreprise_id,
    NULL                                                    AS poste,
    NULL                                                    AS telephone,
    COALESCE(old.createdAt, NOW())                          AS created_at,
    COALESCE(old.updatedAt, NOW())                          AS updated_at
FROM old_encadrant AS old
INNER JOIN user_registration AS ur
    ON LOWER(TRIM(ur.email)) = LOWER(TRIM(old.EMAIL))
WHERE ur.user_id NOT IN (SELECT user_id FROM encadrant);


-- ============================================================
-- SECTION 5: Summary
-- ============================================================

SELECT 'etudiant'   AS target_table, COUNT(*) AS total_rows FROM etudiant
UNION ALL
SELECT 'enseignant' AS target_table, COUNT(*) AS total_rows FROM enseignant
UNION ALL
SELECT 'encadrant'  AS target_table, COUNT(*) AS total_rows FROM encadrant
UNION ALL
SELECT 'entreprise' AS target_table, COUNT(*) AS total_rows FROM entreprise;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- ROLLBACK (run manually if you need to undo this migration)
-- ============================================================
-- WARNING: This deletes ALL rows from the new user-type tables.
-- Only run this if you are sure no downstream tables (stage,
-- candidature, etc.) reference these rows yet.
--
-- SET FOREIGN_KEY_CHECKS = 0;
-- DELETE FROM encadrant;
-- DELETE FROM entreprise;
-- DELETE FROM enseignant;
-- DELETE FROM etudiant;
-- SET FOREIGN_KEY_CHECKS = 1;
-- ============================================================
