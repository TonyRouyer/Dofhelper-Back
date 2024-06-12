// routes/importRoute.js
const express = require('express');
const router = express.Router();

const importCtrl = require('../controllers/import');

// router.post('/equipements', importCtrl.importEquipement);
// router.post('/ressources', importCtrl.importRessource);
// router.post('/consommables', importCtrl.importConsommable);


router.post('/all', importCtrl.importAll);
router.post('/gears', importCtrl.importGears);
router.post('/resources', importCtrl.importRessources);
router.post('/consumables', importCtrl.importConsumables);

router.post('/calcule', importCtrl.calcule);


module.exports = router;