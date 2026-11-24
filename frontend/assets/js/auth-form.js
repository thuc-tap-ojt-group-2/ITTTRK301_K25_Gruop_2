/**
 * ====================================================================
 * THƯ VIỆN PTIT - XỬ LÝ FORM ĐĂNG NHẬP & ĐĂNG KÝ
 * auth-form.js: Xử lý sự kiện đăng nhập, đăng ký tài khoản độc giả,
 *               hiển thị thông báo lỗi/thành công và điều hướng vai trò.
 * ====================================================================
 */

const HOME_BY_ROLE = {
    ADMIN: "dashboard.html",
    LIBRARIAN: "dashboard.html",
    READER: "index.html"
};
const DEFAULT_HOME = "index.html";

const authMessage = document.getElementById("authMessage");
const submitButton = document.getElementById("submitButton");

function showMessage(text, type) {
    if (!authMessage) return;
    authMessage.textContent = text;
    authMessage.className = "message " + type;
    authMessage.hidden = false;
    if (typeof PTIT !== "undefined" && PTIT.showToast) {
        PTIT.showToast(text, type === "error" ? "error" : "success");
    }
}

function setBusy(isBusy) {
    if (!submitButton) return;
    submitButton.disabled = isBusy;
    submitButton.classList.toggle("is-loading", isBusy);
}

function failed(error) {
    if (typeof PTIT !== "undefined" && PTIT.hideLoading) {
        PTIT.hideLoading();
    }
    setBusy(false);
    document.dispatchEvent(new CustomEvent("ptit:login-error"));

    if (!(error instanceof TypeError)) {
        showMessage(error.message, "error");
        return;
    }

    showMessage(
        "Không gọi được API tại " + (typeof API_BASE_URL !== "undefined" ? API_BASE_URL : "máy chủ") +
        ". Kiểm tra backend đang chạy ở cổng 8000 và MySQL đã bật.",
        "error"
    );
}

// Đọc phần dữ liệu (id, vai trò...) nằm giữa token JWT
function readTokenData(token) {
    const parts = String(token).split(".");

    if (parts.length !== 3) {
        return {};
    }

    try {
        const base64 = parts[1]
            .replace(/-/g, "+")
            .replace(/_/g, "/")
            .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");
        const bytes = Uint8Array.from(atob(base64), character => character.charCodeAt(0));
        return JSON.parse(new TextDecoder().decode(bytes));
    } catch {
        return {};
    }
}

// Số liệu thật từ Backend cho khối "stats" bên trái
if (typeof PTIT !== "undefined") {
    if (typeof PTIT.addScene === "function") PTIT.addScene(document.body);
    if (typeof PTIT.loadStats === "function" && typeof PTIT.fillStats === "function") {
        PTIT.loadStats(PTIT.fillStats);
    }
}

/* ---------- Đăng nhập ---------- */
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    const query = window.location.search;

    if (query.includes("registered=1")) {
        showMessage("Đăng ký thành công. Hãy đăng nhập để bắt đầu.", "success");
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
        if (typeof PTIT !== "undefined" && PTIT.showLoading) {
            PTIT.showLoading("Đang xác thực thông tin...");
        }

        apiRequest("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ username: username, password: password })
        })
            .then(function (data) {
                const info = readTokenData(data.access_token);
                const role = String(info.role || data.role || "").toUpperCase();

                const user = {
                    id: info.user_id || info.id || null,
                    username: info.username || username,
                    full_name: info.full_name || "",
                    fullName: info.full_name || "",
                    studentId: info.username || username,
                    email: info.email || username,
                    role: role
                };

                localStorage.setItem("access_token", data.access_token);
                localStorage.setItem("token", data.access_token);
                localStorage.setItem("ptit_token", data.access_token);
                localStorage.setItem("user", JSON.stringify(user));
                localStorage.setItem("ptit_user", JSON.stringify(user));

                document.dispatchEvent(new CustomEvent("ptit:login-success", {
                    detail: { name: user.full_name || user.fullName || user.username || "" }
                }));


                if (typeof PTIT !== "undefined" && PTIT.showLoading) {
                    PTIT.showLoading("Đăng nhập thành công, đang chuyển trang...");
                }

                setTimeout(function () {
                    const params = new URLSearchParams(window.location.search);
                    const returnPage = params.get('return');
                    const bookId = params.get('book');
                    if (returnPage === 'index.html' && bookId) {
                        window.location.href = 'index.html?openBook=' + encodeURIComponent(bookId);
                    } else {
                        window.location.href = HOME_BY_ROLE[role] || DEFAULT_HOME;
                    }
                }, 180);
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
            if (typeof PTIT !== "undefined" && PTIT.showLoading) {
                PTIT.showLoading("Đang tạo tài khoản độc giả...");
            }

            apiRequest("/api/auth/register", {
                method: "POST",
                body: JSON.stringify({ username: username, email: email, password: password, full_name: fullName })
            })
                .then(function () {
                    if (typeof PTIT !== "undefined" && PTIT.showLoading) {
                        PTIT.showLoading("Tạo tài khoản thành công!");
                    }

                    setTimeout(function () {
                        window.location.href = "login.html?registered=1";
                    }, 250);
                })
                .catch(failed);
        }
    });
}
