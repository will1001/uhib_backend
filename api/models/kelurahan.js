const mongoose = require("mongoose");

const kelurahanSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  id_kecamatan: { type: String, required: true },
  name: { type: String, required: true },
});

const Kelurahan = mongoose.model("Kelurahan", kelurahanSchema);

module.exports = Kelurahan;
