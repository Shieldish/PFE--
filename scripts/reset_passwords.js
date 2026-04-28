#!/usr/bin/env node
'use strict';
require('dotenv').config();
const bcrypt = require('bcrypt');
const { sequelize } = require('../config/database');

async function main() {
  const hash = bcrypt.hashSync('Admin1234!', 10);
  console.log('New hash:', hash);

  await sequelize.authenticate();

  const [rows] = await sequelize.query(
    `UPDATE user_registrations
     SET PASSWORD = :hash
     WHERE EMAIL IN ('admin@gestion.tn','dept@gestion.tn','etudiant@gestion.tn','entreprise@gestion.tn')`,
    { replacements: { hash } }
  );
  console.log('Updated rows:', rows.affectedRows ?? rows);
  await sequelize.close();
}

main().catch(e => { console.error(e); process.exit(1); });
