'use strict';

const bcrypt = require('bcrypt');
const { sequelize } = require('../config/database');
const { user_registration } = require('../model/userModel');

async function createUsers() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données établie');

    const password = 'test2026#';

    const users = [
      {
        UUID: crypto.randomUUID(),
        EMAIL: 'admin@gestion.tn',
        NOM: 'Admin',
        PRENOM: 'System',
        PASSWORD: password,
        role: 'ADMIN',
        ISVALIDATED: true
      },
      {
        UUID: crypto.randomUUID(),
        EMAIL: 'enseignant@gestion.tn',
        NOM: 'Enseignant',
        PRENOM: 'Test',
        PASSWORD: password,
        role: 'DEPARTEMENT',
        ISVALIDATED: true
      },
      {
        UUID: crypto.randomUUID(),
        EMAIL: 'etudiant@gestion.tn',
        NOM: 'Etudiant',
        PRENOM: 'Test',
        PASSWORD: password,
        role: 'USER',
        ISVALIDATED: true
      },
      {
        UUID: crypto.randomUUID(),
        EMAIL: 'entreprise@gestion.tn',
        NOM: 'Entreprise',
        PRENOM: 'Test',
        PASSWORD: password,
        role: 'ENTREPRISE',
        ISVALIDATED: true
      },
      {
        UUID: crypto.randomUUID(),
        EMAIL: 'encadrant@gestion.tn',
        NOM: 'Encadrant',
        PRENOM: 'Test',
        PASSWORD: password,
        role: 'DEPARTEMENT',
        ISVALIDATED: true
      }
    ];

    for (const userData of users) {
      const [user, created] = await user_registration.findOrCreate({
        where: { EMAIL: userData.EMAIL },
        defaults: userData
      });

      if (created) {
        console.log(`✅ Utilisateur créé: ${userData.EMAIL} (${userData.role})`);
      } else {
        console.log(`ℹ️ Utilisateur existe déjà: ${userData.EMAIL}`);
        await user.update({ PASSWORD: password, ISVALIDATED: true });
        console.log(`✅ Mot de passe mis à jour pour: ${userData.EMAIL}`);
      }
    }

    console.log('\n✅ Tous les comptes ont été créés avec succès');
    console.log('\n🔑 Mot de passe commun pour tous les comptes: test2026#\n');

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

createUsers();