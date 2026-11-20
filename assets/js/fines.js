/* =====================================================
   DA-08 — Tiền phạt (FINE-03 / FINE-04 / FINE-05) và Đổi mật khẩu (AUTH-07)

   Giao diện gọi API qua authRequest() / request() (JWT trong header Authorization).
   Khi USE_MOCK_API = true, các endpoint dưới đây được mô phỏng trong trình duyệt bởi
   mockFinesRequest() để chạy thử khi chưa có backend. Mọi kiểm tra quyền, kiểm tra
   mật khẩu cũ, quy tắc thu tiền và nhật ký đều nằm ở tầng "server" (mockFinesRequest),
   KHÔNG nằm ở giao diện.

   HỢP ĐỒNG API (backend cần cài đặt khi USE_MOCK_API = false):
   - GET   /librarian/fines?page=N           (chỉ LIBRARIAN) -> { items, page, pages, total, summary, log }
       item: { id (mã phiếu), readerName, studentId, readerEmail, bookTitle, lateDays, amount,
               type: 'FINALIZED' | 'PROVISIONAL', collected, collectedAt, collectedBy }
       summary: { finalizedUnpaid, provisional, collected }   log: nhật ký thu tiền gần nhất
   - PATCH /librarian/fines/:id/collect      (chỉ LIBRARIAN) -> item đã cập nhật; ghi nhật ký FINE_COLLECTED
       409 nếu là khoản tạm tính, đã thu, hoặc không có khoản phạt
   - GET   /fines/my                         (người đang đăng nhập) -> { total, finalizedUnpaid, provisional, collected }
   - POST  /auth/change-password             { currentPassword, newPassword }
       400 + message nếu mật khẩu cũ sai (backend phải so khớp mật khẩu cũ trước khi đổi)
   ===================================================== */
const AUDIT_LOG_KEY = 'ptit_audit_log_v1';
const CHANGE_PASSWORD_METHOD = 'POST';
const finesState = { record: null, busy: false, focus: null };
const myFinesState = { version: 0 };
const passwordState = { busy: false, version: 0 };

/* =====================================================
   1. SERVICE (mô phỏng backend — chỉ chạy khi USE_MOCK_API = true)
   ===================================================== */
function readAuditLog() {
  const log = readStoredObject(AUDIT_LOG_KEY, []);
  if (!Array.isArray(log)) throw new Error('Nhật ký thao tác không hợp lệ.');
  return log;
}

/* Khoản phạt của một phiếu. FINALIZED = đã chốt khi trả sách; PROVISIONAL = tạm tính cho sách quá hạn chưa trả. */
function fineRecord(loan, users) {
  const fine = fineForLoan(loan);
  if (!(fine.amount > 0)) return null;
  const email = userEmail({ email: loan.userEmail });
  const reader = users.find(u => userEmail(u) === email);
  return {
    id: loan.id,
    readerName: reader ? reader.fullName : loan.userEmail,
    studentId: reader && reader.studentId || '',
    readerEmail: loan.userEmail,
    bookTitle: loan.bookTitle,
    lateDays: fine.days,
    amount: fine.amount,
    type: unreturnedLoan(loan) ? 'PROVISIONAL' : 'FINALIZED',
    collected: Boolean(loan.fineCollected),
    collectedAt: loan.fineCollectedAt || null,
    collectedBy: loan.fineCollectedBy || null,
  };
}

function finesSummary(records) {
  const sum = list => list.reduce((total, record) => total + record.amount, 0);
  return {
    finalizedUnpaid: sum(records.filter(r => r.type === 'FINALIZED' && !r.collected)),
    provisional: sum(records.filter(r => r.type === 'PROVISIONAL')),
    collected: sum(records.filter(r => r.collected)),
  };
}

function mockFinesRequest(path, query, options, body) {
  if (path === ENDPOINTS.changePassword) return mockChangePassword(options, body);
  if (path === ENDPOINTS.myFines) return mockMyFines(options);
  const collect = path.match(/^\/librarian\/fines\/([^/]+)\/collect$/);
  if (collect) return mockCollectFine(decodeURIComponent(collect[1]), options);
  if (path !== ENDPOINTS.fines) return mockReply(404, { message: 'Không tìm thấy dữ liệu.' });

  const denied = librarianAccess(options);
  if (denied) return denied;
  if ((options.method || 'GET') !== 'GET') return mockReply(405, { message: 'Thao tác không được hỗ trợ.' });
  const users = readReaderUsers();
  const rank = r => (r.type === 'FINALIZED' && !r.collected ? 0 : r.type === 'PROVISIONAL' ? 1 : 2);
  const records = readDemoLoans().map(loan => fineRecord(loan, users)).filter(Boolean)
    .sort((a, b) => rank(a) - rank(b) || String(a.readerName).localeCompare(String(b.readerName), 'vi') || String(a.id).localeCompare(String(b.id)));
  const paged = paginateReaders(records, new URLSearchParams(query).get('page'));
  const log = readAuditLog().filter(entry => entry.action === 'FINE_COLLECTED').slice(-5).reverse();
  return mockReply(200, { ...paged, summary: finesSummary(records), log });
}

function mockMyFines(options) {
  const owner = demoLoanOwner(options); // chủ tài khoản lấy từ JWT, không nhận email từ giao diện
  if (!owner) return mockReply(401, { message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });
  if ((options.method || 'GET') !== 'GET') return mockReply(405, { message: 'Thao tác không được hỗ trợ.' });
  const records = readDemoLoans().filter(loan => userEmail({ email: loan.userEmail }) === owner)
    .map(loan => fineRecord(loan, [])).filter(Boolean);
  const summary = finesSummary(records);
  return mockReply(200, { total: summary.finalizedUnpaid + summary.provisional, ...summary });
}

function mockCollectFine(id, options) {
  return withDemoLoanLock(() => {
    const denied = librarianAccess(options);
    if (denied) return denied;
    if (options.method !== 'PATCH') return mockReply(405, { message: 'Thao tác không được hỗ trợ.' });
    const loans = readDemoLoans();
    const index = loans.findIndex(loan => String(loan.id) === id);
    if (index < 0) return mockReply(404, { message: 'Không tìm thấy khoản phạt.' });
    const users = readReaderUsers();
    const record = fineRecord(loans[index], users);
    if (!record) return mockReply(409, { message: 'Phiếu này không có khoản phạt để thu.' });
    if (record.type === 'PROVISIONAL') return mockReply(409, { message: 'Khoản phạt tạm tính chưa thể thu: độc giả chưa trả sách.' });
    if (record.collected) return mockReply(409, { message: 'Khoản phạt này đã được thu tiền.' });

    const actor = getUser();
    const at = new Date().toISOString();
    const log = readAuditLog();
    const previousLoans = localStorage.getItem(DEMO_LOANS_KEY);
    loans[index] = { ...loans[index], fine: record.amount, fineCollected: true, fineCollectedAt: at, fineCollectedBy: userEmail(actor) };
    const entry = {
      id: 'LOG-' + crypto.randomUUID(), action: 'FINE_COLLECTED', at,
      actorEmail: userEmail(actor), actorName: actor.fullName || actor.email,
      loanId: record.id, readerEmail: record.readerEmail, readerName: record.readerName,
      bookTitle: record.bookTitle, amount: record.amount,
    };
    try {
      localStorage.setItem(DEMO_LOANS_KEY, JSON.stringify(loans));
      localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify([...log, entry].slice(-500)));
    } catch (error) { // không để lại trạng thái "đã thu" mà thiếu nhật ký
      if (previousLoans === null) localStorage.removeItem(DEMO_LOANS_KEY); else localStorage.setItem(DEMO_LOANS_KEY, previousLoans);
      throw error;
    }
    return mockReply(200, fineRecord(loans[index], users));
  });
}

/* AUTH-07: kiểm tra mật khẩu cũ ở "server", trước khi cho phép đổi */
function mockChangePassword(options, body) {
  const run = () => {
    const owner = demoLoanOwner(options);
    if (!owner) return mockReply(401, { message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });
    if (options.method !== CHANGE_PASSWORD_METHOD) return mockReply(405, { message: 'Thao tác không được hỗ trợ.' });
    const current = typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const next = typeof body.newPassword === 'string' ? body.newPassword : '';
    if (!current) return mockReply(400, { message: 'Vui lòng nhập mật khẩu cũ.' });
    const users = mockLoadUsers();
    const index = users.findIndex(user => userEmail(user) === owner);
    if (index < 0) return mockReply(404, { message: 'Không tìm thấy tài khoản.' });
    if (users[index].password !== current) return mockReply(400, { message: 'Mật khẩu cũ không chính xác.' });
    if (next.length < 6) return mockReply(400, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
    if (next === current) return mockReply(400, { message: 'Mật khẩu mới phải khác mật khẩu cũ.' });
    users[index] = { ...users[index], password: next };
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
    return mockReply(200, { message: 'Đổi mật khẩu thành công.' });
  };
  return navigator.locks ? navigator.locks.request(MOCK_USERS_KEY, run) : Promise.resolve().then(run);
}

/* =====================================================
   2. FINE-03 — Trang Tiền phạt của thủ thư
   ===================================================== */
function formatDateTime(value) {
  return new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short', timeStyle: 'short' });
}

async function renderFines() {
  const page = staffState.page;
  const version = ++staffState.version;
  const token = getToken();
  const holder = $('finesContent');
  $('finesSubtitle').textContent = 'Mức phạt 5.000đ mỗi ngày trễ';
  readerMessage(holder, 'Đang tải danh sách phạt…');
  holder.setAttribute('aria-busy', 'true');
  const result = await authRequest(ENDPOINTS.fines + '?page=' + page);
  if (version !== staffState.version || getToken() !== token || $('page-fines').hidden) return;
  holder.setAttribute('aria-busy', 'false');
  if (!result.ok) { readerMessage(holder, result.message, () => renderFines()); return; }
  const data = result.data;
  if (!data || !Array.isArray(data.items) || !data.summary) {
    readerMessage(holder, 'Dữ liệu tiền phạt không hợp lệ.', () => renderFines());
    return;
  }
  staffState.page = data.page;
  holder.replaceChildren();

  const stats = el('div', 'fines-stats');
  [[data.summary.finalizedUnpaid, 'Đã chốt, chưa thu'], [data.summary.provisional, 'Tạm tính (sách quá hạn chưa trả)'], [data.summary.collected, 'Đã thu']]
    .forEach(([value, label]) => {
      const card = el('div', 'stat-card');
      card.append(el('strong', '', money(value)), el('span', '', label));
      stats.append(card);
    });
  holder.append(stats);

  if (!data.items.length) {
    readerMessage(holder, 'Chưa có khoản phạt nào.');
  } else {
    const { wrap, body } = makeTable(['Độc giả', 'Sách', 'Ngày trễ', 'Số tiền', 'Loại phạt', 'Thu tiền'], 'Danh sách tiền phạt');
    data.items.forEach(record => {
      const row = el('tr');
      row.dataset.fineId = record.id;
      const reader = el('td', 'fine-reader', record.readerName);
      if (record.studentId) reader.append(el('small', '', record.studentId));
      const type = el('td');
      type.append(record.type === 'FINALIZED' ? el('span', 'pill fine-final', 'Đã chốt') : el('span', 'pill fine-provisional', 'Tạm tính'));
      const collect = el('td');
      if (record.collected) {
        collect.append(el('span', 'pill fine-collected', 'Đã thu'));
        if (record.collectedAt) collect.append(el('small', 'fine-collect-note', displayDate(record.collectedAt)));
      } else if (record.type === 'FINALIZED') {
        const button = readerButton('Đánh dấu đã thu', () => openCollectFine(record, button));
        button.setAttribute('aria-label', 'Đánh dấu đã thu ' + money(record.amount) + ' của ' + record.readerName + ' cho sách ' + record.bookTitle);
        collect.append(button);
      } else {
        collect.append(el('small', 'fine-collect-note', 'Chờ độc giả trả sách'));
      }
      const amount = el('td');
      amount.append(el('strong', '', money(record.amount)));
      row.append(reader, el('td', '', record.bookTitle), el('td', '', String(record.lateDays)), amount, type, collect);
      body.append(row);
    });
    holder.append(wrap);
    const pager = el('nav', 'pagination');
    pager.id = 'finesPagination';
    pager.setAttribute('aria-label', 'Phân trang tiền phạt');
    holder.append(pager);
    readerPager('finesPagination', data, n => { staffState.page = n; renderFines(); });
  }

  const log = el('section', 'fine-log');
  log.append(el('h2', '', 'Nhật ký thu tiền gần đây'));
  if (!Array.isArray(data.log) || !data.log.length) log.append(el('p', 'muted', 'Chưa có thao tác thu tiền.'));
  else {
    const list = el('ul');
    data.log.forEach(entry => {
      const item = el('li');
      const time = el('time', '', formatDateTime(entry.at));
      time.dateTime = entry.at;
      item.append(time, document.createTextNode(`${entry.actorName} đã thu ${money(entry.amount)} của ${entry.readerName} — “${entry.bookTitle}”`));
      list.append(item);
    });
    log.append(list);
  }
  holder.append(log);
}

/* =====================================================
   3. FINE-05 — Đánh dấu đã thu (có hộp thoại xác nhận)
   ===================================================== */
function setCollectBusy(busy) {
  finesState.busy = busy;
  $('collectFineLoading').hidden = !busy;
  $('cancelCollectFine').disabled = busy;
  $('confirmCollectFine').disabled = busy;
  $('confirmCollectFine').textContent = busy ? 'Đang cập nhật…' : 'Xác nhận đã thu';
}

function openCollectFine(record, trigger) {
  if (!canViewReaders()) { showToast('Chỉ thủ thư được thực hiện thao tác này.'); return; }
  finesState.record = record;
  finesState.focus = trigger;
  $('collectFineText').textContent = `Xác nhận đã thu ${money(record.amount)} từ ${record.readerName} cho sách “${record.bookTitle}”? Thao tác sẽ được ghi vào nhật ký.`;
  $('collectFineError').textContent = '';
  setCollectBusy(false);
  $('collectFineDialog').showModal();
  document.body.style.overflow = 'hidden';
  $('cancelCollectFine').focus(); // mặc định focus vào "Hủy" để tránh bấm nhầm
}

function closeCollectFine(force = false) {
  if (finesState.busy && !force) return;
  finesState.record = null;
  setCollectBusy(false);
  if ($('collectFineDialog').open) {
    $('collectFineDialog').close();
    document.body.style.overflow = '';
    if (finesState.focus && finesState.focus.isConnected) finesState.focus.focus();
  }
  finesState.focus = null;
}

$('cancelCollectFine').addEventListener('click', () => closeCollectFine());
$('collectFineDialog').addEventListener('cancel', event => { event.preventDefault(); closeCollectFine(); });
$('collectFineForm').addEventListener('submit', async event => {
  event.preventDefault();
  const record = finesState.record;
  if (!record || finesState.busy) return;
  const token = getToken();
  $('collectFineError').textContent = '';
  setCollectBusy(true);
  const result = await authRequest(ENDPOINTS.fines + '/' + encodeURIComponent(record.id) + '/collect', { method: 'PATCH' });
  if (finesState.record !== record || getToken() !== token) return; // đã đóng hộp thoại hoặc đổi phiên
  setCollectBusy(false);
  if (!result.ok) {
    $('collectFineError').textContent = result.message; // hiển thị đúng message từ API
    if ([403, 404, 409].includes(result.status)) renderFines(); // dữ liệu trên màn hình đã cũ -> tải lại
    return;
  }
  finesState.focus = null;
  closeCollectFine(true);
  showToast(`Đã ghi nhận thu ${money(record.amount)} của ${record.readerName}.`);
  await renderFines();
  const title = $('finesTitle');
  title.tabIndex = -1;
  title.focus();
});

/* =====================================================
   4. FINE-04 — Tổng tiền phạt của độc giả (trang Sách của tôi)
   ===================================================== */
function fineCell(loan) {
  const cell = el('td', '', loan.fine ? money(loan.fine) : '–');
  if (loan.fine && loan.fineCollected) cell.append(el('small', 'loan-duration', 'Đã thu'));
  return cell;
}

function resetMyFines() {
  myFinesState.version++;
  $('myFines').textContent = '—';
  $('statFines').textContent = '—';
  $('myFinesDetail').textContent = '';
  $('myFinesError').textContent = '';
  $('myFinesRetry').hidden = true;
  $('myFinesCard').classList.remove('has-fine');
  $('myFinesCard').setAttribute('aria-busy', 'false');
}

async function loadMyFines() {
  const token = getToken();
  if (!token) return;
  resetMyFines();
  const version = myFinesState.version;
  $('myFinesCard').setAttribute('aria-busy', 'true');
  $('myFinesDetail').textContent = 'Đang tải…';
  const result = await authRequest(ENDPOINTS.myFines);
  if (version !== myFinesState.version || token !== getToken()) return;
  $('myFinesCard').setAttribute('aria-busy', 'false');
  $('myFinesDetail').textContent = '';
  const data = result.data;
  if (!result.ok || !data || !Number.isFinite(data.total)) {
    $('myFinesError').textContent = result.ok ? 'Dữ liệu tiền phạt không hợp lệ.' : result.message;
    $('myFinesRetry').hidden = false;
    return;
  }
  $('myFines').textContent = money(data.total);
  $('statFines').textContent = money(data.total);
  $('myFinesCard').classList.toggle('has-fine', data.total > 0);
  const parts = [];
  if (data.finalizedUnpaid > 0) parts.push('Đã chốt, chưa thu: ' + money(data.finalizedUnpaid));
  if (data.provisional > 0) parts.push('Tạm tính (sách quá hạn chưa trả): ' + money(data.provisional));
  if (data.collected > 0) parts.push('Đã thu: ' + money(data.collected));
  $('myFinesDetail').textContent = parts.length ? parts.join(' · ') : 'Bạn chưa có khoản phạt nào.';
}

$('myFinesRetry').addEventListener('click', () => loadMyFines());
// Cập nhật khi quay lại tab (thủ thư có thể vừa thu tiền hoặc nhận trả sách)
window.addEventListener('focus', () => {
  if (hasLoanSession() && !$('page-mybooks').hidden) loadMyFines();
});

/* =====================================================
   5. AUTH-07 — Đổi mật khẩu (mật khẩu cũ do backend kiểm tra)
   ===================================================== */
function appendChangePasswordAction(content) {
  content.append(readerButton('Đổi mật khẩu', openChangePassword, 'btn btn-outline profile-action'));
}

function setPasswordBusy(busy) {
  passwordState.busy = busy;
  $('changePasswordForm').setAttribute('aria-busy', String(busy));
  ['cpCurrent', 'cpNew', 'cpConfirm', 'cpCancel', 'cpSubmit'].forEach(id => { $(id).disabled = busy; });
  $('cpLoading').hidden = !busy;
  $('cpSubmit').textContent = busy ? 'Đang đổi…' : 'Đổi mật khẩu';
}

function openChangePassword() {
  if (!requireLoanLogin()) return;
  if ($('utilityDialog').open) $('utilityDialog').close();
  passwordState.version++;
  $('changePasswordForm').reset();
  $('cpError').textContent = '';
  setPasswordBusy(false);
  $('changePasswordDialog').showModal();
  document.body.style.overflow = 'hidden';
  // Sự kiện "close" của hộp thoại Hồ sơ có thể bỏ khóa cuộn sau khi hộp thoại này đã mở.
  setTimeout(() => { if ($('changePasswordDialog').open) document.body.style.overflow = 'hidden'; }, 0);
  $('cpCurrent').focus();
}

function closeChangePassword(force = false) {
  if (passwordState.busy && !force) return;
  passwordState.version++;
  $('changePasswordForm').reset(); // không giữ mật khẩu trong ô nhập
  $('cpError').textContent = '';
  setPasswordBusy(false);
  if ($('changePasswordDialog').open) {
    $('changePasswordDialog').close();
    document.body.style.overflow = '';
    if ($('profileButton').isConnected && !$('appView').hidden) $('profileButton').focus();
  }
}

$('cpCancel').addEventListener('click', () => closeChangePassword());
$('changePasswordDialog').addEventListener('cancel', event => { event.preventDefault(); closeChangePassword(); });
$('changePasswordForm').addEventListener('submit', async event => {
  event.preventDefault();
  if (passwordState.busy) return;
  const error = $('cpError');
  const current = $('cpCurrent').value;
  const next = $('cpNew').value;
  // Chỉ kiểm tra định dạng để báo lỗi nhanh; mật khẩu cũ có đúng hay không do backend quyết định.
  if (!current) { error.textContent = 'Vui lòng nhập mật khẩu cũ.'; $('cpCurrent').focus(); return; }
  if (next.length < 6) { error.textContent = 'Mật khẩu mới cần có ít nhất 6 ký tự.'; $('cpNew').focus(); return; }
  if (next !== $('cpConfirm').value) { error.textContent = 'Mật khẩu xác nhận chưa khớp.'; $('cpConfirm').focus(); return; }
  if (next === current) { error.textContent = 'Mật khẩu mới phải khác mật khẩu cũ.'; $('cpNew').focus(); return; }

  const token = getToken();
  const version = ++passwordState.version;
  error.textContent = '';
  setPasswordBusy(true);
  // Dùng request() với JWT thủ công: mật khẩu cũ sai không được làm đăng xuất người dùng.
  const result = await request(ENDPOINTS.changePassword, {
    method: CHANGE_PASSWORD_METHOD,
    body: JSON.stringify({ currentPassword: current, newPassword: next }),
    headers: { Authorization: 'Bearer ' + token },
  });
  if (version !== passwordState.version || getToken() !== token) return;
  setPasswordBusy(false);
  if (!result.ok) {
    if (result.status === 401 && !hasLoanSession()) { // JWT hết hạn thật sự -> đăng nhập lại
      closeChangePassword(true);
      logout();
      openModal('login');
      $('loginNotice').textContent = result.message || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      return;
    }
    error.textContent = result.message; // ví dụ: "Mật khẩu cũ không chính xác."
    $('cpCurrent').focus();
    return;
  }
  closeChangePassword(true);
  showToast('Đổi mật khẩu thành công. Lần đăng nhập sau hãy dùng mật khẩu mới.');
});
