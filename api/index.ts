const express = require("express");
const connectDB = require("./db");
const region = require("./routes/Region");
const app = express();

connectDB();

app.use(express.json());

app.use("/", region);

app.get("/", (req, res) => res.send("Express on Vercel"));

app.listen(3003, () => console.log("Server ready on port 3003."));

module.exports = app;
