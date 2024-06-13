const express = require("express");
const connectDB = require("./db");
const region = require("./routes/Region");
const app = express();
const cors = require("cors");

connectDB();

// Use CORS middleware
app.use(cors());

app.use(express.json());

app.use("/", region);

app.get("/", (req, res) => res.send("Express on Vercel"));

app.listen(3003, () => console.log("Server ready on port 3003."));

module.exports = app;
