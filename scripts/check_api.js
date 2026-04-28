require('dotenv').config();
const stage = require('../model/stagesModel');
stage.findAll({ limit: 2, order: [['created_at', 'DESC']] }).then(rows => {
  rows.forEach(r => {
    const j = r.toJSON();
    console.log('---');
    console.log('Titre:', j.Titre);
    console.log('Domaine:', j.Domaine);
    console.log('Nom:', j.Nom);
    console.log('Address:', j.Address);
    console.log('DateDebut:', j.DateDebut);
    console.log('Niveau:', j.Niveau);
    console.log('PostesVacants:', j.PostesVacants);
    console.log('id:', j.id);
  });
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
