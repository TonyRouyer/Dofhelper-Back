const Gears = require('../../models/gear');
const Resources = require('../../models/resource');
const Consumables = require('../../models/consumable');

const ResourcePrice = require('../../models/resourcePrice')
const GearPrice = require('../../models/gearPrice')
const ConsumablePrice = require('../../models/consumablePrice')
// const normalize = require('normalize-text');
const { searchFilter, limitFilter } = require('./filters');




exports.getAllGears = async (req, res, next) => {
    // Extraction des filtres de la requête
    let search = req.query.search;
    let limit = req.query.limit ? parseInt(req.query.limit) : 15;
    let sort = req.query.sort || 'gain'; // Tri par défaut par gain
    let prixMin = req.query.prixMin ? parseFloat(req.query.prixMin) : undefined;
    let lvlMin = req.query.lvlMin ? parseInt(req.query.lvlMin) : undefined;
    let lvlMax = req.query.lvlMax ? parseInt(req.query.lvlMax) : undefined;
    let categ = req.query.categ;
    let sell = req.query.sell !== undefined;
    let craft = req.query.craft !== undefined;

    try {
        // Construire la requête de base
        let query = {};

        // Filtrer les gears avec recette
        query.recipe = { $exists: true, $ne: [] };

        // Appliquer le filtre de recherche s'il est fourni
        if (search !== undefined) {
            query.name = { $regex: new RegExp(search, 'i') };
        }

        // Appliquer les autres filtres
        if (prixMin !== undefined) {
            query.market_price = { $gte: prixMin };
        }
        if (lvlMin !== undefined) {
            query.level = { $gte: lvlMin };
        }
        if (lvlMax !== undefined) {
            query.level = { ...query.level, $lte: lvlMax }; // Combiner avec le filtre level déjà présent
        }
        if (categ !== undefined) {
            query.type = categ;
        }
        if (sell) {
            query.nb_sold = { $gt: 0 };
        }
        if (craft) {
            query.craft = true;
        }

        // Exécuter la requête
        let gears = await Gears.find(query);

        // Trier les résultats selon le critère spécifié
        if (sort === 'ratioMarge') {
            gears.sort((a, b) => b.ratioMarge - a.ratioMarge); // Tri par ratioMarge décroissant
        } else {
            gears.sort((a, b) => b.gain - a.gain); // Tri par gain décroissant (par défaut)
        }

        // Limiter les résultats
        gears = gears.slice(0, limit);

        // Renvoyer les résultats au format JSON
        res.status(200).json(gears);
    } catch (error) {
        // Gérer les erreurs
        res.status(400).json({ error: error.message });
    }
};

exports.updateGear = async (req, res, next) => {
    try {
        const gearId = req.params.id;
        const { marketPrice, nbSold, craft } = req.body;

        // Création de l'objet de mise à jour en fonction des champs fournis
        const updateFields = {};
        if (marketPrice !== undefined) {
            updateFields.market_price = marketPrice;
        }
        if (nbSold !== undefined) {
            updateFields.nb_sold = nbSold;
        }
        if (craft !== undefined) {
            updateFields.craft = craft;
        }

        // Recherche de l'équipement par id_item
        const gear = await Gears.findOne({ id_item: gearId });

        // Si l'équipement est trouvé, mettre à jour ses champs avec les valeurs fournies
        if (gear) {
            await Gears.updateOne({ _id: gear._id }, updateFields);

            // Si craft est défini sur true, mettre à jour les ressources liées
            if (craft === true) {
                for (let recipeIngredient of gear.recipe) {
                    const nbWanted = nbSold > 0 ? recipeIngredient.qty * nbSold : recipeIngredient.qty;
                    await Resources.findOneAndUpdate({ id_item: recipeIngredient.id }, { nbWanted });
                }
            }

            // Réponse réussie
            res.status(200).json({ message: 'L\'équipement a été mis à jour avec succès.' });
        } else {
            // Si l'équipement n'est pas trouvé, renvoyer une réponse indiquant qu'il n'a pas été trouvé
            res.status(404).json({ error: 'Équipement non trouvé.' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getGearHisto = async (req, res, next) => {
    try {
        const id_item = parseInt(req.params.id);

        // Fetch price history from the database
        const priceHistory = await GearPrice.find({ "id_item": id_item });
        // Ensure the data is returned in the expected format
        const formattedHistory = priceHistory.map(record => ({
            date: record.recordDate.toISOString(),
            price: record.market_price,

        }));

        res.json(formattedHistory);
    } catch (error) {
        console.error('Error fetching price history:', error);
        res.status(500).json({ error: 'Error fetching price history' });
    }

}




exports.getAllRessources = async (req, res, next) => {
    // Extraction des filtres de la requête
    let search = req.query.search;
    let limit = req.query.limit ? parseInt(req.query.limit) : 15;
    let ratioBtSMin = req.query.ratioMin ? parseFloat(req.query.ratioMin) : undefined;
    let hasRecipe = req.query.recipe !== undefined;
    let categ = req.query.categ;


    try {
        // Construire la requête de base
        let query = {};

        // Filtrer les gears avec recette
        if (hasRecipe) {
            query.recipe = { $exists: true, $ne: [] };
        }

        // Appliquer le filtre de recherche s'il est fourni
        if (search !== undefined) {
            query.name = { $regex: new RegExp(search, 'i') };
        }

        if (categ !== undefined) {
            query.type = categ;
        }

        // Exécuter la requête
        let gears = await Resources.find(query);

        // Trier les résultats en fonction de la valeur la plus élevée de ratioBtS
        gears.sort((a, b) => {
            const maxRatioBtSA = Math.max(...a.ratioBtS);
            const maxRatioBtSB = Math.max(...b.ratioBtS);
            return maxRatioBtSB - maxRatioBtSA;
        });

        // Limiter les résultats
        gears = gears.slice(0, limit);

        // Renvoyer les résultats au format JSON
        res.status(200).json(gears);
    } catch (error) {
        // Gérer les erreurs
        res.status(400).json({ error: error.message });
    }
};

exports.getRessourceHisto = async (req, res, next) => {
    try {
        const id_item = parseInt(req.params.id);

        // Fetch price history from the database
        const priceHistory = await ResourcePrice.find({ "id_item": id_item });
        // Ensure the data is returned in the expected format
        const formattedHistory = priceHistory.map(record => ({
            date: record.recordDate.toISOString(),
            price1: record.price_1,
            price10: record.price_10,
            price100: record.price_100
        }));

        res.json(formattedHistory);
    } catch (error) {
        console.error('Error fetching price history:', error);
        res.status(500).json({ error: 'Error fetching price history' });
    }

}


exports.getAllConsumables = async (req, res, next) => {
    // Extraction des filtres de la requête
    let search = req.query.search;
    let limit = req.query.limit ? parseInt(req.query.limit) : 15;
    let prixMin = req.query.prixMin ? parseFloat(req.query.prixMin) : undefined;
    let lvlMin = req.query.lvlMin ? parseInt(req.query.lvlMin) : undefined;
    let lvlMax = req.query.lvlMax ? parseInt(req.query.lvlMax) : undefined;
    let categ = req.query.categ;
    let sell = req.query.sell !== undefined;
    let craft = req.query.craft !== undefined;
    let ratioMin = req.query.ratioMin ? parseFloat(req.query.ratioMin) : undefined;

    try {
        // Construire la requête de base
        let query = {};

        // Filtrer les gears avec recette
        query.recipe = { $exists: true, $ne: [] };

        // Appliquer le filtre de recherche s'il est fourni
        if (search !== undefined) {
            query.name = { $regex: new RegExp(search, 'i') };
        }

        // Appliquer les autres filtres
        if (prixMin !== undefined) {
            query.market_price = { $gte: prixMin };
        }
        if (lvlMin !== undefined) {
            query.level = { $gte: lvlMin };
        }
        if (lvlMax !== undefined) {
            query.level = { ...query.level, $lte: lvlMax }; // Combiner avec le filtre level déjà présent
        }
        if (categ !== undefined) {
            query.type = categ;
        }
        if (sell) {
            query.nb_sold = { $gt: 0 };
        }
        if (craft) {
            query.craft = true;
        }
        if (ratioMin !== undefined) {
            query.ratioMarge = { $gte: ratioMin };
        }

        // Exécuter la requête
        let consumables = await Consumables.find(query);


        consumables.sort((a, b) => b.gain - a.gain); // Tri par gain décroissant (par défaut)


        // Limiter les résultats
        consumables = consumables.slice(0, limit);

        // Renvoyer les résultats au format JSON
        res.status(200).json(consumables);
    } catch (error) {
        // Gérer les erreurs
        res.status(400).json({ error: error.message });
    }
};

exports.getConsumableHisto = async (req, res, next) => {
    try {
        const id_item = parseInt(req.params.id);

        // Fetch price history from the database
        const priceHistory = await ConsumablePrice.find({ "id_item": id_item });
        // Ensure the data is returned in the expected format
        const formattedHistory = priceHistory.map(record => ({
            date: record.recordDate.toISOString(),
            price1: record.price_1,
            price10: record.price_10,
            price100: record.price_100
        }));

        res.json(formattedHistory);
    } catch (error) {
        console.error('Error fetching price history:', error);
        res.status(500).json({ error: 'Error fetching price history' });
    }

}





exports.getShopping = async (req, res, next) => {
    try {
        // Récupérer les ressources dont nbWanted est supérieur à 0
        const desiredResources = await Resources.find({ nbWanted: { $gt: 0 } });

        // Renvoyer les résultats au format JSON
        res.status(200).json(desiredResources);
    } catch (error) {
        // Gérer les erreurs
        res.status(400).json({ error: error.message });

    }
};

exports.resetShopping = async (req, res, next) => {
    try {
        // Récupérer les ressources dont nbWanted est supérieur à 0
        const desiredResources = await Resources.find({ nbWanted: { $gt: 0 } });
        for (let ressource of desiredResources) {
            const nbWanted = 0;
            await Resources.findOneAndUpdate({ id_item: ressource.id_item }, { nbWanted });
        }

        const craftedItems = await Gears.find({ craft: true });
        for (let gear of craftedItems) {
            const filter = { id_item: gear.id_item };
            const update = { craft: false };
            await Gears.findOneAndUpdate(filter, update);
        }

        // Renvoyer les résultats au format JSON
        res.status(200).json({ message: 'Ressources reset' });
    } catch (error) {
        // Gérer les erreurs
        res.status(400).json({ error: error.message });

    }
};


