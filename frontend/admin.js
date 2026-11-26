/**
 * ====================================================================
 * THƯ VIỆN PTIT - QUẢN TRỊ TÀI KHOẢN & NHẬT KÝ
 * admin.js: Quản lý phân quyền tài khoản (ADMIN/LIBRARIAN/READER),
 *           khóa / mở khóa tài khoản và theo dõi 100 nhật ký hệ thống gần nhất.
 * ====================================================================
 */

const adminMessage = document.getElementById("adminMessage");
const userTable = document.getElementById("userTable");
const logTable = document.getElementById("logTable");
const currentAdmin = getCurrentUser();

const USER_PAGE_SIZE = 10;
let currentUserPage = 1;
let allAdminUsers = [];

const LOG_PAGE_SIZE = 10;
let currentLogPage = 1;
let allAdminLogs = [];

function escapeAdmin(str) {
    return String(str || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function showAdminMessage(message, isError = false) {
    adminMessage.textContent = message;
    adminMessage.className = isError
        ? "message error admin-message"
        : "message success admin-message";
    adminMessage.hidden = false;
    if (typeof PTIT !== "undefined" && PTIT.showToast) {
        PTIT.showToast(message, isError ? "error" : "success");
    }
}

function appendAdminCell(row, value) {
    const cell = row.insertCell();
    cell.textContent = value == null || value === ""
        ? "—"
        : String(value);

    return cell;
}

function normalizeAdminRole(role) {
    return role === "USER" ? "READER" : role;
}

function showAdminTableMessage(table, columnCount, message) {
    table.replaceChildren();

    const row = table.insertRow();
    const cell = row.insertCell();

    cell.colSpan = columnCount;
    cell.className = "empty admin-empty";
    cell.textContent = message;
}

function updateAdminStats(users) {
    const safeUsers = Array.isArray(users) ? users : [];
    const totalUsersEl = document.getElementById("totalUsersCount");
    const adminCountEl = document.getElementById("adminCount");
    const librarianCountEl = document.getElementById("librarianCount");
    const readerCountEl = document.getElementById("readerCount");

    if (totalUsersEl) totalUsersEl.textContent = safeUsers.length;
    if (adminCountEl) adminCountEl.textContent = safeUsers.filter(u => u.role === "ADMIN").length;
    if (librarianCountEl) librarianCountEl.textContent = safeUsers.filter(u => ["LIBRARIAN", "THUTHU", "STAFF"].includes(String(u.role).toUpperCase())).length;
    if (readerCountEl) readerCountEl.textContent = safeUsers.filter(u => ["READER", "USER", "DOCGIA"].includes(String(u.role).toUpperCase())).length;
}

function createRoleSelect(user) {
    const roleSelect = document.createElement("select");
    roleSelect.className = "input select-role";
    roleSelect.style.width = "100%";
    roleSelect.style.minWidth = "190px";
    roleSelect.style.minHeight = "36px";
    roleSelect.style.boxSizing = "border-box";
    roleSelect.style.padding = "4px 8px";
    roleSelect.style.fontSize = "13px";
    roleSelect.style.fontWeight = "600";
    roleSelect.style.borderRadius = "var(--radius-sm, 8px)";
    roleSelect.style.border = "1px solid var(--color-border)";
    roleSelect.style.backgroundColor = "var(--color-bg-surface)";
    roleSelect.style.cursor = "pointer";

    const currentRole = normalizeAdminRole(user.role);

    [
        { value: "READER", label: "Độc giả (READER)" },
        { value: "LIBRARIAN", label: "Thủ thư (LIBRARIAN)" },
        { value: "ADMIN", label: "Quản trị viên (ADMIN)" }
    ].forEach(item => {
        const option = document.createElement("option");
        option.value = item.value;
        option.textContent = item.label;
        roleSelect.appendChild(option);
    });

    roleSelect.value = currentRole;

    const isCurrentAdmin = Number(user.id) === Number(currentAdmin.id);
    roleSelect.disabled = isCurrentAdmin;

    roleSelect.addEventListener("change", async () => {
        const previousRole = normalizeAdminRole(user.role);
        const selectedRole = roleSelect.value;

        roleSelect.disabled = true;

        try {
            const updatedUser = await updateAdminUserRole(user.id, selectedRole);
            user.role = updatedUser.role || selectedRole;
            roleSelect.value = normalizeAdminRole(user.role);

            showAdminMessage(`Đã cập nhật vai trò của tài khoản "${user.username}" thành ${selectedRole}.`);
            await loadAdminData();
        } catch (error) {
            roleSelect.value = previousRole;
            showAdminMessage("Không thể cập nhật vai trò: " + error.message, true);
        } finally {
            roleSelect.disabled = isCurrentAdmin;
        }
    });

    return roleSelect;
}

function createLockButton(user, statusCell) {
    const lockBtn = document.createElement("button");
    const isCurrentAdmin = Number(user.id) === Number(currentAdmin.id);

    lockBtn.type = "button";
    lockBtn.className = user.is_locked ? "btn btn--secondary btn--sm" : "btn btn--danger btn--sm";
    lockBtn.textContent = user.is_locked ? "Mở khóa" : "Khóa tài khoản";
    lockBtn.disabled = isCurrentAdmin;

    lockBtn.addEventListener("click", async () => {
        const actionText = user.is_locked ? "mở khóa" : "khóa";
        await PTIT.confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản "${user.username}"?`, {
            danger: !user.is_locked,
            confirmText: actionText === "khóa" ? "Khóa tài khoản" : "Mở khóa",
            onConfirm: async () => {
                lockBtn.disabled = true;
                let updatedUser;
                try {
                    updatedUser = await updateAdminUserLock(user.id, !user.is_locked);
                } catch (error) {
                    showAdminMessage("Không thể thay đổi trạng thái tài khoản: " + error.message, true);
                    lockBtn.disabled = isCurrentAdmin;
                    throw error;
                }

                user.is_locked = updatedUser.is_locked;
                statusCell.replaceChildren();
                const statusBadge = document.createElement("span");
                statusBadge.className = `badge ${user.is_locked ? "badge--danger" : "badge--success"}`;
                statusBadge.textContent = user.is_locked ? "Đã khóa" : "Hoạt động";
                statusCell.appendChild(statusBadge);

                lockBtn.className = user.is_locked ? "btn btn--secondary btn--sm" : "btn btn--danger btn--sm";
                lockBtn.textContent = user.is_locked ? "Mở khóa" : "Khóa tài khoản";
                lockBtn.disabled = isCurrentAdmin;
                showAdminMessage(`Đã ${actionText} tài khoản "${user.username}" thành công.`);
                try {
                    await loadAdminLogs();
                } catch (error) {
                    showAdminMessage(`Đã ${actionText} tài khoản nhưng không thể tải nhật ký: ${error.message}`, true);
                }
            }
        });
    });

    return lockBtn;
}

function renderAdminUsers(users) {
    if (Array.isArray(users)) {
        allAdminUsers = users;
    }
    userTable.replaceChildren();

    const totalItems = allAdminUsers.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / USER_PAGE_SIZE));
    if (currentUserPage > totalPages) currentUserPage = totalPages;

    const startIdx = (currentUserPage - 1) * USER_PAGE_SIZE;
    const pageUsers = allAdminUsers.slice(startIdx, startIdx + USER_PAGE_SIZE);

    if (totalItems === 0) {
        showAdminTableMessage(userTable, 5, "Chưa có tài khoản người dùng nào.");
        return;
    }

    pageUsers.forEach(user => {
        const row = userTable.insertRow();

        // 1. Tài khoản & Tên đầy đủ
        const accountCell = row.insertCell();
        accountCell.innerHTML = `<strong>${escapeAdmin(user.full_name || user.username)}</strong><br><small style="color:var(--color-text-muted);font-family:var(--font-mono);">${escapeAdmin(user.username)}</small>`;

        // 2. Email
        const emailCell = appendAdminCell(row, user.email);
        emailCell.style.color = "var(--color-text-muted)";

        // 3. Vai trò
        const roleCell = row.insertCell();
        roleCell.appendChild(createRoleSelect(user));

        // 4. Trạng thái
        const statusCell = row.insertCell();
        statusCell.style.textAlign = "center";
        const statusBadge = document.createElement("span");
        statusBadge.className = `badge ${user.is_locked ? "badge--danger" : "badge--success"}`;
        statusBadge.textContent = user.is_locked ? "Đã khóa" : "Hoạt động";
        statusCell.appendChild(statusBadge);

        // 5. Thao tác
        const actionCell = row.insertCell();
        actionCell.style.textAlign = "right";
        actionCell.appendChild(createLockButton(user, statusCell));
    });

    const paginationContainer = document.getElementById("usersPagination");
    if (typeof PTIT !== "undefined" && PTIT.renderPagination && paginationContainer) {
        PTIT.renderPagination({
            container: paginationContainer,
            currentPage: currentUserPage,
            totalPages: totalPages,
            totalItems: totalItems,
            pageSize: USER_PAGE_SIZE,
            itemLabel: "tài khoản",
            onPageChange: function(newPage) {
                currentUserPage = newPage;
                renderAdminUsers();
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        });
    }
}

function formatAuditLogTimestamp(value) {
    if (!value) return "—";

    const timestamp = typeof value === "string" && !/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)
        ? `${value}Z`
        : value;
    return new Date(timestamp).toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh"
    });
}

function renderAdminLogs(logs) {
    if (Array.isArray(logs)) {
        allAdminLogs = logs;
    }
    logTable.replaceChildren();

    const totalItems = allAdminLogs.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / LOG_PAGE_SIZE));
    if (currentLogPage > totalPages) currentLogPage = totalPages;

    const startIdx = (currentLogPage - 1) * LOG_PAGE_SIZE;
    const pageLogs = allAdminLogs.slice(startIdx, startIdx + LOG_PAGE_SIZE);

    if (totalItems === 0) {
        showAdminTableMessage(logTable, 4, "Chưa có nhật ký hoạt động hệ thống.");
        return;
    }

    pageLogs.forEach(log => {
        const row = logTable.insertRow();

        // Thời gian
        const timeCell = appendAdminCell(
            row,
            formatAuditLogTimestamp(log.created_at)
        );
        timeCell.style.fontSize = "13px";
        timeCell.style.color = "var(--color-text-muted)";

        // Người thực hiện
        const actorCell = appendAdminCell(
            row,
            log.actor_name ||
                (log.actor_id == null ? "Khách / Hệ thống" : `Tài khoản #${log.actor_id}`)
        );
        actorCell.style.fontWeight = "600";

        // Hành động
        const actionCell = row.insertCell();
        const actionBadge = document.createElement("span");
        actionBadge.className = "badge badge--neutral";
        actionBadge.style.fontFamily = "var(--font-mono)";
        actionBadge.textContent = log.action || "LOG";
        actionCell.appendChild(actionBadge);

        // Chi tiết
        const detailCell = appendAdminCell(row, log.detail);
        detailCell.style.fontSize = "13px";
    });

    const paginationContainer = document.getElementById("logsPagination");
    if (typeof PTIT !== "undefined" && PTIT.renderPagination && paginationContainer) {
        PTIT.renderPagination({
            container: paginationContainer,
            currentPage: currentLogPage,
            totalPages: totalPages,
            totalItems: totalItems,
            pageSize: LOG_PAGE_SIZE,
            itemLabel: "nhật ký",
            onPageChange: function(newPage) {
                currentLogPage = newPage;
                renderAdminLogs();
            }
        });
    }
}

async function loadAdminUsers() {
    const users = await getAdminUsers();
    const safeUsers = Array.isArray(users) ? users : [];
    updateAdminStats(safeUsers);
    renderAdminUsers(safeUsers);
    return safeUsers;
}

async function loadAdminLogs() {
    const logs = await getAdminLogs(10);
    const safeLogs = Array.isArray(logs) ? logs : [];
    renderAdminLogs(safeLogs);
    return safeLogs;
}

async function loadAdminData() {
    adminMessage.hidden = true;

    showAdminTableMessage(userTable, 5, "Đang tải danh sách tài khoản...");
    showAdminTableMessage(logTable, 4, "Đang tải nhật ký kiểm toán...");

    const results = await Promise.allSettled([
        loadAdminUsers(),
        loadAdminLogs()
    ]);

    const errors = results
        .filter(result => result.status === "rejected")
        .map(result => result.reason.message);

    if (errors.length > 0) {
        showAdminMessage(
            "Một số dữ liệu không tải được: " + errors.join("; "),
            true
        );
    }
}

const adminName =
    currentAdmin.full_name ||
    currentAdmin.fullName ||
    currentAdmin.username ||
    "Quản trị viên";

document.getElementById("userName").textContent = adminName;
PTIT.setAvatar(document.getElementById("userAvatar"), adminName);

document.getElementById("refreshButton").addEventListener("click", loadAdminData);

document.getElementById("logoutButton").addEventListener("click", async () => {
    await PTIT.confirm("Bạn có chắc chắn muốn đăng xuất?", {
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
});

if (isAuthorized) {
    loadAdminData();
}
