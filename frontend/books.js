let books = [];
let categories = [];
let editingId = null;
let currentPage = 1;
const pageSize = 100;

const bookTable = document.getElementById("bookTable");
const bookModal = document.getElementById("bookModal");
const bookForm = document.getElementById("bookForm");
const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("bookCategory");
const messageBox = document.getElementById("messageBox");

const bookName = document.getElementById("bookName");
const bookAuthor = document.getElementById("bookAuthor");
const bookQuantity = document.getElementById("bookQuantity");
const bookImage = document.getElementById("bookImage");

function showMessage(message, type = "success") {
    messageBox.textContent = message;
    messageBox.className = `message ${type}`;
    messageBox.hidden = false;
}

function hideMessage() {
    messageBox.hidden = true;
}

function getBookCode(id) {
    return "S" + String(id).padStart(3, "0");
}

function updateStatistics() {
    document.getElementById("totalTitles").textContent =
        books.length;

    document.getElementById("totalCopies").textContent =
        books.reduce(
            (sum, book) => sum + Number(book.totalCopies || 0),
            0
        );

    document.getElementById("totalCategories").textContent =
        new Set(
            books.map(book => book.categoryName).filter(Boolean)
        ).size;
}

function updateUserInformation() {
    const user = getCurrentUser();

    const name =
        user.full_name ||
        user.fullName ||
        user.username ||
        user.email ||
        "Thủ thư";

    document.getElementById("userName").textContent = name;

    document.getElementById("userRole").textContent =
        "Quản trị hệ thống";

    document.getElementById("userAvatar").textContent =
        String(name).trim().charAt(0).toUpperCase() || "U";

    document.getElementById("welcomeMessage").textContent =
        `Xin chào, ${name}`;
}

async function loadCategories() {
    const response = await getCategories();

    categories = Array.isArray(response)
        ? response
        : response.content || response.categories || [];

    categorySelect.innerHTML =
        '<option value="">Chọn thể loại</option>';

    categories.forEach(category => {
        const option = document.createElement("option");

        option.value = category.id;
        option.textContent = category.name;

        categorySelect.appendChild(option);
    });
}

async function loadBooks() {
    bookTable.innerHTML = `
        <tr>
            <td colspan="7" class="empty">
                Đang tải dữ liệu sách...
            </td>
        </tr>
    `;

    try {
        const response = await getBooks(currentPage, pageSize);

        books = Array.isArray(response)
            ? response
            : response.content || response.items || response.books || [];

        displayBooks(searchInput.value);

        updateStatistics();

        const pageNumber = response.pageNumber || currentPage;

        const totalPages = Math.max(
            Number(response.totalPages || 1),
            1
        );

        const isLastPage =
            typeof response.last === "boolean"
                ? response.last
                : currentPage >= totalPages;

        document.getElementById("pageInfo").textContent =
            `Trang ${pageNumber} / ${totalPages}`;

        document.getElementById("previousPage").disabled =
            currentPage <= 1;

        document.getElementById("nextPage").disabled =
            isLastPage;

    } catch (error) {
        bookTable.innerHTML = `
            <tr>
                <td colspan="7" class="empty">
                    Không thể tải dữ liệu sách.
                </td>
            </tr>
        `;

        showMessage(error.message, "error");

        books = [];

        updateStatistics();

        document.getElementById("previousPage").disabled = true;
        document.getElementById("nextPage").disabled = true;

        document.getElementById("pageInfo").textContent =
            "Không có dữ liệu";
    }
}

function displayBooks(keyword = "") {
    const normalizedKeyword = keyword.trim().toLowerCase();

    const result = books.filter(book => {
        const title = String(book.title || "").toLowerCase();
        const author = String(book.author || "").toLowerCase();
        const code = getBookCode(book.id).toLowerCase();

        return title.includes(normalizedKeyword) ||
            author.includes(normalizedKeyword) ||
            code.includes(normalizedKeyword);
    });

    if (result.length === 0) {
        bookTable.innerHTML = `
            <tr>
                <td colspan="7" class="empty">
                    Không tìm thấy sách phù hợp.
                </td>
            </tr>
        `;
        return;
    }

    bookTable.innerHTML = result.map(book => `
        <tr>
            <td>${escapeHTML(getBookCode(book.id))}</td>
            <td class="book-name">
                ${escapeHTML(book.title)}
            </td>
            <td>${escapeHTML(book.author)}</td>
            <td>
                <span class="tag">
                    ${escapeHTML(book.categoryName || "Chưa phân loại")}
                </span>
            </td>
            <td>${Number(book.totalCopies || 0)}</td>
            <td>${Number(book.availableCopies || 0)}</td>
            <td>
                <div class="actions">
                    <button
                        class="btn secondary"
                        data-action="edit"
                        data-id="${escapeHTML(book.id)}"
                    >
                        Sửa
                    </button>

                    <button
                        class="btn danger"
                        data-action="delete"
                        data-id="${escapeHTML(book.id)}"
                    >
                        Xóa
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

function openAddModal() {
    editingId = null;

    bookForm.reset();

    document.getElementById("modalTitle").textContent =
        "Thêm sách";

    document.getElementById("saveButton").textContent =
        "Lưu sách";

    hideMessage();

    bookModal.classList.add("show");
}

function closeModal() {
    bookModal.classList.remove("show");
    bookForm.reset();
    editingId = null;
}

function editBook(id) {
    const book = books.find(
        item => String(item.id) === String(id)
    );

    if (!book) {
        return;
    }

    editingId = id;

    document.getElementById("modalTitle").textContent =
        "Chỉnh sửa sách";

    document.getElementById("saveButton").textContent =
        "Cập nhật";

    bookName.value = book.title || "";
    bookAuthor.value = book.author || "";
    bookQuantity.value = book.totalCopies || 1;
    bookImage.value = book.imageUrl || "";

    const category = categories.find(
        item => String(item.id) === String(book.categoryId)
    ) || categories.find(
        item => item.name === book.categoryName
    );

    categorySelect.value = category ? category.id : "";

    hideMessage();

    bookModal.classList.add("show");
}

async function removeBook(id, button = null) {
    const book = books.find(
        item => String(item.id) === String(id)
    );

    if (!book) {
        return;
    }

    const confirmed = confirm(
        `Bạn có chắc muốn xóa sách "${book.title}"?`
    );

    if (!confirmed) {
        return;
    }

    if (button) {
        button.disabled = true;
    }

    try {
        await deleteBookAPI(id);

        if (books.length === 1 && currentPage > 1) {
            currentPage--;
        }

        showMessage("Xóa sách thành công.");

        await loadBooks();

    } catch (error) {
        showMessage(
            "Không thể xóa sách: " + error.message,
            "error"
        );
    } finally {
        if (button) {
            button.disabled = false;
        }
    }
}

function validateBook() {
    const title = bookName.value.trim();
    const author = bookAuthor.value.trim();
    const categoryId = Number(categorySelect.value);
    const total = Number(bookQuantity.value);
    const imageUrl = bookImage.value.trim();

    if (!title || !author || !categoryId) {
        showMessage(
            "Vui lòng nhập đầy đủ tên sách, tác giả và thể loại.",
            "error"
        );

        return null;
    }

    if (total < 1 || !Number.isInteger(total)) {
        showMessage(
            "Tổng số bản phải là số nguyên lớn hơn hoặc bằng 1.",
            "error"
        );

        return null;
    }

    if (imageUrl && !bookImage.checkValidity()) {
        showMessage(
            "Đường dẫn ảnh bìa không hợp lệ.",
            "error"
        );

        return null;
    }

    return {
        title,
        author,
        categoryId,
        total,
        imageUrl: imageUrl || null
    };
}

bookForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    hideMessage();

    const bookData = validateBook();

    if (!bookData) {
        return;
    }

    const saveButton = document.getElementById("saveButton");

    saveButton.disabled = true;

    try {
        if (editingId === null) {
            await createBook(bookData);

            closeModal();

            showMessage("Thêm sách mới thành công.");
        } else {
            await updateBook(editingId, bookData);

            closeModal();

            showMessage("Cập nhật sách thành công.");
        }

        await loadBooks();

    } catch (error) {
        showMessage(error.message, "error");
    } finally {
        saveButton.disabled = false;
    }
});

bookTable.addEventListener("click", async function(event) {
    const button = event.target.closest("button[data-action]");

    if (!button) {
        return;
    }

    const id = button.dataset.id;

    if (button.dataset.action === "edit") {
        editBook(id);
    }

    if (button.dataset.action === "delete") {
        await removeBook(id, button);
    }
});

document.getElementById("addBookButton").addEventListener(
    "click",
    openAddModal
);

document.getElementById("cancelButton").addEventListener(
    "click",
    closeModal
);

searchInput.addEventListener("input", function() {
    displayBooks(this.value);
});

bookModal.addEventListener("click", function(event) {
    if (event.target === bookModal) {
        closeModal();
    }
});

document.getElementById("previousPage").addEventListener(
    "click",
    async function() {
        if (currentPage > 1) {
            currentPage--;
            await loadBooks();
        }
    }
);

document.getElementById("nextPage").addEventListener(
    "click",
    async function() {
        currentPage++;
        await loadBooks();
    }
);

document.getElementById("logoutButton").addEventListener(
    "click",
    function() {
        const confirmed = confirm(
            "Bạn có chắc chắn muốn đăng xuất?"
        );

        if (!confirmed) {
            return;
        }

        localStorage.removeItem("access_token");
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        sessionStorage.clear();

        window.location.replace("index.html");
    }
);

async function initializePage() {
    if (!isAuthorized) {
        return;
    }

    updateUserInformation();

    try {
        await loadCategories();
        await loadBooks();
    } catch (error) {
        showMessage(error.message, "error");
    }
}

initializePage();