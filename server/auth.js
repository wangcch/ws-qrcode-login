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

function genSessionToken(username) {
    if (username) {
        const token = jwt.sign({ username }, SESSION_SECRET, { expiresIn: SESSION_MAX_AGE });
        return token;
    }
    return null;
}

function updateSessionToken(username) {
    if (username && userCache.get(username)) {
        const token = genSessionToken(username);

        const user = userCache.get(username);
        userCache.set(username, { ...user, token });
        tokenCache.push(token);

        return token;
    }

    return null;
}

const authMiddleware = (req, res, next) => {
    const token = req.session.userToken || req.headers["authorization"];
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
            return res.status(401).json({ msg: "Token expired" });
        }
    }

    return res.status(401).json({ msg: "Access denied" });
};

const authRouter = express.Router();

authRouter.use(express.json());
authRouter.use((req, res, next) => {
    const host = req.headers.host;
    // [dev] dynamic origin
    const origin = new RegExp(`^${IP}`).test(host) ? req.headers.origin : "*";

    return cors({
        origin,
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        preflightContinue: false,
        credentials: true,
    })(req, res, next);
});

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

        const token = genSessionToken(username);
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
    const token = req.session.userToken || req.headers["authorization"];

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
    updateSessionToken,
};
