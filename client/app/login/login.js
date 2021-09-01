const formEl = document.getElementById("login-form");
const msgEl = document.getElementById("message");

function init() {
    formEl.onsubmit = (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);

        fetch(`http://${location.hostname}:8001/login`, {
            method: "POST",
            credentials: "include",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({ username: formData.get("username"), password: formData.get("password") }),
        })
            .then((res) => {
                console.info("[login] res: %o", res);
                if (res.status === 200) {
                    window.location.pathname = "/";
                } else {
                    msgEl.textContent = "Login failed";
                }
            })
            .catch((rea) => {
                console.error("[login] error: %o", rea);
                msgEl.textContent = "Login failed";
            });
    };
}

init();
