"use strict";

const express = require("express");
const path = require("path");
const { networkInterfaces } = require("os");

const PORT = 8002;
const IP = Object.values(networkInterfaces())
    .flat()
    .find((i) => i.family == "IPv4" && !i.internal).address;

const app = express();
app.use(express.static(path.join(__dirname, "/public")));

app.listen(PORT, "0.0.0.0", () => {
    console.info(`Listening on\n\thttp://localhost:${PORT}\n\thttp://${IP}:${PORT}`);
});
