const mongoose = require('mongoose');

const kabupatenSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  province__id: { type: String, required: true },
  name: { type: String, required: true }
});

const Kabupaten = mongoose.model('Kabupaten', kabupatenSchema);

module.exports = Kabupaten;
