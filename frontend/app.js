const API_BASE_URL = (
    window.PTIT_API_BASE_URL ||
    `${window.location.protocol === "https:" ? "https:" : "http:"}//${window.location.hostname || "127.0.0.1"}:8000`
).replace(/\/$/, "");

async function apiRequest(path, options = {}) {
    const token = localStorage.getItem("access_token");

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers
    });

    const responseText = await response.text();

    let data = null;

    if (responseText) {
        try {
            data = JSON.parse(responseText);
        } catch {
            data = responseText;
        }
    }

    if (!response.ok) {
        // Token hết hạn hoặc bị từ chối: xóa phiên và về trang đăng nhập
        if (response.status === 401 && token && !path.startsWith("/api/auth/")) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.replace("login.html?expired=1");
        }

        const message =
            typeof data === "object" && data !== null
                ? (Array.isArray(data.detail)
                    ? data.detail.map(item => item.msg).join("; ")
                    : data.detail && typeof data.detail === "object"
                        ? data.detail.message || JSON.stringify(data.detail)
                        : data.detail || data.message || "Có lỗi xảy ra.")
                : data || "Có lỗi xảy ra.";

        throw new Error(
            typeof message === "string"
                ? message
                : JSON.stringify(message)
        );
    }

    return data;
}


async function getBooks(page = 1, size = 100) {
    return await apiRequest(
        `/api/books?page=${page}&size=${size}`
    );
}


async function getCategories() {
    return await apiRequest("/api/books/categories");
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


// Thông tin người dùng đã lưu lúc đăng nhập (username, role)
function getCurrentUser() {
    return JSON.parse(localStorage.getItem("user") || "{}");
}
