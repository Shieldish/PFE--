-- ============================================================
-- DATA MIGRATION — Populate new tables from old data
-- Run AFTER migrate_schema.sql
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ── 1. Migrate enseignant data ──
INSERT INTO enseignant (email, nom, prenom, departement, created_at, updated_at)
VALUES
('ben.ali@fss.tn','BEN ALI','Mohamed','Informatique',NOW(),NOW()),
('trabelsi.s@fss.tn','TRABELSI','Sonia','Mathématiques',NOW(),NOW()),
('chaabane.k@fss.tn','CHAABANE','Karim','Physique',NOW(),NOW()),
('mansouri.l@fss.tn','MANSOURI','Leila','Chimie',NOW(),NOW()),
('jebali.r@fss.tn','JEBALI','Riadh','Informatique',NOW(),NOW()),
('bouzid.h@fss.tn','BOUZID','Hanen','Biologie',NOW(),NOW()),
('ferchichi.a@fss.tn','FERCHICHI','Amine','Génie Civil',NOW(),NOW()),
('karray.n@fss.tn','KARRAY','Nadia','Informatique',NOW(),NOW()),
('hamdi.o@fss.tn','HAMDI','Omar','Électronique',NOW(),NOW()),
('saidi.f@fss.tn','SAIDI','Fatma','Mathématiques',NOW(),NOW()),
('dridi.m@fss.tn','DRIDI','Mehdi','Physique',NOW(),NOW()),
('gharbi.i@fss.tn','GHARBI','Ines','Informatique',NOW(),NOW()),
('ayari.b@fss.tn','AYARI','Bilel','Génie Mécanique',NOW(),NOW()),
('zouari.c@fss.tn','ZOUARI','Chiraz','Chimie',NOW(),NOW()),
('maaloul.t@fss.tn','MAALOUL','Tarek','Informatique',NOW(),NOW());

-- ── 2. Migrate encadrant data ──
INSERT INTO encadrant (email, nom, prenom, departement, entreprise_nom, created_at, updated_at)
VALUES
('enc.ahmed@corp.tn','AHMED','Youssef','Développement','SOFRECOM TUNISIE',NOW(),NOW()),
('enc.slim@corp.tn','SLIM','Mariem','Data Science','VERMEG',NOW(),NOW()),
('enc.nour@corp.tn','NOUR','Khaled','DevOps','TELNET HOLDING',NOW(),NOW()),
('enc.rania@corp.tn','RANIA','Sarra','Cybersécurité','TELNET HOLDING',NOW(),NOW()),
('enc.fares@corp.tn','FARES','Anis','Cloud','ORANGE TUNISIE',NOW(),NOW()),
('enc.hiba@corp.tn','HIBA','Rim','IA','PROXYM GROUP',NOW(),NOW()),
('enc.zied@corp.tn','ZIED','Hamza','Réseaux','TALAN TUNISIE',NOW(),NOW()),
('enc.asma@corp.tn','ASMA','Dorra','Développement','PROXYM GROUP',NOW(),NOW()),
('enc.wael@corp.tn','WAEL','Seif','Data Science','PROXYM GROUP',NOW(),NOW()),
('enc.imen@corp.tn','IMEN','Ghofrane','DevOps','AMEN BANK',NOW(),NOW()),
('enc.maher@corp.tn','MAHER','Oussama','Développement','COFICAB',NOW(),NOW()),
('enc.olfa@corp.tn','OLFA','Yasmine','IA','LEONI TUNISIE',NOW(),NOW()),
('enc.tarek@corp.tn','TAREK','Fedi','Cloud','TUNISAIR',NOW(),NOW()),
('enc.sana@corp.tn','SANA','Amira','Cybersécurité','ORANGE TUNISIE',NOW(),NOW()),
('enc.bassem@corp.tn','BASSEM','Chiheb','Réseaux','BIAT',NOW(),NOW());

-- ── 3. Migrate entreprise data ──
INSERT INTO entreprise (email, nom, domaine, ville, adresse, telephone, created_at, updated_at)
VALUES
('contact@sofrecom.tn','SOFRECOM TUNISIE','Télécommunications','Tunis','Rue du Lac Windermere, Les Berges du Lac','+216 71 860 000',NOW(),NOW()),
('rh@vermeg.com','VERMEG','Fintech','Tunis','Rue Lac Huron, Les Berges du Lac','+216 71 962 000',NOW(),NOW()),
('jobs@telnet.tn','TELNET HOLDING','IT Services','Tunis','Rue des Entrepreneurs, Charguia II','+216 71 770 000',NOW(),NOW()),
('career@biat.com.tn','BIAT','Banque','Tunis','Rue Hédi Karray, Ariana','+216 71 188 000',NOW(),NOW()),
('hr@sfbt.com.tn','SFBT','Agroalimentaire','Sfax','Route de Tunis km 3, Sfax','+216 74 240 000',NOW(),NOW()),
('contact@stb.com.tn','STB','Banque','Tunis','Rue Hédi Nouira, Tunis','+216 71 340 000',NOW(),NOW()),
('jobs@poulina.com','POULINA GROUP','Industrie','Tunis','Route de Bizerte km 5','+216 71 700 000',NOW(),NOW()),
('rh@tunisair.com.tn','TUNISAIR','Transport Aérien','Tunis','Aéroport Tunis-Carthage','+216 71 700 100',NOW(),NOW()),
('career@orange.tn','ORANGE TUNISIE','Télécommunications','Tunis','Rue du Lac Léman, Les Berges du Lac','+216 71 860 100',NOW(),NOW()),
('hr@amen.com.tn','AMEN BANK','Banque','Tunis','Avenue Mohamed V, Tunis','+216 71 148 000',NOW(),NOW()),
('contact@sotetel.tn','SOTETEL','Télécommunications','Tunis','Route de Bizerte km 8','+216 71 700 200',NOW(),NOW()),
('jobs@coficab.com','COFICAB','Industrie','Sfax','Zone Industrielle Poudrière 2, Sfax','+216 74 400 000',NOW(),NOW()),
('rh@leoni.com','LEONI TUNISIE','Câblage Auto','Sousse','Zone Industrielle Sousse Sud','+216 73 220 000',NOW(),NOW()),
('career@talan.tn','TALAN TUNISIE','Conseil IT','Tunis','Rue du Lac Malaren, Les Berges du Lac','+216 71 860 200',NOW(),NOW()),
('hr@proxym.com','PROXYM GROUP','Software','Tunis','Rue du Lac Huron, Les Berges du Lac','+216 71 962 100',NOW(),NOW());

-- ── 4. Migrate etudiant data ──
INSERT INTO etudiant (uuid, email, nom, prenom, departement, specialite, created_at, updated_at)
VALUES
(UUID(),'etud.ali@etu.fss.tn','ALI','Hamza','Informatique','Génie Logiciel',NOW(),NOW()),
(UUID(),'etud.ben@etu.fss.tn','BEN SALAH','Aya','Informatique','Réseaux',NOW(),NOW()),
(UUID(),'etud.chak@etu.fss.tn','CHAKROUN','Yassine','Mathématiques','Statistiques',NOW(),NOW()),
(UUID(),'etud.dali@etu.fss.tn','DALI','Rania','Physique','Physique Appliquée',NOW(),NOW()),
(UUID(),'etud.ezzine@etu.fss.tn','EZZINE','Malek','Informatique','IA',NOW(),NOW()),
(UUID(),'etud.fraj@etu.fss.tn','FRAJ','Salma','Chimie','Chimie Organique',NOW(),NOW()),
(UUID(),'etud.ghrib@etu.fss.tn','GHRIB','Nizar','Informatique','Cybersécurité',NOW(),NOW()),
(UUID(),'etud.hamdi@etu.fss.tn','HAMDI','Marwa','Biologie','Biochimie',NOW(),NOW()),
(UUID(),'etud.ismail@etu.fss.tn','ISMAIL','Firas','Électronique','Systèmes Embarqués',NOW(),NOW()),
(UUID(),'etud.jlassi@etu.fss.tn','JLASSI','Hajer','Informatique','Data Science',NOW(),NOW()),
(UUID(),'etud.kacem@etu.fss.tn','KACEM','Bilel','Génie Civil','BTP',NOW(),NOW()),
(UUID(),'etud.lahmar@etu.fss.tn','LAHMAR','Sana','Informatique','Développement Web',NOW(),NOW()),
(UUID(),'etud.mrad@etu.fss.tn','MRAD','Aziz','Mathématiques','Algèbre',NOW(),NOW()),
(UUID(),'etud.nasr@etu.fss.tn','NASR','Ines','Physique','Optique',NOW(),NOW()),
(UUID(),'etud.ouali@etu.fss.tn','OUALI','Seif','Informatique','Cloud Computing',NOW(),NOW());

-- ── 5. Migrate stage data ──
INSERT INTO stage (id, entreprise_id, created_by, titre, domaine, nom_entreprise, libelle, description, niveau, experience, langue, postes_vacants, telephone, email, date_debut, date_fin, adresse, ville, code_postal, is_active, created_at, updated_at)
SELECT
  UUID() as id,
  e.id as entreprise_id,
  'gabiam.k.samuel@gmail.com' as created_by,
  CONCAT('Développeur ', s.domaine) as titre,
  s.domaine,
  s.nom as nom_entreprise,
  CONCAT('Stage PFE 6 mois en ', s.domaine) as libelle,
  NULL as description,
  'Master' as niveau,
  'Débutant' as experience,
  'Français' as langue,
  2 as postes_vacants,
  e.telephone,
  e.email,
  '2025-02-01' as date_debut,
  '2025-07-31' as date_fin,
  e.adresse,
  e.ville,
  '1053' as code_postal,
  1 as is_active,
  NOW() as created_at,
  NOW() as updated_at
FROM (
  SELECT 'Informatique' as domaine, 'SOFRECOM TUNISIE' as nom UNION ALL
  SELECT 'Fintech', 'VERMEG' UNION ALL
  SELECT 'IT Services', 'TELNET HOLDING' UNION ALL
  SELECT 'Informatique', 'PROXYM GROUP' UNION ALL
  SELECT 'Conseil IT', 'TALAN TUNISIE' UNION ALL
  SELECT 'Télécommunications', 'ORANGE TUNISIE' UNION ALL
  SELECT 'Cybersécurité', 'TELNET HOLDING' UNION ALL
  SELECT 'IA', 'PROXYM GROUP' UNION ALL
  SELECT 'Banque', 'BIAT' UNION ALL
  SELECT 'Banque', 'AMEN BANK' UNION ALL
  SELECT 'Industrie', 'COFICAB' UNION ALL
  SELECT 'Câblage Auto', 'LEONI TUNISIE' UNION ALL
  SELECT 'Agroalimentaire', 'SFBT' UNION ALL
  SELECT 'Transport Aérien', 'TUNISAIR' UNION ALL
  SELECT 'Informatique', 'TALAN TUNISIE' UNION ALL
  SELECT 'Télécommunications', 'SOTETEL' UNION ALL
  SELECT 'Industrie', 'POULINA GROUP' UNION ALL
  SELECT 'Informatique', 'VERMEG' UNION ALL
  SELECT 'Data Science', 'PROXYM GROUP' UNION ALL
  SELECT 'Cloud', 'TELNET HOLDING' UNION ALL
  SELECT 'Informatique', 'ORANGE TUNISIE' UNION ALL
  SELECT 'Banque', 'STB' UNION ALL
  SELECT 'Informatique', 'SOFRECOM TUNISIE' UNION ALL
  SELECT 'IA', 'TALAN TUNISIE' UNION ALL
  SELECT 'Câblage Auto', 'LEONI TUNISIE' UNION ALL
  SELECT 'Informatique', 'BIAT' UNION ALL
  SELECT 'Industrie', 'COFICAB' UNION ALL
  SELECT 'Informatique', 'PROXYM GROUP' UNION ALL
  SELECT 'Télécommunications', 'ORANGE TUNISIE' UNION ALL
  SELECT 'Informatique', 'SOFRECOM TUNISIE'
) s
JOIN entreprise e ON e.nom = s.nom;

-- ── 6. Migrate candidature data ──
INSERT INTO candidature (stage_id, etudiant_id, status, nom, prenom, email, niveau_etudes, institution, domaine_etudes, section, has_experience, motivation, langues, logiciels, cv_url, postule_le, updated_at)
SELECT
  st.id as stage_id,
  et.id as etudiant_id,
  'en_attente' as status,
  et.nom,
  et.prenom,
  et.email,
  'Master' as niveau_etudes,
  'FSS Sfax' as institution,
  et.specialite as domaine_etudes,
  et.departement as section,
  1 as has_experience,
  'Très motivé pour ce stage' as motivation,
  'Français, Anglais' as langues,
  'Java, Python, React' as logiciels,
  'https://drive.google.com/file/d/cv-placeholder/view' as cv_url,
  NOW() as postule_le,
  NOW() as updated_at
FROM etudiant et
JOIN stage st ON st.domaine = et.specialite
LIMIT 15;

-- Update some statuses for variety
UPDATE candidature SET status = 'accepte'  WHERE id IN (1,3,7,9,12,14);
UPDATE candidature SET status = 'refuse'   WHERE id IN (5,11);

-- ── 7. Create affectations for accepted candidatures ──
INSERT INTO affectation (candidature_id, enseignant_id, encadrant_id, date_affectation, created_at, updated_at)
SELECT
  c.id as candidature_id,
  (SELECT id FROM enseignant ORDER BY RAND() LIMIT 1) as enseignant_id,
  (SELECT id FROM encadrant ORDER BY RAND() LIMIT 1) as encadrant_id,
  CURDATE() as date_affectation,
  NOW() as created_at,
  NOW() as updated_at
FROM candidature c
WHERE c.status = 'accepte';

-- ── 8. Migrate soutenance data ──
INSERT INTO soutenance (affectation_id, date_soutenance, heure, salle, groupe, type_groupe, etudiant1_nom, etudiant2_nom, sujet, president_id, rapporteur_id, encadrant_academique_id, encadrant_professionnel, entreprise_nom, created_at, updated_at)
SELECT
  a.id as affectation_id,
  DATE_ADD('2025-06-15', INTERVAL (a.id - 1) DAY) as date_soutenance,
  CASE (a.id % 3) WHEN 0 THEN '09:00:00' WHEN 1 THEN '11:00:00' ELSE '14:00:00' END as heure,
  CASE (a.id % 3) WHEN 0 THEN 'Salle A' WHEN 1 THEN 'Salle B' ELSE 'Salle C' END as salle,
  CONCAT('G', ((a.id - 1) % 4) + 1) as groupe,
  'Binome' as type_groupe,
  CONCAT(et.nom, ' ', et.prenom) as etudiant1_nom,
  NULL as etudiant2_nom,
  CONCAT('Projet de fin d''études : ', st.titre) as sujet,
  (SELECT id FROM enseignant ORDER BY RAND() LIMIT 1) as president_id,
  (SELECT id FROM enseignant ORDER BY RAND() LIMIT 1) as rapporteur_id,
  a.enseignant_id as encadrant_academique_id,
  CONCAT(enc.prenom, ' ', enc.nom) as encadrant_professionnel,
  ent.nom as entreprise_nom,
  NOW() as created_at,
  NOW() as updated_at
FROM affectation a
JOIN candidature c ON c.id = a.candidature_id
JOIN etudiant et ON et.id = c.etudiant_id
JOIN stage st ON st.id = c.stage_id
JOIN entreprise ent ON ent.id = st.entreprise_id
LEFT JOIN encadrant enc ON enc.id = a.encadrant_id;

SET FOREIGN_KEY_CHECKS = 1;
