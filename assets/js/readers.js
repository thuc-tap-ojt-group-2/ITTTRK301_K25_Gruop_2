/* DA-07 — service và giao diện độc giả, dùng chung dữ liệu DA-06. */
const readersState = { page: 1, version: 0, timer: null };
const historyState = { email: null, page: 1, version: 0, focus: null };
const READERS_PAGE_SIZE = 8;

function readReaderUsers() {
  const users = readStoredObject(MOCK_USERS_KEY, []);
  if (!Array.isArray(users) || users.some(u => !u || typeof u.email !== 'string')) throw new Error('Dữ liệu tài khoản không hợp lệ.');
  return users;
}
function canViewReaders() {
  try {
    if (!hasLoanSession()) return false;
    const user = getUser();
    const claims = decodeJwt(getToken());
    if (userEmail({ email: claims.email || claims.sub }) !== userEmail(user)) return false;
    const stored = readReaderUsers().find(u => userEmail(u) === userEmail(user));
    return normalizeRole(user.role) === 'LIBRARIAN' && stored && normalizeRole(stored.role) === 'LIBRARIAN' && !isLocked(stored);
  } catch { return false; }
}
function librarianAccess(options) {
  const token = String(options.headers && options.headers.Authorization || '').replace(/^Bearer /, '');
  if (!token || token !== getToken() || !hasLoanSession()) return mockReply(401, { message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });
  if (!canViewReaders()) return mockReply(403, { message: 'Chỉ thủ thư được thực hiện thao tác này.' });
  return null;
}
function readerSearchText(value) {
  return String(value || '').trim().toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/\s+/g, ' ');
}
function unreturnedLoan(loan) { return ['BORROWING', 'OVERDUE'].includes(loan.status) && !loan.returnDate; }
function readerStatus(user) {
  if (isLocked(user)) return { code: 'locked', label: 'Đã khóa' };
  const code = String(user.status || '').toUpperCase();
  const labels = { ACTIVE: 'Hoạt động', INACTIVE: 'Ngừng hoạt động', PENDING: 'Chờ duyệt', DISABLED: 'Ngừng hoạt động' };
  return { code: code === 'ACTIVE' ? 'active' : 'inactive', label: labels[code] || code || 'Chưa xác định' };
}
function paginateReaders(items, rawPage) {
  const pages = Math.max(1, Math.ceil(items.length / READERS_PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Math.floor(Number(rawPage) || 1)));
  return { items: items.slice((page - 1) * READERS_PAGE_SIZE, page * READERS_PAGE_SIZE), page, pages, total: items.length };
}
function mockReadersRequest(path, query, options) {
  const denied = librarianAccess(options);
  if (denied) return denied;
  if ((options.method || 'GET') !== 'GET') return mockReply(405, { message: 'Thao tác không được hỗ trợ.' });
  const params = new URLSearchParams(query);
  const users = readReaderUsers().filter(u => normalizeRole(u.role) === 'READER');
  const loans = readDemoLoans();
  if (path === '/readers') {
    const counts = new Map();
    loans.filter(unreturnedLoan).forEach(loan => {
      const email = userEmail({ email: loan.userEmail });
      counts.set(email, (counts.get(email) || 0) + 1);
    });
    const term = readerSearchText(params.get('q'));
    const filtered = users.filter(u => readerSearchText(u.fullName).includes(term) || readerSearchText(u.studentId).includes(term));
    const result = paginateReaders(filtered, params.get('page'));
    result.items = result.items.map(u => ({ fullName: u.fullName, studentId: u.studentId, email: u.email, borrowing: counts.get(userEmail(u)) || 0, status: readerStatus(u) }));
    return mockReply(200, { ...result, members: users.length });
  }
  const match = path.match(/^\/readers\/([^/]+)\/loans$/);
  if (!match) return mockReply(404, { message: 'Không tìm thấy dữ liệu.' });
  const email = userEmail({ email: decodeURIComponent(match[1]) });
  const user = users.find(u => userEmail(u) === email);
  if (!user) return mockReply(404, { message: 'Không tìm thấy độc giả.' });
  const items = loans.filter(loan => userEmail({ email: loan.userEmail }) === email)
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')) || String(b.id).localeCompare(String(a.id)));
  return mockReply(200, { ...paginateReaders(items, params.get('page')), reader: { fullName: user.fullName, studentId: user.studentId, email: user.email } });
}
function readerButton(text, action, className = 'btn btn-outline') {
  const button = el('button', className, text);
  button.type = 'button';
  button.addEventListener('click', action);
  return button;
}
function readerPager(id, result, action) {
  const nav = $(id);
  nav.replaceChildren();
  if (result.pages <= 1) return;
  const previous = readerButton('‹ Trước', () => action(result.page - 1), 'page-btn');
  previous.disabled = result.page <= 1;
  const next = readerButton('Sau ›', () => action(result.page + 1), 'page-btn');
  next.disabled = result.page >= result.pages;
  nav.append(previous);
  // Chỉ vẽ các nút gần trang hiện tại để không tạo hàng nghìn nút.
  for (let n = Math.max(1, result.page - 2); n <= Math.min(result.pages, result.page + 2); n++) {
    const button = readerButton(String(n), () => action(n), 'page-btn' + (n === result.page ? ' active' : ''));
    if (n === result.page) button.setAttribute('aria-current', 'page');
    nav.append(button);
  }
  nav.append(next, el('span', 'pagination-count', `Trang ${result.page}/${result.pages} · ${result.total} mục`));
}
function readerMessage(holder, message, retry) {
  holder.replaceChildren();
  const text = el('p', retry ? 'error table-empty' : 'table-empty', message);
  text.setAttribute('role', retry ? 'alert' : 'status');
  holder.append(text);
  if (retry) holder.append(readerButton('Thử lại', retry));
}
function resetReaders() {
  readersState.version++;
  clearTimeout(readersState.timer);
  readersState.page = 1;
  $('readersSearch').value = '';
  $('clearReadersSearch').hidden = true;
  $('readersList').replaceChildren();
  $('readersList').setAttribute('aria-busy', 'false');
  $('readersCount').textContent = '';
  $('readersPagination').replaceChildren();
  closeReaderHistory();
}
async function loadReaders() {
  const holder = $('readersList');
  const version = ++readersState.version;
  const token = getToken();
  const term = $('readersSearch').value.trim();
  $('clearReadersSearch').hidden = !$('readersSearch').value;
  $('readersCount').textContent = 'Đang tải…';
  $('readersPagination').replaceChildren();
  readerMessage(holder, 'Đang tải danh sách độc giả…');
  holder.setAttribute('aria-busy', 'true');
  const response = await authRequest('/readers?q=' + encodeURIComponent(term) + '&page=' + readersState.page);
  if (version !== readersState.version || token !== getToken() || $('page-readers').hidden) return;
  holder.setAttribute('aria-busy', 'false');
  if (!response.ok) {
    $('readersCount').textContent = 'Chưa tải được danh sách';
    readerMessage(holder, response.message, () => loadReaders());
    return;
  }
  const data = response.data;
  readersState.page = data.page;
  $('readersCount').textContent = term ? `${data.total} kết quả / ${data.members} thành viên` : `${data.members} thành viên`;
  holder.replaceChildren();
  if (!data.items.length) {
    readerMessage(holder, term ? 'Không tìm thấy độc giả phù hợp.' : 'Chưa có độc giả.');
  } else {
    const { wrap, body } = makeTable(['Họ tên', 'Mã SV', 'Email', 'Đang mượn', 'Trạng thái', 'Thao tác'], 'Danh sách độc giả');
    data.items.forEach(reader => {
      const row = el('tr');
      row.dataset.readerEmail = reader.email;
      const identity = el('td');
      const person = el('div', 'reader-person');
      const avatar = el('span', 'avatar', initials(reader.fullName));
      avatar.setAttribute('aria-hidden', 'true');
      person.append(avatar, el('span', '', reader.fullName || 'Chưa cập nhật'));
      identity.append(person);
      const status = el('td');
      status.append(el('span', 'pill reader-status-' + reader.status.code, reader.status.label));
      const actions = el('td');
      const button = readerButton('Xem lịch sử', () => openReaderHistory(reader));
      button.setAttribute('aria-label', 'Xem lịch sử của ' + reader.fullName);
      actions.append(button);
      row.append(identity, el('td', '', reader.studentId || '—'), el('td', '', reader.email), el('td', '', String(reader.borrowing)), status, actions);
      body.append(row);
    });
    holder.append(wrap);
  }
  readerPager('readersPagination', data, page => { readersState.page = page; loadReaders(); });
}
function searchReaders(immediate = false) {
  clearTimeout(readersState.timer);
  readersState.version++; // Invalider ngay khi nhập, kể cả trong khoảng debounce.
  readersState.page = 1;
  $('clearReadersSearch').hidden = !$('readersSearch').value;
  $('readersCount').textContent = 'Đang tìm…';
  $('readersPagination').replaceChildren();
  $('readersList').setAttribute('aria-busy', 'true');
  readerMessage($('readersList'), 'Đang tìm độc giả…');
  if (immediate) loadReaders();
  else readersState.timer = setTimeout(loadReaders, 180);
}
$('readersSearch').addEventListener('input', () => searchReaders());
$('readersSearchForm').addEventListener('submit', event => { event.preventDefault(); searchReaders(true); });
$('clearReadersSearch').addEventListener('click', () => { $('readersSearch').value = ''; searchReaders(true); $('readersSearch').focus(); });
function openReaderHistory(reader) {
  historyState.version++;
  historyState.email = reader.email;
  historyState.page = 1;
  historyState.focus = document.activeElement;
  $('readerHistoryIdentity').textContent = `${reader.fullName} · ${reader.studentId || 'Chưa có mã SV'}`;
  $('readerHistoryDialog').showModal();
  document.body.style.overflow = 'hidden';
  $('closeReaderHistory').focus();
  loadReaderHistory();
}
function closeReaderHistory() {
  historyState.version++;
  historyState.email = null;
  if ($('readerHistoryDialog').open) {
    $('readerHistoryDialog').close();
    document.body.style.overflow = '';
    if (historyState.focus && historyState.focus.isConnected) historyState.focus.focus();
  }
  $('readerHistoryIdentity').textContent = '';
  $('readerHistoryCount').textContent = '';
  $('readerHistoryList').replaceChildren();
  $('readerHistoryList').setAttribute('aria-busy', 'false');
  $('readerHistoryPagination').replaceChildren();
}
$('closeReaderHistory').addEventListener('click', closeReaderHistory);
$('readerHistoryDialog').addEventListener('cancel', event => { event.preventDefault(); closeReaderHistory(); });
async function loadReaderHistory() {
  const version = ++historyState.version;
  const token = getToken();
  const holder = $('readerHistoryList');
  $('readerHistoryPagination').replaceChildren();
  $('readerHistoryCount').textContent = 'Đang tải…';
  readerMessage(holder, 'Đang tải lịch sử mượn…');
  holder.setAttribute('aria-busy', 'true');
  const response = await authRequest('/readers/' + encodeURIComponent(historyState.email) + '/loans?page=' + historyState.page);
  if (version !== historyState.version || token !== getToken() || !$('readerHistoryDialog').open) return;
  holder.setAttribute('aria-busy', 'false');
  if (!response.ok) { $('readerHistoryCount').textContent = ''; readerMessage(holder, response.message, loadReaderHistory); return; }
  const data = response.data;
  historyState.page = data.page;
  $('readerHistoryIdentity').textContent = `${data.reader.fullName} · ${data.reader.studentId || 'Chưa có mã SV'}`;
  $('readerHistoryCount').textContent = `${data.total} phiếu mượn · Mới nhất trước`;
  holder.replaceChildren();
  if (!data.items.length) readerMessage(holder, 'Độc giả chưa có lịch sử mượn.');
  else {
    const { wrap, body } = makeTable(['Mã phiếu', 'Sách', 'Ngày đăng ký', 'Ngày mượn', 'Hạn trả', 'Ngày trả thực tế', 'Trạng thái'], 'Lịch sử mượn của độc giả');
    data.items.forEach(loan => {
      const row = el('tr');
      row.dataset.loanId = loan.id;
      const status = el('td');
      status.append(statusBadge(loan));
      const borrowed = ['BORROWING', 'OVERDUE', 'RETURNED'].includes(loan.status) ? loan.borrowedAt || loan.createdAt : null;
      row.append(el('td', 'history-code', loan.id), el('td', 'history-book', loan.bookTitle), el('td', '', displayDate(loan.createdAt)), el('td', '', displayDate(borrowed)), el('td', '', displayDate(loan.dueDate)), el('td', '', displayDate(loan.returnDate)), status);
      body.append(row);
    });
    holder.append(wrap);
  }
  readerPager('readerHistoryPagination', data, page => { historyState.page = page; loadReaderHistory(); });
}
window.addEventListener('storage', event => {
  if ([STORAGE_USER, STORAGE_TOKEN, null].includes(event.key) && !hasLoanSession()) resetReaders();
  if ([MOCK_USERS_KEY, DEMO_LOANS_KEY].includes(event.key) && !$('page-readers').hidden) {
    if (!canViewReaders()) { resetReaders(); navigate('overview'); return; }
    loadReaders();
    if ($('readerHistoryDialog').open) loadReaderHistory();
  }
});
