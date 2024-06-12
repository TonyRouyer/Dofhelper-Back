const mongoose = require('mongoose');

const gearsPriceSchema = mongoose.Schema({
  id_item: { type: String, required: true },
  market_price : { type: Number, required: true },
  recordDate: { type: Date, required: true },

});



module.exports = mongoose.model('gearsPrice', gearsPriceSchema);