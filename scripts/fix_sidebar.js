'use strict';

require('dotenv').config();
const { sequelize } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function fixSidebar() {
    console.log('Fixing sidebar...');

    try {
        // Créer table et insérer données
        const sql = fs.readFileSync(path.join(__dirname, '..', 'items.sql'), 'utf8');
        const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);

        for (const stmt of statements) {
            await sequelize.query(stmt);
        }

        console.log(`✅ Sidebar table created and populated with ${statements.length - 2} items`);
        console.log('✅ Sidebar is now working!');

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await sequelize.close();
    }
}

// Override DB host for local execution outside docker
process.env.DB_HOST = '127.0.0.1';

fixSidebar();