#!/usr/bin/env node
'use strict';
require('dotenv').config();
const bcrypt = require('bcrypt');
const { sequelize } = require('../config/database');

async function main() {
  await sequelize.authenticate();
  const rows = await sequelize.query(
    "SELECT EMAIL, PASSWORD FROM user_registrations WHERE EMAIL LIKE '%gestion.tn'",
    { type: sequelize.QueryTypes.SELECT }
  );

  const password = 'Admin1234!';
  for (const row of rows) {
    const match = bcrypt.compareSync(password, row.PASSWORD);
    console.log(`${row.EMAIL}: ${match ? '✓ OK' : '✗ FAIL'}`);
  }
  await sequelize.close();
}

main().catch(e => { console.error(e); process.exit(1); });
