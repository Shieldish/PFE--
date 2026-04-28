-- Rollback: create-candidature
-- Reverses migration 20240101000007-create-candidature
--
-- Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 7.1, 7.3, 8.1, 8.3
--
-- Note: affectation has a FK referencing candidature(candidature_id). If
-- affectation already exists, drop it first or ensure it is rolled back
-- before running this script.

DROP TABLE IF EXISTS candidature;
