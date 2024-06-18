const express = require('express');
const router = express.Router();

const stuffCtrl = require('../controllers/stuffs/stuff');
const nodemon = require('nodemon');




// recuperer tout les gears (avec filtres)
router.get('/gears', stuffCtrl.getAllGears);
// router.put('/ulg', stuffCtrl.updateLevelToInt);

// update gears unique : market price/nb sold/craft (update nb_wanted de resources en fonction)
router.put('/updateGear/:id', stuffCtrl.updateGear);

// historique des prix des gears
router.get('/gearHisto/:id', stuffCtrl.getGearHisto);





// recuperer tout les consumables (avec filtres)
router.get('/consumables', stuffCtrl.getAllConsumables);

//update consumable unique

// historique des prix d'un consomable
router.get('/consumablesHisto/:id', stuffCtrl.getConsumableHisto);


// recuperer tout les resources (avec filtres)
router.get('/resources', stuffCtrl.getAllRessources);

// update resources unique

// historique des prix d'une ressources
router.get('/resourcesHisto/:id', stuffCtrl.getRessourceHisto);



// recupere liste shopping ()
router.get('/shopping', stuffCtrl.getShopping);

// reset liste shopping
router.put("/shopping/reset", stuffCtrl.resetShopping)

// update liste shopping ()




module.exports = router;