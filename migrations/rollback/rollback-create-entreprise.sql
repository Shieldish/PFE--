-- Rollback: create-entreprise
-- Reverses migration 20240101000005-create-entreprise
--
-- Requirements: 3.1, 3.2, 7.1, 7.3, 9.2
--
-- Steps:
--   1. Drop the FK constraint on encadrant.entreprise_id (added by this migration)
--   2. Drop the entreprise table

-- Step 1: Remove the deferred FK from encadrant → entreprise
ALTER TABLE encadrant
  DROP FOREIGN KEY fk_encadrant_entreprise;

-- Step 2: Drop the entreprise table
DROP TABLE IF EXISTS entreprise;
