/**
 * ====================================================================
 * THƯ VIỆN PTIT - QUẢN LÝ SÁCH & THỂ LOẠI
 * books.js: Tải danh mục sách, thêm/sửa/xóa sách, quản lý thể loại,
 *           tìm kiếm và lọc theo thể loại / tình trạng Còn/Hết sách.
 * ====================================================================
 */
let books = [];
let categories = [];
let editingId = null;
let currentPage = 1;
const pageSize = 10;
let booksLoaded = false;
let categoriesLoaded = false;
let totalTitlesFromServer = null;
let totalCopiesFromServer = null;

const bookTable = document.getElementById("bookTable");
const bookModal = document.getElementById("bookModal");
const bookForm = document.getElementById("bookForm");
const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("bookCategory");
const messageBox = document.getElementById("messageBox");
const modalMessage = document.getElementById("modalMessage");
const categoryForm = document.getElementById("categoryForm");
const categoryNameInput = document.getElementById("categoryName");
const categoryTable = document.getElementById("categoryTable");
const categoryMessage = document.getElementById("categoryMessage");
const filterCategorySelect = document.getElementById("filterCategorySelect");
const filterAvailabilitySelect = document.getElementById("filterAvailabilitySelect");
let categoryEditingId = null;

const bookName = document.getElementById("bookName");
const bookAuthor = document.getElementById("bookAuthor");
const bookQuantity = document.getElementById("bookQuantity");
const bookImage = document.getElementById("bookImage");
const bookCoverPreviewImage = document.getElementById("bookCoverPreviewImage");
const bookPlaceholderUrl = "assets/images/book-placeholder.svg";

function updateBookCoverPreview() {
    if (!bookCoverPreviewImage) return;
    const coverUrl = bookImage.value.trim();
    bookCoverPreviewImage.src = coverUrl || bookPlaceholderUrl;
}

if (bookImage) {
    bookImage.addEventListener("input", updateBookCoverPreview);
}

if (bookCoverPreviewImage) {
    bookCoverPreviewImage.addEventListener("error", () => {
        bookCoverPreviewImage.src = bookPlaceholderUrl;
    });
}

function showMessage(message, type = "success") {
    messageBox.textContent = message;
    messageBox.className = `message ${type}`;
    messageBox.hidden = false;
    if (typeof PTIT !== "undefined" && PTIT.showToast) {
        PTIT.showToast(message, type === "error" ? "error" : "success");
    }
}

function hideMessage() {
    messageBox.hidden = true;
}

function showModalMessage(message, type = "error") {
    modalMessage.textContent = message;
    modalMessage.className = `message ${type}`;
    modalMessage.hidden = false;
}

function hideModalMessage() {
    modalMessage.hidden = true;
    modalMessage.textContent = "";
}

function getBookCode(id) {
    return "S" + String(id).padStart(3, "0");
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

function updateStatistics() {
    const titleLabel = document.getElementById("totalTitlesLabel");
    const copiesLabel = document.getElementById("totalCopiesLabel");
    const hasServerTotalTitles = Number.isInteger(totalTitlesFromServer) && totalTitlesFromServer >= 0;
    const hasServerTotalCopies = Number.isInteger(totalCopiesFromServer) && totalCopiesFromServer >= 0;
    const hasKeyword = Boolean(searchInput && searchInput.value.trim());

    document.getElementById("totalTitles").textContent = !booksLoaded
        ? "—"
        : (hasServerTotalTitles ? totalTitlesFromServer : books.length).toLocaleString("vi-VN");
    if (titleLabel) {
        titleLabel.textContent = hasServerTotalTitles
            ? (hasKeyword ? "Kết quả tìm thấy" : "Tổng đầu sách")
            : "Trong trang này";
    }

    const currentPageCopies = books.reduce(
        (sum, book) => sum + Number(book.totalCopies || 0),
        0
    );
    document.getElementById("totalCopies").textContent = !booksLoaded
        ? "—"
        : (hasServerTotalCopies ? totalCopiesFromServer : currentPageCopies).toLocaleString("vi-VN");
    if (copiesLabel) {
        copiesLabel.textContent = hasServerTotalCopies
            ? "Tổng số bản sách"
            : "Trong trang này";
    }

    document.getElementById("totalCategories").textContent = categoriesLoaded
        ? categories.length.toLocaleString("vi-VN")
        : "—";
}

function updateUserInformation() {
    const user = getCurrentUser() || {};

    const name =
        user.full_name ||
        user.fullName ||
        user.username ||
        user.email ||
        "Thủ thư";

    document.getElementById("userName").textContent = name;
    document.getElementById("userRole").textContent =
        user.role === "LIBRARIAN" ? "Thủ thư" : "Quản trị viên";

    PTIT.setAvatar(document.getElementById("userAvatar"), name);

    const welcome = document.getElementById("welcomeMessage");
    if (welcome) {
        welcome.textContent = `Xin chào, ${name}`;
    }
}

async function loadCategories() {
    const response = await getCategories();

    categories = Array.isArray(response)
        ? response
        : response.content || response.categories || [];
    categoriesLoaded = true;

    categorySelect.innerHTML =
        '<option value="">Chọn thể loại</option>';

    if (filterCategorySelect) {
        filterCategorySelect.innerHTML =
            '<option value="">Tất cả thể loại</option>';
    }

    categories.forEach(category => {
        const option = document.createElement("option");
        option.value = category.id;
        option.textContent = category.name;
        categorySelect.appendChild(option);

        if (filterCategorySelect) {
            const filterOption = document.createElement("option");
            filterOption.value = category.name;
            filterOption.textContent = category.name;
            filterCategorySelect.appendChild(filterOption);
        }
    });

    displayCategories();
    updateStatistics();
}

function showCategoryMessage(message, type = "success") {
    categoryMessage.textContent = message;
    categoryMessage.className = `message ${type}`;
    categoryMessage.hidden = false;
}

function displayCategories() {
    categoryTable.replaceChildren();

    if (!categories.length) {
        const row = categoryTable.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 2;
        cell.className = "empty";
        cell.textContent = "Chưa có thể loại nào được khởi tạo.";
        return;
    }

    categories.forEach(category => {
        const row = categoryTable.insertRow();
        const name = row.insertCell();
        name.textContent = category.name;
        name.style.fontWeight = "600";

        const actions = row.insertCell();
        actions.style.textAlign = "right";

        const edit = document.createElement("button");
        edit.type = "button";
        edit.className = "btn btn--secondary btn--sm";
        edit.textContent = "Sửa";

        edit.addEventListener("click", () => {
            categoryEditingId = category.id;
            categoryNameInput.value = category.name;
            document.getElementById("saveCategoryButton").textContent = "Cập nhật";
            document.getElementById("cancelCategoryEdit").hidden = false;
            categoryNameInput.focus();
        });

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "btn btn--danger btn--sm";
        remove.textContent = "Xóa";
        remove.style.marginLeft = "8px";
        remove.addEventListener("click", async () => {
            await PTIT.confirm(`Bạn có chắc chắn muốn xóa thể loại "${category.name}"?`, {
                danger: true,
                confirmText: "Xóa thể loại",
                onConfirm: async () => {
                    remove.disabled = true;
                    try {
                        await deleteCategory(category.id);
                    } catch (error) {
                        showCategoryMessage("Không thể xóa thể loại: " + error.message, "error");
                        throw error;
                    } finally {
                        remove.disabled = false;
                    }
                    showCategoryMessage("Xóa thể loại thành công.");
                    try {
                        await loadCategories();
                    } catch (error) {
                        showCategoryMessage("Đã xóa thể loại nhưng không thể tải lại danh sách: " + error.message, "error");
                    }
                }
            });
        });

        actions.append(edit, remove);
    });
}

function resetCategoryForm() {
    categoryEditingId = null;
    categoryForm.reset();
    document.getElementById("saveCategoryButton").textContent = "Thêm thể loại";
    document.getElementById("cancelCategoryEdit").hidden = true;
    categoryMessage.hidden = true;
}

categoryForm.addEventListener("submit", async event => {
    event.preventDefault();

    const name = categoryNameInput.value.trim();

    if (!name) return;

    const saveButton = document.getElementById("saveCategoryButton");
    saveButton.disabled = true;

    try {
        if (categoryEditingId === null) {
            await createCategory({ name });
            showCategoryMessage("Thêm thể loại thành công.");
        } else {
            await updateCategory(categoryEditingId, { name });
            showCategoryMessage("Cập nhật thể loại thành công.");
        }

        categoryEditingId = null;
        categoryForm.reset();
        document.getElementById("saveCategoryButton").textContent = "Thêm thể loại";
        document.getElementById("cancelCategoryEdit").hidden = true;

        await loadCategories();
    } catch (error) {
        showCategoryMessage(error.message, "error");
    } finally {
        saveButton.disabled = false;
    }
});

document.getElementById("cancelCategoryEdit").addEventListener("click", resetCategoryForm);

async function loadBooks() {
    bookTable.innerHTML = `
        <tr>
            <td colspan="7" class="empty">
                Đang tải dữ liệu sách từ máy chủ...
            </td>
        </tr>
    `;

    booksLoaded = false;
    totalTitlesFromServer = null;
    totalCopiesFromServer = null;
    updateStatistics();

    try {
        const keyword = searchInput ? searchInput.value.trim() : "";
        const response = await getBooks(currentPage, pageSize, keyword);

        books = Array.isArray(response)
            ? response
            : response.content || response.items || response.books || [];
        const totalElements = Number(response?.totalElements);
        totalTitlesFromServer = response?.totalElements !== undefined
            && response.totalElements !== null
            && Number.isInteger(totalElements)
            && totalElements >= 0
            ? totalElements
            : null;

        let statisticsError = null;
        try {
            const overview = await getStatsOverview();
            const totalCopies = Number(overview?.totalCopies);
            totalCopiesFromServer = overview?.totalCopies !== undefined
                && overview.totalCopies !== null
                && Number.isInteger(totalCopies)
                && totalCopies >= 0
                ? totalCopies
                : null;
            if (totalCopiesFromServer === null) {
                statisticsError = new Error("Backend không trả tổng số bản hợp lệ.");
            }
        } catch (error) {
            totalCopiesFromServer = null;
            statisticsError = error;
        }

        booksLoaded = true;
        displayBooks(searchInput.value);
        updateStatistics();
        if (statisticsError) {
            showMessage(
                `Không thể tải tổng số bản: ${statisticsError.message} Đang hiển thị số bản trong trang này.`,
                "error"
            );
        }

        const totalItems = totalTitlesFromServer ?? books.length;
        const totalPages = Math.max(
            Number(response.totalPages ?? Math.ceil(totalItems / pageSize)),
            1
        );

        const paginationContainer = document.getElementById("booksPagination") || document.querySelector(".pagination");
        if (typeof PTIT !== "undefined" && PTIT.renderPagination && paginationContainer) {
            PTIT.renderPagination({
                container: paginationContainer,
                currentPage: currentPage,
                totalPages: totalPages,
                totalItems: totalItems,
                pageSize: pageSize,
                itemLabel: "cuốn sách",
                onPageChange: async function(newPage) {
                    currentPage = newPage;
                    await loadBooks();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                }
            });
        } else {
            const pageInfo = document.getElementById("pageInfo");
            if (pageInfo) pageInfo.textContent = `Trang ${currentPage} / ${totalPages}`;
            const prev = document.getElementById("previousPage");
            if (prev) prev.disabled = currentPage <= 1;
            const next = document.getElementById("nextPage");
            if (next) next.disabled = currentPage >= totalPages;
        }
    } catch (error) {
        bookTable.innerHTML = `
            <tr>
                <td colspan="7" class="empty">
                    Không thể tải dữ liệu sách.
                </td>
            </tr>
        `;

        books = [];
        booksLoaded = false;
        totalTitlesFromServer = null;
        totalCopiesFromServer = null;
        updateStatistics();

        const prev = document.getElementById("previousPage");
        if (prev) prev.disabled = true;
        const next = document.getElementById("nextPage");
        if (next) next.disabled = true;
        const pageInfo = document.getElementById("pageInfo");
        if (pageInfo) pageInfo.textContent = "Không có dữ liệu";

        showMessage(error.message, "error");
    }
}

function displayBooks(keyword = "") {
    const normalizedKeyword = keyword.trim().toLowerCase();
    const selectedCategory = filterCategorySelect ? filterCategorySelect.value.trim().toLowerCase() : "";
    const selectedAvail = filterAvailabilitySelect ? filterAvailabilitySelect.value : "";

    const result = books.filter(book => {
        const title = String(book.title || "").toLowerCase();
        const author = String(book.author || "").toLowerCase();
        const category = String(book.categoryName || "").toLowerCase();
        const code = getBookCode(book.id).toLowerCase();
        const available = Number(book.availableCopies || 0);

        const matchesKeyword =
            title.includes(normalizedKeyword)
            || author.includes(normalizedKeyword)
            || category.includes(normalizedKeyword)
            || code.includes(normalizedKeyword);

        const matchesCategory =
            !selectedCategory || category === selectedCategory;

        const matchesAvail =
            !selectedAvail
            || (selectedAvail === "available" && available > 0)
            || (selectedAvail === "empty" && available <= 0);

        return matchesKeyword && matchesCategory && matchesAvail;
    });

    if (result.length === 0) {
        bookTable.innerHTML = `
            <tr>
                <td colspan="7" class="empty">
                    Không tìm thấy sách phù hợp với bộ lọc hiện tại.
                </td>
            </tr>
        `;
        return;
    }

    bookTable.innerHTML = result.map(book => {
        const available = Number(book.availableCopies || 0);
        const total = Number(book.totalCopies || 0);

        return `
            <tr>
                <td style="font-family: var(--font-mono); font-weight: 700; color: var(--color-primary);">${escapeHTML(getBookCode(book.id))}</td>
                <td class="book-name" style="font-weight: 600;">${escapeHTML(book.title)}</td>
                <td style="color: var(--color-text-muted);">${escapeHTML(book.author)}</td>
                <td>
                    <span class="badge badge--neutral">
                        ${escapeHTML(book.categoryName || "Chưa phân loại")}
                    </span>
                </td>
                <td style="text-align: center; font-weight: 600;">${total}</td>
                <td style="text-align: center;">
                    <span class="badge ${available > 0 ? 'badge--success' : 'badge--danger'}">
                        ${available > 0 ? `Còn ${available} bản` : 'Hết sách'}
                    </span>
                </td>
                <td style="text-align: right;">
                    <div class="actions">
                        <button
                            class="btn btn--secondary btn--sm"
                            data-action="edit"
                            data-id="${escapeHTML(book.id)}"
                            title="Chỉnh sửa sách"
                        >
                            Sửa
                        </button>

                        <button
                            class="btn btn--danger btn--sm"
                            data-action="delete"
                            data-id="${escapeHTML(book.id)}"
                            title="Xóa sách"
                        >
                            Xóa
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

function openAddModal() {
    editingId = null;
    bookForm.reset();

    document.getElementById("modalTitle").textContent =
        "Thêm sách mới";

    document.getElementById("saveButton").textContent =
        "Lưu sách";

    hideMessage();
    hideModalMessage();
    if (window.PTIT?.openModal) {
        PTIT.openModal("bookModal");
    } else {
        bookModal.hidden = false;
        bookModal.classList.add("show");
    }
    bookModal.hidden = false;
    bookModal.classList.add("show");
}

function closeModal() {
    if (window.PTIT?.closeModal) {
        PTIT.closeModal("bookModal");
        return;
    }
    bookModal.classList.remove("show");
    bookModal.hidden = true;
    bookForm.reset();
    if (bookCoverPreviewImage) {
        bookCoverPreviewImage.src = bookPlaceholderUrl;
    }
    editingId = null;
    hideMessage();
    hideModalMessage();
}

function editBook(id) {
    const book = books.find(
        item => String(item.id) === String(id)
    );

    if (!book) {
        showMessage("Không tìm thấy sách cần chỉnh sửa.", "error");
        return;
    }

    editingId = id;

    document.getElementById("modalTitle").textContent =
        "Chỉnh sửa thông tin sách";

    document.getElementById("saveButton").textContent =
        "Cập nhật";

    bookName.value = book.title || "";
    bookAuthor.value = book.author || "";
    bookQuantity.value = book.totalCopies ?? 1;
    bookImage.value = book.coverUrl || book.imageUrl || "";
    updateBookCoverPreview();

    const category = categories.find(
        item => String(item.id) === String(book.categoryId)
    ) || categories.find(
        item => item.name === book.categoryName
    );

    categorySelect.value = category ? category.id : "";

    hideMessage();
    hideModalMessage();
    if (window.PTIT?.openModal) {
        PTIT.openModal("bookModal");
    } else {
        bookModal.hidden = false;
        bookModal.classList.add("show");
    }
    bookModal.hidden = false;
    bookModal.classList.add("show");
}

function validateBook() {
    const title = bookName.value.trim();
    const author = bookAuthor.value.trim();
    const categoryId = Number(categorySelect.value);
    const total = Number(bookQuantity.value);
    const imageUrl = bookImage.value.trim();

    if (!title || !author || !categoryId) {
        showModalMessage(
            "Vui lòng nhập đầy đủ tên sách, tác giả và thể loại.",
            "error"
        );
        return null;
    }

    if (!Number.isInteger(total) || total < 1) {
        showModalMessage(
            "Tổng số bản phải là số nguyên lớn hơn hoặc bằng 1.",
            "error"
        );
        return null;
    }

    if (editingId !== null) {
        const currentBook = books.find(
            book => String(book.id) === String(editingId)
        );

        if (currentBook) {
            const borrowedCopies =
                Number(currentBook.totalCopies || 0)
                - Number(currentBook.availableCopies || 0)
                - Number(currentBook.reservedCopies || 0);

            if (total < borrowedCopies) {
                showModalMessage(
                    `Tổng số bản không được nhỏ hơn ${borrowedCopies} bản đang được mượn.`,
                    "error"
                );
                return null;
            }
        }
    }

    if (imageUrl && !bookImage.checkValidity()) {
        showModalMessage(
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
        imageUrl: imageUrl || null,
        coverUrl: imageUrl || null
    };
}

async function removeBook(id, button = null) {
    const book = books.find(
        item => String(item.id) === String(id)
    );

    if (!book) {
        return;
    }

    await PTIT.confirm(
        `Bạn có chắc chắn muốn xóa cuốn sách "${book.title}" khỏi hệ thống?`,
        {
            danger: true,
            confirmText: "Xóa sách",
            onConfirm: async () => {
                if (button) button.disabled = true;
                try {
                    await deleteBookAPI(id);
                } catch (error) {
                    showMessage("Không thể xóa sách: " + error.message, "error");
                    throw error;
                } finally {
                    if (button) button.disabled = false;
                }

                if (books.length === 1 && currentPage > 1) currentPage--;
                showMessage("Xóa sách thành công.");
                try {
                    await loadBooks();
                } catch (error) {
                    showMessage("Đã xóa sách nhưng không thể tải lại danh sách: " + error.message, "error");
                }
            }
        }
    );
}

bookForm.addEventListener("submit", async function(event) {
    event.preventDefault();
    hideModalMessage();

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
            showMessage("Cập nhật thông tin sách thành công.");
        }

        await loadBooks();
    } catch (error) {
        showModalMessage(error.message, "error");
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

document.getElementById("addBookButton").addEventListener("click", openAddModal);

let bookSearchDebounce = null;
searchInput.addEventListener("input", function() {
    currentPage = 1;
    clearTimeout(bookSearchDebounce);
    bookSearchDebounce = setTimeout(async function() {
        await loadBooks();
    }, 280);
});

if (filterCategorySelect) {
    filterCategorySelect.addEventListener("change", function() {
        currentPage = 1;
        displayBooks(searchInput.value);
    });
}

if (filterAvailabilitySelect) {
    filterAvailabilitySelect.addEventListener("change", function() {
        currentPage = 1;
        displayBooks(searchInput.value);
    });
}

bookModal.addEventListener("click", function(event) {
    if (event.target === bookModal) {
        closeModal();
    }
});

document.getElementById("previousPage").addEventListener("click", async function() {
    if (currentPage > 1) {
        currentPage--;
        await loadBooks();
    }
});

document.getElementById("nextPage").addEventListener("click", async function() {
    currentPage++;
    await loadBooks();
});

document.getElementById("logoutButton").addEventListener("click", async function() {
    await PTIT.confirm("Bạn có chắc chắn muốn đăng xuất?", {
        confirmText: "Đăng xuất",
        onConfirm: async () => {
            try {
                await logoutAPI();
            } catch (error) {
                throw new Error("Không thể thu hồi token đăng xuất: " + error.message);
            }
            window.location.replace("index.html");
        }
    });
});

async function initializePage() {
    if (!isAuthorized) {
        return;
    }

    updateUserInformation();

    const [categoriesResult] = await Promise.allSettled([
        loadCategories(),
        loadBooks()
    ]);
    if (categoriesResult.status === "rejected") {
        const reason = categoriesResult.reason;
        const message = reason && typeof reason.message === "string"
            ? reason.message
            : "Lỗi không xác định.";
        showMessage(`Không thể tải thể loại: ${message}`, "error");
    }
}

initializePage();
