const express = require("express");
const router = express.Router();
const Aspirasi = require("../models/aspirasi");
const mongoose = require("mongoose");
const { storeFile } = require("../lib/storage");
const authenticateToken = require("../middleware/auth");

const handleServerError = (err, res) => {
  console.error(err.message);
  res.status(500).send("Server error");
};

router.get("/aspirasi", authenticateToken, async (req, res) => {
  const { page, limit } = req.query;

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
      {
        $lookup: {
          from: "kecamatans",
          localField: "id_kecamatan",
          foreignField: "_id",
          as: "kecamatan",
        },
      },
      {
        $unwind: {
          path: "$kecamatan",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "kelurahans",
          localField: "id_kelurahan",
          foreignField: "_id",
          as: "kelurahan",
        },
      },
      {
        $unwind: {
          path: "$kelurahan",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    let totalData = await Aspirasi.countDocuments();
    let metadata = {
      limit: Number(limit),
      total: totalData,
      totalPage: Math.ceil(totalData / limit),
      currentPage: Number(page),
    };
    res.json({ metadata, data: aspirasi });
  } catch (err) {
    handleServerError(err, res);
  }
});

router.post("/aspirasi", async (req, res) => {
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
      const filename = `aspirasi${newData._id}.${extFile}`;
      await storeFile(buff, "aspirasi", filename);
      let saveData = newData;
      saveData.image = "/aspirasi/" + filename;
      const newAspirasi = new Aspirasi(saveData);
      await newAspirasi.save();
    } else {
      const newAspirasi = new Aspirasi(newData);
      await newAspirasi.save();
    }
    res.status(201).json({
      message: "aspirasi created successfully",
    });
  } catch (err) {
    console.error("Error creating aspirasi:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/aspirasi/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const deletedAspirasi = await Aspirasi.deleteOne({ _id: id });

    if (deletedAspirasi.deletedCount === 1) {
      return res.json({ message: "Aspirasi deleted successfully" });
    } else {
      return res.status(404).json({ message: "Aspirasi not found" });
    }
  } catch (err) {
    console.error("Error deleting program:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
