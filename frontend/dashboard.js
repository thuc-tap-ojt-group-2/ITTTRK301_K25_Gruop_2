const dashboardMessage = document.getElementById("pageMessage");

function dashboardMoney(value) {
    return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

function dashboardCell(row, value) {
    const cell = document.createElement("td");
    cell.textContent = value == null ? "—" : String(value);
    row.appendChild(cell);
}

function showDashboardError(message) {
    dashboardMessage.textContent = message;
    dashboardMessage.hidden = false;
    dashboardMessage.className = "error";
}

async function loadDashboard() {
    dashboardMessage.hidden = true;
    try {
        const [overview, topBooks, monthly] = await Promise.all([
            getStatsOverview(),
            getTopBooks(),
            getMonthlyStats()
        ]);
        document.getElementById("totalBooks").textContent = overview.totalBooks;
        document.getElementById("borrowingCount").textContent = overview.borrowingCount;
        document.getElementById("overdueCount").textContent = overview.overdueCount;
        document.getElementById("totalFines").textContent = dashboardMoney(overview.totalFines);

        const topBody = document.getElementById("topBooks");
        topBody.replaceChildren();
        if (!topBooks.length) {
            const row = topBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 3;
            cell.textContent = "Chưa có dữ liệu mượn sách.";
        } else {
            topBooks.forEach(book => {
                const row = topBody.insertRow();
                dashboardCell(row, book.title);
                dashboardCell(row, book.author);
                dashboardCell(row, book.borrowCount);
            });
        }

        const monthlyBody = document.getElementById("monthlyStats");
        const chart = document.getElementById("monthlyChart");
        monthlyBody.replaceChildren();
        chart.replaceChildren();
        const maxLoans = Math.max(1, ...monthly.map(item => Number(item.loanCount) || 0));
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
            bar.style.height = `${Math.max(2, (Number(item.loanCount) || 0) / maxLoans * 100)}%`;
            bar.setAttribute("aria-hidden", "true");
            const label = document.createElement("span");
            label.textContent = item.month;
            column.append(count, bar, label);
            chart.appendChild(column);
        });
        if (!monthly.length) {
            const row = monthlyBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 2;
            cell.textContent = "Chưa có dữ liệu.";
        }
    } catch (error) {
        showDashboardError("Không thể tải thống kê: " + error.message);
    }
}

const dashboardUser = getCurrentUser();
const dashboardName = dashboardUser.full_name || dashboardUser.fullName || dashboardUser.username || "Nhân viên";
document.getElementById("userName").textContent = dashboardName;
document.getElementById("userAvatar").textContent = dashboardName.trim().charAt(0).toUpperCase() || "U";
document.getElementById("refreshButton").addEventListener("click", loadDashboard);
document.getElementById("logoutButton").addEventListener("click", async () => {
    try {
        await logoutAPI();
    } catch (error) {
        console.error("Không thể thu hồi token đăng xuất:", error);
    }
    window.location.replace("index.html");
});
if (isAuthorized) loadDashboard();
