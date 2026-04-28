-- Rollback: create-stage
-- Reverses migration 20240101000006-create-stage
--
-- Requirements: 3.4, 7.1, 7.3, 9.2, 9.3, 9.6
--
-- Note: candidature has a FK referencing stage(stage_id). If candidature
-- already exists, drop it first or ensure it is rolled back before this script.

DROP TABLE IF EXISTS stage;
