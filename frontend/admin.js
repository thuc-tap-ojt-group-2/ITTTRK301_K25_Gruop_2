const adminMessage = document.getElementById("adminMessage");
const userTable = document.getElementById("userTable");
const logTable = document.getElementById("logTable");
const currentAdmin = getCurrentUser();

function showAdminMessage(message, isError = false) {
    adminMessage.textContent = message;
    adminMessage.className = isError
        ? "admin-message error"
        : "admin-message success";
    adminMessage.hidden = false;
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
    cell.className = "admin-empty";
    cell.textContent = message;
}

function createRoleSelect(user) {
    const role = document.createElement("select");
    const currentRole = normalizeAdminRole(user.role);

    ["READER", "LIBRARIAN", "ADMIN"].forEach(value => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        role.appendChild(option);
    });

    role.value = currentRole;

    const isCurrentAdmin =
        Number(user.id) === Number(currentAdmin.id);

    role.disabled = isCurrentAdmin;

    role.addEventListener("change", async () => {
        const previousRole = normalizeAdminRole(user.role);
        const selectedRole = role.value;

        role.disabled = true;

        try {
            const updatedUser = await updateAdminUserRole(
                user.id,
                selectedRole
            );

            user.role = updatedUser.role || selectedRole;
            role.value = normalizeAdminRole(user.role);

            showAdminMessage("Đã cập nhật vai trò tài khoản.");
        } catch (error) {
            role.value = previousRole;

            showAdminMessage(
                "Không thể cập nhật vai trò: " + error.message,
                true
            );
        } finally {
            role.disabled = isCurrentAdmin;
        }
    });

    return role;
}

function createLockButton(user, statusCell) {
    const button = document.createElement("button");
    const isCurrentAdmin =
        Number(user.id) === Number(currentAdmin.id);

    button.type = "button";
    button.className = user.is_locked
        ? "btn secondary"
        : "btn danger";

    button.textContent = user.is_locked
        ? "Mở khóa"
        : "Khóa";

    button.disabled = isCurrentAdmin;

    button.addEventListener("click", async () => {
        const nextStatus = !user.is_locked;

        button.disabled = true;

        try {
            const updatedUser = await updateAdminUserLock(
                user.id,
                nextStatus
            );

            user.is_locked = updatedUser.is_locked;

            statusCell.replaceChildren();

            const status = document.createElement("span");
            status.className = user.is_locked
                ? "admin-status locked"
                : "admin-status active";

            status.textContent = user.is_locked
                ? "Đã khóa"
                : "Hoạt động";

            statusCell.appendChild(status);

            button.className = user.is_locked
                ? "btn secondary"
                : "btn danger";

            button.textContent = user.is_locked
                ? "Mở khóa"
                : "Khóa";

            showAdminMessage(
                user.is_locked
                    ? "Đã khóa tài khoản."
                    : "Đã mở khóa tài khoản."
            );

            await loadAdminLogs();
        } catch (error) {
            showAdminMessage(
                "Không thể thay đổi trạng thái tài khoản: " +
                error.message,
                true
            );
        } finally {
            button.disabled = isCurrentAdmin;
        }
    });

    return button;
}

function renderAdminUsers(users) {
    userTable.replaceChildren();

    if (!Array.isArray(users) || users.length === 0) {
        showAdminTableMessage(
            userTable,
            5,
            "Chưa có tài khoản."
        );
        return;
    }

    users.forEach(user => {
        const row = userTable.insertRow();

        const account = appendAdminCell(
            row,
            user.full_name || user.username
        );

        account.title = user.username || "";

        appendAdminCell(row, user.email);

        const roleCell = row.insertCell();
        roleCell.appendChild(createRoleSelect(user));

        const statusCell = row.insertCell();
        const status = document.createElement("span");

        status.className = user.is_locked
            ? "admin-status locked"
            : "admin-status active";

        status.textContent = user.is_locked
            ? "Đã khóa"
            : "Hoạt động";

        statusCell.appendChild(status);

        const actionCell = row.insertCell();
        const actions = document.createElement("div");

        actions.className = "admin-actions";
        actions.appendChild(
            createLockButton(user, statusCell)
        );

        actionCell.appendChild(actions);
    });
}

function renderAdminLogs(logs) {
    logTable.replaceChildren();

    if (!Array.isArray(logs) || logs.length === 0) {
        showAdminTableMessage(
            logTable,
            4,
            "Chưa có nhật ký hệ thống."
        );
        return;
    }

    logs.forEach(log => {
        const row = logTable.insertRow();

        appendAdminCell(
            row,
            log.created_at
                ? new Date(log.created_at).toLocaleString("vi-VN")
                : "—"
        );

        appendAdminCell(
            row,
            log.actor_name ||
            (log.actor_id != null
                ? `Người dùng #${log.actor_id}`
                : "Hệ thống")
        );

        appendAdminCell(row, log.action);

        const detailCell = appendAdminCell(
            row,
            log.detail
        );

        detailCell.className = "admin-log-detail";
    });
}

async function loadAdminUsers() {
    const users = await getAdminUsers();
    renderAdminUsers(users);
}

async function loadAdminLogs() {
    const logs = await getAdminLogs(100);
    renderAdminLogs(logs);
}

async function loadAdminData() {
    adminMessage.hidden = true;

    showAdminTableMessage(
        userTable,
        5,
        "Đang tải danh sách tài khoản..."
    );

    showAdminTableMessage(
        logTable,
        4,
        "Đang tải nhật ký..."
    );

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

document.getElementById("refreshButton").addEventListener(
    "click",
    loadAdminData
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
    loadAdminData();
}
