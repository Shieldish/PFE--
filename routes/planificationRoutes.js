const express = require('express');
const Soutenance=require('../model/Soutenance')
const router = express.Router();

const fs = require('fs');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');

/* router.get('/', async (req,res)=>{
    res.render('Planification')
})
 */
// GET /api/soutenances

/* router.get('/', async (req, res) => {
    try {
      const soutenances = await Soutenance.findAll();
      res.status(200).json(soutenances);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
});
    */
router.get('/', async (req, res) => {
    try {
      const soutenances = await Soutenance.findAll();
      //console.log( 'soutenance data : ',soutenances)

      res.render('Planification', { soutenances});
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
 
  router.put('/soutenances/:id', async (req, res) => {
    try {
      const soutenance = await Soutenance.findByPk(req.params.id);
      if (!soutenance) {
        return res.status(404).json({ error: 'Soutenance not found' });
      }
      const updatedData = req.body;
      console.log(updatedData);
      await soutenance.update(updatedData);
      res.status(200).json(soutenance);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

module.exports = router;