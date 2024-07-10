const express = require("express");
const router = express.Router();
const Slider = require("../models/slider");
const mongoose = require("mongoose");
const { storeFile } = require("../lib/storage");

const handleServerError = (err, res) => {
  console.error(err.message);
  res.status(500).send("Server error");
};

router.get("/slider", async (req, res) => {
  try {
    const { type } = req.query;

    let filter = {};
    if (type) filter.type = type;
    const slider = await Slider.find(filter);
    res.json(slider);
  } catch (err) {
    handleServerError(err, res);
  }
});

router.put("/slider/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = ["image"];
    let updateData = {};

    updateFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buff = Buffer.from(base64Data, "base64");

    const extFile = "jpg";
    const filename = `slider${newData._id}.${extFile}`;
    await storeFile(buff, "slider", filename);
    updateData.image = "/slider/" + filename;

    const updatedSlider = await Slider.findByIdAndUpdate(
      id.length === 1
        ? new mongoose.Types.ObjectId()
        : new mongoose.Types.ObjectId(id),
      updateData,
      { new: true, upsert: true }
    );

    res.json(updatedSlider);
  } catch (err) {
    handleServerError(err, res);
  }
});

router.post("/slider", async (req, res) => {
  const newData = req.body;
  const { image } = newData;

  newData._id = new mongoose.Types.ObjectId();
  try {
    if (image) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, ""); // hilangkan header base64
      const buff = Buffer.from(base64Data, "base64");
      const extFile = "jpg"; // asumsikan ekstensi file jpg
      const filename = `slider${newData._id}.${extFile}`;
      await storeFile(buff, "slider", filename);
      let saveData = newData;
      saveData.image = "/slider/" + filename;
      console.log(saveData);
      const newSlider = new Slider(saveData);
      await newSlider.save();
      return res.status(201).json({ message: "slider created successfully" });
    }
    res.status(500).json({ message: "slider fail" });
  } catch (err) {
    console.error("Error creating program:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/slider/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedSlider = await Slider.deleteOne({ _id: id });

    if (deletedSlider.deletedCount === 1) {
      return res.json({ message: "Slider deleted successfully" });
    } else {
      return res.status(404).json({ message: "Slider not found" });
    }
  } catch (err) {
    console.error("Error deleting program:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
