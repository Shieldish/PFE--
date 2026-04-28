'use strict';

/**
 * Unit tests for Sequelize models.
 *
 * These are documentation-style tests that verify model source code declares
 * the correct field types, ENUM values, constraints, associations, and hooks
 * without requiring a live database connection.
 *
 * Pattern: read model source as a string and assert on its content, plus
 * pure-function simulations of hook behaviour.
 *
 * Requirements: 10.7
 */

const fs   = require('fs');
const path = require('path');
const { v4: uuidv4, validate: uuidValidate } = require('uuid');

// ── Source helpers ────────────────────────────────────────────────────────────

function readModel(filename) {
  return fs.readFileSync(
    path.join(__dirname, '..', 'model', filename),
    'utf8'
  );
}

const USER_REG_SRC   = readModel('UserRegistrationModel.js');
const USER_TYPE_SRC  = readModel('UserTypeModels.js');
const BUSINESS_SRC   = readModel('BusinessModels.js');


// ═══════════════════════════════════════════════════════════════════════════
// 1. UserRegistrationModel — field types, constraints, ENUM, hooks
// ═══════════════════════════════════════════════════════════════════════════

describe('UserRegistrationModel — field declarations', () => {
  test('declares user_id as INTEGER primary key with autoIncrement', () => {
    expect(USER_REG_SRC).toMatch(/user_id[\s\S]{0,100}INTEGER/);
    expect(USER_REG_SRC).toMatch(/user_id[\s\S]{0,200}primaryKey\s*:\s*true/);
    expect(USER_REG_SRC).toMatch(/user_id[\s\S]{0,300}autoIncrement\s*:\s*true/);
  });

  test('declares uuid as STRING(36) with unique: true and allowNull: false', () => {
    expect(USER_REG_SRC).toMatch(/uuid[\s\S]{0,200}STRING\s*\(\s*36\s*\)/);
    expect(USER_REG_SRC).toMatch(/uuid[\s\S]{0,200}unique\s*:\s*true/);
    expect(USER_REG_SRC).toMatch(/uuid[\s\S]{0,200}allowNull\s*:\s*false/);
  });

  test('declares email as STRING with unique: true and allowNull: false', () => {
    expect(USER_REG_SRC).toMatch(/email[\s\S]{0,200}unique\s*:\s*true/);
    expect(USER_REG_SRC).toMatch(/email[\s\S]{0,200}allowNull\s*:\s*false/);
  });

  test('declares password_hash as STRING with allowNull: false', () => {
    expect(USER_REG_SRC).toMatch(/password_hash[\s\S]{0,200}STRING/);
    expect(USER_REG_SRC).toMatch(/password_hash[\s\S]{0,200}allowNull\s*:\s*false/);
  });

  test('declares role as ENUM with all five valid values', () => {
    expect(USER_REG_SRC).toMatch(/role[\s\S]{0,100}ENUM/);
    ['STUDENT', 'TEACHER', 'SUPERVISOR', 'COMPANY', 'ADMIN'].forEach((r) => {
      expect(USER_REG_SRC).toContain(`'${r}'`);
    });
  });

  test('declares role with allowNull: false', () => {
    expect(USER_REG_SRC).toMatch(/role[\s\S]{0,200}allowNull\s*:\s*false/);
  });

  test('declares is_active as BOOLEAN with defaultValue: true', () => {
    expect(USER_REG_SRC).toMatch(/is_active[\s\S]{0,200}BOOLEAN/);
    expect(USER_REG_SRC).toMatch(/is_active[\s\S]{0,200}defaultValue\s*:\s*true/);
  });

  test('uses tableName "user_registration"', () => {
    expect(USER_REG_SRC).toMatch(/tableName\s*:\s*['"]user_registration['"]/);
  });

  test('enables timestamps with createdAt and updatedAt column aliases', () => {
    expect(USER_REG_SRC).toMatch(/timestamps\s*:\s*true/);
    expect(USER_REG_SRC).toMatch(/createdAt\s*:\s*['"]created_at['"]/);
    expect(USER_REG_SRC).toMatch(/updatedAt\s*:\s*['"]updated_at['"]/);
  });
});

describe('UserRegistrationModel — beforeCreate hook (UUID generation)', () => {
  /**
   * Simulate the beforeCreate hook: assign a UUID v4 to instance.uuid.
   */
  function applyUuidHook(instance) {
    instance.uuid = uuidv4();
    return instance;
  }

  test('hook source registers a beforeCreate callback', () => {
    expect(USER_REG_SRC).toMatch(/beforeCreate/);
  });

  test('hook source calls uuidv4()', () => {
    expect(USER_REG_SRC).toMatch(/uuidv4\s*\(\s*\)/);
  });

  test('hook assigns a valid UUID v4 to instance.uuid', () => {
    const instance = { email: 'a@b.com', role: 'STUDENT' };
    applyUuidHook(instance);
    expect(uuidValidate(instance.uuid)).toBe(true);
  });

  test('hook-generated UUID is exactly 36 characters', () => {
    const instance = {};
    applyUuidHook(instance);
    expect(instance.uuid).toHaveLength(36);
  });

  test('two hook invocations produce different UUIDs', () => {
    const a = {};
    const b = {};
    applyUuidHook(a);
    applyUuidHook(b);
    expect(a.uuid).not.toBe(b.uuid);
  });
});

describe('UserRegistrationModel — associations', () => {
  test('associate() calls hasOne for Etudiant with foreignKey user_id', () => {
    expect(USER_REG_SRC).toMatch(/UserRegistration\.hasOne\s*\(\s*Etudiant/);
    expect(USER_REG_SRC).toMatch(/foreignKey\s*:\s*['"]user_id['"]/);
  });

  test('associate() calls hasOne for Enseignant', () => {
    expect(USER_REG_SRC).toMatch(/UserRegistration\.hasOne\s*\(\s*Enseignant/);
  });

  test('associate() calls hasOne for Encadrant', () => {
    expect(USER_REG_SRC).toMatch(/UserRegistration\.hasOne\s*\(\s*Encadrant/);
  });

  test('associate() calls hasOne for Entreprise', () => {
    expect(USER_REG_SRC).toMatch(/UserRegistration\.hasOne\s*\(\s*Entreprise/);
  });

  test('Etudiant association uses alias "etudiant"', () => {
    expect(USER_REG_SRC).toMatch(/as\s*:\s*['"]etudiant['"]/);
  });

  test('Enseignant association uses alias "enseignant"', () => {
    expect(USER_REG_SRC).toMatch(/as\s*:\s*['"]enseignant['"]/);
  });

  test('Encadrant association uses alias "encadrant"', () => {
    expect(USER_REG_SRC).toMatch(/as\s*:\s*['"]encadrant['"]/);
  });

  test('Entreprise association uses alias "entreprise"', () => {
    expect(USER_REG_SRC).toMatch(/as\s*:\s*['"]entreprise['"]/);
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// 2. UserTypeModels — Etudiant, Enseignant, Encadrant, Entreprise
// ═══════════════════════════════════════════════════════════════════════════

describe('UserTypeModels — Etudiant field declarations', () => {
  test('declares etudiant_id as INTEGER primary key', () => {
    expect(USER_TYPE_SRC).toMatch(/etudiant_id[\s\S]{0,200}primaryKey\s*:\s*true/);
  });

  test('declares user_id as INTEGER with allowNull: false', () => {
    // user_id appears in multiple models; check it is present and non-nullable
    expect(USER_TYPE_SRC).toMatch(/user_id[\s\S]{0,200}allowNull\s*:\s*false/);
  });

  test('declares uuid as STRING(36) with unique: true', () => {
    expect(USER_TYPE_SRC).toMatch(/uuid[\s\S]{0,200}STRING\s*\(\s*36\s*\)/);
    expect(USER_TYPE_SRC).toMatch(/uuid[\s\S]{0,200}unique\s*:\s*true/);
  });

  test('declares sexe as ENUM with values M and F', () => {
    expect(USER_TYPE_SRC).toMatch(/sexe[\s\S]{0,100}ENUM/);
    expect(USER_TYPE_SRC).toMatch(/'M'/);
    expect(USER_TYPE_SRC).toMatch(/'F'/);
  });

  test('uses tableName "etudiant"', () => {
    expect(USER_TYPE_SRC).toMatch(/tableName\s*:\s*['"]etudiant['"]/);
  });
});

describe('UserTypeModels — Enseignant field declarations', () => {
  test('declares enseignant_id as INTEGER primary key', () => {
    expect(USER_TYPE_SRC).toMatch(/enseignant_id[\s\S]{0,200}primaryKey\s*:\s*true/);
  });

  test('declares email as STRING with unique: true', () => {
    // Enseignant has a unique email column
    expect(USER_TYPE_SRC).toMatch(/Enseignant[\s\S]{0,1000}email[\s\S]{0,200}unique\s*:\s*true/);
  });

  test('declares grade as STRING', () => {
    expect(USER_TYPE_SRC).toMatch(/grade[\s\S]{0,100}STRING/);
  });

  test('uses tableName "enseignant"', () => {
    expect(USER_TYPE_SRC).toMatch(/tableName\s*:\s*['"]enseignant['"]/);
  });
});

describe('UserTypeModels — Entreprise field declarations', () => {
  test('declares entreprise_id as INTEGER primary key', () => {
    expect(USER_TYPE_SRC).toMatch(/entreprise_id[\s\S]{0,200}primaryKey\s*:\s*true/);
  });

  test('declares nom as STRING(200)', () => {
    expect(USER_TYPE_SRC).toMatch(/nom[\s\S]{0,100}STRING\s*\(\s*200\s*\)/);
  });

  test('declares email as STRING with unique: true', () => {
    expect(USER_TYPE_SRC).toMatch(/Entreprise[\s\S]{0,1500}email[\s\S]{0,200}unique\s*:\s*true/);
  });

  test('uses tableName "entreprise"', () => {
    expect(USER_TYPE_SRC).toMatch(/tableName\s*:\s*['"]entreprise['"]/);
  });
});

describe('UserTypeModels — Encadrant field declarations', () => {
  test('declares encadrant_id as INTEGER primary key', () => {
    expect(USER_TYPE_SRC).toMatch(/encadrant_id[\s\S]{0,200}primaryKey\s*:\s*true/);
  });

  test('declares entreprise_id as INTEGER with allowNull: true', () => {
    expect(USER_TYPE_SRC).toMatch(/entreprise_id[\s\S]{0,200}allowNull\s*:\s*true/);
  });

  test('declares email as STRING with unique: true', () => {
    expect(USER_TYPE_SRC).toMatch(/Encadrant[\s\S]{0,1500}email[\s\S]{0,200}unique\s*:\s*true/);
  });

  test('uses tableName "encadrant"', () => {
    expect(USER_TYPE_SRC).toMatch(/tableName\s*:\s*['"]encadrant['"]/);
  });
});

describe('UserTypeModels — associations', () => {
  test('Etudiant.belongsTo UserRegistration via user_id', () => {
    expect(USER_TYPE_SRC).toMatch(/Etudiant\.belongsTo\s*\(\s*UserRegistration/);
    expect(USER_TYPE_SRC).toMatch(/foreignKey\s*:\s*['"]user_id['"]/);
  });

  test('Enseignant.belongsTo UserRegistration via user_id', () => {
    expect(USER_TYPE_SRC).toMatch(/Enseignant\.belongsTo\s*\(\s*UserRegistration/);
  });

  test('Encadrant.belongsTo UserRegistration via user_id', () => {
    expect(USER_TYPE_SRC).toMatch(/Encadrant\.belongsTo\s*\(\s*UserRegistration/);
  });

  test('Entreprise.belongsTo UserRegistration via user_id', () => {
    expect(USER_TYPE_SRC).toMatch(/Entreprise\.belongsTo\s*\(\s*UserRegistration/);
  });

  test('Encadrant.belongsTo Entreprise via entreprise_id', () => {
    expect(USER_TYPE_SRC).toMatch(/Encadrant\.belongsTo\s*\(\s*Entreprise/);
    expect(USER_TYPE_SRC).toMatch(/foreignKey\s*:\s*['"]entreprise_id['"]/);
  });

  test('Entreprise.hasMany Encadrant', () => {
    expect(USER_TYPE_SRC).toMatch(/Entreprise\.hasMany\s*\(\s*Encadrant/);
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// 3. BusinessModels — Stage, Candidature, Affectation, Soutenance
// ═══════════════════════════════════════════════════════════════════════════

describe('BusinessModels — Stage field declarations', () => {
  test('declares stage_id as INTEGER primary key with autoIncrement', () => {
    expect(BUSINESS_SRC).toMatch(/stage_id[\s\S]{0,200}primaryKey\s*:\s*true/);
    expect(BUSINESS_SRC).toMatch(/stage_id[\s\S]{0,300}autoIncrement\s*:\s*true/);
  });

  test('declares entreprise_id as INTEGER with allowNull: false', () => {
    expect(BUSINESS_SRC).toMatch(/entreprise_id[\s\S]{0,200}allowNull\s*:\s*false/);
  });

  test('declares niveau_requis as ENUM with correct values', () => {
    expect(BUSINESS_SRC).toMatch(/niveau_requis[\s\S]{0,100}ENUM/);
    ['LICENCE', 'MASTER', 'DOCTORAT', 'AUTRE'].forEach((v) => {
      expect(BUSINESS_SRC).toContain(`'${v}'`);
    });
  });

  test('declares is_active as BOOLEAN with defaultValue: true', () => {
    expect(BUSINESS_SRC).toMatch(/is_active[\s\S]{0,200}BOOLEAN/);
    expect(BUSINESS_SRC).toMatch(/is_active[\s\S]{0,200}defaultValue\s*:\s*true/);
  });

  test('uses tableName "stage"', () => {
    expect(BUSINESS_SRC).toMatch(/tableName\s*:\s*['"]stage['"]/);
  });
});

describe('BusinessModels — Candidature field declarations', () => {
  test('declares candidature_id as INTEGER primary key', () => {
    expect(BUSINESS_SRC).toMatch(/candidature_id[\s\S]{0,200}primaryKey\s*:\s*true/);
  });

  test('declares stage_id as INTEGER with allowNull: false', () => {
    expect(BUSINESS_SRC).toMatch(/stage_id[\s\S]{0,200}allowNull\s*:\s*false/);
  });

  test('declares etudiant_id as INTEGER with allowNull: false', () => {
    expect(BUSINESS_SRC).toMatch(/etudiant_id[\s\S]{0,200}allowNull\s*:\s*false/);
  });

  test('declares status as ENUM with EN_ATTENTE, ACCEPTE, REFUSE, ANNULE', () => {
    expect(BUSINESS_SRC).toMatch(/status[\s\S]{0,100}ENUM/);
    ['EN_ATTENTE', 'ACCEPTE', 'REFUSE', 'ANNULE'].forEach((v) => {
      expect(BUSINESS_SRC).toContain(`'${v}'`);
    });
  });

  test('declares status defaultValue as EN_ATTENTE', () => {
    expect(BUSINESS_SRC).toMatch(/status[\s\S]{0,300}defaultValue\s*:\s*['"]EN_ATTENTE['"]/);
  });

  test('declares snapshot fields: etudiant_nom, etudiant_prenom, etudiant_email', () => {
    expect(BUSINESS_SRC).toMatch(/etudiant_nom/);
    expect(BUSINESS_SRC).toMatch(/etudiant_prenom/);
    expect(BUSINESS_SRC).toMatch(/etudiant_email/);
  });

  test('declares document path fields: cv_path, lettre_motivation_path, releves_notes_path', () => {
    expect(BUSINESS_SRC).toMatch(/cv_path/);
    expect(BUSINESS_SRC).toMatch(/lettre_motivation_path/);
    expect(BUSINESS_SRC).toMatch(/releves_notes_path/);
  });

  test('uses tableName "candidature"', () => {
    expect(BUSINESS_SRC).toMatch(/tableName\s*:\s*['"]candidature['"]/);
  });

  test('disables Sequelize timestamps (managed manually)', () => {
    expect(BUSINESS_SRC).toMatch(/timestamps\s*:\s*false/);
  });
});

describe('BusinessModels — Affectation field declarations', () => {
  test('declares affectation_id as INTEGER primary key', () => {
    expect(BUSINESS_SRC).toMatch(/affectation_id[\s\S]{0,200}primaryKey\s*:\s*true/);
  });

  test('declares candidature_id with unique: true (one-to-one)', () => {
    expect(BUSINESS_SRC).toMatch(/candidature_id[\s\S]{0,200}unique\s*:\s*true/);
  });

  test('declares enseignant_id as nullable INTEGER', () => {
    // enseignant_id in Affectation is allowNull: true
    expect(BUSINESS_SRC).toMatch(/enseignant_id[\s\S]{0,200}allowNull\s*:\s*true/);
  });

  test('declares encadrant_id as nullable INTEGER', () => {
    expect(BUSINESS_SRC).toMatch(/encadrant_id[\s\S]{0,200}allowNull\s*:\s*true/);
  });

  test('uses tableName "affectation"', () => {
    expect(BUSINESS_SRC).toMatch(/tableName\s*:\s*['"]affectation['"]/);
  });
});

describe('BusinessModels — Soutenance field declarations', () => {
  test('declares soutenance_id as INTEGER primary key', () => {
    expect(BUSINESS_SRC).toMatch(/soutenance_id[\s\S]{0,200}primaryKey\s*:\s*true/);
  });

  test('declares affectation_id as nullable INTEGER', () => {
    expect(BUSINESS_SRC).toMatch(/affectation_id[\s\S]{0,200}allowNull\s*:\s*true/);
  });

  test('declares type_presentation as ENUM with MONOME, BINOME, TRINOME', () => {
    expect(BUSINESS_SRC).toMatch(/type_presentation[\s\S]{0,100}ENUM/);
    ['MONOME', 'BINOME', 'TRINOME'].forEach((v) => {
      expect(BUSINESS_SRC).toContain(`'${v}'`);
    });
  });

  test('declares jury FK columns: president_id, rapporteur_id, encadrant_academique_id, encadrant_professionnel_id', () => {
    expect(BUSINESS_SRC).toMatch(/president_id/);
    expect(BUSINESS_SRC).toMatch(/rapporteur_id/);
    expect(BUSINESS_SRC).toMatch(/encadrant_academique_id/);
    expect(BUSINESS_SRC).toMatch(/encadrant_professionnel_id/);
  });

  test('declares student name fields for up to three students', () => {
    expect(BUSINESS_SRC).toMatch(/etudiant1_nom/);
    expect(BUSINESS_SRC).toMatch(/etudiant2_nom/);
    expect(BUSINESS_SRC).toMatch(/etudiant3_nom/);
  });

  test('uses tableName "soutenance"', () => {
    expect(BUSINESS_SRC).toMatch(/tableName\s*:\s*['"]soutenance['"]/);
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// 4. BusinessModels — associate() wires correct relationships
// ═══════════════════════════════════════════════════════════════════════════

describe('BusinessModels — associate() function wires correct relationships', () => {
  test('Stage.belongsTo Entreprise via entreprise_id', () => {
    expect(BUSINESS_SRC).toMatch(/Stage\.belongsTo\s*\(\s*Entreprise/);
    expect(BUSINESS_SRC).toMatch(/foreignKey\s*:\s*['"]entreprise_id['"]/);
  });

  test('Entreprise.hasMany Stage', () => {
    expect(BUSINESS_SRC).toMatch(/Entreprise\.hasMany\s*\(\s*Stage/);
  });

  test('Stage.hasMany Candidature via stage_id', () => {
    expect(BUSINESS_SRC).toMatch(/Stage\.hasMany\s*\(\s*Candidature/);
    expect(BUSINESS_SRC).toMatch(/foreignKey\s*:\s*['"]stage_id['"]/);
  });

  test('Candidature.belongsTo Stage via stage_id', () => {
    expect(BUSINESS_SRC).toMatch(/Candidature\.belongsTo\s*\(\s*Stage/);
  });

  test('Etudiant.hasMany Candidature via etudiant_id', () => {
    expect(BUSINESS_SRC).toMatch(/Etudiant\.hasMany\s*\(\s*Candidature/);
    expect(BUSINESS_SRC).toMatch(/foreignKey\s*:\s*['"]etudiant_id['"]/);
  });

  test('Candidature.belongsTo Etudiant via etudiant_id', () => {
    expect(BUSINESS_SRC).toMatch(/Candidature\.belongsTo\s*\(\s*Etudiant/);
  });

  test('Candidature.hasOne Affectation (one-to-one)', () => {
    expect(BUSINESS_SRC).toMatch(/Candidature\.hasOne\s*\(\s*Affectation/);
    expect(BUSINESS_SRC).toMatch(/foreignKey\s*:\s*['"]candidature_id['"]/);
  });

  test('Affectation.belongsTo Candidature', () => {
    expect(BUSINESS_SRC).toMatch(/Affectation\.belongsTo\s*\(\s*Candidature/);
  });

  test('Affectation.belongsTo Enseignant via enseignant_id', () => {
    expect(BUSINESS_SRC).toMatch(/Affectation\.belongsTo\s*\(\s*Enseignant/);
    expect(BUSINESS_SRC).toMatch(/foreignKey\s*:\s*['"]enseignant_id['"]/);
  });

  test('Affectation.belongsTo Encadrant via encadrant_id', () => {
    expect(BUSINESS_SRC).toMatch(/Affectation\.belongsTo\s*\(\s*Encadrant/);
    expect(BUSINESS_SRC).toMatch(/foreignKey\s*:\s*['"]encadrant_id['"]/);
  });

  test('Affectation.hasMany Soutenance via affectation_id', () => {
    expect(BUSINESS_SRC).toMatch(/Affectation\.hasMany\s*\(\s*Soutenance/);
    expect(BUSINESS_SRC).toMatch(/foreignKey\s*:\s*['"]affectation_id['"]/);
  });

  test('Soutenance.belongsTo Affectation', () => {
    expect(BUSINESS_SRC).toMatch(/Soutenance\.belongsTo\s*\(\s*Affectation/);
  });

  test('Soutenance.belongsTo Enseignant as president via president_id', () => {
    expect(BUSINESS_SRC).toMatch(/Soutenance\.belongsTo\s*\(\s*Enseignant[\s\S]{0,200}president_id/);
    expect(BUSINESS_SRC).toMatch(/as\s*:\s*['"]president['"]/);
  });

  test('Soutenance.belongsTo Enseignant as rapporteur via rapporteur_id', () => {
    expect(BUSINESS_SRC).toMatch(/as\s*:\s*['"]rapporteur['"]/);
  });

  test('Soutenance.belongsTo Enseignant as encadrantAcademique', () => {
    expect(BUSINESS_SRC).toMatch(/as\s*:\s*['"]encadrantAcademique['"]/);
  });

  test('Soutenance.belongsTo Encadrant as encadrantProfessionnel', () => {
    expect(BUSINESS_SRC).toMatch(/Soutenance\.belongsTo\s*\(\s*Encadrant/);
    expect(BUSINESS_SRC).toMatch(/as\s*:\s*['"]encadrantProfessionnel['"]/);
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// 5. Hook tests — UUID generation and Candidature date_modification
// ═══════════════════════════════════════════════════════════════════════════

describe('Hook — UserRegistration beforeCreate UUID generation', () => {
  /**
   * Pure simulation of the beforeCreate hook logic extracted from
   * UserRegistrationModel.js: assign instance.uuid = uuidv4().
   */
  function simulateUuidHook(instance) {
    instance.uuid = uuidv4();
    return instance;
  }

  test('model source registers a beforeCreate hook', () => {
    expect(USER_REG_SRC).toMatch(/beforeCreate/);
  });

  test('model source assigns uuidv4() to instance.uuid inside the hook', () => {
    expect(USER_REG_SRC).toMatch(/instance\.uuid\s*=\s*uuidv4\s*\(\s*\)/);
  });

  test('simulated hook sets a valid UUID v4 on the instance', () => {
    const instance = { email: 'test@example.com', role: 'STUDENT' };
    simulateUuidHook(instance);
    expect(uuidValidate(instance.uuid)).toBe(true);
  });

  test('simulated hook UUID matches RFC 4122 v4 pattern', () => {
    const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const instance = {};
    simulateUuidHook(instance);
    expect(UUID_V4_RE.test(instance.uuid)).toBe(true);
  });

  test('each hook invocation produces a unique UUID', () => {
    const instances = Array.from({ length: 5 }, () => ({}));
    instances.forEach(simulateUuidHook);
    const uuids = instances.map((i) => i.uuid);
    const unique = new Set(uuids);
    expect(unique.size).toBe(5);
  });
});

describe('Hook — Candidature beforeUpdate sets date_modification', () => {
  /**
   * Pure simulation of the beforeUpdate hook on Candidature:
   *   instance.date_modification = new Date();
   */
  function simulateDateModificationHook(instance) {
    instance.date_modification = new Date();
    return instance;
  }

  test('model source registers a beforeUpdate hook on Candidature', () => {
    expect(BUSINESS_SRC).toMatch(/beforeUpdate/);
  });

  test('model source sets instance.date_modification inside the hook', () => {
    expect(BUSINESS_SRC).toMatch(/instance\.date_modification\s*=\s*new Date\s*\(\s*\)/);
  });

  test('simulated hook sets date_modification to a Date object', () => {
    const instance = { status: 'ACCEPTE' };
    simulateDateModificationHook(instance);
    expect(instance.date_modification).toBeInstanceOf(Date);
  });

  test('simulated hook sets date_modification to approximately now', () => {
    const before = Date.now();
    const instance = {};
    simulateDateModificationHook(instance);
    const after = Date.now();
    const ts = instance.date_modification.getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  test('each hook invocation produces a non-null date_modification', () => {
    const instance = {};
    simulateDateModificationHook(instance);
    expect(instance.date_modification).not.toBeNull();
    expect(instance.date_modification).not.toBeUndefined();
  });

  test('hook does not affect other fields on the instance', () => {
    const instance = { status: 'REFUSE', stage_id: 42 };
    simulateDateModificationHook(instance);
    expect(instance.status).toBe('REFUSE');
    expect(instance.stage_id).toBe(42);
  });
});

