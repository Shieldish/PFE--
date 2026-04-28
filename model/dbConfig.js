'use strict';

require('dotenv').config();
const { sequelize } = require('../config/database');

let isConnected = false;

const connectToDatabase = async () => {
  try {
    if (!isConnected) {
      await sequelize.authenticate();
      console.log('Connected to MySQL database');
      isConnected = true;
    }
  } catch (err) {
    console.error('Error connecting to MySQL database:', err);
    isConnected = false;
    throw err;
  }
};

const fetchSidebarItems = async (lang, userRole) => {
  const sidebarSql = `
    SELECT
      s.id,
      s.name_${lang} AS name,
      s.link,
      s.icon,
      s.parent_id
    FROM sidebar_items s
    ORDER BY s.parent_id, s.id
  `;

  try {
    const [sidebarResults] = await sequelize.query(sidebarSql);
    const sidebarItems = buildSidebarTree(sidebarResults, userRole);
    return sidebarItems;
  } catch (err) {
    console.error('Error fetching sidebar items:', err);
    throw err;
  }
};

const buildSidebarTree = (items, userRole, parentId = null) => {
  return items
    .filter(item => item.parent_id === parentId)
    .map(item => {
      const children = buildSidebarTree(items, userRole, item.id);
      const hasAccessToItem = hasAccess(item.link, userRole);
      const hasAccessToChildren = children.some(child => child.visible);

      return {
        id: item.id,
        name: item.name,
        link: item.link,
        icon: item.icon,
        children: children.filter(child => child.visible),
        visible: hasAccessToItem || hasAccessToChildren
      };
    })
    .filter(item => item.visible);
};

const hasAccess = (link, userRole) => {
  // Support both old role names (from JWT) and new normalized names
  const roleAccess = {
    '/': ['USER', 'ENTREPRISE', 'ADMIN', 'DEPARTEMENT', 'STUDENT', 'COMPANY', 'SUPERVISOR', 'TEACHER'],
    '/etudiant': ['USER', 'ENTREPRISE', 'ADMIN', 'DEPARTEMENT', 'STUDENT', 'COMPANY', 'SUPERVISOR', 'TEACHER'],
    '/home': ['USER', 'ENTREPRISE', 'ADMIN', 'DEPARTEMENT', 'STUDENT', 'COMPANY', 'SUPERVISOR', 'TEACHER'],
    '/entreprise': ['ENTREPRISE', 'DEPARTEMENT', 'ADMIN', 'COMPANY', 'SUPERVISOR'],
    '/encadrement': ['DEPARTEMENT', 'ADMIN', 'SUPERVISOR'],
    '/planification': ['DEPARTEMENT', 'ADMIN', 'SUPERVISOR'],
    '/settings': ['USER', 'ENTREPRISE', 'DEPARTEMENT', 'ADMIN', 'STUDENT', 'COMPANY', 'SUPERVISOR', 'TEACHER'],
    '/gestion': ['ADMIN'],
    '/files/upload': ['ADMIN'],
  };

  if (!link || link.startsWith('#')) {
    return false;
  }

  const allowed = roleAccess[link];
  if (!allowed) return false;

  return allowed.includes(userRole);
};

module.exports = {
  sequelize,
  connectToDatabase,
  fetchSidebarItems,
};
