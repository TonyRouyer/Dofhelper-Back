const mongoose = require('mongoose');

const consumableSchema = mongoose.Schema({
  id_item: { type: Number, required: true },
  name: { type: String, required: false },
  type: { type: String, required: false },
  level: { type: Number, required: false },
  img_url: { type: String, required: false },

  price_1: { type: Number, required: false },
  price_10: { type: Number, required: false },
  price_100: { type: Number, required: false },
  market_price: { type: Number, required: false },


  nbWanted: { type: Number, required: false },
  recipe: { type: Array, required: false },
  last_update_price: { type: Date, required: false },

  prixCraft: { type: Number, require: false},
  gain: { type: Number, require: false},
  ratioMarge: { type: Number, require: false},
});

module.exports = mongoose.model('consumable', consumableSchema);