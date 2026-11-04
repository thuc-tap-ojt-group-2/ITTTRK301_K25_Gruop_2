
const defaultBooks = [
    {
        code: "S001",
        name: "Lập trình C cơ bản",
        author: "Nguyễn Thanh Trà",
        category: "Giáo trình",
        quantity: 20,
        available: 15
    },
    {
        code: "S002",
        name: "Cấu trúc dữ liệu và giải thuật",
        author: "Nguyễn Đức Nghĩa",
        category: "Công nghệ thông tin",
        quantity: 15,
        available: 10
    },
    {
        code: "S003",
        name: "Clean Code",
        author: "Robert C. Martin",
        category: "Công nghệ thông tin",
        quantity: 12,
        available: 8
    },
    {
        code: "S004",
        name: "Dế Mèn phiêu lưu ký",
        author: "Tô Hoài",
        category: "Văn học",
        quantity: 10,
        available: 10
    }
];

let books = JSON.parse(localStorage.getItem("ptitBooks")) || defaultBooks;
let editingCode = null;

const bookTable = document.getElementById("bookTable");
const bookModal = document.getElementById("bookModal");
const bookForm = document.getElementById("bookForm");
const searchInput = document.getElementById("searchInput");

function saveBooks() {
    localStorage.setItem("ptitBooks", JSON.stringify(books));
}

function updateStatistics() {
    document.getElementById("totalTitles").textContent = books.length;

    document.getElementById("totalCopies").textContent =
        books.reduce((sum, book) => sum + book.quantity, 0);

    document.getElementById("totalCategories").textContent =
        new Set(books.map(book => book.category)).size;
}

function displayBooks(keyword = "") {
    const result = books.filter(book =>
        book.name.toLowerCase().includes(keyword.toLowerCase()) ||
        book.author.toLowerCase().includes(keyword.toLowerCase()) ||
        book.code.toLowerCase().includes(keyword.toLowerCase())
    );

    if (result.length === 0) {
        bookTable.innerHTML = `
            <tr>
                <td colspan="7" class="empty">
                    Không tìm thấy sách phù hợp.
                </td>
            </tr>
        `;
    } else {
        bookTable.innerHTML = result.map(book => `
            <tr>
                <td>${book.code}</td>
                <td class="book-name">${book.name}</td>
                <td>${book.author}</td>
                <td><span class="tag">${book.category}</span></td>
                <td>${book.quantity}</td>
                <td>${book.available}</td>
                <td>
                    <div class="actions">
                        <button class="btn secondary"
                            onclick="editBook('${book.code}')">
                            Sửa
                        </button>

                        <button class="btn danger"
                            onclick="deleteBook('${book.code}')">
                            Xóa
                        </button>
                    </div>
                </td>
            </tr>
        `).join("");
    }

    updateStatistics();
}

function openAddModal() {
    editingCode = null;
    bookForm.reset();

    document.getElementById("modalTitle").textContent = "Thêm sách";
    document.getElementById("bookCode").disabled = false;

    bookModal.classList.add("show");
}

function closeModal() {
    bookModal.classList.remove("show");
}

function editBook(code) {
    const book = books.find(item => item.code === code);

    if (!book) {
        return;
    }

    editingCode = code;

    document.getElementById("modalTitle").textContent = "Chỉnh sửa sách";
    document.getElementById("bookCode").value = book.code;
    document.getElementById("bookCode").disabled = true;
    document.getElementById("bookName").value = book.name;
    document.getElementById("bookAuthor").value = book.author;
    document.getElementById("bookCategory").value = book.category;
    document.getElementById("bookQuantity").value = book.quantity;

    bookModal.classList.add("show");
}

function deleteBook(code) {
    const book = books.find(item => item.code === code);

    if (!book) {
        return;
    }

    const confirmed = confirm("Bạn có chắc muốn xóa sách " + book.name + "?");

    if (!confirmed) {
        return;
    }

    books = books.filter(item => item.code !== code);

    saveBooks();
    displayBooks(searchInput.value);
}

bookForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const code = document.getElementById("bookCode").value.trim();
    const name = document.getElementById("bookName").value.trim();
    const author = document.getElementById("bookAuthor").value.trim();
    const category = document.getElementById("bookCategory").value;
    const quantity = Number(document.getElementById("bookQuantity").value);

    if (!code || !name || !author || !category || quantity < 1) {
        alert("Vui lòng nhập đầy đủ và chính xác thông tin.");
        return;
    }

    if (editingCode === null) {
        if (books.some(book => book.code.toLowerCase() === code.toLowerCase())) {
            alert("Mã sách đã tồn tại.");
            return;
        }

        books.push({
            code,
            name,
            author,
            category,
            quantity,
            available: quantity
        });
    } else {
        const book = books.find(item => item.code === editingCode);
        const borrowed = book.quantity - book.available;

        if (quantity < borrowed) {
            alert("Tổng số bản không được nhỏ hơn số sách đang được mượn.");
            return;
        }

        book.name = name;
        book.author = author;
        book.category = category;
        book.quantity = quantity;
        book.available = quantity - borrowed;
    }

    saveBooks();
    displayBooks(searchInput.value);
    closeModal();
});

searchInput.addEventListener("input", function() {
    displayBooks(this.value);
});

bookModal.addEventListener("click", function(event) {
    if (event.target === bookModal) {
        closeModal();
    }
});

function logout() {
    const confirmed = confirm("Bạn có chắc chắn muốn đăng xuất?");

    if (!confirmed) {
        return;
    }

    localStorage.removeItem("ptitUser");
    sessionStorage.clear();

    window.location.href = "login.html";
}

displayBooks();
