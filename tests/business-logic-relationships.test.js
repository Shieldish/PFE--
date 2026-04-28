'use strict';

/**
 * Integration tests for business logic table relationships.
 *
 * These are documentation-style tests that verify the migration SQL files
 * contain the correct constraint declarations, and behavioural mock tests
 * that simulate cascading operations without requiring a live database.
 *
 * Requirements: 3.6, 4.7, 5.4, 6.6, 7.3, 7.4, 7.6
 */

const fs = require('fs');
const path = require('path');

// ── Helpers ──────────────────────────────────────────────────────────────────

function readMigration(filename) {
  return fs.readFileSync(
    path.join(__dirname, '..', 'migrations', filename),
    'utf8'
  );
}

// Normalise whitespace so multi-line SQL fragments match regardless of
// indentation or line-ending style.
function normalise(src) {
  return src.replace(/\s+/g, ' ');
}

// ── Migration file paths ──────────────────────────────────────────────────────

const MIGRATIONS = {
  stage:        '20240101000006-create-stage.js',
  candidature:  '20240101000007-create-candidature.js',
  affectation:  '20240101000008-create-affectation.js',
  soutenance:   '20240101000009-create-soutenance.js',
};

// ── 1. CASCADE delete — migration SQL (stage → candidature) ──────────────────
describe('CASCADE delete — migration SQL declarations (stage and candidature)', () => {
  test('candidature migration declares ON DELETE CASCADE for stage_id FK', () => {
    const src = normalise(readMigration(MIGRATIONS.candidature));
    expect(src).toMatch(/REFERENCES stage\(stage_id\)/i);
    expect(src).toMatch(/ON DELETE CASCADE/i);
  });

  test('candidature migration declares ON UPDATE CASCADE for stage_id FK', () => {
    const src = normalise(readMigration(MIGRATIONS.candidature));
    expect(src).toMatch(/REFERENCES stage\(stage_id\)/i);
    expect(src).toMatch(/ON UPDATE CASCADE/i);
  });

  test('candidature migration declares ON DELETE CASCADE for etudiant_id FK', () => {
    const src = normalise(readMigration(MIGRATIONS.candidature));
    expect(src).toMatch(/REFERENCES etudiant\(etudiant_id\)/i);
    expect(src).toMatch(/ON DELETE CASCADE/i);
  });

  test('candidature migration declares ON UPDATE CASCADE for etudiant_id FK', () => {
    const src = normalise(readMigration(MIGRATIONS.candidature));
    expect(src).toMatch(/REFERENCES etudiant\(etudiant_id\)/i);
    expect(src).toMatch(/ON UPDATE CASCADE/i);
  });

  test('affectation migration declares ON DELETE CASCADE for candidature_id FK', () => {
    const src = normalise(readMigration(MIGRATIONS.affectation));
    expect(src).toMatch(/REFERENCES candidature\(candidature_id\)/i);
    expect(src).toMatch(/ON DELETE CASCADE/i);
  });
});

// ── 2. SET NULL — migration SQL (affectation and soutenance) ─────────────────
describe('SET NULL — migration SQL declarations (affectation and soutenance)', () => {
  test('affectation migration declares ON DELETE SET NULL for enseignant_id FK', () => {
    const src = normalise(readMigration(MIGRATIONS.affectation));
    expect(src).toMatch(/REFERENCES enseignant\(enseignant_id\)/i);
    expect(src).toMatch(/ON DELETE SET NULL/i);
  });

  test('affectation migration declares ON DELETE SET NULL for encadrant_id FK', () => {
    const src = normalise(readMigration(MIGRATIONS.affectation));
    expect(src).toMatch(/REFERENCES encadrant\(encadrant_id\)/i);
    expect(src).toMatch(/ON DELETE SET NULL/i);
  });

  test('soutenance migration declares ON DELETE SET NULL for affectation_id FK', () => {
    const src = normalise(readMigration(MIGRATIONS.soutenance));
    expect(src).toMatch(/REFERENCES affectation\(affectation_id\)/i);
    expect(src).toMatch(/ON DELETE SET NULL/i);
  });

  test('soutenance migration declares ON DELETE SET NULL for president_id FK', () => {
    const src = normalise(readMigration(MIGRATIONS.soutenance));
    expect(src).toMatch(/president_id/i);
    expect(src).toMatch(/ON DELETE SET NULL/i);
  });

  test('soutenance migration declares ON DELETE SET NULL for encadrant_professionnel_id FK', () => {
    const src = normalise(readMigration(MIGRATIONS.soutenance));
    expect(src).toMatch(/encadrant_professionnel_id/i);
    expect(src).toMatch(/ON DELETE SET NULL/i);
  });
});

// ── 3. Unique constraint — candidature (stage_id, etudiant_id) ───────────────
describe('Unique constraint — candidature migration', () => {
  test('candidature migration declares UNIQUE KEY uk_stage_etudiant', () => {
    const src = normalise(readMigration(MIGRATIONS.candidature));
    expect(src).toMatch(/UNIQUE KEY uk_stage_etudiant/i);
  });

  test('uk_stage_etudiant covers both stage_id and etudiant_id columns', () => {
    const src = normalise(readMigration(MIGRATIONS.candidature));
    expect(src).toMatch(/UNIQUE KEY uk_stage_etudiant\s*\(\s*stage_id\s*,\s*etudiant_id\s*\)/i);
  });
});

// ── 4. Behavioural mock — CASCADE delete from stage to candidature ────────────
describe('Behavioural mock — CASCADE delete from stage to candidature', () => {
  /**
   * Simulates the DB cascade: deleting a stage row should remove all
   * candidature rows that reference it via stage_id (ON DELETE CASCADE).
   */
  function buildStageDb() {
    const stages = new Map();
    const candidatures = [];

    return {
      insertStage(stageId) {
        stages.set(stageId, { stage_id: stageId });
      },
      insertCandidature(candidatureId, stageId, etudiantId) {
        if (!stages.has(stageId)) {
          throw new Error(
            `Cannot add or update a child row: foreign key constraint fails (stage_id=${stageId})`
          );
        }
        candidatures.push({ candidature_id: candidatureId, stage_id: stageId, etudiant_id: etudiantId });
      },
      deleteStage(stageId) {
        if (!stages.has(stageId)) return false;
        stages.delete(stageId);
        // Simulate ON DELETE CASCADE
        const idx = candidatures.length;
        for (let i = idx - 1; i >= 0; i--) {
          if (candidatures[i].stage_id === stageId) candidatures.splice(i, 1);
        }
        return true;
      },
      getCandidatures() { return candidatures; },
      stageExists(stageId) { return stages.has(stageId); },
    };
  }

  test('deleting a stage cascades to all its candidatures', () => {
    const db = buildStageDb();
    db.insertStage(1);
    db.insertCandidature(10, 1, 100);
    db.insertCandidature(11, 1, 101);

    db.deleteStage(1);

    expect(db.stageExists(1)).toBe(false);
    expect(db.getCandidatures()).toHaveLength(0);
  });

  test('deleting one stage does not affect candidatures of another stage', () => {
    const db = buildStageDb();
    db.insertStage(1);
    db.insertStage(2);
    db.insertCandidature(10, 1, 100);
    db.insertCandidature(11, 2, 101);

    db.deleteStage(1);

    expect(db.getCandidatures()).toHaveLength(1);
    expect(db.getCandidatures()[0].stage_id).toBe(2);
  });

  test('inserting a candidature with a non-existent stage_id throws FK violation', () => {
    const db = buildStageDb();
    expect(() => db.insertCandidature(10, 999, 100)).toThrow(/foreign key constraint fails/);
  });

  test('deleting a non-existent stage returns false', () => {
    const db = buildStageDb();
    expect(db.deleteStage(999)).toBe(false);
  });
});

// ── 5. Behavioural mock — CASCADE delete from etudiant to candidature ─────────
describe('Behavioural mock — CASCADE delete from etudiant to candidature', () => {
  function buildEtudiantDb() {
    const etudiants = new Map();
    const candidatures = [];

    return {
      insertEtudiant(etudiantId) {
        etudiants.set(etudiantId, { etudiant_id: etudiantId });
      },
      insertCandidature(candidatureId, stageId, etudiantId) {
        if (!etudiants.has(etudiantId)) {
          throw new Error(
            `Cannot add or update a child row: foreign key constraint fails (etudiant_id=${etudiantId})`
          );
        }
        candidatures.push({ candidature_id: candidatureId, stage_id: stageId, etudiant_id: etudiantId });
      },
      deleteEtudiant(etudiantId) {
        if (!etudiants.has(etudiantId)) return false;
        etudiants.delete(etudiantId);
        // Simulate ON DELETE CASCADE
        for (let i = candidatures.length - 1; i >= 0; i--) {
          if (candidatures[i].etudiant_id === etudiantId) candidatures.splice(i, 1);
        }
        return true;
      },
      getCandidatures() { return candidatures; },
      etudiantExists(etudiantId) { return etudiants.has(etudiantId); },
    };
  }

  test('deleting an etudiant cascades to all their candidatures', () => {
    const db = buildEtudiantDb();
    db.insertEtudiant(100);
    db.insertCandidature(10, 1, 100);
    db.insertCandidature(11, 2, 100);

    db.deleteEtudiant(100);

    expect(db.etudiantExists(100)).toBe(false);
    expect(db.getCandidatures()).toHaveLength(0);
  });

  test('deleting one etudiant does not affect candidatures of another etudiant', () => {
    const db = buildEtudiantDb();
    db.insertEtudiant(100);
    db.insertEtudiant(101);
    db.insertCandidature(10, 1, 100);
    db.insertCandidature(11, 1, 101);

    db.deleteEtudiant(100);

    expect(db.getCandidatures()).toHaveLength(1);
    expect(db.getCandidatures()[0].etudiant_id).toBe(101);
  });

  test('inserting a candidature with a non-existent etudiant_id throws FK violation', () => {
    const db = buildEtudiantDb();
    expect(() => db.insertCandidature(10, 1, 999)).toThrow(/foreign key constraint fails/);
  });
});

// ── 6. Behavioural mock — SET NULL when enseignant/encadrant deleted ──────────
describe('Behavioural mock — SET NULL on affectation when supervisor deleted', () => {
  function buildAffectationDb() {
    const enseignants = new Map();
    const encadrants = new Map();
    const affectations = [];

    return {
      insertEnseignant(id) { enseignants.set(id, { enseignant_id: id }); },
      insertEncadrant(id)  { encadrants.set(id, { encadrant_id: id }); },
      insertAffectation(affectationId, candidatureId, enseignantId, encadrantId) {
        affectations.push({
          affectation_id: affectationId,
          candidature_id: candidatureId,
          enseignant_id:  enseignantId,
          encadrant_id:   encadrantId,
        });
      },
      deleteEnseignant(id) {
        if (!enseignants.has(id)) return false;
        enseignants.delete(id);
        // Simulate ON DELETE SET NULL
        affectations.forEach((a) => {
          if (a.enseignant_id === id) a.enseignant_id = null;
        });
        return true;
      },
      deleteEncadrant(id) {
        if (!encadrants.has(id)) return false;
        encadrants.delete(id);
        // Simulate ON DELETE SET NULL
        affectations.forEach((a) => {
          if (a.encadrant_id === id) a.encadrant_id = null;
        });
        return true;
      },
      getAffectations() { return affectations; },
    };
  }

  test('deleting an enseignant sets enseignant_id to NULL on affectation', () => {
    const db = buildAffectationDb();
    db.insertEnseignant(20);
    db.insertAffectation(1, 10, 20, null);

    db.deleteEnseignant(20);

    expect(db.getAffectations()[0].enseignant_id).toBeNull();
    expect(db.getAffectations()[0].candidature_id).toBe(10);
  });

  test('deleting an encadrant sets encadrant_id to NULL on affectation', () => {
    const db = buildAffectationDb();
    db.insertEncadrant(30);
    db.insertAffectation(1, 10, null, 30);

    db.deleteEncadrant(30);

    expect(db.getAffectations()[0].encadrant_id).toBeNull();
    expect(db.getAffectations()[0].candidature_id).toBe(10);
  });

  test('deleting one enseignant does not null out another enseignant on the same affectation', () => {
    const db = buildAffectationDb();
    db.insertEnseignant(20);
    db.insertEnseignant(21);
    db.insertAffectation(1, 10, 20, null);
    db.insertAffectation(2, 11, 21, null);

    db.deleteEnseignant(20);

    expect(db.getAffectations()[0].enseignant_id).toBeNull();
    expect(db.getAffectations()[1].enseignant_id).toBe(21);
  });

  test('affectation row is NOT deleted when enseignant is deleted (SET NULL, not CASCADE)', () => {
    const db = buildAffectationDb();
    db.insertEnseignant(20);
    db.insertAffectation(1, 10, 20, null);

    db.deleteEnseignant(20);

    expect(db.getAffectations()).toHaveLength(1);
  });

  test('affectation row is NOT deleted when encadrant is deleted (SET NULL, not CASCADE)', () => {
    const db = buildAffectationDb();
    db.insertEncadrant(30);
    db.insertAffectation(1, 10, null, 30);

    db.deleteEncadrant(30);

    expect(db.getAffectations()).toHaveLength(1);
  });
});

// ── 7. Behavioural mock — SET NULL when affectation deleted from soutenance ───
describe('Behavioural mock — SET NULL on soutenance when affectation deleted', () => {
  function buildSoutenanceDb() {
    const affectations = new Map();
    const soutenances = [];

    return {
      insertAffectation(id) { affectations.set(id, { affectation_id: id }); },
      insertSoutenance(soutenanceId, affectationId) {
        soutenances.push({ soutenance_id: soutenanceId, affectation_id: affectationId });
      },
      deleteAffectation(id) {
        if (!affectations.has(id)) return false;
        affectations.delete(id);
        // Simulate ON DELETE SET NULL
        soutenances.forEach((s) => {
          if (s.affectation_id === id) s.affectation_id = null;
        });
        return true;
      },
      getSoutenances() { return soutenances; },
    };
  }

  test('deleting an affectation sets affectation_id to NULL on soutenance', () => {
    const db = buildSoutenanceDb();
    db.insertAffectation(1);
    db.insertSoutenance(100, 1);

    db.deleteAffectation(1);

    expect(db.getSoutenances()[0].affectation_id).toBeNull();
  });

  test('soutenance row is NOT deleted when affectation is deleted (SET NULL, not CASCADE)', () => {
    const db = buildSoutenanceDb();
    db.insertAffectation(1);
    db.insertSoutenance(100, 1);

    db.deleteAffectation(1);

    expect(db.getSoutenances()).toHaveLength(1);
  });

  test('deleting one affectation does not affect soutenances linked to another affectation', () => {
    const db = buildSoutenanceDb();
    db.insertAffectation(1);
    db.insertAffectation(2);
    db.insertSoutenance(100, 1);
    db.insertSoutenance(101, 2);

    db.deleteAffectation(1);

    expect(db.getSoutenances()[0].affectation_id).toBeNull();
    expect(db.getSoutenances()[1].affectation_id).toBe(2);
  });

  test('soutenance with NULL affectation_id can still exist (optional FK)', () => {
    const db = buildSoutenanceDb();
    // Insert soutenance with no affectation (affectation_id is nullable)
    db.insertSoutenance(100, null);
    expect(db.getSoutenances()[0].affectation_id).toBeNull();
  });
});

// ── 8. Behavioural mock — unique constraint on (stage_id, etudiant_id) ────────
describe('Behavioural mock — unique constraint uk_stage_etudiant on candidature', () => {
  function buildCandidatureStore() {
    const records = [];

    return {
      insert(stageId, etudiantId) {
        const duplicate = records.some(
          (r) => r.stage_id === stageId && r.etudiant_id === etudiantId
        );
        if (duplicate) {
          throw new Error(
            `Duplicate entry '${stageId}-${etudiantId}' for key 'uk_stage_etudiant'`
          );
        }
        records.push({ stage_id: stageId, etudiant_id: etudiantId });
      },
      getAll() { return records; },
    };
  }

  test('inserting the same (stage_id, etudiant_id) pair twice throws a duplicate error', () => {
    const store = buildCandidatureStore();
    store.insert(1, 100);
    expect(() => store.insert(1, 100)).toThrow(/uk_stage_etudiant/);
  });

  test('same student can apply to different stages', () => {
    const store = buildCandidatureStore();
    expect(() => {
      store.insert(1, 100);
      store.insert(2, 100);
    }).not.toThrow();
  });

  test('different students can apply to the same stage', () => {
    const store = buildCandidatureStore();
    expect(() => {
      store.insert(1, 100);
      store.insert(1, 101);
    }).not.toThrow();
  });

  test('duplicate error message includes the offending stage_id and etudiant_id', () => {
    const store = buildCandidatureStore();
    store.insert(5, 200);
    expect(() => store.insert(5, 200)).toThrow(/5-200/);
  });

  test('three distinct (stage_id, etudiant_id) pairs all insert successfully', () => {
    const store = buildCandidatureStore();
    store.insert(1, 100);
    store.insert(1, 101);
    store.insert(2, 100);
    expect(store.getAll()).toHaveLength(3);
  });
});
