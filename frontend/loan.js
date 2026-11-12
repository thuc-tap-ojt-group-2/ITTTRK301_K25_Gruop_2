
const LOAN_PAGE_SIZE = 10;

let allLoans = [];
let currentPage = 1;

const statusFilter = document.getElementById("statusFilter");
const searchInput = document.getElementById("searchInput");
const loanTableBody = document.getElementById("loanTableBody");
const messageBox = document.getElementById("messageBox");
const resultCount = document.getElementById("resultCount");
const tableCount = document.getElementById("tableCount");
const pageInfo = document.getElementById("pageInfo");
const previousPageButton = document.getElementById("previousPage");
const nextPageButton = document.getElementById("nextPage");

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

function getLoanValue(loan, keys) {
    for (const key of keys) {
        if (loan[key] !== undefined && loan[key] !== null) {
            return loan[key];
        }
    }

    return "";
}

function getStatusText(status) {
    const labels = {
        PENDING: "Chờ duyệt",
        BORROWING: "Đang mượn",
        RETURNED: "Đã trả",
        REJECTED: "Bị từ chối",
        CANCELLED: "Đã hủy",
        RESERVED: "Đặt trước"
    };

    return labels[String(status || "").toUpperCase()] || status || "Không xác định";
}

function getStatusClass(status) {
    const classes = {
        PENDING: "t-warn",
        BORROWING: "t-info",
        RETURNED: "t-ok",
        REJECTED: "t-bad",
        CANCELLED: "t-mut",
        RESERVED: "t-warn"
    };

    return classes[String(status || "").toUpperCase()] || "t-mut";
}

function formatDate(value) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return escapeHTML(value);
    }

    return date.toLocaleDateString("vi-VN");
}

function getReaderName(loan) {
    return loan.user?.full_name
        || loan.user?.name
        || loan.reader?.full_name
        || loan.reader?.name
        || loan.user_name
        || loan.reader_name
        || `Độc giả #${getLoanValue(loan, ["user_id", "reader_id"]) || "—"}`;
}

function getReaderCode(loan) {
    return loan.user?.username
        || loan.user?.student_code
        || loan.reader?.student_code
        || loan.username
        || "";
}

function getBookName(loan) {
    return loan.book?.title
        || loan.book?.name
        || loan.book_title
        || loan.title
        || `Sách #${getLoanValue(loan, ["book_id"]) || "—"}`;
}

function getRegisteredDate(loan) {
    return getLoanValue(loan, [
        "created_at",
        "request_date",
        "registered_at",
        "borrow_date"
    ]);
}

function updateStatistics() {
    document.getElementById("totalLoans").textContent = allLoans.length;

    document.getElementById("pendingLoans").textContent =
        allLoans.filter(loan =>
            String(loan.status).toUpperCase() === "PENDING"
        ).length;

    document.getElementById("borrowingLoans").textContent =
        allLoans.filter(loan =>
            String(loan.status).toUpperCase() === "BORROWING"
        ).length;

    document.getElementById("returnedLoans").textContent =
        allLoans.filter(loan =>
            String(loan.status).toUpperCase() === "RETURNED"
        ).length;
}

function getFilteredLoans() {
    const keyword = searchInput.value.trim().toLowerCase();

    return allLoans.filter(loan => {
        const loanId = String(
            getLoanValue(loan, ["id", "loan_id"])
        ).toLowerCase();

        const readerName = getReaderName(loan).toLowerCase();
        const readerCode = getReaderCode(loan).toLowerCase();
        const bookName = getBookName(loan).toLowerCase();

        return loanId.includes(keyword)
            || readerName.includes(keyword)
            || readerCode.includes(keyword)
            || bookName.includes(keyword);
    });
}

function displayLoans() {
    const filteredLoans = getFilteredLoans();

    const totalPages = Math.max(
        1,
        Math.ceil(filteredLoans.length / LOAN_PAGE_SIZE)
    );

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    const startIndex = (currentPage - 1) * LOAN_PAGE_SIZE;

    const pageLoans = filteredLoans.slice(
        startIndex,
        startIndex + LOAN_PAGE_SIZE
    );

    resultCount.textContent = `${filteredLoans.length} đăng ký`;
    tableCount.textContent = `${filteredLoans.length} kết quả`;

    if (pageLoans.length === 0) {
        loanTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty">
                    Không tìm thấy đăng ký mượn phù hợp.
                </td>
            </tr>
        `;
    } else {
        loanTableBody.innerHTML = pageLoans.map(loan => {
            const id = getLoanValue(loan, ["id", "loan_id"]);
            const readerName = getReaderName(loan);
            const readerCode = getReaderCode(loan);
            const bookName = getBookName(loan);
            const registeredDate = getRegisteredDate(loan);
            const days = getLoanValue(loan, ["days"]);
            const status = String(loan.status || "").toUpperCase();

            return `
                <tr>
                    <td class="loan-id">#${escapeHTML(id || "—")}</td>
                    <td>
                        <b>${escapeHTML(readerName)}</b>
                        ${readerCode
                            ? `<span class="sub-info">${escapeHTML(readerCode)}</span>`
                            : ""}
                    </td>
                    <td>${escapeHTML(bookName)}</td>
                    <td>${formatDate(registeredDate)}</td>
                    <td>${days ? `${escapeHTML(days)} ngày` : "—"}</td>
                    <td>
                        <span class="tag ${getStatusClass(status)}">
                            ${escapeHTML(getStatusText(status))}
                        </span>
                    </td>
                </tr>
            `;
        }).join("");
    }

    pageInfo.textContent = `Trang ${currentPage} / ${totalPages}`;

    previousPageButton.disabled = currentPage <= 1;
    nextPageButton.disabled = currentPage >= totalPages;
}

function showMessage(message) {
    messageBox.textContent = message;
    messageBox.hidden = false;
}

function hideMessage() {
    messageBox.textContent = "";
    messageBox.hidden = true;
}

async function loadLoans() {
    hideMessage();

    loanTableBody.innerHTML = `
        <tr>
            <td colspan="6" class="empty">
                Đang tải danh sách đăng ký...
            </td>
        </tr>
    `;

    try {
        const selectedStatus = statusFilter.value;
        const loans = await getLoans(selectedStatus);

        if (Array.isArray(loans)) {
            allLoans = loans;
        } else if (loans && Array.isArray(loans.items)) {
            allLoans = loans.items;
        } else if (loans && Array.isArray(loans.data)) {
            allLoans = loans.data;
        } else {
            allLoans = [];
        }

        currentPage = 1;
        updateStatistics();
        displayLoans();
    } catch (error) {
        allLoans = [];
        updateStatistics();
        displayLoans();
        showMessage(
            error.message || "Không thể tải danh sách đăng ký mượn."
        );
    }
}

function updateUserInformation() {
    const user = getCurrentUser();

    const displayName =
        user.full_name
        || user.fullName
        || user.username
        || user.email
        || "Thủ thư";

    document.getElementById("userName").textContent = displayName;
    document.getElementById("userAvatar").textContent =
        displayName.charAt(0).toUpperCase();
}

statusFilter.addEventListener("change", loadLoans);

searchInput.addEventListener("input", () => {
    currentPage = 1;
    displayLoans();
});

document.getElementById("clearFilterButton")
    .addEventListener("click", () => {
        statusFilter.value = "";
        searchInput.value = "";
        loadLoans();
    });

document.getElementById("refreshButton")
    .addEventListener("click", loadLoans);

previousPageButton.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        displayLoans();
    }
});

nextPageButton.addEventListener("click", () => {
    const totalPages = Math.max(
        1,
        Math.ceil(getFilteredLoans().length / LOAN_PAGE_SIZE)
    );

    if (currentPage < totalPages) {
        currentPage++;
        displayLoans();
    }
});

document.getElementById("logoutButton")
    .addEventListener("click", () => {
        redirectToLogin();
    });

function initializeLoanPage() {
    if (typeof isAuthorized !== "undefined" && !isAuthorized) {
        return;
    }

    updateUserInformation();
    loadLoans();
}

initializeLoanPage();
