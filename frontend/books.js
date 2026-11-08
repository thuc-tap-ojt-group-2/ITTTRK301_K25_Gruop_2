// ===== Biến dùng chung =====
let books = [];
let categories = [];
let editingId = null;
let currentPage = 1;
let totalBooks = 0;
const pageSize = 100;


const bookTable = document.getElementById("bookTable");
const bookModal = document.getElementById("bookModal");
const bookForm = document.getElementById("bookForm");
const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("bookCategory");
const messageBox = document.getElementById("messageBox");
const saveButton = document.getElementById("saveButton");

const bookName = document.getElementById("bookName");
const bookAuthor = document.getElementById("bookAuthor");
const bookQuantity = document.getElementById("bookQuantity");
const bookImage = document.getElementById("bookImage");


// ===== Thông báo ở trang chính =====
function showMessage(message, type) {
    messageBox.textContent = message;
    messageBox.className = "message " + (type || "success");
    messageBox.hidden = false;
}

function hideMessage() {
    messageBox.hidden = true;
}

// Thêm một lỗi nữa vào thông báo đang hiện (nếu có)
function showMoreError(text) {
    if (messageBox.hidden) {
        showMessage(text, "error");
    } else {
        messageBox.textContent = messageBox.textContent + " " + text;
    }
}


// ===== Thông báo trong hộp thoại =====
// Hộp thoại phủ lên trang nên lỗi phải hiện bên trong hộp thoại mới thấy được
function showModalMessage(message) {
    let box = document.getElementById("modalMessage");

    if (box === null) {
        box = document.createElement("div");
        box.id = "modalMessage";

        const actions = bookForm.querySelector(".modal-actions");

        if (actions) {
            actions.before(box);
        } else {
            bookForm.append(box);
        }
    }

    box.textContent = message;
    box.className = "message error";
    box.hidden = false;
}

function hideModalMessage() {
    const box = document.getElementById("modalMessage");

    if (box !== null) {
        box.hidden = true;
    }
}


// ===== Hàm tiện ích =====
function getBookCode(id) {
    return "S" + String(id).padStart(3, "0");
}

function escapeHTML(value) {
    let text = String(value === null || value === undefined ? "" : value);

    text = text.replace(/&/g, "&amp;");
    text = text.replace(/</g, "&lt;");
    text = text.replace(/>/g, "&gt;");
    text = text.replace(/"/g, "&quot;");
    text = text.replace(/'/g, "&#039;");

    return text;
}

// Bỏ dấu và chữ hoa để gõ "hoc lap trinh" vẫn tìm ra "Học Lập Trình"
function removeAccents(value) {
    let text = String(value === null || value === undefined ? "" : value);

    text = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    text = text.toLowerCase().replace(/đ/g, "d");

    return text;
}

function findBook(id) {
    for (let i = 0; i < books.length; i++) {
        if (books[i].id === id) {
            return books[i];
        }
    }

    return null;
}

// Backend đặt tên trường kiểu nào cũng đọc được (camelCase hoặc snake_case)
function fixBook(book) {
    let categoryName = book.categoryName || book.category_name || "";

    if (categoryName === "" && book.category) {
        categoryName = book.category.name || "";
    }

    return {
        id: book.id,
        title: book.title || book.name || "",
        author: book.author || "",
        categoryName: categoryName,
        totalCopies: book.totalCopies || book.total_copies || book.total || 0,
        availableCopies: book.availableCopies || book.available_copies || book.available || 0,
        imageUrl: book.imageUrl || book.image_url || ""
    };
}

function updateStatistics() {
    document.getElementById("totalTitles").textContent = totalBooks;

    let totalCopies = 0;

    for (let i = 0; i < books.length; i++) {
        totalCopies = totalCopies + Number(books[i].totalCopies);
    }

    document.getElementById("totalCopies").textContent = totalCopies;

    // Nếu đã có danh sách thể loại thì đếm theo đó
    let totalCategories = categories.length;

    if (totalCategories === 0) {
        const names = {};

        for (let i = 0; i < books.length; i++) {
            if (books[i].categoryName !== "") {
                names[books[i].categoryName] = true;
            }
        }

        totalCategories = Object.keys(names).length;
    }

    document.getElementById("totalCategories").textContent = totalCategories;
}

// Khóa nút Lưu khi chưa có thể loại nào để chọn
function updateSaveButton() {
    saveButton.disabled = (categories.length === 0);
}


// ===== Tải thể loại =====
// showError: hàm dùng để hiện lỗi (trang chính hoặc hộp thoại)
// done: hàm chạy sau khi tải xong (không bắt buộc)
function loadCategories(showError, done) {
    categorySelect.disabled = true;
    categorySelect.innerHTML = '<option value="">Đang tải thể loại...</option>';

    getCategories()
        .then(function (data) {
            let list = data.content || data.items || data;

            if (!Array.isArray(list)) {
                list = [];
            }

            categories = list;

            if (categories.length === 0) {
                categorySelect.innerHTML = '<option value="">Chưa có thể loại nào</option>';
            } else {
                categorySelect.innerHTML = '<option value="">Chọn thể loại</option>';
            }

            for (let i = 0; i < categories.length; i++) {
                const option = document.createElement("option");

                option.value = categories[i].id;
                option.textContent = categories[i].name;

                categorySelect.appendChild(option);
            }

            categorySelect.disabled = (categories.length === 0);

            updateSaveButton();
            updateStatistics();

            if (done) {
                done();
            }
        })
        .catch(function (error) {
            categories = [];

            categorySelect.innerHTML = '<option value="">Không tải được thể loại</option>';

            updateSaveButton();

            showError("Không tải được thể loại (" + error.message + ").");
        });
}

// Nếu chưa có thể loại thì thử tải lại, rồi mới chạy done
function makeSureCategories(done) {
    if (categories.length > 0) {
        done();
    } else {
        loadCategories(showModalMessage, done);
    }
}


// ===== Tải danh sách sách =====
// done: hàm chạy sau khi tải xong (không bắt buộc)
function loadBooks(done) {
    bookTable.innerHTML =
        '<tr><td colspan="7" class="empty">Đang tải dữ liệu sách...</td></tr>';

    getBooks(currentPage, pageSize)
        .then(function (response) {
            let list = response.content || response.items || response;

            if (!Array.isArray(list)) {
                list = [];
            }

            books = [];

            for (let i = 0; i < list.length; i++) {
                books.push(fixBook(list[i]));
            }

            totalBooks = response.totalElements || response.total || books.length;

            const totalPages = response.totalPages || response.pages || 1;

            let isLastPage = currentPage >= totalPages;

            if (response.last !== undefined) {
                isLastPage = response.last;
            }

            displayBooks(searchInput.value);
            updateStatistics();

            document.getElementById("pageInfo").textContent =
                "Trang " + currentPage + " / " + totalPages;

            document.getElementById("previousPage").disabled = (currentPage <= 1);
            document.getElementById("nextPage").disabled = isLastPage;

            if (done) {
                done();
            }
        })
        .catch(function (error) {
            books = [];
            totalBooks = 0;

            bookTable.innerHTML =
                '<tr><td colspan="7" class="empty">Không thể tải dữ liệu sách.</td></tr>';

            showMoreError(error.message + " Kiểm tra Backend và đường dẫn API.");

            updateStatistics();
        });
}


// ===== Hiển thị bảng sách =====
function displayBooks(keyword) {
    const search = removeAccents((keyword || "").trim());

    const result = books.filter(function (book) {
        return removeAccents(book.title).includes(search) ||
            removeAccents(book.author).includes(search) ||
            removeAccents(getBookCode(book.id)).includes(search);
    });

    if (result.length === 0) {
        let text = "Không tìm thấy sách phù hợp.";

        if (books.length === 0) {
            text = "Chưa có sách nào. Bấm “Thêm sách” để tạo sách đầu tiên.";
        }

        bookTable.innerHTML =
            '<tr><td colspan="7" class="empty">' + text + "</td></tr>";
        return;
    }

    let html = "";

    for (let i = 0; i < result.length; i++) {
        const book = result[i];

        html +=
            "<tr>" +
            "<td>" + getBookCode(book.id) + "</td>" +
            '<td class="book-name">' + escapeHTML(book.title) + "</td>" +
            "<td>" + escapeHTML(book.author) + "</td>" +
            '<td><span class="tag">' + escapeHTML(book.categoryName) + "</span></td>" +
            "<td>" + book.totalCopies + "</td>" +
            "<td>" + book.availableCopies + "</td>" +
            "<td>" +
                '<div class="actions">' +
                    '<button class="btn secondary" data-action="edit" data-id="' + book.id + '">Sửa</button>' +
                    '<button class="btn danger" data-action="delete" data-id="' + book.id + '">Xóa</button>' +
                "</div>" +
            "</td>" +
            "</tr>";
    }

    bookTable.innerHTML = html;
}


// ===== Hộp thoại thêm, sửa sách =====
function openAddModal() {
    editingId = null;

    bookForm.reset();
    hideModalMessage();

    document.getElementById("modalTitle").textContent = "Thêm sách";
    saveButton.textContent = "Lưu sách";

    bookModal.classList.add("show");

    makeSureCategories(updateSaveButton);
    updateSaveButton();
}

function closeModal() {
    bookModal.classList.remove("show");
    bookForm.reset();
    hideModalMessage();
    editingId = null;
    updateSaveButton();
}

function editBook(id) {
    const book = findBook(id);

    if (book === null) {
        return;
    }

    editingId = id;

    hideModalMessage();

    document.getElementById("modalTitle").textContent = "Chỉnh sửa sách";
    saveButton.textContent = "Cập nhật";

    bookName.value = book.title;
    bookAuthor.value = book.author;
    bookQuantity.value = book.totalCopies;
    bookImage.value = book.imageUrl;

    bookModal.classList.add("show");

    // Chọn đúng thể loại sau khi danh sách thể loại đã có
    makeSureCategories(function () {
        categorySelect.value = "";

        for (let i = 0; i < categories.length; i++) {
            if (categories[i].name === book.categoryName) {
                categorySelect.value = categories[i].id;
            }
        }

        updateSaveButton();
    });
}

function removeBook(id) {
    const book = findBook(id);

    if (book === null) {
        return;
    }

    const confirmed = confirm('Bạn có chắc muốn xóa sách "' + book.title + '"?');

    if (!confirmed) {
        return;
    }

    deleteBookAPI(id)
        .then(function () {
            loadBooks(function () {
                showMessage("Xóa sách thành công.");
            });
        })
        .catch(function (error) {
            showMessage(error.message, "error");
        });
}


// ===== Kiểm tra dữ liệu trong form =====
// Trả về dữ liệu sách nếu hợp lệ, trả về null nếu có lỗi
function getFormData() {
    const title = bookName.value.trim();
    const author = bookAuthor.value.trim();
    const categoryId = Number(categorySelect.value);
    const total = Number(bookQuantity.value);
    const imageUrl = bookImage.value.trim();

    if (title === "" || author === "" || categoryId === 0) {
        showModalMessage("Vui lòng nhập đầy đủ tên sách, tác giả và thể loại.");
        return null;
    }

    if (total < 1 || !Number.isInteger(total)) {
        showModalMessage("Tổng số bản phải là số nguyên lớn hơn hoặc bằng 1.");
        return null;
    }

    if (imageUrl !== "" && !bookImage.checkValidity()) {
        showModalMessage("Đường dẫn ảnh bìa không hợp lệ.");
        return null;
    }

    return {
        title: title,
        author: author,
        categoryId: categoryId,
        total: total,
        imageUrl: imageUrl === "" ? null : imageUrl
    };
}


// ===== Bấm nút Lưu =====
bookForm.addEventListener("submit", function (event) {
    event.preventDefault();

    hideMessage();
    hideModalMessage();

    const bookData = getFormData();

    if (bookData === null) {
        return;
    }

    const isCreating = (editingId === null);

    let request;

    if (isCreating) {
        request = createBook(bookData);
    } else {
        request = updateBook(editingId, bookData);
    }

    saveButton.disabled = true;

    request
        .then(function () {
            closeModal();

            let text = "Cập nhật sách thành công.";

            if (isCreating) {
                text = "Thêm sách mới thành công.";
            }

            loadBooks(function () {
                showMessage(text);
            });
        })
        .catch(function (error) {
            // Hộp thoại vẫn đang mở nên báo lỗi ngay trong hộp thoại
            showModalMessage(error.message);
            updateSaveButton();
        });
});


// ===== Các sự kiện khác =====
bookTable.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");

    if (button === null) {
        return;
    }

    const id = Number(button.dataset.id);

    if (button.dataset.action === "edit") {
        editBook(id);
    }

    if (button.dataset.action === "delete") {
        removeBook(id);
    }
});

document.getElementById("addBookButton").addEventListener("click", openAddModal);

document.getElementById("cancelButton").addEventListener("click", closeModal);

// Gõ xong 300 ms mới tìm, đỡ tìm liên tục khi đang gõ
let searchTimer = null;

searchInput.addEventListener("input", function () {
    const keyword = searchInput.value;

    clearTimeout(searchTimer);

    searchTimer = setTimeout(function () {
        displayBooks(keyword);
    }, 300);
});


bookModal.addEventListener("click", function (event) {
    if (event.target === bookModal) {
        closeModal();
    }
});

document.getElementById("previousPage").addEventListener("click", function () {
    if (currentPage > 1) {
        currentPage = currentPage - 1;
        loadBooks();
    }
});

document.getElementById("nextPage").addEventListener("click", function () {
    if (!this.disabled) {
        currentPage = currentPage + 1;
        loadBooks();
    }
});

document.getElementById("logoutButton").addEventListener("click", function () {
    const confirmed = confirm("Bạn có chắc chắn muốn đăng xuất?");

    if (!confirmed) {
        return;
    }

    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    sessionStorage.clear();

    window.location.href = "login.html";
});



loadBooks();
loadCategories(showMoreError);