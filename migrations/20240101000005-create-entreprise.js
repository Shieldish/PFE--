'use strict';

/**
 * Migration: create-entreprise
 *
 * Creates the entreprise (company/organization) table with a foreign key
 * to user_registration. Deleting or updating a user cascades to this table.
 *
 * After creating entreprise, this migration also adds the previously deferred
 * FK constraint on encadrant.entreprise_id (which was intentionally omitted in
 * migration 20240101000004 to avoid a circular dependency).
 *
 * Requirements: 3.1, 3.2, 7.1, 7.3, 9.2
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, _Sequelize) {
    // 1. Create the entreprise table
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS entreprise (
        entreprise_id INT          PRIMARY KEY AUTO_INCREMENT,
        user_id       INT          NOT NULL,
        nom           VARCHAR(200) NOT NULL,
        domaine       VARCHAR(100) NOT NULL,
        ville         VARCHAR(100) NOT NULL,
        adresse       TEXT         NOT NULL,
        telephone     VARCHAR(20)  NOT NULL,
        email         VARCHAR(255) UNIQUE NOT NULL,
        site_web      VARCHAR(255),
        created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id)
            REFERENCES user_registration(user_id)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_email   (email),
        INDEX idx_domaine (domaine),
        INDEX idx_ville   (ville)
      ) ENGINE=InnoDB
        DEFAULT CHARSET=utf8mb4
        COLLATE=utf8mb4_unicode_ci
        COMMENT='Company/organization offering internships';
    `);

    // 2. Add the deferred FK from encadrant.entreprise_id → entreprise(entreprise_id)
    //    This constraint was intentionally omitted in migration 000004 because
    //    entreprise did not yet exist at that point.
    await queryInterface.sequelize.query(`
      ALTER TABLE encadrant
        ADD CONSTRAINT fk_encadrant_entreprise
        FOREIGN KEY (entreprise_id)
            REFERENCES entreprise(entreprise_id)
            ON DELETE SET NULL
            ON UPDATE CASCADE;
    `);
  },

  async down(queryInterface, _Sequelize) {
    // 1. Drop the FK from encadrant first (child constraint must go before parent table)
    await queryInterface.sequelize.query(`
      ALTER TABLE encadrant
        DROP FOREIGN KEY fk_encadrant_entreprise;
    `);

    // 2. Drop the entreprise table
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS entreprise;
    `);
  },
};
