/**
 * ====================================================================
 * THƯ VIỆN PTIT - PAGE TRANSITIONS CONTROLLER
 * page-transition.js: Hiệu ứng fade chuyển trang mượt mà giữa các trang nội bộ
 * Tôn trọng hoàn toàn tùy chọn giảm chuyển động (prefers-reduced-motion)
 * ====================================================================
 */

(function () {
    "use strict";

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Đảm bảo có overlay trong DOM
    function ensureOverlay() {
        if (!document.querySelector(".page-transition-overlay")) {
            const overlay = document.createElement("div");
            overlay.className = "page-transition-overlay";
            overlay.setAttribute("aria-hidden", "true");
            document.body.appendChild(overlay);
        }
    }

    function initPageTransitions() {
        ensureOverlay();

        // Xử lý khi trang được khôi phục từ BFCache (Back/Forward Cache)
        window.addEventListener("pageshow", function (event) {
            document.body.classList.remove("page-is-leaving");
        });

        if (prefersReducedMotion) return;

        document.addEventListener("click", function (event) {
            const link = event.target.closest("a");
            if (!link) return;

            const href = link.getAttribute("href");
            if (!href) return;

            // Bỏ qua các liên kết đặc biệt
            if (
                href.startsWith("#") ||
                href.startsWith("javascript:") ||
                href.startsWith("mailto:") ||
                href.startsWith("tel:") ||
                link.getAttribute("target") === "_blank" ||
                link.hasAttribute("download") ||
                event.ctrlKey ||
                event.metaKey ||
                event.shiftKey ||
                event.altKey
            ) {
                return;
            }

            // Kiểm tra xem có phải liên kết cùng domain / nội bộ không
            const url = new URL(link.href, window.location.href);
            if (url.origin !== window.location.origin) {
                return;
            }

            // Ngăn chặn chuyển hướng tức thì để chạy hiệu ứng mượt
            event.preventDefault();
            document.body.classList.add("page-is-leaving");

            setTimeout(function () {
                window.location.href = link.href;
            }, 200);
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initPageTransitions);
    } else {
        initPageTransitions();
    }
})();
