/**
 * ====================================================================
 * THƯ VIỆN PTIT - DASHBOARD LOGIC
 * dashboard.js: Tải số liệu tổng quan, top sách mượn nhiều, biểu đồ 6 tháng,
 *               và danh sách sách sắp đến hạn hoàn trả.
 * ====================================================================
 */

const dashboardMessage = document.getElementById("pageMessage");

function dashboardMoney(value) {
    const amount = Number(value);
    return Number.isFinite(amount) ? `${amount.toLocaleString("vi-VN")} ₫` : "—";
}

function dashboardCell(row, value, alignRight = false) {
    const cell = document.createElement("td");
    cell.textContent = value == null ? "—" : String(value);
    if (alignRight) {
        cell.style.textAlign = "right";
        cell.style.fontWeight = "600";
    }
    row.appendChild(cell);
    return cell;
}

function showDashboardError(message) {
    dashboardMessage.textContent = message;
    dashboardMessage.hidden = false;
    dashboardMessage.className = "message error";
}

function showDashboardMessage(message) {
    dashboardMessage.textContent = message;
    dashboardMessage.hidden = false;
    dashboardMessage.className = "message";
}

function dashboardErrorMessage(error) {
    return error && typeof error.message === "string" && error.message.trim()
        ? error.message
        : "Lỗi không xác định.";
}

function formatMonthlyLabel(month) {
    const value = String(month ?? "—");
    const match = value.match(/^(\d{4})-(\d{2})$/);
    return match ? `${match[2]}/${match[1]}` : value;
}

function renderOverview(overview) {
    const metrics = [
        ["totalTitles", "totalTitles"],
        ["totalCopies", "totalCopies"],
        ["borrowingCount", "borrowingCount"],
        ["overdueCount", "overdueCount"],
        ["totalReaders", "totalReaders"],
        ["totalFines", "totalFines"]
    ];

    metrics.forEach(([elementId, field]) => {
        const element = document.getElementById(elementId);
        const value = overview?.[field];
        const numericValue = Number(value);
        const hasValue = value !== undefined && value !== null && Number.isFinite(numericValue);
        const card = element.closest(".stat");

        if (card) card.hidden = !hasValue;
        if (!hasValue) return;

        element.textContent = field === "totalFines"
            ? dashboardMoney(numericValue)
            : numericValue.toLocaleString("vi-VN");
    });
}

function renderOverviewUnavailable() {
    document.querySelectorAll(".stats-grid .stat").forEach(card => {
        card.hidden = false;
        const value = card.querySelector("strong");
        if (value) value.textContent = "—";
    });
}

function renderTopBooks(topBooks) {
    const topBody = document.getElementById("topBooks");
    if (!topBody) return;
    topBody.replaceChildren();

    if (!Array.isArray(topBooks) || topBooks.length === 0) {
        const row = topBody.insertRow();
        const cell = row.insertCell();

        cell.colSpan = 3;
        cell.className = "empty";
        cell.textContent = "Chưa có dữ liệu mượn sách.";

        return;
    }

    topBooks.forEach(book => {
        const row = topBody.insertRow();

        dashboardCell(row, book.title);
        dashboardCell(row, book.author);
        dashboardCell(row, book.borrowCount, true);
    });
}

function renderMonthlyStats(monthly) {
    const monthlyBody = document.getElementById("monthlyStats");
    const chart = document.getElementById("monthlyChart");
    if (!monthlyBody || !chart) return;

    monthlyBody.replaceChildren();
    chart.replaceChildren();

    const selectedMonth = document.getElementById("monthlySelectedMonth");
    const selectedCount = document.getElementById("monthlySelectedCount");
    const selectedTrend = document.getElementById("monthlySelectedTrend");

    if (!Array.isArray(monthly) || monthly.length === 0) {
        const row = monthlyBody.insertRow();
        const cell = row.insertCell();

        cell.colSpan = 2;
        cell.className = "empty";
        cell.textContent = "Chưa có dữ liệu thống kê.";

        if (selectedMonth) selectedMonth.textContent = "—";
        if (selectedCount) selectedCount.textContent = "—";
        if (selectedTrend) selectedTrend.textContent = "Chưa có dữ liệu theo tháng.";
        return;
    }

    const monthlyRecords = monthly.map(item => {
        const loanCount = Number(item?.loanCount);
        if (!item?.month || item.loanCount === undefined || item.loanCount === null || !Number.isFinite(loanCount)) {
            throw new Error("Phản hồi thống kê theo tháng không hợp lệ.");
        }
        return { month: String(item.month), loanCount };
    });
    const maxLoans = Math.max(
        1,
        ...monthlyRecords.map(item => item.loanCount)
    );

    const selectMonth = index => {
        const item = monthlyRecords[index];
        const previous = monthlyRecords[index - 1];
        const count = item.loanCount;

        chart.querySelectorAll(".chart-month").forEach((button, buttonIndex) => {
            const isSelected = buttonIndex === index;
            button.classList.toggle("is-selected", isSelected);
            button.setAttribute("aria-pressed", String(isSelected));
        });
        monthlyBody.querySelectorAll("tr").forEach((tableRow, rowIndex) => {
            tableRow.classList.toggle("is-selected", rowIndex === index);
        });

        if (selectedMonth) selectedMonth.textContent = formatMonthlyLabel(item.month);
        if (selectedCount) selectedCount.textContent = count.toLocaleString("vi-VN");
        if (!selectedTrend) return;

        if (!previous) {
            selectedTrend.textContent = "Tháng đầu tiên trong khoảng thống kê.";
        } else if (previous.loanCount === 0 && count > 0) {
            selectedTrend.textContent = `Phát sinh ${count.toLocaleString("vi-VN")} phiếu so với tháng trước.`;
        } else if (previous.loanCount === 0) {
            selectedTrend.textContent = "Không phát sinh phiếu trong hai tháng liên tiếp.";
        } else {
            const difference = count - previous.loanCount;
            const percentage = Math.round(Math.abs(difference) / previous.loanCount * 100);
            selectedTrend.textContent = difference === 0
                ? "Không đổi so với tháng trước."
                : `${difference > 0 ? "Tăng" : "Giảm"} ${Math.abs(difference).toLocaleString("vi-VN")} phiếu (${percentage}%) so với tháng trước.`;
        }
    };

    monthlyRecords.forEach((item, index) => {
        const row = monthlyBody.insertRow();

        dashboardCell(row, formatMonthlyLabel(item.month));
        dashboardCell(row, item.loanCount, true);

        const column = document.createElement("button");
        column.type = "button";
        column.className = "chart-month";
        column.setAttribute("aria-pressed", "false");
        column.setAttribute(
            "aria-label",
            `Tháng ${formatMonthlyLabel(item.month)}: ${item.loanCount.toLocaleString("vi-VN")} phiếu mượn`
        );
        column.addEventListener("click", () => selectMonth(index));

        const count = document.createElement("span");
        count.className = "chart-count";
        count.textContent = item.loanCount.toLocaleString("vi-VN");

        const bar = document.createElement("span");
        bar.className = "chart-bar";

        const percentage = item.loanCount / maxLoans * 100;

        bar.style.height = `${Math.max(4, percentage)}%`;
        bar.setAttribute("aria-hidden", "true");

        const label = document.createElement("span");
        label.className = "chart-month-label";
        label.textContent = formatMonthlyLabel(item.month);

        column.append(count, bar, label);
        chart.appendChild(column);

        if (index === monthlyRecords.length - 1) {
            row.classList.add("is-selected");
        }
    });

    selectMonth(monthlyRecords.length - 1);
}

function renderUpcomingDue(loans) {
    const upcomingDueBody = document.getElementById("upcomingDueTable");
    if (!upcomingDueBody) return;

    upcomingDueBody.replaceChildren();

    const borrowingLoans = loans
        .filter(loan => PTIT.getLoanStatus(loan).status === "BORROWING")
        .sort((a, b) => {
            const aDue = PTIT.getLoanStatus(a).dueDateKey || "9999-12-31";
            const bDue = PTIT.getLoanStatus(b).dueDateKey || "9999-12-31";
            return aDue.localeCompare(bDue);
        });
    const visibleLoans = borrowingLoans.slice(0, 5);
    const overdueCount = visibleLoans.filter(loan => PTIT.getLoanStatus(loan).isOverdue).length;
    const overdueCountElement = document.getElementById("overdueCount");
    if (overdueCountElement) {
        overdueCountElement.textContent = overdueCount.toLocaleString("vi-VN");
        const card = overdueCountElement.closest(".stat");
        if (card) card.hidden = false;
    }

    if (!borrowingLoans.length) {
        const row = upcomingDueBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 5;
        cell.className = "empty";
        cell.textContent = "Không có sách cần lưu ý";
        return;
    }

    visibleLoans.forEach(loan => {
        const row = upcomingDueBody.insertRow();
        dashboardCell(row, "#" + (loan.id || loan.loan_id || "—"));
        dashboardCell(row, loan.user?.full_name || loan.reader?.full_name || loan.username || "Độc giả");
        dashboardCell(row, loan.book?.title || loan.book_title || "Sách");
        const status = PTIT.getLoanStatus(loan);
        const dueDateText = status.dueDateKey
            ? new Date(`${status.dueDateKey}T00:00:00Z`).toLocaleDateString("vi-VN", {
                timeZone: "Asia/Ho_Chi_Minh"
            })
            : "—";
        dashboardCell(row, dueDateText);

        const statusCell = row.insertCell();
        const badge = document.createElement("span");
        if (status.daysUntilDue < 0) {
            badge.className = "loan-status loan-status--overdue";
            badge.textContent = `Quá hạn ${Math.abs(status.daysUntilDue)} ngày`;
        } else if (status.daysUntilDue !== null && status.daysUntilDue <= 3) {
            badge.className = "loan-status loan-status--pending";
            badge.textContent = `Sắp đến hạn, còn ${status.daysUntilDue} ngày`;
        } else {
            badge.className = `loan-status ${status.statusClass}`;
            badge.textContent = status.label;
        }
        statusCell.appendChild(badge);
    });
}

function renderUpcomingDueError() {
    const upcomingDueBody = document.getElementById("upcomingDueTable");
    if (!upcomingDueBody) return;

    upcomingDueBody.replaceChildren();
    const row = upcomingDueBody.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 5;
    cell.className = "empty";
    cell.textContent = "—";
    const overdueCount = document.getElementById("overdueCount");
    if (overdueCount) overdueCount.textContent = "—";
}

async function loadDashboard() {
    dashboardMessage.hidden = true;
    renderOverviewUnavailable();

    const results = await Promise.allSettled([
        getStatsOverview(),
        getTopBooks(),
        getMonthlyStats(),
        getLoans("BORROWING")
    ]);
    const errors = [];

    if (results[0].status === "fulfilled") {
        const overview = results[0].value;
        if (overview && typeof overview === "object") {
            renderOverview(overview);
        } else {
            renderOverviewUnavailable();
            errors.push("Tổng quan: Phản hồi không hợp lệ.");
        }
    } else {
        renderOverviewUnavailable();
        errors.push(`Tổng quan: ${dashboardErrorMessage(results[0].reason)}`);
    }

    if (results[1].status === "fulfilled") {
        if (Array.isArray(results[1].value)) {
            renderTopBooks(results[1].value);
        } else {
            renderTopBooksUnavailable();
            errors.push("Top sách: Phản hồi không hợp lệ.");
        }
    } else {
        renderTopBooksUnavailable();
        errors.push(`Top sách: ${dashboardErrorMessage(results[1].reason)}`);
    }

    if (results[2].status === "fulfilled") {
        try {
            renderMonthlyStats(results[2].value);
        } catch (error) {
            renderMonthlyUnavailable();
            errors.push(`Thống kê theo tháng: ${dashboardErrorMessage(error)}`);
        }
    } else {
        renderMonthlyUnavailable();
        errors.push(`Thống kê theo tháng: ${dashboardErrorMessage(results[2].reason)}`);
    }

    if (results[3].status === "fulfilled") {
        const loans = results[3].value;
        const loanList = Array.isArray(loans)
            ? loans
            : loans && (loans.items || loans.data);
        if (Array.isArray(loanList)) {
            renderUpcomingDue(loanList);
        } else {
            const error = new Error("Phản hồi danh sách phiếu mượn không hợp lệ.");
            renderUpcomingDueError();
            errors.push(`Phiếu mượn: ${error.message}`);
        }
    } else {
        renderUpcomingDueError();
        errors.push(`Phiếu mượn: ${dashboardErrorMessage(results[3].reason)}`);
    }

    if (errors.length) {
        showDashboardError(`Không thể tải đầy đủ dữ liệu. ${errors.join(" ")} Nhấn "Tải lại" để thử lại.`);
    } else {
        showDashboardMessage("Dữ liệu thống kê đã được cập nhật.");
    }
}

function renderTopBooksUnavailable() {
    const topBody = document.getElementById("topBooks");
    if (!topBody) return;
    topBody.replaceChildren();
    const row = topBody.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 3;
    cell.className = "empty";
    cell.textContent = "—";
}

function renderMonthlyUnavailable() {
    const monthlyBody = document.getElementById("monthlyStats");
    const chart = document.getElementById("monthlyChart");
    if (monthlyBody) {
        monthlyBody.replaceChildren();
        const row = monthlyBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 2;
        cell.className = "empty";
        cell.textContent = "—";
    }
    if (chart) chart.replaceChildren();

    const selectedMonth = document.getElementById("monthlySelectedMonth");
    const selectedCount = document.getElementById("monthlySelectedCount");
    const selectedTrend = document.getElementById("monthlySelectedTrend");
    if (selectedMonth) selectedMonth.textContent = "—";
    if (selectedCount) selectedCount.textContent = "—";
    if (selectedTrend) selectedTrend.textContent = "Không thể tải dữ liệu theo tháng.";
}

const dashboardUser = getCurrentUser();

const dashboardName =
    dashboardUser.full_name ||
    dashboardUser.fullName ||
    dashboardUser.username ||
    "Nhân viên";

document.getElementById("userName").textContent = dashboardName;

PTIT.setAvatar(document.getElementById("userAvatar"), dashboardName);

document.getElementById("refreshButton").addEventListener(
    "click",
    loadDashboard
);

document.getElementById("logoutButton").addEventListener(
    "click",
    async () => {
        await PTIT.confirm("Bạn có chắc chắn muốn đăng xuất?", {
            title: "Đăng xuất",
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
    }
);

if (isAuthorized) {
    loadDashboard();
}
