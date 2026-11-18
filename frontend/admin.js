const adminMessage = document.getElementById("adminMessage");
const userTable = document.getElementById("userTable");
const logTable = document.getElementById("logTable");
const currentAdmin = getCurrentUser();

function showAdminMessage(message, isError = false) {
    adminMessage.textContent = message;
    adminMessage.className = isError ? "error" : "message";
    adminMessage.hidden = false;
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
        users.forEach(user => {
            const row = userTable.insertRow();
            const account = appendAdminCell(row, user.full_name || user.username);
            account.title = user.username;
            appendAdminCell(row, user.email);
            const roleCell = row.insertCell();
            const role = document.createElement("select");
            ["READER", "LIBRARIAN", "ADMIN"].forEach(value => {
                const option = document.createElement("option");
                option.value = value;
                option.textContent = value;
                role.appendChild(option);
            });
            role.value = user.role === "USER" ? "READER" : user.role;
            role.disabled = user.id === currentAdmin.id;
            role.addEventListener("change", async () => {
                role.disabled = true;
                try {
                    await updateAdminUserRole(user.id, role.value);
                    showAdminMessage("Đã cập nhật vai trò.");
                } catch (error) {
                    role.value = user.role === "USER" ? "READER" : user.role;
                    showAdminMessage("Không thể cập nhật vai trò: " + error.message, true);
                } finally {
                    role.disabled = user.id === currentAdmin.id;
                }
            });
            roleCell.appendChild(role);
            appendAdminCell(row, user.is_locked ? "Đã khóa" : "Hoạt động");
            const action = row.insertCell();
            const lock = document.createElement("button");
            lock.type = "button";
            lock.className = user.is_locked ? "btn secondary" : "btn danger";
            lock.textContent = user.is_locked ? "Mở khóa" : "Khóa";
            lock.disabled = user.id === currentAdmin.id;
            lock.addEventListener("click", async () => {
                lock.disabled = true;
                try {
                    await updateAdminUserLock(user.id, !user.is_locked);
                    showAdminMessage(user.is_locked ? "Đã mở khóa tài khoản." : "Đã khóa tài khoản.");
                    await loadAdminData();
                } catch (error) {
                    showAdminMessage("Không thể đổi trạng thái tài khoản: " + error.message, true);
                    lock.disabled = false;
                }
            });
            action.appendChild(lock);
        });
        if (!users.length) {
            const cell = userTable.insertRow().insertCell();
            cell.colSpan = 5;
            cell.textContent = "Chưa có tài khoản.";
        }

        logs.forEach(log => {
            const row = logTable.insertRow();
            appendAdminCell(row, log.created_at ? new Date(log.created_at).toLocaleString("vi-VN") : "—");
            appendAdminCell(
                row,
                log.actor_name ||
                    (log.actor_id == null ? "Khách / tài khoản không xác định" : `Tài khoản #${log.actor_id}`)
            );
            appendAdminCell(row, log.action);
            appendAdminCell(row, log.detail);
        });
        if (!logs.length) {
            const cell = logTable.insertRow().insertCell();
            cell.colSpan = 4;
            cell.textContent = "Chưa có nhật ký.";
        }
    } catch (error) {
        showAdminMessage("Không thể tải dữ liệu quản trị: " + error.message, true);
    }
}

const adminName = currentAdmin.full_name || currentAdmin.fullName || currentAdmin.username || "Quản trị viên";
document.getElementById("userName").textContent = adminName;
document.getElementById("userAvatar").textContent = adminName.trim().charAt(0).toUpperCase() || "A";
document.getElementById("refreshButton").addEventListener("click", loadAdminData);
document.getElementById("logoutButton").addEventListener("click", async () => {
    try { await logoutAPI(); } catch (error) { console.error("Không thể thu hồi token đăng xuất:", error); }
    window.location.replace("index.html");
});
if (isAuthorized) loadAdminData();
