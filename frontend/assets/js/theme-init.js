(function () {
    let theme = "light";
    try {
        if (localStorage.getItem("ptit_theme") === "dark") {
            theme = "dark";
        }
    } catch {
        theme = "light";
    }
    document.documentElement.dataset.theme = theme;
})();
