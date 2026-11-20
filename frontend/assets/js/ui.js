/**
 * ====================================================================
 * THƯ VIỆN PTIT - UI UTILITIES
 * ui.js: Navbar mobile, Toast thông báo, Modal helper, Loading toàn trang,
 *        Đăng xuất, Hiển thị số liệu tự nhảy, Toggle ẩn/hiện mật khẩu
 * ====================================================================
 */

const PTIT = window.PTIT || {};
PTIT.reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ====================================================================
 * 1. LOADING TOÀN TRÀNG (FULL-SCREEN LOADING OVERLAY)
 * ==================================================================== */
PTIT.showLoading = function (text) {
    let box = document.getElementById("ptitLoading");

    if (box === null) {
        box = document.createElement("div");
        box.id = "ptitLoading";
        box.className = "ptit-loading";
        box.innerHTML = `
            <div class="ptit-book">
                <i style="--n:0"></i>
                <i style="--n:1"></i>
                <i style="--n:2"></i>
            </div>
            <p></p>
        `;
        document.body.appendChild(box);
    }

    const textEl = box.querySelector("p");
    if (textEl) {
        textEl.textContent = text || "Đang xử lý...";
    }
    box.classList.add("show");
};

PTIT.hideLoading = function () {
    const box = document.getElementById("ptitLoading");
    if (box !== null) {
        box.classList.remove("show");
    }
};

/* ====================================================================
 * 2. HỆ THỐNG TOAST THÔNG BÁO (TOAST NOTIFICATIONS)
 * ==================================================================== */
PTIT.showToast = function (message, type = "info", duration = 3500) {
    let container = document.getElementById("ptitToastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "ptitToastContainer";
        container.className = "ptit-toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `ptit-toast ptit-toast--${type}`;
    
    // Biểu tượng SVG cho từng loại
    let icon = "ℹ";
    if (type === "success") icon = "✓";
    if (type === "error") icon = "✕";
    if (type === "warning") icon = "⚠";

    toast.innerHTML = `<span style="font-weight:800;font-size:16px;">${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(20px)";
        toast.style.transition = "all 0.3s ease";
        setTimeout(() => toast.remove(), 300);
    }, duration);
};

/* ====================================================================
 * 3. HỘP THOẠI & MODAL HELPERS
 * ==================================================================== */
PTIT.openModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    if (typeof modal.showModal === "function") {
        modal.showModal();
    } else {
        modal.classList.add("show");
        modal.hidden = false;
    }
};

PTIT.closeModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    if (typeof modal.close === "function") {
        modal.close();
    } else {
        modal.classList.remove("show");
        modal.hidden = true;
    }
};

/* ====================================================================
 * 4. ĐĂNG NHẬP, ĐĂNG XUẤT TIỆN LỢI
 * ==================================================================== */
PTIT.isLoggedIn = function () {
    return Boolean(localStorage.getItem("access_token") || localStorage.getItem("token"));
};

PTIT.logout = function () {
    PTIT.showLoading("Đang đăng xuất...");

    const finish = function () {
        localStorage.removeItem("access_token");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("ptit_token");
        localStorage.removeItem("ptit_user");
        sessionStorage.clear();
        window.location.replace("index.html");
    };

    if (typeof logoutAPI === "function" && PTIT.isLoggedIn()) {
        logoutAPI()
            .catch(function (error) {
                console.error("Không thể thu hồi token đăng xuất:", error);
            })
            .finally(finish);
    } else {
        finish();
    }
};

/* ====================================================================
 * 5. HIỆU ỨNG SỐ TỰ NHẢY (COUNT-UP)
 * ==================================================================== */
PTIT.countUp = function (element, target) {
    if (!element) return;
    const endValue = Number(target) || 0;
    if (PTIT.reduceMotion) {
        element.textContent = endValue.toLocaleString("vi-VN");
        return;
    }

    const startTime = performance.now();
    const duration = 1400;

    function step(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const current = Math.round(endValue * (1 - Math.pow(1 - progress, 3)));
        element.textContent = current.toLocaleString("vi-VN");

        if (progress < 1) {
            requestAnimationFrame(step);
        }
    }

    requestAnimationFrame(step);
};

/* Lấy số liệu thật từ Backend (GET /api/books) */
PTIT.loadStats = function (done) {
    if (typeof getBooks !== "function") {
        if (typeof done === "function") done(null);
        return;
    }

    getBooks(1, 100)
        .then(function (response) {
            let list = response.content || response.items || response;
            if (!Array.isArray(list)) list = [];

            let copies = 0;
            const categories = {};

            for (let i = 0; i < list.length; i++) {
                copies += Number(list[i].totalCopies || list[i].total_copies || 0);
                const name = list[i].categoryName || list[i].category_name;
                if (name) categories[name] = true;
            }

            if (typeof done === "function") {
                done({
                    titles: response.totalElements || response.total || list.length,
                    copies: copies,
                    categories: Object.keys(categories).length,
                    books: list
                });
            }
        })
        .catch(function () {
            if (typeof done === "function") done(null);
        });
};

/* Điền số vào các phần tử có data-stat */
PTIT.fillStats = function (stats) {
    const items = document.querySelectorAll("[data-stat]");
    for (let i = 0; i < items.length; i++) {
        const statKey = items[i].dataset.stat;
        PTIT.countUp(items[i], stats ? stats[statKey] : 0);
    }
};

/* Cảnh nền sách nổi và dòng chảy cho trang auth */
PTIT.addScene = function (parent) {
    if (!parent) return;
    const colors = ["#C8913A", "#1F528D", "#0F5C42", "#C8913A", "#1E8E5A", "#1F528D"];
    const spots = [[5, 58], [14, 20], [30, 74], [48, 8], [62, 80], [78, 12], [90, 46], [3, 86]];
    let html = `
        <svg class="stream" viewBox="0 0 1200 800" preserveAspectRatio="none">
            <path d="M-50 600 C200 480 400 720 650 600 S1050 480 1250 580" fill="none" stroke="rgba(15,92,66,0.06)" stroke-width="2"/>
            <path d="M-50 660 C250 560 450 780 700 660 S1100 560 1250 640" fill="none" stroke="rgba(200,145,58,0.08)" stroke-width="2"/>
        </svg>
    `;

    for (let i = 0; i < spots.length; i++) {
        html += `<i class="book" style="--x:${spots[i][0]}%;--y:${spots[i][1]}%;--w:${38 + (i % 3) * 7}px;--h:${56 + (i % 4) * 5}px;--c:${colors[i % colors.length]};--r:${i % 2 ? 8 : -8}deg;--d:-${1 + i * 0.7}s"></i>`;
    }

    const scene = document.createElement("div");
    scene.className = "scene";
    scene.setAttribute("aria-hidden", "true");
    scene.innerHTML = html;
    parent.insertBefore(scene, parent.firstChild);
};

/* Chuyển trang mượt mà */
PTIT.bindLinks = function () {
    const links = document.querySelectorAll("a[data-go]");
    for (let i = 0; i < links.length; i++) {
        links[i].addEventListener("click", function (event) {
            if (PTIT.reduceMotion) return;
            event.preventDefault();
            const direction = this.dataset.go;
            const target = this.href;
            document.body.classList.add("leave-" + direction);
            sessionStorage.setItem("slide", direction);
            setTimeout(function () {
                window.location.href = target;
            }, 300);
        });
    }
};

/* ====================================================================
 * 6. TỰ ĐỘNG KHỞI TẠO MENU MOBILE, SIDEBAR MOBILE & TOGGLE MẬT KHẨU
 * ==================================================================== */
PTIT.initMobileNav = function () {
    const menuToggle = document.querySelector(".hamburger") || document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");

    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", function () {
            const isExpanded = navLinks.classList.toggle("show");
            menuToggle.setAttribute("aria-expanded", isExpanded);
        });

        // Đóng khi click vào link
        navLinks.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                navLinks.classList.remove("show");
                menuToggle.setAttribute("aria-expanded", "false");
            });
        });
    }
};

PTIT.initMobileSidebar = function () {
    const sidebarToggle = document.getElementById("sidebarToggle") || document.getElementById("menuToggle");
    const sidebar = document.querySelector(".sidebar") || document.querySelector("aside");

    if (sidebarToggle && sidebar) {
        let backdrop = document.getElementById("sidebarBackdrop");
        if (!backdrop) {
            backdrop = document.createElement("div");
            backdrop.id = "sidebarBackdrop";
            backdrop.className = "sidebar-backdrop";
            backdrop.hidden = true;
            document.body.appendChild(backdrop);
        }

        sidebarToggle.addEventListener("click", function () {
            const isOpen = sidebar.classList.toggle("open");
            backdrop.hidden = !isOpen;
        });

        backdrop.addEventListener("click", function () {
            sidebar.classList.remove("open");
            backdrop.hidden = true;
        });
    }
};

PTIT.initPasswordToggles = function () {
    document.querySelectorAll("input[type='password']").forEach(input => {
        // Nếu đã có nút toggle rồi thì bỏ qua
        if (input.parentNode.querySelector(".password-toggle")) return;

        // Bọc vào password-wrap nếu chưa có
        let wrap = input.parentElement;
        if (!wrap.classList.contains("password-wrap")) {
            wrap = document.createElement("div");
            wrap.className = "password-wrap";
            input.parentNode.insertBefore(wrap, input);
            wrap.appendChild(input);
        }

        const toggleBtn = document.createElement("button");
        toggleBtn.type = "button";
        toggleBtn.className = "password-toggle";
        toggleBtn.setAttribute("aria-label", "Hiện/Ẩn mật khẩu");
        toggleBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            </svg>
        `;

        toggleBtn.addEventListener("click", function () {
            const isPassword = input.type === "password";
            input.type = isPassword ? "text" : "password";
            toggleBtn.style.color = isPassword ? "var(--color-primary)" : "var(--color-text-subtle)";
        });

        wrap.appendChild(toggleBtn);
    });
};

// Đóng modal khi bấm phím Escape
document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
        document.querySelectorAll(".overlay.show, .overlay:not([hidden])").forEach(el => {
            el.classList.remove("show");
            el.hidden = true;
        });
        document.querySelectorAll("dialog[open]").forEach(dialog => {
            dialog.close();
        });
        const sidebar = document.querySelector(".sidebar.open, aside.open");
        if (sidebar) {
            sidebar.classList.remove("open");
            const backdrop = document.getElementById("sidebarBackdrop");
            if (backdrop) backdrop.hidden = true;
        }
    }
});

// Chạy tự động sau khi DOM tải xong
document.addEventListener("DOMContentLoaded", function () {
    PTIT.bindLinks();
    PTIT.initMobileNav();
    PTIT.initMobileSidebar();
    PTIT.initPasswordToggles();
});

window.PTIT = PTIT;
