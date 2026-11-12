// Tiện ích dùng chung cho mọi trang: loading, đăng xuất, số tự nhảy, cảnh nền, chuyển trang
const PTIT = {};
PTIT.reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Loading toàn màn hình ---------- */
PTIT.showLoading = function (text) {
    let box = document.getElementById("ptitLoading");

    if (box === null) {
        box = document.createElement("div");
        box.id = "ptitLoading";
        box.className = "ptit-loading";
        box.innerHTML = '<div class="ptit-book"><i style="--n:0"></i><i style="--n:1"></i><i style="--n:2"></i></div><p></p>';
        document.body.appendChild(box);
    }

    box.querySelector("p").textContent = text || "Đang xử lý...";
    box.classList.add("show");
};

PTIT.hideLoading = function () {
    const box = document.getElementById("ptitLoading");

    if (box !== null) {
        box.classList.remove("show");
    }
};

/* ---------- Đăng nhập, đăng xuất ---------- */
PTIT.isLoggedIn = function () {
    return Boolean(localStorage.getItem("access_token") || localStorage.getItem("token"));
};

PTIT.logout = function () {
    PTIT.showLoading("Đang đăng xuất...");

    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.clear();

    setTimeout(function () {
        window.location.replace("index.html");
    }, 1100);
};

/* ---------- Số tự nhảy từ 0 lên ---------- */
PTIT.countUp = function (element, target) {
    if (PTIT.reduceMotion) {
        element.textContent = target;
        return;
    }

    const startTime = performance.now();

    function step(now) {
        const progress = Math.min((now - startTime) / 1600, 1);
        element.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3)));

        if (progress < 1) {
            requestAnimationFrame(step);
        }
    }

    requestAnimationFrame(step);
};

// Lấy số liệu thật từ Backend (GET /api/books); done(null) nếu Backend chưa chạy
PTIT.loadStats = function (done) {
    getBooks(1, 100)
        .then(function (response) {
            let list = response.content || response.items || response;

            if (!Array.isArray(list)) {
                list = [];
            }

            let copies = 0;
            const categories = {};

            for (let i = 0; i < list.length; i++) {
                copies += Number(list[i].totalCopies || list[i].total_copies || 0);

                const name = list[i].categoryName || list[i].category_name;

                if (name) {
                    categories[name] = true;
                }
            }

            done({
                titles: response.totalElements || response.total || list.length,
                copies: copies,
                categories: Object.keys(categories).length,
                books: list
            });
        })
        .catch(function () {
            done(null);
        });
};

// Điền số vào các phần tử có data-stat="titles | copies | categories"
PTIT.fillStats = function (stats) {
    const items = document.querySelectorAll("[data-stat]");

    for (let i = 0; i < items.length; i++) {
        PTIT.countUp(items[i], stats ? stats[items[i].dataset.stat] : 0);
    }
};

/* ---------- Cảnh nền sách nổi và dòng chảy ---------- */
PTIT.addScene = function (parent) {
    const colors = ["#e8a923", "#17679a", "#0f6b4a", "#e8a923", "#2f9e6d", "#17679a", "#e8a923", "#2f9e6d"];
    const spots = [[5, 58], [14, 20], [30, 74], [48, 8], [62, 80], [78, 12], [90, 46], [3, 86]];
    let html = '<svg class="stream" viewBox="0 0 1200 800" preserveAspectRatio="none">' +
        '<path d="M-50 600 C200 480 400 720 650 600 S1050 480 1250 580"/>' +
        '<path d="M-50 660 C250 560 450 780 700 660 S1100 560 1250 640"/>' +
        '<path d="M-50 540 C150 420 450 660 700 540 S1000 420 1250 520"/></svg>';

    for (let i = 0; i < spots.length; i++) {
        html += '<i class="book" style="--x:' + spots[i][0] + '%;--y:' + spots[i][1] + '%;--w:' + (38 + (i % 3) * 7) + 'px;--h:' + (56 + (i % 4) * 5) + 'px;--c:' + colors[i] +
            ';--r:' + (i % 2 ? 9 : -9) + 'deg;--d:-' + (1 + i * 0.7) + 's"></i>';
    }

    const scene = document.createElement("div");
    scene.className = "scene";
    scene.setAttribute("aria-hidden", "true");
    scene.innerHTML = html;
    parent.insertBefore(scene, parent.firstChild);
};

/* ---------- Chuyển trang: liên kết có data-go="forward" hoặc "back" ---------- */
const slideDirection = sessionStorage.getItem("slide");

if (slideDirection && !PTIT.reduceMotion) {
    document.body.classList.add("enter-" + slideDirection);
}

sessionStorage.removeItem("slide");

PTIT.bindLinks = function () {
    const links = document.querySelectorAll("a[data-go]");

    for (let i = 0; i < links.length; i++) {
        links[i].addEventListener("click", function (event) {
            if (PTIT.reduceMotion) {
                return;
            }

            event.preventDefault();

            const direction = this.dataset.go;
            const target = this.href;

            document.body.classList.add("leave-" + direction);
            sessionStorage.setItem("slide", direction);

            setTimeout(function () {
                window.location.href = target;
            }, 350);
        });
    }
};

PTIT.bindLinks();
