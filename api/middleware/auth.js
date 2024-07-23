const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  // Mendapatkan token dari header Authorization
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Biasanya "Bearer TOKEN"

  if (token == null) return res.sendStatus(401); // Tidak ada token yang disediakan

  jwt.verify(token, "sadljfnsjfwopierw@#$3220375wlkdfw", (err, user) => {
    if (err) return res.sendStatus(403); // Token tidak valid atau kadaluwarsa

    req.user = user; // Menyimpan informasi pengguna ke request
    next(); // Lanjutkan ke handler berikutnya
  });
}

module.exports = authenticateToken;
