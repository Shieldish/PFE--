'use strict';

/**
 * Migration: create-encadrant
 *
 * Creates the encadrant (professional supervisor) table with a foreign key
 * to user_registration. Deleting or updating a user cascades to this table.
 *
 * Note: entreprise_id is added as a nullable INT column without a FK constraint.
 * The FK to entreprise(entreprise_id) will be added in a later migration once
 * the entreprise table exists (circular dependency: encadrant ↔ entreprise).
 *
 * Requirements: 1.3 (supervisor profile), 7.1 (cascade delete), 7.3 (indexes)
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, _Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS encadrant (
        encadrant_id  INT          PRIMARY KEY AUTO_INCREMENT,
        user_id       INT          NOT NULL,
        email         VARCHAR(255) UNIQUE NOT NULL,
        nom           VARCHAR(100) NOT NULL,
        prenom        VARCHAR(100) NOT NULL,
        sexe          ENUM('M', 'F') NOT NULL,
        entreprise_id INT          NULL,
        poste         VARCHAR(100),
        telephone     VARCHAR(20),
        created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id)
            REFERENCES user_registration(user_id)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
        INDEX idx_user_id      (user_id),
        INDEX idx_email        (email),
        INDEX idx_entreprise_id (entreprise_id)
      ) ENGINE=InnoDB
        DEFAULT CHARSET=utf8mb4
        COLLATE=utf8mb4_unicode_ci
        COMMENT='Professional supervisor from industry';
    `);
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS encadrant;
    `);
  },
};
