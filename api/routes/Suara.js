const express = require("express");
const router = express.Router();
const Suara = require("../models/suara");
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

      const updatedSuara = await Suara.findByIdAndUpdate(mongoose.Types.ObjectId(id), updateData, {
        new: true,
      });
      if (!updatedSuara) {
        return res.status(404).send("Suara not found");
      }
      res.json(updatedSuara);
    } catch (err) {
      handleServerError(err, res);
    }
  });
});

module.exports = router;
