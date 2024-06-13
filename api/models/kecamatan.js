const mongoose = require('mongoose');

const kecamatanSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  id_kabupaten: { type: String, required: true },
  name: { type: String, required: true }
});

const Kecamatan = mongoose.model('Kecamatan', kecamatanSchema);

module.exports = Kecamatan;
