function getAccessToken() {
    return localStorage.getItem("access_token") ||
        localStorage.getItem("token");
}

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
        return {};
    }
}

function decodeToken(token) {
    try {
        const payload = token.split(".")[1];
        const normalized = payload
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        const decoded = atob(normalized);
        const bytes = Uint8Array.from(
            decoded,
            character => character.charCodeAt(0)
        );

        return JSON.parse(new TextDecoder().decode(bytes));
    } catch {
        return null;
    }
}

function normalizeRole(role) {
    if (Array.isArray(role)) {
        role = role[0];
    }

    const value = String(role || "").toUpperCase();

    if (["ADMIN", "LIBRARIAN", "THUTHU", "STAFF"].includes(value)) {
        return "ADMIN";
    }

    if (["USER", "READER", "DOCGIA"].includes(value)) {
        return "USER";
    }

    return "";
}

function getUserRole() {
    const token = getAccessToken();
    const payload = token ? decodeToken(token) : null;
    const user = getCurrentUser();

    return normalizeRole(
        payload?.role ||
        payload?.user_role ||
        payload?.roles ||
        user.role ||
        user.user_role ||
        user.roles
    );
}

function redirectToLogin() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.replace("index.html");
}

function requireRole(allowedRoles) {
    const token = getAccessToken();

    if (!token) {
        window.location.replace("index.html");
        return false;
    }

    const payload = decodeToken(token);

    if (!payload) {
        redirectToLogin();
        return false;
    }

    if (payload.exp && Date.now() >= payload.exp * 1000) {
        redirectToLogin();
        return false;
    }

    const role = getUserRole();

    if (!role || !allowedRoles.includes(role)) {
        alert("Bạn không có quyền truy cập trang này.");

        window.location.replace("index.html");

        return false;
    }

    return true;
}

function setupRoleMenu() {
    const role = getUserRole();

    document.querySelectorAll("[data-roles]").forEach(element => {
        const allowedRoles = element.dataset.roles
            .split(",")
            .map(item => normalizeRole(item.trim()));

        element.hidden = !allowedRoles.includes(role);
    });
}

function initializeAuthorization() {
    const allowedRoles = document.body.dataset.roles;

    if (allowedRoles) {
        const roles = allowedRoles
            .split(",")
            .map(role => normalizeRole(role.trim()));

        if (!requireRole(roles)) {
            return false;
        }
    }

    setupRoleMenu();

    return true;
}

const isAuthorized = initializeAuthorization();