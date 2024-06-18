const mongoose = require("mongoose");

const suaraSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, required: true },
  grup_suara: { type: Number, required: true },
  category_suara: { type: Number, required: true },
  sub_category_suara: { type: Number, required: true },
  laki_laki: { type: Number, required: true },
  perempuan: { type: Number, required: true },
  jumlah: { type: Number, required: true },
});

const suara = mongoose.model("suara", suaraSchema);

module.exports = suara;
