/**
 * ====================================================================
 * THƯ VIỆN PTIT - QUẢN LÝ ĐỘC GIẢ
 * readers.js: Tải danh sách độc giả, avatar chữ cái đầu, badge trạng thái,
 *             tìm kiếm độc giả và xem lịch sử các lượt mượn sách.
 * ====================================================================
 */

const readerTable = document.getElementById("readerTable");
const readerMessage = document.getElementById("pageMessage");
const readerSearch = document.getElementById("searchInput");
let readerSearchTimer;
const READER_PAGE_SIZE = 10;
let currentReaderPage = 1;
let allReaders = [];

const avatarColors = ["#0F5C42", "#1F528D", "#C8913A", "#6A4C93", "#1E8E5A", "#C0392B"];

function showReaderError(message) {
    readerMessage.textContent = message;
    readerMessage.hidden = false;
    readerMessage.className = "message error";
    if (typeof PTIT !== "undefined" && PTIT.showToast) {
        PTIT.showToast(message, "error");
    }
}

async function showReaderHistory(reader) {
    const body = document.getElementById("historyTable");
    body.replaceChildren();
    document.getElementById("historyTitle").textContent = `Lịch sử mượn sách — ${reader.fullName || reader.username}`;

    try {
        const history = await getReaderLoans(reader.id);
        if (!history || !history.length) {
            const row = body.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 5;
            cell.className = "empty";
            cell.textContent = "Độc giả chưa có lịch sử mượn sách nào.";
        } else {
            history.forEach(loan => {
                const row = body.insertRow();
                const bookCell = row.insertCell();
                bookCell.textContent = loan.bookTitle || loan.book?.title || "—";
                bookCell.style.fontWeight = "600";

                const statusCell = row.insertCell();
                const statusBadge = document.createElement("span");
                const st = String(loan.status || "").toUpperCase();
                statusBadge.className = `badge ${st === "RETURNED" ? "badge--success" : st === "BORROWING" ? "badge--info" : "badge--warning"}`;
                statusBadge.textContent = st === "RETURNED" ? "Đã trả" : st === "BORROWING" ? "Đang mượn" : "Chờ duyệt";
                statusCell.appendChild(statusBadge);

                const borrowCell = row.insertCell();
                borrowCell.textContent = loan.borrowDate ? new Date(loan.borrowDate).toLocaleDateString("vi-VN") : "—";

                const dueCell = row.insertCell();
                dueCell.textContent = loan.dueDate ? new Date(loan.dueDate).toLocaleDateString("vi-VN") : "—";

                const returnCell = row.insertCell();
                returnCell.textContent = loan.returnDate ? new Date(loan.returnDate).toLocaleDateString("vi-VN") : "—";
            });
        }
        if (window.PTIT?.openModal) {
            PTIT.openModal("historyDialog");
        } else {
            document.getElementById("historyDialog").showModal();
        }
    } catch (error) {
        showReaderError("Không thể tải lịch sử mượn: " + error.message);
    }
}

function renderReaderPage() {
    readerTable.replaceChildren();

    const totalItems = allReaders.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / READER_PAGE_SIZE));
    if (currentReaderPage > totalPages) currentReaderPage = totalPages;

    const startIdx = (currentReaderPage - 1) * READER_PAGE_SIZE;
    const pageReaders = allReaders.slice(startIdx, startIdx + READER_PAGE_SIZE);

    if (!pageReaders.length) {
        const cell = readerTable.insertRow().insertCell();
        cell.colSpan = 6;
        cell.className = "empty";
        cell.textContent = "Không tìm thấy độc giả nào phù hợp.";
    } else {
        pageReaders.forEach((reader) => {
            const row = readerTable.insertRow();

            // Mã sinh viên
            const codeCell = row.insertCell();
            codeCell.textContent = reader.username || "—";
            codeCell.style.fontFamily = "var(--font-mono)";
            codeCell.style.fontWeight = "700";
            codeCell.style.color = "var(--color-primary)";

            // Họ tên kèm Avatar chữ cái đầu
            const nameCell = row.insertCell();
            const displayName = reader.fullName || reader.username || "Độc giả";
            const initial = displayName.trim().charAt(0).toUpperCase() || "U";
            const color = avatarColors[Math.abs(displayName.charCodeAt(0)) % avatarColors.length];

            const nameWrap = document.createElement("div");
            nameWrap.style.display = "flex";
            nameWrap.style.alignItems = "center";
            nameWrap.style.gap = "10px";

            const avatarEl = document.createElement("span");
            avatarEl.className = "avatar";
            avatarEl.style.width = "34px";
            avatarEl.style.height = "34px";
            avatarEl.style.fontSize = "14px";
            avatarEl.style.backgroundColor = color;
            avatarEl.textContent = initial;

            const nameStrong = document.createElement("strong");
            nameStrong.textContent = displayName;
            nameStrong.style.color = "var(--color-text-main)";

            nameWrap.append(avatarEl, nameStrong);
            nameCell.appendChild(nameWrap);

            // Email
            const emailCell = row.insertCell();
            emailCell.textContent = reader.email || "—";
            emailCell.style.color = "var(--color-text-muted)";

            // Trạng thái (badge)
            const statusCell = row.insertCell();
            statusCell.style.textAlign = "center";
            const statusBadge = document.createElement("span");
            statusBadge.className = `badge ${reader.active ? "badge--success" : "badge--danger"}`;
            statusBadge.textContent = reader.active ? "Hoạt động" : "Đã khóa";
            statusCell.appendChild(statusBadge);

            // Phiếu hoạt động
            const loanCountCell = row.insertCell();
            loanCountCell.style.textAlign = "center";
            const loanCountBadge = document.createElement("span");
            loanCountBadge.className = "badge badge--neutral";
            loanCountBadge.textContent = `${reader.borrowingCount || 0} phiếu`;
            loanCountCell.appendChild(loanCountBadge);

            // Thao tác
            const actionCell = row.insertCell();
            actionCell.style.textAlign = "right";

            const historyBtn = document.createElement("button");
            historyBtn.type = "button";
            historyBtn.className = "btn btn--secondary btn--sm";
            historyBtn.textContent = "Lịch sử";
            historyBtn.title = "Xem lịch sử mượn sách";
            historyBtn.addEventListener("click", () => showReaderHistory(reader));

            actionCell.appendChild(historyBtn);
        });
    }

    const paginationContainer = document.getElementById("readersPagination");
    if (typeof PTIT !== "undefined" && PTIT.renderPagination && paginationContainer) {
        PTIT.renderPagination({
            container: paginationContainer,
            currentPage: currentReaderPage,
            totalPages: totalPages,
            totalItems: totalItems,
            pageSize: READER_PAGE_SIZE,
            itemLabel: "độc giả",
            onPageChange: function(newPage) {
                currentReaderPage = newPage;
                renderReaderPage();
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        });
    }
}

async function loadReaders() {
    readerMessage.hidden = true;
    readerTable.replaceChildren();
    const loading = readerTable.insertRow().insertCell();
    loading.colSpan = 6;
    loading.className = "empty";
    loading.textContent = "Đang tải danh sách độc giả...";

    try {
        const readers = await getReaders(readerSearch.value);
        allReaders = Array.isArray(readers) ? readers : [];
        currentReaderPage = 1;
        renderReaderPage();
    } catch (error) {
        readerTable.replaceChildren();
        showReaderError("Không thể tải danh sách độc giả: " + error.message);
    }
}

const readerUser = getCurrentUser();
const readerName = readerUser.full_name || readerUser.fullName || readerUser.username || "Nhân viên";
document.getElementById("userName").textContent = readerName;
document.getElementById("userAvatar").textContent = readerName.trim().charAt(0).toUpperCase() || "U";

readerSearch.addEventListener("input", () => {
    clearTimeout(readerSearchTimer);
    readerSearchTimer = setTimeout(loadReaders, 300);
});

document.getElementById("refreshButton").addEventListener("click", loadReaders);

document.getElementById("logoutButton").addEventListener("click", async () => {
    const confirmed = await PTIT.confirm("Bạn có chắc chắn muốn đăng xuất?", { confirmText: "Đăng xuất" });
    if (!confirmed) return;

    try {
        await logoutAPI();
    } catch (error) {
        console.error("Không thể thu hồi token đăng xuất:", error);
    }
    window.location.replace("index.html");
});

if (isAuthorized) loadReaders();
