const express = require("express");
const session = require("express-session");
const cors = require("cors");
const uuidV4 = require("uuid").v4;
const jwt = require("jsonwebtoken");

const IP = require("../utils/ip")();

const SESSION_SECRET = "WS-QRCODE";
const SESSION_MAX_AGE = 60 * 60 * 1000;

const sessionRequestHandler = session({
    genid: () => uuidV4(),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: SESSION_MAX_AGE },
});

// TODO
const userCache = new Map();
// TODO Auto destruction
let tokenCache = [];

const authMiddleware = (req, res, next) => {
    const token = req.session.userToken || req.headers["Authorization"];
    const isCached = !!tokenCache.find((t) => t === token);

    if (token && isCached) {
        try {
            const decoded = jwt.verify(token, SESSION_SECRET);
            if (decoded.username) {
                req.session.username = decoded.username;
                return next();
            }
        } catch (e) {
            console.error("[authMiddleware] catch: %o", e);
        }
    }

    return res.sendStatus(401);
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
    if (req.session.username) {
        return res.json({ code: 0, data: { username: req.session.username } });
    }
    return res.sendStatus(404);
});
authRouter.post("/login", (req, res) => {
    const body = req.body;

    if (body && body.username && body.password) {
        const { username, password } = body;
        const user = userCache.get(username);

        const token = jwt.sign({ username }, SESSION_SECRET, { expiresIn: SESSION_MAX_AGE });
        if (user) {
            // TODO Password
            if (user.password === body.password) {
                userCache.set(username, { ...user, token });
            } else {
                return res.status(400).send("Password error");
            }
        } else {
            userCache.set(username, { username, password, token });
        }

        req.session.userToken = token;
        tokenCache.push(token);

        return res.json({ code: 0, data: { username, token }, msg: "Login successful" });
    } else {
        return res.sendStatus(400);
    }
});
authRouter.post("/logout", (req, res) => {
    const token = req.session.userToken || req.headers["Authorization"];

    if (token) {
        req.session && req.session.destroy();
        tokenCache = tokenCache.filter((i) => i !== token);
        return res.send("ok");
    }

    return res.sendStatus(401);
});

module.exports = {
    sessionRequestHandler,
    authMiddleware,
    authRouter,
};
