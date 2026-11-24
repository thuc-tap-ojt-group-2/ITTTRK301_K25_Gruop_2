/**
 * THƯ VIỆN PTIT - LOADING CHUNG
 * loader.js: chỉ hiển thị loading khi API kéo dài hơn 300ms
 */
(function () {
    "use strict";

    let loaderTimer = null;
    let loader = null;

    function ensure() {
        if (loader) return loader;
        loader = document.createElement("div");
        loader.className = "ptit-page-loader";
        loader.setAttribute("role", "status");
        loader.setAttribute("aria-live", "polite");
        loader.innerHTML = `
            <div class="ptit-page-loader__card">
                <img class="ptit-page-loader__dragon" src="assets/images/dragon.svg" alt="" width="132" height="116" loading="eager">
                <p>Đang tải...</p>
                <div class="ptit-page-loader__track"><div class="ptit-page-loader__bar"></div></div>
            </div>
        `;
        document.body.appendChild(loader);
        return loader;
    }

    window.PTIT_LOADER = {
        show() {
            clearTimeout(loaderTimer);
            const el = ensure();
            loaderTimer = setTimeout(function () {
                el.classList.add("is-visible");
            }, 300);
        },
        hide() {
            clearTimeout(loaderTimer);
            if (!loader) return;
            loader.classList.remove("is-visible");
        }
    };
})();
