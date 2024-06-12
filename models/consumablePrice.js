const mongoose = require('mongoose');

const consumablesPriceSchema = mongoose.Schema({
  id_item: { type: String, required: true },
  price_1 : { type: Number, required: true },
  price_10 : { type: Number, required: true },
  price_100 : { type: Number, required: true },
  market_price: { type: Number, required: false },

  recordDate: { type: Date, required: true },

});



module.exports = mongoose.model('consumablesPrice', consumablesPriceSchema);