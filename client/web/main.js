const userInfoEl = document.getElementById("user-info");
const userStatusEl = document.getElementById("user-status");
const userMsgEl = document.getElementById("user-msg");

const loginEl = document.getElementById("login-container");
const logoutBtnEl = document.getElementById("logout-btn");

const reconnectEl = document.getElementById("reconnect");

const TOKEN_KEY = "SESSION_TOKEN";

function setUserState(logged) {
    if (logged) {
        loginEl.className = "none";
        logoutBtnEl.className = "";
    } else {
        loginEl.className = "";
        logoutBtnEl.className = "none";
        userInfoEl.textContent = "null";
    }
}

function fetchUser() {
    return new Promise((resolve, reject) => {
        fetch(`http://${location.hostname}:8001/user`, {
            headers: {
                Authorization: localStorage.getItem(TOKEN_KEY),
            },
        })
            .then((res) => {
                userStatusEl.textContent = res.status;
                userMsgEl.textContent = res.statusText;

                return res.json();
            })
            .then((res) => {
                if (res.msg) {
                    userMsgEl.textContent = res.msg;
                }

                if (res.code === 0) {
                    const { username } = res.data;
                    userInfoEl.textContent = username;
                    setUserState(true);

                    resolve({ username });
                } else {
                    setUserState(false);

                    reject(res);
                }
            })
            .catch((rea) => {
                console.error("[user] err: %o", rea);

                setUserState(false);

                if (rea.msg) {
                    userMsgEl.textContent = rea.msg;
                }

                reject(rea);
            });
    });
}

function linkWS() {
    const disconnectEl = document.getElementById("disconnect");
    const messageEl = document.getElementById("message");
    const qrcodeEl = document.getElementById("qr-canvas");
    const ws = new WebSocket(`ws://${location.hostname}:8001`);

    ws.onmessage = function (event) {
        const data = JSON.parse(event.data);
        messageEl.textContent = data.msg;

        const step = data.data && data.data.step;

        if (step === 0) {
            const anchor = document.createElement("a");
            anchor.href = data.data.url;
            anchor.setAttribute("target", "_blank");
            anchor.setAttribute("rel", "noopener noreferrer");
            anchor.textContent = "link";
            anchor.style = "margin-left: 8px;";
            messageEl.appendChild(anchor);

            QRCode.toCanvas(qrcodeEl, data.data.url, function (error) {
                if (error) console.error(error);
                console.log("QR code generated successfully");
            });
        } else if (step === 2) {
            const { username, token } = data.data;
            localStorage.setItem(TOKEN_KEY, token);

            const ctx = qrcodeEl.getContext("2d");
            ctx.clearRect(0, 0, qrcodeEl.width, qrcodeEl.height);
            ws.close();

            fetchUser();
        }
    };

    ws.onopen = function () {
        ws.send(JSON.stringify({ type: "server", code: 0, step: 0 }));
    };

    ws.onclose = function () {
        messageEl.textContent = "disconnect";
    };

    disconnectEl.onclick = function () {
        ws.close();
    };
}

logoutBtnEl.onclick = function () {
    fetch(`http://${location.hostname}:8001/logout`, {
        method: "POST",
        headers: {
            Authorization: localStorage.getItem(TOKEN_KEY),
        },
    })
        .then((res) => {
            console.info("Logout.", res);
            init();
        })
        .catch((e) => {
            console.error("Logout error.", e);
        });
};

reconnectEl.onclick = function () {
    linkWS();
};

function init() {
    fetchUser()
        .then((res) => {
            console.info(res);
            // ignore
        })
        .catch((rea) => {
            linkWS();
        });
}

init();
