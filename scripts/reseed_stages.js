'use strict';
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('../config/database');

const stages = [
  { domaine: 'Informatique',       nom_entreprise: 'SOFRECOM TUNISIE',  titre: 'Développeur Full Stack Java/Angular',    niveau: 'Master',    experience: 'Débutant',  langue: 'Français', postes_vacants: 2, ville: 'Tunis',  date_debut: '2025-02-01', date_fin: '2025-07-31', email: 'stage@sofrecom.tn' },
  { domaine: 'Fintech',            nom_entreprise: 'VERMEG',            titre: 'Développeur Backend Node.js',            niveau: 'Master',    experience: 'Débutant',  langue: 'Anglais',  postes_vacants: 1, ville: 'Tunis',  date_debut: '2025-03-01', date_fin: '2025-08-31', email: 'stage@vermeg.com' },
  { domaine: 'IT Services',        nom_entreprise: 'TELNET HOLDING',    titre: 'Ingénieur DevOps',                       niveau: 'Ingénieur', experience: '1-2 ans',   langue: 'Français', postes_vacants: 2, ville: 'Tunis',  date_debut: '2025-01-15', date_fin: '2025-07-15', email: 'stage@telnet.tn' },
  { domaine: 'Informatique',       nom_entreprise: 'PROXYM GROUP',      titre: 'Développeur React.js',                   niveau: 'Master',    experience: 'Débutant',  langue: 'Français', postes_vacants: 3, ville: 'Tunis',  date_debut: '2025-02-15', date_fin: '2025-08-15', email: 'stage@proxym.com' },
  { domaine: 'Conseil IT',         nom_entreprise: 'TALAN TUNISIE',     titre: 'Consultant Data Analyst',                niveau: 'Master',    experience: 'Débutant',  langue: 'Français', postes_vacants: 1, ville: 'Tunis',  date_debut: '2025-03-15', date_fin: '2025-09-15', email: 'stage@talan.tn' },
  { domaine: 'Télécommunications', nom_entreprise: 'ORANGE TUNISIE',    titre: 'Ingénieur Réseaux',                      niveau: 'Ingénieur', experience: '1-2 ans',   langue: 'Français', postes_vacants: 2, ville: 'Tunis',  date_debut: '2025-01-01', date_fin: '2025-06-30', email: 'stage@orange.tn' },
  { domaine: 'Informatique',       nom_entreprise: 'SOFRECOM TUNISIE',  titre: 'Développeur Mobile Flutter',             niveau: 'Licence',   experience: 'Débutant',  langue: 'Français', postes_vacants: 2, ville: 'Tunis',  date_debut: '2025-06-01', date_fin: '2025-08-31', email: 'stage@sofrecom.tn' },
  { domaine: 'Cybersécurité',      nom_entreprise: 'TELNET HOLDING',    titre: 'Analyste Cybersécurité',                 niveau: 'Ingénieur', experience: '1-2 ans',   langue: 'Anglais',  postes_vacants: 1, ville: 'Tunis',  date_debut: '2025-02-01', date_fin: '2025-07-31', email: 'stage@telnet.tn' },
  { domaine: 'IA',                 nom_entreprise: 'PROXYM GROUP',      titre: 'Ingénieur Machine Learning',             niveau: 'Master',    experience: 'Débutant',  langue: 'Anglais',  postes_vacants: 1, ville: 'Tunis',  date_debut: '2025-03-01', date_fin: '2025-08-31', email: 'stage@proxym.com' },
  { domaine: 'Banque',             nom_entreprise: 'BIAT',              titre: 'Développeur Bancaire',                   niveau: 'Master',    experience: 'Débutant',  langue: 'Français', postes_vacants: 2, ville: 'Tunis',  date_debut: '2025-01-15', date_fin: '2025-07-15', email: 'stage@biat.com.tn' },
  { domaine: 'Banque',             nom_entreprise: 'AMEN BANK',         titre: 'Analyste Financier',                     niveau: 'Master',    experience: 'Débutant',  langue: 'Français', postes_vacants: 1, ville: 'Tunis',  date_debut: '2025-02-15', date_fin: '2025-08-15', email: 'stage@amen.com.tn' },
  { domaine: 'Industrie',          nom_entreprise: 'COFICAB',           titre: 'Ingénieur Qualité',                      niveau: 'Ingénieur', experience: '1-2 ans',   langue: 'Français', postes_vacants: 2, ville: 'Sfax',   date_debut: '2025-01-01', date_fin: '2025-06-30', email: 'stage@coficab.com' },
  { domaine: 'Câblage Auto',       nom_entreprise: 'LEONI TUNISIE',     titre: 'Ingénieur Méthodes',                     niveau: 'Ingénieur', experience: '1-2 ans',   langue: 'Français', postes_vacants: 2, ville: 'Sousse', date_debut: '2025-02-01', date_fin: '2025-07-31', email: 'stage@leoni.com' },
  { domaine: 'Agroalimentaire',    nom_entreprise: 'SFBT',              titre: 'Ingénieur Agroalimentaire',              niveau: 'Ingénieur', experience: 'Débutant',  langue: 'Français', postes_vacants: 1, ville: 'Sfax',   date_debut: '2025-03-01', date_fin: '2025-08-31', email: 'stage@sfbt.com.tn' },
  { domaine: 'Transport Aérien',   nom_entreprise: 'TUNISAIR',          titre: 'Ingénieur Systèmes Embarqués',           niveau: 'Ingénieur', experience: '1-2 ans',   langue: 'Anglais',  postes_vacants: 1, ville: 'Tunis',  date_debut: '2025-01-15', date_fin: '2025-07-15', email: 'stage@tunisair.com.tn' },
  { domaine: 'Informatique',       nom_entreprise: 'TALAN TUNISIE',     titre: 'Développeur Python/Django',              niveau: 'Master',    experience: 'Débutant',  langue: 'Français', postes_vacants: 2, ville: 'Tunis',  date_debut: '2025-02-01', date_fin: '2025-07-31', email: 'stage@talan.tn' },
  { domaine: 'Télécommunications', nom_entreprise: 'SOTETEL',           titre: 'Ingénieur Télécoms',                     niveau: 'Ingénieur', experience: '1-2 ans',   langue: 'Français', postes_vacants: 2, ville: 'Tunis',  date_debut: '2025-03-15', date_fin: '2025-09-15', email: 'stage@sotetel.tn' },
  { domaine: 'Industrie',          nom_entreprise: 'POULINA GROUP',     titre: 'Ingénieur Industriel',                   niveau: 'Ingénieur', experience: '1-2 ans',   langue: 'Français', postes_vacants: 2, ville: 'Tunis',  date_debut: '2025-01-01', date_fin: '2025-06-30', email: 'stage@poulina.com' },
  { domaine: 'Informatique',       nom_entreprise: 'VERMEG',            titre: 'Développeur Angular/Spring',             niveau: 'Licence',   experience: 'Débutant',  langue: 'Français', postes_vacants: 3, ville: 'Tunis',  date_debut: '2025-06-01', date_fin: '2025-08-31', email: 'stage@vermeg.com' },
  { domaine: 'Data Science',       nom_entreprise: 'PROXYM GROUP',      titre: 'Data Engineer',                          niveau: 'Master',    experience: 'Débutant',  langue: 'Anglais',  postes_vacants: 1, ville: 'Tunis',  date_debut: '2025-02-15', date_fin: '2025-08-15', email: 'stage@proxym.com' },
  { domaine: 'Cloud',              nom_entreprise: 'TELNET HOLDING',    titre: 'Ingénieur Cloud AWS',                    niveau: 'Ingénieur', experience: '1-2 ans',   langue: 'Anglais',  postes_vacants: 1, ville: 'Tunis',  date_debut: '2025-03-01', date_fin: '2025-08-31', email: 'stage@telnet.tn' },
  { domaine: 'Informatique',       nom_entreprise: 'ORANGE TUNISIE',    titre: 'Développeur API REST',                   niveau: 'Master',    experience: 'Débutant',  langue: 'Français', postes_vacants: 2, ville: 'Tunis',  date_debut: '2025-01-15', date_fin: '2025-07-15', email: 'stage@orange.tn' },
  { domaine: 'Banque',             nom_entreprise: 'STB',               titre: 'Développeur Bancaire Core',              niveau: 'Master',    experience: 'Débutant',  langue: 'Français', postes_vacants: 1, ville: 'Tunis',  date_debut: '2025-02-01', date_fin: '2025-07-31', email: 'stage@stb.com.tn' },
  { domaine: 'Informatique',       nom_entreprise: 'SOFRECOM TUNISIE',  titre: 'Ingénieur Test QA',                      niveau: 'Master',    experience: 'Débutant',  langue: 'Français', postes_vacants: 1, ville: 'Tunis',  date_debut: '2025-03-15', date_fin: '2025-09-15', email: 'stage@sofrecom.tn' },
  { domaine: 'IA',                 nom_entreprise: 'TALAN TUNISIE',     titre: 'Ingénieur NLP',                          niveau: 'Master',    experience: 'Débutant',  langue: 'Anglais',  postes_vacants: 1, ville: 'Tunis',  date_debut: '2025-01-01', date_fin: '2025-06-30', email: 'stage@talan.tn' },
  { domaine: 'Câblage Auto',       nom_entreprise: 'LEONI TUNISIE',     titre: 'Ingénieur Automatisme',                  niveau: 'Licence',   experience: 'Débutant',  langue: 'Français', postes_vacants: 2, ville: 'Sousse', date_debut: '2025-06-01', date_fin: '2025-08-31', email: 'stage@leoni.com' },
  { domaine: 'Informatique',       nom_entreprise: 'BIAT',              titre: 'Développeur Blockchain',                 niveau: 'Master',    experience: '1-2 ans',   langue: 'Anglais',  postes_vacants: 1, ville: 'Tunis',  date_debut: '2025-02-15', date_fin: '2025-08-15', email: 'stage@biat.com.tn' },
  { domaine: 'Industrie',          nom_entreprise: 'COFICAB',           titre: 'Ingénieur HSE',                          niveau: 'Ingénieur', experience: '1-2 ans',   langue: 'Français', postes_vacants: 1, ville: 'Sfax',   date_debut: '2025-03-01', date_fin: '2025-08-31', email: 'stage@coficab.com' },
  { domaine: 'Informatique',       nom_entreprise: 'PROXYM GROUP',      titre: 'Développeur Vue.js',                     niveau: 'Licence',   experience: 'Débutant',  langue: 'Français', postes_vacants: 2, ville: 'Tunis',  date_debut: '2025-06-01', date_fin: '2025-08-31', email: 'stage@proxym.com' },
  { domaine: 'Télécommunications', nom_entreprise: 'ORANGE TUNISIE',    titre: 'Ingénieur VoIP',                         niveau: 'Ingénieur', experience: '1-2 ans',   langue: 'Français', postes_vacants: 2, ville: 'Tunis',  date_debut: '2025-01-15', date_fin: '2025-07-15', email: 'stage@orange.tn' },
];

async function main() {
  await sequelize.authenticate();
  console.log('Connected. Inserting', stages.length, 'stages...');

  for (const s of stages) {
    await sequelize.query(
      `INSERT INTO stage (id, created_by, titre, domaine, nom_entreprise, libelle, description,
        niveau, experience, langue, postes_vacants, telephone, fax, email, email2,
        date_debut, date_fin, adresse, rue, ville, code_postal, is_active, created_at, updated_at)
       VALUES (:id, :created_by, :titre, :domaine, :nom_entreprise, :libelle, NULL,
        :niveau, :experience, :langue, :postes_vacants, 'N/A', 'N/A', :email, :email,
        :date_debut, :date_fin, 'N/A', 'N/A', :ville, 'N/A', 1, NOW(), NOW())`,
      {
        replacements: {
          id: uuidv4(),
          created_by: 'gabiam.k.samuel@gmail.com',
          titre: s.titre,
          domaine: s.domaine,
          nom_entreprise: s.nom_entreprise,
          libelle: s.titre,
          niveau: s.niveau,
          experience: s.experience,
          langue: s.langue,
          postes_vacants: s.postes_vacants,
          email: s.email,
          date_debut: s.date_debut,
          date_fin: s.date_fin,
          ville: s.ville,
        }
      }
    );
  }

  const [rows] = await sequelize.query('SELECT COUNT(*) as cnt FROM stage', { type: sequelize.QueryTypes.SELECT });
  console.log('Total stages now:', rows.cnt);
  await sequelize.close();
}

main().catch(e => { console.error(e.message); process.exit(1); });
