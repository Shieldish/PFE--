'use strict';

/**
 * Migration: create-affectation
 *
 * Creates the affectation (supervisor assignment) table with foreign keys to
 * candidature (CASCADE), enseignant (SET NULL), and encadrant (SET NULL).
 *
 * Each accepted candidature can have at most one affectation record, enforced
 * by the unique constraint on candidature_id.
 *
 * Indexes:
 *   - idx_candidature_id : fast lookup by application
 *   - idx_enseignant_id  : fast lookup by academic supervisor
 *   - idx_encadrant_id   : fast lookup by professional supervisor
 *
 * Unique constraint:
 *   - uk_candidature     : one assignment per candidature
 *
 * Requirements: 5.1, 5.2, 5.3, 5.5, 7.1, 7.3, 7.4
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, _Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS affectation (
        affectation_id   INT       PRIMARY KEY AUTO_INCREMENT,
        candidature_id   INT       NOT NULL,
        enseignant_id    INT,
        encadrant_id     INT,
        date_affectation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes            TEXT,
        created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        FOREIGN KEY (candidature_id)
            REFERENCES candidature(candidature_id)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
        FOREIGN KEY (enseignant_id)
            REFERENCES enseignant(enseignant_id)
            ON DELETE SET NULL
            ON UPDATE CASCADE,
        FOREIGN KEY (encadrant_id)
            REFERENCES encadrant(encadrant_id)
            ON DELETE SET NULL
            ON UPDATE CASCADE,

        UNIQUE KEY uk_candidature    (candidature_id),
        INDEX idx_candidature_id     (candidature_id),
        INDEX idx_enseignant_id      (enseignant_id),
        INDEX idx_encadrant_id       (encadrant_id)
      ) ENGINE=InnoDB
        DEFAULT CHARSET=utf8mb4
        COLLATE=utf8mb4_unicode_ci
        COMMENT='Supervisor assignment for accepted candidatures';
    `);
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS affectation;
    `);
  },
};
