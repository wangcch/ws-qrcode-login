"use strict";

const express = require("express");
const { createServer } = require("http");

const WebSocket = require("ws");

const jwt = require("jsonwebtoken");
const uuidV4 = require("uuid").v4;

const auth = require("./auth");

const app = express();

app.use(auth.sessionRequestHandler);
app.use(auth.authRouter);
app.use(auth.authMiddleware);

const PORT = 8001;
const IP = require("../utils/ip")();

// memory cache
const cache = new Map();

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
                    switch (body.step) {
                        case 0:
                            const token = body.token;

                            try {
                                const decoded = jwt.verify(token, "ws-qr-login");
                                if (decoded) {
                                    const itemCache = cache.get(decoded.uuid);
                                    if (itemCache && itemCache.status === 0) {
                                        cache.set(decoded.uuid, { ...itemCache, child: client, status: 1 });
                                        itemCache.parent.send(
                                            JSON.stringify({
                                                code: 0,
                                                data: { step: 1 },
                                                msg: "Scan code successfully",
                                            }),
                                        );
                                        setTimeout(() => {
                                            client.send(JSON.stringify({ code: 0, data: { step: 1 }, msg: "Ready" }));
                                        }, 600);
                                        return;
                                    } else {
                                        cache.set(decoded.uuid, -1);
                                    }
                                }
                                client.send(JSON.stringify({ code: -1, msg: "Expired" }));
                            } catch (e) {
                                client.send(JSON.stringify({ code: -1, msg: "Expired" }));
                            }
                            break;
                        case 1:
                            cache.forEach((v) => {
                                if (v.child === client) {
                                    const token = auth.updateSessionToken(body.username);
                                    v.parent.send(
                                        JSON.stringify({
                                            code: 0,
                                            data: { step: 2, username: body.username, token },
                                            msg: "Already logged in",
                                        }),
                                    );
                                }
                            });
                            client.send(JSON.stringify({ code: 0, data: { step: 2 }, msg: "Login successful" }));
                    }
                } else if (type === "server") {
                    switch (body.step) {
                        case 0:
                            const uuid = uuidV4();
                            const token = jwt.sign({ uuid }, "ws-qr-login", { expiresIn: "1m" });

                            cache.set(uuid, { status: 0, parent: client });

                            client.send(
                                JSON.stringify({
                                    code: 0,
                                    data: { step: 0, url: `http://${IP}:8003?t=${token}` },
                                    msg: "Ready",
                                }),
                            );
                            break;
                    }
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
