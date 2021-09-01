"use strict";

const express = require("express");
const path = require("path");

const IP = require("../utils/ip")();

const PORT_WEB = 8002;
const PORT_APP = 8003;

const web = express();
web.use(express.static(path.join(__dirname, "/web")));
web.listen(PORT_WEB, "0.0.0.0", () => {
    console.info(`[Web] Listening on\n\thttp://${IP}:${PORT_WEB}`);
});

const app = express();
app.use(express.static(path.join(__dirname, "/app")));
app.listen(PORT_APP, "0.0.0.0", () => {
    console.info(`[App] Listening on\n\thttp://${IP}:${PORT_APP}`);
});
