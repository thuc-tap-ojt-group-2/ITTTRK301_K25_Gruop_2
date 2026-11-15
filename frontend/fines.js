const fineTable = document.getElementById("fineTable");
const fineMessage = document.getElementById("pageMessage");

function fineMoney(value) {
    return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

async function loadFines() {
    fineMessage.hidden = true;
    try {
        const fines = await getFines();
        document.getElementById("fineCount").textContent = `${fines.length} khoản`;
        fineTable.replaceChildren();
        if (!fines.length) {
            const cell = fineTable.insertRow().insertCell();
            cell.colSpan = 7;
            cell.textContent = "Chưa có khoản phạt.";
            return;
        }
        fines.forEach(fine => {
            const row = fineTable.insertRow();
            [fine.loanId, fine.username, fine.bookTitle, fine.overdueDays, fineMoney(fine.amount),
                fine.type === "PROVISIONAL" ? "Tạm tính" : fine.paid ? "Đã thanh toán" : "Chưa thanh toán"]
                .forEach(value => {
                    const cell = row.insertCell();
                    cell.textContent = String(value ?? "—");
                });
            const action = row.insertCell();
            if (fine.type === "FINALIZED" && !fine.paid) {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "btn primary";
                button.textContent = "Đã thu";
                button.addEventListener("click", async () => {
                    if (!confirm(`Xác nhận đã thu ${fineMoney(fine.amount)} cho phiếu #${fine.loanId}?`)) return;
                    button.disabled = true;
                    try {
                        await markFinePaid(fine.id);
                        await loadFines();
                    } catch (error) {
                        fineMessage.textContent = "Không thể cập nhật khoản phạt: " + error.message;
                        fineMessage.hidden = false;
                    } finally {
                        button.disabled = false;
                    }
                });
                action.appendChild(button);
            } else {
                action.textContent = "—";
            }
        });
    } catch (error) {
        fineTable.replaceChildren();
        fineMessage.textContent = "Không thể tải khoản phạt: " + error.message;
        fineMessage.hidden = false;
    }
}

const fineUser = getCurrentUser();
const fineUserName = fineUser.full_name || fineUser.fullName || fineUser.username || "Nhân viên";
document.getElementById("userName").textContent = fineUserName;
document.getElementById("userAvatar").textContent = fineUserName.trim().charAt(0).toUpperCase() || "U";
document.getElementById("refreshButton").addEventListener("click", loadFines);
document.getElementById("logoutButton").addEventListener("click", async () => {
    try { await logoutAPI(); } catch (error) { console.error("Không thể thu hồi token đăng xuất:", error); }
    window.location.replace("index.html");
});
if (isAuthorized) loadFines();
