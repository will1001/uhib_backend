const express = require("express");
const router = express.Router();
const Program = require("../models/program");
const mongoose = require("mongoose");
const multer = require("multer");

const upload = multer({ dest: "uploads/" }); // Folder to store uploaded files

const handleServerError = (err, res) => {
  console.error(err.message);
  res.status(500).send("Server error");
};

router.get("/program", async (req, res) => {
  const { type } = req.query;

  try {
    let program;
    if (!type) {
      program = await Program.aggregate([
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
    } else {
      if (type === "video") {
        program = await Program.aggregate([
          {
            $match: { video: { $ne: undefined } },
          },
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
      } else {
        program = await Program.aggregate([
          {
            $match: { type },
          },
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
      }
    }
    res.json(program);
  } catch (err) {
    handleServerError(err, res);
  }
});

router.put("/program/:id", async (req, res) => {
  const { id } = req.params;
  const newData = req.body;

  try {
    const updatedProgram = await Program.updateOne(
      { _id: id },
      { $set: newData }
    );
    if (updatedProgram.acknowledged) {
      res.json({ message: "succes" });
    }
    res.json({ message: "failure" });
  } catch (err) {
    handleServerError(err, res);
  }
});

router.post("/program", upload.single("file"), async (req, res) => {
  const newData = req.body;

  newData._id = new mongoose.Types.ObjectId();
  try {
    const newProgram = new Program(newData);
    await newProgram.save();
    res
      .status(201)
      .json({ message: "Program created successfully", program: newProgram });
  } catch (err) {
    console.error("Error creating program:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/program/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedProgram = await Program.deleteOne({ _id: id });

    if (deletedProgram.deletedCount === 1) {
      return res.json({ message: "Program deleted successfully" });
    } else {
      return res.status(404).json({ message: "Program not found" });
    }
  } catch (err) {
    console.error("Error deleting program:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;