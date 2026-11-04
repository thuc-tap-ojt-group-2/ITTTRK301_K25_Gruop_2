let books = [];
let isSubmitting = false;

const bookTable = document.getElementById("bookTable");
const bookForm = document.getElementById("bookForm");
const bookModal = document.getElementById("bookModal");
const searchInput = document.getElementById("searchInput");
const messageBox = document.getElementById("message");
const formError = document.getElementById("formError");
const submitButton = document.getElementById("submitBook");

function showMessage(message, type = "info") {
    messageBox.textContent = message;
    messageBox.className = `message ${type}`;
    messageBox.hidden = false;
}

function clearMessage() {
    messageBox.hidden = true;
    messageBox.textContent = "";
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function getBookList(response) {
    if (Array.isArray(response)) return response;

    if (Array.isArray(response?.content)) {
        return response.content;
    }

    if (Array.isArray(response?.items)) {
        return response.items;
    }

    if (Array.isArray(response?.books)) {
        return response.books;
    }

    return [];
}

async function loadBooks() {
    bookTable.innerHTML = `
        <tr>
            <td colspan="6" class="empty">Đang tải dữ liệu...</td>
        </tr>
    `;

    try {
        const response = await getBooks();

        books = getBookList(response);

        renderBooks();
        updateStatistics();

    } catch (error) {
        bookTable.innerHTML = `
            <tr>
                <td colspan="6" class="empty">
                    Không thể tải dữ liệu sách.
                </td>
            </tr>
        `;

        updateStatistics();

        showMessage(
            `${error.message}. Kiểm tra Backend và đường dẫn API trong api.js.`,
            "error"
        );
    }
}

function renderBooks() {
    const keyword = searchInput.value.trim().toLowerCase();

    const filteredBooks = books.filter(book => {
        const title = String(book.title ?? "").toLowerCase();
        const author = String(book.author ?? "").toLowerCase();
        const category = String(book.categoryName ?? "").toLowerCase();
        const id = String(book.id ?? "").toLowerCase();

        return title.includes(keyword)
            || author.includes(keyword)
            || category.includes(keyword)
            || id.includes(keyword);
    });

    if (filteredBooks.length === 0) {
        bookTable.innerHTML = `
            <tr>
                <td colspan="6" class="empty">
                    Không tìm thấy sách phù hợp.
                </td>
            </tr>
        `;

        return;
    }

    bookTable.innerHTML = filteredBooks.map(book => `
        <tr>
            <td>${escapeHTML(book.id)}</td>
            <td class="book-title">${escapeHTML(book.title)}</td>
            <td>${escapeHTML(book.author)}</td>
            <td>
                <span class="category-tag">
                    ${escapeHTML(book.categoryName)}
                </span>
            </td>
            <td>${Number(book.totalCopies ?? 0)}</td>
            <td>${Number(book.availableCopies ?? 0)}</td>
        </tr>
    `).join("");
}

function updateStatistics() {
    document.getElementById("totalTitles").textContent = books.length;

    document.getElementById("totalCopies").textContent = books.reduce(
        (sum, book) => sum + Number(book.totalCopies ?? 0),
        0
    );

    document.getElementById("totalCategories").textContent = new Set(
        books.map(book => book.categoryName).filter(Boolean)
    ).size;
}

function openAddModal() {
    bookForm.reset();

    document.getElementById("bookTotal").value = 1;

    formError.textContent = "";

    bookModal.classList.add("show");

    document.getElementById("bookTitle").focus();
}

function closeModal() {
    bookModal.classList.remove("show");
    formError.textContent = "";
}

function validateBook(book) {
    if (!book.title || !book.author || !book.categoryId) {
        return "Vui lòng nhập đầy đủ tên sách, tác giả và mã thể loại.";
    }

    if (book.title.length > 255) {
        return "Tên sách không được vượt quá 255 ký tự.";
    }

    if (book.author.length > 150) {
        return "Tên tác giả không được vượt quá 150 ký tự.";
    }

    if (!Number.isInteger(book.categoryId) || book.categoryId <= 0) {
        return "Mã thể loại phải là số nguyên lớn hơn 0.";
    }

    if (!Number.isInteger(book.total) || book.total < 1) {
        return "Tổng số bản sách phải là số nguyên từ 1 trở lên.";
    }

    if (book.imageUrl && book.imageUrl.length > 500) {
        return "Đường dẫn ảnh không được vượt quá 500 ký tự.";
    }

    return "";
}

bookForm.addEventListener("submit", async event => {
    event.preventDefault();

    if (isSubmitting) return;

    const book = {
        title: document.getElementById("bookTitle").value.trim(),
        author: document.getElementById("bookAuthor").value.trim(),
        categoryId: Number(document.getElementById("categoryId").value),
        total: Number(document.getElementById("bookTotal").value),
        imageUrl: document.getElementById("imageUrl").value.trim() || null
    };

    const validationMessage = validateBook(book);

    if (validationMessage) {
        formError.textContent = validationMessage;
        return;
    }

    isSubmitting = true;

    submitButton.disabled = true;
    submitButton.textContent = "Đang lưu...";

    formError.textContent = "";
    clearMessage();

    try {
        await createBook(book);

        closeModal();

        await loadBooks();

        showMessage("Thêm sách thành công.", "success");

    } catch (error) {
        formError.textContent = error.message;

    } finally {
        isSubmitting = false;

        submitButton.disabled = false;
        submitButton.textContent = "Lưu sách";
    }
});

document.getElementById("openAddModal").addEventListener("click", openAddModal);

document.getElementById("closeModal").addEventListener("click", closeModal);

document.getElementById("cancelAdd").addEventListener("click", closeModal);

searchInput.addEventListener("input", renderBooks);

bookModal.addEventListener("click", event => {
    if (event.target === bookModal) {
        closeModal();
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeModal();
    }
});

loadBooks();