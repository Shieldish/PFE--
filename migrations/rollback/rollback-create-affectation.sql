-- Rollback: create-affectation
-- Reverses migration 20240101000008-create-affectation
--
-- Requirements: 5.1, 5.2, 5.3, 5.5, 7.1, 7.3, 7.4
--
-- Note: soutenance has a FK referencing affectation(affectation_id). If
-- soutenance already exists, drop it first or ensure it is rolled back
-- before running this script.

DROP TABLE IF EXISTS affectation;
