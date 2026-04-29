'use strict';

const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');

// Récupérer la sidebar avec hiérarchie
router.post('/sidebar', async (req, res) => {
    try {
        const lang = req.body.lang || 'fr';
        const nameField = `name_${lang}`;

        // Récupérer tous les items
        const [items] = await sequelize.query(`
            SELECT id, parent_id, link, icon, ${nameField} as name
            FROM sidebar_items
            ORDER BY id ASC
        `);

        // Construire l'arborescence
        const map = {};
        const roots = [];

        items.forEach(item => {
            map[item.id] = { ...item, children: [] };
        });

        items.forEach(item => {
            if (item.parent_id === null) {
                roots.push(map[item.id]);
            } else if (map[item.parent_id]) {
                map[item.parent_id].children.push(map[item.id]);
            }
        });

        return res.json(roots);
    } catch (err) {
        console.error('Sidebar error:', err);
        return res.status(500).json({ error: 'Failed to load sidebar' });
    }
});

module.exports = router;