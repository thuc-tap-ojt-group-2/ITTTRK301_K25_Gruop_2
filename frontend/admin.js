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
    roleSelect.className = "search";
    roleSelect.style.minHeight = "36px";
    roleSelect.style.padding = "4px 8px";
    roleSelect.style.fontSize = "13px";
    roleSelect.style.fontWeight = "600";

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
        const confirmed = confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản "${user.username}"?`);
        if (!confirmed) return;

        lockBtn.disabled = true;

        try {
            const nextStatus = !user.is_locked;
            const updatedUser = await updateAdminUserLock(user.id, nextStatus);
            user.is_locked = updatedUser.is_locked;

            statusCell.replaceChildren();
            const statusBadge = document.createElement("span");
            statusBadge.className = `badge ${user.is_locked ? "badge--danger" : "badge--success"}`;
            statusBadge.textContent = user.is_locked ? "Đã khóa" : "Hoạt động";
            statusCell.appendChild(statusBadge);

            lockBtn.className = user.is_locked ? "btn btn--secondary btn--sm" : "btn btn--danger btn--sm";
            lockBtn.textContent = user.is_locked ? "Mở khóa" : "Khóa tài khoản";

            showAdminMessage(`Đã ${actionText} tài khoản "${user.username}" thành công.`);
            await loadAdminLogs();
        } catch (error) {
            showAdminMessage("Không thể thay đổi trạng thái tài khoản: " + error.message, true);
        } finally {
            lockBtn.disabled = isCurrentAdmin;
        }
    });

    return lockBtn;
}

function renderAdminUsers(users) {
    userTable.replaceChildren();

    if (!Array.isArray(users) || users.length === 0) {
        showAdminTableMessage(userTable, 5, "Chưa có tài khoản người dùng nào.");
        return;
    }

    users.forEach(user => {
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
}

function renderAdminLogs(logs) {
    logTable.replaceChildren();

    if (!Array.isArray(logs) || logs.length === 0) {
        showAdminTableMessage(logTable, 4, "Chưa có nhật ký hoạt động hệ thống.");
        return;
    }

    logs.forEach(log => {
        const row = logTable.insertRow();

        // Thời gian
        const timeCell = appendAdminCell(
            row,
            log.created_at ? new Date(log.created_at).toLocaleString("vi-VN") : "—"
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
}

async function loadAdminUsers() {
    const users = await getAdminUsers();
    const safeUsers = Array.isArray(users) ? users : [];
    updateAdminStats(safeUsers);
    renderAdminUsers(safeUsers);
    return safeUsers;
}

async function loadAdminLogs() {
    const logs = await getAdminLogs(100);
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
document.getElementById("userAvatar").textContent =
    adminName.trim().charAt(0).toUpperCase() || "A";

document.getElementById("refreshButton").addEventListener("click", loadAdminData);

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

if (isAuthorized) {
    loadAdminData();
}
