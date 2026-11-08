const API_BASE_URL = "http://127.0.0.1:8000";

async function apiRequest(path, options = {}) {
    const token = localStorage.getItem("access_token") ||
        localStorage.getItem("token");

    const headers = {
        ...(options.headers || {})
    };

    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
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

    if (response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.replace("index.html");

        throw new Error("Phiên đăng nhập đã hết hạn.");
    }

    if (!response.ok) {
        const message =
            typeof data === "object" && data !== null
                ? data.detail || data.message || "Có lỗi xảy ra."
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