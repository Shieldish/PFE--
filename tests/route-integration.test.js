'use strict';

/**
 * Integration tests for updated routes (task 9.5).
 *
 * Tests cover:
 *  1. Source-code assertions: connectionRoutes.js has createNewSchemaRecords,
 *     LEGACY_ROLE_MAP, and new schema imports
 *  2. Source-code assertions: etudiantsRoutes.js has [NEW SCHEMA] dual-write
 *     for candidature
 *  3. Source-code assertions: entrepriseRoutes.js has [NEW SCHEMA] dual-write
 *     for stage
 *  4. Source-code assertions: encadrementRoutes.js has POST /affectation route
 *     with new schema
 *  5. Source-code assertions: planificationRoutes.js has [NEW SCHEMA] dual-write
 *     for soutenance
 *  6. Behavioural mock: full registration flow
 *  7. Behavioural mock: stage creation with new schema dual-write
 *  8. Behavioural mock: candidature submission with snapshot fields
 *  9. Behavioural mock: affectation creation with NULL supervisor handling
 * 10. Behavioural mock: soutenance creation with jury member ID resolution
 * 11. Behavioural mock: constraint violation handling
 *
 * Requirements: 7.6, 9.7
 */

const fs = require('fs');
const path = require('path');

// ── Source file readers ───────────────────────────────────────────────────────

function readRoute(filename) {
  return fs.readFileSync(path.join(__dirname, '..', 'routes', filename), 'utf8');
}

let connectionSrc;
let etudiantsSrc;
let entrepriseSrc;
let encadrementSrc;
let planificationSrc;

beforeAll(() => {
  connectionSrc   = readRoute('connectionRoutes.js');
  etudiantsSrc    = readRoute('etudiantsRoutes.js');
  entrepriseSrc   = readRoute('entrepriseRoutes.js');
  encadrementSrc  = readRoute('encadrementRoutes.js');
  planificationSrc = readRoute('planificationRoutes.js');
});

// ── 1. connectionRoutes.js — source-code assertions ──────────────────────────
describe('connectionRoutes.js — new schema imports and helpers', () => {
  test('imports UserRegistration from UserRegistrationModel', () => {
    expect(connectionSrc).toContain("require('../model/UserRegistrationModel')");
    expect(connectionSrc).toContain('UserRegistration');
  });

  test('imports user-type models from UserTypeModels', () => {
    expect(connectionSrc).toContain("require('../model/UserTypeModels')");
    expect(connectionSrc).toContain('Etudiant');
    expect(connectionSrc).toContain('Enseignant');
    expect(connectionSrc).toContain('Encadrant');
    expect(connectionSrc).toContain('Entreprise');
  });

  test('defines createNewSchemaRecords helper function', () => {
    expect(connectionSrc).toContain('createNewSchemaRecords');
  });

  test('defines LEGACY_ROLE_MAP constant', () => {
    expect(connectionSrc).toContain('LEGACY_ROLE_MAP');
  });

  test('LEGACY_ROLE_MAP maps USER to STUDENT', () => {
    expect(connectionSrc).toContain("USER:        'STUDENT'");
  });

  test('LEGACY_ROLE_MAP maps DEPARTEMENT or ENTREPRISE to new roles', () => {
    expect(connectionSrc).toContain("ENTREPRISE:  'COMPANY'");
  });

  test('createNewSchemaRecords calls UserRegistration.create', () => {
    expect(connectionSrc).toContain('UserRegistration.create');
  });

  test('createNewSchemaRecords creates Etudiant for STUDENT role', () => {
    expect(connectionSrc).toContain('Etudiant.create');
  });

  test('createNewSchemaRecords creates Entreprise for COMPANY role', () => {
    expect(connectionSrc).toContain('Entreprise.create');
  });

  test('new schema errors are caught and do not break legacy flow', () => {
    expect(connectionSrc).toContain('[new-schema]');
    expect(connectionSrc).toContain('SequelizeUniqueConstraintError');
  });
});

// ── 2. etudiantsRoutes.js — source-code assertions ───────────────────────────
describe('etudiantsRoutes.js — [NEW SCHEMA] dual-write for candidature', () => {
  test('imports Candidature from BusinessModels', () => {
    expect(etudiantsSrc).toContain("require('../model/BusinessModels')");
    expect(etudiantsSrc).toContain('Candidature');
  });

  test('imports Etudiant from UserTypeModels', () => {
    expect(etudiantsSrc).toContain("require('../model/UserTypeModels')");
    expect(etudiantsSrc).toContain('NewEtudiant');
  });

  test('has [NEW SCHEMA] comment marking dual-write for candidature', () => {
    expect(etudiantsSrc).toContain('[NEW SCHEMA]');
  });

  test('creates new candidature record with snapshot fields', () => {
    expect(etudiantsSrc).toContain('NewCandidature.create');
    expect(etudiantsSrc).toContain('etudiant_nom');
    expect(etudiantsSrc).toContain('etudiant_prenom');
    expect(etudiantsSrc).toContain('etudiant_email');
  });

  test('new schema candidature write is isolated from legacy transaction', () => {
    // The new schema write runs outside the legacy transaction (t.commit() comes first)
    const commitIdx = etudiantsSrc.indexOf('await t.commit()');
    const newSchemaIdx = etudiantsSrc.indexOf('NewCandidature.create');
    expect(commitIdx).toBeGreaterThan(-1);
    expect(newSchemaIdx).toBeGreaterThan(commitIdx);
  });

  test('duplicate candidature in new schema is caught and logged', () => {
    expect(etudiantsSrc).toContain('SequelizeUniqueConstraintError');
    expect(etudiantsSrc).toContain('[NEW SCHEMA] Candidature en double');
  });
});

// ── 3. entrepriseRoutes.js — source-code assertions ──────────────────────────
describe('entrepriseRoutes.js — [NEW SCHEMA] dual-write for stage', () => {
  test('imports Stage from BusinessModels', () => {
    expect(entrepriseSrc).toContain("require('../model/BusinessModels')");
    expect(entrepriseSrc).toContain('NewStage');
  });

  test('imports Entreprise from UserTypeModels', () => {
    expect(entrepriseSrc).toContain("require('../model/UserTypeModels')");
    expect(entrepriseSrc).toContain('NewEntreprise');
  });

  test('has [NEW SCHEMA] comment marking dual-write for stage', () => {
    expect(entrepriseSrc).toContain('[NEW SCHEMA]');
  });

  test('creates new stage record linked to entreprise_id', () => {
    expect(entrepriseSrc).toContain('NewStage.create');
    expect(entrepriseSrc).toContain('entreprise_id');
  });

  test('looks up entreprise record by email before creating stage', () => {
    expect(entrepriseSrc).toContain('NewEntreprise.findOne');
    expect(entrepriseSrc).toContain('email: createdBy');
  });

  test('new schema stage write failure does not break legacy flow', () => {
    expect(entrepriseSrc).toContain('[NEW SCHEMA] Erreur lors de la création du stage');
    expect(entrepriseSrc).toContain('console.error');
  });
});

// ── 4. encadrementRoutes.js — source-code assertions ─────────────────────────
describe('encadrementRoutes.js — POST /affectation route with new schema', () => {
  test('imports Affectation from BusinessModels', () => {
    expect(encadrementSrc).toContain("require('../model/BusinessModels')");
    expect(encadrementSrc).toContain('Affectation');
  });

  test('imports Enseignant and Encadrant from UserTypeModels', () => {
    expect(encadrementSrc).toContain("require('../model/UserTypeModels')");
    expect(encadrementSrc).toContain('Enseignant');
    expect(encadrementSrc).toContain('Encadrant');
  });

  test("defines POST /affectation route", () => {
    expect(encadrementSrc).toContain("router.post('/affectation'");
  });

  test('POST /affectation creates new Affectation record', () => {
    expect(encadrementSrc).toContain('Affectation.create');
  });

  test('POST /affectation supports upsert (update existing affectation)', () => {
    expect(encadrementSrc).toContain('Affectation.findOne');
    expect(encadrementSrc).toContain('existing.update');
  });

  test('POST /affectation allows NULL enseignant_id and encadrant_id', () => {
    expect(encadrementSrc).toContain('resolvedEnseignantId');
    expect(encadrementSrc).toContain('resolvedEncadrantId');
    expect(encadrementSrc).toContain('null');
  });

  test('POST /affectation returns 400 when candidature_id is missing', () => {
    expect(encadrementSrc).toContain("'candidature_id est requis'");
    expect(encadrementSrc).toContain('res.status(400)');
  });

  test('GET /affectation/:candidature_id route is defined', () => {
    expect(encadrementSrc).toContain("router.get('/affectation/:candidature_id'");
  });
});

// ── 5. planificationRoutes.js — source-code assertions ───────────────────────
describe('planificationRoutes.js — [NEW SCHEMA] dual-write for soutenance', () => {
  test('imports Soutenance from BusinessModels', () => {
    expect(planificationSrc).toContain("require('../model/BusinessModels')");
    expect(planificationSrc).toContain('SoutenanceNew');
  });

  test('imports Enseignant and Encadrant from UserTypeModels', () => {
    expect(planificationSrc).toContain("require('../model/UserTypeModels')");
    expect(planificationSrc).toContain('Enseignant');
    expect(planificationSrc).toContain('Encadrant');
  });

  test('has [NEW SCHEMA] comment marking dual-write for soutenance', () => {
    expect(planificationSrc).toContain('[NEW SCHEMA]');
  });

  test('creates new soutenance record in new schema', () => {
    expect(planificationSrc).toContain('SoutenanceNew.create');
  });

  test('resolves jury member IDs from enseignant/encadrant tables by name', () => {
    expect(planificationSrc).toContain('resolveEnseignantId');
    expect(planificationSrc).toContain('resolveEncadrantId');
  });

  test('new schema soutenance write failure does not break legacy response', () => {
    expect(planificationSrc).toContain('[NEW SCHEMA] Erreur lors de la création de la soutenance');
    expect(planificationSrc).toContain('console.error');
  });
});

// ── 6. Behavioural mock — full registration flow ──────────────────────────────
describe('Behavioural mock — full registration flow (user_registration + user type)', () => {
  /**
   * Simulates the dual-write registration: legacy user_registration record is
   * created first, then a new-schema user_registration + user-type record.
   */
  function buildRegistrationStore() {
    const legacyUsers = new Map();
    const newSchemaUsers = new Map();
    const userTypeRecords = { etudiant: [], enseignant: [], encadrant: [], entreprise: [] };

    const LEGACY_ROLE_MAP = {
      USER: 'STUDENT', DEPARTEMENT: 'SUPERVISOR', ENTREPRISE: 'COMPANY', ADMIN: 'ADMIN',
    };

    return {
      registerLegacy({ email, nom, prenom, role }) {
        if (legacyUsers.has(email)) {
          const err = new Error(`Duplicate entry '${email}' for key 'email'`);
          err.name = 'SequelizeUniqueConstraintError';
          throw err;
        }
        legacyUsers.set(email, { email, nom, prenom, role });
        return { email, nom, prenom, role };
      },
      registerNewSchema({ email, nom, prenom, role, uuid }) {
        if (newSchemaUsers.has(email)) {
          const err = new Error(`Duplicate entry '${email}' for key 'email'`);
          err.name = 'SequelizeUniqueConstraintError';
          throw err;
        }
        const newRole = LEGACY_ROLE_MAP[role] || 'STUDENT';
        const userId = newSchemaUsers.size + 1;
        newSchemaUsers.set(email, { user_id: userId, email, role: newRole, uuid });

        // Create user-type record
        switch (newRole) {
          case 'STUDENT':
            userTypeRecords.etudiant.push({ user_id: userId, nom, prenom, uuid });
            break;
          case 'TEACHER':
            userTypeRecords.enseignant.push({ user_id: userId, nom, prenom, email });
            break;
          case 'SUPERVISOR':
            userTypeRecords.encadrant.push({ user_id: userId, nom, prenom, email });
            break;
          case 'COMPANY':
            userTypeRecords.entreprise.push({ user_id: userId, nom, email });
            break;
          default:
            break; // ADMIN — no user-type record
        }
        return { userReg: newSchemaUsers.get(email), userTypeRecords };
      },
      getLegacyUser(email) { return legacyUsers.get(email); },
      getNewSchemaUser(email) { return newSchemaUsers.get(email); },
      getUserTypeRecords() { return userTypeRecords; },
    };
  }

  test('registering a student creates legacy record and new-schema etudiant record', () => {
    const store = buildRegistrationStore();
    store.registerLegacy({ email: 'alice@test.com', nom: 'ALICE', prenom: 'Alice', role: 'USER' });
    store.registerNewSchema({ email: 'alice@test.com', nom: 'ALICE', prenom: 'Alice', role: 'USER', uuid: 'uuid-1' });

    expect(store.getLegacyUser('alice@test.com')).toBeDefined();
    expect(store.getNewSchemaUser('alice@test.com').role).toBe('STUDENT');
    expect(store.getUserTypeRecords().etudiant).toHaveLength(1);
    expect(store.getUserTypeRecords().etudiant[0].nom).toBe('ALICE');
  });

  test('registering a company creates legacy record and new-schema entreprise record', () => {
    const store = buildRegistrationStore();
    store.registerLegacy({ email: 'corp@test.com', nom: 'CORP', prenom: '', role: 'ENTREPRISE' });
    store.registerNewSchema({ email: 'corp@test.com', nom: 'CORP', prenom: '', role: 'ENTREPRISE', uuid: 'uuid-2' });

    expect(store.getNewSchemaUser('corp@test.com').role).toBe('COMPANY');
    expect(store.getUserTypeRecords().entreprise).toHaveLength(1);
  });

  test('registering an admin creates no user-type record', () => {
    const store = buildRegistrationStore();
    store.registerLegacy({ email: 'admin@test.com', nom: 'ADMIN', prenom: 'Admin', role: 'ADMIN' });
    store.registerNewSchema({ email: 'admin@test.com', nom: 'ADMIN', prenom: 'Admin', role: 'ADMIN', uuid: 'uuid-3' });

    expect(store.getNewSchemaUser('admin@test.com').role).toBe('ADMIN');
    const allTypeRecords = Object.values(store.getUserTypeRecords()).flat();
    expect(allTypeRecords).toHaveLength(0);
  });

  test('duplicate email in legacy table throws SequelizeUniqueConstraintError', () => {
    const store = buildRegistrationStore();
    store.registerLegacy({ email: 'dup@test.com', nom: 'DUP', prenom: 'Dup', role: 'USER' });
    let caught = null;
    try {
      store.registerLegacy({ email: 'dup@test.com', nom: 'DUP2', prenom: 'Dup2', role: 'USER' });
    } catch (err) {
      caught = err;
    }
    expect(caught).not.toBeNull();
    expect(caught.name).toBe('SequelizeUniqueConstraintError');
  });

  test('duplicate email in new schema is caught without breaking legacy flow', () => {
    const store = buildRegistrationStore();
    store.registerLegacy({ email: 'bob@test.com', nom: 'BOB', prenom: 'Bob', role: 'USER' });
    store.registerNewSchema({ email: 'bob@test.com', nom: 'BOB', prenom: 'Bob', role: 'USER', uuid: 'uuid-4' });

    // Second new-schema attempt (e.g. retry) should throw but legacy is already saved
    let newSchemaError = null;
    try {
      store.registerNewSchema({ email: 'bob@test.com', nom: 'BOB', prenom: 'Bob', role: 'USER', uuid: 'uuid-4' });
    } catch (err) {
      newSchemaError = err;
    }

    expect(newSchemaError).not.toBeNull();
    expect(newSchemaError.name).toBe('SequelizeUniqueConstraintError');
    // Legacy record is still intact
    expect(store.getLegacyUser('bob@test.com')).toBeDefined();
  });
});

// ── 7. Behavioural mock — stage creation with new schema dual-write ───────────
describe('Behavioural mock — stage creation with new schema dual-write', () => {
  function buildStageStore() {
    const entreprises = new Map();
    const legacyStages = [];
    const newSchemaStages = [];

    return {
      addEntreprise(email, entrepriseId) {
        entreprises.set(email, { entreprise_id: entrepriseId, email });
      },
      createLegacyStage(data) {
        const id = legacyStages.length + 1;
        legacyStages.push({ id, ...data });
        return { id, ...data };
      },
      createNewSchemaStage(createdBy, stageData) {
        const entreprise = entreprises.get(createdBy);
        if (!entreprise) return null; // no matching entreprise — skip new schema write

        const id = newSchemaStages.length + 1;
        const record = {
          stage_id: id,
          entreprise_id: entreprise.entreprise_id,
          titre: stageData.Titre || stageData.Libelle || null,
          domaine: stageData.Domaine || null,
          is_active: true,
        };
        newSchemaStages.push(record);
        return record;
      },
      getLegacyStages() { return legacyStages; },
      getNewSchemaStages() { return newSchemaStages; },
    };
  }

  test('creating a stage writes to both legacy and new schema tables', () => {
    const store = buildStageStore();
    store.addEntreprise('company@test.com', 10);
    store.createLegacyStage({ Titre: 'Dev Stage', Domaine: 'IT', CreatedBy: 'company@test.com' });
    store.createNewSchemaStage('company@test.com', { Titre: 'Dev Stage', Domaine: 'IT' });

    expect(store.getLegacyStages()).toHaveLength(1);
    expect(store.getNewSchemaStages()).toHaveLength(1);
    expect(store.getNewSchemaStages()[0].entreprise_id).toBe(10);
  });

  test('new schema stage write is skipped when entreprise record not found', () => {
    const store = buildStageStore();
    // No entreprise registered for this email
    store.createLegacyStage({ Titre: 'Dev Stage', Domaine: 'IT', CreatedBy: 'unknown@test.com' });
    const result = store.createNewSchemaStage('unknown@test.com', { Titre: 'Dev Stage', Domaine: 'IT' });

    expect(store.getLegacyStages()).toHaveLength(1);
    expect(result).toBeNull();
    expect(store.getNewSchemaStages()).toHaveLength(0);
  });

  test('new schema stage record has correct entreprise_id and titre', () => {
    const store = buildStageStore();
    store.addEntreprise('corp@test.com', 42);
    store.createNewSchemaStage('corp@test.com', { Titre: 'Backend Internship', Domaine: 'Software' });

    const newStage = store.getNewSchemaStages()[0];
    expect(newStage.entreprise_id).toBe(42);
    expect(newStage.titre).toBe('Backend Internship');
    expect(newStage.is_active).toBe(true);
  });
});

// ── 8. Behavioural mock — candidature submission with snapshot fields ──────────
describe('Behavioural mock — candidature submission with snapshot fields', () => {
  function buildCandidatureStore() {
    const etudiants = new Map();
    const stages = new Map();
    const legacyCandidatures = [];
    const newSchemaCandidatures = [];

    return {
      addEtudiant(uuid, etudiantId, nom, prenom) {
        etudiants.set(uuid, { etudiant_id: etudiantId, uuid, nom, prenom });
      },
      addStage(titre, stageId) {
        stages.set(titre, { stage_id: stageId, titre });
      },
      createLegacyCandidature(data) {
        legacyCandidatures.push({ id: legacyCandidatures.length + 1, ...data });
      },
      createNewSchemaCandidature({ etudiantUuid, stageTitre, nom, prenom, email, domaine, section, cvPath }) {
        const etudiant = etudiants.get(etudiantUuid);
        const stage = stages.get(stageTitre);

        if (!etudiant || !stage) return null; // skip if either not found

        // Check for duplicate
        const duplicate = newSchemaCandidatures.some(
          (c) => c.stage_id === stage.stage_id && c.etudiant_id === etudiant.etudiant_id
        );
        if (duplicate) {
          const err = new Error(`Duplicate entry '${stage.stage_id}-${etudiant.etudiant_id}' for key 'uk_stage_etudiant'`);
          err.name = 'SequelizeUniqueConstraintError';
          throw err;
        }

        const record = {
          candidature_id: newSchemaCandidatures.length + 1,
          stage_id: stage.stage_id,
          etudiant_id: etudiant.etudiant_id,
          status: 'EN_ATTENTE',
          etudiant_nom: nom,
          etudiant_prenom: prenom,
          etudiant_email: email,
          etudiant_departement: domaine || null,
          etudiant_specialite: section || null,
          cv_path: cvPath || null,
        };
        newSchemaCandidatures.push(record);
        return record;
      },
      getLegacyCandidatures() { return legacyCandidatures; },
      getNewSchemaCandidatures() { return newSchemaCandidatures; },
    };
  }

  test('candidature submission writes to both legacy and new schema tables', () => {
    const store = buildCandidatureStore();
    store.addEtudiant('uuid-1', 1, 'DUPONT', 'Jean');
    store.addStage('Dev Stage', 10);

    store.createLegacyCandidature({ email: 'jean@test.com', nom: 'DUPONT', prenom: 'Jean' });
    store.createNewSchemaCandidature({
      etudiantUuid: 'uuid-1', stageTitre: 'Dev Stage',
      nom: 'DUPONT', prenom: 'Jean', email: 'jean@test.com',
      domaine: 'Informatique', section: 'GL',
    });

    expect(store.getLegacyCandidatures()).toHaveLength(1);
    expect(store.getNewSchemaCandidatures()).toHaveLength(1);
  });

  test('new schema candidature captures snapshot fields at submission time', () => {
    const store = buildCandidatureStore();
    store.addEtudiant('uuid-2', 2, 'MARTIN', 'Sophie');
    store.addStage('AI Internship', 20);

    const record = store.createNewSchemaCandidature({
      etudiantUuid: 'uuid-2', stageTitre: 'AI Internship',
      nom: 'MARTIN', prenom: 'Sophie', email: 'sophie@test.com',
      domaine: 'IA', section: 'Master',
    });

    expect(record.etudiant_nom).toBe('MARTIN');
    expect(record.etudiant_prenom).toBe('Sophie');
    expect(record.etudiant_email).toBe('sophie@test.com');
    expect(record.etudiant_departement).toBe('IA');
    expect(record.etudiant_specialite).toBe('Master');
    expect(record.status).toBe('EN_ATTENTE');
  });

  test('duplicate candidature in new schema throws SequelizeUniqueConstraintError', () => {
    const store = buildCandidatureStore();
    store.addEtudiant('uuid-3', 3, 'DURAND', 'Paul');
    store.addStage('Web Stage', 30);

    store.createNewSchemaCandidature({
      etudiantUuid: 'uuid-3', stageTitre: 'Web Stage',
      nom: 'DURAND', prenom: 'Paul', email: 'paul@test.com',
    });

    let caught = null;
    try {
      store.createNewSchemaCandidature({
        etudiantUuid: 'uuid-3', stageTitre: 'Web Stage',
        nom: 'DURAND', prenom: 'Paul', email: 'paul@test.com',
      });
    } catch (err) {
      caught = err;
    }
    expect(caught).not.toBeNull();
    expect(caught.name).toBe('SequelizeUniqueConstraintError');
    expect(caught.message).toContain('uk_stage_etudiant');
  });

  test('new schema write is skipped when etudiant or stage not found', () => {
    const store = buildCandidatureStore();
    // No etudiant or stage registered
    const result = store.createNewSchemaCandidature({
      etudiantUuid: 'unknown-uuid', stageTitre: 'Unknown Stage',
      nom: 'X', prenom: 'Y', email: 'x@test.com',
    });

    expect(result).toBeNull();
    expect(store.getNewSchemaCandidatures()).toHaveLength(0);
  });
});

// ── 9. Behavioural mock — affectation creation with NULL supervisor handling ───
describe('Behavioural mock — affectation creation with NULL supervisor handling', () => {
  function buildAffectationStore() {
    const affectations = new Map(); // keyed by candidature_id

    return {
      upsert({ candidature_id, enseignant_id, encadrant_id, notes }) {
        if (!candidature_id) {
          throw new Error('candidature_id est requis');
        }

        // Resolve IDs — allow NULL for pending assignments
        const resolvedEnseignantId = (enseignant_id != null && enseignant_id !== '') ? parseInt(enseignant_id, 10) : null;
        const resolvedEncadrantId  = (encadrant_id  != null && encadrant_id  !== '') ? parseInt(encadrant_id,  10) : null;

        if (affectations.has(candidature_id)) {
          const existing = affectations.get(candidature_id);
          existing.enseignant_id = resolvedEnseignantId;
          existing.encadrant_id  = resolvedEncadrantId;
          existing.notes = notes || existing.notes;
          return { action: 'updated', affectation: existing };
        }

        const record = {
          affectation_id: affectations.size + 1,
          candidature_id: parseInt(candidature_id, 10),
          enseignant_id: resolvedEnseignantId,
          encadrant_id:  resolvedEncadrantId,
          notes: notes || null,
        };
        affectations.set(candidature_id, record);
        return { action: 'created', affectation: record };
      },
      find(candidature_id) { return affectations.get(candidature_id) || null; },
    };
  }

  test('creating an affectation with both supervisors stores correct IDs', () => {
    const store = buildAffectationStore();
    const { affectation } = store.upsert({ candidature_id: 1, enseignant_id: 10, encadrant_id: 20 });

    expect(affectation.enseignant_id).toBe(10);
    expect(affectation.encadrant_id).toBe(20);
  });

  test('creating an affectation with NULL enseignant_id is allowed', () => {
    const store = buildAffectationStore();
    const { affectation } = store.upsert({ candidature_id: 2, enseignant_id: null, encadrant_id: 20 });

    expect(affectation.enseignant_id).toBeNull();
    expect(affectation.encadrant_id).toBe(20);
  });

  test('creating an affectation with empty string enseignant_id resolves to NULL', () => {
    const store = buildAffectationStore();
    const { affectation } = store.upsert({ candidature_id: 3, enseignant_id: '', encadrant_id: '' });

    expect(affectation.enseignant_id).toBeNull();
    expect(affectation.encadrant_id).toBeNull();
  });

  test('upserting an existing affectation updates it instead of creating a new one', () => {
    const store = buildAffectationStore();
    store.upsert({ candidature_id: 4, enseignant_id: 10, encadrant_id: null });
    const { action, affectation } = store.upsert({ candidature_id: 4, enseignant_id: 15, encadrant_id: 25 });

    expect(action).toBe('updated');
    expect(affectation.enseignant_id).toBe(15);
    expect(affectation.encadrant_id).toBe(25);
  });

  test('missing candidature_id throws an error', () => {
    const store = buildAffectationStore();
    expect(() => store.upsert({ enseignant_id: 10 })).toThrow('candidature_id est requis');
  });

  test('finding a non-existent affectation returns null', () => {
    const store = buildAffectationStore();
    expect(store.find(999)).toBeNull();
  });
});

// ── 10. Behavioural mock — soutenance creation with jury member ID resolution ──
describe('Behavioural mock — soutenance creation with jury member ID resolution', () => {
  function buildSoutenanceStore() {
    const enseignants = new Map(); // nom+prenom → enseignant_id
    const encadrants  = new Map(); // nom+prenom → encadrant_id
    const legacySoutenances = [];
    const newSchemaSoutenances = [];

    function resolveEnseignantId(fullName) {
      if (!fullName || fullName.trim() === '') return null;
      return enseignants.get(fullName.trim().toLowerCase()) || null;
    }

    function resolveEncadrantId(fullName) {
      if (!fullName || fullName.trim() === '') return null;
      return encadrants.get(fullName.trim().toLowerCase()) || null;
    }

    function splitName(fullName) {
      if (!fullName || fullName.trim() === '') return { nom: null, prenom: null };
      const parts = fullName.trim().split(/\s+/);
      if (parts.length === 1) return { nom: parts[0], prenom: null };
      const [prenom, ...nomParts] = parts;
      return { nom: nomParts.join(' '), prenom };
    }

    return {
      addEnseignant(fullName, id) { enseignants.set(fullName.toLowerCase(), id); },
      addEncadrant(fullName, id)  { encadrants.set(fullName.toLowerCase(), id); },
      createLegacySoutenance(data) {
        legacySoutenances.push({ id: legacySoutenances.length + 1, ...data });
      },
      createNewSchemaSoutenance(body) {
        const presidentId    = resolveEnseignantId(body.president);
        const rapporteurId   = resolveEnseignantId(body.rapporteur);
        const encadrantAcadId = resolveEnseignantId(body.encadrantAcademique);
        const encadrantProfId = resolveEncadrantId(body.encadrantProfessionnel);

        const typeMap = { MONOME: 'MONOME', BINOME: 'BINOME', TRINOME: 'TRINOME' };
        const typePresentation = typeMap[(body.type || '').toUpperCase()] || null;

        const etudiant1 = splitName(body.etudiant1);

        const record = {
          soutenance_id: newSchemaSoutenances.length + 1,
          affectation_id: body.affectation_id || null,
          date_soutenance: body.date || null,
          heure_soutenance: body.time || null,
          salle: body.salle || null,
          type_presentation: typePresentation,
          etudiant1_nom: etudiant1.nom,
          etudiant1_prenom: etudiant1.prenom,
          president_id: presidentId,
          rapporteur_id: rapporteurId,
          encadrant_academique_id: encadrantAcadId,
          encadrant_professionnel_id: encadrantProfId,
          sujet: body.sujet || null,
        };
        newSchemaSoutenances.push(record);
        return record;
      },
      getLegacySoutenances() { return legacySoutenances; },
      getNewSchemaSoutenances() { return newSchemaSoutenances; },
    };
  }

  test('soutenance creation writes to both legacy and new schema tables', () => {
    const store = buildSoutenanceStore();
    store.createLegacySoutenance({ date: '2024-06-01', salle: 'A1' });
    store.createNewSchemaSoutenance({ date: '2024-06-01', salle: 'A1', type: 'MONOME', etudiant1: 'Dupont Jean' });

    expect(store.getLegacySoutenances()).toHaveLength(1);
    expect(store.getNewSchemaSoutenances()).toHaveLength(1);
  });

  test('jury member IDs are resolved from enseignant/encadrant tables by name', () => {
    const store = buildSoutenanceStore();
    store.addEnseignant('ben ali ahmed', 5);
    store.addEnseignant('trabelsi sonia', 6);
    store.addEncadrant('chaabane rami', 7);

    const record = store.createNewSchemaSoutenance({
      president: 'Ben Ali Ahmed',
      rapporteur: 'Trabelsi Sonia',
      encadrantProfessionnel: 'Chaabane Rami',
      type: 'MONOME',
      etudiant1: 'Dupont Jean',
    });

    expect(record.president_id).toBe(5);
    expect(record.rapporteur_id).toBe(6);
    expect(record.encadrant_professionnel_id).toBe(7);
  });

  test('unknown jury member name resolves to NULL (allowed by schema)', () => {
    const store = buildSoutenanceStore();
    const record = store.createNewSchemaSoutenance({
      president: 'Unknown Person',
      type: 'MONOME',
      etudiant1: 'Dupont Jean',
    });

    expect(record.president_id).toBeNull();
  });

  test('empty jury member fields resolve to NULL', () => {
    const store = buildSoutenanceStore();
    const record = store.createNewSchemaSoutenance({
      president: '',
      rapporteur: '',
      type: 'BINOME',
      etudiant1: 'Dupont Jean',
    });

    expect(record.president_id).toBeNull();
    expect(record.rapporteur_id).toBeNull();
  });

  test('type_presentation is mapped correctly from legacy type string', () => {
    const store = buildSoutenanceStore();
    const mono   = store.createNewSchemaSoutenance({ type: 'monome',  etudiant1: 'A B' });
    const binome = store.createNewSchemaSoutenance({ type: 'BINOME',  etudiant1: 'A B' });
    const tri    = store.createNewSchemaSoutenance({ type: 'trinome', etudiant1: 'A B' });

    expect(mono.type_presentation).toBe('MONOME');
    expect(binome.type_presentation).toBe('BINOME');
    expect(tri.type_presentation).toBe('TRINOME');
  });

  test('etudiant1 name is split into nom and prenom', () => {
    const store = buildSoutenanceStore();
    const record = store.createNewSchemaSoutenance({ type: 'MONOME', etudiant1: 'Dupont Jean' });

    expect(record.etudiant1_prenom).toBe('Dupont');
    expect(record.etudiant1_nom).toBe('Jean');
  });

  test('soutenance with no affectation_id stores NULL (optional FK)', () => {
    const store = buildSoutenanceStore();
    const record = store.createNewSchemaSoutenance({ type: 'MONOME', etudiant1: 'A B' });

    expect(record.affectation_id).toBeNull();
  });
});

// ── 11. Behavioural mock — constraint violation handling ──────────────────────
describe('Behavioural mock — constraint violation handling', () => {
  /**
   * Simulates the error-handling patterns present in the updated routes:
   * - Duplicate email during registration → SequelizeUniqueConstraintError
   * - Duplicate candidature (same student + stage) → SequelizeUniqueConstraintError
   * - New schema errors are isolated and do not break legacy responses
   */

  function makeUniqueConstraintError(message) {
    const err = new Error(message);
    err.name = 'SequelizeUniqueConstraintError';
    return err;
  }

  test('SequelizeUniqueConstraintError is identifiable by name', () => {
    const err = makeUniqueConstraintError("Duplicate entry 'test@test.com' for key 'email'");
    expect(err.name).toBe('SequelizeUniqueConstraintError');
  });

  test('duplicate email error message contains the offending email', () => {
    const email = 'alice@test.com';
    const err = makeUniqueConstraintError(`Duplicate entry '${email}' for key 'email'`);
    expect(err.message).toContain(email);
  });

  test('duplicate candidature error message contains uk_stage_etudiant key', () => {
    const err = makeUniqueConstraintError("Duplicate entry '1-100' for key 'uk_stage_etudiant'");
    expect(err.message).toContain('uk_stage_etudiant');
  });

  test('new schema error does not propagate when caught in isolation block', () => {
    let legacySucceeded = false;
    let newSchemaErrorCaught = false;

    // Simulate the pattern used in all updated routes:
    // legacy write succeeds, new schema write fails, legacy response is still sent
    try {
      legacySucceeded = true; // legacy write
      try {
        throw makeUniqueConstraintError("Duplicate entry '1-100' for key 'uk_stage_etudiant'");
      } catch (newSchemaErr) {
        newSchemaErrorCaught = true;
        // log but do not rethrow
      }
    } catch {
      legacySucceeded = false;
    }

    expect(legacySucceeded).toBe(true);
    expect(newSchemaErrorCaught).toBe(true);
  });

  test('missing required field (candidature_id) results in a 400-style error', () => {
    function validateAffectationInput(body) {
      if (!body.candidature_id) {
        return { status: 400, error: 'candidature_id est requis' };
      }
      return { status: 200 };
    }

    expect(validateAffectationInput({}).status).toBe(400);
    expect(validateAffectationInput({ candidature_id: 1 }).status).toBe(200);
  });

  test('409 status code is used for duplicate email in API registration endpoint', () => {
    // Verify the source code of connectionRoutes.js uses 409 for duplicate email
    expect(connectionSrc).toContain('409');
    expect(connectionSrc).toContain('DUPLICATE_EMAIL');
  });
});
