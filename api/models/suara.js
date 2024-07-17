const mongoose = require("mongoose");

const suaraSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, required: true },
  tps_id: { type: Number, required: true },
  id_partai: { type: Number, required: true },
  id_caleg: { type: Number, required: true },
  id_kabupaten: { type: String, required: true },
  id_kecamatan: { type: String, required: true },
  id_kelurahan: { type: String, required: true },
  grup_suara: { type: Number, required: true },
  category_suara: { type: Number, required: false },
  sub_category_suara: { type: Number, required: false },
  laki_laki: { type: Number, required: false },
  perempuan: { type: Number, required: false },
  jumlah: { type: Number, required: false },
  jumlah_suara_sah_partai_caleg: { type: Number, required: false },
});

const suara = mongoose.model("Suara", suaraSchema);

module.exports = suara;
