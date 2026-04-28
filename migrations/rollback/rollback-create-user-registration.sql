-- Rollback: create-user-registration
-- Requirements: 1.1, 1.7, 9.1, 9.2
--
-- Drops the user_registration table.
-- WARNING: All child tables that reference user_registration via FK
-- (etudiant, enseignant, encadrant, entreprise) must be dropped first,
-- or their FK constraints must be removed before running this script.
--
-- To also remove the migration record from SequelizeMeta:
--   DELETE FROM SequelizeMeta
--   WHERE name = '20240101000001-create-user-registration.js';

DROP TABLE IF EXISTS user_registration;
