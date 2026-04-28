-- ============================================================
-- SCHEMA MIGRATION — Gestion des Stages
-- Full redesign with proper FKs, CASCADE, normalized tables
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ── 1. user_registrations — central auth table (keep, add UNIQUE on EMAIL) ──
ALTER TABLE user_registrations
  MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT,
  MODIFY COLUMN UUID VARCHAR(36) NOT NULL,
  MODIFY COLUMN EMAIL VARCHAR(255) NOT NULL,
  ADD UNIQUE KEY uq_user_email (EMAIL);

-- ── 2. Recreate enseignant with FK to user_registrations ──
DROP TABLE IF EXISTS enseignant;
CREATE TABLE enseignant (
  id          INT          NOT NULL AUTO_INCREMENT,
  user_id     INT          NULL COMMENT 'FK to user_registrations (optional, for portal login)',
  email       VARCHAR(255) NOT NULL UNIQUE,
  nom         VARCHAR(100) NOT NULL,
  prenom      VARCHAR(100) NOT NULL,
  sexe        ENUM('M','F') NULL,
  departement VARCHAR(100) NULL,
  date_naissance DATE       NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_enseignant_user FOREIGN KEY (user_id)
    REFERENCES user_registrations(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 3. Recreate encadrant with FK to user_registrations ──
DROP TABLE IF EXISTS encadrant;
CREATE TABLE encadrant (
  id          INT          NOT NULL AUTO_INCREMENT,
  user_id     INT          NULL,
  email       VARCHAR(255) NOT NULL UNIQUE,
  nom         VARCHAR(100) NOT NULL,
  prenom      VARCHAR(100) NOT NULL,
  sexe        ENUM('M','F') NULL,
  departement VARCHAR(100) NULL,
  entreprise_nom VARCHAR(255) NULL,
  date_naissance DATE       NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_encadrant_user FOREIGN KEY (user_id)
    REFERENCES user_registrations(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 4. Recreate etudiant with FK to user_registrations ──
DROP TABLE IF EXISTS etudiant;
CREATE TABLE etudiant (
  id          INT          NOT NULL AUTO_INCREMENT,
  user_id     INT          NULL,
  uuid        VARCHAR(36)  NOT NULL UNIQUE,
  email       VARCHAR(255) NOT NULL UNIQUE,
  nom         VARCHAR(100) NOT NULL,
  prenom      VARCHAR(100) NOT NULL,
  sexe        ENUM('M','F') NULL,
  departement VARCHAR(100) NULL,
  specialite  VARCHAR(100) NULL,
  date_naissance DATE       NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_etudiant_user FOREIGN KEY (user_id)
    REFERENCES user_registrations(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 5. Recreate entreprise with FK to user_registrations ──
DROP TABLE IF EXISTS entreprise;
CREATE TABLE entreprise (
  id          INT          NOT NULL AUTO_INCREMENT,
  user_id     INT          NULL,
  email       VARCHAR(255) NOT NULL UNIQUE,
  nom         VARCHAR(255) NOT NULL,
  domaine     VARCHAR(100) NULL,
  ville       VARCHAR(100) NULL,
  adresse     VARCHAR(255) NULL,
  telephone   VARCHAR(30)  NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_entreprise_user FOREIGN KEY (user_id)
    REFERENCES user_registrations(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 6. Recreate stage with FK to entreprise ──
DROP TABLE IF EXISTS stage;
CREATE TABLE stage (
  id            VARCHAR(36)  NOT NULL,
  entreprise_id INT          NULL COMMENT 'FK to entreprise',
  created_by    VARCHAR(255) NOT NULL COMMENT 'email of creator (denormalized for display)',
  titre         VARCHAR(255) NOT NULL,
  domaine       VARCHAR(100) NOT NULL,
  nom_entreprise VARCHAR(255) NOT NULL,
  libelle       TEXT         NOT NULL,
  description   TEXT         NULL,
  niveau        VARCHAR(50)  NOT NULL,
  experience    VARCHAR(50)  NOT NULL,
  langue        VARCHAR(50)  NOT NULL,
  postes_vacants SMALLINT    NOT NULL DEFAULT 1,
  telephone     VARCHAR(30)  NULL,
  fax           VARCHAR(30)  NULL,
  email         VARCHAR(255) NULL,
  email2        VARCHAR(255) NULL,
  date_debut    DATE         NOT NULL,
  date_fin      DATE         NOT NULL,
  adresse       VARCHAR(255) NULL,
  rue           VARCHAR(255) NULL,
  ville         VARCHAR(100) NULL,
  code_postal   VARCHAR(20)  NULL,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_stage_entreprise (entreprise_id),
  KEY idx_stage_domaine (domaine),
  KEY idx_stage_niveau (niveau),
  CONSTRAINT fk_stage_entreprise FOREIGN KEY (entreprise_id)
    REFERENCES entreprise(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 7. Drop old redundant tables ──
DROP TABLE IF EXISTS stagepostulation;
DROP TABLE IF EXISTS candidature;

-- ── 8. New unified candidature table ──
CREATE TABLE candidature (
  id                    INT          NOT NULL AUTO_INCREMENT,
  stage_id              VARCHAR(36)  NOT NULL,
  etudiant_id           INT          NOT NULL,
  status                ENUM('en_attente','accepte','refuse') NOT NULL DEFAULT 'en_attente',
  -- Personal info snapshot at time of application
  nom                   VARCHAR(100) NOT NULL,
  prenom                VARCHAR(100) NOT NULL,
  date_naissance        DATE         NULL,
  adresse               VARCHAR(255) NULL,
  telephone             VARCHAR(30)  NULL,
  email                 VARCHAR(255) NOT NULL,
  -- Academic info
  niveau_etudes         VARCHAR(100) NOT NULL,
  institution           VARCHAR(255) NOT NULL,
  domaine_etudes        VARCHAR(100) NOT NULL,
  section               VARCHAR(100) NULL,
  annee_obtention       YEAR         NULL,
  -- Experience & motivation
  has_experience        TINYINT(1)   NOT NULL DEFAULT 0,
  experience_description TEXT        NULL,
  motivation            TEXT         NULL,
  -- Skills
  langues               VARCHAR(255) NULL,
  logiciels             VARCHAR(255) NULL,
  competences_autres    VARCHAR(255) NULL,
  -- Availability
  date_debut_souhaitee  DATE         NULL,
  duree_stage_mois      TINYINT      NULL,
  -- Documents (Google Drive links)
  cv_url                VARCHAR(500) NULL,
  lettre_motivation_url VARCHAR(500) NULL,
  releves_notes_url     VARCHAR(500) NULL,
  -- Timestamps
  postule_le            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_candidature (stage_id, etudiant_id),
  KEY idx_candidature_etudiant (etudiant_id),
  KEY idx_candidature_status (status),
  CONSTRAINT fk_candidature_stage FOREIGN KEY (stage_id)
    REFERENCES stage(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_candidature_etudiant FOREIGN KEY (etudiant_id)
    REFERENCES etudiant(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 9. New affectation table (encadrant + enseignant assigned to a candidature) ──
CREATE TABLE affectation (
  id              INT  NOT NULL AUTO_INCREMENT,
  candidature_id  INT  NOT NULL,
  enseignant_id   INT  NULL COMMENT 'Academic supervisor',
  encadrant_id    INT  NULL COMMENT 'Professional supervisor',
  date_affectation DATE NULL,
  notes           TEXT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_affectation (candidature_id),
  KEY idx_affectation_enseignant (enseignant_id),
  KEY idx_affectation_encadrant (encadrant_id),
  CONSTRAINT fk_affectation_candidature FOREIGN KEY (candidature_id)
    REFERENCES candidature(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_affectation_enseignant FOREIGN KEY (enseignant_id)
    REFERENCES enseignant(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_affectation_encadrant FOREIGN KEY (encadrant_id)
    REFERENCES encadrant(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 10. Recreate soutenance with FKs ──
DROP TABLE IF EXISTS soutenance;
CREATE TABLE soutenance (
  id                      INT          NOT NULL AUTO_INCREMENT,
  affectation_id          INT          NULL COMMENT 'FK to affectation (optional)',
  date_soutenance         DATE         NOT NULL,
  heure                   TIME         NOT NULL,
  salle                   VARCHAR(50)  NOT NULL,
  groupe                  VARCHAR(50)  NULL,
  type_groupe             ENUM('Monome','Binome','Trinome') NOT NULL DEFAULT 'Monome',
  -- Students (names stored for display; FKs optional since soutenance can be manual)
  etudiant1_nom           VARCHAR(255) NOT NULL,
  etudiant2_nom           VARCHAR(255) NULL,
  etudiant3_nom           VARCHAR(255) NULL,
  sujet                   TEXT         NOT NULL,
  -- Jury (FK to enseignant)
  president_id            INT          NULL,
  rapporteur_id           INT          NULL,
  encadrant_academique_id INT          NULL,
  -- Denormalized for display
  encadrant_professionnel VARCHAR(255) NULL,
  entreprise_nom          VARCHAR(255) NULL,
  created_at              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_soutenance_date (date_soutenance),
  KEY idx_soutenance_affectation (affectation_id),
  CONSTRAINT fk_soutenance_affectation FOREIGN KEY (affectation_id)
    REFERENCES affectation(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_soutenance_president FOREIGN KEY (president_id)
    REFERENCES enseignant(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_soutenance_rapporteur FOREIGN KEY (rapporteur_id)
    REFERENCES enseignant(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_soutenance_encadrant_acad FOREIGN KEY (encadrant_academique_id)
    REFERENCES enseignant(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
