'use strict';

/**
 * Migration: create-stage
 *
 * Creates the stage (internship opportunity) table with a foreign key to
 * entreprise. Deleting or updating an entreprise cascades to this table.
 *
 * Indexes:
 *   - idx_entreprise_id  : fast lookup by company
 *   - idx_domaine        : filter by field/domain
 *   - idx_niveau_requis  : filter by required education level
 *   - idx_is_active      : filter active/inactive listings
 *   - idx_date_debut     : sort/filter by start date
 *   - idx_ft_description : full-text search on titre + description
 *
 * Requirements: 3.4, 7.1, 7.3, 9.2, 9.3, 9.6
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, _Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS stage (
        stage_id            INT          PRIMARY KEY AUTO_INCREMENT,
        entreprise_id       INT          NOT NULL,
        titre               VARCHAR(200) NOT NULL,
        domaine             VARCHAR(100) NOT NULL,
        description         TEXT         NOT NULL,
        niveau_requis       ENUM('LICENCE', 'MASTER', 'DOCTORAT', 'AUTRE') NOT NULL,
        experience_requise  VARCHAR(100),
        langue_requise      VARCHAR(100),
        postes_vacants      INT          DEFAULT 1,
        date_debut          DATE         NOT NULL,
        date_fin            DATE         NOT NULL,
        adresse             TEXT         NOT NULL,
        ville               VARCHAR(100) NOT NULL,
        code_postal         VARCHAR(20),
        contact_email       VARCHAR(255) NOT NULL,
        contact_telephone   VARCHAR(20)  NOT NULL,
        is_active           BOOLEAN      DEFAULT TRUE,
        created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        updated_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (entreprise_id)
            REFERENCES entreprise(entreprise_id)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
        INDEX idx_entreprise_id (entreprise_id),
        INDEX idx_domaine       (domaine),
        INDEX idx_niveau_requis (niveau_requis),
        INDEX idx_is_active     (is_active),
        INDEX idx_date_debut    (date_debut),
        FULLTEXT idx_ft_description (titre, description)
      ) ENGINE=InnoDB
        DEFAULT CHARSET=utf8mb4
        COLLATE=utf8mb4_unicode_ci
        COMMENT='Internship opportunity details';
    `);
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS stage;
    `);
  },
};
