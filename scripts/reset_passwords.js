#!/usr/bin/env node
'use strict';
require('dotenv').config();
const bcrypt = require('bcrypt');
const { sequelize } = require('../config/database');

async function main() {
  const password = process.argv[2] || 'test2026#';
  await sequelize.authenticate();

  // Generate hash directly in Node — no shell interpolation issues
  const hash = await bcrypt.hash(password, 10);
  console.log('Password:', password);
  console.log('Hash length:', hash.length, '| prefix:', hash.slice(0, 7));

  // Use Sequelize model update (bypasses beforeCreate hook, sets raw hash)
  const { user_registration } = require('../model/userModel');

  const rows = await user_registration.findAll({
    where: sequelize.literal("EMAIL LIKE '%gestion.tn'")
  });

  for (const row of rows) {
    // Set the hash directly on the instance and save (bypasses beforeCreate)
    row.PASSWORD = hash;
    await row.save({ fields: ['PASSWORD'] });

    // Verify immediately
    const ok = bcrypt.compareSync(password, row.PASSWORD);
    console.log(`${row.EMAIL}: ${ok ? '✓ OK' : '✗ FAIL'}`);
  }

  await sequelize.close();
}

main().catch(e => { console.error(e.message); process.exit(1); });
