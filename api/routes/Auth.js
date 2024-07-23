const express = require("express");
const router = express.Router();
const User = require("../models/users");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const handleServerError = (err, res) => {
  console.error(err.message);
  res.status(500).send("Server error");
};

router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      _id: new mongoose.Types.ObjectId(),
      username,
      password: hashedPassword,
    });
    await newUser.save();

    res.status(201).send({ message: "User registered" });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).send({ message: "User tidak ditemukan" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).send("Password Salah");

    const token = jwt.sign({ username }, "sadljfnsjfwopierw@#$3220375wlkdfw");
    res.json({ message: "Logged in!", token });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

module.exports = router;
