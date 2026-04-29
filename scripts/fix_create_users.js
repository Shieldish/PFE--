'use strict';

const bcrypt = require('bcrypt');
const { sequelize } = require('../config/database');
const { UserRegistration } = require('../model/UserRegistrationModel');

async function createCorrectUsers() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données établie');

    const password = 'test2026#';

    const users = [
      {
        email: 'admin@gestion.tn',
        password_hash: password,
        role: 'ADMIN'
      },
      {
        email: 'enseignant@gestion.tn',
        password_hash: password,
        role: 'TEACHER'
      },
      {
        email: 'etudiant@gestion.tn',
        password_hash: password,
        role: 'STUDENT'
      },
      {
        email: 'entreprise@gestion.tn',
        password_hash: password,
        role: 'COMPANY'
      },
      {
        email: 'encadrant@gestion.tn',
        password_hash: password,
        role: 'SUPERVISOR'
      }
    ];

    for (const userData of users) {
      const [user, created] = await UserRegistration.findOrCreate({
        where: { email: userData.email.toLowerCase() },
        defaults: userData
      });

      if (created) {
        console.log(`✅ Utilisateur créé dans la NOUVELLE table: ${userData.email} (${userData.role})`);
      } else {
        console.log(`ℹ️ Utilisateur existe déjà: ${userData.email}`);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        await user.update({ password_hash: hashedPassword, is_active: true });
        console.log(`✅ Mot de passe mis à jour: ${userData.email}`);
      }
    }

    console.log('\n✅ Tous les comptes ont été mis à jour CORRECTEMENT dans le nouveau schéma');
    console.log('\n🔑 Mot de passe: test2026#');
    console.log('\n✅ La connexion fonctionnera MAINTENANT !\n');

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

createCorrectUsers();