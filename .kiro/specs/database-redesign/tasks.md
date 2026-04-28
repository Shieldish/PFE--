# Implementation Plan: Database Redesign

## Overview

This implementation plan converts the database redesign specification into actionable coding tasks. The plan follows an incremental approach, starting with core authentication tables, then user type tables, business logic tables, and finally integration with the existing application. Each task builds on previous steps and includes testing to ensure data integrity and proper cascading operations.

## Tasks

- [x] 1. Set up database migration infrastructure
  - Create migration scripts directory structure
  - Set up Sequelize migration configuration
  - Create rollback scripts for each migration
  - _Requirements: 10.5, 10.6_

- [x] 2. Implement core authentication table
  - [x] 2.1 Create user_registration table migration
    - Write SQL migration script for user_registration table
    - Implement UUID generation and unique email constraint
    - Add proper indexes on email and role columns
    - _Requirements: 1.1, 1.7, 9.1, 9.2_
  
  - [x] 2.2 Write unit tests for user_registration constraints
    - Test unique email constraint enforcement
    - Test role enum validation
    - Test UUID generation and uniqueness
    - _Requirements: 1.7_

- [x] 3. Implement user type tables
  - [x] 3.1 Create etudiant table migration
    - Write SQL migration script for etudiant table
    - Implement foreign key to user_registration with CASCADE
    - Add proper indexes on user_id and uuid
    - _Requirements: 2.1, 2.2, 2.5, 7.1, 7.3_
  
  - [x] 3.2 Create enseignant table migration
    - Write SQL migration script for enseignant table
    - Implement foreign key to user_registration with CASCADE
    - Add proper indexes on user_id and email
    - _Requirements: 1.2, 7.1, 7.3_
  
  - [x] 3.3 Create encadrant table migration
    - Write SQL migration script for encadrant table
    - Implement foreign key to user_registration with CASCADE
    - Add proper indexes on user_id and email
    - _Requirements: 1.3, 7.1, 7.3_
  
  - [x] 3.4 Create entreprise table migration
    - Write SQL migration script for entreprise table
    - Implement foreign key to user_registration with CASCADE
    - Add proper indexes on user_id, email, domaine, and ville
    - _Requirements: 3.1, 3.2, 7.1, 7.3, 9.2_
  
  - [x] 3.5 Write integration tests for user type relationships
    - Test CASCADE delete from user_registration to user type tables
    - Test foreign key constraint enforcement
    - Test unique email constraints across tables
    - _Requirements: 1.6, 7.3, 7.4_

- [x] 4. Checkpoint - Validate core tables
  - Ensure all migrations run successfully
  - Verify foreign key constraints are properly defined
  - Test basic CRUD operations on all tables
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement business logic tables
  - [x] 5.1 Create stage table migration
    - Write SQL migration script for stage table
    - Implement foreign key to entreprise with CASCADE
    - Add full-text index on titre and description
    - Add proper indexes on domaine, niveau_requis, is_active, and date_debut
    - _Requirements: 3.4, 7.1, 7.3, 9.2, 9.3, 9.6_
  
  - [x] 5.2 Create candidature table migration
    - Write SQL migration script for candidature table
    - Implement foreign keys to stage and etudiant with CASCADE
    - Add unique constraint on (stage_id, etudiant_id)
    - Implement snapshot columns for student information
    - Add proper indexes on stage_id, etudiant_id, status, and date_postulation
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 7.1, 7.3, 8.1, 8.3_
  
  - [x] 5.3 Create affectation table migration
    - Write SQL migration script for affectation table
    - Implement foreign keys to candidature (CASCADE), enseignant (SET NULL), and encadrant (SET NULL)
    - Add unique constraint on candidature_id
    - Add proper indexes on candidature_id, enseignant_id, and encadrant_id
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 7.1, 7.3, 7.4_
  
  - [x] 5.4 Create soutenance table migration
    - Write SQL migration script for soutenance table
    - Implement foreign keys to affectation (SET NULL), enseignant (SET NULL), and encadrant (SET NULL)
    - Add proper indexes on affectation_id, date_soutenance, and type_presentation
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6, 7.1, 7.3, 7.4_
  
  - [x] 5.5 Write integration tests for business logic relationships
    - Test CASCADE delete from stage to candidature
    - Test CASCADE delete from etudiant to candidature
    - Test SET NULL behavior for optional relationships
    - Test unique constraint enforcement on candidature
    - _Requirements: 3.6, 4.7, 5.4, 6.6, 7.3, 7.4, 7.6_

- [x] 6. Checkpoint - Validate business logic tables
  - Ensure all business logic migrations run successfully
  - Verify cascading operations work as designed
  - Test complex joins between related tables
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement Sequelize models
  - [x] 7.1 Create user_registration Sequelize model
    - Define model with proper data types and constraints
    - Implement hooks for UUID generation
    - Add model associations for user type tables
    - _Requirements: 10.7_
  
  - [x] 7.2 Create user type Sequelize models
    - Define etudiant, enseignant, encadrant, and entreprise models
    - Implement proper associations to user_registration
    - Add validation for required fields
    - _Requirements: 10.7_
  
  - [x] 7.3 Create business logic Sequelize models
    - Define stage, candidature, affectation, and soutenance models
    - Implement proper associations between tables
    - Add validation for business rules
    - _Requirements: 10.7_
  
  - [x] 7.4 Write unit tests for Sequelize models
    - Test model validation and constraints
    - Test association methods
    - Test hook functionality (UUID generation, timestamps)
    - _Requirements: 10.7_

- [x] 8. Implement data migration from old schema
  - [x] 8.1 Create data migration script for user_registration
    - Migrate users from old user tables to new user_registration
    - Generate UUIDs for existing users
    - Preserve email uniqueness and passwords
    - _Requirements: 8.4, 10.5_
  
  - [x] 8.2 Create data migration script for user type tables
    - Migrate student data to etudiant table
    - Migrate teacher data to enseignant table
    - Migrate supervisor data to encadrant table
    - Migrate company data to entreprise table
    - _Requirements: 8.4, 10.5_
  
  - [x] 8.3 Create data migration script for business logic tables
    - Migrate stage data with proper foreign keys
    - Migrate candidature data with snapshot information
    - Migrate affectation data with proper relationships
    - Migrate soutenance data with jury information
    - _Requirements: 8.4, 10.5_
  
  - [x] 8.4 Write validation tests for data migration
    - Test data integrity after migration
    - Test foreign key relationships are preserved
    - Test no data loss during migration
    - _Requirements: 8.4, 10.5_

- [x] 9. Update application code to use new schema
  - [x] 9.1 Update authentication middleware
    - Modify auth middleware to use user_registration table
    - Update role checking to use new role enum
    - Ensure backward compatibility during transition
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [x] 9.2 Update user management routes
    - Modify user registration to create user_registration record
    - Update user profile routes to use new tables
    - Ensure proper error handling for constraint violations
    - _Requirements: 2.1, 2.2, 3.1, 3.2_
  
  - [x] 9.3 Update internship management routes
    - Modify stage creation to use new schema
    - Update candidature submission to use new tables
    - Ensure proper cascading operations in application logic
    - _Requirements: 3.3, 3.4, 4.1, 4.2, 4.3_
  
  - [x] 9.4 Update supervisor assignment routes
    - Modify affectation creation to use new schema
    - Update soutenance scheduling to use new tables
    - Ensure proper handling of NULL supervisor values
    - _Requirements: 5.1, 5.2, 5.3, 6.1, 6.2, 6.3_
  
  - [x] 9.5 Write integration tests for updated routes
    - Test authentication with new user_registration table
    - Test stage creation and candidature submission
    - Test supervisor assignment and soutenance scheduling
    - Test error handling for constraint violations
    - _Requirements: 7.6, 9.7_

- [x] 10. Final checkpoint - Complete integration
  - Run full test suite including all migrations
  - Verify data integrity across all tables
  - Test performance of common queries with new indexes
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and catch issues early
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end workflows and cascading operations
- Data migration scripts must be idempotent and reversible
- The implementation uses MySQL 8.0+ with InnoDB engine for foreign key support
- All foreign key relationships include appropriate ON DELETE and ON UPDATE actions
- Proper indexing is implemented for performance optimization