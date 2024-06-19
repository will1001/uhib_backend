const mongoose = require("mongoose");

const tpsSchema = new mongoose.Schema({
  _id: { type: Number, required: true },
  name: { type: String, required: true },
});

const tps = mongoose.model("tps", tpsSchema);

module.exports = tps;
