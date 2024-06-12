const mongoose = require('mongoose');

const gearSchema = mongoose.Schema({
  id_item: { type: Number, required: true },
  name: { type: String, required: true },
  level: { type: Number, required: true },
  type: { type: String, required: false},
  img_url: { type: String, required: false },
  market_price: { type: Number, required: false },
  in_market: { type: Boolean, required: false },
  nb_sold: { type: Number, required: false },
  craft: { type: Boolean, required: false },
  prixCraft: { type: Number, require: false},
  gain: { type: Number, require: false},
  ratioMarge: { type: Number, require: false},
  recipe: { type: Array, required: false },
  last_update_price: { type: Date, required: false },
});



module.exports = mongoose.model('gear', gearSchema);