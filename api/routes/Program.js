const express = require("express");
const router = express.Router();
const Program = require("../models/program");
const mongoose = require("mongoose");
const { storeFile } = require("../lib/storage");
const authenticateToken = require("../middleware/auth");

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
            $match: {
              video: { $ne: undefined },
            },
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
      } else if (type === "video_artikel") {
        program = await Program.aggregate([
          {
            $match: {
              $or: [{ type: "artikel" }, { video: { $ne: undefined } }],
            },
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

router.put("/program/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const newData = req.body;
  const { image, video } = newData;

  if (image && video)
    res.status(400).json({ message: "image atau video harus salah satu saja" });

  try {
    if (image) {
      if (image[0].filename === "")
        res.status(400).json({ message: "Gambar File Tidak Boleh Kosong" });
      const base64Data = image.replace(/^data:image\/\w+;base64,/, ""); // hilangkan header base64
      const buff = Buffer.from(base64Data, "base64");

      const extFile = "jpg"; // asumsikan ekstensi file jpg
      const filename = `program_${id}.${extFile}`;
      await storeFile(buff, "program", filename);
      let saveData = newData;
      saveData.image = "/program/" + filename;
      const updatedProgram = await Program.updateOne(
        { _id: id },
        { $set: saveData }
      );
      if (updatedProgram.acknowledged) {
        return res.json({ message: "succes" });
      }
    } else {
      const updatedProgram = await Program.updateOne(
        { _id: id },
        { $set: newData }
      );
      if (updatedProgram.acknowledged) {
        return res.json({ message: "succes" });
      }
    }

    res.json({ message: "failure" });
  } catch (err) {
    handleServerError(err, res);
  }
});

router.post("/program", authenticateToken, async (req, res) => {
  const newData = req.body;
  const { image, video } = newData;

  if (image && video)
    res.status(400).json({ message: "image atau video harus salah satu saja" });

  newData._id = new mongoose.Types.ObjectId();
  console.log(req.body);
  try {
    if (image) {
      if (image[0].filename === "")
        res.status(400).json({ message: "Gambar File Tidak Boleh Kosong" });
      const base64Data = image.replace(/^data:image\/\w+;base64,/, ""); // hilangkan header base64
      const buff = Buffer.from(base64Data, "base64");

      const extFile = "jpg"; // asumsikan ekstensi file jpg
      const filename = `program_${newData._id}.${extFile}`;
      await storeFile(buff, "program", filename);
      let saveData = newData;
      saveData.image = "/program/" + filename;
      console.log(saveData);
      const newProgram = new Program(saveData);
      await newProgram.save();
    } else {
      const newProgram = new Program(newData);
      await newProgram.save();
    }

    res.status(201).json({ message: "Program created successfully" });
  } catch (err) {
    console.error("Error creating program:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/program/:id", authenticateToken, async (req, res) => {
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
