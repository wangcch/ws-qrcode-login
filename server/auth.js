const express = require("express");
const session = require("express-session");
const cors = require("cors");
const uuidV4 = require("uuid").v4;

const IP = require("../utils/ip")();

const SESSION_SECRET = "WS-QRCODE";

const sessionRequestHandler = session({
    genid: () => uuidV4(),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 2 * 60 * 1000 },
});

const authMiddleware = (req, res, next) => {
    if (req.session) {
        console.info("[authMiddleware]:", req.session);
        return next();
    } else {
        return res.sendStatus(401);
    }
};

const authRouter = express.Router();

authRouter.use(express.json());
authRouter.use(
    cors({
        origin: `http://${IP}:8002`,
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        preflightContinue: false,
        credentials: true,
    }),
);
authRouter.get("/user", authMiddleware, (req, res) => {
    if (req.session.user) {
        return res.json({ code: 0, data: { username: req.session.user } });
    }
    return res.sendStatus(404);
});
authRouter.post("/login", (req, res) => {
    const body = req.body;

    if (body && body.username && body.password) {
        req.session.user = body.username;
        // ignore
        return res.send("ok");
    } else {
        return res.sendStatus(400);
    }
});
authRouter.get("/logout", (req, res) => {
    req.session.destroy();
    return res.send("ok");
});

module.exports = {
    sessionRequestHandler,
    authMiddleware,
    authRouter,
};
