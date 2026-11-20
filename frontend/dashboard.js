/**
 * ====================================================================
 * THƯ VIỆN PTIT - DASHBOARD LOGIC
 * dashboard.js: Tải số liệu tổng quan, top sách mượn nhiều, biểu đồ 6 tháng,
 *               và danh sách sách sắp đến hạn hoàn trả.
 * ====================================================================
 */

const dashboardMessage = document.getElementById("pageMessage");

function dashboardMoney(value) {
    return `${Number(value || 0).toLocaleString("vi-VN")} ₫`;
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

async function loadDashboard() {
    dashboardMessage.hidden = true;
    try {
        const [overview, topBooks, monthly] = await Promise.all([
            getStatsOverview(),
            getTopBooks(),
            getMonthlyStats()
        ]);

        // Cập nhật các chỉ số tổng quan
        document.getElementById("totalBooks").textContent = Number(overview.totalBooks || 0).toLocaleString("vi-VN");
        document.getElementById("borrowingCount").textContent = Number(overview.borrowingCount || 0).toLocaleString("vi-VN");
        document.getElementById("overdueCount").textContent = Number(overview.overdueCount || 0).toLocaleString("vi-VN");
        document.getElementById("totalFines").textContent = dashboardMoney(overview.totalFines);

        // Hiển thị danh sách Top 5 sách mượn nhiều nhất
        const topBody = document.getElementById("topBooks");
        topBody.replaceChildren();
        if (!topBooks || !topBooks.length) {
            const row = topBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 3;
            cell.className = "empty";
            cell.textContent = "Chưa có dữ liệu mượn sách.";
        } else {
            topBooks.forEach(book => {
                const row = topBody.insertRow();
                dashboardCell(row, book.title);
                dashboardCell(row, book.author);
                dashboardCell(row, book.borrowCount, true);
            });
        }

        // Hiển thị biểu đồ và bảng thống kê theo tháng
        const monthlyBody = document.getElementById("monthlyStats");
        const chart = document.getElementById("monthlyChart");
        monthlyBody.replaceChildren();
        chart.replaceChildren();

        const safeMonthly = Array.isArray(monthly) ? monthly : [];
        const maxLoans = Math.max(1, ...safeMonthly.map(item => Number(item.loanCount) || 0));

        safeMonthly.forEach(item => {
            const row = monthlyBody.insertRow();
            dashboardCell(row, item.month);
            dashboardCell(row, item.loanCount, true);

            const column = document.createElement("div");
            column.className = "chart-month";
            column.title = `${item.month}: ${item.loanCount} phiếu`;

            const count = document.createElement("span");
            count.className = "chart-count";
            count.textContent = item.loanCount;

            const bar = document.createElement("span");
            bar.className = "chart-bar";
            bar.style.height = `${Math.max(4, (Number(item.loanCount) || 0) / maxLoans * 100)}%`;
            bar.setAttribute("aria-hidden", "true");

            const label = document.createElement("span");
            label.textContent = item.month;

            column.append(count, bar, label);
            chart.appendChild(column);
        });

        if (!safeMonthly.length) {
            const row = monthlyBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 2;
            cell.className = "empty";
            cell.textContent = "Chưa có dữ liệu theo tháng.";
        }

        // Tải danh sách sách sắp đến hạn & đang mượn
        const upcomingDueBody = document.getElementById("upcomingDueTable");
        if (upcomingDueBody && typeof getLoans === "function") {
            try {
                const loans = await getLoans("BORROWING");
                const loanList = Array.isArray(loans) ? loans : (loans.items || loans.data || []);
                upcomingDueBody.replaceChildren();

                if (!loanList.length) {
                    const row = upcomingDueBody.insertRow();
                    const cell = row.insertCell();
                    cell.colSpan = 5;
                    cell.className = "empty";
                    cell.textContent = "Hiện không có phiếu mượn nào đang trong trạng thái mượn.";
                } else {
                    loanList.slice(0, 5).forEach(loan => {
                        const row = upcomingDueBody.insertRow();
                        dashboardCell(row, "#" + (loan.id || loan.loan_id || "—"));
                        dashboardCell(row, loan.user?.full_name || loan.reader?.full_name || loan.username || "Độc giả");
                        dashboardCell(row, loan.book?.title || loan.book_title || "Sách");
                        dashboardCell(row, loan.due_date ? new Date(loan.due_date).toLocaleDateString("vi-VN") : "14 ngày");
                        
                        const statusCell = row.insertCell();
                        const badge = document.createElement("span");
                        badge.className = "badge badge--info";
                        badge.textContent = "Đang mượn";
                        statusCell.appendChild(badge);
                    });
                }
            } catch {
                // Không bắt buộc nếu backend chưa có filter
            }
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
