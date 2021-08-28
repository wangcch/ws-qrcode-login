const msgEl = document.getElementById("message");
const loginBtnEl = document.getElementById("login-btn");

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

function init() {
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

                // TODO userId
                ws.send(JSON.stringify({ type: "client", step: 1, userId: new Date().valueOf() }));
            }
        };
    } else {
        msgEl.textContent = "Unable to verify";
    }
}

init();
