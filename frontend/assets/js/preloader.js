/**
 * ====================================================================
 * THƯ VIỆN PTIT - CINEMATIC PRELOADER CONTROLLER (CHỈ Ở INDEX.HTML)
 * preloader.js: Điều khiển chuỗi hiệu ứng mở đầu "Logo -> Sách -> Cửa mở"
 * Đặt trong <head> không defer để chống nhấp nháy giao diện
 * ====================================================================
 */

// Chống nhấp nháy nội dung (Flash-prevention) ngay khi parse HTML
(function () {
    try {
        if (!sessionStorage.getItem("ptit_intro_seen")) {
            document.documentElement.classList.add("js-preloader-active", "preloader-locked");
        }
    } catch (e) {
        console.warn("SessionStorage không khả dụng:", e);
    }
})();

document.addEventListener("DOMContentLoaded", function () {
    const preloaderEl = document.getElementById("ptitPreloader");
    if (!preloaderEl) return;



    // Kiểm tra xem đã xem phần mở đầu trong phiên duyệt web này chưa
    const forceIntro = new URLSearchParams(window.location.search).get("intro") === "1";
    let alreadySeen = false;
    try {
        alreadySeen = Boolean(sessionStorage.getItem("ptit_intro_seen"));
    } catch (e) {
        alreadySeen = false;
    }

    if (alreadySeen && !forceIntro) {
        // Đã xem: gỡ ngay lập tức khỏi DOM, trả lại cuộn trang
        preloaderEl.remove();
        document.documentElement.classList.remove("js-preloader-active", "preloader-locked");
        document.body.classList.remove("preloader-locked");
        document.body.classList.add("hero-entrance-active");
        return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const skipBtn = document.getElementById("preloaderSkip");
    const bookContainer = document.querySelector(".preloader-book-container");
    const progressFill = document.querySelector(".preloader-progress-fill");
    const words = document.querySelectorAll(".preloader-word");

    let isFinished = false;
    let timerIds = [];

    function addTimeout(fn, delay) {
        const id = setTimeout(fn, delay);
        timerIds.push(id);
        return id;
    }

    function clearAllTimers() {
        timerIds.forEach(id => clearTimeout(id));
        timerIds = [];
    }

    // Kết thúc preloader và dọn dẹp an toàn
    function finishPreloader() {
        if (isFinished) return;
        isFinished = true;
        clearAllTimers();

        try {
            sessionStorage.setItem("ptit_intro_seen", "true");
        } catch (e) {}

        // Kích hoạt hiệu ứng Hero Entrance trên trang chủ
        document.body.classList.add("hero-entrance-active");

        // Mở cửa và mở khóa cuộn trang
        preloaderEl.classList.add("is-opening");
        document.documentElement.classList.remove("preloader-locked");
        document.body.classList.remove("preloader-locked");

        // Sau 800ms khi cửa trượt xong: gỡ hoàn toàn khỏi DOM (B5)
        setTimeout(function () {
            if (preloaderEl && preloaderEl.parentNode) {
                preloaderEl.remove();
            }
            document.documentElement.classList.remove("js-preloader-active");
        }, prefersReducedMotion ? 100 : 800);
    }

    // Nút "Bỏ qua" hoặc phím Esc (B6)
    if (skipBtn) {
        skipBtn.addEventListener("click", finishPreloader);
    }

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" || e.keyCode === 27) {
            finishPreloader();
        }
    }, { once: true });

    // Trường hợp prefers-reduced-motion: chỉ fade logo và rồng 0.5s
    if (prefersReducedMotion) {
        addTimeout(finishPreloader, 500);
        return;
    }

    // ================= CHUỖI HIỆU ỨNG CHUẨN 2,6S - 3,0S =================
    // B1: 0,0 - 0,5s: Logo hiện bằng fade + scale (CSS tự chạy)

    // B2: 0,5 - 1,7s: Cuốn sách xuất hiện, rồng bay vào và đáp tại trung tâm
    addTimeout(function () {
        if (bookContainer) {
            bookContainer.classList.add("is-visible", "is-opened", "is-flipping");
        }
        const dragon = preloaderEl.querySelector(".preloader-dragon");
        if (dragon) {
            dragon.classList.add("is-visible", "is-flying");
        }

        // Chạy thanh tiến trình từ 0% -> 100%
        if (progressFill) {
            progressFill.style.width = "100%";
        }

        // Chữ "Mở cánh cửa tri thức" hiện dần từng từ
        if (words && words.length > 0) {
            words.forEach((word, idx) => {
                addTimeout(function () {
                    word.classList.add("is-visible");
                }, idx * 250);
            });
        }
    }, 500);

    // B3: 1,6 - 2,0s: Logo, sách, chữ mờ dần và nhỏ đi nhẹ
    addTimeout(function () {
        preloaderEl.classList.add("is-fading-stage");
    }, 2200);

    // B4: 2,0 - 2,8s: Hai cánh cửa trượt sang 2 bên
    addTimeout(function () {
        preloaderEl.classList.add("is-opening");
        document.documentElement.classList.remove("preloader-locked");
        document.body.classList.remove("preloader-locked");
        document.body.classList.add("hero-entrance-active");
    }, 2500);

    // B5: Hoàn tất sau 3,3s
    addTimeout(finishPreloader, 3300);

    // Timeout cứng tối đa 3,5s
    addTimeout(finishPreloader, 3500);
});
