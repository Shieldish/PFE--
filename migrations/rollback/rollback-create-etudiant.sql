-- Rollback: create-etudiant
-- Drops the etudiant table.
-- Run ONLY after dependent tables (candidature, etc.) have been dropped first,
-- or if this migration is being rolled back before those tables were created.

DROP TABLE IF EXISTS etudiant;
