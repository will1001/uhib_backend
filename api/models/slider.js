const mongoose = require("mongoose");

const sliderSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  type: { type: String, required: true },
  image: { type: String, required: true },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },
});

const slider = mongoose.model("slider", sliderSchema);

module.exports = slider;
