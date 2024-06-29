const fs = require('fs/promises'); // Import du module fs
const { spawn } = require('child_process');
const path = require('path'); // Import du module path


const Gear = require('../models/gear');
const Resource = require('../models/resource');
const Consumable = require('../models/consumable');
const GearPrice = require('../models/gearPrice');
const ResourcePrice = require('../models/resourcePrice');
const ConsumablePrice = require('../models/consumablePrice');



exports.importAll = async (req, res, next) => {
    try {
        // Exécuter le script Python pour générer les fichiers JSON
        const pythonProcess = spawn('python3', ['./import/scrap.py']);

        pythonProcess.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        pythonProcess.on('close', async (code) => {
            console.log(`Le script Python s'est terminé avec le code ${code}`);
            if (code === 0) {
                try {
                    // Importer les données des fichiers JSON
                    const importData = async (filePath, Model, ModelPrice) => {
                        const fileData = await fs.readFile(filePath);
                        console.log(filePath);
                        const jsonData = JSON.parse(fileData);

                        const savePromises = jsonData.map(async (data) => {
                            const { id_item, lot_1, lot_10, lot_100 } = data;
                            const newData = new ModelPrice({
                                id_item: id_item,
                                price_1: parseNumber(data.lot_1),
                                price_10: parseNumber(data.lot_10),
                                price_100: parseNumber(data.lot_100),
                                market_price: parseNumber(data.lot_1),
                                recordDate: new Date()
                            });

                            return newData.save();
                        });

                        await Promise.all(savePromises);

                        const bulkOps = jsonData.map(data => ({
                            updateOne: {
                                filter: { id_item: data.id_item },
                                update: {
                                    $set: {
                                        price_1: parseNumber(data.lot_1),
                                        price_10: parseNumber(data.lot_10),
                                        price_100: parseNumber(data.lot_100),
                                        market_price: parseNumber(data.lot_1),
                                        last_update_price: new Date()
                                    }
                                },
                                upsert: true
                            }
                        }));

                        await Model.bulkWrite(bulkOps);
                    };

                    await importData('./import/resources_data.json', Resource, ResourcePrice);
                    await importData('./import/gears_data.json', Gear, GearPrice);
                    await importData('./import/consumables_data.json', Consumable, ConsumablePrice);

                    // importRessources()
                    // importGears()
                    // importConsumables()

                    console.log('Import terminé avec succès.');
                    res.status(200).json({ message: 'Import terminé avec succès.' });
                } catch (error) {
                    console.error('Erreur lors de l\'import :', error);
                    res.status(500).json({ error: 'Erreur lors de l\'import des données.' });
                }
            } else {
                console.error('Le script Python a échoué.');
                res.status(500).json({ error: 'Le script Python a échoué.' });
            }
        });
    } catch (error) {
        console.error('Erreur lors de l\'import :', error);
        res.status(500).json({ error: 'Erreur lors de l\'import des données.' });
    }
};

exports.importGears = async (req, res, next) => {
    try {
        // Importer les données des fichiers JSON
        const gearsData = JSON.parse(fs.readFileSync('./import/gears_data.json'));

        // Créer un tableau pour stocker toutes les promesses de sauvegarde
        const savePromises = gearsData.map(async (gearData) => {
            const { id_item, lot_1 } = gearData;

            // Ajouter une nouvelle entrée dans la table gearPrice
            const newGearPrice = new GearPrice({
                id_item: id_item,
                market_price: parseNumber(lot_1),
                recordDate: new Date()
            });
            // Retourner la promesse de save()
            return newGearPrice.save();
        });

        // Attendre que toutes les promesses de sauvegarde soient résolues
        await Promise.all(savePromises);

        // Créer un tableau d'opérations de mise à jour à exécuter
        const bulkOps = gearsData.map(gearData => ({
            updateOne: {
                filter: { id_item: gearData.id_item },
                update: {
                    $set: {
                        market_price: parseNumber(gearData.lot_1),
                        last_update_price: new Date()
                    }
                },
                upsert: true // Créer un nouvel enregistrement s'il n'existe pas
            }
        }));

        // Exécuter les opérations de mise à jour en une seule requête
        await Gear.bulkWrite(bulkOps);

        console.log('Import terminé avec succès.');
        res.status(200).json({ message: 'Import terminé avec succès.' });
    } catch (error) {
        console.error('Erreur lors de l\'import :', error);
        res.status(500).json({ error: 'Erreur lors de l\'import des données.' });
    }
};


exports.importRessources = async (req, res, next) => {
    try {
        // Importer les données des fichiers JSON
        const resourcesData = JSON.parse(fs.readFileSync('./import/resources_data.json'));

        // Créer un tableau pour stocker toutes les promesses de sauvegarde
        const savePromises = resourcesData.map(async (resourceData) => {
            const { id_item, price_1, price_10, price_100 } = resourceData;

            // Ajouter une nouvelle entrée dans la table resourcePrice
            const newResourcePrice = new ResourcePrice({
                id_item: id_item,
                price_1: parseNumber(price_1),
                price_10: parseNumber(price_10),
                price_100: parseNumber(price_100),
                recordDate: new Date()
            });
            // Retourner la promesse de save()
            return newResourcePrice.save();
        });

        // Attendre que toutes les promesses de sauvegarde soient résolues
        await Promise.all(savePromises);

        // Créer un tableau d'opérations de mise à jour à exécuter
        const bulkOps = resourcesData.map(resourceData => ({
            updateOne: {
                filter: { id_item: resourceData.id_item },
                update: {
                    $set: {
                        price_1: parseNumber(resourceData.price_1),
                        price_10: parseNumber(resourceData.price_10),
                        price_100: parseNumber(resourceData.price_100),
                        last_update_price: new Date()
                    }
                },
                upsert: true // Créer un nouvel enregistrement s'il n'existe pas
            }
        }));

        // Exécuter les opérations de mise à jour en une seule requête
        await Resource.bulkWrite(bulkOps);

        console.log('Import terminé avec succès.');
        res.status(200).json({ message: 'Import terminé avec succès.' });
    } catch (error) {
        console.error('Erreur lors de l\'import :', error);
        res.status(500).json({ error: 'Erreur lors de l\'import des données.' });
    }
};


exports.importConsumables = async (req, res, next) => {
    try {
        // Importer les données des fichiers JSON
        const consumablesData = JSON.parse(fs.readFileSync('./import/consumable_data.json'));

        // Créer un tableau pour stocker toutes les promesses de save()
        const savePromises = consumablesData.map(async (consumableData) => {
            const { id_item, lot_1, lot_10, lot_100 } = consumableData;

            // Ajouter une nouvelle entrée dans la table consumablePrice
            const newConsumablePrice = new ConsumablePrice({
                id_item: id_item,
                price_1: parseNumber(lot_1),
                price_10: parseNumber(lot_10),
                price_100: parseNumber(lot_100),
                recordDate: new Date()
            });

            // Retourner la promesse de save()
            return newConsumablePrice.save();
        });

        // Attendre que toutes les promesses de save() soient résolues
        await Promise.all(savePromises);

        // Créer un tableau d'opérations de mise à jour à exécuter
        const bulkOps = consumablesData.map(consumableData => ({
            updateOne: {
                filter: { id_item: consumableData.id_item },
                update: {
                    $set: {
                        price_1: parseNumber(consumableData.lot_1),
                        price_10: parseNumber(consumableData.lot_10),
                        price_100: parseNumber(consumableData.lot_100),
                        last_update_price: new Date()
                    }
                },
                upsert: true // Créer un nouvel enregistrement s'il n'existe pas
            }
        }));

        // Exécuter les opérations de mise à jour en une seule requête
        await Consumable.bulkWrite(bulkOps);

        console.log('Import terminé avec succès.');
        res.status(200).json({ message: 'Import terminé avec succès.' });
    } catch (error) {
        console.error('Erreur lors de l\'import :', error);
        res.status(500).json({ error: 'Erreur lors de l\'import des données.' });
    }
};


exports.calcule = async (req, res, next) => {
    try {
        // Récupérer tous les équipements, ressources et consommables
        const [gears, resources, consumables] = await Promise.all([
            Gear.find(),
            Resource.find(),
            Consumable.find()
        ]);

        const resourceMap = new Map(resources.map(r => [r.id_item, r]));

        const bulkGearUpdates = [];
        const bulkResourceUpdates = [];
        const bulkConsumableUpdates = [];

        // Traitement pour les gears
        for (const gear of gears) {
            console.log('Gear id=' + gear.id_item);

            let prixCraft = gear.recipe.reduce((acc, ingredient) => {
                const resource = resourceMap.get(parseInt(ingredient.id));
                return resource ? acc + resource.price_1 * parseInt(ingredient.qty) : acc;
            }, 0);

            const gainMin = gear.market_price - prixCraft;
            const ratio = prixCraft !== 0 ? (gear.market_price / prixCraft) * 100 : 0;

            bulkGearUpdates.push({
                updateOne: {
                    filter: { id_item: gear.id_item },
                    update: {
                        $set: {
                            gain: gainMin,
                            prixCraft: prixCraft,
                            ratioMarge: ratio
                        }
                    }
                }
            });
        }

        // Traitement pour les ressources
        for (const resource of resources) {
            // console.log('Resource id=' + resource.id_item);

            let prixCraft = 0;
            if (resource.recipe.length > 0) {
                prixCraft = resource.recipe.reduce((acc, ingredient) => {
                    const ingredientResource = resourceMap.get(parseInt(ingredient.id));
                    return ingredientResource ? acc + ingredientResource.price_1 * parseInt(ingredient.qty) : acc;
                }, 0);

            }

            const gainMin = prixCraft === 0 ? 0 : resource.price_1 - prixCraft;
            const ratio = prixCraft !== 0 ? (resource.price_1 / prixCraft) * 100 : 0;

            const ratioBtS_100_10 = calculateRatioBtS(resource.price_100, resource.price_10);
            const ratioBtS_10_1 = calculateRatioBtS(resource.price_10, resource.price_1);
            const ratioBtS = [ratioBtS_10_1, ratioBtS_100_10];

            bulkResourceUpdates.push({
                updateOne: {
                    filter: { id_item: resource.id_item },
                    update: {
                        $set: {
                            gain: gainMin,
                            prixCraft: prixCraft,
                            ratioMarge: ratio,
                            ratioBtS: ratioBtS
                        }
                    }
                }
            });
        }

        // Traitement pour les consumables
        for (const consumable of consumables) {
            console.log('Consumable id=' + consumable.id_item);

            if (consumable.recipe.length > 0) {
                let prixCraft = consumable.recipe.reduce((acc, ingredient) => {
                    const ingredientResource = resourceMap.get(parseInt(ingredient.id));
                    return ingredientResource ? acc + ingredientResource.price_1 * parseInt(ingredient.qty) : acc;
                }, 0);

                const gainMin = consumable.price_1 - prixCraft;
                const ratio = prixCraft !== 0 ? (consumable.price_1 / prixCraft) * 100 : 0;

                bulkConsumableUpdates.push({
                    updateOne: {
                        filter: { id_item: consumable.id_item },
                        update: {
                            $set: {
                                gain: gainMin,
                                prixCraft: prixCraft,
                                ratioMarge: ratio,
                                last_update_price: new Date()
                            }
                        }
                    }
                });
            }
        }

        // Exécuter les mises à jour en masse
        if (bulkGearUpdates.length > 0) await Gear.bulkWrite(bulkGearUpdates);
        if (bulkResourceUpdates.length > 0) await Resource.bulkWrite(bulkResourceUpdates);
        if (bulkConsumableUpdates.length > 0) await Consumable.bulkWrite(bulkConsumableUpdates);
        console.log('finito')
        res.status(200).json({ message: 'finito' });
    } catch (error) {
        console.error('Erreur lors du calcul :', error);
        res.status(500).json({ error: 'Erreur lors du calcul des données.' });
    }
};



function calculateRatioBtS(priceHigher, priceLower) {

    // Vérifier si les prix sont définis et non nuls
    if (!isNaN(priceHigher) && !isNaN(priceLower) && priceHigher !== 0 && priceLower !== 0) {
        return (priceLower * 10) - priceHigher;
    }
    return 0; // Retourne 0 si l'un des prix est manquant ou zéro
}


// Fonction pour convertir une chaîne en nombre, en gérant les cas invalides
function parseNumber(value) {
    if (typeof value === 'string') {
        const parsed = parseFloat(value.replace(/ /g, '').replace(',', '.'));
        return isNaN(parsed) ? 0 : parsed;
    } else {
        return 0;
    }
};



