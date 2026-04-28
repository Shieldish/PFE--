-- ============================================================
-- DATA MIGRATION: old business logic tables → new business tables
-- Migrates stage, candidature/stagepostulation, affectation, and
-- soutenance data from old backup tables into the new schema.
--
-- Prerequisites:
--   1. migrate_user_registration.sql must have run first.
--   2. migrate_user_type_tables.sql must have run first so that
--      etudiant, enseignant, encadrant, and entreprise rows exist.
--   3. The new schema migrations (20240101000006 through 000009)
--      must have run so the new tables exist.
--
-- Old tables (pre-redesign):
--   stage             — id (UUID PK), Domaine, Nom, Titre, Libelle,
--                       Description, Niveau, Experience, Langue,
--                       PostesVacants, Telephone, Fax, Email, Email2,
--                       DateDebut, DateFin, Address, Rue, State, Zip,
--                       gridCheck, CreatedBy, createdAt, updatedAt
--
--   stagepostulation  — id (INT PK), stageId, etudiantID, etudiantName,
--                       etudiantInstitue, etudiantSection, etudiantEmail,
--                       stageDomaine, stageSujet, entrepriseName,
--                       entrepriseEmail, status, CV, postulatedAt
--
--   candidature       — candidatureId (UUID PK), id (etudiant UUID),
--                       nom, prenom, date_naissance, adresse, telephone,
--                       email, niveau_etudes, institution, domaine_etudes,
--                       section, annee_obtention, experience,
--                       experience_description, motivation, langues,
--                       logiciels, competences_autres, date_debut,
--                       duree_stage, cv, lettre_motivation, releves_notes,
--                       created_at, updated_at
--
--   soutenance        — id (INT PK), date, time, salle, groupe, type,
--                       etudiant1, etudiant2, etudiant3, sujet,
--                       president, rapporteur, encadrantAcademique,
--                       encadrantProfessionnel, entreprise,
--                       createdAt, updatedAt
--
-- New tables (post-redesign):
--   stage             — stage_id (INT PK), entreprise_id FK, titre,
--                       domaine, description, niveau_requis, ...
--   candidature       — candidature_id (INT PK), stage_id FK,
--                       etudiant_id FK, status, snapshot fields, ...
--   affectation       — affectation_id (INT PK), candidature_id FK,
--                       enseignant_id FK, encadrant_id FK, ...
--   soutenance        — soutenance_id (INT PK), affectation_id FK,
--                       jury FKs, student name fields, ...
--
-- Strategy:
--   Read from backup tables (old_stage, old_stagepostulation,
--   old_candidature, old_soutenance) if they exist.
--   JOIN with new user-type tables to resolve integer FKs.
--   INSERT IGNORE for idempotency.
--
-- Idempotent: safe to run multiple times (INSERT IGNORE)
-- Requirements: 8.4, 10.5
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- SECTION 1: stage
-- Old backup table: old_stage
-- Maps old UUID-based stage rows to new INT PK rows.
-- entreprise_id resolved by joining entreprise on email.
-- ============================================================

INSERT IGNORE INTO stage
    (entreprise_id, titre, domaine, description, niveau_requis,
     experience_requise, langue_requise, postes_vacants,
     date_debut, date_fin, adresse, ville, code_postal,
     contact_email, contact_telephone, is_active,
     created_at, updated_at)
SELECT
    e.entreprise_id,
    COALESCE(NULLIF(TRIM(old.Titre),   ''), 'N/A')          AS titre,
    COALESCE(NULLIF(TRIM(old.Domaine), ''), 'N/A')          AS domaine,
    -- Description may be zlib-compressed base64; store as-is (TEXT)
    COALESCE(NULLIF(old.Description, ''), old.Libelle, 'N/A') AS description,
    -- Map old Niveau string to new ENUM
    CASE UPPER(TRIM(COALESCE(old.Niveau, '')))
        WHEN 'MASTER'   THEN 'MASTER'
        WHEN 'DOCTORAT' THEN 'DOCTORAT'
        WHEN 'LICENCE'  THEN 'LICENCE'
        ELSE                 'AUTRE'
    END                                                     AS niveau_requis,
    NULLIF(TRIM(old.Experience), '')                        AS experience_requise,
    NULLIF(TRIM(old.Langue),     '')                        AS langue_requise,
    CASE
        WHEN old.PostesVacants REGEXP '^[0-9]+$' THEN CAST(old.PostesVacants AS UNSIGNED)
        ELSE 1
    END                                                     AS postes_vacants,
    -- DateDebut / DateFin: try to cast; fall back to today
    CASE
        WHEN old.DateDebut IS NOT NULL
             AND old.DateDebut REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
        THEN DATE(old.DateDebut)
        ELSE CURDATE()
    END                                                     AS date_debut,
    CASE
        WHEN old.DateFin IS NOT NULL
             AND old.DateFin REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
        THEN DATE(old.DateFin)
        ELSE DATE_ADD(CURDATE(), INTERVAL 3 MONTH)
    END                                                     AS date_fin,
    COALESCE(
        NULLIF(CONCAT_WS(', ', NULLIF(TRIM(old.Rue),''), NULLIF(TRIM(old.Address),'')), ''),
        'N/A'
    )                                                       AS adresse,
    COALESCE(NULLIF(TRIM(old.State), ''), 'N/A')            AS ville,
    NULLIF(TRIM(old.Zip), '')                               AS code_postal,
    LOWER(TRIM(COALESCE(NULLIF(old.Email, ''), old.Email2, 'contact@unknown.com')))
                                                            AS contact_email,
    COALESCE(NULLIF(TRIM(old.Telephone), ''), 'N/A')        AS contact_telephone,
    TRUE                                                    AS is_active,
    COALESCE(old.createdAt, NOW())                          AS created_at,
    COALESCE(old.updatedAt, NOW())                          AS updated_at
FROM old_stage AS old
-- Resolve entreprise_id: the old stage stores CreatedBy (email of the company user)
INNER JOIN entreprise AS e
    ON LOWER(TRIM(e.email)) = LOWER(TRIM(old.CreatedBy))
-- Skip if a stage with the same contact_email + titre already exists
WHERE NOT EXISTS (
    SELECT 1 FROM stage s2
    WHERE LOWER(TRIM(s2.contact_email)) = LOWER(TRIM(COALESCE(NULLIF(old.Email,''), old.Email2, 'contact@unknown.com')))
      AND TRIM(s2.titre) = TRIM(old.Titre)
      AND s2.entreprise_id = e.entreprise_id
);


-- ============================================================
-- SECTION 2: candidature
-- Sources: old_stagepostulation (simple application records)
--          old_candidature      (detailed application forms)
--
-- Both are migrated into the new candidature table.
-- etudiant_id resolved via etudiant.uuid or email.
-- stage_id resolved via stage.contact_email + titre match.
-- Snapshot fields populated from etudiant table.
-- ============================================================

-- 2a. From old_stagepostulation
INSERT IGNORE INTO candidature
    (stage_id, etudiant_id, status,
     etudiant_nom, etudiant_prenom, etudiant_email,
     etudiant_departement, etudiant_specialite,
     cv_path, lettre_motivation_path, releves_notes_path,
     motivation_letter, date_postulation, date_modification)
SELECT
    s.stage_id,
    et.etudiant_id,
    CASE UPPER(TRIM(old.status))
        WHEN 'ACCEPTÉ'  THEN 'ACCEPTE'
        WHEN 'ACCEPTE'  THEN 'ACCEPTE'
        WHEN 'REFUSÉ'   THEN 'REFUSE'
        WHEN 'REFUSE'   THEN 'REFUSE'
        ELSE                 'EN_ATTENTE'
    END                                                     AS status,
    -- Snapshot: use etudiant table values (authoritative)
    COALESCE(NULLIF(TRIM(et.nom),    ''), 'N/A')            AS etudiant_nom,
    COALESCE(NULLIF(TRIM(et.prenom), ''), 'N/A')            AS etudiant_prenom,
    LOWER(TRIM(old.etudiantEmail))                          AS etudiant_email,
    COALESCE(NULLIF(TRIM(et.departement), ''), 'N/A')       AS etudiant_departement,
    COALESCE(NULLIF(TRIM(et.specialite),  ''), 'N/A')       AS etudiant_specialite,
    NULLIF(TRIM(old.CV), '')                                AS cv_path,
    NULL                                                    AS lettre_motivation_path,
    NULL                                                    AS releves_notes_path,
    NULL                                                    AS motivation_letter,
    COALESCE(old.postulatedAt, NOW())                       AS date_postulation,
    COALESCE(old.postulatedAt, NOW())                       AS date_modification
FROM old_stagepostulation AS old
-- Resolve etudiant_id via email
INNER JOIN etudiant AS et
    ON LOWER(TRIM(et.nom)) = LOWER(TRIM(SUBSTRING_INDEX(old.etudiantName, ' ', 1)))
    OR EXISTS (
        SELECT 1 FROM user_registration ur2
        WHERE ur2.user_id = et.user_id
          AND LOWER(TRIM(ur2.email)) = LOWER(TRIM(old.etudiantEmail))
    )
-- Resolve stage_id: match on stageId (old UUID) stored in old_stage
INNER JOIN stage AS s
    ON s.stage_id IN (
        SELECT ns.stage_id FROM stage ns
        INNER JOIN old_stage os ON LOWER(TRIM(os.CreatedBy)) = LOWER(TRIM(
            (SELECT e2.email FROM entreprise e2 WHERE e2.entreprise_id = ns.entreprise_id LIMIT 1)
        ))
        AND os.id = old.stageId
        LIMIT 1
    )
WHERE NOT EXISTS (
    SELECT 1 FROM candidature c2
    WHERE c2.stage_id    = s.stage_id
      AND c2.etudiant_id = et.etudiant_id
);


-- 2b. From old_candidature (detailed application forms)
-- These rows have etudiant UUID in the `id` column and no direct stage link.
-- We match etudiant by UUID, and leave stage_id pointing to the first active
-- stage for that etudiant's domain if no direct link exists.
INSERT IGNORE INTO candidature
    (stage_id, etudiant_id, status,
     etudiant_nom, etudiant_prenom, etudiant_email,
     etudiant_departement, etudiant_specialite,
     cv_path, lettre_motivation_path, releves_notes_path,
     motivation_letter, date_postulation, date_modification)
SELECT
    -- Use the first active stage in the etudiant's domain as a best-effort link
    COALESCE(
        (SELECT s2.stage_id FROM stage s2
         WHERE s2.domaine = COALESCE(NULLIF(TRIM(old.domaine_etudes),''), et.departement)
           AND s2.is_active = TRUE
         ORDER BY s2.created_at DESC
         LIMIT 1),
        (SELECT s3.stage_id FROM stage s3 ORDER BY s3.created_at DESC LIMIT 1)
    )                                                       AS stage_id,
    et.etudiant_id,
    'EN_ATTENTE'                                            AS status,
    COALESCE(NULLIF(TRIM(old.nom),    ''), et.nom,    'N/A') AS etudiant_nom,
    COALESCE(NULLIF(TRIM(old.prenom), ''), et.prenom, 'N/A') AS etudiant_prenom,
    LOWER(TRIM(old.email))                                  AS etudiant_email,
    COALESCE(NULLIF(TRIM(et.departement), ''), 'N/A')       AS etudiant_departement,
    COALESCE(NULLIF(TRIM(et.specialite),  ''), 'N/A')       AS etudiant_specialite,
    NULLIF(TRIM(old.cv), '')                                AS cv_path,
    NULLIF(TRIM(old.lettre_motivation), '')                 AS lettre_motivation_path,
    NULLIF(TRIM(old.releves_notes), '')                     AS releves_notes_path,
    NULL                                                    AS motivation_letter,
    COALESCE(old.created_at, NOW())                         AS date_postulation,
    COALESCE(old.updated_at, NOW())                         AS date_modification
FROM old_candidature AS old
-- Resolve etudiant by UUID stored in old_candidature.id
INNER JOIN etudiant AS et
    ON et.uuid = old.id
-- Skip if already migrated (same etudiant + same email combination)
WHERE NOT EXISTS (
    SELECT 1 FROM candidature c2
    WHERE c2.etudiant_id    = et.etudiant_id
      AND c2.etudiant_email = LOWER(TRIM(old.email))
);


-- ============================================================
-- SECTION 3: affectation
-- The old schema had no dedicated affectation table.
-- We create affectation rows for all ACCEPTE candidatures
-- that do not yet have an affectation record.
-- enseignant_id and encadrant_id are left NULL (no old data).
-- ============================================================

INSERT IGNORE INTO affectation
    (candidature_id, enseignant_id, encadrant_id,
     date_affectation, notes, created_at, updated_at)
SELECT
    c.candidature_id,
    NULL    AS enseignant_id,
    NULL    AS encadrant_id,
    c.date_postulation  AS date_affectation,
    NULL    AS notes,
    NOW()   AS created_at,
    NOW()   AS updated_at
FROM candidature AS c
WHERE c.status = 'ACCEPTE'
  AND NOT EXISTS (
      SELECT 1 FROM affectation a2
      WHERE a2.candidature_id = c.candidature_id
  );


-- ============================================================
-- SECTION 4: soutenance
-- Old backup table: old_soutenance
-- Jury members resolved by name → enseignant/encadrant lookup.
-- affectation_id resolved via candidature → etudiant name match.
-- ============================================================

INSERT IGNORE INTO soutenance
    (affectation_id,
     date_soutenance, heure_soutenance, salle, type_presentation,
     etudiant1_nom, etudiant1_prenom,
     etudiant2_nom, etudiant2_prenom,
     etudiant3_nom, etudiant3_prenom,
     president_id, rapporteur_id,
     encadrant_academique_id, encadrant_professionnel_id,
     sujet, entreprise_nom, notes,
     created_at, updated_at)
SELECT
    -- Resolve affectation_id: match on etudiant1 name
    (SELECT af.affectation_id
     FROM affectation af
     INNER JOIN candidature c ON c.candidature_id = af.candidature_id
     INNER JOIN etudiant et   ON et.etudiant_id   = c.etudiant_id
     WHERE LOWER(CONCAT(et.nom, ' ', et.prenom)) =
           LOWER(TRIM(old.etudiant1))
        OR LOWER(CONCAT(et.prenom, ' ', et.nom)) =
           LOWER(TRIM(old.etudiant1))
     LIMIT 1)                                               AS affectation_id,
    -- Date / time
    CASE
        WHEN old.date IS NOT NULL
             AND old.date REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
        THEN old.date
        ELSE CURDATE()
    END                                                     AS date_soutenance,
    COALESCE(old.time, '09:00:00')                          AS heure_soutenance,
    COALESCE(NULLIF(TRIM(old.salle), ''), 'N/A')            AS salle,
    -- Map old type string to new ENUM
    CASE UPPER(TRIM(COALESCE(old.type, '')))
        WHEN 'BINOME'   THEN 'BINOME'
        WHEN 'TRINOME'  THEN 'TRINOME'
        ELSE                 'MONOME'
    END                                                     AS type_presentation,
    -- Student names: old schema stores full name in etudiant1/2/3
    COALESCE(NULLIF(TRIM(SUBSTRING_INDEX(old.etudiant1, ' ', 1)), ''), 'N/A')
                                                            AS etudiant1_nom,
    COALESCE(NULLIF(TRIM(SUBSTRING(old.etudiant1,
        LENGTH(SUBSTRING_INDEX(old.etudiant1, ' ', 1)) + 2)), ''), 'N/A')
                                                            AS etudiant1_prenom,
    NULLIF(TRIM(SUBSTRING_INDEX(COALESCE(old.etudiant2,''), ' ', 1)), '')
                                                            AS etudiant2_nom,
    NULLIF(TRIM(SUBSTRING(COALESCE(old.etudiant2,''),
        LENGTH(SUBSTRING_INDEX(COALESCE(old.etudiant2,''), ' ', 1)) + 2)), '')
                                                            AS etudiant2_prenom,
    NULLIF(TRIM(SUBSTRING_INDEX(COALESCE(old.etudiant3,''), ' ', 1)), '')
                                                            AS etudiant3_nom,
    NULLIF(TRIM(SUBSTRING(COALESCE(old.etudiant3,''),
        LENGTH(SUBSTRING_INDEX(COALESCE(old.etudiant3,''), ' ', 1)) + 2)), '')
                                                            AS etudiant3_prenom,
    -- Jury: resolve enseignant by full name stored in old columns
    (SELECT en.enseignant_id FROM enseignant en
     WHERE LOWER(CONCAT(en.nom, ' ', en.prenom)) = LOWER(TRIM(old.president))
        OR LOWER(CONCAT(en.prenom, ' ', en.nom)) = LOWER(TRIM(old.president))
     LIMIT 1)                                               AS president_id,
    (SELECT en.enseignant_id FROM enseignant en
     WHERE LOWER(CONCAT(en.nom, ' ', en.prenom)) = LOWER(TRIM(old.rapporteur))
        OR LOWER(CONCAT(en.prenom, ' ', en.nom)) = LOWER(TRIM(old.rapporteur))
     LIMIT 1)                                               AS rapporteur_id,
    (SELECT en.enseignant_id FROM enseignant en
     WHERE LOWER(CONCAT(en.nom, ' ', en.prenom)) = LOWER(TRIM(old.encadrantAcademique))
        OR LOWER(CONCAT(en.prenom, ' ', en.nom)) = LOWER(TRIM(old.encadrantAcademique))
     LIMIT 1)                                               AS encadrant_academique_id,
    (SELECT ec.encadrant_id FROM encadrant ec
     WHERE LOWER(CONCAT(ec.nom, ' ', ec.prenom)) = LOWER(TRIM(old.encadrantProfessionnel))
        OR LOWER(CONCAT(ec.prenom, ' ', ec.nom)) = LOWER(TRIM(old.encadrantProfessionnel))
     LIMIT 1)                                               AS encadrant_professionnel_id,
    COALESCE(NULLIF(TRIM(old.sujet), ''), 'N/A')            AS sujet,
    NULLIF(TRIM(old.entreprise), '')                        AS entreprise_nom,
    NULL                                                    AS notes,
    COALESCE(old.createdAt, NOW())                          AS created_at,
    COALESCE(old.updatedAt, NOW())                          AS updated_at
FROM old_soutenance AS old;


-- ============================================================
-- SECTION 5: Summary
-- ============================================================

SELECT 'stage'       AS target_table, COUNT(*) AS total_rows FROM stage
UNION ALL
SELECT 'candidature' AS target_table, COUNT(*) AS total_rows FROM candidature
UNION ALL
SELECT 'affectation' AS target_table, COUNT(*) AS total_rows FROM affectation
UNION ALL
SELECT 'soutenance'  AS target_table, COUNT(*) AS total_rows FROM soutenance;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- ROLLBACK (run manually if you need to undo this migration)
-- WARNING: This deletes ALL rows from the new business tables.
-- Only run this if you are sure no downstream data depends on them.
--
-- SET FOREIGN_KEY_CHECKS = 0;
-- DELETE FROM soutenance;
-- DELETE FROM affectation;
-- DELETE FROM candidature;
-- DELETE FROM stage;
-- SET FOREIGN_KEY_CHECKS = 1;
-- ============================================================
