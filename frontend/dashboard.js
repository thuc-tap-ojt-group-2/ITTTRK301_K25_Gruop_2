
const dashboardMessage = document.getElementById("pageMessage");

function dashboardMoney(value) {
    return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

function dashboardCell(row, value) {
    const cell = document.createElement("td");

    cell.textContent = value == null
        ? "—"
        : String(value);

    row.appendChild(cell);
}

function showDashboardError(message) {
    dashboardMessage.textContent = message;
    dashboardMessage.hidden = false;
    dashboardMessage.className = "error";
}

function showDashboardMessage(message) {
    dashboardMessage.textContent = message;
    dashboardMessage.hidden = false;
    dashboardMessage.className = "message";
}

function renderTopBooks(topBooks) {
    const topBody = document.getElementById("topBooks");
    topBody.replaceChildren();

    if (!Array.isArray(topBooks) || topBooks.length === 0) {
        const row = topBody.insertRow();
        const cell = row.insertCell();

        cell.colSpan = 3;
        cell.textContent = "Chưa có dữ liệu mượn sách.";

        return;
    }

    topBooks.forEach(book => {
        const row = topBody.insertRow();

        dashboardCell(row, book.title);
        dashboardCell(row, book.author);
        dashboardCell(row, book.borrowCount);
    });
}

function renderMonthlyStats(monthly) {
    const monthlyBody = document.getElementById("monthlyStats");
    const chart = document.getElementById("monthlyChart");

    monthlyBody.replaceChildren();
    chart.replaceChildren();

    if (!Array.isArray(monthly) || monthly.length === 0) {
        const row = monthlyBody.insertRow();
        const cell = row.insertCell();

        cell.colSpan = 2;
        cell.textContent = "Chưa có dữ liệu thống kê.";

        return;
    }

    const maxLoans = Math.max(
        1,
        ...monthly.map(item => Number(item.loanCount) || 0)
    );

    monthly.forEach(item => {
        const row = monthlyBody.insertRow();

        dashboardCell(row, item.month);
        dashboardCell(row, item.loanCount);

        const column = document.createElement("div");
        column.className = "chart-month";
        column.title = `${item.month}: ${item.loanCount} phiếu`;

        const count = document.createElement("span");
        count.className = "chart-count";
        count.textContent = item.loanCount;

        const bar = document.createElement("span");
        bar.className = "chart-bar";

        const percentage =
            (Number(item.loanCount) || 0) / maxLoans * 100;

        bar.style.height = `${Math.max(2, percentage)}%`;
        bar.setAttribute("aria-hidden", "true");

        const label = document.createElement("span");
        label.textContent = item.month;

        column.append(count, bar, label);
        chart.appendChild(column);
    });
}

async function loadDashboard() {
    dashboardMessage.hidden = true;

    try {
        const [overview, topBooks, monthly] = await Promise.all([
            getStatsOverview(),
            getTopBooks(),
            getMonthlyStats()
        ]);

        document.getElementById("totalBooks").textContent =
            Number(overview.totalBooks || 0).toLocaleString("vi-VN");

        document.getElementById("borrowingCount").textContent =
            Number(overview.borrowingCount || 0).toLocaleString("vi-VN");

        document.getElementById("overdueCount").textContent =
            Number(overview.overdueCount || 0).toLocaleString("vi-VN");

        document.getElementById("totalFines").textContent =
            dashboardMoney(overview.totalFines);

        renderTopBooks(topBooks);
        renderMonthlyStats(monthly);

        showDashboardMessage("Dữ liệu thống kê đã được cập nhật.");
    } catch (error) {
        showDashboardError(
            "Không thể tải thống kê: " + error.message
        );
    }
}

const dashboardUser = getCurrentUser();

const dashboardName =
    dashboardUser.full_name ||
    dashboardUser.fullName ||
    dashboardUser.username ||
    "Nhân viên";

document.getElementById("userName").textContent = dashboardName;

document.getElementById("userAvatar").textContent =
    dashboardName.trim().charAt(0).toUpperCase() || "U";

document.getElementById("refreshButton").addEventListener(
    "click",
    loadDashboard
);

document.getElementById("logoutButton").addEventListener(
    "click",
    async () => {
        try {
            await logoutAPI();
        } catch (error) {
            console.error(
                "Không thể thu hồi token đăng xuất:",
                error
            );
        }

        window.location.replace("index.html");
    }
);

if (isAuthorized) {
    loadDashboard();
}
