const express = require("express");
const router = express.Router();
const Kabupaten = require("../models/Kabupaten");
const Kecamatan = require("../models/Kecamatan");
const Kelurahan = require("../models/Kelurahan");

const handleServerError = (err, res) => {
  console.error(err.message);
  res.status(500).send("Server error");
};

router.get("/kabupaten", async (req, res) => {
  try {
    const kabupaten = await Kabupaten.find();
    res.json(kabupaten);
  } catch (err) {
    handleServerError(err, res);
  }
});

router.get("/kecamatan/:id_kabupaten", async (req, res) => {
  try {
    const { id_kabupaten } = req.params;
    const kecamatan = await Kecamatan.find({ id_kabupaten });
    res.json(kecamatan);
  } catch (err) {
    handleServerError(err, res);
  }
});

router.get("/kelurahan/:id_kecamatan", async (req, res) => {
  try {
    const { id_kecamatan } = req.params;
    const kelurahan = await Kelurahan.find({ id_kecamatan });
    res.json(kelurahan);
  } catch (err) {
    handleServerError(err, res);
  }
});

module.exports = router;
