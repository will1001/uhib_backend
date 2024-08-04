const mongoose = require("mongoose");

const galeriSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  category_id: { type: String, required: true },
  category: { type: String, required: true },
  image: { type: String, required: true },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },
});

const galeri = mongoose.model("galeri", galeriSchema);

module.exports = galeri;
