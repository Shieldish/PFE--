-- ============================================================
-- Dev seed: enseignant, encadrant, etudiant, entreprise, stage
-- ============================================================

-- Enseignants (15)
INSERT IGNORE INTO enseignant (EMAIL, NOM, PRENOM, SEXE, DEPARTEMENT, DATE, createdAt, updatedAt) VALUES
('ben.ali@fss.tn','BEN ALI','Mohamed','M','Informatique','1980-03-12',NOW(),NOW()),
('trabelsi.s@fss.tn','TRABELSI','Sonia','F','Mathématiques','1975-07-22',NOW(),NOW()),
('chaabane.k@fss.tn','CHAABANE','Karim','M','Physique','1982-11-05',NOW(),NOW()),
('mansouri.l@fss.tn','MANSOURI','Leila','F','Chimie','1979-01-30',NOW(),NOW()),
('jebali.r@fss.tn','JEBALI','Riadh','M','Informatique','1985-09-14',NOW(),NOW()),
('bouzid.h@fss.tn','BOUZID','Hanen','F','Biologie','1983-04-18',NOW(),NOW()),
('ferchichi.a@fss.tn','FERCHICHI','Amine','M','Génie Civil','1977-06-25',NOW(),NOW()),
('karray.n@fss.tn','KARRAY','Nadia','F','Informatique','1981-12-03',NOW(),NOW()),
('hamdi.o@fss.tn','HAMDI','Omar','M','Électronique','1976-08-19',NOW(),NOW()),
('saidi.f@fss.tn','SAIDI','Fatma','F','Mathématiques','1984-02-27',NOW(),NOW()),
('dridi.m@fss.tn','DRIDI','Mehdi','M','Physique','1978-10-11',NOW(),NOW()),
('gharbi.i@fss.tn','GHARBI','Ines','F','Informatique','1986-05-07',NOW(),NOW()),
('ayari.b@fss.tn','AYARI','Bilel','M','Génie Mécanique','1980-07-16',NOW(),NOW()),
('zouari.c@fss.tn','ZOUARI','Chiraz','F','Chimie','1983-03-21',NOW(),NOW()),
('maaloul.t@fss.tn','MAALOUL','Tarek','M','Informatique','1979-11-09',NOW(),NOW());

-- Encadrants (15)
INSERT IGNORE INTO encadrant (EMAIL, NOM, PRENOM, SEXE, DEPARTEMENT, DATE, createdAt, updatedAt) VALUES
('enc.ahmed@corp.tn','AHMED','Youssef','M','Développement','1985-04-10',NOW(),NOW()),
('enc.slim@corp.tn','SLIM','Mariem','F','Data Science','1988-09-23',NOW(),NOW()),
('enc.nour@corp.tn','NOUR','Khaled','M','DevOps','1983-01-15',NOW(),NOW()),
('enc.rania@corp.tn','RANIA','Sarra','F','Cybersécurité','1990-06-30',NOW(),NOW()),
('enc.fares@corp.tn','FARES','Anis','M','Cloud','1987-11-08',NOW(),NOW()),
('enc.hiba@corp.tn','HIBA','Rim','F','IA','1992-03-17',NOW(),NOW()),
('enc.zied@corp.tn','ZIED','Hamza','M','Réseaux','1984-07-22',NOW(),NOW()),
('enc.asma@corp.tn','ASMA','Dorra','F','Développement','1989-12-05',NOW(),NOW()),
('enc.wael@corp.tn','WAEL','Seif','M','Data Science','1986-02-14',NOW(),NOW()),
('enc.imen@corp.tn','IMEN','Ghofrane','F','DevOps','1991-08-28',NOW(),NOW()),
('enc.maher@corp.tn','MAHER','Oussama','M','Développement','1985-05-19',NOW(),NOW()),
('enc.olfa@corp.tn','OLFA','Yasmine','F','IA','1988-10-03',NOW(),NOW()),
('enc.tarek@corp.tn','TAREK','Fedi','M','Cloud','1983-04-26',NOW(),NOW()),
('enc.sana@corp.tn','SANA','Amira','F','Cybersécurité','1990-01-11',NOW(),NOW()),
('enc.bassem@corp.tn','BASSEM','Chiheb','M','Réseaux','1987-06-07',NOW(),NOW());

-- Etudiants (15)
INSERT IGNORE INTO etudiant (ID, EMAIL, NOM, PRENOM, SEXE, DEPARTEMENT, SPECIALITE, DATE, createdAt, updatedAt) VALUES
(UUID(),'etud.ali@etu.fss.tn','ALI','Hamza','M','Informatique','Génie Logiciel','2001-03-12',NOW(),NOW()),
(UUID(),'etud.ben@etu.fss.tn','BEN SALAH','Aya','F','Informatique','Réseaux','2002-07-22',NOW(),NOW()),
(UUID(),'etud.chak@etu.fss.tn','CHAKROUN','Yassine','M','Mathématiques','Statistiques','2001-11-05',NOW(),NOW()),
(UUID(),'etud.dali@etu.fss.tn','DALI','Rania','F','Physique','Physique Appliquée','2002-01-30',NOW(),NOW()),
(UUID(),'etud.ezzine@etu.fss.tn','EZZINE','Malek','M','Informatique','IA','2001-09-14',NOW(),NOW()),
(UUID(),'etud.fraj@etu.fss.tn','FRAJ','Salma','F','Chimie','Chimie Organique','2002-04-18',NOW(),NOW()),
(UUID(),'etud.ghrib@etu.fss.tn','GHRIB','Nizar','M','Informatique','Cybersécurité','2001-06-25',NOW(),NOW()),
(UUID(),'etud.hamdi@etu.fss.tn','HAMDI','Marwa','F','Biologie','Biochimie','2002-12-03',NOW(),NOW()),
(UUID(),'etud.ismail@etu.fss.tn','ISMAIL','Firas','M','Électronique','Systèmes Embarqués','2001-08-19',NOW(),NOW()),
(UUID(),'etud.jlassi@etu.fss.tn','JLASSI','Hajer','F','Informatique','Data Science','2002-02-27',NOW(),NOW()),
(UUID(),'etud.kacem@etu.fss.tn','KACEM','Bilel','M','Génie Civil','BTP','2001-10-11',NOW(),NOW()),
(UUID(),'etud.lahmar@etu.fss.tn','LAHMAR','Sana','F','Informatique','Développement Web','2002-05-07',NOW(),NOW()),
(UUID(),'etud.mrad@etu.fss.tn','MRAD','Aziz','M','Mathématiques','Algèbre','2001-07-16',NOW(),NOW()),
(UUID(),'etud.nasr@etu.fss.tn','NASR','Ines','F','Physique','Optique','2002-03-21',NOW(),NOW()),
(UUID(),'etud.ouali@etu.fss.tn','OUALI','Seif','M','Informatique','Cloud Computing','2001-11-09',NOW(),NOW());

-- Entreprises (15)
INSERT IGNORE INTO entreprise (EMAIL, NOM, DOMAINE, VILLE, ADDRESSE, TELEPHONE, createdAt, updatedAt) VALUES
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

-- Stages (30)
INSERT IGNORE INTO stage (id, Domaine, Nom, Titre, Libelle, Description, Niveau, Experience, Langue, PostesVacants, Telephone, Fax, Email, Email2, DateDebut, DateFin, Address, Rue, State, Zip, gridCheck, CreatedBy, createdAt, updatedAt) VALUES
(UUID(),'Informatique','SOFRECOM TUNISIE','Développeur Full Stack Java/Angular','Stage PFE 6 mois','Développement d''une application de gestion interne','Master','Débutant','Français',2,'+216 71 860 000','+216 71 860 001','stage@sofrecom.tn','rh@sofrecom.tn','2025-02-01','2025-07-31','Rue du Lac Windermere','Les Berges du Lac','Tunis','1053',1,'gabiam.k.samuel@gmail.com',NOW(),NOW()),
(UUID(),'Fintech','VERMEG','Développeur Backend Node.js','Stage PFE 6 mois','Intégration de microservices financiers','Master','Débutant','Anglais',1,'+216 71 962 000','+216 71 962 001','stage@vermeg.com','rh@vermeg.com','2025-03-01','2025-08-31','Rue Lac Huron','Les Berges du Lac','Tunis','1053',1,'gabiam.k.samuel@gmail.com',NOW(),NOW()),
(UUID(),'IT Services','TELNET HOLDING','Ingénieur DevOps','Stage PFE 6 mois','Mise en place d''un pipeline CI/CD','Ingénieur','1-2 ans','Français',2,'+216 71 770 000','+216 71 770 001','stage@telnet.tn','rh@telnet.tn','2025-01-15','2025-07-15','Rue des Entrepreneurs','Charguia II','Tunis','2035',1,'gabiam.k.samuel@gmail.com',NOW(),NOW()),
(UUID(),'Informatique','PROXYM GROUP','Développeur React.js','Stage PFE 6 mois','Refonte d''une interface utilisateur moderne','Master','Débutant','Français',3,'+216 71 962 100','+216 71 962 101','stage@proxym.com','rh@proxym.com','2025-02-15','2025-08-15','Rue du Lac Huron','Les Berges du Lac','Tunis','1053',1,'gabiam.k.samuel@gmail.com',NOW(),NOW()),
(UUID(),'Conseil IT','TALAN TUNISIE','Consultant Data Analyst','Stage PFE 6 mois','Analyse de données et tableaux de bord BI','Master','Débutant','Français',1,'+216 71 860 200','+216 71 860 201','stage@talan.tn','rh@talan.tn','2025-03-15','2025-09-15','Rue du Lac Malaren','Les Berges du Lac','Tunis','1053',1,'gabiam.k.samuel@gmail.com',NOW(),NOW()),
(UUID(),'Télécommunications','ORANGE TUNISIE','Ingénieur Réseaux','Stage PFE 6 mois','Optimisation du réseau 4G/5G','Ingénieur','1-2 ans','Français',2,'+216 71 860 100','+216 71 860 101','stage@orange.tn','rh@orange.tn','2025-01-01','2025-06-30','Rue du Lac Léman','Les Berges du Lac','Tunis','1053',1,'gabiam.k.samuel@gmail.com',NOW(),NOW()),
(UUID(),'Informatique','SOFRECOM TUNISIE','Développeur Mobile Flutter','Stage PFA 3 mois','Développement d''une app mobile cross-platform','Licence','Débutant','Français',2,'+216 71 860 000','+216 71 860 001','stage@sofrecom.tn','rh@sofrecom.tn','2025-06-01','2025-08-31','Rue du Lac Windermere','Les Berges du Lac','Tunis','1053',0,'gabiam.k.samuel@gmail.com',NOW(),NOW()),
(UUID(),'Cybersécurité','TELNET HOLDING','Analyste Cybersécurité','Stage PFE 6 mois','Audit de sécurité et tests de pénétration','Ingénieur','1-2 ans','Anglais',1,'+216 71 770 000','+216 71 770 001','stage@telnet.tn','rh@telnet.tn','2025-02-01','2025-07-31','Rue des Entrepreneurs','Charguia II','Tunis','2035',1,'gabiam.k.samuel@gmail.com',NOW(),NOW()),
(UUID(),'IA','PROXYM GROUP','Ingénieur Machine Learning','Stage PFE 6 mois','Développement de modèles de prédiction','Master','Débutant','Anglais',1,'+216 71 962 100','+216 71 962 101','stage@proxym.com','rh@proxym.com','2025-03-01','2025-08-31','Rue du Lac Huron','Les Berges du Lac','Tunis','1053',1,'gabiam.k.samuel@gmail.com',NOW(),NOW()),
(UUID(),'Banque','BIAT','Développeur Bancaire','Stage PFE 6 mois','Développement de modules bancaires en Java','Master','Débutant','Français',2,'+216 71 188 000','+216 71 188 001','stage@biat.com.tn','rh@biat.com.tn','2025-01-15','2025-07-15','Rue Hédi Karray','Ariana','Tunis','2080',1,'gabiam.k.samuel@gmail.com',NOW(),NOW()),
(UUID(),'Banque','AMEN BANK','Analyste Financier','Stage PFE 6 mois','Analyse des risques financiers','Master','Débutant','Français',1,'+216 71 148 000','+216 71 148 001','stage@amen.com.tn','rh@amen.com.tn','2025-02-15','2025-08-15','Avenue Mohamed V','Centre Ville','Tunis','1001',1,'gabiam.k.samuel@gmail.com',NOW(),NOW()),
(UUID(),'Industrie','COFICAB','Ingénieur Qualité','Stage PFE 6 mois','Amélioration des processus qualité','Ingénieur','1-2 ans','Français',2,'+216 74 400 000','+216 74 400 001','stage@coficab.com','rh@coficab.com','2025-01-01','2025-06-30','Zone Industrielle Poudrière 2','Route de Tunis','Sfax','3000',1,'gabiam.k.samuel@gmail.com',NOW(),NOW()),
(UUID(),'Câblage Auto','LEONI TUNISIE','Ingénieur Méthodes','Stage PFE 6 mois','Optimisation des lignes de production','Ingénieur','1-2 ans','Français',2,'+216 73 220 000','+216 73 220 001','stage@leoni.com','rh@leoni.com','2025-02-01','2025-07-31','Zone Industrielle Sousse Sud','Route de Sfax','Sousse','4000',1,'gabiam.k.samuel@gmail.com',NOW(),NOW()),
(UUID(),'Agroalimentaire','SFBT','Ingénieur Agroalimentaire','Stage PFE 6 mois','Contrôle qualité des produits alimentaires','Ingénieur','Débutant','Français',1,'+216 74 240 000','+216 74 240 001','stage@sfbt.com.tn','rh@sfbt.com.tn','2025-03-01','2025-08-31','Route de Tunis km 3','Zone Industrielle','Sfax','3000',1,'gabiam.k.samuel@gmail.com',NOW(),NOW()),
(UUID(),'Transport Aérien','TUNISAIR','Ingénieur Systèmes Embarqués','Stage PFE 6 mois','Maintenance des systèmes avioniques','Ingénieur','1-2 ans','Anglais',1,'+216 71 700 100','+216 71 700 101','stage@tunisair.com.tn','rh@tunisair.com.tn','2025-01-15','2025-07-15','Aéroport Tunis-Carthage','Route de l''Aéroport','Tunis','2035',1,'gabiam.k.samuel@gmail.com',NOW(),NOW()),
(UUID(),'Informatique','TALAN TUNISIE','Développeur Python/Django','Stage PFE 6 mois','Développement d''une plateforme e-learning','Master','Débutant','Français',2,'+216 71 860 200','+216 71 860 201','stage@talan.tn','rh@talan.tn','2025-02-01','2025-07-31','Rue du Lac Malaren','Les Berges du Lac','Tunis','1053',1,'gabiam.k.samuel@gmail.com',NOW(),NOW()),
(UUID(),'Télécommunications','SOTETEL','Ingénieur Télécoms','Stage PFE 6 mois','Déploiement d''infrastructure fibre optique','Ingénieur','1-2 ans','Français',2,'+216 71 700 200','+216 71 700 201','stage@sotetel.tn','rh@sotetel.tn','2025-03-15','2025-09-15','Route de Bizerte km 8','Zone Industrielle','Tunis','2035',1,'gabiam.k.samuel@gmail.com',NOW(),NOW()),
(UUID(),'Industrie','POULINA GROUP','Ingénieur Industriel','Stage PFE 6 mois','Optimisation de la chaîne logistique','Ingénieur','1-2 ans','Français',2,'+216 71 700 000','+216 71 700 001','stage@poulina.com','rh@poulina.com','2025-01-01','2025-06-30','Route de Bizerte km 5','Zone Industrielle','Tunis','2035',1,'gabiam.k.samuel@gmail.com',NOW(),NOW()),
(UUID(),'Informatique','VERMEG','Développeur Angular/Spring','Stage PFA 3 mois','Développement de composants UI réutilisables','Licence','Débutant','Français',3,'+216 71 962 000','+216 71 962 001','stage@vermeg.com','rh@vermeg.com','2025-06-01','2025-08-31','Rue Lac Huron','Les Berges du Lac','Tunis','1053',0,'gabiam.k.samuel@gmail.com',NOW(),NOW()),
(UUID(),'Data Science','PROXYM GROUP','Data Engineer','Stage PFE 6 mois','Construction de pipelines de données','Master','Débutant','Anglais',1,'+216 71 962 100','+216 71 962 101','stage@proxym.com','rh@proxym.com','2025-02-15','2025-08-15','Rue du Lac Huron','Les Berges du Lac','Tunis','1053',1,'gabiam.k.samuel@gmail.com',NOW(),NOW()),
(UUID(),'Cloud','TELNET HOLDING','Ingénieur Cloud AWS','Stage PFE 6 mois','Migration d''infrastructure vers le cloud','Ingénieur','1-2 ans','Anglais',1,'+216 71 770 000','+216 71 770 001','stage@telnet.tn','rh@telnet.tn','2025-03-01','2025-08-31','Rue des Entrepreneurs','Charguia II','Tunis','2035',1,'gabiam.k.samuel@gmail.com',NOW(),NOW()),
(UUID(),'Informatique','ORANGE TUNISIE','Développeur API REST','Stage PFE 6 mois','Développement d''APIs pour services mobiles','Master','Débutant','Français',2,'+216 71 860 100','+216 71 860 101','stage@orange.tn','rh@orange.tn','2025-01-15','2025-07-15','Rue du Lac Léman','Les Berges du Lac','Tunis','1053',1,'gabiam.k.samuel@gmail.com',NOW(),NOW()),
(UUID(),'Banque','STB','Développeur Bancaire Core','Stage PFE 6 mois','Développement de modules de paiement','Master','Débutant','Français',1,'+216 71 340 000','+216 71 340 001','stage@stb.com.tn','rh@stb.com.tn','2025-02-01','2025-07-31','Rue Hédi Nouira','Centre Ville','Tunis','1001',1,'gabiam.k.samuel@gmail.com',NOW(),NOW()),
(UUID(),'Informatique','SOFRECOM TUNISIE','Ingénieur Test QA','Stage PFE 6 mois','Automatisation des tests avec Selenium','Master','Débutant','Français',1,'+216 71 860 000','+216 71 860 001','stage@sofrecom.tn','rh@sofrecom.tn','2025-03-15','2025-09-15','Rue du Lac Windermere','Les Berges du Lac','Tunis','1053',1,'gabiam.k.samuel@gmail.com',NOW(),NOW()),
(UUID(),'IA','TALAN TUNISIE','Ingénieur NLP','Stage PFE 6 mois','Développement d''un chatbot intelligent','Master','Débutant','Anglais',1,'+216 71 860 200','+216 71 860 201','stage@talan.tn','rh@talan.tn','2025-01-01','2025-06-30','Rue du Lac Malaren','Les Berges du Lac','Tunis','1053',1,'gabiam.k.samuel@gmail.com',NOW(),NOW()),
(UUID(),'Câblage Auto','LEONI TUNISIE','Ingénieur Automatisme','Stage PFA 3 mois','Programmation d''automates industriels','Licence','Débutant','Français',2,'+216 73 220 000','+216 73 220 001','stage@leoni.com','rh@leoni.com','2025-06-01','2025-08-31','Zone Industrielle Sousse Sud','Route de Sfax','Sousse','4000',0,'gabiam.k.samuel@gmail.com',NOW(),NOW()),
(UUID(),'Informatique','BIAT','Développeur Blockchain','Stage PFE 6 mois','Développement de smart contracts','Master','1-2 ans','Anglais',1,'+216 71 188 000','+216 71 188 001','stage@biat.com.tn','rh@biat.com.tn','2025-02-15','2025-08-15','Rue Hédi Karray','Ariana','Tunis','2080',1,'gabiam.k.samuel@gmail.com',NOW(),NOW()),
(UUID(),'Industrie','COFICAB','Ingénieur HSE','Stage PFE 6 mois','Mise en place d''un système de management HSE','Ingénieur','1-2 ans','Français',1,'+216 74 400 000','+216 74 400 001','stage@coficab.com','rh@coficab.com','2025-03-01','2025-08-31','Zone Industrielle Poudrière 2','Route de Tunis','Sfax','3000',1,'gabiam.k.samuel@gmail.com',NOW(),NOW()),
(UUID(),'Informatique','PROXYM GROUP','Développeur Vue.js','Stage PFA 3 mois','Développement d''un dashboard analytique','Licence','Débutant','Français',2,'+216 71 962 100','+216 71 962 101','stage@proxym.com','rh@proxym.com','2025-06-01','2025-08-31','Rue du Lac Huron','Les Berges du Lac','Tunis','1053',0,'gabiam.k.samuel@gmail.com',NOW(),NOW()),
(UUID(),'Télécommunications','ORANGE TUNISIE','Ingénieur VoIP','Stage PFE 6 mois','Déploiement de solutions VoIP entreprise','Ingénieur','1-2 ans','Français',2,'+216 71 860 100','+216 71 860 101','stage@orange.tn','rh@orange.tn','2025-01-15','2025-07-15','Rue du Lac Léman','Les Berges du Lac','Tunis','1053',1,'gabiam.k.samuel@gmail.com',NOW(),NOW());
