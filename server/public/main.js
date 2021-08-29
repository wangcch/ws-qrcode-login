const disconnectEl = document.getElementById("disconnect");
const reconnectEl = document.getElementById("reconnect");

function init() {
    const messageEl = document.getElementById("message");
    const userInfoEl = document.getElementById("userInfo");
    const qrcodeEl = document.getElementById("canvas");
    const ws = new WebSocket(`ws://${location.host}`);

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
            userInfoEl.textContent = `username: ${data.data.username}`;

            const ctx = qrcodeEl.getContext("2d");
            ctx.clearRect(0, 0, qrcodeEl.width, qrcodeEl.height);
            ws.close();
            // requestUser();
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
