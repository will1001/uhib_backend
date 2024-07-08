const express = require("express");
const router = express.Router();
const Aspirasi = require("../models/aspirasi");
const mongoose = require("mongoose");

const handleServerError = (err, res) => {
  console.error(err.message);
  res.status(500).send("Server error");
};

router.get("/aspirasi", async (req, res) => {
  try {
    let aspirasi = await Aspirasi.aggregate([
      {
        $lookup: {
          from: "kabupatens",
          localField: "id_kabupaten",
          foreignField: "_id",
          as: "kabupaten",
        },
      },
      {
        $unwind: {
          path: "$kabupaten",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);
    res.json(aspirasi);
  } catch (err) {
    handleServerError(err, res);
  }
});

router.post("/aspirasi", async (req, res) => {
  const newData = req.body;

  newData._id = new mongoose.Types.ObjectId();
  try {
    const newAspirasi = new Aspirasi(newData);
    await newAspirasi.save();
    res
      .status(201)
      .json({
        message: "aspirasi created successfully",
        aspirasi: newAspirasi,
      });
  } catch (err) {
    console.error("Error creating aspirasi:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
