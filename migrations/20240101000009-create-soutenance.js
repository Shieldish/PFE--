'use strict';

/**
 * Migration: create-soutenance
 *
 * Creates the soutenance (defense presentation) table with foreign keys to
 * affectation (SET NULL), enseignant (SET NULL x3), and encadrant (SET NULL).
 *
 * Student information is stored directly on the record for flexibility,
 * allowing manual entry independent of the affectation link.
 *
 * Jury members:
 *   - president_id            : references enseignant
 *   - rapporteur_id           : references enseignant
 *   - encadrant_academique_id : references enseignant
 *   - encadrant_professionnel_id : references encadrant
 *
 * Indexes:
 *   - idx_affectation_id    : fast lookup by assignment
 *   - idx_date_soutenance   : fast lookup by defense date
 *   - idx_type_presentation : fast lookup by presentation type
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.6, 7.1, 7.3, 7.4
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, _Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS soutenance (
        soutenance_id              INT          PRIMARY KEY AUTO_INCREMENT,
        affectation_id             INT,
        date_soutenance            DATE         NOT NULL,
        heure_soutenance           TIME         NOT NULL,
        salle                      VARCHAR(100) NOT NULL,
        type_presentation          ENUM('MONOME', 'BINOME', 'TRINOME') NOT NULL,

        etudiant1_nom              VARCHAR(100) NOT NULL,
        etudiant1_prenom           VARCHAR(100) NOT NULL,
        etudiant2_nom              VARCHAR(100),
        etudiant2_prenom           VARCHAR(100),
        etudiant3_nom              VARCHAR(100),
        etudiant3_prenom           VARCHAR(100),

        president_id               INT,
        rapporteur_id              INT,
        encadrant_academique_id    INT,
        encadrant_professionnel_id INT,

        sujet                      TEXT         NOT NULL,
        entreprise_nom             VARCHAR(200),
        notes                      TEXT,
        created_at                 TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        updated_at                 TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        FOREIGN KEY (affectation_id)
            REFERENCES affectation(affectation_id)
            ON DELETE SET NULL
            ON UPDATE CASCADE,
        FOREIGN KEY (president_id)
            REFERENCES enseignant(enseignant_id)
            ON DELETE SET NULL
            ON UPDATE CASCADE,
        FOREIGN KEY (rapporteur_id)
            REFERENCES enseignant(enseignant_id)
            ON DELETE SET NULL
            ON UPDATE CASCADE,
        FOREIGN KEY (encadrant_academique_id)
            REFERENCES enseignant(enseignant_id)
            ON DELETE SET NULL
            ON UPDATE CASCADE,
        FOREIGN KEY (encadrant_professionnel_id)
            REFERENCES encadrant(encadrant_id)
            ON DELETE SET NULL
            ON UPDATE CASCADE,

        INDEX idx_affectation_id    (affectation_id),
        INDEX idx_date_soutenance   (date_soutenance),
        INDEX idx_type_presentation (type_presentation)
      ) ENGINE=InnoDB
        DEFAULT CHARSET=utf8mb4
        COLLATE=utf8mb4_unicode_ci
        COMMENT='Defense presentation scheduling';
    `);
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS soutenance;
    `);
  },
};
