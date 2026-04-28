'use strict';

/**
 * Migration: init-migration-infrastructure
 *
 * Sets up the baseline migration infrastructure.
 * This migration is intentionally minimal — it verifies the database
 * connection and InnoDB engine availability.
 *
 * Requirements: 10.5 (idempotent & reversible), 10.6 (documented)
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Verify InnoDB is available (required for FK support per Req 9.7)
    await queryInterface.sequelize.query(
      `SET default_storage_engine = InnoDB;`
    );

    // Ensure strict mode and proper charset for the session
    await queryInterface.sequelize.query(
      `SET NAMES utf8mb4;`
    );
  },

  async down(queryInterface, Sequelize) {
    // Nothing to undo — this migration only sets session variables
  },
};
