'use strict';

require('dotenv').config();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const zlib = require('node:zlib');
const { sequelize } = require('../config/database');

const NOW = new Date().toISOString().slice(0, 19).replace('T', ' ');

function compress(text) {
    return zlib.deflateSync(text).toString('base64');
}

async function seed() {
    const q = (sql, replacements = []) =>
        sequelize.query(sql, { replacements, type: sequelize.QueryTypes.RAW });

    // ── user_registration ──────────────────────────────────────────────────────
    const password = await bcrypt.hash('password123', 10);

    const users = [
        { uuid: uuidv4(), email: 'admin@test.com',      nom: 'Admin',    prenom: 'System',  role: 'ADMIN',       dept: 'Informatique' },
        { uuid: uuidv4(), email: 'dept@test.com',       nom: 'Chef',     prenom: 'Dept',    role: 'DEPARTEMENT', dept: 'Informatique' },
        { uuid: uuidv4(), email: 'entreprise1@test.com',nom: 'TechCorp', prenom: 'DZ',      role: 'ENTREPRISE',  dept: 'NA' },
        { uuid: uuidv4(), email: 'entreprise2@test.com',nom: 'SoftHouse',prenom: 'DZ',      role: 'ENTREPRISE',  dept: 'NA' },
        { uuid: uuidv4(), email: 'etudiant1@test.com',  nom: 'Benali',   prenom: 'Youssef', role: 'USER',        dept: 'Informatique' },
        { uuid: uuidv4(), email: 'etudiant2@test.com',  nom: 'Hammadi',  prenom: 'Sara',    role: 'USER',        dept: 'Electronique' },
        { uuid: uuidv4(), email: 'etudiant3@test.com',  nom: 'Meziane',  prenom: 'Amine',   role: 'USER',        dept: 'Génie Civil' },
    ];

    console.log('Seeding user_registration...');
    for (const u of users) {
        await sequelize.query(
            `INSERT IGNORE INTO user_registration
             (UUID, EMAIL, NOM, PRENOM, PASSWORD, DEPARTEMENT, ADDRESS, DATE, role, ISVALIDATED, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, 'Alger', NOW(), ?, 1, NOW(), NOW())`,
            { replacements: [u.uuid, u.email, u.nom, u.prenom, password, u.dept, u.role] }
        );
    }

    // ── entreprise ─────────────────────────────────────────────────────────────
    console.log('Seeding entreprise...');
    const entreprises = [
        { email: 'entreprise1@test.com', nom: 'TechCorp DZ',   domaine: 'Informatique',       ville: 'Alger',  tel: '0555 123 456' },
        { email: 'entreprise2@test.com', nom: 'SoftHouse DZ',  domaine: 'Développement Web',  ville: 'Oran',   tel: '0555 654 321' },
        { email: 'contact@digitalsol.dz',nom: 'Digital Solutions', domaine: 'Data Science',   ville: 'Annaba', tel: '0555 111 222' },
    ];
    for (const e of entreprises) {
        await sequelize.query(
            `INSERT IGNORE INTO entreprise (EMAIL, NOM, DOMAINE, VILLE, ADDRESSE, TELEPHONE, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, '10 Rue des Développeurs', ?, NOW(), NOW())`,
            { replacements: [e.email, e.nom, e.domaine, e.ville, e.tel] }
        );
    }

    // ── enseignant ─────────────────────────────────────────────────────────────
    console.log('Seeding enseignant...');
    const enseignants = [
        { email: 'prof.amrani@univ.dz',  nom: 'Amrani',  prenom: 'Karim',   sexe: 'M', dept: 'Informatique' },
        { email: 'prof.boudiaf@univ.dz', nom: 'Boudiaf', prenom: 'Nadia',   sexe: 'F', dept: 'Electronique' },
        { email: 'prof.cherif@univ.dz',  nom: 'Cherif',  prenom: 'Mohamed', sexe: 'M', dept: 'Génie Civil'  },
    ];
    for (const t of enseignants) {
        await sequelize.query(
            `INSERT IGNORE INTO enseignant (EMAIL, NOM, PRENOM, SEXE, DEPARTEMENT, DATE, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, '2020-09-01', NOW(), NOW())`,
            { replacements: [t.email, t.nom, t.prenom, t.sexe, t.dept] }
        );
    }

    // ── encadrant ──────────────────────────────────────────────────────────────
    console.log('Seeding encadrant...');
    const encadrants = [
        { email: 'encadrant1@techcorp.dz', nom: 'Mansouri', prenom: 'Ali',    sexe: 'M', dept: 'R&D' },
        { email: 'encadrant2@softhouse.dz',nom: 'Belkacem', prenom: 'Leila',  sexe: 'F', dept: 'Dev' },
    ];
    for (const enc of encadrants) {
        await sequelize.query(
            `INSERT IGNORE INTO encadrant (EMAIL, NOM, PRENOM, SEXE, DEPARTEMENT, DATE, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, '2022-01-01', NOW(), NOW())`,
            { replacements: [enc.email, enc.nom, enc.prenom, enc.sexe, enc.dept] }
        );
    }

    // ── etudiant ───────────────────────────────────────────────────────────────
    console.log('Seeding etudiant...');
    const etudiants = [
        { id: uuidv4(), email: 'etudiant1@test.com', nom: 'Benali',  prenom: 'Youssef', sexe: 'M', dept: 'Informatique', specialite: 'Génie Logiciel' },
        { id: uuidv4(), email: 'etudiant2@test.com', nom: 'Hammadi', prenom: 'Sara',    sexe: 'F', dept: 'Electronique', specialite: 'Systèmes Embarqués' },
        { id: uuidv4(), email: 'etudiant3@test.com', nom: 'Meziane', prenom: 'Amine',   sexe: 'M', dept: 'Génie Civil',  specialite: 'Construction' },
    ];
    for (const et of etudiants) {
        await sequelize.query(
            `INSERT IGNORE INTO etudiant (ID, EMAIL, NOM, PRENOM, SEXE, DEPARTEMENT, SPECIALITE, DATE, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, '2021-09-15', NOW(), NOW())`,
            { replacements: [et.id, et.email, et.nom, et.prenom, et.sexe, et.dept, et.specialite] }
        );
    }

    // ── stage ──────────────────────────────────────────────────────────────────
    console.log('Seeding stage...');
    const stagesData = [
        {
            id: uuidv4(), created_by: 'entreprise1@test.com', nom_entreprise: 'TechCorp DZ',
            titre: 'Développeur Full Stack Node.js / React',
            domaine: 'Informatique', niveau: 'Master', experience: 'Débutant', langue: 'Français',
            libelle: 'Stage de fin d\'études en développement web full stack avec Node.js et React.',
            description: 'Vous rejoindrez notre équipe de développement pour participer à la conception et au développement d\'applications web modernes. Vous travaillerez sur des projets réels utilisant les technologies Node.js, React, et MySQL.',
            ville: 'Alger', adresse: '10 Rue des Développeurs, Alger', email: 'entreprise1@test.com',
            telephone: '0555 123 456', date_debut: '2026-06-01', date_fin: '2026-08-31',
        },
        {
            id: uuidv4(), created_by: 'entreprise1@test.com', nom_entreprise: 'TechCorp DZ',
            titre: 'Stage DevOps & Cloud (Docker / Kubernetes)',
            domaine: 'Informatique', niveau: 'Master', experience: 'Intermédiaire', langue: 'Anglais',
            libelle: 'Intégration et déploiement continu, gestion d\'infrastructure cloud.',
            description: 'Dans ce stage vous apprendrez à configurer des pipelines CI/CD, gérer des conteneurs Docker, et déployer des applications sur des clusters Kubernetes. Vous utiliserez AWS et Terraform.',
            ville: 'Alger', adresse: '10 Rue des Développeurs, Alger', email: 'entreprise1@test.com',
            telephone: '0555 123 456', date_debut: '2026-07-01', date_fin: '2026-09-30',
        },
        {
            id: uuidv4(), created_by: 'entreprise2@test.com', nom_entreprise: 'SoftHouse DZ',
            titre: 'Stage Data Science & Machine Learning',
            domaine: 'Data Science', niveau: 'Master', experience: 'Débutant', langue: 'Français',
            libelle: 'Analyse de données et développement de modèles d\'apprentissage automatique.',
            description: 'Vous analyserez des jeux de données métier, développerez des modèles de prédiction en Python avec scikit-learn et TensorFlow, et présenterez vos résultats à l\'équipe.',
            ville: 'Oran', adresse: '5 Boulevard de l\'Innovation, Oran', email: 'entreprise2@test.com',
            telephone: '0555 654 321', date_debut: '2026-06-15', date_fin: '2026-09-15',
        },
        {
            id: uuidv4(), created_by: 'entreprise2@test.com', nom_entreprise: 'SoftHouse DZ',
            titre: 'Stage Développement Mobile (Flutter)',
            domaine: 'Développement Mobile', niveau: 'Licence', experience: 'Débutant', langue: 'Français',
            libelle: 'Développement d\'applications mobiles cross-platform avec Flutter.',
            description: 'Rejoignez notre équipe mobile pour développer des applications Android/iOS avec Flutter et Dart. Vous participerez à toutes les phases du cycle de développement.',
            ville: 'Oran', adresse: '5 Boulevard de l\'Innovation, Oran', email: 'entreprise2@test.com',
            telephone: '0555 654 321', date_debut: '2026-06-01', date_fin: '2026-08-31',
        },
        {
            id: uuidv4(), created_by: 'contact@digitalsol.dz', nom_entreprise: 'Digital Solutions',
            titre: 'Stage Cybersécurité & Audit Système',
            domaine: 'Sécurité Informatique', niveau: 'Master', experience: 'Intermédiaire', langue: 'Français',
            libelle: 'Audit de sécurité, tests d\'intrusion et mise en place de politiques de sécurité.',
            description: 'Vous participerez aux audits de sécurité de nos clients, réaliserez des tests de pénétration et contribuerez à la rédaction de rapports et de recommandations de sécurité.',
            ville: 'Annaba', adresse: '3 Rue de la Technologie, Annaba', email: 'contact@digitalsol.dz',
            telephone: '0555 111 222', date_debut: '2026-07-01', date_fin: '2026-09-30',
        },
    ];

    for (const s of stagesData) {
        const desc = compress(s.description);
        await sequelize.query(
            `INSERT IGNORE INTO stage
             (id, created_by, nom_entreprise, titre, domaine, libelle, description, niveau, experience, langue,
              postes_vacants, telephone, email, date_debut, date_fin, adresse, ville, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 2, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
            { replacements: [
                s.id, s.created_by, s.nom_entreprise, s.titre, s.domaine, s.libelle, desc,
                s.niveau, s.experience, s.langue, s.telephone, s.email,
                s.date_debut, s.date_fin, s.adresse, s.ville,
            ]}
        );
    }

    // ── stagepostulation (candidatures from students) ─────────────────────────
    console.log('Seeding stagepostulation...');
    const [stageRows] = await sequelize.query('SELECT id, titre, domaine, nom_entreprise, email FROM stage LIMIT 3');
    const etudiant1 = etudiants[0];
    const etudiant2 = etudiants[1];

    if (stageRows.length >= 2) {
        const s1 = stageRows[0];
        const s2 = stageRows[1];
        const s3 = stageRows[2] || s1;
        await sequelize.query(
            `INSERT IGNORE INTO stagepostulation
             (stageId, etudiantID, etudiantName, etudiantInstitue, etudiantSection, etudiantEmail,
              stageDomaine, stageSujet, entrepriseName, entrepriseEmail, status, postulatedAt)
             VALUES
             (?, ?, 'Benali Youssef', 'Université USTHB', 'Informatique', ?,  ?, ?, ?, ?, 'a attente', NOW()),
             (?, ?, 'Hammadi Sara',   'Université Oran',  'Electronique', ?,  ?, ?, ?, ?, 'accepté',   NOW()),
             (?, ?, 'Benali Youssef', 'Université USTHB', 'Informatique', ?,  ?, ?, ?, ?, 'refusé',    NOW())`,
            { replacements: [
                s1.id, etudiant1.id, etudiant1.email, s1.domaine, s1.titre, s1.nom_entreprise, s1.email,
                s2.id, etudiant2.id, etudiant2.email, s2.domaine, s2.titre, s2.nom_entreprise, s2.email,
                s3.id, etudiant1.id, etudiant1.email, s3.domaine, s3.titre, s3.nom_entreprise, s3.email,
            ]}
        );
    }

    // ── soutenance ─────────────────────────────────────────────────────────────
    console.log('Seeding soutenance...');
    await sequelize.query(
        `INSERT IGNORE INTO soutenance
         (date_soutenance, heure, salle, groupe, type_groupe,
          etudiant1_nom, sujet, encadrant_professionnel, entreprise_nom, created_at, updated_at)
         VALUES
         ('2026-09-20', '09:00:00', 'Salle A101', 'G1', 'Monome',
          'Benali Youssef', 'Développement d\\'une plateforme de gestion de stages', 'Ali Mansouri', 'TechCorp DZ', NOW(), NOW()),
         ('2026-09-21', '10:30:00', 'Salle B202', 'G2', 'Binome',
          'Hammadi Sara',   'Analyse prédictive avec Machine Learning', 'Leila Belkacem', 'SoftHouse DZ', NOW(), NOW())`
    );

    console.log('\n✅ Seed complete! Summary:');
    const [counts] = await sequelize.query(
        `SELECT
           (SELECT COUNT(*) FROM user_registration) AS users,
           (SELECT COUNT(*) FROM entreprise)        AS entreprises,
           (SELECT COUNT(*) FROM enseignant)        AS enseignants,
           (SELECT COUNT(*) FROM encadrant)         AS encadrants,
           (SELECT COUNT(*) FROM etudiant)          AS etudiants,
           (SELECT COUNT(*) FROM stage)             AS stages,
           (SELECT COUNT(*) FROM stagepostulation)  AS postulations,
           (SELECT COUNT(*) FROM soutenance)        AS soutenances`
    );
    console.table(counts[0]);

    await sequelize.close();
}

seed().catch(err => { console.error('Seed failed:', err.message); process.exit(1); });
