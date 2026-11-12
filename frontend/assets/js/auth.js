// Đăng nhập, đăng ký: gọi Backend qua apiRequest (app.js)

// Trang mở ra sau khi đăng nhập, theo vai trò (đổi READER khi trang độc giả làm xong)
const HOME_BY_ROLE = { ADMIN: "books.html", LIBRARIAN: "books.html", READER: "books.html" };
const DEFAULT_HOME = "books.html";

const authMessage = document.getElementById("authMessage");
const submitButton = document.getElementById("submitButton");

function showMessage(text, type) {
    authMessage.textContent = text;
    authMessage.className = "message " + type;
    authMessage.hidden = false;
}

function setBusy(isBusy) {
    submitButton.disabled = isBusy;
    submitButton.classList.toggle("is-loading", isBusy);
}

function failed(error) {
    PTIT.hideLoading();
    setBusy(false);

    if (!(error instanceof TypeError)) {
        showMessage(error.message, "error");
        return;
    }

    showMessage(
        "Không gọi được API tại " + API_BASE_URL +
        ". Kiểm tra backend đang chạy ở cổng 8000 và MySQL đã bật. " +
        "Nếu backend đã chạy, hãy kiểm tra lỗi CORS trong Console và cấu hình FRONTEND_ORIGINS trong backend/.env.",
        "error"
    );
}

// Đọc phần dữ liệu (id, vai trò...) nằm giữa token JWT
function readTokenData(token) {
    const parts = String(token).split(".");

    if (parts.length !== 3) {
        return {};
    }

    return JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
}

// Số liệu thật từ Backend cho khối "stats" bên trái
PTIT.addScene(document.body);
PTIT.loadStats(PTIT.fillStats);


/* ---------- Đăng nhập ---------- */
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    const query = window.location.search;

    if (query.includes("registered=1")) {
        showMessage("Đăng ký thành công. Hãy đăng nhập.", "success");
    }

    if (query.includes("expired=1")) {
        showMessage("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.", "error");
    }

    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;

        if (username === "" || password === "") {
            showMessage("Vui lòng nhập tên đăng nhập và mật khẩu.", "error");
            return;
        }

        setBusy(true);
        PTIT.showLoading("Đang đăng nhập...");

        apiRequest("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ username: username, password: password })
        })
            .then(function (data) {
                const info = readTokenData(data.access_token);
                const role = info.role || "";

                localStorage.setItem("access_token", data.access_token);
                localStorage.setItem("user", JSON.stringify({
                    id: info.user_id || info.id || null,
                    username: username,
                    role: role
                }));

                PTIT.showLoading("Đăng nhập thành công, đang chuyển trang...");

                setTimeout(function () {
                    window.location.href = HOME_BY_ROLE[role] || DEFAULT_HOME;
                }, 900);
            })
            .catch(failed);
    });
}


/* ---------- Đăng ký (mã sinh viên dùng làm tên đăng nhập) ---------- */
const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const fullName = document.getElementById("fullName").value.trim();
        const username = document.getElementById("username").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (fullName === "") {
            showMessage("Vui lòng nhập họ và tên.", "error");
        } else if (username.length < 3 || username.length > 50) {
            showMessage("Mã sinh viên (tên đăng nhập) phải từ 3 đến 50 ký tự.", "error");
        } else if (!/^\S+@\S+\.\S+$/.test(email)) {
            showMessage("Email không hợp lệ.", "error");
        } else if (password.length < 6) {
            showMessage("Mật khẩu phải có ít nhất 6 ký tự.", "error");
        } else if (password !== confirmPassword) {
            showMessage("Hai mật khẩu không giống nhau.", "error");
        } else {
            setBusy(true);
            PTIT.showLoading("Đang tạo tài khoản...");

            apiRequest("/api/auth/register", {
                method: "POST",
                body: JSON.stringify({ username: username, email: email, password: password, full_name: fullName })
            })
                .then(function () {
                    PTIT.showLoading("Tạo tài khoản thành công!");

                    setTimeout(function () {
                        window.location.href = "login.html?registered=1";
                    }, 1000);
                })
                .catch(failed);
        }
    });
}
