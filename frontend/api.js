
const API_BASE_URL = (
    window.PTIT_API_BASE_URL ||
    `${window.location.protocol === "https:" ? "https:" : "http:"}//${window.location.hostname || "127.0.0.1"}:8000`
).replace(/\/+$/, "");

async function apiRequest(path, options = {}) {
    const token = localStorage.getItem("access_token") ||
        localStorage.getItem("token");

    const isPublicAuthRequest =
        path === "/api/auth/login" || path === "/api/auth/register";

    const headers = {
        ...(options.headers || {})
    };

    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    if (token && !isPublicAuthRequest) {
        headers.Authorization = `Bearer ${token}`;
    }

    let response;

    try {
        response = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            headers
        });
    } catch {
        throw new Error(
            "Không thể kết nối Backend. Kiểm tra máy chủ FastAPI."
        );
    }

    const responseText = await response.text();

    let data = null;

    if (responseText) {
        try {
            data = JSON.parse(responseText);
        } catch {
            data = responseText;
        }
    }

    if (
        response.status === 401 &&
        token &&
        path !== "/api/auth/login" &&
        path !== "/api/auth/register"
    ) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("ptit_token");
        localStorage.removeItem("ptit_user");

        window.location.replace("index.html");

        throw new Error("Phiên đăng nhập đã hết hạn.");
    }

    if (response.status === 401 && !token) {
        const detail = data && typeof data === "object" ? data.detail : null;
        throw new Error(typeof detail === "string" ? detail : "Sai thông tin đăng nhập.");
    }

    if (!response.ok) {
        const message =
            typeof data === "object" && data !== null
                ? (
                    Array.isArray(data.detail)
                        ? data.detail.map(item => item.msg).join("; ")
                        : data.detail && typeof data.detail === "object"
                            ? data.detail.message || JSON.stringify(data.detail)
                            : data.detail || data.message || "Có lỗi xảy ra."
                )
                : data || "Có lỗi xảy ra.";

        throw new Error(
            typeof message === "string"
                ? message
                : JSON.stringify(message)
        );
    }

    return data;
}

async function getBooks(page = 1, size = 10, keyword = "", categoryId = "", availability = "") {
    const params = new URLSearchParams({ page, size });

    if (keyword && keyword.trim()) {
        params.set("keyword", keyword.trim());
    }
    if (categoryId) {
        params.set("categoryId", categoryId);
    }
    if (availability) {
        params.set("availability", availability);
    }

    return await apiRequest(`/api/books?${params}`);
}

async function getCategories() {
    return await apiRequest("/api/categories");
}

async function createBook(book) {
    return await apiRequest("/api/books", {
        method: "POST",
        body: JSON.stringify(book)
    });
}

async function updateBook(id, book) {
    return await apiRequest(`/api/books/${id}`, {
        method: "PUT",
        body: JSON.stringify(book)
    });
}

async function deleteBookAPI(id) {
    return await apiRequest(`/api/books/${id}`, {
        method: "DELETE"
    });
}

async function createCategory(category) {
    return await apiRequest("/api/categories", {
        method: "POST",
        body: JSON.stringify(category)
    });
}

async function updateCategory(id, category) {
    return await apiRequest(`/api/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(category)
    });
}

async function deleteCategory(id) {
    return await apiRequest(`/api/categories/${id}`, {
        method: "DELETE"
    });
}

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
        return {};
    }
}

async function getLoans(status = "") {
    const query = status
        ? `?status=${encodeURIComponent(status)}`
        : "";

    return await apiRequest(`/api/loans/${query}`);
}

async function approveLoanAPI(id) {
    return await apiRequest(`/api/loans/${id}/approve`, { method: "PUT" });
}

async function rejectLoanAPI(id) {
    return await apiRequest(`/api/loans/${id}/reject`, { method: "PUT" });
}

async function returnLoanAPI(id) {
    return await apiRequest(`/api/loans/${id}/return`, { method: "PUT" });
}

async function getReaders(keyword = "") {
    const params = new URLSearchParams();

    if (keyword.trim()) {
        params.set("keyword", keyword.trim());
    }

    return await apiRequest(`/api/readers${params.size ? `?${params}` : ""}`);
}

async function getReaderLoans(id) {
    return await apiRequest(`/api/readers/${id}/loans`);
}

async function getFines() {
    return await apiRequest("/api/fines");
}

async function getMyFines() {
    return await apiRequest("/api/fines/mine");
}

async function markFinePaid(id) {
    return await apiRequest(`/api/fines/${id}/paid`, { method: "PUT" });
}

async function changePassword(currentPassword, newPassword) {
    return await apiRequest("/api/auth/password", {
        method: "PUT",
        body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword
        })
    });
}

async function getAdminUsers() {
    return await apiRequest("/api/admin/users");
}

async function updateAdminUserRole(id, role) {
    return await apiRequest(`/api/admin/users/${id}/role`, {
        method: "PUT",
        body: JSON.stringify({ role })
    });
}

async function updateAdminUserLock(id, isLocked) {
    return await apiRequest(`/api/admin/users/${id}/lock`, {
        method: "PUT",
        body: JSON.stringify({ is_locked: isLocked })
    });
}

async function getAdminLogs(limit = 10) {
    return await apiRequest(`/api/admin/logs?limit=${limit}`);
}

async function getStatsOverview() {
    return await apiRequest("/api/stats/overview");
}

async function getTopBooks() {
    return await apiRequest("/api/stats/top-books");
}

async function getMonthlyStats() {
    return await apiRequest("/api/stats/monthly");
}

async function getMyReservations() {
    return await apiRequest("/api/reservations/mine");
}

async function createReservation(bookId) {
    return await apiRequest("/api/reservations", {
        method: "POST",
        body: JSON.stringify({ book_id: bookId })
    });
}

async function cancelReservation(id) {
    return await apiRequest(`/api/reservations/${id}`, { method: "DELETE" });
}

async function logoutAPI() {
    try {
        return await apiRequest("/api/auth/logout", { method: "POST" });
    } finally {
        localStorage.removeItem("access_token");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("ptit_token");
        localStorage.removeItem("ptit_user");
    }
}
