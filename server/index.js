"use strict";

const express = require("express");
const path = require("path");
const { createServer } = require("http");
const { networkInterfaces } = require("os");

const WebSocket = require("ws");

const app = express();
app.use(express.static(path.join(__dirname, "/public")));

const server = createServer(app);
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws, socket, req) => {
    console.log("started client", socket.headers["sec-websocket-key"]);
    ws.send(JSON.stringify({ code: 0, step: 0, msg: "Create connection" }), (err) => {
        // error
    });

    ws.on("close", function () {
        console.log("stopping client");
    });
});

const PORT = 8001;
const IP = Object.values(networkInterfaces())
    .flat()
    .find((i) => i.family == "IPv4" && !i.internal).address;

server.listen(PORT, "0.0.0.0", () => {
    console.info(`Listening on\n\thttp://localhost:${PORT}\n\thttp://${IP}:${PORT}`);
});
