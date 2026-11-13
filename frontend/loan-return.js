const RETURN_PAGE_SIZE = 10;

let allReturnLoans = [];
let currentReturnPage = 1;
let fineByLoanId = {};

const returnStatusFilter = document.getElementById("statusFilter");
const returnSearchInput = document.getElementById("searchInput");
const returnTableBody = document.getElementById("loanTableBody");
const returnMessageBox = document.getElementById("messageBox");
const returnResultCount = document.getElementById("resultCount");
const returnTableCount = document.getElementById("tableCount");
const returnPageInfo = document.getElementById("pageInfo");
const returnPreviousButton = document.getElementById("previousPage");
const returnNextButton = document.getElementById("nextPage");

function returnEscapeHTML(value) {
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

function returnGetValue(loan, keys) {
    for (const key of keys) {
        if (loan[key] !== undefined && loan[key] !== null) {
            return loan[key];
        }
    }

    return "";
}

function returnGetReaderName(loan) {
    return loan.user?.full_name
        || loan.user?.name
        || loan.reader?.full_name
        || loan.reader?.name
        || loan.user_name
        || loan.reader_name
        || `Độc giả #${returnGetValue(loan, ["user_id", "reader_id"]) || "—"}`;
}

function returnGetReaderCode(loan) {
    return loan.user?.username
        || loan.user?.student_code
        || loan.reader?.student_code
        || loan.username
        || "";
}

function returnGetBookName(loan) {
    return loan.book?.title
        || loan.book?.name
        || loan.book_title
        || loan.title
        || `Sách #${returnGetValue(loan, ["book_id"]) || "—"}`;
}

function returnFormatDate(value) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return returnEscapeHTML(value);
    }

    return date.toLocaleDateString("vi-VN");
}

function returnFormatMoney(value) {
    const amount = Number(value || 0);

    return amount.toLocaleString("vi-VN") + " ₫";
}

function returnGetDueDate(loan) {
    return returnGetValue(loan, ["due_date", "dueDate"]);
}

function returnIsOverdue(loan) {
    const dueDate = returnGetDueDate(loan);

    if (!dueDate || String(loan.status || "").toUpperCase() !== "BORROWING") {
        return false;
    }

    const due = new Date(dueDate);
    const today = new Date();

    if (Number.isNaN(due.getTime())) {
        return false;
    }

    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return due < today;
}

function returnGetFine(loan) {
    const loanId = returnGetValue(loan, ["id", "loan_id"]);
    const fine = fineByLoanId[String(loanId)];

    if (fine && fine.totalFine !== undefined) {
        return Number(fine.totalFine) || 0;
    }

    if (loan.fine && loan.fine.amount !== undefined) {
        return Number(loan.fine.amount) || 0;
    }

    return Number(loan.fine_amount || 0);
}

function returnGetStatus(loan) {
    const status = String(loan.status || "").toUpperCase();

    if (status === "BORROWING" && returnIsOverdue(loan)) {
        return "OVERDUE";
    }

    return status;
}

function returnGetStatusText(status) {
    const labels = {
        BORROWING: "Đang mượn",
        OVERDUE: "Quá hạn",
        RETURNED: "Đã trả"
    };

    return labels[status] || status || "Không xác định";
}

function returnGetStatusClass(status) {
    const classes = {
        BORROWING: "t-info",
        OVERDUE: "t-bad",
        RETURNED: "t-ok"
    };

    return classes[status] || "t-mut";
}

function returnShowMessage(message) {
    returnMessageBox.textContent = message;
    returnMessageBox.hidden = false;
}

function returnHideMessage() {
    returnMessageBox.textContent = "";
    returnMessageBox.hidden = true;
}

async function returnLoadFine(loan) {
    const loanId = returnGetValue(loan, ["id", "loan_id"]);

    if (!loanId || typeof apiRequest !== "function") {
        return;
    }

    try {
        const result = await apiRequest(
            `/api/fines/calculate/${encodeURIComponent(loanId)}`
        );

        fineByLoanId[String(loanId)] = result || {};
    } catch {
        fineByLoanId[String(loanId)] = null;
    }
}

function returnUpdateStatistics() {
    const borrowingLoans = allReturnLoans.filter(
        loan => String(loan.status || "").toUpperCase() === "BORROWING"
    );

    const returnedLoans = allReturnLoans.filter(
        loan => String(loan.status || "").toUpperCase() === "RETURNED"
    );

    const overdueLoans = borrowingLoans.filter(returnIsOverdue);

    const totalFine = borrowingLoans.reduce(
        (total, loan) => total + returnGetFine(loan),
        0
    );

    document.getElementById("borrowingCount").textContent = borrowingLoans.length;
    document.getElementById("overdueCount").textContent = overdueLoans.length;
    document.getElementById("totalFine").textContent = returnFormatMoney(totalFine);
    document.getElementById("returnedCount").textContent = returnedLoans.length;
}

function returnGetFilteredLoans() {
    const keyword = returnSearchInput.value.trim().toLowerCase();
    const selectedStatus = returnStatusFilter.value;

    return allReturnLoans.filter(loan => {
        const status = returnGetStatus(loan);
        const loanId = String(returnGetValue(loan, ["id", "loan_id"])).toLowerCase();
        const readerName = returnGetReaderName(loan).toLowerCase();
        const readerCode = returnGetReaderCode(loan).toLowerCase();
        const bookName = returnGetBookName(loan).toLowerCase();

        const matchesKeyword = loanId.includes(keyword)
            || readerName.includes(keyword)
            || readerCode.includes(keyword)
            || bookName.includes(keyword);

        const matchesStatus = !selectedStatus || status === selectedStatus;

        return matchesKeyword && matchesStatus;
    });
}

function returnDisplayLoans() {
    const filteredLoans = returnGetFilteredLoans();
    const totalPages = Math.max(1, Math.ceil(filteredLoans.length / RETURN_PAGE_SIZE));

    if (currentReturnPage > totalPages) {
        currentReturnPage = totalPages;
    }

    const startIndex = (currentReturnPage - 1) * RETURN_PAGE_SIZE;
    const pageLoans = filteredLoans.slice(startIndex, startIndex + RETURN_PAGE_SIZE);

    returnResultCount.textContent = `${filteredLoans.length} phiếu`;
    returnTableCount.textContent = `${filteredLoans.length} kết quả`;

    if (pageLoans.length === 0) {
        returnTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty">Không tìm thấy phiếu mượn phù hợp.</td>
            </tr>
        `;
    } else {
        returnTableBody.innerHTML = pageLoans.map(loan => {
            const id = returnGetValue(loan, ["id", "loan_id"]);
            const status = returnGetStatus(loan);
            const fine = returnGetFine(loan);
            const borrowDate = returnGetValue(loan, ["borrow_date", "borrowDate", "created_at"]);
            const dueDate = returnGetDueDate(loan);
            const isBorrowing = String(loan.status || "").toUpperCase() === "BORROWING";

            return `
                <tr>
                    <td class="loan-id">#${returnEscapeHTML(id || "—")}</td>
                    <td>
                        <b>${returnEscapeHTML(returnGetReaderName(loan))}</b>
                        ${returnGetReaderCode(loan)
                            ? `<span class="sub-info">${returnEscapeHTML(returnGetReaderCode(loan))}</span>`
                            : ""}
                    </td>
                    <td>${returnEscapeHTML(returnGetBookName(loan))}</td>
                    <td>${returnFormatDate(borrowDate)}</td>
                    <td>${returnFormatDate(dueDate)}</td>
                    <td>${returnFormatMoney(fine)}</td>
                    <td>
                        <span class="tag ${returnGetStatusClass(status)}">
                            ${returnEscapeHTML(returnGetStatusText(status))}
                        </span>
                    </td>
                    <td>
                        ${isBorrowing
                            ? `<button type="button" class="return-button" data-action="return" data-id="${returnEscapeHTML(id)}" disabled title="Đang chờ API nhận trả từ Backend">Nhận trả</button>`
                            : "—"}
                    </td>
                </tr>
            `;
        }).join("");
    }

    returnPageInfo.textContent = `Trang ${currentReturnPage} / ${totalPages}`;
    returnPreviousButton.disabled = currentReturnPage <= 1;
    returnNextButton.disabled = currentReturnPage >= totalPages;
}

async function returnLoadLoans() {
    returnHideMessage();

    returnTableBody.innerHTML = `
        <tr>
            <td colspan="8" class="empty">Đang tải danh sách phiếu mượn...</td>
        </tr>
    `;

    try {
        if (typeof getLoans !== "function") {
            throw new Error("Không tìm thấy hàm getLoans() trong api.js.");
        }

        const result = await getLoans();

        if (Array.isArray(result)) {
            allReturnLoans = result;
        } else if (Array.isArray(result?.items)) {
            allReturnLoans = result.items;
        } else if (Array.isArray(result?.data)) {
            allReturnLoans = result.data;
        } else {
            allReturnLoans = [];
        }

        allReturnLoans = allReturnLoans.filter(loan => {
            const status = String(loan.status || "").toUpperCase();
            return status === "BORROWING" || status === "RETURNED";
        });

        fineByLoanId = {};

        const activeLoans = allReturnLoans.filter(
            loan => String(loan.status || "").toUpperCase() === "BORROWING"
        );

        await Promise.all(activeLoans.map(returnLoadFine));

        currentReturnPage = 1;
        returnUpdateStatistics();
        returnDisplayLoans();
    } catch (error) {
        allReturnLoans = [];
        returnUpdateStatistics();
        returnDisplayLoans();
        returnShowMessage(
            error.message || "Không thể tải danh sách mượn / trả. Kiểm tra API Backend."
        );
    }
}

function returnUpdateUserInformation() {
    const user = typeof getCurrentUser === "function" ? getCurrentUser() || {} : {};
    const displayName = user.full_name
        || user.fullName
        || user.username
        || user.email
        || "Thủ thư";

    document.getElementById("userName").textContent = displayName;
    document.getElementById("userAvatar").textContent =
        String(displayName).trim().charAt(0).toUpperCase() || "U";
}

returnStatusFilter.addEventListener("change", () => {
    currentReturnPage = 1;
    returnDisplayLoans();
});

returnSearchInput.addEventListener("input", () => {
    currentReturnPage = 1;
    returnDisplayLoans();
});

document.getElementById("clearFilterButton").addEventListener("click", () => {
    returnStatusFilter.value = "";
    returnSearchInput.value = "";
    currentReturnPage = 1;
    returnDisplayLoans();
});

document.getElementById("refreshButton").addEventListener("click", returnLoadLoans);

returnPreviousButton.addEventListener("click", () => {
    if (currentReturnPage > 1) {
        currentReturnPage--;
        returnDisplayLoans();
    }
});

returnNextButton.addEventListener("click", () => {
    const totalPages = Math.max(
        1,
        Math.ceil(returnGetFilteredLoans().length / RETURN_PAGE_SIZE)
    );

    if (currentReturnPage < totalPages) {
        currentReturnPage++;
        returnDisplayLoans();
    }
});

document.getElementById("logoutButton").addEventListener("click", () => {
    if (typeof redirectToLogin === "function") {
        redirectToLogin();
    } else {
        window.location.replace("index.html");
    }
});

function initializeReturnPage() {
    if (typeof isAuthorized !== "undefined" && !isAuthorized) {
        return;
    }

    returnUpdateUserInformation();
    returnLoadLoans();
}

initializeReturnPage();