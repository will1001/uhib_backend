const express = require("express");
const router = express.Router();
const Suara = require("../models/suara");
const File = require("../models/file");
const TPS = require("../models/tps");
const mongoose = require("mongoose");
const XLSX = require("xlsx");
const { incrementCell } = require("../lib/helper");
const authenticateToken = require("../middleware/auth");
const { storeFile } = require("../lib/storage");

const handleServerError = (err, res) => {
  console.error(err.message);
  res.status(500).send("Server error");
};

router.get("/suara", authenticateToken, async (req, res) => {
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

router.put("/suara/:id", authenticateToken, async (req, res) => {
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
      "id_partai",
      "id_caleg",
      "jumlah_suara_sah_partai_caleg",
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

router.get("/tps", authenticateToken, async (req, res) => {
  try {
    const tps = await TPS.find({});
    res.json(tps);
  } catch (err) {
    handleServerError(err, res);
  }
});

router.get("/total-suara-per-tps", authenticateToken, async (req, res) => {
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
                    ...Object.entries(matchQuery).map(([key, value]) => ({
                      $eq: [`$${key}`, value],
                    })),
                  ],
                },
              },
            },
          ],
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
                { $ifNull: ["$suaraDetails.jumlah", 0] },
                { $ifNull: ["$suaraDetails.laki_laki", 0] },
                { $ifNull: ["$suaraDetails.perempuan", 0] },
                { $ifNull: ["$suaraDetails.jumlah_suara_sah_partai_caleg", 0] },
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
    ];

    const totalSuaraPerTPS = await TPS.aggregate(pipeline);

    let output = [];

    const suara = await Suara.find({
      id_kabupaten,
      id_kecamatan,
      id_kelurahan,
    });
    for (const tps of totalSuaraPerTPS) {
      const datas = suara.filter((e) => e.tps_id === tps._id);
      const findSuara = (filter) => {
        const data = datas.find((e) => {
          return Object.keys(filter).every((key) => {
            if (filter[key] !== null) {
              return e[key] === filter[key];
            }
            return true;
          });
        });

        return data ? data.jumlah : 0;
      };

      output.push({
        _id: tps._id,
        name: tps.tpsName,
        jumlah_suara_sah: findSuara({ grup_suara: 5, category_suara: 1 }),
        jumlah_suara_tidak_sah: findSuara({ grup_suara: 5, category_suara: 2 }),
        jumlah_pemilih_dalam_DPT: findSuara({
          grup_suara: 1,
          category_suara: 1,
          sub_category_suara: 1,
        }),
        pengguna_hak_pilih_dalam_DPT: findSuara({
          grup_suara: 1,
          category_suara: 2,
          sub_category_suara: 1,
        }),
        DPTb: findSuara({
          grup_suara: 1,
          category_suara: 2,
          sub_category_suara: 2,
        }),
        DPTk: findSuara({
          grup_suara: 1,
          category_suara: 1,
          sub_category_suara: 3,
        }),
        surat_suara_yang_diterima: findSuara({
          grup_suara: 2,
          category_suara: 1,
          sub_category_suara: 1,
        }),
        surat_suara_yang_digunakan: findSuara({
          grup_suara: 2,
          category_suara: 1,
          sub_category_suara: 2,
        }),
        surat_suara_dikembalikan: findSuara({
          grup_suara: 2,
          category_suara: 1,
          sub_category_suara: 3,
        }),
        surat_suara_yang_tidak_digunakan: findSuara({
          grup_suara: 2,
          category_suara: 1,
          sub_category_suara: 4,
        }),
      });
    }
    res.json(output);
  } catch (err) {
    handleServerError(err, res);
  }
});
router.get("/total-suara-partai", authenticateToken, async (req, res) => {
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
                    { $ne: ["$id_partai", null] }, // Pastikan id_partai tidak null
                    ...Object.entries(matchQuery).map(([key, value]) => ({
                      $eq: [`$${key}`, value],
                    })),
                  ],
                },
              },
            },
          ],
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
          _id: "$suaraDetails.id_partai",
          totalSuaraPerPartai: {
            $sum: "$suaraDetails.jumlah_suara_sah_partai_caleg",
          },
        },
      },
      {
        $group: {
          _id: null, // Agregasi seluruh data menjadi satu kelompok
          totalSuara: { $sum: "$totalSuaraPerPartai" },
          suaraPerPartai: {
            $push: {
              partai: "$_id",
              suara: "$totalSuaraPerPartai",
            },
          },
        },
      },
      {
        $unwind: "$suaraPerPartai",
      },
      {
        $project: {
          _id: 0,
          partai: "$suaraPerPartai.partai",
          suara: "$suaraPerPartai.suara",
          persentaseSuara: {
            $multiply: [
              {
                $divide: ["$suaraPerPartai.suara", "$totalSuara"],
              },
              100,
            ],
          },
        },
      },
      {
        $sort: {
          partai: 1,
        },
      },
    ];

    const totalSuaraPerPartai = await TPS.aggregate(pipeline);

    let output = [];
    const suara_kursi = await Suara.aggregate([
      {
        $match: {
          id_kecamatan: { $in: ["5202091", "5202090"] }, // Menyaring dokumen untuk dua kecamatan tersebut
        },
      },
      {
        $group: {
          _id: "$id_partai", // Mengelompokkan dokumen berdasarkan id_partai
          totalSuara: { $sum: "$jumlah_suara_sah_partai_caleg" }, // Menghitung total suara
        },
      },
      {
        $project: {
          _id: 0,
          idPartai: "$_id",
          totalSuara: 1,
        },
      },
      {
        $sort: {
          idPartai: 1, // Mengurutkan hasil berdasarkan id_partai
        },
      },
    ]);
    for (const suara of totalSuaraPerPartai) {
      output.push({
        ...suara,
        kursi: suara_kursi.find((e) => e.idPartai === suara.partai)
          ? suara_kursi.find((e) => e.idPartai === suara.partai).totalSuara
          : 0,
      });
    }
    output.shift();

    res.json(output);
  } catch (err) {
    handleServerError(err, res);
  }
});

router.post("/suara/import", authenticateToken, async (req, res) => {
  try {
    const data_suara = [
      {
        id: 1,
        name: "I. DATA PEMILIH DAN PENGGUNA HAK PILIH",
        have_children: true,
        tabel_data: [
          {
            id: 1,
            category: "A. DATA PEMILIH",
            children: [
              {
                id: 1,
                item: "Jumlah Pemilih dalam Daftar Pemilih Tetap (DPT) (Terdapat dalam Model A-Kabko Daftar pemilih)",
                laki_laki: 1,
                perempuan: 200,
                jumlah: 300,
              },
            ],
            laki_laki: 100,
            perempuan: 200,
            jumlah: 300,
          },
          {
            id: 2,
            category: "B. PENGGUNA HAK PILIH",
            children: [
              {
                id: 1,
                item: "Jumlah pengguna hak pilih dalam Daftar Pemilih Tetap (DPT)",
                laki_laki: 100,
                perempuan: 200,
                jumlah: 300,
              },
              {
                id: 2,
                item: "Jumlah pengguna hak pilih dalam Daftar Pemilih Tambahan (DPTb)",
                laki_laki: 100,
                perempuan: 200,
                jumlah: 300,
              },
              {
                id: 3,
                item: "Jumlah pengguna hak pilih dalam Daftar Pemilih Khusus (DPK)",
                laki_laki: 100,
                perempuan: 200,
                jumlah: 300,
              },
              {
                id: 4,
                item: "Jumlah pengguna hak pilih (B.1 + B.2 + B.3)",
                laki_laki: 100,
                perempuan: 200,
                jumlah: 300,
              },
            ],
          },
        ],
        columns: [
          {
            key: "uraian",
            label: "Uraian",
          },
          {
            key: "laki_laki",
            label: "LAKI-LAKI (L)",
          },
          {
            key: "perempuan",
            label: "PEREMPUAN (P)",
          },
          {
            key: "jumlah",
            label: "JUMLAH (L+P)",
          },
          {
            key: "",
            label: "",
          },
        ],
      },
      {
        id: 2,
        name: "II. DATA PENGGUNAAN SURAT SUARA",
        have_children: true,
        tabel_data: [
          {
            id: 1,
            category: "",
            children: [
              {
                id: 1,
                item: "Jumlah surat suara yang diterima, termasuk surat suara cadangan 2% dari DPT (2+3+4)",
                jumlah: 300,
              },
              {
                id: 2,
                item: "Jumlah surat suara yang digunakan",
                jumlah: 300,
              },
              {
                id: 3,
                item: "Jumlah surat suara yang dikembalikan oleh pemilih karena rusak/keliru coblos",
                jumlah: 300,
              },
              {
                id: 4,
                item: "Jumlah surat suara yang tidak digunakan/tidak terpakai, termasuk sisa surat suara cadangan",
                jumlah: 300,
              },
            ],
            jumlah: 300,
          },
        ],
        columns: [
          {
            key: "uraian",
            label: "Uraian",
          },
          {
            key: "jumlah",
            label: "JUMLAH (L+P)",
          },
          {
            key: "",
            label: "",
          },
        ],
      },
      {
        id: 3,
        name: "III. DATA PEMILIH DISABILITAS",
        have_children: true,
        tabel_data: [
          {
            id: 1,
            category: "",
            children: [
              {
                id: 1,
                item: "Jumlah seluruh pemilih disabilitas yang menggunakan hak pilih",
                laki_laki: 100,
                perempuan: 200,
                jumlah: 300,
              },
            ],
            laki_laki: 100,
            perempuan: 200,
            jumlah: 300,
          },
        ],
        columns: [
          {
            key: "uraian",
            label: "Uraian",
          },
          {
            key: "laki_laki",
            label: "LAKI-LAKI (L)",
          },
          {
            key: "perempuan",
            label: "PEREMPUAN (P)",
          },
          {
            key: "jumlah",
            label: "JUMLAH (L+P)",
          },
          {
            key: "",
            label: "",
          },
        ],
      },
      {
        id: 4,
        name: "IV. DATA PEROLEHAN SUARA PARTAI POLITIK DAN SUARA CALON",
        have_children: false,
        partai: [
          {
            id: 1,
            nama: "Partai Kebangkitan Bangsa",
            suara_sah: 10,
            caleg: [
              {
                id: 1,
                nama: "Dra. NURUL ADHA H.MZ",
                suara_sah: 1,
              },
              {
                id: 2,
                nama: "SYUKRON HADI, M.E.",
                suara_sah: 2,
              },
              {
                id: 3,
                nama: "SAEPUL MASRI, S.H.",
                suara_sah: 3,
              },
              {
                id: 4,
                nama: "MUSLIHAN",
                suara_sah: 4,
              },
              {
                id: 5,
                nama: "ANANG TRI RESTU JULIAN",
                suara_sah: 5,
              },
              {
                id: 6,
                nama: "YULIANTI",
                suara_sah: 6,
              },
              {
                id: 7,
                nama: "NURIDAN, S.Kep.",
                suara_sah: 7,
              },
            ],
          },
          {
            id: 2,
            nama: "Partai Gerakan Indonesia Raya",
            suara_sah: 101,
            caleg: [
              {
                id: 8,
                nama: "MUHAMAD NASIB, S.P.",
                suara_sah: 11,
              },
              {
                id: 9,
                nama: "MUSLEHUDIN, S.Pd.I., M.Si.",
                suara_sah: 21,
              },
              {
                id: 10,
                nama: "ZIYADATUL AULIYA",
                suara_sah: 31,
              },
              {
                id: 11,
                nama: "RUSDIONO, S.Pd.I.",
                suara_sah: 41,
              },
              {
                id: 12,
                nama: "CANDRAWATI",
                suara_sah: 51,
              },
              {
                id: 13,
                nama: "HILMIATI",
                suara_sah: 61,
              },
              {
                id: 14,
                nama: "LALU OKTAFIAN MIRAJA",
                suara_sah: 71,
              },
            ],
          },
          {
            id: 3,
            nama: "Partai Demokrasi Indonesia Perjuangan",
            suara_sah: 10,
            caleg: [
              {
                id: 15,
                nama: "SURYA DARMA, S.H.",
                suara_sah: 1,
              },
              {
                id: 16,
                nama: "BAIQ MARLIANI",
                suara_sah: 2,
              },
              {
                id: 17,
                nama: "MUNAWIR HARIS",
                suara_sah: 3,
              },
              {
                id: 18,
                nama: "SITI PATIMAH",
                suara_sah: 4,
              },
              {
                id: 19,
                nama: "LALU SURYA REZA RINALDI",
                suara_sah: 5,
              },
              {
                id: 20,
                nama: "SINAR RIAWAN, S.Pd.I.",
                suara_sah: 6,
              },
              {
                id: 21,
                nama: "HABIBI",
                suara_sah: 7,
              },
            ],
          },
          {
            id: 4,
            nama: "Partai Golongan Karya",
            suara_sah: 10,
            caleg: [
              // Updated candidate list for Partai Golongan Karya
              {
                id: 22,
                nama: "FARIDA",
                suara_sah: 1,
              },
              {
                id: 23,
                nama: "NAFILA RESNAFANI, A.Md.",
                suara_sah: 2,
              },
              {
                id: 24,
                nama: "SYARIFUDIN, S.Ag.",
                suara_sah: 3,
              },
              {
                id: 25,
                nama: "LALU TAUFAN CHANDRADIMUKA",
                suara_sah: 4,
              },
              {
                id: 26,
                nama: "HERLINA SUSANTI",
                suara_sah: 5,
              },
              {
                id: 27,
                nama: "HAJI BASIRUDIN",
                suara_sah: 6,
              },
              {
                id: 28,
                nama: "IRFAN, S.Pd.",
                suara_sah: 7,
              },
            ],
          },
          {
            id: 5,
            nama: "Partai Nasional Demokrat",
            suara_sah: 10,
            caleg: [
              // Updated candidate list for Partai NasDem
              {
                id: 29,
                nama: "KI AGUS AZHAR, S.H.",
                suara_sah: 1,
              },
              {
                id: 30,
                nama: "ABUBAKAR H. JAMAL, S.Pd.",
                suara_sah: 2,
              },
              {
                id: 31,
                nama: "RUBA'YAH",
                suara_sah: 3,
              },
              {
                id: 32,
                nama: "ISKANDAR MARZUKI",
                suara_sah: 4,
              },
              {
                id: 33,
                nama: "SAHIRUDIN",
                suara_sah: 5,
              },
              {
                id: 34,
                nama: "LIANTI HARTINI",
                suara_sah: 6,
              },
              {
                id: 35,
                nama: "ABDUL WAHID",
                suara_sah: 7,
              },
            ],
          },
          {
            id: 6,
            nama: "Partai Buruh",
            suara_sah: 10,
            caleg: [
              // Updated candidate list for Partai Buruh
              {
                id: 36,
                nama: "ALUH JALIS TOFAENI",
                suara_sah: 1,
              },
              {
                id: 37,
                nama: "SANTIA MAHARANI",
                suara_sah: 2,
              },
              {
                id: 38,
                nama: "MUHAMMAD ALI IMRON",
                suara_sah: 3,
              },
            ],
          },
          {
            id: 7,
            nama: "Partai Gelombang Rakyat Indonesia",
            suara_sah: 10,
            caleg: [
              // Updated candidate list for Partai Gelombang Rakyat Indonesia
              {
                id: 39,
                nama: "HUSNA KARIM",
                suara_sah: 1,
              },
              {
                id: 40,
                nama: "SUPRIADI",
                suara_sah: 2,
              },
              {
                id: 41,
                nama: "NITA LARASATI",
                suara_sah: 3,
              },
              {
                id: 42,
                nama: "LALU IRWAN JAYADI",
                suara_sah: 4,
              },
              {
                id: 43,
                nama: "DWI ISTIYANI",
                suara_sah: 5,
              },
              {
                id: 44,
                nama: "LALU ARIA GUNA",
                suara_sah: 6,
              },
              {
                id: 45,
                nama: "MOHAMAD SOHIBUL",
                suara_sah: 7,
              },
            ],
          },
          {
            id: 8,
            nama: "Partai Keadilan Sejahtera",
            suara_sah: 7,
            caleg: [
              {
                id: 46,
                nama: "H. UHIBBUSSA ADI, S.T.",
                suara_sah: 1,
              },
              {
                id: 47,
                nama: "TGH. M. JAMALUDIN",
                suara_sah: 2,
              },
              {
                id: 48,
                nama: "NURHIDAYAH",
                suara_sah: 3,
              },
              {
                id: 49,
                nama: "H. MUHAMAD SIDIK MAULANA, S.H.",
                suara_sah: 4,
              },
              {
                id: 50,
                nama: "ROSHY ARTIKA WATI",
                suara_sah: 5,
              },
              {
                id: 51,
                nama: "SARBINI",
                suara_sah: 6,
              },
              {
                id: 52,
                nama: "MUTTAQILLAH ARSYAD, S.Pd.I.",
                suara_sah: 7,
              },
            ],
          },
          {
            id: 9,
            nama: "Partai Kebangkitan Nusantara",
            suara_sah: 4,
            caleg: [
              {
                id: 53,
                nama: "MARYADI",
                suara_sah: 1,
              },
              {
                id: 54,
                nama: "DESAK NYOMAN PARWATINI",
                suara_sah: 2,
              },
              {
                id: 55,
                nama: "MUHTAR",
                suara_sah: 3,
              },
              {
                id: 56,
                nama: "DUDUK ABDULLAH",
                suara_sah: 4,
              },
            ],
          },
          {
            id: 10,
            nama: "Partai Hati Nurani Rakyat",
            suara_sah: 7,
            caleg: [
              {
                id: 57,
                nama: "ZAENUL MUTTAKIN, S.Sos.",
                suara_sah: 1,
              },
              {
                id: 58,
                nama: "LENI ASTUTI",
                suara_sah: 2,
              },
              {
                id: 59,
                nama: "RAF'IL",
                suara_sah: 3,
              },
              {
                id: 60,
                nama: "MAHRUN",
                suara_sah: 4,
              },
              {
                id: 61,
                nama: "IZATUL ISLAMIAH",
                suara_sah: 5,
              },
              {
                id: 62,
                nama: "AHSAN",
                suara_sah: 6,
              },
              {
                id: 63,
                nama: "MASRUN",
                suara_sah: 7,
              },
            ],
          },
          {
            id: 11,
            nama: "Partai Garda Perubahan Indonesia",
            suara_sah: 0,
            caleg: [],
          },
          {
            id: 12,
            nama: "Partai Amanat Nasional",
            suara_sah: 7,
            caleg: [
              {
                id: 64,
                nama: "LALU PURNAMA AGUNG, S.I.P.",
                suara_sah: 1,
              },
              {
                id: 65,
                nama: "ABDUL AZIS, S.Pd.",
                suara_sah: 2,
              },
              {
                id: 66,
                nama: "MASKIAH, S.Pd.I.",
                suara_sah: 3,
              },
              {
                id: 67,
                nama: "MASHUDI, S.Pd.",
                suara_sah: 4,
              },
              {
                id: 68,
                nama: "APRIANI",
                suara_sah: 5,
              },
              {
                id: 69,
                nama: "SUNIARTE",
                suara_sah: 6,
              },
              {
                id: 70,
                nama: "RUDI HARTAWAN",
                suara_sah: 7,
              },
            ],
          },
          {
            id: 13,
            nama: "Partai Bulan Bintang",
            suara_sah: 7,
            caleg: [
              {
                id: 71,
                nama: "ZULPAN AZHARI",
                suara_sah: 1,
              },
              {
                id: 72,
                nama: "ZABUR AIN",
                suara_sah: 2,
              },
              {
                id: 73,
                nama: "PAHRIAH",
                suara_sah: 3,
              },
              {
                id: 74,
                nama: "RORO VIONA FIOLETA",
                suara_sah: 4,
              },
              {
                id: 75,
                nama: "YENI HERAWATI",
                suara_sah: 5,
              },
              {
                id: 76,
                nama: "ABDUL HAFIZ KAMARUDIN",
                suara_sah: 6,
              },
              {
                id: 77,
                nama: "MASRUN EFENDI",
                suara_sah: 7,
              },
            ],
          },
          {
            id: 14,
            nama: "Partai Demokrat",
            suara_sah: 7,
            caleg: [
              {
                id: 78,
                nama: "SAMSUL RIZAL, S.H.",
                suara_sah: 1,
              },
              {
                id: 79,
                nama: "BAIQ FATMAH",
                suara_sah: 2,
              },
              {
                id: 80,
                nama: "MUHIZAN TAMIMI, S.E.",
                suara_sah: 3,
              },
              {
                id: 81,
                nama: "IDAYU HARYASUNI",
                suara_sah: 4,
              },
              {
                id: 82,
                nama: "BASRI, S.Pd.",
                suara_sah: 5,
              },
              {
                id: 83,
                nama: "RAMDHAN, S.H.I.",
                suara_sah: 6,
              },
              {
                id: 84,
                nama: "JUMRAH, S.H.",
                suara_sah: 7,
              },
            ],
          },
          {
            id: 15,
            nama: "Partai Solidaritas Indonesia",
            suara_sah: 10,
            caleg: [],
          },
          {
            id: 16,
            nama: "PARTAI PERINDO",
            suara_sah: 7,
            caleg: [
              {
                id: 85,
                nama: "HARUN ZAIN",
                suara_sah: 1,
              },
              {
                id: 86,
                nama: "DESYANI SUTRA DEWI",
                suara_sah: 2,
              },
              {
                id: 87,
                nama: "HAJI MUHAMMAD NASIR, S.Pd.I.",
                suara_sah: 3,
              },
              {
                id: 88,
                nama: "M. RASYID RIDLO, M.Pd.",
                suara_sah: 4,
              },
              {
                id: 89,
                nama: "AHMAD SUHADI, S.Sos.",
                suara_sah: 5,
              },
              {
                id: 90,
                nama: "ENDANG YULIANA",
                suara_sah: 6,
              },
              {
                id: 91,
                nama: "JAPUN, S.Sos.",
                suara_sah: 7,
              },
            ],
          },
          {
            id: 17,
            nama: "Partai Persatuan Pembangunan",
            suara_sah: 7,
            caleg: [
              {
                id: 92,
                nama: "Hj. MUAINI, M.Pd.I.",
                suara_sah: 1,
              },
              {
                id: 93,
                nama: "LALU MUH. SYARIF HIDAYATULLAH, S.Pd.I.",
                suara_sah: 2,
              },
              {
                id: 94,
                nama: "ANANG DEDI SATRIAWAN",
                suara_sah: 3,
              },
              {
                id: 95,
                nama: "H. SURANTO, S.P.",
                suara_sah: 4,
              },
              {
                id: 96,
                nama: "BAIQ NOVIRIANTI, S.Pd.",
                suara_sah: 5,
              },
              {
                id: 97,
                nama: "MUHAMMAD SUFYAN ATS TSAURI, M.Pd.",
                suara_sah: 6,
              },
              {
                id: 98,
                nama: "MAKNUN",
                suara_sah: 7,
              },
            ],
          },
          {
            id: 18,
            nama: "Partai Ummat",
            suara_sah: 2,
            caleg: [
              {
                id: 99,
                nama: "AGUS SUHIRJAN, S.M.",
                suara_sah: 1,
              },
              {
                id: 100,
                nama: "MIFTAHUL JANNAH, S.Pd.",
                suara_sah: 2,
              },
            ],
          },
        ],
        columns: [
          {
            key: "uraian",
            label: "NOMOR, NAMA PARTAI DAN CALON",
          },
          {
            key: "suara_sah",
            label: "SUARA SAH",
          },
          {
            key: "",
            label: "",
          },
        ],
      },
      {
        id: 5,
        name: "V. DATA SUARA SAH DAN TIDAK SAH",
        have_children: false,
        tabel_data: [
          {
            id: 1,
            category: "A. JUMLAH SELURUH SUARA SAH",
            children: [],
            jumlah: 2,
          },
          {
            id: 2,
            category: "B. JUMLAH SUARA TIDAK SAH",
            children: [],
            jumlah: 3,
          },
          {
            id: 3,
            category: "C. JUMLAH SELURUH SUARA SAH DAN SUARA TIDAK SAH (A + B)",
            children: [],
            jumlah: 4,
          },
        ],
        columns: [
          {
            key: "uraian",
            label: "Uraian",
          },

          {
            key: "jumlah",
            label: "JUMLAH (L+P)",
          },
          {
            key: "",
            label: "",
          },
        ],
      },
    ];
    const { file, id_kabupaten, id_kecamatan, id_kelurahan, tps_number } =
      req.body;
    let data = [];
    let col;
    let row;
    let base_col;
    let last_row = 0;
    const data_tps = await TPS.find({}).limit(+tps_number);

    if (file) {
      if (file[0].filename === "")
        res.status(400).json({ message: "File Tidak Boleh Kosong" });
      const buffer = Buffer.from(file, "base64");
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      await Suara.deleteMany({
        id_kabupaten,
        id_kecamatan,
        id_kelurahan,
      });

      for (const suara of data_suara) {
        for (const [i, category] of (suara
          ? suara.tabel_data
            ? suara.tabel_data
            : []
          : []
        ).entries()) {
          for (const [j, tps] of data_tps.entries()) {
            for (const [k, sub_category] of (category
              ? category.children
              : []
            ).entries()) {
              if (suara.id === 1) {
                let post_data = {};
                base_col = await incrementCell("D", j);
                col = base_col;
                row = 12;
                if (category.id === 1) {
                  if (sub_category.id === 1) {
                    const cell_lk = col + row;
                    const cell_pr = col + (row + 1);
                    const cell_jml = col + (row + 2);
                    const desired_cell_lk = worksheet[`${cell_lk}`];
                    const desired_cell_pr = worksheet[`${cell_pr}`];
                    const desired_cell_jml = worksheet[`${cell_jml}`];
                    post_data = {
                      id_kabupaten,
                      id_kecamatan,
                      id_kelurahan,
                      grup_suara: suara.id,
                      category_suara: category.id,
                      sub_category_suara: sub_category.id,
                      tps_id: tps._id,
                      laki_laki: desired_cell_lk ? desired_cell_lk.v : 0,
                      perempuan: desired_cell_pr ? desired_cell_pr.v : 0,
                      jumlah: desired_cell_jml ? desired_cell_jml.v : 0,
                    };
                  }
                }
                if (category.id === 2) {
                  const cell_lk = col + (16 + k * 3);
                  const cell_pr = col + (16 + k * 3 + 1);
                  const cell_jml = col + (16 + k * 3 + 2);
                  const desired_cell_lk = worksheet[`${cell_lk}`];
                  const desired_cell_pr = worksheet[`${cell_pr}`];
                  const desired_cell_jml = worksheet[`${cell_jml}`];
                  post_data = {
                    id_kabupaten,
                    id_kecamatan,
                    id_kelurahan,
                    grup_suara: suara.id,
                    category_suara: category.id,
                    sub_category_suara: sub_category.id,
                    tps_id: tps._id,
                    laki_laki: desired_cell_lk ? desired_cell_lk.v : 0,
                    perempuan: desired_cell_pr ? desired_cell_pr.v : 0,
                    jumlah: desired_cell_jml ? desired_cell_jml.v : 0,
                  };
                }
                await Suara.findByIdAndUpdate(
                  new mongoose.Types.ObjectId(),
                  post_data,
                  { new: true, upsert: true }
                );
              }
              if (suara.id === 2) {
                base_col = await incrementCell("D", j);
                col = base_col;
                row = 30;
                if (category.id === 1) {
                  const cell_lk = col + (row + k * 1);
                  const desired_cell_lk = worksheet[`${cell_lk}`];
                  post_data = {
                    id_kabupaten,
                    id_kecamatan,
                    id_kelurahan,
                    grup_suara: suara.id,
                    category_suara: category.id,
                    sub_category_suara: sub_category.id,
                    tps_id: tps._id,
                    jumlah: desired_cell_lk ? desired_cell_lk.v : 0,
                  };
                }
                await Suara.findByIdAndUpdate(
                  new mongoose.Types.ObjectId(),
                  post_data,
                  { new: true, upsert: true }
                );
              }
              if (suara.id === 3) {
                base_col = await incrementCell("D", j);
                col = base_col;
                row = 36;
                if (category.id === 1) {
                  const cell_lk = col + row;
                  const cell_pr = col + (row + 1);
                  const cell_jml = col + (row + 2);
                  const desired_cell_lk = worksheet[`${cell_lk}`];
                  const desired_cell_pr = worksheet[`${cell_pr}`];
                  const desired_cell_jml = worksheet[`${cell_jml}`];
                  post_data = {
                    id_kabupaten,
                    id_kecamatan,
                    id_kelurahan,
                    grup_suara: suara.id,
                    category_suara: category.id,
                    sub_category_suara: sub_category.id,
                    tps_id: tps._id,
                    laki_laki: desired_cell_lk ? desired_cell_lk.v : 0,
                    perempuan: desired_cell_pr ? desired_cell_pr.v : 0,
                    jumlah: desired_cell_jml ? desired_cell_jml.v : 0,
                  };
                }

                await Suara.findByIdAndUpdate(
                  new mongoose.Types.ObjectId(),
                  post_data,
                  { new: true, upsert: true }
                );
              }
            }

            if (suara.id === 5) {
              base_col = await incrementCell("D", j);
              col = base_col;
              row = 196;
              const cell_lk = col + (row + i * 1);
              const desired_cell_lk = worksheet[`${cell_lk}`];
              post_data = {
                id_kabupaten,
                id_kecamatan,
                id_kelurahan,
                grup_suara: suara.id,
                category_suara: category.id,
                sub_category_suara: 0,
                tps_id: tps._id,
                jumlah: desired_cell_lk ? desired_cell_lk.v : 0,
              };

              await Suara.findByIdAndUpdate(
                new mongoose.Types.ObjectId(),
                post_data,
                { new: true, upsert: true }
              );
            }
          }
        }
        if (suara.id === 4) {
          for (const [i, partai] of (suara
            ? suara.partai
              ? suara.partai
              : []
            : []
          ).entries()) {
            row = 43;
            last_row = i === 0 ? row : last_row;
            if (i > 0) {
              last_row =
                last_row + (suara.partai[i > 0 ? i - 1 : i].caleg.length + 3);
            }
            for (const [j, tps] of data_tps.entries()) {
              base_col = await incrementCell("D", j);
              col = base_col;

              const cell_lk = col + last_row;
              const desired_cell_lk = worksheet[`${cell_lk}`];

              const post_data_1 = {
                id_kabupaten,
                id_kecamatan,
                id_kelurahan,
                grup_suara: suara.id,
                category_suara: 0,
                sub_category_suara: 0,
                tps_id: tps._id,
                id_partai: partai.id,
                id_caleg: 0,
                jumlah_suara_sah_partai_caleg: desired_cell_lk
                  ? desired_cell_lk.v
                  : 0,
              };

              await Suara.findByIdAndUpdate(
                new mongoose.Types.ObjectId(),
                post_data_1,
                { new: true, upsert: true }
              );
              for (const [k, caleg] of (partai.caleg
                ? partai.caleg
                : []
              ).entries()) {
                base_col = await incrementCell("D", j);
                col = base_col;
                row = last_row + 1;
                const cell_lk = col + (row + k);
                const desired_cell_lk = worksheet[`${cell_lk}`];

                const post_data_2 = {
                  id_kabupaten,
                  id_kecamatan,
                  id_kelurahan,
                  grup_suara: suara.id,
                  category_suara: 0,
                  sub_category_suara: 0,
                  tps_id: tps._id,
                  id_partai: partai.id,
                  id_caleg: caleg.id,
                  jumlah_suara_sah_partai_caleg: desired_cell_lk
                    ? desired_cell_lk.v
                    : 0,
                };

                await Suara.findByIdAndUpdate(
                  new mongoose.Types.ObjectId(),
                  post_data_2,
                  { new: true, upsert: true }
                );
              }
            }
          }
        }
      }

      // data = XLSX.utils.sheet_to_json(worksheet);
    }

    res.json({ message: "success" });
  } catch (err) {
    handleServerError(err, res);
  }
});

router.post("/suara/file", async (req, res) => {
  const newData = req.body;
  const { file, ext } = newData;

  newData._id = new mongoose.Types.ObjectId();
  try {
    if (file) {
      if (file[0].filename === "")
        res.status(400).json({ message: "File Tidak Boleh Kosong" });

      if (ext !== "xlsx") {
        return res
          .status(400)
          .json({ message: "Hanya file .xlsx yang diperbolehkan" });
      }
      const base64Data = file.replace(/^data:image\/\w+;base64,/, ""); // hilangkan header base64
      const buff = Buffer.from(base64Data, "base64");

      const extFile = "xlsx"; // asumsikan ekstensi file jpg
      const filename = `suara_${newData._id}.${extFile}`;
      await storeFile(buff, "suara", filename);
      let saveData = newData;
      saveData.file = "/suara/" + filename;
      const newFile = new File(saveData);
      await newFile.save();
    } else {
      const newFile = new File(newData);
      await newFile.save();
    }
    res.status(201).json({
      message: "File created successfully",
    });
  } catch (err) {
    console.error("Error creating File:", err);
    res.status(500).json({ message: "Server error" });
  }
});
router.get("/suara/file", async (req, res) => {
  try {
    const data = await File.find({ ...req.query });

    res.status(201).json({
      message: "File created successfully",
      data,
    });
  } catch (err) {
    console.error("Error creating File:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
