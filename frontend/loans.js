/**
 * ====================================================================
 * THƯ VIỆN PTIT - QUẢN LÝ PHIẾU MƯỢN
 * loans.js: Duyệt phiếu đăng ký mượn, từ chối, nhận trả sách,
 *           phân loại theo tab trạng thái và tìm kiếm độc giả/sách.
 * ====================================================================
 */

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
const statusTabs = document.getElementById("statusTabs");

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

    return labels[String(status || "").toUpperCase()]
        || status
        || "Không xác định";
}

function getStatusClass(status) {
    const classes = {
        PENDING: "badge--warning",
        BORROWING: "badge--info",
        RETURNED: "badge--success",
        REJECTED: "badge--danger",
        CANCELLED: "badge--neutral",
        RESERVED: "badge--warning"
    };

    return classes[String(status || "").toUpperCase()] || "badge--neutral";
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
    document.getElementById("totalLoans").textContent =
        Number(allLoans.length).toLocaleString("vi-VN");

    document.getElementById("pendingLoans").textContent =
        Number(allLoans.filter(loan =>
            String(loan.status).toUpperCase() === "PENDING"
        ).length).toLocaleString("vi-VN");

    document.getElementById("borrowingLoans").textContent =
        Number(allLoans.filter(loan =>
            String(loan.status).toUpperCase() === "BORROWING"
        ).length).toLocaleString("vi-VN");

    document.getElementById("returnedLoans").textContent =
        Number(allLoans.filter(loan =>
            String(loan.status).toUpperCase() === "RETURNED"
        ).length).toLocaleString("vi-VN");
}

function getFilteredLoans() {
    const keyword = searchInput.value.trim().toLowerCase();
    const selectedStatus = statusFilter.value.toUpperCase();

    return allLoans.filter(loan => {
        const loanId = String(
            getLoanValue(loan, ["id", "loan_id"])
        ).toLowerCase();

        const readerName = getReaderName(loan).toLowerCase();
        const readerCode = getReaderCode(loan).toLowerCase();
        const bookName = getBookName(loan).toLowerCase();
        const status = String(loan.status || "").toUpperCase();

        const matchesKeyword =
            loanId.includes(keyword)
            || readerName.includes(keyword)
            || readerCode.includes(keyword)
            || bookName.includes(keyword);

        const matchesStatus =
            !selectedStatus || status === selectedStatus;

        return matchesKeyword && matchesStatus;
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
                <td colspan="7" class="empty">
                    Không tìm thấy đăng ký mượn nào phù hợp với bộ lọc.
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
                    <td style="font-family: var(--font-mono); font-weight: 700; color: var(--color-primary);">#${escapeHTML(id || "—")}</td>
                    <td>
                        <strong style="color: var(--color-text-main); display: block;">${escapeHTML(readerName)}</strong>
                        ${readerCode
                            ? `<small style="color: var(--color-text-muted); font-family: var(--font-mono);">${escapeHTML(readerCode)}</small>`
                            : ""}
                    </td>
                    <td style="font-weight: 600;">${escapeHTML(bookName)}</td>
                    <td>${formatDate(registeredDate)}</td>
                    <td>${days ? `<span class="badge badge--neutral">${escapeHTML(days)} ngày</span>` : "—"}</td>
                    <td style="text-align: center;">
                        <span class="badge ${getStatusClass(status)}">
                            ${escapeHTML(getStatusText(status))}
                        </span>
                    </td>
                    <td style="text-align: right;">
                        ${status === "PENDING" ? `
                            <div class="loan-actions" style="justify-content: flex-end;">
                                <button
                                    type="button"
                                    class="btn btn--primary btn--sm"
                                    data-action="approve"
                                    data-id="${escapeHTML(id)}"
                                >
                                    Duyệt
                                </button>

                                <button
                                    type="button"
                                    class="btn btn--danger btn--sm"
                                    data-action="reject"
                                    data-id="${escapeHTML(id)}"
                                >
                                    Từ chối
                                </button>
                            </div>
                        ` : status === "BORROWING" ? `
                            <button
                                type="button"
                                class="btn btn--secondary btn--sm"
                                style="color: var(--color-success-dark); border-color: var(--color-success); background-color: var(--color-success-soft);"
                                data-action="return"
                                data-id="${escapeHTML(id)}"
                            >
                                ✓ Trả sách
                            </button>
                        ` : "—"}
                    </td>
                </tr>
            `;
        }).join("");
    }

    pageInfo.textContent = `Trang ${currentPage} / ${totalPages}`;

    previousPageButton.disabled = currentPage <= 1;
    nextPageButton.disabled = currentPage >= totalPages;
}

function showMessage(message, isError = false) {
    messageBox.textContent = message;
    messageBox.className = `message ${isError ? "error" : "success"}`;
    messageBox.hidden = false;
    if (typeof PTIT !== "undefined" && PTIT.showToast) {
        PTIT.showToast(message, isError ? "error" : "success");
    }
}

function hideMessage() {
    messageBox.textContent = "";
    messageBox.hidden = true;
}

async function loadLoans() {
    hideMessage();

    loanTableBody.innerHTML = `
        <tr>
            <td colspan="7" class="empty">
                Đang tải danh sách đăng ký mượn...
            </td>
        </tr>
    `;

    try {
        const loans = await getLoans();

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
            error.message || "Không thể tải danh sách đăng ký mượn.",
            true
        );
    }
}

function updateUserInformation() {
    const user = getCurrentUser() || {};

    const displayName =
        user.full_name
        || user.fullName
        || user.username
        || user.email
        || "Thủ thư";

    document.getElementById("userName").textContent = displayName;

    document.getElementById("userAvatar").textContent =
        String(displayName).trim().charAt(0).toUpperCase() || "U";
    
    const roleSpan = document.querySelector(".user-info span");
    if (roleSpan) {
        roleSpan.textContent = user.role === "ADMIN" ? "Quản trị viên" : "Thủ thư";
    }
}

async function handleLoanAction(button) {
    const loanId = button.dataset.id;
    const action = button.dataset.action;

    if (!["approve", "reject", "return"].includes(action)) {
        return;
    }

    const loan = allLoans.find(
        item => String(item.id || item.loan_id) === String(loanId)
    );

    const expectedStatus = action === "return" ? "BORROWING" : "PENDING";
    if (!loan || String(loan.status).toUpperCase() !== expectedStatus) {
        return;
    }

    if (action === "approve" && typeof approveLoanAPI !== "function") {
        showMessage("Backend chưa cung cấp API duyệt phiếu mượn.", true);
        return;
    }

    if (action === "reject" && typeof rejectLoanAPI !== "function") {
        showMessage("Backend chưa cung cấp API từ chối phiếu mượn.", true);
        return;
    }

    const apiFunction = action === "approve"
        ? approveLoanAPI
        : action === "reject"
            ? rejectLoanAPI
            : returnLoanAPI;

    const actionText = action === "approve"
        ? "duyệt"
        : action === "reject"
            ? "từ chối"
            : "nhận trả";

    const confirmed = confirm(
        `Bạn có chắc chắn muốn ${actionText} phiếu #${loanId}?`
    );

    if (!confirmed) {
        return;
    }

    const rowButtons = button.closest("tr").querySelectorAll(
        "button[data-action]"
    );

    rowButtons.forEach(item => {
        item.disabled = true;
    });

    try {
        await apiFunction(loanId);

        showMessage(`Đã ${actionText} phiếu mượn #${loanId} thành công.`);

        await loadLoans();
    } catch (error) {
        showMessage(
            error.message || `Không thể ${actionText} phiếu mượn.`,
            true
        );
    } finally {
        rowButtons.forEach(item => {
            item.disabled = false;
        });
    }
}

function syncTabsWithSelect(selectedStatus) {
    if (!statusTabs) return;
    statusTabs.querySelectorAll(".tab-btn").forEach(btn => {
        const isMatch = btn.dataset.status === selectedStatus;
        btn.classList.toggle("active", isMatch);
        btn.classList.toggle("btn--primary", isMatch);
        btn.classList.toggle("btn--secondary", !isMatch);
    });
}

if (statusTabs) {
    statusTabs.addEventListener("click", e => {
        const btn = e.target.closest(".tab-btn");
        if (!btn) return;
        const targetStatus = btn.dataset.status;
        statusFilter.value = targetStatus;
        syncTabsWithSelect(targetStatus);
        currentPage = 1;
        displayLoans();
    });
}

statusFilter.addEventListener("change", () => {
    syncTabsWithSelect(statusFilter.value);
    currentPage = 1;
    displayLoans();
});

searchInput.addEventListener("input", () => {
    currentPage = 1;
    displayLoans();
});

document.getElementById("clearFilterButton")
    .addEventListener("click", () => {
        statusFilter.value = "";
        syncTabsWithSelect("");
        searchInput.value = "";
        currentPage = 1;
        displayLoans();
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
    .addEventListener("click", async () => {
        const confirmed = confirm("Bạn có chắc chắn muốn đăng xuất?");
        if (!confirmed) return;

        try {
            await logoutAPI();
        } catch (error) {
            console.error("Không thể thu hồi token đăng xuất:", error);
        }
        window.location.replace("index.html");
    });

loanTableBody.addEventListener("click", async function(event) {
    const button = event.target.closest("button[data-action]");

    if (!button || button.disabled) {
        return;
    }

    await handleLoanAction(button);
});

function initializeLoanPage() {
    if (typeof isAuthorized !== "undefined" && !isAuthorized) {
        return;
    }

    updateUserInformation();
    loadLoans();
}

initializeLoanPage();
