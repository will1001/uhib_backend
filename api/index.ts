const express = require("express");
const app = express();

app.get("/", (req, res) => res.send("Express on Vercel"));
app.get("/hello", (req, res) => res.send("hello world"));

app.listen(3001, () => console.log("Server ready on port 3000."));

module.exports = app;