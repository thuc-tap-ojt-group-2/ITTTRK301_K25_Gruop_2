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
let catalogStats = { totalTitles: 0, totalCopies: 0 };

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
    document.getElementById("totalTitles").textContent =
        Number(catalogStats.totalTitles || books.length).toLocaleString("vi-VN");

    document.getElementById("totalCopies").textContent =
        Number(
            catalogStats.totalCopies ||
            books.reduce((sum, book) => sum + Number(book.totalCopies || 0), 0)
        ).toLocaleString("vi-VN");

    document.getElementById("totalCategories").textContent =
        categories.length;
}

async function loadCatalogStats() {
    try {
        const overview = await getStatsOverview();
        catalogStats.totalTitles = Number(overview.totalTitles ?? 0);
        catalogStats.totalCopies = Number(overview.totalCopies ?? overview.totalBooks ?? 0);
    } catch {
        // Fallback handled in updateStatistics
    }
    updateStatistics();
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

    document.getElementById("userAvatar").textContent =
        String(name).trim().charAt(0).toUpperCase() || "U";

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
            filterOption.value = category.id;
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
            if (!await PTIT.confirm(`Bạn có chắc chắn muốn xóa thể loại "${category.name}"?`, { danger: true, confirmText: "Xóa thể loại" })) return;

            remove.disabled = true;

            try {
                await deleteCategory(category.id);
                showCategoryMessage("Xóa thể loại thành công.");
                await loadCategories();
            } catch (error) {
                showCategoryMessage("Không thể xóa thể loại: " + error.message, "error");
            } finally {
                remove.disabled = false;
            }
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

    try {
        const keyword = searchInput ? searchInput.value.trim() : "";
        const categoryId = filterCategorySelect ? filterCategorySelect.value : "";
        const availability = filterAvailabilitySelect ? filterAvailabilitySelect.value : "";
        const response = await getBooks(currentPage, pageSize, keyword, categoryId, availability);

        books = Array.isArray(response)
            ? response
            : response.content || response.items || response.books || [];

        if (!keyword && !categoryId && !availability && response && response.totalElements !== undefined && !catalogStats.totalTitles) {
            catalogStats.totalTitles = Number(response.totalElements);
        }

        displayBooks();
        updateStatistics();

        const totalItems = Number(response.totalElements ?? books.length);
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

function displayBooks() {
    const result = books;

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

function closeModal(force = false) {
    if (window.PTIT?.closeModal) {
        PTIT.closeModal("bookModal", { force });
        if (force) {
            editingId = null;
            if (bookCoverPreviewImage) {
                bookCoverPreviewImage.src = bookPlaceholderUrl;
            }
            hideModalMessage();
        }
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

    if (imageUrl && !/^(https?:\/\/|\/|assets\/|covers\/)/i.test(imageUrl)) {
        showModalMessage(
            "Đường dẫn ảnh bìa phải bắt đầu bằng http(s):// hoặc /covers/.",
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

    const confirmed = await PTIT.confirm(
        `Bạn có chắc chắn muốn xóa cuốn sách "${book.title}" khỏi hệ thống?`,
        { danger: true, confirmText: "Xóa sách" }
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
        await Promise.all([loadCatalogStats(), loadBooks()]);
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
            closeModal(true);
            showMessage("Thêm sách mới thành công.");
        } else {
            await updateBook(editingId, bookData);
            closeModal(true);
            showMessage("Cập nhật thông tin sách thành công.");
        }

        await Promise.all([loadCatalogStats(), loadBooks()]);
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
    filterCategorySelect.addEventListener("change", async function() {
        currentPage = 1;
        await loadBooks();
    });
}

if (filterAvailabilitySelect) {
    filterAvailabilitySelect.addEventListener("change", async function() {
        currentPage = 1;
        await loadBooks();
    });
}

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
    const confirmed = await PTIT.confirm("Bạn có chắc chắn muốn đăng xuất?", { confirmText: "Đăng xuất" });
    if (!confirmed) return;

    try {
        await logoutAPI();
    } catch (error) {
        console.error("Không thể thu hồi token đăng xuất:", error);
    }
    window.location.replace("index.html");
});

async function initializePage() {
    if (!isAuthorized) {
        return;
    }

    updateUserInformation();

    const initialKeyword = new URLSearchParams(window.location.search).get("keyword");
    if (initialKeyword && searchInput) {
        searchInput.value = initialKeyword.trim();
    }

    try {
        await loadCategories();
        await Promise.all([loadCatalogStats(), loadBooks()]);
    } catch (error) {
        showMessage(error.message, "error");
    }
}

initializePage();
