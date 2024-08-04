const express = require("express");
const router = express.Router();
const Galeri = require("../models/galeri");
const mongoose = require("mongoose");
const authenticateToken = require("../middleware/auth");
const { storeFile, removeFile } = require("../lib/storage");

const handleServerError = (err, res) => {
  console.error(err.message);
  res.status(500).send("Server error");
};

router.get("/galeri", authenticateToken, async (req, res) => {
  try {
    const { category_id } = req.query;

    let filter = {};
    if (category_id) filter.category_id = category_id;

    const galeri = await Galeri.find(filter).sort({
      updatedAt: -1,
    });
    res.json(galeri);
  } catch (err) {
    handleServerError(err, res);
  }
});

router.post("/galeri", authenticateToken, async (req, res) => {
  const newData = req.body;
  const { image } = newData;

  newData._id = new mongoose.Types.ObjectId();
  try {
    if (image) {
      if (image[0].filename === "")
        res.status(400).json({ message: "Gambar File Tidak Boleh Kosong" });
      const base64Data = image.replace(/^data:image\/\w+;base64,/, ""); // hilangkan header base64
      const buff = Buffer.from(base64Data, "base64");

      const extFile = "jpg"; // asumsikan ekstensi file jpg
      const filename = `galeri_${newData._id}.${extFile}`;
      await storeFile(buff, "galeri", filename);
      let saveData = newData;
      saveData.image = "/galeri/" + filename;
      const newGaleri = new Galeri(saveData);
      await newGaleri.save();
    } else {
      const newGaleri = new Galeri(newData);
      await newGaleri.save();
    }

    res.status(201).json({ message: "Galeri created successfully" });
  } catch (err) {
    console.error("Error creating Galeri:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/galeri/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedGaleri = await Galeri.deleteOne({ _id: id });

    const extFile = "jpg";
    removeFile("galeri", `galeri/galeri_${id}.${extFile}`);

    if (deletedGaleri.deletedCount === 1) {
      return res.json({ message: "Galeri deleted successfully" });
    } else {
      return res.status(404).json({ message: "Galeri not found" });
    }
  } catch (err) {
    console.error("Error deleting Galeri:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
