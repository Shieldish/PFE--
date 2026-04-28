-- Rollback: create-enseignant
-- Drops the enseignant table.
-- Run ONLY after dependent tables (affectation, soutenance, etc.) have been dropped first,
-- or if this migration is being rolled back before those tables were created.

DROP TABLE IF EXISTS enseignant;
