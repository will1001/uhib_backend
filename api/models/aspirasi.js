const mongoose = require("mongoose");

const aspirasiSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  id_kabupaten: { type: String, required: false },
  id_kecamatan: { type: String, required: false },
  id_kelurahan: { type: String, required: false },
  email: { type: String, required: false },
  name: { type: String, required: false },
  phone: { type: String, required: false },
  perihal: { type: String, required: false },
  detail: { type: String, required: false },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },
});

const aspirasi = mongoose.model("aspirasi", aspirasiSchema);

module.exports = aspirasi;
