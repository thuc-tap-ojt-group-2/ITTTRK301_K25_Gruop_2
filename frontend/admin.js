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

function showAdminMessage(message, isError = false) {
    adminMessage.textContent = message;
    adminMessage.className = isError ? "message error" : "message success";
    adminMessage.hidden = false;
    if (typeof PTIT !== "undefined" && PTIT.showToast) {
        PTIT.showToast(message, isError ? "error" : "success");
    }
}

function appendAdminCell(row, value) {
    const cell = row.insertCell();
    cell.textContent = value == null ? "—" : String(value);
    return cell;
}

async function loadAdminData() {
    adminMessage.hidden = true;
    userTable.replaceChildren();
    logTable.replaceChildren();

    try {
        const [users, logs] = await Promise.all([getAdminUsers(), getAdminLogs()]);
        const safeUsers = Array.isArray(users) ? users : [];
        const safeLogs = Array.isArray(logs) ? logs : [];

        // Cập nhật thẻ thống kê
        const totalUsersEl = document.getElementById("totalUsersCount");
        const adminCountEl = document.getElementById("adminCount");
        const librarianCountEl = document.getElementById("librarianCount");
        const readerCountEl = document.getElementById("readerCount");

        if (totalUsersEl) totalUsersEl.textContent = safeUsers.length;
        if (adminCountEl) adminCountEl.textContent = safeUsers.filter(u => u.role === "ADMIN").length;
        if (librarianCountEl) librarianCountEl.textContent = safeUsers.filter(u => ["LIBRARIAN", "THUTHU", "STAFF"].includes(String(u.role).toUpperCase())).length;
        if (readerCountEl) readerCountEl.textContent = safeUsers.filter(u => ["READER", "USER", "DOCGIA"].includes(String(u.role).toUpperCase())).length;

        // Render bảng tài khoản
        safeUsers.forEach(user => {
            const row = userTable.insertRow();
            
            // Tài khoản
            const accountCell = row.insertCell();
            accountCell.innerHTML = `<strong>${escapeAdmin(user.full_name || user.username)}</strong><br><small style="color:var(--color-text-muted);font-family:var(--font-mono);">${escapeAdmin(user.username)}</small>`;

            // Email
            const emailCell = appendAdminCell(row, user.email);
            emailCell.style.color = "var(--color-text-muted)";

            // Vai trò dropdown
            const roleCell = row.insertCell();
            const roleSelect = document.createElement("select");
            roleSelect.className = "search";
            roleSelect.style.minHeight = "36px";
            roleSelect.style.padding = "4px 8px";
            roleSelect.style.fontSize = "13px";
            roleSelect.style.fontWeight = "600";

            ["READER", "LIBRARIAN", "ADMIN"].forEach(value => {
                const option = document.createElement("option");
                option.value = value;
                option.textContent = value === "READER" ? "Độc giả (READER)" : value === "LIBRARIAN" ? "Thủ thư (LIBRARIAN)" : "Quản trị viên (ADMIN)";
                roleSelect.appendChild(option);
            });

            roleSelect.value = user.role === "USER" ? "READER" : user.role;
            roleSelect.disabled = user.id === currentAdmin.id;

            roleSelect.addEventListener("change", async () => {
                roleSelect.disabled = true;
                try {
                    await updateAdminUserRole(user.id, roleSelect.value);
                    showAdminMessage(`Đã cập nhật vai trò của tài khoản "${user.username}" thành ${roleSelect.value}.`);
                    await loadAdminData();
                } catch (error) {
                    roleSelect.value = user.role === "USER" ? "READER" : user.role;
                    showAdminMessage("Không thể cập nhật vai trò: " + error.message, true);
                } finally {
                    roleSelect.disabled = user.id === currentAdmin.id;
                }
            });
            roleCell.appendChild(roleSelect);

            // Trạng thái badge
            const statusCell = row.insertCell();
            statusCell.style.textAlign = "center";
            const statusBadge = document.createElement("span");
            statusBadge.className = `badge ${user.is_locked ? 'badge--danger' : 'badge--success'}`;
            statusBadge.textContent = user.is_locked ? "Đã khóa" : "Hoạt động";
            statusCell.appendChild(statusBadge);

            // Thao tác Khóa / Mở khóa
            const actionCell = row.insertCell();
            actionCell.style.textAlign = "right";

            const lockBtn = document.createElement("button");
            lockBtn.type = "button";
            lockBtn.className = user.is_locked ? "btn btn--secondary btn--sm" : "btn btn--danger btn--sm";
            lockBtn.textContent = user.is_locked ? "Mở khóa" : "Khóa tài khoản";
            lockBtn.disabled = user.id === currentAdmin.id;

            lockBtn.addEventListener("click", async () => {
                const actionText = user.is_locked ? "mở khóa" : "khóa";
                const confirmed = confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản "${user.username}"?`);
                if (!confirmed) return;

                lockBtn.disabled = true;
                try {
                    await updateAdminUserLock(user.id, !user.is_locked);
                    showAdminMessage(`Đã ${actionText} tài khoản "${user.username}" thành công.`);
                    await loadAdminData();
                } catch (error) {
                    showAdminMessage("Không thể thay đổi trạng thái tài khoản: " + error.message, true);
                    lockBtn.disabled = false;
                }
            });
            actionCell.appendChild(lockBtn);
        });

        if (!safeUsers.length) {
            const cell = userTable.insertRow().insertCell();
            cell.colSpan = 5;
            cell.className = "empty";
            cell.textContent = "Chưa có tài khoản người dùng nào.";
        }

        // Render bảng nhật ký kiểm toán (Logs)
        safeLogs.forEach(log => {
            const row = logTable.insertRow();
            
            // Thời gian
            const timeCell = appendAdminCell(row, log.created_at ? new Date(log.created_at).toLocaleString("vi-VN") : "—");
            timeCell.style.fontSize = "13px";
            timeCell.style.color = "var(--color-text-muted)";

            // Người thực hiện
            const actorCell = appendAdminCell(
                row,
                log.actor_name ||
                    (log.actor_id == null ? "Khách / Hệ thống" : `Tài khoản #${log.actor_id}`)
            );
            actorCell.style.fontWeight = "600";

            // Hành động (badge)
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

        if (!safeLogs.length) {
            const cell = logTable.insertRow().insertCell();
            cell.colSpan = 4;
            cell.className = "empty";
            cell.textContent = "Chưa có nhật ký hoạt động.";
        }
    } catch (error) {
        showAdminMessage("Không thể tải dữ liệu quản trị: " + error.message, true);
    }
}

function escapeAdmin(str) {
    return String(str || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

const adminName = currentAdmin.full_name || currentAdmin.fullName || currentAdmin.username || "Quản trị viên";
document.getElementById("userName").textContent = adminName;
document.getElementById("userAvatar").textContent = adminName.trim().charAt(0).toUpperCase() || "A";
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

if (isAuthorized) loadAdminData();
