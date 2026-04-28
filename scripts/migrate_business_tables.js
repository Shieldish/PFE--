#!/usr/bin/env node
/**
 * migrate_business_tables.js
 *
 * Migrates business logic data from the old schema into the new
 * stage, candidature, affectation, and soutenance tables.
 *
 * Usage:
 *   node scripts/migrate_business_tables.js
 *
 * Requirements: 8.4, 10.5
 *
 * Prerequisites:
 *   1. migrate_user_registration.js must have run first.
 *   2. migrate_user_type_tables.js must have run first so that
 *      etudiant, enseignant, encadrant, and entreprise rows exist.
 *   3. The new schema migrations (20240101000006 through 000009)
 *      must have run so the new tables exist.
 *
 * Old schema (pre-redesign):
 *   stage            — id (UUID PK), Domaine, Nom, Titre, Libelle,
 *                      Description, Niveau, Experience, Langue,
 *                      PostesVacants, Telephone, Fax, Email, Email2,
 *                      DateDebut, DateFin, Address, Rue, State, Zip,
 *                      gridCheck, CreatedBy (company email), createdAt, updatedAt
 *
 *   stagepostulation — id (INT PK), stageId (UUID FK), etudiantID (UUID),
 *                      etudiantName, etudiantInstitue, etudiantSection,
 *                      etudiantEmail, stageDomaine, stageSujet,
 *                      entrepriseName, entrepriseEmail, status, CV, postulatedAt
 *
 *   candidature      — candidatureId (UUID PK), id (etudiant UUID),
 *                      nom, prenom, email, domaine_etudes, cv,
 *                      lettre_motivation, releves_notes, created_at, updated_at
 *
 *   soutenance       — id (INT PK), date, time, salle, groupe, type,
 *                      etudiant1, etudiant2, etudiant3, sujet,
 *                      president, rapporteur, encadrantAcademique,
 *                      encadrantProfessionnel, entreprise, createdAt, updatedAt
 *
 * Idempotent: rows already present in the target tables are skipped.
 */

'use strict';

require('dotenv').config();
const { sequelize } = require('../config/database');

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Return a non-empty trimmed string or a fallback. */
function coalesceStr(value, fallback = 'N/A') {
  if (value == null) return fallback;
  const s = String(value).trim();
  return s.length > 0 ? s : fallback;
}

/** Normalise email: lowercase + trim. Returns null if empty. */
function normaliseEmail(raw) {
  if (!raw) return null;
  const s = String(raw).toLowerCase().trim();
  return s.length > 0 ? s : null;
}

/**
 * Map old Niveau string to new ENUM value.
 * Accepted values: LICENCE | MASTER | DOCTORAT | AUTRE
 */
function mapNiveau(raw) {
  if (!raw) return 'AUTRE';
  switch (String(raw).toUpperCase().trim()) {
    case 'MASTER':   return 'MASTER';
    case 'DOCTORAT': return 'DOCTORAT';
    case 'LICENCE':  return 'LICENCE';
    default:         return 'AUTRE';
  }
}

/**
 * Map old status string to new ENUM value.
 * Accepted values: EN_ATTENTE | ACCEPTE | REFUSE | ANNULE
 */
function mapStatus(raw) {
  if (!raw) return 'EN_ATTENTE';
  const s = String(raw).toUpperCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // strip accents
  if (s === 'ACCEPTE' || s === 'ACCEPTED') return 'ACCEPTE';
  if (s === 'REFUSE'  || s === 'REFUSED')  return 'REFUSE';
  if (s === 'ANNULE'  || s === 'CANCELLED') return 'ANNULE';
  return 'EN_ATTENTE';
}

/**
 * Map old type_presentation string to new ENUM value.
 * Accepted values: MONOME | BINOME | TRINOME
 */
function mapTypePresentation(raw) {
  if (!raw) return 'MONOME';
  switch (String(raw).toUpperCase().trim()) {
    case 'BINOME':  return 'BINOME';
    case 'TRINOME': return 'TRINOME';
    default:        return 'MONOME';
  }
}

/**
 * Try to parse a date value into a YYYY-MM-DD string.
 * Returns null if unparseable.
 */
function parseDate(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

/** Today as YYYY-MM-DD */
function today() {
  return new Date().toISOString().slice(0, 10);
}

/** Three months from today as YYYY-MM-DD */
function threeMonthsFromNow() {
  const d = new Date();
  d.setMonth(d.getMonth() + 3);
  return d.toISOString().slice(0, 10);
}

/**
 * Split a full name "NOM PRENOM" into { nom, prenom }.
 * Falls back to the whole string as nom if no space found.
 */
function splitFullName(fullName) {
  if (!fullName) return { nom: 'N/A', prenom: 'N/A' };
  const s = String(fullName).trim();
  const idx = s.indexOf(' ');
  if (idx === -1) return { nom: s, prenom: 'N/A' };
  return { nom: s.slice(0, idx), prenom: s.slice(idx + 1) };
}

/**
 * Check whether a table exists in the current database.
 */
async function tableExists(tableName) {
  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.tables
     WHERE table_schema = DATABASE()
       AND table_name   = :tableName`,
    { replacements: { tableName }, type: sequelize.QueryTypes.SELECT }
  );
  return Number(rows.cnt) > 0;
}

/**
 * Fetch all rows from a backup table. Returns [] if the table does not exist.
 */
async function fetchOldRows(backupTable) {
  const exists = await tableExists(backupTable);
  if (!exists) {
    console.log(`  ℹ  Backup table '${backupTable}' not found — skipping.`);
    return [];
  }
  const rows = await sequelize.query(
    `SELECT * FROM \`${backupTable}\``,
    { type: sequelize.QueryTypes.SELECT }
  );
  console.log(`  ℹ  Found ${rows.length} row(s) in '${backupTable}'.`);
  return rows;
}

// ── Lookup builders ───────────────────────────────────────────────────────────

/**
 * Build Map<email → entreprise_id> from the new entreprise table.
 */
async function buildEntrepriseEmailMap() {
  const rows = await sequelize.query(
    'SELECT entreprise_id, email FROM entreprise',
    { type: sequelize.QueryTypes.SELECT }
  );
  const map = new Map();
  for (const r of rows) {
    const email = normaliseEmail(r.email);
    if (email) map.set(email, r.entreprise_id);
  }
  return map;
}

/**
 * Build Map<uuid → etudiant_id> and Map<email → etudiant_id> from etudiant.
 */
async function buildEtudiantMaps() {
  const rows = await sequelize.query(
    'SELECT etudiant_id, uuid, nom, prenom, departement, specialite FROM etudiant',
    { type: sequelize.QueryTypes.SELECT }
  );
  const byUuid  = new Map();
  const byEmail = new Map();
  const details = new Map(); // etudiant_id → { nom, prenom, departement, specialite }

  // Also fetch emails from user_registration for email-based lookup
  const urRows = await sequelize.query(
    `SELECT ur.email, et.etudiant_id
     FROM user_registration ur
     INNER JOIN etudiant et ON et.user_id = ur.user_id`,
    { type: sequelize.QueryTypes.SELECT }
  );
  for (const r of urRows) {
    const email = normaliseEmail(r.email);
    if (email) byEmail.set(email, r.etudiant_id);
  }

  for (const r of rows) {
    if (r.uuid) byUuid.set(String(r.uuid).trim(), r.etudiant_id);
    details.set(r.etudiant_id, {
      nom:         r.nom,
      prenom:      r.prenom,
      departement: r.departement,
      specialite:  r.specialite,
    });
  }
  return { byUuid, byEmail, details };
}

/**
 * Build Map<oldUuid → stage_id> by matching old_stage.id to the new stage
 * rows we just inserted (matched on titre + entreprise_id).
 * Also returns Map<oldUuid → { titre, entreprise_id }> for reference.
 */
async function buildStageUuidMap(entrepriseEmailMap, oldStageRows) {
  const map = new Map(); // old UUID → new stage_id
  if (oldStageRows.length === 0) return map;

  const newStages = await sequelize.query(
    'SELECT stage_id, entreprise_id, titre, contact_email FROM stage',
    { type: sequelize.QueryTypes.SELECT }
  );

  // Index new stages by entreprise_id + normalised titre
  const newStageIndex = new Map();
  for (const s of newStages) {
    const key = `${s.entreprise_id}::${String(s.titre).trim().toLowerCase()}`;
    newStageIndex.set(key, s.stage_id);
  }

  for (const old of oldStageRows) {
    const entrepriseId = entrepriseEmailMap.get(normaliseEmail(old.CreatedBy));
    if (!entrepriseId) continue;
    const key = `${entrepriseId}::${String(old.Titre || '').trim().toLowerCase()}`;
    const stageId = newStageIndex.get(key);
    if (stageId && old.id) map.set(String(old.id).trim(), stageId);
  }
  return map;
}

/**
 * Build Map<"nom prenom" → enseignant_id> for jury resolution.
 */
async function buildEnseignantNameMap() {
  const rows = await sequelize.query(
    'SELECT enseignant_id, nom, prenom FROM enseignant',
    { type: sequelize.QueryTypes.SELECT }
  );
  const map = new Map();
  for (const r of rows) {
    const k1 = `${r.nom} ${r.prenom}`.toLowerCase().trim();
    const k2 = `${r.prenom} ${r.nom}`.toLowerCase().trim();
    map.set(k1, r.enseignant_id);
    map.set(k2, r.enseignant_id);
  }
  return map;
}

/**
 * Build Map<"nom prenom" → encadrant_id> for jury resolution.
 */
async function buildEncadrantNameMap() {
  const rows = await sequelize.query(
    'SELECT encadrant_id, nom, prenom FROM encadrant',
    { type: sequelize.QueryTypes.SELECT }
  );
  const map = new Map();
  for (const r of rows) {
    const k1 = `${r.nom} ${r.prenom}`.toLowerCase().trim();
    const k2 = `${r.prenom} ${r.nom}`.toLowerCase().trim();
    map.set(k1, r.encadrant_id);
    map.set(k2, r.encadrant_id);
  }
  return map;
}

/**
 * Build Map<etudiant_id → affectation_id> for soutenance resolution.
 */
async function buildAffectationMap() {
  const rows = await sequelize.query(
    `SELECT af.affectation_id, c.etudiant_id
     FROM affectation af
     INNER JOIN candidature c ON c.candidature_id = af.candidature_id`,
    { type: sequelize.QueryTypes.SELECT }
  );
  const map = new Map();
  for (const r of rows) map.set(r.etudiant_id, r.affectation_id);
  return map;
}

// ── Per-table migration logic ─────────────────────────────────────────────────

/**
 * Migrate old_stage → stage.
 * Returns Map<oldUuid → new stage_id>.
 */
async function migrateStage(entrepriseEmailMap, transaction) {
  const oldRows = await fetchOldRows('old_stage');
  if (oldRows.length === 0) return new Map();

  // Fetch existing (entreprise_id, titre) pairs to avoid duplicates
  const existing = await sequelize.query(
    'SELECT entreprise_id, titre FROM stage',
    { type: sequelize.QueryTypes.SELECT }
  );
  const existingSet = new Set(
    existing.map((r) => `${r.entreprise_id}::${String(r.titre).trim().toLowerCase()}`)
  );

  let inserted = 0;
  const oldUuidToNewId = new Map();

  for (const old of oldRows) {
    const entrepriseId = entrepriseEmailMap.get(normaliseEmail(old.CreatedBy));
    if (!entrepriseId) {
      console.warn(`    ⚠  stage '${old.Titre}': no entreprise found for CreatedBy='${old.CreatedBy}' — skipped.`);
      continue;
    }

    const titre = coalesceStr(old.Titre);
    const dedupeKey = `${entrepriseId}::${titre.toLowerCase()}`;
    if (existingSet.has(dedupeKey)) continue;

    const adresse = [old.Rue, old.Address].filter(Boolean).map((s) => s.trim()).filter(Boolean).join(', ') || 'N/A';

    const row = {
      entreprise_id:     entrepriseId,
      titre,
      domaine:           coalesceStr(old.Domaine),
      description:       coalesceStr(old.Description || old.Libelle),
      niveau_requis:     mapNiveau(old.Niveau),
      experience_requise: old.Experience ? String(old.Experience).trim() || null : null,
      langue_requise:    old.Langue     ? String(old.Langue).trim()     || null : null,
      postes_vacants:    /^\d+$/.test(String(old.PostesVacants || '')) ? parseInt(old.PostesVacants, 10) : 1,
      date_debut:        parseDate(old.DateDebut) || today(),
      date_fin:          parseDate(old.DateFin)   || threeMonthsFromNow(),
      adresse,
      ville:             coalesceStr(old.State),
      code_postal:       old.Zip ? String(old.Zip).trim() || null : null,
      contact_email:     normaliseEmail(old.Email || old.Email2) || 'contact@unknown.com',
      contact_telephone: coalesceStr(old.Telephone),
      is_active:         1,
      created_at:        old.createdAt || new Date(),
      updated_at:        old.updatedAt || new Date(),
    };

    const [result] = await sequelize.query(
      `INSERT INTO stage
         (entreprise_id, titre, domaine, description, niveau_requis,
          experience_requise, langue_requise, postes_vacants,
          date_debut, date_fin, adresse, ville, code_postal,
          contact_email, contact_telephone, is_active,
          created_at, updated_at)
       VALUES
         (:entreprise_id, :titre, :domaine, :description, :niveau_requis,
          :experience_requise, :langue_requise, :postes_vacants,
          :date_debut, :date_fin, :adresse, :ville, :code_postal,
          :contact_email, :contact_telephone, :is_active,
          :created_at, :updated_at)`,
      { replacements: row, transaction, type: sequelize.QueryTypes.INSERT }
    );

    const newStageId = result; // INSERT returns insertId
    if (old.id) oldUuidToNewId.set(String(old.id).trim(), newStageId);
    existingSet.add(dedupeKey);
    inserted++;
  }

  console.log(`    ✔  stage: ${inserted} row(s) inserted.`);
  return oldUuidToNewId;
}

/**
 * Migrate old_stagepostulation → candidature.
 */
async function migrateStagePostulation(oldUuidToStageId, etudiantMaps, transaction) {
  const oldRows = await fetchOldRows('old_stagepostulation');
  if (oldRows.length === 0) return 0;

  // Existing (stage_id, etudiant_id) pairs
  const existing = await sequelize.query(
    'SELECT stage_id, etudiant_id FROM candidature',
    { type: sequelize.QueryTypes.SELECT }
  );
  const existingSet = new Set(existing.map((r) => `${r.stage_id}::${r.etudiant_id}`));

  let inserted = 0;

  for (const old of oldRows) {
    // Resolve stage_id
    const stageId = oldUuidToStageId.get(String(old.stageId || '').trim());
    if (!stageId) {
      console.warn(`    ⚠  stagepostulation id=${old.id}: stage '${old.stageId}' not found — skipped.`);
      continue;
    }

    // Resolve etudiant_id via email
    const email = normaliseEmail(old.etudiantEmail);
    const etudiantId = email ? etudiantMaps.byEmail.get(email) : null;
    if (!etudiantId) {
      console.warn(`    ⚠  stagepostulation id=${old.id}: etudiant email='${old.etudiantEmail}' not found — skipped.`);
      continue;
    }

    const dedupeKey = `${stageId}::${etudiantId}`;
    if (existingSet.has(dedupeKey)) continue;

    const etInfo = etudiantMaps.details.get(etudiantId) || {};

    const row = {
      stage_id:              stageId,
      etudiant_id:           etudiantId,
      status:                mapStatus(old.status),
      etudiant_nom:          coalesceStr(etInfo.nom),
      etudiant_prenom:       coalesceStr(etInfo.prenom),
      etudiant_email:        email,
      etudiant_departement:  coalesceStr(etInfo.departement),
      etudiant_specialite:   coalesceStr(etInfo.specialite),
      cv_path:               old.CV ? String(old.CV).trim() || null : null,
      lettre_motivation_path: null,
      releves_notes_path:    null,
      motivation_letter:     null,
      date_postulation:      old.postulatedAt || new Date(),
      date_modification:     old.postulatedAt || new Date(),
    };

    await sequelize.query(
      `INSERT IGNORE INTO candidature
         (stage_id, etudiant_id, status,
          etudiant_nom, etudiant_prenom, etudiant_email,
          etudiant_departement, etudiant_specialite,
          cv_path, lettre_motivation_path, releves_notes_path,
          motivation_letter, date_postulation, date_modification)
       VALUES
         (:stage_id, :etudiant_id, :status,
          :etudiant_nom, :etudiant_prenom, :etudiant_email,
          :etudiant_departement, :etudiant_specialite,
          :cv_path, :lettre_motivation_path, :releves_notes_path,
          :motivation_letter, :date_postulation, :date_modification)`,
      { replacements: row, transaction }
    );

    existingSet.add(dedupeKey);
    inserted++;
  }

  console.log(`    ✔  candidature (from stagepostulation): ${inserted} row(s) inserted.`);
  return inserted;
}

/**
 * Migrate old_candidature (detailed application forms) → candidature.
 */
async function migrateOldCandidature(etudiantMaps, transaction) {
  const oldRows = await fetchOldRows('old_candidature');
  if (oldRows.length === 0) return 0;

  // Fetch a fallback stage_id (most recent active stage)
  const [fallbackStage] = await sequelize.query(
    'SELECT stage_id, domaine FROM stage WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 1',
    { type: sequelize.QueryTypes.SELECT }
  );

  // Fetch all stages for domain matching
  const allStages = await sequelize.query(
    'SELECT stage_id, domaine FROM stage WHERE is_active = TRUE',
    { type: sequelize.QueryTypes.SELECT }
  );

  // Existing (etudiant_id, etudiant_email) pairs
  const existing = await sequelize.query(
    'SELECT etudiant_id, etudiant_email FROM candidature',
    { type: sequelize.QueryTypes.SELECT }
  );
  const existingSet = new Set(existing.map((r) => `${r.etudiant_id}::${r.etudiant_email}`));

  let inserted = 0;

  for (const old of oldRows) {
    // Resolve etudiant by UUID stored in old_candidature.id
    const etudiantId = old.id ? etudiantMaps.byUuid.get(String(old.id).trim()) : null;
    if (!etudiantId) {
      // Try by email as fallback
      const emailFallback = normaliseEmail(old.email);
      const etudiantIdByEmail = emailFallback ? etudiantMaps.byEmail.get(emailFallback) : null;
      if (!etudiantIdByEmail) {
        console.warn(`    ⚠  old_candidature id=${old.candidatureId}: etudiant uuid='${old.id}' not found — skipped.`);
        continue;
      }
    }

    const resolvedEtudiantId = etudiantId ||
      etudiantMaps.byEmail.get(normaliseEmail(old.email));
    if (!resolvedEtudiantId) continue;

    const email = normaliseEmail(old.email);
    const dedupeKey = `${resolvedEtudiantId}::${email}`;
    if (existingSet.has(dedupeKey)) continue;

    // Best-effort stage match by domain
    const domaine = coalesceStr(old.domaine_etudes, '');
    let stageId = null;
    if (domaine && domaine !== 'N/A') {
      const match = allStages.find(
        (s) => s.domaine.toLowerCase().includes(domaine.toLowerCase()) ||
               domaine.toLowerCase().includes(s.domaine.toLowerCase())
      );
      if (match) stageId = match.stage_id;
    }
    if (!stageId && fallbackStage) stageId = fallbackStage.stage_id;
    if (!stageId) {
      console.warn(`    ⚠  old_candidature id=${old.candidatureId}: no stage found — skipped.`);
      continue;
    }

    const etInfo = etudiantMaps.details.get(resolvedEtudiantId) || {};

    const row = {
      stage_id:              stageId,
      etudiant_id:           resolvedEtudiantId,
      status:                'EN_ATTENTE',
      etudiant_nom:          coalesceStr(old.nom || etInfo.nom),
      etudiant_prenom:       coalesceStr(old.prenom || etInfo.prenom),
      etudiant_email:        email || 'unknown@unknown.com',
      etudiant_departement:  coalesceStr(etInfo.departement),
      etudiant_specialite:   coalesceStr(etInfo.specialite),
      cv_path:               old.cv               ? String(old.cv).trim()               || null : null,
      lettre_motivation_path: old.lettre_motivation ? String(old.lettre_motivation).trim() || null : null,
      releves_notes_path:    old.releves_notes    ? String(old.releves_notes).trim()    || null : null,
      motivation_letter:     null,
      date_postulation:      old.created_at || new Date(),
      date_modification:     old.updated_at || new Date(),
    };

    await sequelize.query(
      `INSERT IGNORE INTO candidature
         (stage_id, etudiant_id, status,
          etudiant_nom, etudiant_prenom, etudiant_email,
          etudiant_departement, etudiant_specialite,
          cv_path, lettre_motivation_path, releves_notes_path,
          motivation_letter, date_postulation, date_modification)
       VALUES
         (:stage_id, :etudiant_id, :status,
          :etudiant_nom, :etudiant_prenom, :etudiant_email,
          :etudiant_departement, :etudiant_specialite,
          :cv_path, :lettre_motivation_path, :releves_notes_path,
          :motivation_letter, :date_postulation, :date_modification)`,
      { replacements: row, transaction }
    );

    existingSet.add(dedupeKey);
    inserted++;
  }

  console.log(`    ✔  candidature (from old_candidature): ${inserted} row(s) inserted.`);
  return inserted;
}

/**
 * Create affectation rows for all ACCEPTE candidatures that don't have one yet.
 */
async function migrateAffectation(transaction) {
  const [result] = await sequelize.query(
    `INSERT IGNORE INTO affectation
       (candidature_id, enseignant_id, encadrant_id,
        date_affectation, notes, created_at, updated_at)
     SELECT
       c.candidature_id,
       NULL, NULL,
       c.date_postulation,
       NULL,
       NOW(), NOW()
     FROM candidature c
     WHERE c.status = 'ACCEPTE'
       AND NOT EXISTS (
           SELECT 1 FROM affectation a2
           WHERE a2.candidature_id = c.candidature_id
       )`,
    { transaction, type: sequelize.QueryTypes.INSERT }
  );
  const inserted = result || 0;
  console.log(`    ✔  affectation: ${inserted} row(s) inserted.`);
  return inserted;
}

/**
 * Migrate old_soutenance → soutenance.
 */
async function migrateSoutenance(enseignantNameMap, encadrantNameMap, affectationMap, etudiantMaps, transaction) {
  const oldRows = await fetchOldRows('old_soutenance');
  if (oldRows.length === 0) return 0;

  // Track existing soutenance by (date + salle + etudiant1_nom) to avoid duplicates
  const existing = await sequelize.query(
    'SELECT date_soutenance, salle, etudiant1_nom FROM soutenance',
    { type: sequelize.QueryTypes.SELECT }
  );
  const existingSet = new Set(
    existing.map((r) => `${r.date_soutenance}::${r.salle}::${r.etudiant1_nom}`.toLowerCase())
  );

  let inserted = 0;

  for (const old of oldRows) {
    const dateSoutenance = parseDate(old.date) || today();
    const salle          = coalesceStr(old.salle);
    const { nom: et1Nom, prenom: et1Prenom } = splitFullName(old.etudiant1);

    const dedupeKey = `${dateSoutenance}::${salle}::${et1Nom}`.toLowerCase();
    if (existingSet.has(dedupeKey)) continue;

    // Resolve affectation_id via etudiant name
    let affectationId = null;
    if (old.etudiant1) {
      const fullNameLower = String(old.etudiant1).toLowerCase().trim();
      // Try to find etudiant by name
      for (const [etId, info] of etudiantMaps.details) {
        const k1 = `${info.nom} ${info.prenom}`.toLowerCase();
        const k2 = `${info.prenom} ${info.nom}`.toLowerCase();
        if (k1 === fullNameLower || k2 === fullNameLower) {
          affectationId = affectationMap.get(etId) || null;
          break;
        }
      }
    }

    // Resolve jury members by name
    const presidentId          = old.president           ? (enseignantNameMap.get(String(old.president).toLowerCase().trim())           || null) : null;
    const rapporteurId         = old.rapporteur          ? (enseignantNameMap.get(String(old.rapporteur).toLowerCase().trim())          || null) : null;
    const encadrantAcadId      = old.encadrantAcademique ? (enseignantNameMap.get(String(old.encadrantAcademique).toLowerCase().trim()) || null) : null;
    const encadrantProfId      = old.encadrantProfessionnel ? (encadrantNameMap.get(String(old.encadrantProfessionnel).toLowerCase().trim()) || null) : null;

    const { nom: et2Nom, prenom: et2Prenom } = old.etudiant2 ? splitFullName(old.etudiant2) : { nom: null, prenom: null };
    const { nom: et3Nom, prenom: et3Prenom } = old.etudiant3 ? splitFullName(old.etudiant3) : { nom: null, prenom: null };

    const row = {
      affectation_id:              affectationId,
      date_soutenance:             dateSoutenance,
      heure_soutenance:            old.time || '09:00:00',
      salle,
      type_presentation:           mapTypePresentation(old.type),
      etudiant1_nom:               et1Nom,
      etudiant1_prenom:            et1Prenom,
      etudiant2_nom:               et2Nom,
      etudiant2_prenom:            et2Prenom,
      etudiant3_nom:               et3Nom,
      etudiant3_prenom:            et3Prenom,
      president_id:                presidentId,
      rapporteur_id:               rapporteurId,
      encadrant_academique_id:     encadrantAcadId,
      encadrant_professionnel_id:  encadrantProfId,
      sujet:                       coalesceStr(old.sujet),
      entreprise_nom:              old.entreprise ? String(old.entreprise).trim() || null : null,
      notes:                       null,
      created_at:                  old.createdAt || new Date(),
      updated_at:                  old.updatedAt || new Date(),
    };

    await sequelize.query(
      `INSERT IGNORE INTO soutenance
         (affectation_id,
          date_soutenance, heure_soutenance, salle, type_presentation,
          etudiant1_nom, etudiant1_prenom,
          etudiant2_nom, etudiant2_prenom,
          etudiant3_nom, etudiant3_prenom,
          president_id, rapporteur_id,
          encadrant_academique_id, encadrant_professionnel_id,
          sujet, entreprise_nom, notes,
          created_at, updated_at)
       VALUES
         (:affectation_id,
          :date_soutenance, :heure_soutenance, :salle, :type_presentation,
          :etudiant1_nom, :etudiant1_prenom,
          :etudiant2_nom, :etudiant2_prenom,
          :etudiant3_nom, :etudiant3_prenom,
          :president_id, :rapporteur_id,
          :encadrant_academique_id, :encadrant_professionnel_id,
          :sujet, :entreprise_nom, :notes,
          :created_at, :updated_at)`,
      { replacements: row, transaction }
    );

    existingSet.add(dedupeKey);
    inserted++;
  }

  console.log(`    ✔  soutenance: ${inserted} row(s) inserted.`);
  return inserted;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function migrate() {
  // 1. Connect
  try {
    await sequelize.authenticate();
    console.log('✔  Database connection established.');
  } catch (err) {
    console.error('✘  Cannot connect to database:', err.message);
    process.exit(1);
  }

  // 2. Build lookup maps from already-migrated user-type tables
  let entrepriseEmailMap, etudiantMaps, enseignantNameMap, encadrantNameMap;
  try {
    entrepriseEmailMap = await buildEntrepriseEmailMap();
    etudiantMaps       = await buildEtudiantMaps();
    enseignantNameMap  = await buildEnseignantNameMap();
    encadrantNameMap   = await buildEncadrantNameMap();
    console.log(`ℹ  Loaded ${entrepriseEmailMap.size} entreprise(s), ${etudiantMaps.byUuid.size} etudiant(s) by UUID, ${etudiantMaps.byEmail.size} by email.`);
  } catch (err) {
    console.error('✘  Could not build lookup maps:', err.message);
    console.error('   Run migrate_user_type_tables.js first.');
    process.exit(1);
  }

  // 3. Run all migrations inside a single transaction
  const t = await sequelize.transaction();
  const counts = { stage: 0, candidature: 0, affectation: 0, soutenance: 0 };

  try {
    console.log('\n── Migrating stage ─────────────────────────────────────');
    const oldStageRows = await fetchOldRows('old_stage');
    const oldUuidToStageId = await migrateStage(entrepriseEmailMap, t);
    counts.stage = oldUuidToStageId.size;

    // Rebuild stage UUID map after insert (in case some were already present)
    const fullStageUuidMap = await buildStageUuidMap(entrepriseEmailMap, oldStageRows);
    // Merge: prefer freshly inserted IDs, fall back to pre-existing matches
    for (const [uuid, id] of fullStageUuidMap) {
      if (!oldUuidToStageId.has(uuid)) oldUuidToStageId.set(uuid, id);
    }

    console.log('\n── Migrating candidature (stagepostulation) ────────────');
    const c1 = await migrateStagePostulation(oldUuidToStageId, etudiantMaps, t);

    console.log('\n── Migrating candidature (old_candidature) ─────────────');
    const c2 = await migrateOldCandidature(etudiantMaps, t);
    counts.candidature = c1 + c2;

    console.log('\n── Migrating affectation ───────────────────────────────');
    counts.affectation = await migrateAffectation(t);

    // Rebuild affectation map after insert for soutenance resolution
    const affectationMap = await buildAffectationMap();

    console.log('\n── Migrating soutenance ────────────────────────────────');
    counts.soutenance = await migrateSoutenance(
      enseignantNameMap, encadrantNameMap, affectationMap, etudiantMaps, t
    );

    await t.commit();
    console.log('\n✔  Transaction committed successfully.');
  } catch (err) {
    await t.rollback();
    console.error('\n✘  Migration failed — transaction rolled back:', err.message);
    process.exit(1);
  }

  // 4. Print summary
  console.log('\n── Migration summary ───────────────────────────────────');
  console.log(`  stage        inserted : ${counts.stage}`);
  console.log(`  candidature  inserted : ${counts.candidature}`);
  console.log(`  affectation  inserted : ${counts.affectation}`);
  console.log(`  soutenance   inserted : ${counts.soutenance}`);
  console.log('────────────────────────────────────────────────────────');

  // 5. Final row counts
  try {
    const tables = ['stage', 'candidature', 'affectation', 'soutenance'];
    console.log('\n── Current row counts ──────────────────────────────────');
    for (const tbl of tables) {
      const [row] = await sequelize.query(
        `SELECT COUNT(*) AS cnt FROM \`${tbl}\``,
        { type: sequelize.QueryTypes.SELECT }
      );
      console.log(`  ${tbl.padEnd(14)}: ${row.cnt} row(s)`);
    }
    console.log('────────────────────────────────────────────────────────\n');
  } catch (err) {
    console.warn('  ⚠  Could not fetch final row counts:', err.message);
  }

  await sequelize.close();
}

migrate();
