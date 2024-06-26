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
    const {
      grup_suara,
      category_suara,
      sub_category_suara,
      id_kabupaten,
      id_kecamatan,
      id_kelurahan,
      tps_id,
    } = req.query;

    let filter = {};
    if (grup_suara) filter.grup_suara = grup_suara;
    if (category_suara) filter.category_suara = category_suara;
    if (sub_category_suara) filter.sub_category_suara = sub_category_suara;
    if (id_kabupaten) filter.id_kabupaten = id_kabupaten;
    if (id_kecamatan) filter.id_kecamatan = id_kecamatan;
    if (id_kelurahan) filter.id_kelurahan = id_kelurahan;
    if (tps_id) filter.tps_id = +tps_id;

    const suara = await Suara.find(filter).sort({
      category_suara: 1,
      sub_category_suara: 1,
    });
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
      "id_kabupaten",
      "id_kecamatan",
      "id_kelurahan",
      "tps_id",
    ];
    let updateData = {};

    updateFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const updatedSuara = await Suara.findByIdAndUpdate(
      id.length === 1
        ? new mongoose.Types.ObjectId()
        : new mongoose.Types.ObjectId(id),
      updateData,
      { new: true, upsert: true }
    );

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
    const { id_kabupaten, id_kecamatan, id_kelurahan } = req.query;
    let matchQuery = {};
    if (id_kabupaten) matchQuery["id_kabupaten"] = id_kabupaten;
    if (id_kecamatan) matchQuery["id_kecamatan"] = id_kecamatan;
    if (id_kelurahan) matchQuery["id_kelurahan"] = id_kelurahan;

    const pipeline = [
      {
        $lookup: {
          from: "suaras",
          let: { tpsId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$tps_id", "$$tpsId"] },
                    ...Object.entries(matchQuery).map(([key, value]) => ({ $eq: [`$${key}`, value] })),
                  ]
                }
              }
            }
          ],
          as: "suaraDetails"
        }
      },
      {
        $unwind: {
          path: "$suaraDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: "$_id",
          tpsName: { $first: "$name" },
          totalSuara: {
            $sum: {
              $add: [
                { $ifNull: ["$suaraDetails.jumlah", 0] },
                { $ifNull: ["$suaraDetails.laki_laki", 0] },
                { $ifNull: ["$suaraDetails.perempuan", 0] }
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          tpsName: 1,
          totalSuara: 1
        }
      },
      {
        $sort: {
          _id: 1
        }
      }
    ];

    const totalSuaraPerTPS = await TPS.aggregate(pipeline);
    res.json(totalSuaraPerTPS);
  } catch (err) {
    handleServerError(err, res);
  }
});

module.exports = router;
