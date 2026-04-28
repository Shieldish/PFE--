-- Rollback: init-migration-infrastructure
-- Requirements: 10.5 (reversible migrations)
--
-- This migration only sets session variables, so there is nothing
-- to roll back at the schema level.
--
-- To remove the migration record from SequelizeMeta (forcing a re-run):
--   DELETE FROM SequelizeMeta
--   WHERE name = '20240101000000-init-migration-infrastructure.js';

SELECT 'Rollback for init-migration-infrastructure: no schema changes to revert.' AS message;
