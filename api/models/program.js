const mongoose = require("mongoose");

const programSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  publication: { type: Boolean, required: true, default: true },
  title: { type: String, required: false },
  id_periode: { type: String, required: false },
  id_kabupaten: { type: String, required: false },
  id_kecamatan: { type: String, required: false },
  id_kelurahan: { type: String, required: false },
  description: { type: String, required: false },
  type: { type: String, required: false },
  category: { type: String, required: false },
  image: { type: String, required: false },
  video: { type: String, required: false },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },
});

const program = mongoose.model("program", programSchema);

module.exports = program;
