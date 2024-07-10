const mongoose = require("mongoose");

const tpsSchema = new mongoose.Schema({
  _id: { type: Number, required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },
});

const tps = mongoose.model("tps", tpsSchema);

module.exports = tps;
