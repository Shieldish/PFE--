// routes.js
const express = require('express');
const bodyParser = require('body-parser');
const connection = require('../model/dbConfig');
const authenticate = require('../middlewares/auth');
const { isAdmin, isUser } = require('../middlewares/roles');
const router = express.Router();





// Define fetchSidebarItems function
// Define fetchSidebarItems function
const fetchSidebarItems = (lang, connection, callback) => {
  
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

  connection.query(sidebarSql, (sidebarErr, sidebarResults) => {
    if (sidebarErr) {
      console.error('Error fetching sidebar items:', sidebarErr);
      if (typeof callback === 'function') {
        callback('Error fetching sidebar items', null);
      }
      return;
    }

    // Build the sidebar items structure
    const sidebarItems = sidebarResults.reduce((acc, item) => {
      if (item.parent_id === null) {
        acc.push({
          id: item.id,
          name: item.name,
          link: item.link,
          icon: item.icon,
          children: []
        });
      } else {
        const parent = acc.find(i => i.id === item.parent_id);
        if (parent) {
          parent.children.push({
            id: item.id,
            name: item.name,
            link: item.link,
            icon: item.icon
          });
        }
      }
      return acc;
    }, []);

    //console.log("Sidebar Items : =>", sidebarItems);
    if (typeof callback === 'function') {
      callback(null, sidebarItems);
    }
  });
};

// Usage of fetchSidebarItems function
router.post('/sidebar', (req, res) => {
  const language = req.body.lang || 'fr'; // Default to English if no language is provided
  
  fetchSidebarItems(language, connection, (error, sidebarItems) => {
    if (error) {
      res.status(500).send(error);
    } else {
      res.json(sidebarItems); // Sending sidebarItems to the frontend as JSON
    }
  });
});


  
 
 
module.exports = router;
