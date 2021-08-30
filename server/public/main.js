const disconnectEl = document.getElementById("disconnect");
const reconnectEl = document.getElementById("reconnect");
const userInfoEl = document.getElementById("user-info");

const TOKEN_KEY = "SESSION_TOKEN";

function fetchUser() {
    fetch(`http://${location.hostname}:8001/user`, {
        headers: {
            Authorization: localStorage.getItem(TOKEN_KEY),
        },
        credentials: "include",
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code === 0) {
                const { username } = res.data;
                userInfoEl.textContent = username;
            } else {
                userInfoEl.textContent = "";
            }
        })
        .catch((rea) => {
            console.error("[user] err: %o", rea);
            userInfoEl.textContent = "";
        });
}

function init() {
    const messageEl = document.getElementById("message");
    const qrcodeEl = document.getElementById("canvas");
    const ws = new WebSocket(`ws://${location.host}`);

    fetchUser();

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
            userInfoEl.textContent = username;

            localStorage.setItem(TOKEN_KEY, token);

            const ctx = qrcodeEl.getContext("2d");
            ctx.clearRect(0, 0, qrcodeEl.width, qrcodeEl.height);
            ws.close();
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

reconnectEl.onclick = function () {
    init();
};

init();
