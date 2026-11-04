const API_BASE_URL = "http://127.0.0.1:8000";
const BOOKS_ENDPOINT = "/books";

async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    const responseText = await response.text();

    let data = null;

    if (responseText) {
        try {
            data = JSON.parse(responseText);
        } catch {
            throw new Error("Backend trả về dữ liệu không hợp lệ.");
        }
    }

    if (!response.ok) {
        const detail = data?.detail;

        const message = typeof detail === "string"
            ? detail
            : detail?.message || data?.message || `Lỗi API (${response.status})`;

        throw new Error(message);
    }

    return data;
}

async function getBooks(page = 1, size = 100) {
    return apiRequest(
        `${BOOKS_ENDPOINT}?page=${page}&size=${size}`
    );
}

async function createBook(book) {
    return apiRequest(BOOKS_ENDPOINT, {
        method: "POST",
        body: JSON.stringify(book)
    });
}