/* Giao diện thủ thư dùng chung DA-03…DA-07. Dữ liệu demo, không phải backend. */
const LIBRARIAN_PAGES = ['staffOverview', 'manageBooks', 'approvals', 'circulation', 'readers', 'fines'];
const STAFF_BOOKS_KEY = 'ptit_librarian_catalog_v1';
const STAFF_SEED_KEY = 'ptit_librarian_seed_v1';
const staffState = { version: 0, page: 1, current: '', busy: false, action: null, focus: null, timer: null };
const staffLabels = { staffOverview: 'Tổng quan', manageBooks: 'Quản lý sách', approvals: 'Duyệt đăng ký', circulation: 'Mượn / Trả', fines: 'Tiền phạt' };
Object.assign(PAGE_TITLES, staffLabels);

// Mở rộng shell hiện có, không thay thế trang độc giả của các mốc cũ.
const staffMenu = document.querySelector('.sidebar-menu');
Object.entries(staffLabels).forEach(([key, title]) => {
  const button = readerButton(title, () => navigate(key), 'menu-item');
  button.dataset.nav = key;
  button.hidden = true;
  if (key === 'approvals') { const badge = el('span', 'nav-count'); badge.id = 'staffPendingBadge'; badge.hidden = true; button.append(badge); }
  staffMenu.append(button);
  const section = el('section', 'page');
  section.id = 'page-' + key;
  section.hidden = true;
  const header = el('div', 'staff-page-heading');
  const titleBox = el('div');
  const heading = el('h1', '', title);
  heading.id = key + 'Title';
  section.setAttribute('aria-labelledby', heading.id);
  const subtitle = el('p', 'muted'); subtitle.id = key + 'Subtitle';
  titleBox.append(heading, subtitle); header.append(titleBox); section.append(header);
  if (key === 'manageBooks') {
    const add = readerButton('Thêm sách', openStaffBook, 'btn btn-primary'); add.id = 'staffAddBook'; header.append(add);
    const form = el('form', 'readers-search'); form.setAttribute('role', 'search');
    const input = el('input'); input.type = 'search'; input.id = 'staffBookSearch'; input.placeholder = 'Tìm theo tên, tác giả hoặc thể loại'; input.setAttribute('aria-label', input.placeholder);
    input.addEventListener('input', () => { staffState.page = 1; renderLibrarian('manageBooks', true); });
    form.addEventListener('submit', e => { e.preventDefault(); renderLibrarian('manageBooks', true); }); form.append(input); section.append(form);
  }
  const content = el('div', key === 'staffOverview' ? 'staff-dashboard' : 'table-panel'); content.id = key + 'Content';
  section.append(content);
  document.querySelector('main.content').append(section);
});
staffMenu.append($('readersMenu'), document.querySelector('[data-nav="fines"]'));

const staffDialog = el('dialog', 'modal staff-action-dialog');
staffDialog.id = 'staffActionDialog';
staffDialog.setAttribute('aria-labelledby', 'staffActionTitle');
staffDialog.innerHTML = '<h2 id="staffActionTitle"></h2><form id="staffActionForm"><div id="staffActionBody"></div><p class="error" id="staffActionError" role="alert"></p><div class="form-actions"><button type="button" class="btn btn-outline" id="staffActionCancel">Hủy</button><button type="submit" class="btn btn-primary" id="staffActionConfirm">Xác nhận</button></div></form>';
document.body.append(staffDialog);

function configureLibrarianMenu(active) {
  $('appView').classList.toggle('librarian-view', active);
  document.querySelectorAll('.sidebar-menu [data-nav]').forEach(button => { button.hidden = LIBRARIAN_PAGES.includes(button.dataset.nav) ? !active : active; });
  if (active) updateStaffBadges();
  else { const badge = $('staffNotificationBadge'); if (badge) badge.remove(); }
}
function prepareLibrarianDemo(user) {
  if (!USE_MOCK_API || !['LIBRARIAN', 'ADMIN'].includes(normalizeRole(user.role))) return;
  try {
    const users = mockLoadUsers();
    const staff = users.find(u => userEmail(u) === userEmail(user));
    if (staff && staff.fullName === 'Thủ thư') {
      staff.fullName = 'Trần Thị Thủ Thư'; user.fullName = staff.fullName;
      localStorage.setItem(STORAGE_USER, JSON.stringify(user));
    }
    if (!localStorage.getItem(STAFF_SEED_KEY)) {
      if (!users.some(u => userEmail(u) === 'ha@stu.ptit.edu.vn')) users.push({ fullName: 'Lê Thu Hà', studentId: 'B22DCCN142', email: 'ha@stu.ptit.edu.vn', password: '123456', role: 'READER', status: 'ACTIVE' });
      localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
      const loans = readDemoLoans();
      const day = offset => dateInVietnam(new Date(Date.now() + offset * 86400000));
      ['docgia@ptit.edu.vn', 'ha@stu.ptit.edu.vn'].forEach((email, person) => {
        if (loans.some(loan => userEmail({ email: loan.userEmail }) === email)) return;
        const ids = person ? [4, 5, 6, 5, 3, 1, 5, 3, 4, 3, 1] : [2, 1, 3, 4, 1, 3, 2, 1, 5, 4, 3];
        ids.forEach((bookId, index) => {
          const ago = -136 + index * 10 + person * 4;
          const late = index === 1 || index === 5 ? 3 : 0;
          loans.push({ id: `STAFF-HISTORY-${person}-${index}`, userEmail: email, bookId, bookTitle: MOCK_BOOKS.find(b => b.id === bookId).title, status: 'RETURNED', days: 14, createdAt: day(ago) + 'T00:00:00Z', dueDate: day(ago + 14), returnDate: day(ago + 14 + late), fine: late * 5000 });
        });
        const currentIds = person ? [4, 8] : [1];
        currentIds.forEach((bookId, i) => loans.push({ id: `STAFF-CURRENT-${person}-${i}`, userEmail: email, bookId, bookTitle: MOCK_BOOKS.find(b => b.id === bookId).title, status: 'BORROWING', days: 14, createdAt: day(person && !i ? -20 : -5) + 'T00:00:00Z', dueDate: day(person && !i ? -6 : 9), returnDate: null }));
        const bookId = person ? 5 : 3;
        loans.push({ id: `STAFF-PENDING-${person}`, userEmail: email, bookId, bookTitle: MOCK_BOOKS.find(b => b.id === bookId).title, status: 'PENDING', days: 14, createdAt: new Date().toISOString(), dueDate: null, returnDate: null });
      });
      localStorage.setItem(DEMO_LOANS_KEY, JSON.stringify(loans));
      localStorage.setItem(STAFF_SEED_KEY, '1');
    } else localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
    if (!localStorage.getItem(STAFF_BOOKS_KEY)) {
      const loans = readDemoLoans();
      localStorage.setItem(STAFF_BOOKS_KEY, JSON.stringify(MOCK_BOOKS.map(book => ({ ...book, totalCopies: book.availableCopies + loans.filter(l => l.bookId === book.id && unreturnedLoan(l)).length }))));
    }
    syncLibrarianCatalog();
  } catch { showToast('Không thể đọc hoặc chuẩn bị dữ liệu thủ thư. Vui lòng kiểm tra bộ nhớ trình duyệt.'); }
}
function librarianCatalog() {
  const stored = readStoredObject(STAFF_BOOKS_KEY, null);
  if (stored === null) return MOCK_BOOKS.map(book => ({ ...book, totalCopies: book.availableCopies + readDemoLoans().filter(l => l.bookId === book.id && unreturnedLoan(l)).length }));
  if (!Array.isArray(stored)) throw new Error('Dữ liệu sách không hợp lệ.');
  const active = readDemoLoans().filter(unreturnedLoan);
  return stored.map(book => ({ ...book, availableCopies: Math.max(0, book.totalCopies - active.filter(loan => loan.bookId === book.id).length) }));
}
function syncLibrarianCatalog() {
  if (!localStorage.getItem(STAFF_BOOKS_KEY)) return;
  const items = librarianCatalog();
  MOCK_BOOKS.splice(0, MOCK_BOOKS.length, ...items);
}
function fineForLoan(loan) {
  if (!loan.dueDate || !['BORROWING', 'OVERDUE', 'RETURNED'].includes(loan.status)) return { days: 0, amount: 0 };
  const end = loan.returnDate || dateInVietnam();
  const days = Math.max(0, Math.floor((Date.parse(end.slice(0, 10)) - Date.parse(loan.dueDate.slice(0, 10))) / 86400000));
  return { days, amount: loan.status === 'RETURNED' && Number.isFinite(loan.fine) ? loan.fine : days * 5000 };
}
function mockLibrarianRequest(path, options, body) {
  const denied = librarianAccess(options); if (denied) return denied;
  const method = options.method || 'GET';
  if (path === '/librarian' && method === 'GET') {
    const users = readReaderUsers().filter(u => normalizeRole(u.role) === 'READER').map(({ password, ...user }) => user);
    const reviews = [...SAMPLE_REVIEWS, ...readStoredObject(REVIEWS_KEY, [])].filter((review, index, all) => !all.slice(index + 1).some(r => r.bookId === review.bookId && r.userEmail === review.userEmail));
    return mockReply(200, { books: librarianCatalog(), loans: readDemoLoans(), users, reviews });
  }
  return withDemoLoanLock(() => {
    const deniedNow = librarianAccess(options); if (deniedNow) return deniedNow;
    const catalog = librarianCatalog();
    const loans = readDemoLoans();
    if (path === '/librarian/books' && method === 'POST') {
      const title = String(body.title || '').trim(); const author = String(body.author || '').trim(); const category = String(body.category || '').trim();
      if (!title || !author || !category || title.length > 200 || author.length > 120 || !Number.isInteger(body.totalCopies) || body.totalCopies < 1 || body.totalCopies > 10000) return mockReply(400, { message: 'Nhập tên sách, tác giả, thể loại và số bản từ 1 đến 10.000.' });
      const book = { id: Date.now(), title, author, category, totalCopies: body.totalCopies, availableCopies: body.totalCopies };
      localStorage.setItem(STAFF_BOOKS_KEY, JSON.stringify([...catalog, book])); syncLibrarianCatalog(); return mockReply(201, book);
    }
    const bookMatch = path.match(/^\/librarian\/books\/(\d+)$/);
    if (bookMatch && method === 'DELETE') {
      const id = Number(bookMatch[1]);
      if (!catalog.some(b => b.id === id)) return mockReply(404, { message: 'Sách không còn tồn tại.' });
      if (loans.some(l => l.bookId === id && (unreturnedLoan(l) || l.status === 'PENDING'))) return mockReply(409, { message: 'Không thể xóa sách đang mượn hoặc có đăng ký chờ duyệt.' });
      localStorage.setItem(STAFF_BOOKS_KEY, JSON.stringify(catalog.filter(b => b.id !== id))); syncLibrarianCatalog(); return mockReply(200, {});
    }
    const loanMatch = path.match(/^\/librarian\/loans\/([^/]+)\/(approve|reject|return)$/);
    if (!loanMatch || method !== 'PATCH') return mockReply(405, { message: 'Thao tác không được hỗ trợ.' });
    const loan = loans.find(l => String(l.id) === decodeURIComponent(loanMatch[1]));
    if (!loan) return mockReply(404, { message: 'Không tìm thấy phiếu.' });
    const action = loanMatch[2];
    if (action === 'return') {
      if (!unreturnedLoan(loan)) return mockReply(409, { message: 'Phiếu này không còn sách đang mượn.' });
      loan.fine = fineForLoan(loan).amount; loan.returnDate = dateInVietnam(); loan.status = 'RETURNED';
    } else {
      if (loan.status !== 'PENDING') return mockReply(409, { message: 'Phiếu đã được xử lý. Vui lòng tải lại danh sách.' });
      if (action === 'approve') {
        const reader = readReaderUsers().find(u => userEmail(u) === userEmail({ email: loan.userEmail }));
        if (!reader || isLocked(reader)) return mockReply(409, { message: 'Tài khoản độc giả không khả dụng.' });
        const book = catalog.find(b => b.id === loan.bookId);
        if (!book || book.availableCopies <= 0) return mockReply(409, { message: 'Sách không còn bản khả dụng.' });
        const mine = loans.filter(l => userEmail({ email: l.userEmail }) === userEmail(reader));
        if (mine.some(l => unreturnedLoan(l) && isLoanOverdue(l))) return mockReply(409, { message: 'Độc giả còn sách quá hạn chưa trả.' });
        if (mine.filter(unreturnedLoan).length >= 3 || mine.some(l => l.bookId === loan.bookId && unreturnedLoan(l))) return mockReply(409, { message: 'Độc giả đã đủ 3 sách hoặc đang mượn cuốn này.' });
        loan.status = 'BORROWING'; loan.borrowedAt = new Date().toISOString();
        loan.dueDate = dateInVietnam(new Date(Date.now() + (LOAN_DAYS.includes(loan.days) ? loan.days : 14) * 86400000));
      } else { loan.status = 'REJECTED'; loan.rejectedAt = new Date().toISOString(); }
    }
    localStorage.setItem(DEMO_LOANS_KEY, JSON.stringify(loans)); syncLibrarianCatalog(); return mockReply(200, loan);
  });
}
function resetLibrarian() {
  staffState.version++; clearTimeout(staffState.timer); staffState.page = 1; staffState.current = '';
  closeStaffAction(true);
  Object.keys(staffLabels).forEach(key => { $(key + 'Content').replaceChildren(); $(key + 'Subtitle').textContent = ''; });
}
function updateStaffBadges(data) {
  try {
    const loans = data ? data.loans : readDemoLoans();
    const pending = loans.filter(l => l.status === 'PENDING').length;
    $('staffPendingBadge').textContent = pending; $('staffPendingBadge').hidden = !pending;
    let notification = $('staffNotificationBadge');
    if (!notification) { notification = el('span', 'nav-count'); notification.id = 'staffNotificationBadge'; $('notificationsButton').append(notification); }
    const count = pending + loans.filter(l => unreturnedLoan(l) && isLoanOverdue(l)).length;
    notification.textContent = count; notification.hidden = !count;
  } catch { $('staffPendingBadge').hidden = true; }
}
async function renderLibrarian(page, keepPage = false) {
  if (!keepPage || staffState.current !== page) staffState.page = 1;
  staffState.current = page;
  const version = ++staffState.version, token = getToken();
  const holder = $(page + 'Content');
  readerMessage(holder, 'Đang tải…'); holder.setAttribute('aria-busy', 'true');
  const result = await authRequest('/librarian');
  if (version !== staffState.version || getToken() !== token || $('page-' + page).hidden) return;
  holder.setAttribute('aria-busy', 'false');
  if (!result.ok) { readerMessage(holder, result.message, () => renderLibrarian(page, true)); return; }
  const data = result.data; holder.replaceChildren(); updateStaffBadges(data);
  const name = email => { const user = data.users.find(u => userEmail(u) === userEmail({ email })); return user ? user.fullName : email; };
  if (page === 'staffOverview') { renderStaffDashboard(data, holder, name); return; }
  let items, headings;
  if (page === 'manageBooks') {
    const term = readerSearchText($('staffBookSearch').value);
    items = data.books.filter(b => readerSearchText([b.title, b.author, b.category].join(' ')).includes(term));
    $('manageBooksSubtitle').textContent = term ? `${items.length} kết quả / ${data.books.length} đầu sách` : `${data.books.length} đầu sách`;
    headings = ['Tên sách', 'Tác giả', 'Thể loại', 'Còn lại', 'Thao tác'];
  } else if (page === 'approvals') {
    items = data.loans.filter(l => l.status === 'PENDING').sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    $('approvalsTitle').textContent = 'Duyệt đăng ký mượn'; $('approvalsSubtitle').textContent = `${items.length} đăng ký đang chờ`;
    headings = ['Độc giả', 'Sách', 'Ngày đăng ký', 'Thời hạn', 'Còn lại', 'Thao tác'];
  } else if (page === 'circulation') {
    items = data.loans.filter(l => ['BORROWING', 'OVERDUE', 'RETURNED'].includes(l.status)).sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
    $('circulationSubtitle').textContent = 'Theo dõi phiếu mượn và nhận sách trả'; headings = ['Độc giả', 'Sách', 'Ngày mượn', 'Hạn trả', 'Trạng thái', 'Thao tác'];
  } else {
    items = data.loans.filter(l => fineForLoan(l).amount > 0).sort((a, b) => Number(unreturnedLoan(b)) - Number(unreturnedLoan(a)));
    $('finesSubtitle').textContent = 'Mức phạt 5.000đ mỗi ngày trễ'; headings = ['Độc giả', 'Sách', 'Ngày trễ', 'Số tiền', 'Tình trạng'];
  }
  const paged = paginateReaders(items, staffState.page); staffState.page = paged.page;
  if (!items.length) { readerMessage(holder, page === 'approvals' ? 'Không có đăng ký chờ duyệt.' : 'Chưa có dữ liệu phù hợp.'); return; }
  const { wrap, body } = makeTable(headings, PAGE_TITLES[page]);
  paged.items.forEach(item => {
    const row = el('tr'); row.dataset.staffId = item.id;
    const cell = text => el('td', '', text);
    if (page === 'manageBooks') {
      const title = cell(''); title.append(el('strong', '', item.title));
      const count = cell(''); count.append(el('span', 'pill' + (!item.availableCopies ? ' pill-out' : ''), `${item.availableCopies}/${item.totalCopies}`));
      const actions = cell(''); actions.append(readerButton('Xóa', () => openStaffConfirm('delete', item), 'btn btn-outline staff-danger'));
      row.append(title, cell(item.author), cell(item.category), count, actions);
    } else {
      const identity = cell(name(item.userEmail));
      if (page === 'approvals') {
        const reader = data.users.find(u => userEmail(u) === userEmail({ email: item.userEmail }));
        identity.append(el('small', 'loan-duration', reader && reader.studentId || ''));
        const actions = cell(''); actions.className = 'staff-row-actions';
        actions.append(readerButton('Duyệt', () => openStaffConfirm('approve', item)), readerButton('Từ chối', () => openStaffConfirm('reject', item), 'btn btn-outline staff-danger'));
        row.append(identity, cell(item.bookTitle), cell(displayDate(item.createdAt)), cell(`${item.days} ngày`), cell(String(data.books.find(b => b.id === item.bookId)?.availableCopies || 0)), actions);
      } else if (page === 'circulation') {
        const status = cell(''); status.append(statusBadge(item)); const action = cell('');
        if (unreturnedLoan(item)) action.append(readerButton('Nhận trả', () => openStaffConfirm('return', item)));
        row.append(identity, cell(item.bookTitle), cell(displayDate(item.borrowedAt || item.createdAt)), cell(displayDate(item.dueDate)), status, action);
      } else {
        const fine = fineForLoan(item); const amount = cell(''); amount.append(el('strong', '', money(fine.amount)));
        const status = cell(''); status.append(el('span', 'pill' + (unreturnedLoan(item) ? ' pill-out' : ''), unreturnedLoan(item) ? 'Đang tạm tính' : 'Đã chốt khi trả'));
        row.append(identity, cell(item.bookTitle), cell(String(fine.days)), amount, status);
      }
    }
    body.append(row);
  });
  holder.append(wrap);
  const pager = el('nav', 'pagination'); pager.id = page + 'Pagination'; pager.setAttribute('aria-label', 'Phân trang ' + PAGE_TITLES[page]); holder.append(pager);
  readerPager(pager.id, paged, n => { staffState.page = n; renderLibrarian(page, true); });
}
function renderStaffDashboard(data, holder, name) {
  $('staffOverviewTitle').textContent = 'Xin chào, ' + (getUser().fullName || 'Thủ thư'); $('staffOverviewSubtitle').textContent = 'Vai trò: Thủ thư';
  const active = data.loans.filter(unreturnedLoan), overdue = active.filter(isLoanOverdue);
  const stats = el('div', 'staff-stats');
  [[data.books.reduce((n, b) => n + b.totalCopies, 0), 'Cuốn sách trong kho'], [data.loans.filter(l => l.status === 'PENDING').length, 'Đăng ký chờ duyệt'], [active.length, 'Đang cho mượn'], [overdue.length, 'Phiếu quá hạn'], [money(data.loans.reduce((n, l) => n + fineForLoan(l).amount, 0)), 'Tổng tiền phạt']].forEach(([value, label], i) => {
    const card = el('div', 'stat-card'); const number = el('strong', i === 3 ? 'staff-danger-text' : '', String(value)); card.append(number, el('span', '', label)); stats.append(card);
  }); holder.append(stats);
  const charts = el('div', 'staff-charts');
  const panel = title => { const p = el('section', 'staff-chart'); p.append(el('h2', '', title)); charts.append(p); return p; };
  const monthly = panel('Lượt mượn 6 tháng gần đây'); const bars = el('div', 'staff-bars');
  const today = dateInVietnam(); const months = Array.from({ length: 6 }, (_, i) => { const date = new Date(today.slice(0, 7) + '-01T00:00:00Z'); date.setUTCMonth(date.getUTCMonth() - 5 + i); const key = date.toISOString().slice(0, 7); return { label: 'T' + (date.getUTCMonth() + 1), count: data.loans.filter(l => ['BORROWING', 'OVERDUE', 'RETURNED'].includes(l.status) && String(l.borrowedAt || l.createdAt).startsWith(key)).length }; });
  const peak = Math.max(1, ...months.map(m => m.count));
  months.forEach(m => { const column = el('div', 'staff-bar-column'); column.append(el('span', '', String(m.count))); const bar = el('div', 'staff-bar'); bar.style.height = Math.max(2, m.count / peak * 100) + 'px'; column.append(bar, el('small', '', m.label)); bars.append(column); }); monthly.append(bars);
  const popular = panel('Sách được mượn nhiều nhất');
  const counts = new Map(); data.loans.filter(l => ['BORROWING', 'OVERDUE', 'RETURNED'].includes(l.status)).forEach(l => { const previous = counts.get(l.bookId) || { title: l.bookTitle, count: 0 }; previous.count++; counts.set(l.bookId, previous); });
  const ranked = [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 5);
  ranked.forEach(book => { const line = el('div', 'staff-rank'); const label = el('div'); label.append(el('span', '', book.title), el('strong', '', String(book.count))); const track = el('div', 'staff-track'); const fill = el('div'); fill.style.width = book.count / ranked[0].count * 100 + '%'; track.append(fill); line.append(label, track); popular.append(line); });
  if (!ranked.length) popular.append(el('p', 'muted', 'Chưa có lượt mượn.'));
  const categories = panel('Cơ cấu theo thể loại'); const categoryMap = new Map(); data.books.forEach(b => categoryMap.set(b.category, (categoryMap.get(b.category) || 0) + 1));
  const categoryLayout = el('div', 'staff-category-layout'); const donut = el('div', 'staff-donut'); donut.setAttribute('aria-hidden', 'true'); const legend = el('ul', 'staff-legend'); const colors = ['#207280', '#8d3751', '#3e5fa6', '#986b0b', '#4e8050']; let from = 0; const stops = [];
  [...categoryMap].forEach(([category, count], i) => { const to = from + count / Math.max(1, data.books.length) * 100; const color = colors[i % colors.length]; stops.push(`${color} ${from}% ${to}%`); from = to; const line = el('li'); const swatch = el('span'); swatch.style.background = color; line.append(swatch, document.createTextNode(`${category} (${count})`)); legend.append(line); });
  donut.style.background = stops.length ? `conic-gradient(${stops.join(',')})` : 'var(--line)'; categoryLayout.append(donut, legend); categories.append(categoryLayout);
  const reviews = panel('Đánh giá của độc giả'); const rating = el('div', 'staff-rating'); const score = el('div', 'rating-score'); const avg = data.reviews.length ? data.reviews.reduce((n, r) => n + r.stars, 0) / data.reviews.length : 0;
  score.append(el('strong', '', avg.toFixed(1)), el('span', 'stars', '★★★★★'), el('small', 'muted', data.reviews.length + ' đánh giá')); const ratingBars = el('div', 'rating-bars');
  for (let stars = 5; stars >= 1; stars--) { const count = data.reviews.filter(r => r.stars === stars).length; const row = el('div', 'rating-bar-row'); const track = el('div', 'rating-track'); const fill = el('div', 'rating-fill'); fill.style.width = count / Math.max(1, data.reviews.length) * 100 + '%'; track.append(fill); row.append(el('span', '', stars + ' ★'), track, el('span', '', String(count))); ratingBars.append(row); }
  rating.append(score, ratingBars); reviews.append(rating); holder.append(charts, el('h2', 'section-title', 'Cần nhắc trả sách'));
  const reminders = el('div', 'table-panel');
  const dueSoon = active.filter(l => l.dueDate && l.dueDate <= dateInVietnam(new Date(Date.now() + 3 * 86400000)));
  if (!dueSoon.length) readerMessage(reminders, 'Không có sách quá hạn hoặc sắp đến hạn trong 3 ngày tới.');
  else { const { wrap, body } = makeTable(['Độc giả', 'Sách', 'Hạn trả', 'Trạng thái'], 'Sách cần nhắc trả'); dueSoon.forEach(l => { const row = el('tr'); const status = el('td'); status.append(statusBadge(l)); row.append(el('td', '', name(l.userEmail)), el('td', '', l.bookTitle), el('td', '', displayDate(l.dueDate)), status); body.append(row); }); reminders.append(wrap); }
  holder.append(reminders);
}
function showStaffAction(title, action) {
  if (!canViewReaders()) { showToast('Chỉ thủ thư được thực hiện thao tác này.'); return false; }
  staffState.action = action; staffState.focus = document.activeElement;
  $('staffActionTitle').textContent = title; $('staffActionError').textContent = ''; $('staffActionBody').replaceChildren();
  $('staffActionConfirm').disabled = false; $('staffActionCancel').disabled = false; staffDialog.showModal(); document.body.style.overflow = 'hidden'; return true;
}
function openStaffBook() {
  if (!showStaffAction('Thêm sách', { type: 'add' })) return;
  [['title', 'Tên sách', 'text'], ['author', 'Tác giả', 'text'], ['category', 'Thể loại', 'text'], ['copies', 'Số bản', 'number']].forEach(([id, label, type]) => { const caption = el('label', '', label); caption.htmlFor = 'staffBook-' + id; const input = el('input'); input.id = caption.htmlFor; input.name = id; input.required = true; input.type = type; if (type === 'number') { input.min = '1'; input.max = '10000'; input.value = '1'; } else input.maxLength = id === 'title' ? 200 : 120; $('staffActionBody').append(caption, input); });
  $('staffBook-title').focus();
}
function openStaffConfirm(type, item) {
  const labels = { approve: 'Duyệt đăng ký mượn', reject: 'Từ chối đăng ký', return: 'Nhận trả sách', delete: 'Xóa sách' };
  if (!showStaffAction(labels[type], { type, item })) return;
  $('staffActionBody').append(el('p', '', `${labels[type]}: ${item.bookTitle || item.title}?`));
  if (type === 'return') $('staffActionBody').append(el('p', 'muted', 'Tiền phạt tính đến hôm nay: ' + money(fineForLoan(item).amount)));
  $('staffActionCancel').focus();
}
function closeStaffAction(force = false) {
  if (staffState.busy && !force) return;
  if (staffDialog.open) { staffDialog.close(); document.body.style.overflow = ''; if (staffState.focus?.isConnected) staffState.focus.focus(); }
  staffState.action = null;
}
$('staffActionCancel').addEventListener('click', () => closeStaffAction());
staffDialog.addEventListener('cancel', e => { e.preventDefault(); closeStaffAction(); });
$('staffActionForm').addEventListener('submit', async event => {
  event.preventDefault(); if (staffState.busy || !staffState.action) return;
  const action = staffState.action, token = getToken(); staffState.busy = true;
  $('staffActionConfirm').disabled = true; $('staffActionCancel').disabled = true; $('staffActionError').textContent = '';
  let path, options;
  if (action.type === 'add') { path = '/librarian/books'; options = { method: 'POST', body: JSON.stringify({ title: $('staffBook-title').value, author: $('staffBook-author').value, category: $('staffBook-category').value, totalCopies: Number($('staffBook-copies').value) }) }; }
  else if (action.type === 'delete') { path = '/librarian/books/' + action.item.id; options = { method: 'DELETE' }; }
  else { path = '/librarian/loans/' + encodeURIComponent(action.item.id) + '/' + action.type; options = { method: 'PATCH' }; }
  const result = await authRequest(path, options); staffState.busy = false;
  if (token !== getToken() || action !== staffState.action) return;
  $('staffActionConfirm').disabled = false; $('staffActionCancel').disabled = false;
  if (!result.ok) { $('staffActionError').textContent = result.message; return; }
  closeStaffAction(); resetBooks(); updateStaffBadges(); showToast('Đã cập nhật thành công.');
  renderLibrarian(staffState.current, true);
});
// Chặn listener độc giả tại các nút tiện ích khi đang ở vai trò thủ thư.
$('profileButton').addEventListener('click', event => {
  if (!canViewReaders()) return; event.stopImmediatePropagation();
  openUtility('Hồ sơ thủ thư', content => { const user = getUser(); [['Họ và tên', user.fullName], ['Email', user.email], ['Vai trò', 'Thủ thư']].forEach(([label, value]) => { const row = el('p', 'profile-row'); row.append(el('span', 'muted', label), el('strong', '', value)); content.append(row); }); });
}, true);
$('notificationsButton').addEventListener('click', event => {
  if (!canViewReaders()) return; event.stopImmediatePropagation();
  openUtility('Thông báo', content => { try { const loans = readDemoLoans(); const pending = loans.filter(l => l.status === 'PENDING').length; content.append(el('p', 'notification-item', `${pending} đăng ký mượn đang chờ duyệt.`)); loans.filter(l => unreturnedLoan(l) && isLoanOverdue(l)).forEach(l => content.append(el('p', 'notification-item', `${l.bookTitle} · Quá hạn từ ${displayDate(l.dueDate)}`))); } catch { content.append(el('p', 'error', 'Không thể đọc thông báo.')); } });
}, true);
window.addEventListener('storage', event => {
  if ([STORAGE_TOKEN, STORAGE_USER, null].includes(event.key) && !hasLoanSession()) resetLibrarian();
  if ([STAFF_BOOKS_KEY, MOCK_USERS_KEY, DEMO_LOANS_KEY].includes(event.key)) {
    try { syncLibrarianCatalog(); } catch { /* Màn hình hiện tại hiển thị lỗi từ service. */ }
    if ($('appView').classList.contains('librarian-view') && !canViewReaders()) { resetLibrarian(); resetReaders(); configureLibrarianMenu(false); navigate('overview'); return; }
    if (canViewReaders()) { updateStaffBadges(); const current = Object.keys(staffLabels).find(key => !$('page-' + key).hidden); if (current) renderLibrarian(current, true); }
  }
});
