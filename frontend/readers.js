const readerTable = document.getElementById("readerTable");
const readerMessage = document.getElementById("pageMessage");
const readerSearch = document.getElementById("searchInput");
let readerSearchTimer;

function showReaderError(message) {
    readerMessage.textContent = message;
    readerMessage.hidden = false;
    readerMessage.className = "error";
}

async function showReaderHistory(reader) {
    const body = document.getElementById("historyTable");
    body.replaceChildren();
    document.getElementById("historyTitle").textContent = `Lịch sử mượn — ${reader.fullName}`;
    try {
        const history = await getReaderLoans(reader.id);
        if (!history.length) {
            const row = body.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 5;
            cell.textContent = "Độc giả chưa có lịch sử mượn.";
        } else {
            history.forEach(loan => {
                const row = body.insertRow();
                [loan.bookTitle, loan.status, loan.borrowDate, loan.dueDate, loan.returnDate]
                    .forEach(value => {
                        const cell = row.insertCell();
                        cell.textContent = value || "—";
                    });
            });
        }
        document.getElementById("historyDialog").showModal();
    } catch (error) {
        showReaderError("Không thể tải lịch sử mượn: " + error.message);
    }
}

async function loadReaders() {
    readerMessage.hidden = true;
    readerTable.replaceChildren();
    const loading = readerTable.insertRow().insertCell();
    loading.colSpan = 6;
    loading.textContent = "Đang tải...";
    try {
        const readers = await getReaders(readerSearch.value);
        readerTable.replaceChildren();
        if (!readers.length) {
            const cell = readerTable.insertRow().insertCell();
            cell.colSpan = 6;
            cell.textContent = "Không tìm thấy độc giả.";
            return;
        }
        readers.forEach(reader => {
            const row = readerTable.insertRow();
            [reader.username, reader.fullName, reader.email, reader.active ? "Hoạt động" : "Đã khóa", reader.borrowingCount]
                .forEach(value => {
                    const cell = row.insertCell();
                    cell.textContent = String(value ?? "—");
                });
            const action = row.insertCell();
            const button = document.createElement("button");
            button.type = "button";
            button.className = "btn secondary";
            button.textContent = "Lịch sử";
            button.addEventListener("click", () => showReaderHistory(reader));
            action.appendChild(button);
        });
    } catch (error) {
        readerTable.replaceChildren();
        showReaderError("Không thể tải độc giả: " + error.message);
    }
}

const readerUser = getCurrentUser();
const readerName = readerUser.full_name || readerUser.fullName || readerUser.username || "Nhân viên";
document.getElementById("userName").textContent = readerName;
document.getElementById("userAvatar").textContent = readerName.trim().charAt(0).toUpperCase() || "U";
readerSearch.addEventListener("input", () => {
    clearTimeout(readerSearchTimer);
    readerSearchTimer = setTimeout(loadReaders, 250);
});
document.getElementById("refreshButton").addEventListener("click", loadReaders);
document.getElementById("closeHistory").addEventListener("click", () => document.getElementById("historyDialog").close());
document.getElementById("logoutButton").addEventListener("click", async () => {
    try { await logoutAPI(); } catch (error) { console.error("Không thể thu hồi token đăng xuất:", error); }
    window.location.replace("index.html");
});
if (isAuthorized) loadReaders();
