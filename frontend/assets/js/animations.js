/**
 * ====================================================================
 * THƯ VIỆN PTIT - SCROLL & REVEAL ANIMATIONS
 * animations.js: Hiệu ứng fade-in mượt mà khi cuộn trang
 * Tôn trọng hoàn toàn tùy chọn giảm chuyển động (prefers-reduced-motion)
 * ====================================================================
 */

(function () {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Danh sách phần tử cần áp dụng hiệu ứng fade-in
    const animTargets = [
        ".landing-hero",
        ".landing-stats",
        ".highlight-item",
        ".about-section",
        ".service-card",
        ".rules-section article",
        ".faq-list details",
        ".landing-contact",
        ".card--stat",
        ".stat",
        ".stat-card",
        ".panel",
        ".auth-card"
    ];

    function initScrollAnimations() {
        if (prefersReducedMotion || !("IntersectionObserver" in window)) {
            // Nếu người dùng bật giảm chuyển động, hiển thị ngay lập tức
            document.querySelectorAll(animTargets.join(", ")).forEach(el => {
                el.classList.add("is-visible");
            });
            return;
        }

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    obs.unobserve(entry.target);
                }
            });
        }, {
            root: null,
            threshold: 0.1,
            rootMargin: "0px 0px -40px 0px"
        });

        animTargets.forEach(selector => {
            document.querySelectorAll(selector).forEach((el, index) => {
                el.classList.add("reveal");
                // Thêm độ trễ so le nhẹ cho các phần tử cùng nhóm
                if (!el.style.transitionDelay) {
                    el.style.transitionDelay = `${(index % 3) * 0.1}s`;
                }
                observer.observe(el);
            });
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initScrollAnimations);
    } else {
        initScrollAnimations();
    }
})();
