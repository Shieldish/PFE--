'use strict';
require('dotenv').config();
const { sequelize } = require('../config/database');

async function main() {
  await sequelize.authenticate();

  // Get etudiant IDs and emails
  const etudiants = await sequelize.query(
    'SELECT ID, EMAIL, NOM, PRENOM, DEPARTEMENT, SPECIALITE FROM etudiant ORDER BY created_at LIMIT 15',
    { type: sequelize.QueryTypes.SELECT }
  );

  // Get stage IDs
  const stages = await sequelize.query(
    "SELECT id, titre, domaine, nom_entreprise, created_by FROM stage WHERE created_by='gabiam.k.samuel@gmail.com' ORDER BY created_at DESC LIMIT 15",
    { type: sequelize.QueryTypes.SELECT }
  );

  if (!etudiants.length || !stages.length) {
    console.log('No etudiants or stages found');
    process.exit(0);
  }

  const statuses = ['a attente', 'accepté', 'refusé'];
  let inserted = 0;

  for (let i = 0; i < Math.min(etudiants.length, stages.length); i++) {
    const e = etudiants[i];
    const s = stages[i];
    const status = statuses[i % 3];

    try {
      await sequelize.query(
        `INSERT IGNORE INTO stagepostulation
          (stageId, etudiantID, etudiantName, etudiantEmail, etudiantSection,
           etudiantInstitue, stageDomaine, stageSujet, entrepriseName, entrepriseEmail,
           status, CV, postulatedAt)
         VALUES (:stageId, :etudiantID, :etudiantName, :etudiantEmail, :etudiantSection,
           'FSS Sfax', :stageDomaine, :stageSujet, :entrepriseName, :entrepriseEmail,
           :status, :cv, DATE_SUB(NOW(), INTERVAL :days DAY))`,
        {
          replacements: {
            stageId: s.id,
            etudiantID: e.ID,
            etudiantName: `${e.NOM} ${e.PRENOM}`,
            etudiantEmail: e.EMAIL,
            etudiantSection: `${e.DEPARTEMENT} : ${e.SPECIALITE}`,
            stageDomaine: s.domaine,
            stageSujet: s.titre,
            entrepriseName: s.nom_entreprise,
            entrepriseEmail: s.created_by,
            status,
            cv: `https://drive.google.com/file/d/cv-${e.PRENOM.toLowerCase()}/view`,
            days: i + 1,
          }
        }
      );
      inserted++;
    } catch (err) {
      console.warn(`Skipped ${e.EMAIL}: ${err.message}`);
    }
  }

  const [cnt] = await sequelize.query('SELECT COUNT(*) as cnt FROM stagepostulation', { type: sequelize.QueryTypes.SELECT });
  console.log(`Inserted ${inserted} postulations. Total: ${cnt.cnt}`);
  await sequelize.close();
}

main().catch(e => { console.error(e.message); process.exit(1); });
