'use strict';

/**
 * Migration: create-user-registration
 *
 * Creates the central authentication table for all user types.
 * This is the root table in the schema — all user type tables
 * (etudiant, enseignant, encadrant, entreprise) reference it.
 *
 * Requirements: 1.1 (central auth), 1.7 (unique email), 9.1 (FK indexes), 9.2 (email/role indexes)
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Use raw SQL for full MySQL feature support (ENUM, ON UPDATE, UUID default, FULLTEXT, etc.)
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS user_registration (
        user_id   INT          PRIMARY KEY AUTO_INCREMENT,
        uuid      VARCHAR(36)  UNIQUE NOT NULL DEFAULT (UUID()),
        email     VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role      ENUM('STUDENT', 'TEACHER', 'SUPERVISOR', 'COMPANY', 'ADMIN') NOT NULL,
        is_active BOOLEAN      DEFAULT TRUE,
        created_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_role  (role)
      ) ENGINE=InnoDB
        DEFAULT CHARSET=utf8mb4
        COLLATE=utf8mb4_unicode_ci
        COMMENT='Central authentication table for all users';
    `);
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS user_registration;
    `);
  },
};
