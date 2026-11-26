/**
 * ====================================================================
 * THƯ VIỆN PTIT - UI UTILITIES & LOADING SYSTEM
 * ui.js: Hệ thống loading L1-L8 (thanh tiến trình top, skeleton shimmer,
 *        nút loading, spinner vùng, toast, error state, empty state),
 *        Navbar mobile, Modal helper, Đăng xuất, Phân trang, Password toggle
 * ====================================================================
 */

const PTIT = window.PTIT || {};
PTIT.reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

PTIT.getInitials = function (name) {
    const words = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!words.length) return "👤";
    return (words.length === 1
        ? words[0].slice(0, 1)
        : words[0].slice(0, 1) + words[words.length - 1].slice(0, 1)
    ).toLocaleUpperCase("vi-VN");
};

PTIT.getAvatarColor = function (name) {
    const colors = ["#155E42", "#1F528D", "#6A3F86", "#8A3B24", "#145B70", "#6B3B50", "#405A27", "#4D4B78"];
    let hash = 0;
    for (const character of String(name || "").trim()) {
        hash = (hash * 31 + character.codePointAt(0)) >>> 0;
    }
    return colors[hash % colors.length];
};

PTIT.setAvatar = function (element, name) {
    if (!element) return;
    element.textContent = PTIT.getInitials(name);
    element.style.backgroundColor = PTIT.getAvatarColor(name);
    element.style.color = "#FFFFFF";
};

PTIT.resolveTheme = function () {
    try {
        return localStorage.getItem("ptit_theme") === "dark" ? "dark" : "light";
    } catch {
        return "light";
    }
};

PTIT.applyTheme = function (theme, persist = false) {
    const nextTheme = String(theme || "").toLowerCase() === "dark" ? "dark" : "light";
    const isDark = nextTheme === "dark";
    document.documentElement.dataset.theme = nextTheme;
    document.querySelectorAll("#themeButton, [data-account-action='theme']").forEach(function (button) {
        button.disabled = false;
        button.setAttribute("aria-pressed", String(isDark));
        button.title = isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối";
    });
    const accountThemeLabel = document.getElementById("accountThemeLabel");
    if (accountThemeLabel) {
        accountThemeLabel.textContent = isDark ? "Giao diện tối (đang bật)" : "Giao diện tối (đang tắt)";
    }
    const readerThemeBtnLabel = document.querySelector("#themeButton span:last-child");
    if (readerThemeBtnLabel) {
        readerThemeBtnLabel.textContent = isDark ? "Giao diện sáng" : "Giao diện tối";
    }
    if (persist) {
        try {
            localStorage.setItem("ptit_theme", nextTheme);
        } catch (error) {
            console.error("Không thể lưu giao diện đã chọn:", error);
            PTIT.showToast("Giao diện đã đổi, nhưng không thể lưu lựa chọn trên thiết bị này.", "error");
        }
    }
    return nextTheme;
};

PTIT.toggleTheme = function () {
    const currentTheme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    return PTIT.applyTheme(nextTheme, true);
};

PTIT.initThemeButton = function (button) {
    PTIT.applyTheme(PTIT.resolveTheme(), false);
    if (!button || button.dataset.themeBound === "true") return;
    button.dataset.themeBound = "true";
    button.disabled = false;
    button.addEventListener("click", function () {
        const nextTheme = PTIT.toggleTheme();
        PTIT.showToast("Đã chuyển sang giao diện " + (nextTheme === "dark" ? "tối." : "sáng."), "success");
    });
};

PTIT.getLoanStatus = function (loan) {
    const status = String(loan && loan.status || "").trim().toUpperCase();
    const labels = {
        PENDING: ["Chờ duyệt", "badge--warning", "t-warn", "status-pending", "loan-status--pending"],
        BORROWING: ["Đang mượn", "badge--info", "t-info", "status-borrowing", "loan-status--borrowing"],
        RETURNED: ["Đã trả", "badge--success", "t-ok", "status-returned", "loan-status--returned"],
        REJECTED: ["Bị từ chối", "badge--danger", "t-bad", "status-rejected", "loan-status--rejected"],
        CANCELLED: ["Đã hủy", "badge--neutral", "t-mut", "status-cancelled", "loan-status--cancelled"]
    };
    const dueDate = loan && (loan.due_date || loan.dueDate);
    const dateKey = value => {
        if (!value) return "";
        const text = String(value).trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
            const parsedDate = new Date(`${text}T00:00:00Z`);
            return !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === text ? text : "";
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        const parts = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Ho_Chi_Minh",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).formatToParts(date);
        const part = type => parts.find(item => item.type === type).value;
        return `${part("year")}-${part("month")}-${part("day")}`;
    };
    const today = dateKey(new Date());
    const dueKey = dateKey(dueDate);
    const overdue = status === "BORROWING" && Boolean(dueKey) && dueKey < today;
    const displayStatus = overdue ? "OVERDUE" : status;
    const daysUntilDue = dueKey
        ? Math.round((Date.parse(`${dueKey}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000)
        : null;
    const details = overdue
        ? ["Quá hạn", "badge--danger", "t-bad", "status-overdue", "loan-status--overdue"]
        : labels[status] || ["Không xác định", "badge--neutral", "t-mut", "status-unknown", "loan-status--unknown"];
    return {
        status,
        displayStatus,
        dueDateKey: dueKey,
        daysUntilDue,
        label: details[0],
        badgeClass: details[1],
        returnClass: details[2],
        readerClass: details[3],
        statusClass: details[4],
        isOverdue: overdue
    };
};

/* ====================================================================
 * L1. THANH TIẾN TRÌNH TRÊN CÙNG (TOP PROGRESS BAR)
 * ==================================================================== */
PTIT.progress = (function () {
    let progressBar = null;
    let progressTimer = null;
    let currentProgress = 0;

    function getBar() {
        if (!progressBar) {
            progressBar = document.getElementById("ptitTopProgress");
            if (!progressBar) {
                progressBar = document.createElement("div");
                progressBar.id = "ptitTopProgress";
                progressBar.className = "top-progress-bar";
                progressBar.setAttribute("role", "progressbar");
                progressBar.setAttribute("aria-hidden", "true");
                progressBar.setAttribute("aria-valuemin", "0");
                progressBar.setAttribute("aria-valuemax", "100");
                progressBar.setAttribute("aria-valuenow", "0");
                document.body.prepend(progressBar);
            }
        }
        return progressBar;
    }

    return {
        start: function () {
            const bar = getBar();
            clearInterval(progressTimer);
            currentProgress = 15;
            bar.style.opacity = "1";
            bar.style.width = currentProgress + "%";
            bar.setAttribute("aria-valuenow", currentProgress);

            progressTimer = setInterval(function () {
                if (currentProgress < 85) {
                    currentProgress += Math.floor(Math.random() * 8) + 2;
                    bar.style.width = currentProgress + "%";
                    bar.setAttribute("aria-valuenow", currentProgress);
                }
            }, 250);
        },

        set: function (percent) {
            const bar = getBar();
            currentProgress = Math.min(Math.max(percent, 0), 100);
            bar.style.opacity = "1";
            bar.style.width = currentProgress + "%";
            bar.setAttribute("aria-valuenow", currentProgress);
        },

        done: function () {
            const bar = getBar();
            clearInterval(progressTimer);
            currentProgress = 100;
            bar.style.width = "100%";
            bar.setAttribute("aria-valuenow", "100");

            setTimeout(function () {
                bar.style.opacity = "0";
                setTimeout(function () {
                    bar.style.width = "0%";
                    bar.setAttribute("aria-valuenow", "0");
                }, 300);
            }, 200);
        }
    };
})();

/* ====================================================================
 * L2. KHUNG XƯƠNG TẢI DỮ LIỆU (SKELETON SHIMMER)
 * ==================================================================== */
PTIT.showSkeleton = function (container, type = "card", count = 3) {
    if (!container) return;
    container.setAttribute("data-skeleton-loading", "true");
    container.replaceChildren();

    for (let i = 0; i < count; i++) {
        const item = document.createElement("div");
        item.setAttribute("aria-hidden", "true");

        if (type === "stat") {
            item.className = "skeleton-stat skeleton-shimmer";
            item.innerHTML = `
                <div class="skeleton-shimmer" style="width: 45%; height: 14px; border-radius: 4px;"></div>
                <div class="skeleton-shimmer" style="width: 70%; height: 32px; border-radius: 6px; margin-top: 8px;"></div>
            `;
        } else if (type === "card") {
            item.className = "skeleton-card";
            item.innerHTML = `
                <div class="skeleton-cover skeleton-shimmer"></div>
                <div class="skeleton-shimmer" style="width: 40%; height: 12px; border-radius: 4px; margin-top: 10px;"></div>
                <div class="skeleton-shimmer" style="width: 85%; height: 16px; border-radius: 4px; margin-top: 6px;"></div>
                <div class="skeleton-shimmer" style="width: 60%; height: 13px; border-radius: 4px; margin-top: 4px;"></div>
            `;
        } else if (type === "table-row") {
            item.className = "skeleton-row skeleton-shimmer";
        } else {
            item.className = "skeleton-list-item skeleton-shimmer";
        }

        container.appendChild(item);
    }
};

PTIT.hideSkeleton = function (container) {
    if (!container) return;
    container.removeAttribute("data-skeleton-loading");
    container.replaceChildren();
};

/* ====================================================================
 * L3. NÚT BẤM LOADING (BUTTON LOADING STATE)
 * ==================================================================== */
PTIT.setButtonLoading = function (button, isLoading, loadingText) {
    if (!button) return;

    if (isLoading) {
        if (!button.dataset.originalHtml) {
            button.dataset.originalHtml = button.innerHTML;
        }
        button.disabled = true;
        button.classList.add("is-loading");
        button.setAttribute("aria-busy", "true");

        const text = loadingText || "Đang xử lý...";
        button.innerHTML = `<span class="btn-spinner" aria-hidden="true"></span> <span>${text}</span>`;
    } else {
        button.classList.remove("is-loading");
        button.removeAttribute("aria-busy");
        button.disabled = false;
        if (button.dataset.originalHtml) {
            button.innerHTML = button.dataset.originalHtml;
            delete button.dataset.originalHtml;
        }
    }
};

/* ====================================================================
 * L4. SPINNER TOÀN KHU VỰC (AREA SPINNER OVERLAY)
 * ==================================================================== */
PTIT.showSpinner = function (container, text = "Đang tải dữ liệu...") {
    if (!container) return;
    PTIT.hideSpinner(container);

    const prevPos = window.getComputedStyle(container).position;
    if (prevPos === "static") {
        container.style.position = "relative";
        container.dataset.resetPosition = "true";
    }

    const overlay = document.createElement("div");
    overlay.className = "area-spinner-overlay";
    overlay.setAttribute("role", "status");
    overlay.setAttribute("aria-live", "polite");
    overlay.innerHTML = `
        <div class="area-spinner" aria-hidden="true"></div>
        <span class="area-spinner-text">${text}</span>
    `;

    container.appendChild(overlay);
};

PTIT.hideSpinner = function (container) {
    if (!container) return;
    const overlay = container.querySelector(".area-spinner-overlay");
    if (overlay) overlay.remove();
    if (container.dataset.resetPosition === "true") {
        container.style.position = "";
        delete container.dataset.resetPosition;
    }
};

/* ====================================================================
 * L5. LOADING TOÀN TRANG (FULL-SCREEN LOADING OVERLAY)
 * ==================================================================== */
let ptitLoadingTimer = null;

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
    box.style.display = "flex";

    clearTimeout(ptitLoadingTimer);
    ptitLoadingTimer = setTimeout(function () {
        PTIT.hideLoading();
    }, 6000);
};

PTIT.hideLoading = function () {
    clearTimeout(ptitLoadingTimer);
    const box = document.getElementById("ptitLoading");
    if (box !== null) {
        box.classList.remove("show");
        box.style.display = "none";
    }
};

/* ====================================================================
 * L6. HỆ THỐNG TOAST THÔNG BÁO (TOAST NOTIFICATIONS)
 * ==================================================================== */
PTIT.showToast = function (message, type = "info", duration = 4000) {
    let container = document.getElementById("ptitToastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "ptitToastContainer";
        container.className = "ptit-toast-container";
        container.setAttribute("role", "status");
        container.setAttribute("aria-live", "polite");
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `ptit-toast ptit-toast--${type}`;

    let icon = "ℹ";
    if (type === "success") icon = "✓";
    if (type === "error") icon = "✕";
    if (type === "warning") icon = "⚠";

    toast.innerHTML = `
        <div class="ptit-toast-content">
            <span style="font-weight:800;font-size:16px;" aria-hidden="true">${icon}</span>
            <span>${message}</span>
        </div>
        <button type="button" class="ptit-toast-close" aria-label="Đóng thông báo">&times;</button>
    `;

    container.appendChild(toast);

    requestAnimationFrame(function () {
        toast.classList.add("is-visible");
    });

    let dismissTimer = setTimeout(dismissToast, duration);

    function dismissToast() {
        clearTimeout(dismissTimer);
        toast.classList.remove("is-visible");
        setTimeout(function () {
            toast.remove();
        }, 300);
    }

    const closeBtn = toast.querySelector(".ptit-toast-close");
    if (closeBtn) {
        closeBtn.addEventListener("click", dismissToast);
    }
};

/* ====================================================================
 * L7. TRẠNG THÁI LỖI TẢI DỮ LIỆU API (API ERROR STATE)
 * ==================================================================== */
PTIT.renderErrorState = function (container, { message = "Không tải được dữ liệu từ máy chủ", onRetry } = {}) {
    if (!container) return;
    container.replaceChildren();

    const box = document.createElement("div");
    box.className = "api-error-state";
    box.setAttribute("role", "alert");
    box.innerHTML = `
        <div class="api-error-icon" aria-hidden="true">⚠️</div>
        <h3 class="api-error-title">Đã xảy ra lỗi tải dữ liệu</h3>
        <p class="api-error-desc">${message}</p>
        <button type="button" class="btn btn--secondary btn--sm btn-retry">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
            <span>Tải lại</span>
        </button>
    `;

    const retryBtn = box.querySelector(".btn-retry");
    if (retryBtn && typeof onRetry === "function") {
        retryBtn.addEventListener("click", onRetry);
    }

    container.appendChild(box);
};

/* ====================================================================
 * L8. TRẠNG THÁI TRỐNG (EMPTY STATE)
 * ==================================================================== */
PTIT.renderEmptyState = function (container, {
    title = "Không có dữ liệu",
    message = "Chưa tìm thấy mục nào phù hợp trong hệ thống.",
    actionText,
    onAction
} = {}) {
    if (!container) return;
    container.replaceChildren();

    const box = document.createElement("div");
    box.className = "empty-state";
    box.setAttribute("role", "status");

    let actionBtnHtml = "";
    if (actionText && typeof onAction === "function") {
        actionBtnHtml = `<button type="button" class="btn btn--primary btn--sm empty-state-action" style="margin-top: 12px;">${actionText}</button>`;
    }

    box.innerHTML = `
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path>
            <path d="M6 6h10M6 10h10M6 14h6"></path>
        </svg>
        <h3 class="empty-state-title">${title}</h3>
        <p class="empty-state-desc">${message}</p>
        ${actionBtnHtml}
    `;

    if (actionText && typeof onAction === "function") {
        const btn = box.querySelector(".empty-state-action");
        if (btn) btn.addEventListener("click", onAction);
    }

    container.appendChild(box);
};

/* ====================================================================
 * HỘP THOẠI & MODAL HELPERS
 * ==================================================================== */
PTIT.openModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.dataset.ptitOriginalFocus = document.activeElement?.id || "";
    modal.dataset.ptitInitialSnapshot = modal.querySelector("form")
        ? Array.from(modal.querySelectorAll("form")).map(form =>
            Array.from(form.elements).filter(element => element.name || element.id)
                .map(element => `${element.name || element.id}:${element.value}`).join("|")
        ).join("||")
        : "";
    modal.classList.remove("is-closing");
    modal.removeAttribute("aria-hidden");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");

    const labelledBy = modal.getAttribute("aria-labelledby") ||
        modal.querySelector("[id][data-modal-title], h1[id], h2[id]")?.id;
    if (labelledBy) modal.setAttribute("aria-labelledby", labelledBy);

    modal.querySelectorAll("form").forEach(form => {
        form.dataset.ptitDirty = "false";
        if (!form.dataset.ptitDirtyBound) {
            form.dataset.ptitDirtyBound = "true";
            form.addEventListener("input", function () { form.dataset.ptitDirty = "true"; });
            form.addEventListener("change", function () { form.dataset.ptitDirty = "true"; });
        }
    });

    const activeDialogs = Array.from(document.querySelectorAll("dialog.modal[open], .overlay.show, .overlay:not([hidden])"))
        .filter(element => element !== modal);
    if (!activeDialogs.length) {
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        if (scrollbarWidth > 0) document.body.style.paddingRight = scrollbarWidth + "px";
        document.body.classList.add("ptit-modal-open");
    }

    if (typeof modal.showModal === "function") {
        if (!modal.open) modal.showModal();
    } else {
        modal.classList.add("show");
        modal.hidden = false;
    }
    modal.hidden = false;

    const focusTarget = modal.querySelector("[autofocus], input:not([disabled]):not([type='hidden']), select:not([disabled]), textarea:not([disabled]), button:not([disabled])");
    if (focusTarget) requestAnimationFrame(() => focusTarget.focus());
};

PTIT.closeModal = function (modalId, options = {}) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    const force = Boolean(options === true || options?.force);

    function finish() {
        if (typeof modal.close === "function" && modal.open) {
            modal.close();
        } else {
            modal.classList.remove("show");
            modal.hidden = true;
        }

        modal.classList.remove("is-closing");
        modal.querySelectorAll("[role='alert'], .message").forEach(element => {
            element.hidden = true;
            element.textContent = "";
        });
        modal.querySelectorAll("form").forEach(form => {
            form.reset();
            form.dataset.ptitDirty = "false";
        });

        const anyModalOpen = document.querySelector("dialog.modal[open], .overlay.show");
        if (!anyModalOpen) {
            document.body.classList.remove("ptit-modal-open");
            document.body.style.paddingRight = "";
        }

        const previousId = modal.dataset.ptitOriginalFocus;
        const previous = previousId ? document.getElementById(previousId) : null;
        if (previous?.isConnected) previous.focus();
    }

    const shouldConfirmUnsaved = !force && modal.dataset.confirmUnsaved === "true";
    const formDirty = shouldConfirmUnsaved && Array.from(modal.querySelectorAll("form"))
        .some(form => form.dataset.ptitDirty === "true");
    if (formDirty &&
        typeof PTIT.confirm === "function") {
        PTIT.confirm("Bạn đã thay đổi nội dung. Đóng hộp thoại mà không lưu?", {
            title: "Chưa lưu thay đổi",
            danger: true,
            confirmText: "Đóng",
            cancelText: "Tiếp tục sửa"
        }).then(function (confirmed) {
            if (confirmed) finish();
        });
        return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    modal.classList.add("is-closing");
    window.setTimeout(finish, reduceMotion ? 0 : 350);
};

document.addEventListener("click", function (event) {
    const closeControl = event.target.closest("[data-modal-close]");
    if (closeControl) {
        const modal = closeControl.closest("dialog.modal, .overlay");
        if (modal?.id) {
            event.preventDefault();
            PTIT.closeModal(modal.id);
        }
        return;
    }

    const overlay = event.target.closest(".overlay");
    if (overlay && event.target === overlay && overlay.id) {
        PTIT.closeModal(overlay.id);
    }
});

document.addEventListener("click", function (event) {
    document.querySelectorAll("dialog.modal[open]").forEach(function (dialog) {
        if (event.target === dialog && dialog.id) {
            PTIT.closeModal(dialog.id);
        }
    });
});

document.addEventListener("keydown", function (event) {
    if (event.key !== "Tab") return;
    const openModalElement = Array.from(document.querySelectorAll("dialog.modal[open], .overlay.show"))
        .filter(element => !element.hidden)
        .pop();
    if (!openModalElement) return;

    const focusable = Array.from(openModalElement.querySelectorAll(
        "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"
    ));
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
});

let ptitConfirmDialog = null;
let ptitConfirmResolver = null;
let ptitConfirmOptions = null;
let ptitConfirmBusy = false;

function finishPTITConfirm(value) {
    if (!ptitConfirmResolver || !ptitConfirmDialog) return;

    const resolve = ptitConfirmResolver;
    const dialog = ptitConfirmDialog;
    const previousId = dialog.dataset.ptitOriginalFocus;
    ptitConfirmResolver = null;
    ptitConfirmOptions = null;
    ptitConfirmBusy = false;

    if (dialog.open) dialog.close();
    dialog.querySelectorAll("button").forEach(button => {
        button.disabled = false;
        button.removeAttribute("aria-busy");
    });

    if (!document.querySelector("dialog.modal[open], .overlay.show, .overlay:not([hidden])")) {
        document.body.classList.remove("ptit-modal-open");
        document.body.style.paddingRight = "";
    }

    const previous = previousId ? document.getElementById(previousId) : null;
    if (previous?.isConnected) previous.focus();
    resolve(value);
}

function getPTITConfirmDialog() {
    if (ptitConfirmDialog?.isConnected) return ptitConfirmDialog;

    const dialog = document.createElement("dialog");
    dialog.className = "modal ptit-confirm-dialog";
    dialog.id = "ptitConfirmDialog";
    dialog.setAttribute("aria-label", "Xác nhận thao tác");
    dialog.innerHTML = `
        <button type="button" class="close-btn" data-confirm-action="cancel" aria-label="Đóng">&times;</button>
        <div class="ptit-confirm-icon" aria-hidden="true">?</div>
        <h2 class="ptit-confirm-title"></h2>
        <p class="text-muted ptit-confirm-message"></p>
        <p class="message error ptit-confirm-error" role="alert" hidden></p>
        <div class="form-actions">
            <button type="button" class="btn btn--secondary ptit-confirm-cancel" data-confirm-action="cancel" autofocus>Hủy</button>
            <button type="button" class="btn ptit-confirm-ok" data-confirm-action="confirm"></button>
        </div>
    `;
    dialog.addEventListener("click", function (event) {
        const action = event.target.closest("[data-confirm-action]");
        if (action) {
            if (ptitConfirmBusy) return;
            if (action.dataset.confirmAction === "confirm" && typeof ptitConfirmOptions?.onConfirm === "function") {
                runPTITConfirmAction();
            } else {
                finishPTITConfirm(action.dataset.confirmAction === "confirm");
            }
        } else if (event.target === dialog) {
            if (!ptitConfirmBusy) finishPTITConfirm(false);
        }
    });
    dialog.addEventListener("cancel", function (event) {
        event.preventDefault();
        if (!ptitConfirmBusy) finishPTITConfirm(false);
    });
    document.body.appendChild(dialog);
    ptitConfirmDialog = dialog;
    return dialog;
}

async function runPTITConfirmAction() {
    if (ptitConfirmBusy || !ptitConfirmResolver || !ptitConfirmDialog) return;

    ptitConfirmBusy = true;
    const buttons = ptitConfirmDialog.querySelectorAll("button");
    const confirmButton = ptitConfirmDialog.querySelector(".ptit-confirm-ok");
    const error = ptitConfirmDialog.querySelector(".ptit-confirm-error");
    const originalText = ptitConfirmOptions.confirmText || "Xác nhận";
    buttons.forEach(button => {
        button.disabled = true;
        button.setAttribute("aria-busy", "true");
    });
    confirmButton.textContent = "Đang xử lý...";
    error.hidden = true;
    error.textContent = "";

    try {
        const result = await ptitConfirmOptions.onConfirm();
        if (result === false) throw new Error("Thao tác chưa được hoàn tất.");
        finishPTITConfirm(true);
    } catch (errorValue) {
        error.textContent = errorValue && errorValue.message
            ? errorValue.message
            : "Không thể hoàn tất thao tác. Vui lòng thử lại.";
        error.hidden = false;
        ptitConfirmBusy = false;
        buttons.forEach(button => {
            button.disabled = false;
            button.removeAttribute("aria-busy");
        });
        confirmButton.textContent = originalText;
    }
}

PTIT.confirm = function (message, options = {}) {
    if (ptitConfirmResolver) return Promise.resolve(false);
    const dialog = getPTITConfirmDialog();
    if (typeof dialog.showModal !== "function") return Promise.resolve(false);

    const cancelButton = dialog.querySelector(".ptit-confirm-cancel");
    const confirmButton = dialog.querySelector(".ptit-confirm-ok");
    const icon = dialog.querySelector(".ptit-confirm-icon");
    dialog.querySelector(".ptit-confirm-title").textContent = options.title || "Xác nhận thao tác";
    dialog.querySelector(".ptit-confirm-message").textContent = message;
    cancelButton.textContent = options.cancelText || "Hủy";
    cancelButton.hidden = Boolean(options.hideCancel);
    if (icon) {
        icon.textContent = options.danger ? "!" : options.hideCancel ? "i" : "?";
    }
    confirmButton.textContent = options.confirmText || "Xác nhận";
    confirmButton.className = `btn ${options.danger ? "btn--danger" : "btn--primary"} ptit-confirm-ok`;
    dialog.querySelector(".ptit-confirm-error").hidden = true;
    dialog.querySelector(".ptit-confirm-error").textContent = "";
    ptitConfirmOptions = options;

    return new Promise(function (resolve) {
        ptitConfirmResolver = resolve;
        PTIT.openModal(dialog.id);
        (options.hideCancel ? confirmButton : cancelButton).focus();
    });
};

/* ====================================================================
 * XÁC THỰC & ĐĂNG XUẤT
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
 * HIỆU ỨNG SỐ TỰ NHẢY (COUNT-UP)
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
    const baseUrl = window.PTIT_API_BASE_URL ||
        `${window.location.protocol === "https:" ? "https:" : "http:"}//${window.location.hostname || "127.0.0.1"}:8000`;

    fetch(`${baseUrl.replace(/\/+$/, "")}/api/stats/public`)
        .then(function (response) {
            if (!response.ok) throw new Error("Không thể tải số liệu công khai.");
            return response.json();
        })
        .then(function (stats) {
            if (typeof done === "function") {
                done({
                    titles: Number(stats.total_titles || 0),
                    copies: Number(stats.total_copies || 0),
                    categories: Number(stats.total_categories || 0)
                });
            }
        })
        .catch(function () {
            if (typeof done === "function") done(null);
        });
};

PTIT.fillStats = function (stats) {
    const items = document.querySelectorAll("[data-stat]");
    for (let i = 0; i < items.length; i++) {
        const statKey = items[i].dataset.stat;
        PTIT.countUp(items[i], stats ? stats[statKey] : 0);
    }
};

/* ====================================================================
 * THANH TIẾN TRÌNH CUỘN TRANG (SCROLL PROGRESS CHO LANDING)
 * ==================================================================== */
PTIT.initScrollProgress = function () {
    const progressBar = document.getElementById("ptitTopProgress");
    if (!progressBar) return;

    let ticking = false;
    window.addEventListener("scroll", function () {
        if (!ticking) {
            window.requestAnimationFrame(function () {
                const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
                if (totalHeight > 0) {
                    const scrollPct = (window.scrollY / totalHeight) * 100;
                    progressBar.style.opacity = window.scrollY > 40 ? "1" : "0";
                    progressBar.style.width = Math.min(scrollPct, 100) + "%";
                }
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
};

/* ====================================================================
 * MENU MOBILE & SIDEBAR MOBILE
 * ==================================================================== */
PTIT.initMobileNav = function () {
    const menuToggle = document.querySelector(".hamburger") || document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");

    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", function () {
            const isExpanded = navLinks.classList.toggle("show");
            menuToggle.setAttribute("aria-expanded", isExpanded);
        });

        navLinks.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                navLinks.classList.remove("show");
                menuToggle.setAttribute("aria-expanded", "false");
            });
        });
    }
};

PTIT.initAccountMenu = function () {
    const topbar = document.querySelector(".topbar");
    if (!topbar) return;

    PTIT.applyTheme(PTIT.resolveTheme());

    const iconPaths = {
        dashboard: '<path d="M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z"/>',
        books: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
        loans: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
        readers: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
        fines: '<circle cx="12" cy="12" r="9"/><path d="M15 9.4c-.4-.9-1.3-1.4-3-1.4-1.7 0-3 .8-3 2 0 3 6 1.5 6 4.5 0 1.2-1.3 2-3 2-1.7 0-2.6-.6-3-1.5"/>',
        admin: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.86 1.86-.06-.06A1.7 1.7 0 0 0 16 18.4a1.7 1.7 0 0 0-1 .6V21h-6v-2a1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.88.34l-.06.06-1.86-1.86.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1H2v-4h2a1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06L6.06 5.2l.06.06A1.7 1.7 0 0 0 8 5.6a1.7 1.7 0 0 0 1-.6V3h6v2a1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.86 1.86-.06.06A1.7 1.7 0 0 0 19.4 9c.38.2.72.5.98.86H21v4h-.62c-.26.36-.6.66-.98.86Z"/>'
    };

    document.querySelectorAll(".nav a, aside nav a").forEach(function (link) {
        let type = "dashboard";
        const href = link.getAttribute("href") || "";
        if (href.includes("books")) type = "books";
        else if (href.includes("loans")) type = "loans";
        else if (href.includes("readers")) type = "readers";
        else if (href.includes("fines")) type = "fines";
        else if (href.includes("admin")) type = "admin";
        const emoji = link.querySelector("span[aria-hidden='true']");
        if (emoji) {
            emoji.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + iconPaths[type] + "</svg>";
            emoji.style.display = "inline-flex";
        }
    });

    let role = "";
    let name = "";
    let accountUser = {};
    try {
        const storedUser = JSON.parse(localStorage.getItem("user") || localStorage.getItem("ptit_user") || "{}");
        accountUser = storedUser && typeof storedUser === "object" ? storedUser : {};
        name = accountUser.full_name || accountUser.fullName || accountUser.name || accountUser.username || accountUser.email || "Người dùng";
        role = String(accountUser.role || "").toUpperCase();
    } catch {
        name = "Người dùng";
    }

    if (role === "ADMIN") {
        document.body.classList.add("theme-admin");
    } else if (role === "LIBRARIAN") {
        document.body.classList.add("theme-librarian");
    } else {
        document.body.classList.add("theme-reader");
    }

    document.querySelectorAll(".logout-btn, .lo").forEach(function (button) {
        button.hidden = true;
    });

    if (topbar.querySelector(".account-menu")) return;

    const menu = document.createElement("div");
    menu.className = "account-menu";
    const initials = PTIT.getInitials(name);
    const roleLabel = role === "ADMIN" ? "Quản trị viên" : role === "LIBRARIAN" ? "Thủ thư" : "Độc giả";

    menu.innerHTML = `
        <button type="button" class="account-menu-button" aria-expanded="false" aria-haspopup="menu">
            <span class="avatar" aria-hidden="true" style="background-color:${PTIT.getAvatarColor(name)}">${initials}</span>
            <span class="account-menu-name">${name}</span>
            <span aria-hidden="true">⌄</span>
        </button>
        <div class="account-menu-dropdown" role="menu" hidden>
            <button type="button" role="menuitem" data-account-action="profile"><span class="account-menu-item-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/></svg></span><span>Hồ sơ <small>${roleLabel}</small></span></button>
            <button type="button" role="menuitem" data-account-action="theme" aria-pressed="false" title="Chuyển đổi giao diện sáng / tối"><span class="account-menu-item-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/></svg></span><span id="accountThemeLabel">Giao diện tối (đang tắt)</span></button>
            <button type="button" role="menuitem" class="account-logout" data-account-action="logout"><span class="account-menu-item-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7"/></svg></span><span>Đăng xuất</span></button>
        </div>
    `;

    topbar.appendChild(menu);
    const button = menu.querySelector(".account-menu-button");
    const dropdown = menu.querySelector(".account-menu-dropdown");
    const themeLabel = menu.querySelector("#accountThemeLabel");
    const themeActionBtn = menu.querySelector("[data-account-action='theme']");
    const updateThemeLabel = function () {
        if (themeLabel && themeActionBtn) {
            const isDark = document.documentElement.dataset.theme === "dark";
            themeLabel.textContent = isDark ? "Giao diện tối (đang bật)" : "Giao diện tối (đang tắt)";
            themeActionBtn.setAttribute("aria-pressed", String(isDark));
            themeActionBtn.title = isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối";
        }
    };
    updateThemeLabel();

    button.addEventListener("click", function () {
        dropdown.hidden = !dropdown.hidden;
        button.setAttribute("aria-expanded", String(!dropdown.hidden));
    });

    menu.addEventListener("click", async function (event) {
        const actionButton = event.target.closest("[data-account-action]");
        if (!actionButton) return;
        const action = actionButton.dataset.accountAction;
        dropdown.hidden = true;
        button.setAttribute("aria-expanded", "false");
        if (action === "theme") {
            const nextTheme = PTIT.toggleTheme();
            updateThemeLabel();
            PTIT.showToast("Đã chuyển sang giao diện " + (nextTheme === "dark" ? "tối." : "sáng."), "success");
        } else if (action === "profile") {
            let profileDialog = document.getElementById("accountProfileDialog");
            if (!profileDialog) {
                profileDialog = document.createElement("dialog");
                profileDialog.id = "accountProfileDialog";
                profileDialog.className = "modal account-profile-dialog";
                profileDialog.setAttribute("aria-labelledby", "accountProfileTitle");
                profileDialog.innerHTML = `
                    <button type="button" class="close-btn" data-modal-close aria-label="Đóng hồ sơ">×</button>
                    <h2 id="accountProfileTitle">Hồ sơ tài khoản</h2>
                    <p class="sub">Thông tin tài khoản hiện đang đăng nhập.</p>
                    <dl class="account-profile-list">
                        <div><dt>Họ và tên</dt><dd data-profile-field="name"></dd></div>
                        <div><dt>Tên đăng nhập</dt><dd data-profile-field="username"></dd></div>
                        <div><dt>Email</dt><dd data-profile-field="email"></dd></div>
                        <div><dt>Vai trò</dt><dd data-profile-field="role"></dd></div>
                    </dl>
                `;
                profileDialog.addEventListener("cancel", function (event) {
                    event.preventDefault();
                    PTIT.closeModal(profileDialog.id);
                });
                document.body.appendChild(profileDialog);
            }

            const profileValues = {
                name: accountUser.full_name || accountUser.fullName || accountUser.name,
                username: accountUser.username || accountUser.student_id || accountUser.studentId || accountUser.studentCode,
                email: accountUser.email,
                role: roleLabel,
            };
            Object.keys(profileValues).forEach(function (key) {
                const field = profileDialog.querySelector(`[data-profile-field="${key}"]`);
                if (field) field.textContent = profileValues[key] || "Chưa cập nhật";
            });
            PTIT.openModal(profileDialog.id);
        } else if (action === "logout") {
            await PTIT.confirm("Bạn có chắc chắn muốn đăng xuất?", {
                title: "Đăng xuất",
                confirmText: "Đăng xuất",
                onConfirm: async () => {
                    PTIT.logout();
                }
            });
        }
    });

    document.addEventListener("click", function (event) {
        if (!menu.contains(event.target)) {
            dropdown.hidden = true;
            button.setAttribute("aria-expanded", "false");
        }
    });
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

/* ====================================================================
 * CHUẨN HÓA PHÂN TRANG (PAGINATION) TOÀN HỆ THỐNG
 * ==================================================================== */
PTIT.renderPagination = function ({
    container,
    currentPage = 1,
    totalPages = 1,
    totalItems = 0,
    pageSize = 10,
    itemLabel = "mục",
    onPageChange
}) {
    if (!container) return;
    container.replaceChildren();

    if (totalItems <= 0 || totalPages <= 0) {
        container.style.display = "none";
        return;
    }
    container.style.display = "flex";

    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    const info = document.createElement("div");
    info.className = "pagination-info";
    info.textContent = `Hiển thị ${startItem}–${endItem} trên tổng ${totalItems} ${itemLabel}`;

    const controls = document.createElement("div");
    controls.className = "pagination-controls";

    const prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.className = "pagination-btn pagination-prev";
    prevBtn.innerHTML = "← Trước";
    prevBtn.disabled = currentPage <= 1;
    prevBtn.setAttribute("aria-label", "Trang trước");
    prevBtn.addEventListener("click", function () {
        if (currentPage > 1 && typeof onPageChange === "function") {
            onPageChange(currentPage - 1);
        }
    });
    controls.appendChild(prevBtn);

    const pages = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        if (currentPage <= 4) {
            pages.push(1, 2, 3, 4, 5, "...", totalPages);
        } else if (currentPage >= totalPages - 3) {
            pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
            pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
        }
    }

    pages.forEach(function (p) {
        if (p === "...") {
            const ellipsis = document.createElement("span");
            ellipsis.className = "pagination-ellipsis";
            ellipsis.textContent = "…";
            ellipsis.setAttribute("aria-hidden", "true");
            controls.appendChild(ellipsis);
        } else {
            const numBtn = document.createElement("button");
            numBtn.type = "button";
            numBtn.className = "pagination-btn pagination-num" + (p === currentPage ? " active" : "");
            numBtn.textContent = p;
            numBtn.setAttribute("aria-label", "Trang " + p);
            if (p === currentPage) {
                numBtn.setAttribute("aria-current", "page");
            }
            numBtn.addEventListener("click", function () {
                if (p !== currentPage && typeof onPageChange === "function") {
                    onPageChange(p);
                }
            });
            controls.appendChild(numBtn);
        }
    });

    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "pagination-btn pagination-next";
    nextBtn.innerHTML = "Sau →";
    nextBtn.disabled = currentPage >= totalPages;
    nextBtn.setAttribute("aria-label", "Trang sau");
    nextBtn.addEventListener("click", function () {
        if (currentPage < totalPages && typeof onPageChange === "function") {
            onPageChange(currentPage + 1);
        }
    });
    controls.appendChild(nextBtn);

    container.appendChild(info);
    container.appendChild(controls);
};

/* ====================================================================
 * TOGGLE HIỆN / ẨN MẬT KHẨU
 * ==================================================================== */
PTIT.initPasswordToggles = function () {
    document.querySelectorAll("input[type='password']").forEach(input => {
        if (input.parentNode.querySelector(".password-toggle")) return;

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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
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

/* ====================================================================
 * BẮT SỰ KIỆN PHÍM ESCAPE TOÀN TRANG
 * ==================================================================== */
document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
        const openModalElement =
            Array.from(document.querySelectorAll("dialog.modal[open], .overlay.show, .overlay:not([hidden])"))
                .filter(element => !element.hidden)
                .pop();
        if (openModalElement) {
            e.preventDefault();
            PTIT.closeModal(openModalElement.id);
        }
        const sidebar = document.querySelector(".sidebar.open, aside.open");
        if (sidebar) {
            sidebar.classList.remove("open");
            const backdrop = document.getElementById("sidebarBackdrop");
            if (backdrop) backdrop.hidden = true;
        }
    }
});

document.addEventListener("cancel", function (event) {
    const dialog = event.target.closest("dialog.modal");
    if (dialog?.id) {
        event.preventDefault();
        PTIT.closeModal(dialog.id);
    }
}, true);

/* Khởi tạo tự động khi trang tải xong */
document.addEventListener("DOMContentLoaded", function () {
    PTIT.progress.start();
    setTimeout(function () {
        PTIT.progress.done();
    }, 400);

    PTIT.initScrollProgress();
    PTIT.initMobileNav();
    PTIT.initMobileSidebar();
    PTIT.initAccountMenu();
    PTIT.initPasswordToggles();
});

window.PTIT = PTIT;
