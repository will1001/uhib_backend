const express = require("express");
const connectDB = require("./db");
const region = require("./routes/Region");
const suara = require("./routes/Suara");
const program = require("./routes/Program");
const slider = require("./routes/Slider");
const auth = require("./routes/Auth");
const aspirasi = require("./routes/Aspirasi");
const galeri = require("./routes/Galeri");
const bodyParser = require("body-parser");
const app = express();
const cors = require("cors");

connectDB();

// Use CORS middleware
app.use(cors());

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

app.use("/", region);
app.use("/", suara);
app.use("/", program);
app.use("/", aspirasi);
app.use("/", slider);
app.use("/", auth);
app.use("/", galeri);

app.get("/", (req, res) => res.send("Express on Vercel"));

app.listen(3003, () => console.log("Server ready on port 3003."));

module.exports = app;
