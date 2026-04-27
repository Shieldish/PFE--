'use strict';

require('dotenv').config();

const path = require('path');
const fs = require('fs');
const { sequelize } = require('../config/database');

async function seedSidebar() {
  const sqlPath = path.join(__dirname, '..', 'items.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  try {
    for (const statement of statements) {
      await sequelize.query(statement);
    }
    console.log(`Sidebar seeded successfully (${statements.length} statements executed).`);
  } finally {
    await sequelize.close();
  }
}

seedSidebar().catch((err) => {
  console.error('Failed to seed sidebar:', err);
  process.exit(1);
});
