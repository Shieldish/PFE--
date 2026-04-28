'use strict';

/**
 * Migration: create-enseignant
 *
 * Creates the enseignant (academic teacher/supervisor) table with a foreign key
 * to user_registration. Deleting or updating a user cascades to this table.
 *
 * Requirements: 1.2 (teacher profile), 7.1 (cascade delete), 7.3 (indexes)
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, _Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS enseignant (
        enseignant_id INT          PRIMARY KEY AUTO_INCREMENT,
        user_id       INT          NOT NULL,
        email         VARCHAR(255) UNIQUE NOT NULL,
        nom           VARCHAR(100) NOT NULL,
        prenom        VARCHAR(100) NOT NULL,
        sexe          ENUM('M', 'F') NOT NULL,
        departement   VARCHAR(100) NOT NULL,
        grade         VARCHAR(50),
        telephone     VARCHAR(20),
        created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id)
            REFERENCES user_registration(user_id)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
        INDEX idx_user_id     (user_id),
        INDEX idx_email       (email),
        INDEX idx_departement (departement)
      ) ENGINE=InnoDB
        DEFAULT CHARSET=utf8mb4
        COLLATE=utf8mb4_unicode_ci
        COMMENT='Academic teacher/supervisor information';
    `);
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS enseignant;
    `);
  },
};
