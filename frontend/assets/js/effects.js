/**
 * ====================================================================
 * THƯ VIỆN PTIT - MOTION & VISUAL EFFECTS CONTROLLER
 * effects.js: Điều khiển thanh tiến trình, Reveal so le, Hero Parallax,
 *             Hiệu ứng số nhảy (Counter), Tilt 3D, Ripple nút bấm,
 *             Nút lên đầu trang nổi, và Scrollspy đồng bộ menu.
 * Tôn trọng hoàn toàn tùy chọn giảm chuyển động (prefers-reduced-motion)
 * ====================================================================
 */

(function () {
    "use strict";

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ====================================================================
     * 1. THANH TIẾN TRÌNH CUỘN TRANG (C7: SCROLL PROGRESS BAR)
     * ==================================================================== */
    function initScrollProgress() {
        const progressBar = document.getElementById("scrollProgressBar") || document.querySelector(".scroll-progress-bar");
        if (!progressBar) return;

        let ticking = false;

        function updateProgress() {
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (scrollHeight <= 0) {
                progressBar.style.transform = "scaleX(0)";
                ticking = false;
                return;
            }

            const progress = Math.min(Math.max(window.scrollY / scrollHeight, 0), 1);
            progressBar.style.transform = `scaleX(${progress})`;
            ticking = false;
        }

        window.addEventListener("scroll", function () {
            if (!ticking) {
                window.requestAnimationFrame(updateProgress);
                ticking = true;
            }
        }, { passive: true });

        updateProgress();
    }

    /* ====================================================================
     * 2. HEADER SHRINK KHI CUỘN TRANG (> 24PX)
     * ==================================================================== */
    function initHeaderShrink() {
        const header = document.querySelector(".navbar");
        if (!header) return;

        let ticking = false;

        function updateHeader() {
            if (window.scrollY > 24) {
                header.classList.add("is-scrolled");
            } else {
                header.classList.remove("is-scrolled");
            }
            ticking = false;
        }

        window.addEventListener("scroll", function () {
            if (!ticking) {
                window.requestAnimationFrame(updateHeader);
                ticking = true;
            }
        }, { passive: true });

        updateHeader();
    }

    /* ====================================================================
     * 3. NÚT "LÊN ĐẦU TRANG" NỔI (C10: HIỆN KHI CUỘN > 600PX)
     * ==================================================================== */
    function initBackToTop() {
        const backToTopBtn = document.getElementById("backToTopBtn") || document.querySelector(".back-to-top-floating");
        if (!backToTopBtn) return;

        let ticking = false;

        function updateBackToTop() {
            if (window.scrollY > 600) {
                backToTopBtn.classList.add("is-visible");
            } else {
                backToTopBtn.classList.remove("is-visible");
            }
            ticking = false;
        }

        window.addEventListener("scroll", function () {
            if (!ticking) {
                window.requestAnimationFrame(updateBackToTop);
                ticking = true;
            }
        }, { passive: true });

        backToTopBtn.addEventListener("click", function (e) {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: prefersReducedMotion ? "auto" : "smooth"
            });
        });

        updateBackToTop();
    }

    /* ====================================================================
     * 4. PARALLAX CHUỘT KHỐI SÁCH HERO (C2: DI CHUYỂN TỐI ĐA 12PX)
     * ==================================================================== */
    function initHeroParallax() {
        if (prefersReducedMotion) return;

        const isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
        if (!isFinePointer) return;

        const heroVisual = document.querySelector(".hero-visual") || document.querySelector(".landing-hero");
        const parallaxTarget = document.querySelector(".hero-art-parallax");

        if (!heroVisual || !parallaxTarget) return;

        let targetX = 0;
        let targetY = 0;
        let currentX = 0;
        let currentY = 0;
        let isHovering = false;
        let rafId = null;

        function updateParallaxLoop() {
            // Nội suy mượt mà (Lerp factor: 0.1)
            currentX += (targetX - currentX) * 0.1;
            currentY += (targetY - currentY) * 0.1;

            parallaxTarget.style.setProperty("--parallax-x", `${currentX.toFixed(2)}px`);
            parallaxTarget.style.setProperty("--parallax-y", `${currentY.toFixed(2)}px`);

            if (isHovering || Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
                rafId = requestAnimationFrame(updateParallaxLoop);
            } else {
                rafId = null;
            }
        }

        heroVisual.addEventListener("mousemove", function (e) {
            isHovering = true;
            const rect = heroVisual.getBoundingClientRect();
            const relX = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 -> +0.5
            const relY = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 -> +0.5

            // Di chuyển ngược hướng chuột nhẹ nhàng, tối đa 12px
            targetX = -relX * 24; // [-12px, +12px]
            targetY = -relY * 24;

            if (!rafId) {
                rafId = requestAnimationFrame(updateParallaxLoop);
            }
        });

        heroVisual.addEventListener("mouseleave", function () {
            isHovering = false;
            targetX = 0;
            targetY = 0;
            if (!rafId) {
                rafId = requestAnimationFrame(updateParallaxLoop);
            }
        });
    }

    /* ====================================================================
     * 5. HIỆU ỨNG TILT 3D CHO CARD SÁCH & TIỆN ÍCH (C5: TỐI ĐA 6 ĐỘ)
     * ==================================================================== */
    function initTiltEffect() {
        if (prefersReducedMotion) return;

        const isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
        if (!isFinePointer) return;

        const tiltCards = document.querySelectorAll(".featured-book-card, .service-card, .tilt-enabled");

        tiltCards.forEach(card => {
            card.classList.add("tilt-enabled");

            card.addEventListener("mousemove", function (e) {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                // Tối đa 6 độ xoay
                const rotateX = ((y - centerY) / centerY) * -6;
                const rotateY = ((x - centerX) / centerX) * 6;

                card.classList.add("is-tilting");
                card.style.setProperty("--tilt-x", `${rotateX.toFixed(2)}deg`);
                card.style.setProperty("--tilt-y", `${rotateY.toFixed(2)}deg`);
            });

            card.addEventListener("mouseleave", function () {
                card.classList.remove("is-tilting");
                card.style.removeProperty("--tilt-x");
                card.style.removeProperty("--tilt-y");
            });
        });
    }

    /* ====================================================================
     * 6. HIỆU ỨNG SỐ NHẢY TỰ ĐỘNG (C6: ANIMATED NUMBER COUNTER)
     * ==================================================================== */
    function animateValue(element, start, end, duration) {
        if (prefersReducedMotion) {
            element.textContent = Number(end).toLocaleString("vi-VN");
            return;
        }

        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            // Easing: easeOutExpo
            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            const current = Math.floor(easeProgress * (end - start) + start);
            element.textContent = current.toLocaleString("vi-VN");

            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                element.textContent = Number(end).toLocaleString("vi-VN");
            }
        };
        window.requestAnimationFrame(step);
    }

    function initCounterAnimation() {
        const counters = document.querySelectorAll("[data-counter], [data-home-stat], .stat-number");
        if (counters.length === 0) return;

        if (!("IntersectionObserver" in window)) {
            counters.forEach(el => {
                const targetVal = parseInt(el.getAttribute("data-target") || el.textContent.replace(/\D/g, "") || "0", 10);
                if (targetVal > 0) el.textContent = targetVal.toLocaleString("vi-VN");
            });
            return;
        }

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const rawVal = el.getAttribute("data-target") || el.textContent.replace(/\D/g, "");
                    const targetVal = parseInt(rawVal, 10);

                    if (!isNaN(targetVal) && targetVal > 0 && !el.dataset.hasCounted) {
                        el.dataset.hasCounted = "true";
                        animateValue(el, 0, targetVal, 1200);
                    }
                    obs.unobserve(el);
                }
            });
        }, { threshold: 0.25 });

        counters.forEach(counter => observer.observe(counter));
    }

    /* ====================================================================
     * 7. HIỆU ỨNG GỢN SÓNG NÚT BẤM (C4: BUTTON RIPPLE EFFECT)
     * ==================================================================== */
    function initButtonRipples() {
        if (prefersReducedMotion) return;

        document.addEventListener("click", function (e) {
            const btn = e.target.closest(".btn");
            if (!btn) return;

            const rect = btn.getBoundingClientRect();
            const ripple = document.createElement("span");
            ripple.className = "btn-ripple";

            const size = Math.max(rect.width, rect.height) * 2;
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = `${size}px`;
            ripple.style.height = `${size}px`;
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;

            btn.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    }

    /* ====================================================================
     * 8. SCROLL REVEAL STAGGER VỚI INTERSECTION OBSERVER (C3)
     * ==================================================================== */
    function initScrollReveal() {
        const reveals = document.querySelectorAll(".reveal, .reveal-stagger");
        if (reveals.length === 0) return;

        if (prefersReducedMotion || !("IntersectionObserver" in window)) {
            reveals.forEach(el => el.classList.add("is-revealed"));
            return;
        }

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-revealed");
                    obs.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: "0px 0px -40px 0px"
        });

        reveals.forEach(el => observer.observe(el));
    }

    /* ====================================================================
     * KHỞI CHẠY TẤT CẢ HIỆU ỨNG KHI DOM SẴN SÀNG
     * ==================================================================== */
    function initAllEffects() {
        initScrollProgress();
        initHeaderShrink();
        initBackToTop();
        initHeroParallax();
        initTiltEffect();
        initCounterAnimation();
        initButtonRipples();
        initScrollReveal();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initAllEffects);
    } else {
        initAllEffects();
    }

    // Xuất hàm tiện ích nếu các module khác cần kích hoạt lại
    window.PTIT_EFFECTS = {
        initTilt: initTiltEffect,
        animateValue: animateValue,
        triggerCounters: initCounterAnimation
    };
})();
