'use strict';

/**
 * Migration: create-candidature
 *
 * Creates the candidature (internship application) table with foreign keys to
 * stage and etudiant. Deleting or updating either parent cascades to this table.
 *
 * Snapshot columns capture student information at application time so that
 * subsequent profile updates do not alter historical application data.
 *
 * Indexes:
 *   - idx_stage_id        : fast lookup by internship
 *   - idx_etudiant_id     : fast lookup by student
 *   - idx_status          : filter by application status
 *   - idx_date_postulation: sort/filter by application date
 *
 * Unique constraint:
 *   - uk_stage_etudiant   : prevents duplicate applications (same student, same internship)
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 7.1, 7.3, 8.1, 8.3
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, _Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS candidature (
        candidature_id          INT          PRIMARY KEY AUTO_INCREMENT,
        stage_id                INT          NOT NULL,
        etudiant_id             INT          NOT NULL,
        status                  ENUM('EN_ATTENTE', 'ACCEPTE', 'REFUSE', 'ANNULE') DEFAULT 'EN_ATTENTE',

        -- Snapshot of student information at application time
        etudiant_nom            VARCHAR(100) NOT NULL,
        etudiant_prenom         VARCHAR(100) NOT NULL,
        etudiant_email          VARCHAR(255) NOT NULL,
        etudiant_departement    VARCHAR(100) NOT NULL,
        etudiant_specialite     VARCHAR(100) NOT NULL,

        -- Application documents
        cv_path                 VARCHAR(500),
        lettre_motivation_path  VARCHAR(500),
        releves_notes_path      VARCHAR(500),

        motivation_letter       TEXT,
        date_postulation        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        date_modification       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        FOREIGN KEY (stage_id)
            REFERENCES stage(stage_id)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
        FOREIGN KEY (etudiant_id)
            REFERENCES etudiant(etudiant_id)
            ON DELETE CASCADE
            ON UPDATE CASCADE,

        UNIQUE KEY uk_stage_etudiant (stage_id, etudiant_id),
        INDEX idx_stage_id         (stage_id),
        INDEX idx_etudiant_id      (etudiant_id),
        INDEX idx_status           (status),
        INDEX idx_date_postulation (date_postulation)
      ) ENGINE=InnoDB
        DEFAULT CHARSET=utf8mb4
        COLLATE=utf8mb4_unicode_ci
        COMMENT='Student application for internship';
    `);
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS candidature;
    `);
  },
};
