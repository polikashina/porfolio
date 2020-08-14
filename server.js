const express = require("express");
const server = express();
const fs = require("fs");
const path = require("path");

const port = 3000;

server.use(express.static(`${__dirname}/public`));

server.get("/", (req, res) => {
  res.sendFile("/public/index.html");
});

server.listen(port);
console.log(`Server is running on localhost:${port}`);
