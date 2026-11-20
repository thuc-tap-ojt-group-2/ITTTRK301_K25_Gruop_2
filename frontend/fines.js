/**
 * ====================================================================
 * THƯ VIỆN PTIT - QUẢN LÝ TIỀN PHẠT
 * fines.js: Tải danh sách khoản phạt quá hạn, tính tổng tiền phạt nổi bật,
 *           hiển thị badge trạng thái và xử lý thu tiền phạt.
 * ====================================================================
 */

const fineTable = document.getElementById("fineTable");
const fineMessage = document.getElementById("pageMessage");
const FINE_PAGE_SIZE = 10;
let currentFinePage = 1;
let allFines = [];

function fineMoney(value) {
    return `${Number(value || 0).toLocaleString("vi-VN")} ₫`;
}

function renderFinePage() {
    fineTable.replaceChildren();

    const totalItems = allFines.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / FINE_PAGE_SIZE));
    if (currentFinePage > totalPages) currentFinePage = totalPages;

    const startIdx = (currentFinePage - 1) * FINE_PAGE_SIZE;
    const pageFines = allFines.slice(startIdx, startIdx + FINE_PAGE_SIZE);

    if (!pageFines.length) {
        const cell = fineTable.insertRow().insertCell();
        cell.colSpan = 7;
        cell.className = "empty";
        cell.textContent = "Hiện không có khoản phạt nào trong hệ thống.";
    } else {
        pageFines.forEach(fine => {
            const row = fineTable.insertRow();

            // Mã phiếu
            const idCell = row.insertCell();
            idCell.textContent = `#${fine.loanId || "—"}`;
            idCell.style.fontFamily = "var(--font-mono)";
            idCell.style.fontWeight = "700";
            idCell.style.color = "var(--color-primary)";

            // Độc giả
            const readerCell = row.insertCell();
            readerCell.textContent = fine.username || "Độc giả";
            readerCell.style.fontWeight = "600";

            // Sách
            const bookCell = row.insertCell();
            bookCell.textContent = fine.bookTitle || "Sách";

            // Số ngày trễ
            const daysCell = row.insertCell();
            daysCell.style.textAlign = "center";
            const overdueDays = Number(fine.overdueDays || 0);
            daysCell.innerHTML = `<span class="badge ${overdueDays > 7 ? 'badge--danger' : 'badge--warning'}">${overdueDays} ngày</span>`;

            // Số tiền phạt
            const amountCell = row.insertCell();
            amountCell.style.textAlign = "right";
            amountCell.style.fontWeight = "700";
            amountCell.style.color = "var(--color-danger)";
            amountCell.textContent = fineMoney(fine.amount);

            // Trạng thái badge
            const statusCell = row.insertCell();
            statusCell.style.textAlign = "center";
            const statusBadge = document.createElement("span");

            if (fine.type === "PROVISIONAL") {
                statusBadge.className = "badge badge--warning";
                statusBadge.textContent = "Tạm tính";
            } else if (fine.paid) {
                statusBadge.className = "badge badge--success";
                statusBadge.textContent = "Đã nộp";
            } else {
                statusBadge.className = "badge badge--danger";
                statusBadge.textContent = "Chưa nộp";
            }
            statusCell.appendChild(statusBadge);

            // Thao tác
            const actionCell = row.insertCell();
            actionCell.style.textAlign = "right";

            if (fine.type === "FINALIZED" && !fine.paid) {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "btn btn--primary btn--sm";
                button.textContent = "Đã thu tiền";
                button.addEventListener("click", async () => {
                    const confirmed = confirm(`Xác nhận đã thu đủ số tiền ${fineMoney(fine.amount)} cho phiếu mượn #${fine.loanId}?`);
                    if (!confirmed) return;

                    button.disabled = true;
                    try {
                        await markFinePaid(fine.id);
                        if (typeof PTIT !== "undefined" && PTIT.showToast) {
                            PTIT.showToast(`Đã thu ${fineMoney(fine.amount)} cho phiếu #${fine.loanId}`, "success");
                        }
                        await loadFines();
                    } catch (error) {
                        fineMessage.textContent = "Không thể cập nhật khoản phạt: " + error.message;
                        fineMessage.className = "message error";
                        fineMessage.hidden = false;
                    } finally {
                        button.disabled = false;
                    }
                });
                actionCell.appendChild(button);
            } else {
                actionCell.textContent = "—";
                actionCell.style.color = "var(--color-text-light)";
            }
        });
    }

    const paginationContainer = document.getElementById("finesPagination");
    if (typeof PTIT !== "undefined" && PTIT.renderPagination && paginationContainer) {
        PTIT.renderPagination({
            container: paginationContainer,
            currentPage: currentFinePage,
            totalPages: totalPages,
            totalItems: totalItems,
            pageSize: FINE_PAGE_SIZE,
            itemLabel: "khoản phạt",
            onPageChange: function(newPage) {
                currentFinePage = newPage;
                renderFinePage();
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        });
    }
}

async function loadFines() {
    fineMessage.hidden = true;
    try {
        const fines = await getFines();
        allFines = Array.isArray(fines) ? fines : [];

        document.getElementById("fineCount").textContent = `${allFines.length} khoản phạt`;

        // Tính tổng tiền phạt chưa thanh toán
        const totalUnpaid = allFines
            .filter(fine => !fine.paid)
            .reduce((sum, fine) => sum + Number(fine.amount || 0), 0);
        
        const totalFinesEl = document.getElementById("totalFinesSum");
        if (totalFinesEl) {
            totalFinesEl.textContent = fineMoney(totalUnpaid);
        }

        currentFinePage = 1;
        renderFinePage();
    } catch (error) {
        fineTable.replaceChildren();
        fineMessage.textContent = "Không thể tải danh sách khoản phạt: " + error.message;
        fineMessage.className = "message error";
        fineMessage.hidden = false;
    }
}

const fineUser = getCurrentUser();
const fineUserName = fineUser.full_name || fineUser.fullName || fineUser.username || "Nhân viên";
document.getElementById("userName").textContent = fineUserName;
document.getElementById("userAvatar").textContent = fineUserName.trim().charAt(0).toUpperCase() || "U";
document.getElementById("refreshButton").addEventListener("click", loadFines);
document.getElementById("logoutButton").addEventListener("click", async () => {
    const confirmed = confirm("Bạn có chắc chắn muốn đăng xuất?");
    if (!confirmed) return;

    try {
        await logoutAPI();
    } catch (error) {
        console.error("Không thể thu hồi token đăng xuất:", error);
    }
    window.location.replace("index.html");
});

if (isAuthorized) loadFines();
