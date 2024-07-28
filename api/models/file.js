const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, required: true },
  id_kabupaten: { type: String, required: true },
  id_kecamatan: { type: String, required: true },
  id_kelurahan: { type: String, required: true },
  file: { type: String, required: true },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },
});

const file = mongoose.model("file", fileSchema);

module.exports = file;
