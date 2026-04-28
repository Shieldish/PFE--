# Requirements Document

## Introduction

This document specifies the requirements for redesigning the database schema of the Gestion des Stages (Internship Management Platform). The current database structure has issues with foreign key relationships, data normalization, and cascading operations. This redesign aims to create a properly normalized, well-structured database schema with clear relationships and efficient joins.

## Glossary

- **System**: The Gestion des Stages database system
- **User_Registration**: Central authentication table for all platform users
- **Enseignant**: Academic teacher/supervisor
- **Encadrant**: Professional supervisor from industry
- **Etudiant**: Student user
- **Entreprise**: Company/organization offering internships
- **Stage**: Internship opportunity
- **Candidature**: Student application for an internship
- **Affectation**: Assignment of supervisors to a candidature
- **Soutenance**: Defense presentation for completed internship
- **FK**: Foreign Key constraint
- **CASCADE**: Database operation that propagates changes to related records
- **Normalization**: Database design technique to reduce redundancy

## Requirements

### Requirement 1: Central User Authentication

**User Story:** As a system administrator, I want a centralized user authentication system, so that all user types share common authentication data and permissions.

#### Acceptance Criteria

1. THE User_Registration SHALL store authentication credentials for all user types
2. WHERE a user is an Enseignant, THE System SHALL create a corresponding Enseignant record linked to User_Registration
3. WHERE a user is an Encadrant, THE System SHALL create a corresponding Encadrant record linked to User_Registration
4. WHERE a user is an Etudiant, THE System SHALL create a corresponding Etudiant record linked to User_Registration
5. WHERE a user is an Entreprise, THE System SHALL create a corresponding Entreprise record linked to User_Registration
6. WHEN a User_Registration record is deleted, THE System SHALL set the corresponding user type record's foreign key to NULL
7. THE System SHALL enforce unique email addresses across all user types

### Requirement 2: Student Management

**User Story:** As an administrator, I want to manage student information, so that I can track student profiles and their internship applications.

#### Acceptance Criteria

1. THE Etudiant SHALL store student academic and personal information
2. THE Etudiant SHALL reference User_Registration for authentication
3. WHEN an Etudiant record is deleted, THE System SHALL delete all associated Candidature records
4. THE System SHALL enforce unique student email addresses
5. THE System SHALL maintain a UUID for each student for external reference

### Requirement 3: Company and Internship Management

**User Story:** As a company representative, I want to create and manage internship opportunities, so that students can apply for relevant positions.

#### Acceptance Criteria

1. THE Entreprise SHALL store company information
2. THE Entreprise SHALL reference User_Registration for authentication
3. THE Stage SHALL store internship opportunity details
4. THE Stage SHALL reference Entreprise as the offering company
5. WHEN an Entreprise record is deleted, THE System SHALL set the corresponding Stage foreign key to NULL
6. WHEN a Stage record is deleted, THE System SHALL delete all associated Candidature records
7. THE System SHALL support multiple internship postings per company
8. THE System SHALL track internship status (active/inactive)

### Requirement 4: Internship Application Process

**User Story:** As a student, I want to apply for internships, so that I can be considered for available positions.

#### Acceptance Criteria

1. THE Candidature SHALL store student applications for internships
2. THE Candidature SHALL reference both Stage and Etudiant
3. THE System SHALL prevent duplicate applications (same student to same internship)
4. WHEN a Candidature is created, THE System SHALL capture a snapshot of student information at that time
5. THE Candidature SHALL track application status (en_attente, accepte, refuse)
6. THE Candidature SHALL store application documents (CV, motivation letter, transcripts)
7. WHEN a Candidature is deleted, THE System SHALL delete associated Affectation records
8. THE System SHALL support filtering applications by status

### Requirement 5: Supervisor Assignment

**User Story:** As an administrator, I want to assign supervisors to accepted internship applications, so that students have proper guidance during their internships.

#### Acceptance Criteria

1. THE Affectation SHALL store supervisor assignments for candidatures
2. THE Affectation SHALL reference Candidature, Enseignant (academic supervisor), and Encadrant (professional supervisor)
3. EACH Candidature SHALL have at most one Affectation record
4. WHEN an Affectation is deleted, THE System SHALL not delete the associated Candidature
5. THE System SHALL allow NULL values for supervisors when assignments are pending
6. THE Affectation SHALL store assignment date and notes

### Requirement 6: Defense Presentation Management

**User Story:** As an administrator, I want to schedule defense presentations for completed internships, so that students can present their work.

#### Acceptance Criteria

1. THE Soutenance SHALL store defense presentation details
2. THE Soutenance SHALL optionally reference Affectation for context
3. THE Soutenance SHALL store jury members (President, Rapporteur, Academic Supervisor)
4. THE Soutenance SHALL reference Enseignant records for jury members
5. THE Soutenance SHALL support individual and group presentations (Monome, Binome, Trinome)
6. WHEN a Soutenance is deleted, THE System SHALL not delete associated Affectation or Candidature records
7. THE System SHALL allow manual entry of student names for flexibility
8. THE System SHALL track presentation date, time, and location

### Requirement 7: Foreign Key Relationships and Cascading

**User Story:** As a database administrator, I want proper foreign key relationships with cascading operations, so that data integrity is maintained and operations are predictable.

#### Acceptance Criteria

1. ALL foreign key relationships SHALL be explicitly defined in the database schema
2. WHEN defining foreign keys, THE System SHALL specify appropriate ON DELETE and ON UPDATE actions
3. FOR parent-child relationships (e.g., Stage to Candidature), THE System SHALL use CASCADE ON DELETE
4. FOR optional relationships (e.g., User_Registration to user type tables), THE System SHALL use SET NULL ON DELETE
5. ALL foreign key constraints SHALL include ON UPDATE CASCADE for referential integrity
6. THE System SHALL prevent orphaned records through proper constraint design
7. ALL joins between related tables SHALL use indexed foreign keys for performance

### Requirement 8: Data Normalization and Redundancy Reduction

**User Story:** As a developer, I want a normalized database schema, so that data redundancy is minimized and updates are consistent.

#### Acceptance Criteria

1. THE System SHALL eliminate duplicate student information in Candidature and StagePostulation tables
2. WHERE possible, THE System SHALL reference existing records instead of duplicating data
3. THE System SHALL store snapshots of mutable data at application time (e.g., student info in Candidature)
4. THE System SHALL remove the redundant StagePostulation table in favor of unified Candidature
5. ALL derived or calculable data SHALL not be stored redundantly
6. THE System SHALL use appropriate data types and constraints for each field

### Requirement 9: Database Performance and Indexing

**User Story:** As a system architect, I want efficient database queries, so that the application performs well under load.

#### Acceptance Criteria

1. ALL foreign key columns SHALL be indexed
2. THE System SHALL create indexes on frequently queried columns (status, dates, email)
3. WHERE tables have large numbers of records, THE System SHALL implement composite indexes for common query patterns
4. THE System SHALL use appropriate data types to minimize storage and improve performance
5. ALL text fields with predictable maximum lengths SHALL use VARCHAR with appropriate limits
6. THE System SHALL implement full-text indexing where text search is required
7. ALL database tables SHALL use InnoDB engine for transaction support and foreign keys

### Requirement 10: Schema Documentation and Maintainability

**User Story:** As a future developer, I want clear database documentation, so that I can understand relationships and maintain the system easily.

#### Acceptance Criteria

1. THE database schema SHALL include table and column comments
2. ALL foreign key relationships SHALL be clearly documented
3. THE System SHALL provide a data dictionary describing each table and column
4. ALL constraints and indexes SHALL be named consistently
5. THE database migration scripts SHALL be idempotent and reversible
6. THE System SHALL include examples of common queries and joins
7. ALL Sequelize models SHALL reflect the database schema accurately
8. THE System SHALL include entity-relationship diagrams