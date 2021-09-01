const msgEl = document.getElementById("message");
const userInfoEl = document.getElementById("user-info");
const loginBtnEl = document.getElementById("login-btn");
const logoutBtnEl = document.getElementById("logout-btn");

function setLoginBtnLoading(msg = "......") {
    const attr = document.createAttribute("disabled");
    loginBtnEl.attributes.setNamedItem(attr);
    loginBtnEl.textContent = msg;
}
function setLoginBtnReset() {
    if (loginBtnEl.attributes.getNamedItem("disabled")) {
        loginBtnEl.attributes.removeNamedItem("disabled");
    }
    loginBtnEl.textContent = "Login";
}

function linkWS(username) {
    const qs = Qs;
    const params = qs.parse(window.location.search, { ignoreQueryPrefix: true });

    if (params && typeof params === "object" && params.t) {
        const ws = new WebSocket(`ws://${location.hostname}:8001`);

        ws.onmessage = function (event) {
            const data = JSON.parse(event.data);
            if (data) {
                if (data.code === 0) {
                    switch (data.data.step) {
                        case 1:
                            loginBtnEl.className = "";
                            msgEl.textContent = data.msg;
                            break;
                        case 2:
                            loginBtnEl.className = "none";
                            msgEl.textContent = data.msg;
                            ws.close();
                            break;
                    }
                } else {
                    loginBtnEl.className = "none";
                    msgEl.textContent = data.msg;
                    setLoginBtnReset();
                    ws.close();
                }
            }
        };

        ws.onopen = function () {
            ws.send(JSON.stringify({ type: "client", step: 0, token: params.t }));
        };

        loginBtnEl.onclick = function () {
            if (ws.readyState === 1) {
                setLoginBtnLoading();
                console.info("login...");

                ws.send(JSON.stringify({ type: "client", step: 1, username }));
            }
        };
    } else {
        msgEl.textContent = "Unable to verify";
    }
}

function init() {
    fetch(`http://${location.hostname}:8001/user`, { credentials: "include" })
        .then((res) => res.json())
        .then((res) => {
            if (res.code === 0) {
                const username = res.data.username;
                userInfoEl.textContent = username;

                linkWS(username);
            } else {
                window.location.pathname = `/login`;
            }
        })
        .catch((rea) => {
            console.error("[user] err: %o", rea);
            window.location.pathname = `/login`;
        });

    logoutBtnEl.onclick = function () {
        fetch(`http://${location.hostname}:8001/logout`, { method: "POST", credentials: "include" })
            .then((res) => {
                if (res.status === 200) {
                    window.location.pathname = `/login`;
                }
            })
            .catch((rea) => {
                console.error("[logout] err: %o", rea);
            });
    };
}

init();
