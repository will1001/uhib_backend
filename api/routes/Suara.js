const express = require("express");
const router = express.Router();
const Suara = require("../models/suara");
const TPS = require("../models/tps");
const mongoose = require("mongoose");

const handleServerError = (err, res) => {
  console.error(err.message);
  res.status(500).send("Server error");
};

router.get("/suara", async (req, res) => {
  try {
    const { grup_suara, category_suara, sub_category_suara } = req.query;

    let filter = {};
    if (grup_suara) filter.grup_suara = grup_suara;
    if (category_suara) filter.category_suara = category_suara;
    if (sub_category_suara) filter.sub_category_suara = sub_category_suara;

    const suara = await Suara.find(filter);
    res.json(suara);
  } catch (err) {
    handleServerError(err, res);
  }
});

router.put("/suara/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = [
      "grup_suara",
      "category_suara",
      "sub_category_suara",
      "laki_laki",
      "perempuan",
      "jumlah",
    ];
    let updateData = {};

    updateFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const updatedSuara = await Suara.findByIdAndUpdate(
      new mongoose.Types.ObjectId(id),
      updateData,
      { new: true }
    );

    if (!updatedSuara) {
      return res.status(404).send("Suara not found");
    }
    res.json(updatedSuara);
  } catch (err) {
    handleServerError(err, res);
  }
});

router.get("/tps", async (req, res) => {
  try {
    const tps = await TPS.find({});
    res.json(tps);
  } catch (err) {
    handleServerError(err, res);
  }
});


router.get("/total-suara-per-tps", async (req, res) => {
  try {
    const totalSuaraPerTPS = await TPS.aggregate([
      {
        $lookup: {
          from: "suaras",
          localField: "_id",
          foreignField: "tps_id",
          as: "suaraDetails",
        },
      },
      {
        $unwind: {
          path: "$suaraDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$_id",
          tpsName: { $first: "$name" },
          totalSuara: {
            $sum: {
              $add: [
                "$suaraDetails.jumlah",
                "$suaraDetails.laki_laki",
                "$suaraDetails.perempuan",
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          tpsName: 1,
          totalSuara: 1,
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    res.json(totalSuaraPerTPS);
  } catch (err) {
    handleServerError(err, res);
  }
});

module.exports = router;
