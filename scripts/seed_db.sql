-- ============================================================
-- Full seed: stagepostulation + soutenance (new schema)
-- Uses dynamic stage IDs via subqueries
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ── stagepostulation (15 rows) ────────────────────────────────────────────────
INSERT IGNORE INTO stagepostulation
  (stageId, etudiantID, etudiantName, etudiantEmail, etudiantSection,
   etudiantInstitue, stageDomaine, stageSujet, entrepriseName, entrepriseEmail,
   status, CV, postulatedAt)
SELECT
  s.id,
  e.ID,
  CONCAT(e.NOM, ' ', e.PRENOM),
  e.EMAIL,
  CONCAT(e.DEPARTEMENT, ' : ', e.SPECIALITE),
  'FSS Sfax',
  s.domaine,
  s.titre,
  s.nom_entreprise,
  s.created_by,
  ELT(FLOOR(1 + RAND() * 3), 'a attente', 'accepté', 'refusé'),
  CONCAT('https://drive.google.com/file/d/cv-', LOWER(e.PRENOM), '/view'),
  DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY)
FROM etudiant e
JOIN stage s ON s.id = (
  SELECT id FROM stage
  ORDER BY RAND()
  LIMIT 1
)
WHERE NOT EXISTS (
  SELECT 1 FROM stagepostulation sp
  WHERE sp.etudiantEmail = e.EMAIL
)
LIMIT 15;

-- ── soutenance (new schema columns) ──────────────────────────────────────────
INSERT IGNORE INTO soutenance
  (affectation_id, date_soutenance, heure, salle, groupe, type_groupe,
   etudiant1_nom, etudiant2_nom, etudiant3_nom,
   sujet, president_id, rapporteur_id, encadrant_academique_id,
   encadrant_professionnel, entreprise_nom, created_at, updated_at)
VALUES
(NULL,'2025-06-15','09:00:00','Salle A','G1','Binome',
 'ALI Hamza','BEN SALAH Aya',NULL,
 'Développement d''une plateforme e-learning avec React et Node.js',
 NULL,NULL,NULL,'AHMED Youssef','SOFRECOM TUNISIE',NOW(),NOW()),

(NULL,'2025-06-15','11:00:00','Salle B','G1','Monome',
 'CHAKROUN Yassine',NULL,NULL,
 'Analyse de données financières avec Machine Learning',
 NULL,NULL,NULL,'SLIM Mariem','VERMEG',NOW(),NOW()),

(NULL,'2025-06-15','14:00:00','Salle A','G2','Trinome',
 'DALI Rania','EZZINE Malek','FRAJ Salma',
 'Système de gestion des stocks IoT',
 NULL,NULL,NULL,'NOUR Khaled','TELNET HOLDING',NOW(),NOW()),

(NULL,'2025-06-16','09:00:00','Salle C','G2','Binome',
 'GHRIB Nizar','HAMDI Marwa',NULL,
 'Application mobile de suivi de santé Flutter',
 NULL,NULL,NULL,'RANIA Sarra','PROXYM GROUP',NOW(),NOW()),

(NULL,'2025-06-16','11:00:00','Salle A','G3','Monome',
 'ISMAIL Firas',NULL,NULL,
 'Optimisation de réseau 5G par algorithmes génétiques',
 NULL,NULL,NULL,'FARES Anis','ORANGE TUNISIE',NOW(),NOW()),

(NULL,'2025-06-16','14:00:00','Salle B','G3','Binome',
 'JLASSI Hajer','KACEM Bilel',NULL,
 'Plateforme de gestion bancaire microservices',
 NULL,NULL,NULL,'HIBA Rim','BIAT',NOW(),NOW()),

(NULL,'2025-06-17','09:00:00','Salle A','G4','Trinome',
 'LAHMAR Sana','MRAD Aziz','NASR Ines',
 'Système de recommandation e-commerce par deep learning',
 NULL,NULL,NULL,'ZIED Hamza','TALAN TUNISIE',NOW(),NOW()),

(NULL,'2025-06-17','11:00:00','Salle C','G4','Monome',
 'OUALI Seif',NULL,NULL,
 'Infrastructure cloud AWS avec Terraform',
 NULL,NULL,NULL,'ASMA Dorra','TELNET HOLDING',NOW(),NOW()),

(NULL,'2025-06-18','09:00:00','Salle B','G1','Binome',
 'ALI Hamza','CHAKROUN Yassine',NULL,
 'Chatbot intelligent NLP pour service client',
 NULL,NULL,NULL,'WAEL Seif','PROXYM GROUP',NOW(),NOW()),

(NULL,'2025-06-18','11:00:00','Salle A','G2','Monome',
 'BEN SALAH Aya',NULL,NULL,
 'Analyse de risques financiers par modèles prédictifs',
 NULL,NULL,NULL,'IMEN Ghofrane','AMEN BANK',NOW(),NOW()),

(NULL,'2025-06-18','14:00:00','Salle C','G3','Binome',
 'DALI Rania','EZZINE Malek',NULL,
 'Système de management qualité ISO 9001',
 NULL,NULL,NULL,'MAHER Oussama','COFICAB',NOW(),NOW()),

(NULL,'2025-06-19','09:00:00','Salle A','G4','Trinome',
 'FRAJ Salma','GHRIB Nizar','HAMDI Marwa',
 'Optimisation des lignes de production par simulation',
 NULL,NULL,NULL,'OLFA Yasmine','LEONI TUNISIE',NOW(),NOW()),

(NULL,'2025-06-19','11:00:00','Salle B','G1','Monome',
 'ISMAIL Firas',NULL,NULL,
 'Maintenance prédictive des systèmes avioniques',
 NULL,NULL,NULL,'TAREK Fedi','TUNISAIR',NOW(),NOW()),

(NULL,'2025-06-19','14:00:00','Salle C','G2','Binome',
 'JLASSI Hajer','KACEM Bilel',NULL,
 'API REST pour services mobiles bancaires',
 NULL,NULL,NULL,'SANA Amira','ORANGE TUNISIE',NOW(),NOW()),

(NULL,'2025-06-20','09:00:00','Salle A','G3','Monome',
 'LAHMAR Sana',NULL,NULL,
 'Développement de smart contracts Blockchain',
 NULL,NULL,NULL,'BASSEM Chiheb','BIAT',NOW(),NOW());

-- ── user_registrations: seed one account per role for testing ─────────────────
-- Password for all: Test1234! (bcrypt hash below)
-- Hash: $2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
INSERT IGNORE INTO user_registrations
  (UUID, EMAIL, NOM, PRENOM, PASSWORD, role, ISVALIDATED, TOKEN, createdAt, updatedAt)
VALUES
(UUID(),'admin@gestion.tn','ADMIN','System',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'ADMIN',1,'0',NOW(),NOW()),
(UUID(),'dept@gestion.tn','DEPARTEMENT','Chef',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'DEPARTEMENT',1,'0',NOW(),NOW()),
(UUID(),'etudiant@gestion.tn','ETUDIANT','Test',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'USER',1,'0',NOW(),NOW()),
(UUID(),'entreprise@gestion.tn','ENTREPRISE','Test',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'ENTREPRISE',1,'0',NOW(),NOW());

SET FOREIGN_KEY_CHECKS = 1;
