const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },
});

const user = mongoose.model("users", userSchema);

module.exports = user;
