"use strict";

const express = require("express");
const path = require("path");
const { createServer } = require("http");
const { networkInterfaces } = require("os");

const WebSocket = require("ws");

const app = express();
app.use(express.static(path.join(__dirname, "/public")));

const PORT = 8001;
const IP = Object.values(networkInterfaces())
    .flat()
    .find((i) => i.family == "IPv4" && !i.internal).address;

const server = createServer(app);
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws, socket) => {
    console.log("started client", socket.headers["sec-websocket-key"]);

    ws.on("message", (data, isBinary) => {
        const body = Buffer.isBuffer(data) ? JSON.parse(data.toString("utf-8")) : data;

        wss.clients.forEach((client) => {
            // Send to myself
            if (client === ws && client.readyState === WebSocket.OPEN) {
                const type = body && body.type;

                if (type === "client") {
                    setTimeout(() => {
                        client.send(JSON.stringify({ code: 0, data: { step: 1 }, msg: "Ready" }));
                    }, 600);
                } else if (type === "server") {
                    client.send(JSON.stringify({ code: 0, data: { step: 0 }, msg: "Ready" }));
                }
            }
        });
    });

    ws.on("close", function () {
        console.log("stopping client");
    });
});

server.listen(PORT, "0.0.0.0", () => {
    console.info(`Listening on\n\thttp://localhost:${PORT}\n\thttp://${IP}:${PORT}`);
});
