const API_BASE_URL = (
  window.PTIT_API_BASE_URL ||
  `${window.location.protocol === 'https:' ? 'https:' : 'http:'}//${window.location.hostname || '127.0.0.1'}:8000/api`
).replace(/\/+$/, '');
const ENDPOINTS = {
  register: '/auth/register',
  login: '/auth/login',
  books: '/books',
  loans: '/loans',
};

// Cách lấy danh sách sách từ API (chỉnh cho khớp backend)
const BOOKS_CONFIG = {
  pageParam: 'page',  // tên tham số số trang
  sizeParam: 'size',  // tên tham số số phần tử mỗi trang
  firstPage: 1,       // trang đầu tiên đánh số từ 1 hay 0 (Spring: 0)
  fetchSize: 10,      // số sách lấy về mỗi lần gọi API
};
const PAGE_SIZE = 10; // chuẩn 10 sách hiển thị trên mỗi trang

const USE_MOCK_API = false;

const STORAGE_TOKEN = 'ptit_token';
const STORAGE_USER = 'ptit_user';

const ROLE_LABELS = { READER: 'Độc giả', LIBRARIAN: 'Thủ thư', ADMIN: 'Quản trị viên' };
const PAGE_TITLES = { overview: 'Tổng quan', search: 'Tra cứu sách', mybooks: 'Sách của tôi' };

/* ---------- Tiện ích ---------- */
const $ = id => document.getElementById(id);

function getToken() { return localStorage.getItem(STORAGE_TOKEN); }

function getUser() {
  try { return JSON.parse(localStorage.getItem(STORAGE_USER)); } catch { return null; }
}

function decodeJwt(token) {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(escape(atob(b64))));
  } catch { return null; }
}

function isTokenExpired(token) {
  const p = decodeJwt(token);
  return !!(p && p.exp && p.exp * 1000 < Date.now());
}

function normalizeRole(role) {
  const r = Array.isArray(role) ? role[0] : role;
  return String(r || 'READER').replace(/^ROLE_/, '').toUpperCase();
}

function isLocked(user) {
  const status = String(user.status || '').toUpperCase();
  return user.locked === true || user.isLocked === true || user.enabled === false ||
    status === 'LOCKED' || status === 'BLOCKED';
}

/* ---------- Dữ liệu sách giả (chỉ dùng cho demo) ---------- */
const MOCK_BOOKS = [
  ['Dế Mèn phiêu lưu ký', 'Tô Hoài', 'Văn học', 4],
  ['Số đỏ', 'Vũ Trọng Phụng', 'Văn học', 4],
  ['Nhà giả kim', 'Paulo Coelho', 'Văn học', 6],
  ['Clean Code', 'Robert C. Martin', 'Công nghệ', 2],
  ['Cấu trúc dữ liệu và giải thuật', 'Đỗ Xuân Lôi', 'Giáo trình', 8],
  ['Lược sử loài người', 'Yuval Noah Harari', 'Lịch sử', 4],
  ['Tắt đèn', 'Ngô Tất Tố', 'Văn học', 3],
  ['Spring in Action', 'Craig Walls', 'Công nghệ', 1],
  ['Truyện Kiều', 'Nguyễn Du', 'Văn học', 5],
  ['Lão Hạc', 'Nam Cao', 'Văn học', 0],
  ['Mắt biếc', 'Nguyễn Nhật Ánh', 'Văn học', 7],
  ['Cho tôi xin một vé đi tuổi thơ', 'Nguyễn Nhật Ánh', 'Văn học', 3],
  ['Introduction to Algorithms', 'Thomas H. Cormen', 'Giáo trình', 2],
  ['Giáo trình Mạng máy tính', 'Nguyễn Văn Nam', 'Giáo trình', 6],
  ['Giải tích 1', 'Nguyễn Đình Trí', 'Giáo trình', 10],
  ['Đại số tuyến tính', 'Lê Văn Hiếu', 'Giáo trình', 0],
  ['The Pragmatic Programmer', 'Andrew Hunt', 'Công nghệ', 3],
  ['Design Patterns', 'Erich Gamma', 'Công nghệ', 2],
  ['Python cơ bản', 'Nguyễn Hoàng Anh', 'Công nghệ', 9],
  ['Việt Nam sử lược', 'Trần Trọng Kim', 'Lịch sử', 4],
  ['Đại Việt sử ký toàn thư', 'Ngô Sĩ Liên', 'Lịch sử', 1],
  ['Súng, vi trùng và thép', 'Jared Diamond', 'Lịch sử', 2],
  ['Tuổi trẻ đáng giá bao nhiêu', 'Rosie Nguyễn', 'Văn học', 5],
  ['Đắc nhân tâm', 'Dale Carnegie', 'Văn học', 8],
  ['Cơ sở dữ liệu', 'Nguyễn Tuệ', 'Giáo trình', 4],
  ['Kỹ thuật lập trình C++', 'Phạm Văn Ất', 'Công nghệ', 6],
  ['Chiến tranh và hòa bình', 'Lev Tolstoy', 'Văn học', 2],
  ['Lịch sử Việt Nam', 'Nguyễn Quang Ngọc', 'Lịch sử', 3],
  ['Trí tuệ nhân tạo', 'Stuart Russell', 'Công nghệ', 5],
  ['Vật lý đại cương', 'Lương Duyên Bình', 'Giáo trình', 7],
  ['Những người khốn khổ', 'Victor Hugo', 'Văn học', 1],
  ['Hệ điều hành', 'Nguyễn Thanh Tùng', 'Giáo trình', 0],
  ['Sapiens: Lược sử tương lai', 'Yuval Noah Harari', 'Lịch sử', 3],
  ['Refactoring', 'Martin Fowler', 'Công nghệ', 2],
].map(([title, author, category, availableCopies], i) => ({ id: i + 1, title, author, category, availableCopies }));

/* =====================================================
   BACKEND GIẢ (chỉ để demo) — lưu trong localStorage
   ===================================================== */
const MOCK_USERS_KEY = 'ptit_mock_users';

function mockLoadUsers() {
  let users = null;
  try { users = JSON.parse(localStorage.getItem(MOCK_USERS_KEY)); } catch { /* bỏ qua */ }
  if (!Array.isArray(users)) {
    users = [
      { fullName: 'Quản trị viên', studentId: '', email: 'admin@ptit.edu.vn', password: '123456', role: 'ADMIN', status: 'ACTIVE' },
      { fullName: 'Thủ thư', studentId: '', email: 'thuthu@ptit.edu.vn', password: '123456', role: 'LIBRARIAN', status: 'ACTIVE' },
      { fullName: 'Nguyễn Hoàng An', studentId: 'B22DCCN101', email: 'docgia@ptit.edu.vn', password: '123456', role: 'READER', status: 'ACTIVE' },
    ];
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
  }
  return users;
}

function mockFakeJwt(user) {
  const b64url = obj => btoa(unescape(encodeURIComponent(JSON.stringify(obj))))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const header = b64url({ alg: 'none', typ: 'JWT' });
  const payload = b64url({
    sub: user.email, email: user.email, fullName: user.fullName, role: user.role,
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
  });
  return header + '.' + payload + '.demo-signature';
}

function mockReply(status, data) {
  return status < 400
    ? { ok: true, status, data }
    : { ok: false, status, data, message: data.message };
}

async function mockRequest(fullPath, options) {
  await new Promise(r => setTimeout(r, 400));
  const [path, query = ''] = fullPath.split('?');
  const body = options.body ? JSON.parse(options.body) : {};

  if (path === ENDPOINTS.books) {
    const params = new URLSearchParams(query);
    const page = Math.max(1, Number(params.get(BOOKS_CONFIG.pageParam)) || 1);
    const size = Math.max(1, Number(params.get(BOOKS_CONFIG.sizeParam)) || MOCK_BOOKS.length);
    return mockReply(200, {
      items: MOCK_BOOKS.slice((page - 1) * size, page * size),
      page,
      totalPages: Math.ceil(MOCK_BOOKS.length / size),
      total: MOCK_BOOKS.length,
    });
  }

  if (path === ENDPOINTS.loans) return mockCreateLoan(body, options);

  const users = mockLoadUsers();

  if (path === ENDPOINTS.register) {
    const email = String(body.email || '').trim().toLowerCase();
    if (users.some(u => u.email.toLowerCase() === email)) {
      return mockReply(409, { message: 'Email đã được sử dụng.' });
    }
    if (String(body.password || '').length < 6) {
      return mockReply(400, { message: 'Mật khẩu phải có ít nhất 6 ký tự.' });
    }
    users.push({
      fullName: body.fullName, studentId: body.studentId, email,
      password: body.password, role: 'READER', status: 'ACTIVE',
    });
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
    return mockReply(201, { message: 'Đăng ký thành công.' });
  }

  if (path === ENDPOINTS.login) {
    const email = String(body.email || '').trim().toLowerCase();
    const user = users.find(u => u.email.toLowerCase() === email && u.password === body.password);
    if (!user) return mockReply(401, { message: 'Email hoặc mật khẩu không đúng.' });
    const { password, ...safeUser } = user;
    return mockReply(200, { token: mockFakeJwt(safeUser), user: safeUser });
  }

  return mockReply(404, { message: 'Không tìm thấy API (chế độ demo).' });
}

/* Gọi API, luôn trả về { ok, data }. Lỗi hiển thị lấy từ data.message */
async function request(path, options = {}) {
  if (USE_MOCK_API) {
    try { return await mockRequest(path, options); }
    catch {
      return { ok: false, status: 0, data: {}, message: 'Không thể đọc hoặc lưu dữ liệu demo trong trình duyệt. Vui lòng kiểm tra quyền lưu trữ rồi thử lại.' };
    }
  }
  try {
    const res = await fetch(API_BASE_URL + path, {
      ...options,
      headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail = data.detail;
      const message = typeof detail === 'string'
        ? detail
        : detail && typeof detail === 'object'
          ? detail.message || JSON.stringify(detail)
          : data.message;
      return { ok: false, status: res.status, data, message: message || 'Đã có lỗi xảy ra. Vui lòng thử lại.' };
    }
    return { ok: true, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: {}, message: 'Không thể kết nối tới máy chủ.' };
  }
}

/* Dùng cho các API cần đăng nhập: tự gắn JWT vào header */
function authRequest(path, options = {}) {
  const token = getToken();
  return request(path, {
    ...options,
    headers: { ...(options.headers || {}), ...(token ? { Authorization: 'Bearer ' + token } : {}) },
  }).then(r => {
    if (r.status === 401 && !USE_MOCK_API) logout();
    return r;
  });
}
window.PTIT = Object.assign(window.PTIT || {}, { getToken, getUser, authRequest });

/* ---------- Chuyển giữa trang công khai và giao diện Độc giả ---------- */
function showPublic() {
  $('appView').hidden = true;
  $('publicView').hidden = false;
  document.body.style.overflow = '';
}

function showApp(user) {
  if (USE_MOCK_API) prepareReaderDemo(user);
  const name = user.fullName || user.full_name || user.name || user.email || 'Người dùng';
  const role = ROLE_LABELS[normalizeRole(user.role)] || 'Độc giả';

  if (['ADMIN', 'LIBRARIAN'].includes(normalizeRole(user.role))) {
    window.location.replace('dashboard.html');
    return;
  }

  $('publicView').hidden = true;
  $('appView').hidden = false;
  $('userName').textContent = name;
  PTIT.setAvatar($('userAvatar'), name);
  $('userRole').textContent = role;
  $('topbarUser').textContent = name;
  $('greeting').textContent = 'Xin chào, ' + name;
  $('greetingRole').textContent = 'Vai trò: ' + role;
  navigate('overview');
}

/* ---------- Điều hướng trong giao diện Độc giả ---------- */
function closeSidebar() {
  $('sidebar').classList.remove('open');
  $('sidebarBackdrop').hidden = true;
}

function navigate(page) {
  Object.keys(PAGE_TITLES).forEach(key => { $('page-' + key).hidden = key !== page; });
  $('appView').classList.toggle('reader-view-search', page === 'search');
  $('appView').classList.toggle('reader-view-mybooks', page === 'mybooks');
  document.querySelectorAll('.menu-item').forEach(b =>
    b.classList.toggle('active', b.dataset.nav === page));
  $('topbarTitle').textContent = PAGE_TITLES[page];
  closeSidebar();
  window.scrollTo(0, 0);
  if (page === 'search') loadBooks();
  if (page === 'mybooks') renderMyLoans();
  if (page === 'overview') renderOverview();
}

document.querySelectorAll('[data-nav]').forEach(btn =>
  btn.addEventListener('click', () => navigate(btn.dataset.nav)));

/* ---------- Modal Đăng nhập / Đăng ký ---------- */
const overlay = $('overlay');
const panels = { login: $('panel-login'), register: $('panel-register') };
let lastFocus = null;

function showPanel(name) {
  Object.entries(panels).forEach(([key, el]) => {
    if (el) el.hidden = key !== name;
  });
  const loginErr = $('loginError');
  const regErr = $('regError');
  const notice = $('loginNotice');
  if (loginErr) { loginErr.textContent = ''; loginErr.hidden = true; }
  if (regErr) { regErr.textContent = ''; regErr.hidden = true; }
  if (notice) { notice.textContent = ''; notice.hidden = true; }

  document.querySelectorAll('[data-switch]').forEach(btn => {
    const isActive = btn.dataset.switch === name;
    btn.classList.toggle('active', isActive);
    btn.classList.toggle('btn--primary', isActive);
    btn.classList.toggle('btn--secondary', !isActive);
  });
}

function openModal(name) {
  lastFocus = document.activeElement;
  showPanel(name || 'login');
  if (overlay && window.PTIT?.openModal) PTIT.openModal('overlay');
  else if (overlay) {
    overlay.hidden = false;
    overlay.classList.add('show');
  }
  if (panels[name]) {
    const input = panels[name].querySelector('input');
    if (input) setTimeout(() => input.focus(), 60);
  }
}

function closeModal() {
  if (window.PTIT?.closeModal) {
    PTIT.closeModal('overlay');
    return;
  }
  if (overlay) {
    overlay.classList.remove('show');
    overlay.hidden = true;
  }
  document.body.style.overflow = '';
  if (lastFocus) lastFocus.focus();
}

document.querySelectorAll('[data-open]').forEach(btn =>
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal(btn.dataset.open);
  }));

document.querySelectorAll('[data-switch]').forEach(btn =>
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    showPanel(btn.dataset.switch);
  }));

document.querySelectorAll('.chip').forEach(chip =>
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
    $('loginEmail').value = chip.dataset.email;
    $('loginPassword').value = chip.dataset.pass;
  }));

function setBusy(form, busy) {
  const btn = form.querySelector('button[type="submit"]');
  if (btn) btn.disabled = busy;
}

/* ---------- AUTH-01: Đăng ký ---------- */
$('registerForm').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.currentTarget;
  const err = $('regError');

  const fullName = $('regName').value.trim();
  const studentId = $('regId').value.trim();
  const email = $('regEmail').value.trim();
  const password = $('regPass').value;
  const confirm = $('regPass2').value;

  if (!fullName || !studentId || !email || !password) {
    err.textContent = 'Vui lòng nhập đầy đủ thông tin.';
    err.hidden = false;
    return;
  }
  if (password.length < 6) {
    err.textContent = 'Mật khẩu cần có ít nhất 6 ký tự.';
    err.hidden = false;
    return;
  }
  if (password !== confirm) {
    err.textContent = 'Mật khẩu nhập lại chưa khớp.';
    err.hidden = false;
    return;
  }

  err.textContent = '';
  err.hidden = true;
  setBusy(form, true);
  const res = await request(ENDPOINTS.register, {
    method: 'POST',
    body: JSON.stringify({
      username: studentId,
      email,
      password,
      full_name: fullName,
    }),
  });
  setBusy(form, false);

  if (!res.ok) {
    err.textContent = res.message || 'Đăng ký không thành công.';
    err.hidden = false;
    return;
  }

  form.reset();
  showPanel('login');
  $('loginEmail').value = email;
  const notice = $('loginNotice');
  if (notice) {
    notice.textContent = 'Đăng ký thành công! Hãy đăng nhập để tiếp tục.';
    notice.hidden = false;
  }
});

/* ---------- AUTH-02: Đăng nhập ---------- */
$('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.currentTarget;
  const err = $('loginError');

  const email = $('loginEmail').value.trim();
  const password = $('loginPassword').value;
  if (!email || !password) {
    err.textContent = 'Vui lòng nhập email/tên đăng nhập và mật khẩu.';
    err.hidden = false;
    return;
  }

  err.textContent = '';
  err.hidden = true;
  const notice = $('loginNotice');
  if (notice) {
    notice.textContent = '';
    notice.hidden = true;
  }
  setBusy(form, true);
  const res = await request(ENDPOINTS.login, {
    method: 'POST',
    body: JSON.stringify({ username: email, password }),
  });
  setBusy(form, false);

  if (!res.ok) {
    err.textContent = res.message || 'Đăng nhập không thành công.';
    err.hidden = false;
    return;
  }

  const d = res.data.data && typeof res.data.data === 'object' ? res.data.data : res.data;
  const token = d.access_token || d.token || d.accessToken || d.jwt;
  if (!token) { err.textContent = 'Phản hồi đăng nhập không có token.'; return; }

  const payload = decodeJwt(token) || {};
  const user = d.user || {
    id: payload.user_id || payload.id,
    fullName: d.fullName || payload.full_name || payload.fullName || payload.name,
    studentId: d.studentId || payload.student_id || payload.username || payload.sub,
    email: d.email || payload.email || payload.sub || email,
    role: d.role || payload.role || payload.roles,
  };
  user.role = normalizeRole(user.role);

  if (isLocked(user)) { err.textContent = 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ thư viện.'; return; }

  localStorage.setItem(STORAGE_TOKEN, token);
  localStorage.setItem(STORAGE_USER, JSON.stringify(user));
  localStorage.setItem('access_token', token);
  localStorage.setItem('user', JSON.stringify(user));
  form.reset();
  closeModal();
  showApp(user);
});

/* =====================================================
   BOOK-01 / BOOK-02 — Tra cứu sách (phân trang, tìm kiếm)
   ===================================================== */
const books = { all: null, filter: 'all', scope: 'all', keyword: '', page: 1, loading: false, error: '', token: 0 };

const COVER_COLORS = [
  ['#3f7f86', '#17525d'], ['#8a4a5e', '#6e2a40'], ['#4a5c9a', '#2d4284'], ['#8f6a1f', '#7a520f'],
  ['#5d8147', '#3f6030'], ['#7a5a98', '#573a78'], ['#a85a3e', '#8a3a20'], ['#4b7088', '#245068'],
];

function normalizeText(str) {
  return String(str || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().trim();
}

function pickFirst(obj, keys) {
  for (const k of keys) if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  return undefined;
}

function normalizeBook(raw) {
  const category = pickFirst(raw, ['category', 'categoryName', 'genre']);
  const author = pickFirst(raw, ['author', 'authorName', 'authors']);
  const copies = pickFirst(raw, ['copies', 'availableCopies', 'available_copies', 'availableQuantity', 'available_quantity', 'available', 'remainingCopies', 'remaining', 'copiesAvailable', 'quantity']);
  const imageUrl = pickFirst(raw, ['coverUrl', 'cover_url', 'imageUrl', 'image_url']);
  const book = {
    id: pickFirst(raw, ['id', '_id', 'bookId']),
    title: String(pickFirst(raw, ['title', 'name', 'bookName']) || 'Chưa có tên'),
    author: Array.isArray(author) ? author.map(a => a.name || a).join(', ') : String((author && author.name) || author || ''),
    category: String((category && category.name) || category || ''),
    copies: copies !== undefined && Number.isFinite(Number(copies)) ? Number(copies) : null,
    imageUrl: typeof imageUrl === 'string' ? imageUrl.trim() : '',
    isbn: String(pickFirst(raw, ['isbn', 'ISBN']) || ''),
    publisher: String(pickFirst(raw, ['publisher', 'publisherName']) || ''),
    publicationYear: pickFirst(raw, ['publicationYear', 'publication_year', 'year']),
    description: String(pickFirst(raw, ['description', 'summary']) || ''),
  };
  book.searchTitle = normalizeText(book.title);
  book.searchAuthor = normalizeText(book.author);
  book.searchISBN = normalizeText(book.isbn);
  book.search = normalizeText([book.title, book.author, book.category, book.isbn].join(' '));
  return book;
}

function parseBooksResponse(data) {
  const outer = data && !Array.isArray(data) ? data : {};
  const d = outer.data !== undefined ? outer.data : data;
  const list = Array.isArray(d)
    ? d
    : (d && (d.content || d.items || d.books || d.results || d.docs || d.data)) || [];
  const meta = Array.isArray(d) ? outer : (d || {});
  const pg = meta.pagination || meta.meta || meta;

  let totalPages = pickFirst(pg, ['totalPages', 'total_pages', 'pages', 'lastPage']);
  if (totalPages === undefined) {
    const total = pickFirst(pg, ['totalElements', 'totalItems', 'total', 'count']);
    const perPage = pickFirst(pg, ['size', 'pageSize', 'limit', 'perPage']) || list.length;
    if (total !== undefined && perPage) totalPages = Math.ceil(total / perPage);
  }
  return { list: Array.isArray(list) ? list : [], totalPages: Number(totalPages) || null, isFirst: pg.first };
}

async function fetchBooksPage(page) {
  const qs = new URLSearchParams({
    [BOOKS_CONFIG.pageParam]: page,
    [BOOKS_CONFIG.sizeParam]: BOOKS_CONFIG.fetchSize,
  });
  const res = await authRequest(ENDPOINTS.books + '?' + qs);
  if (!res.ok) throw new Error(res.message || 'Không thể tải danh sách sách.');
  return parseBooksResponse(res.data);
}

async function fetchAllBooks() {
  let start = BOOKS_CONFIG.firstPage;
  let first = await fetchBooksPage(start);
  if (first.isFirst === false && start > 0) { start = 0; first = await fetchBooksPage(start); }

  let rawList = first.list;
  const totalPages = Math.min(first.totalPages || 1, 100);
  if (totalPages > 1) {
    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) => fetchBooksPage(start + i + 1)));
    rest.forEach(p => { rawList = rawList.concat(p.list); });
  }

  const seen = new Set();
  return rawList.map(normalizeBook).filter(b => {
    if (b.id === undefined) return true;
    if (seen.has(b.id)) return false;
    seen.add(b.id);
    return true;
  });
}

async function loadBooks(force = false) {
  if (books.loading) return;
  if (books.all && !force) { renderBooks(); return; }
  const id = ++books.token;
  books.loading = true;
  books.error = '';
  renderBooks();
  try {
    const all = await fetchAllBooks();
    if (id !== books.token) return;
    books.all = all;
    renderCategoryFilters();
  } catch (err) {
    if (id !== books.token) return;
    books.all = null;
    books.error = err.message || 'Không thể tải danh sách sách.';
  }
  books.loading = false;
  renderBooks();
}

async function ensureBooksLoaded() {
  if (!books.all) {
    books.all = await fetchAllBooks();
    renderCategoryFilters();
  }
}

function resetBooks() {
  books.token++;
  Object.assign(books, { all: null, filter: 'all', scope: 'all', keyword: '', page: 1, loading: false, error: '' });
  $('searchInput').value = '';
  $('searchScope').value = 'all';
  updateFilterButtons();
  renderBooks();
}

/* ---------- Hiển thị ---------- */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function getFilteredBooks() {
  const tokens = normalizeText(books.keyword).split(/\s+/).filter(Boolean);
  const favorites = readFavorites();
  const searchField = books.scope === 'title' ? 'searchTitle'
    : books.scope === 'author' ? 'searchAuthor'
      : books.scope === 'isbn' ? 'searchISBN' : 'search';
  return books.all.filter(book =>
    (books.filter === 'all' || (books.filter === 'favorites' ? favorites.includes(book.id) : book.category === books.filter)) &&
    tokens.every(token => book[searchField].includes(token)));
}

function bookCard(book) {
  const card = el('article', 'book-card');
  const open = el('button', 'book-open');
  open.type = 'button';
  open.setAttribute('aria-label', 'Xem chi tiết ' + book.title);
  open.setAttribute('aria-haspopup', 'dialog');
  open.addEventListener('click', () => openBookDetail(book));
  const foot = el('div', 'book-foot');
  if (book.copies !== null) foot.append(el('span', 'pill' + (book.copies === 0 ? ' pill-out' : ''), book.copies > 0 ? 'Còn ' + book.copies + ' bản' : 'Hết sách'));
  const rating = bookRating(book.id);
  if (rating.count) foot.append(el('span', 'book-rating', '★ ' + rating.average.toFixed(1) + ' (' + rating.count + ')'));
  open.append(bookCover(book), foot);
  const favorite = el('button', 'favorite-button', readFavorites().includes(book.id) ? '♥' : '♡');
  favorite.type = 'button';
  favorite.dataset.bookId = book.id;
  favorite.setAttribute('aria-label', 'Yêu thích ' + book.title);
  favorite.setAttribute('aria-pressed', String(readFavorites().includes(book.id)));
  favorite.addEventListener('click', () => toggleFavorite(book.id, favorite));
  card.append(open, favorite);
  return card;
}

function pageNumbers(current, total) {
  const nums = [...new Set([1, total, current - 1, current, current + 1])]
    .filter(n => n >= 1 && n <= total).sort((a, b) => a - b);
  const out = [];
  nums.forEach((n, i) => {
    if (i && n - nums[i - 1] > 1) out.push('…');
    out.push(n);
  });
  return out;
}

function renderPagination(totalPages) {
  const nav = $('pagination');
  nav.replaceChildren();
  if (totalPages <= 1) return;

  const go = n => {
    books.page = n;
    renderBooks();
    $('page-search').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const btn = (label, page, { disabled = false, active = false } = {}) => {
    const b = el('button', 'page-btn' + (active ? ' active' : ''), label);
    b.type = 'button';
    b.disabled = disabled;
    if (active) b.setAttribute('aria-current', 'page');
    b.addEventListener('click', () => go(page));
    return b;
  };

  nav.append(btn('Trước', books.page - 1, { disabled: books.page === 1 }));
  pageNumbers(books.page, totalPages).forEach(n => {
    if (n === '…') nav.append(el('span', 'page-gap', '…'));
    else nav.append(btn(String(n), n, { active: n === books.page }));
  });
  nav.append(btn('Sau', books.page + 1, { disabled: books.page === totalPages }));
}

function stateBox(text, kind) {
  const box = el('div', 'empty ' + (kind || ''));
  if (kind === 'loading') box.append(el('span', 'spinner'));
  box.append(el('span', '', text));
  return box;
}

function renderBooks() {
  const list = $('bookList');
  list.replaceChildren();
  $('pagination').replaceChildren();
  $('resultInfo').textContent = '';

  if (books.loading) { list.append(stateBox('Đang tải danh sách sách...', 'loading')); return; }

  if (books.error) {
    const box = stateBox(books.error, 'error');
    const retry = el('button', 'btn btn-outline', 'Thử lại');
    retry.type = 'button';
    retry.addEventListener('click', () => loadBooks(true));
    box.append(retry);
    list.append(box);
    return;
  }

  if (!books.all) return;
  if (!books.all.length) { list.append(stateBox('Thư viện chưa có sách nào.')); return; }

  const filtered = getFilteredBooks();
  if (!filtered.length) {
    $('resultInfo').textContent = books.keyword.trim() ? 'Tìm thấy 0 sách' : '0 sách';
    list.append(stateBox(books.filter === 'favorites' && !books.keyword ? 'Bạn chưa có sách yêu thích trong danh sách này.' : 'Không tìm thấy sách phù hợp.'));
    return;
  }

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  books.page = Math.min(Math.max(1, books.page), totalPages);
  const from = (books.page - 1) * PAGE_SIZE;
  filtered.slice(from, from + PAGE_SIZE).forEach(b => list.append(bookCard(b)));

  const found = books.keyword.trim() ? 'Tìm thấy ' + filtered.length + ' sách' : filtered.length + ' sách';
  $('resultInfo').textContent = totalPages > 1 ? found + ' · Trang ' + books.page + '/' + totalPages : found;
  renderPagination(totalPages);
}

/* ---------- Tìm kiếm (BOOK-02) ---------- */
function applySearch(value) {
  books.keyword = value;
  books.scope = $('searchScope').value;
  books.page = 1;
  renderBooks();
}

let searchTimer = null;
$('searchInput').addEventListener('input', e => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => applySearch(e.target.value), 300);
});
$('searchForm').addEventListener('submit', e => {
  e.preventDefault();
  clearTimeout(searchTimer);
  applySearch($('searchInput').value);
});
$('searchScope').addEventListener('change', () => applySearch($('searchInput').value));

function bookCover(b) {
  return getBookCover(b);
}

function getBookCover(b) {
  const [c1, c2] = COVER_COLORS[(Number(b.id) - 1) % COVER_COLORS.length] || COVER_COLORS[0];

  const cover = el('div', 'book-cover');
  cover.style.background = `linear-gradient(135deg, ${c1}, ${c2})`;
  cover.append(el('span', 'book-cat', b.category), el('h3', 'book-title', b.title), el('span', 'book-author', b.author));

  const description = String(b.description || '');
  const hasSampleDescription = description.startsWith('Dữ liệu mẫu giới thiệu sách ');
  const apiImageUrl = typeof b.imageUrl === 'string' ? b.imageUrl.trim() : '';
  const isUnverifiedSampleThumbnail = hasSampleDescription &&
    apiImageUrl.includes('encrypted-tbn0.gstatic.com');
  const rawUrl = isUnverifiedSampleThumbnail || /^\/covers\//i.test(apiImageUrl) ? '' : apiImageUrl;
  if (!rawUrl) return cover;

  let cleanUrl = rawUrl;
  if (cleanUrl.startsWith('/covers/')) {
    cleanUrl = '.' + cleanUrl; // Trỏ thẳng tới ./covers/xxx.svg trong thư mục frontend
  } else if (!/^https?:\/\//i.test(cleanUrl) && !cleanUrl.startsWith('//')) {
    cleanUrl = API_BASE_URL + (cleanUrl.startsWith('/') ? '' : '/') + cleanUrl;
  }

  const image = el('img', 'book-cover-image');
  image.alt = b.title || 'Bìa sách';
  image.loading = 'lazy';
  image.referrerPolicy = 'no-referrer';
  image.onload = () => {
    cover.classList.add('has-image');
  };
  image.onerror = () => image.remove();
  image.src = cleanUrl;
  cover.appendChild(image);
  return cover;
}

/* Local loan storage is used only when explicitly enabling mock mode. */
const DEMO_LOANS_KEY = 'ptit_da05_loans_v1';
const LOAN_DAYS = [7, 14, 30];
const ACTIVE_LOAN_STATUSES = ['PENDING', 'BORROWING'];
const LOAN_RULE_MESSAGES = {
  BR01: 'Mỗi độc giả có tối đa 3 phiếu ở trạng thái PENDING hoặc BORROWING',
  BR02: 'Không đăng ký lại một cuốn đang chờ duyệt hoặc đang mượn',
  BR03: 'Độc giả còn sách quá hạn chưa trả thì không được đăng ký mượn thêm',
};

function readDemoLoans() {
  const saved = localStorage.getItem(DEMO_LOANS_KEY);
  const loans = saved ? JSON.parse(saved) : [];
  if (!Array.isArray(loans) || loans.some(loan => !loan || typeof loan.userEmail !== 'string')) {
    throw new Error('Dữ liệu phiếu demo không hợp lệ.');
  }
  return loans;
}

function userEmail(user = getUser()) {
  return String(user && user.email || '').trim().toLowerCase();
}

function reviewUserId(user = getUser()) {
  const id = user && (user.id ?? user.userId ?? user.user_id);
  return id === undefined || id === null || String(id).trim() === ''
    ? 'email:' + userEmail(user)
    : String(id);
}

function isOwnReview(review) {
  return String(review.userId || '') === reviewUserId() ||
    (!review.userId && Boolean(userEmail()) && review.userEmail === userEmail());
}

function dateInVietnam(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const part = type => parts.find(item => item.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function isLoanOverdue(loan) {
  return PTIT.getLoanStatus(loan).isOverdue;
}

function withDemoLoanLock(action) {
  return navigator.locks ? navigator.locks.request(DEMO_LOANS_KEY, action) : Promise.resolve().then(action);
}

function mockCreateLoan(body, options) {
  return withDemoLoanLock(() => {
    const token = String(options.headers && options.headers.Authorization || '').replace(/^Bearer /, '');
    if (token !== getToken() || !hasLoanSession()) {
      return mockReply(401, { message: 'Vui lòng đăng nhập để đăng ký mượn sách.' });
    }
    if (options.method !== 'POST') return mockReply(405, { message: 'Thao tác không được hỗ trợ.' });
    if (!LOAN_DAYS.includes(body.days)) {
      return mockReply(400, { message: 'Vui lòng chọn thời gian mượn 7, 14 hoặc 30 ngày.' });
    }
    const book = MOCK_BOOKS.find(item => item.id === body.book_id);
    if (!book) return mockReply(404, { message: 'Không tìm thấy sách.' });
    const loans = readDemoLoans();
    const email = userEmail();
    const mine = loans.filter(loan => loan.userEmail === email);
    const active = mine.filter(loan => ACTIVE_LOAN_STATUSES.includes(loan.status));
    let code = '';
    if (active.length >= 3) code = 'BR01';
    else if (active.some(loan => loan.bookId === book.id)) code = 'BR02';
    else if (mine.some(isLoanOverdue)) code = 'BR03';
    if (code) return mockReply(409, { code, message: LOAN_RULE_MESSAGES[code] });
    if (book.availableCopies <= 0) {
      return mockReply(409, { message: 'Sách này hiện đã hết bản sao khả dụng để mượn' });
    }
    const loan = {
      id: 'DEMO-' + crypto.randomUUID(), userEmail: email,
      bookId: book.id, bookTitle: book.title, days: body.days, status: 'PENDING',
      createdAt: new Date().toISOString(), dueDate: null, returnDate: null,
    };
    localStorage.setItem(DEMO_LOANS_KEY, JSON.stringify([...loans, loan]));
    return mockReply(201, loan);
  });
}

/* ---------- Chi tiết sách / chọn thời gian / phản hồi ---------- */
const loanState = { book: null, busy: false, version: 0, lastFocus: null };

function setLoanBusy(busy) {
  loanState.busy = busy;
  $('loanForm').setAttribute('aria-busy', String(busy));
  $('loanDaysFieldset').disabled = busy;
  ['confirmLoanButton', 'backToBookDetail', 'closeBookDialog'].forEach(id => { $(id).disabled = busy; });
  $('loanLoading').hidden = !busy;
  $('confirmLoanButton').textContent = busy ? 'Đang gửi…' : 'Xác nhận đăng ký';
}

function openBookDetail(book) {
  if (loanState.busy) return;
  book = normalizeBook(book);
  loanState.book = book;
  loanState.version++;
  loanState.lastFocus = document.activeElement;
  $('bookDetailTitle').textContent = book.title;
  $('bookDetailCover').replaceChildren(bookCover(book));
  $('bookDetailAvailability').textContent = book.copies === null
    ? 'Chưa có thông tin số bản khả dụng.' : 'Còn lại: ' + book.copies + ' bản';
  renderBookDetails(book);
  $('bookDetailActions').hidden = false;
  $('loanForm').hidden = true;
  $('loanResult').hidden = true;
  $('loanForm').reset();
  $('loanError').textContent = '';
  $('loanDaysFieldset').removeAttribute('aria-invalid');
  setLoanBusy(false);
  const favoriteButton = $('favoriteBookDetail');
  if (favoriteButton) {
    const isFavorite = readFavorites().includes(book.id);
    favoriteButton.textContent = isFavorite ? '♥ Đã yêu thích' : '♡ Yêu thích';
    favoriteButton.setAttribute('aria-pressed', String(isFavorite));
  }
  if (window.PTIT?.openModal) PTIT.openModal('bookDialog');
  else $('bookDialog').showModal();
  document.body.style.overflow = 'hidden';
  $('bookDetailTitle').focus();
}

function closeBookDetail(force = false) {
  if (loanState.busy && !force) return;
  loanState.version++;
  loanState.book = null;
  setLoanBusy(false);
  if ($('bookDialog').open) {
    if (window.PTIT?.closeModal) PTIT.closeModal('bookDialog');
    else $('bookDialog').close();
  }
  document.body.style.overflow = '';
  if (loanState.lastFocus && loanState.lastFocus.isConnected) loanState.lastFocus.focus();
  loanState.lastFocus = null;
}

function requireLoanLogin() {
  if (hasLoanSession()) return true;
  const bookId = loanState.book ? loanState.book.id : '';
  closeBookDetail(true);
  const params = new URLSearchParams();
  params.set('return', 'index.html');
  if (bookId) params.set('book', String(bookId));
  window.location.assign('login.html?' + params.toString());
  return false;
}

function hasLoanSession() {
  const token = getToken();
  const claims = token && decodeJwt(token);
  return Boolean(claims && Number.isFinite(claims.exp) && claims.exp * 1000 > Date.now() && userEmail());
}

function showLoanError(message, code = '') {
  const fullMessage = (code ? code + ' — ' : '') + message;
  $('loanError').textContent = fullMessage;

  if (window.PTIT?.confirm) {
    closeBookDetail(true);
    PTIT.confirm(fullMessage, {
      title: 'Không thể đăng ký mượn',
      confirmText: 'Đã hiểu',
      cancelText: 'Đóng',
      danger: true,
    });
  }
}

if ($('favoriteBookDetail')) {
  $('favoriteBookDetail').addEventListener('click', () => {
    if (!loanState.book) return;
    toggleFavorite(loanState.book.id, $('favoriteBookDetail'));
  });
}

$('registerLoanButton').addEventListener('click', () => {
  if (!requireLoanLogin()) return;
  $('bookDetailActions').hidden = true;
  $('loanForm').hidden = false;
  $('loanForm').querySelector('input').focus();
});

$('loanForm').addEventListener('change', () => {
  $('loanError').textContent = '';
  $('loanDaysFieldset').removeAttribute('aria-invalid');
});

$('loanForm').addEventListener('submit', async event => {
  event.preventDefault();
  if (loanState.busy || !loanState.book || !$('loanResult').hidden) return;
  if (!requireLoanLogin()) return;
  const selected = $('loanForm').querySelector('input[name="loanDays"]:checked');
  const days = selected ? Number(selected.value) : null;
  if (!LOAN_DAYS.includes(days)) {
    showLoanError('Vui lòng chọn thời gian mượn 7, 14 hoặc 30 ngày.');
    $('loanDaysFieldset').setAttribute('aria-invalid', 'true');
    $('loanForm').querySelector('input').focus();
    return;
  }
  const version = loanState.version;
  const token = getToken();
  $('loanError').textContent = '';
  setLoanBusy(true);
  try {
    const result = await authRequest(ENDPOINTS.loans, {
      method: 'POST', body: JSON.stringify({ book_id: loanState.book.id, days }),
    });
    if (version !== loanState.version) return;
    if (getToken() !== token) { closeBookDetail(true); requireLoanLogin(); return; }
    if (!result.ok) {
      if (result.status === 401) {
        closeBookDetail(true);
        logout();
        openModal('login');
        $('loginError').textContent = result.message;
      } else {
        showLoanError(result.message, result.data.code);
      }
      return;
    }
    if (result.data.status !== 'PENDING') {
      showLoanError('Chưa xác nhận được trạng thái phiếu mượn. Vui lòng kiểm tra Sách của tôi.');
      return;
    }
    $('loanForm').hidden = true;
    $('loanResult').hidden = false;
    $('loanSuccess').textContent = `Đăng ký mượn thành công! “${loanState.book.title}” · ${days} ngày. Trạng thái: PENDING — Chờ duyệt.`;
    $('loanSuccess').focus();
    document.dispatchEvent(new CustomEvent("ptit:borrow-success", {
      detail: { bookTitle: loanState.book.title }
    }));
    myLoansPage = 1;
    try {
      await loadReaderData();
      renderMyLoans();
      renderOverview();
    } catch (error) {
      showToast('Đã gửi phiếu mượn nhưng không thể tải lại danh sách: ' + error.message);
    }
  } catch {
    showLoanError('Không thể hoàn tất đăng ký mượn. Vui lòng kiểm tra Sách của tôi trước khi thử lại.');
  } finally {
    if (version === loanState.version) setLoanBusy(false);
  }
});

['finishLoan'].forEach(id => {
  $(id).addEventListener('click', () => closeBookDetail());
});
$('backToBookDetail').addEventListener('click', () => {
  if (loanState.busy) return;
  $('loanForm').hidden = true;
  $('bookDetailActions').hidden = false;
  $('registerLoanButton').focus();
});
$('bookDialog').addEventListener('cancel', event => {
  event.preventDefault();
  closeBookDetail();
});
$('viewMyLoans').addEventListener('click', () => {
  closeBookDetail();
  navigate('mybooks');
});

/* ---------- AUTH-03: Đăng xuất ---------- */
function logout() {
  const token = getToken();
  if (!USE_MOCK_API && token) {
    fetch(API_BASE_URL + '/auth/logout', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token },
    }).catch(error => console.error('Không thể thu hồi token đăng xuất:', error));
  }
  closeReview();
  if ($('utilityDialog').open) $('utilityDialog').close();
  $('appToast').hidden = true;
  closeBookDetail(true);
  localStorage.removeItem(STORAGE_TOKEN);
  localStorage.removeItem(STORAGE_USER);
  localStorage.removeItem('access_token');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  resetBooks();
  closeSidebar();
  showPublic();
}
$('logoutBtn').addEventListener('click', async event => {
  const button = event.currentTarget;
  await PTIT.confirm('Bạn có chắc chắn muốn đăng xuất?', {
    title: 'Đăng xuất',
    confirmText: 'Đăng xuất',
    onConfirm: async () => {
      button.disabled = true;
      logout();
    },
  });
});

/* ---------- Giao diện độc giả theo ảnh tham chiếu ---------- */
const READER_DEMO_EMAIL = 'docgia@ptit.edu.vn';
const FAVORITES_KEY = 'ptit_reader_favorites_v1';
const REVIEWS_KEY = 'ptit_reader_reviews_v1';
const SEED_KEY = 'ptit_reader_demo_seed_v1';
let myLoansPage = 1;
let reviewBook = null;
let reviewReturnFocus = null;
let reviewFilterBookId = null;
let selectedReviewStars = 0;
let reviewStorageErrorShown = false;
let toastTimer;
const readerData = { loans: [], fines: [], reservations: [], totalUnpaid: 0 };

function readStoredObject(key, fallback) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : fallback;
}

function showToast(message) {
  clearTimeout(toastTimer);
  $('appToast').textContent = message;
  $('appToast').hidden = false;
  toastTimer = setTimeout(() => { $('appToast').hidden = true; }, 4500);
}

function prepareReaderDemo(user) {
  myLoansPage = 1;
  if (!USE_MOCK_API || userEmail(user) !== READER_DEMO_EMAIL) return;
  if (user.fullName === 'Độc giả') user.fullName = 'Nguyễn Hoàng An';
  try {
    localStorage.setItem(STORAGE_USER, JSON.stringify(user));
    const seeded = readStoredObject(SEED_KEY, {});
    if (seeded[READER_DEMO_EMAIL]) return;
    const loans = readDemoLoans();
    if (!loans.some(loan => loan.userEmail === READER_DEMO_EMAIL)) {
      const ids = [2, 1, 3, 4, 1, 3, 2, 1, 5, 4, 3, 1];
      const historyDates = ['2026-07-05', '2026-07-17', '2026-07-29', '2026-08-10', '2026-08-22', '2026-09-03', '2026-09-15', '2026-09-27', '2026-10-09', '2026-10-13', '2026-10-20', '2026-10-26'];
      const history = ids.map((id, index) => {
        const created = new Date(historyDates[index] + 'T00:00:00Z');
        const due = new Date(created.getTime() + 14 * 86400000).toISOString().slice(0, 10);
        const lateDays = index === 0 || index === 5 ? 3 : index === 10 ? 4 : 0;
        return {
          id: 'SAMPLE-HISTORY-' + index, userEmail: READER_DEMO_EMAIL,
          bookId: id, bookTitle: MOCK_BOOKS.find(book => book.id === id).title,
          days: 14, status: 'RETURNED', createdAt: created.toISOString(), dueDate: due,
          returnDate: new Date(new Date(due).getTime() + lateDays * 86400000).toISOString().slice(0, 10), fine: lateDays * 5000,
        };
      });
      history.push({
        id: 'SAMPLE-CURRENT', userEmail: READER_DEMO_EMAIL, bookId: 1,
        bookTitle: MOCK_BOOKS[0].title, days: 14, status: 'BORROWING',
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        dueDate: dateInVietnam(new Date(Date.now() + 9 * 86400000)), returnDate: null, fine: 0,
      });
      localStorage.setItem(DEMO_LOANS_KEY, JSON.stringify([...loans, ...history]));
    }
    seeded[READER_DEMO_EMAIL] = true;
    localStorage.setItem(SEED_KEY, JSON.stringify(seeded));
  } catch { showToast('Không thể chuẩn bị dữ liệu mẫu. Kiểm tra quyền lưu trữ của trình duyệt.'); }
}

function money(value) { return Number(value || 0).toLocaleString('vi-VN') + 'đ'; }
function displayDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' });
}
async function loadReaderData() {
  if (USE_MOCK_API) return;
  const [loansResponse, finesResponse, reservationsResponse] = await Promise.all([
    authRequest('/loans/mine'),
    authRequest('/fines/mine'),
    authRequest('/reservations/mine'),
  ]);
  if (!loansResponse.ok) throw new Error(loansResponse.message);
  if (!finesResponse.ok) throw new Error(finesResponse.message);
  if (!reservationsResponse.ok) throw new Error(reservationsResponse.message);

  const fineByLoan = new Map();
  readerData.fines = Array.isArray(finesResponse.data.fines) ? finesResponse.data.fines : [];
  readerData.fines.forEach(fine => {
    fineByLoan.set(fine.loanId, Number(fine.amount) || 0);
  });
  readerData.totalUnpaid = Number(finesResponse.data.totalUnpaid) || 0;
  readerData.loans = (Array.isArray(loansResponse.data) ? loansResponse.data : []).map(loan => ({
    id: loan.id,
    bookId: loan.book_id,
    bookTitle: loan.book?.title || `Sách #${loan.book_id}`,
    days: loan.days,
    status: loan.status,
    extensionCount: Number(loan.extension_count) || 0,
    createdAt: loan.created_at || loan.borrow_date,
    dueDate: loan.due_date,
    returnDate: loan.return_date,
    fine: fineByLoan.get(loan.id) || 0,
  }));
  readerData.reservations = (Array.isArray(reservationsResponse.data) ? reservationsResponse.data : []).map(reservation => ({
    id: reservation.id,
    bookId: reservation.book_id,
    bookTitle: findBook(reservation.book_id)?.title || `Sách #${reservation.book_id}`,
    status: reservation.status,
    createdAt: reservation.created_at,
    holdExpiresAt: reservation.hold_expires_at,
  }));
  updateReaderNotificationBadge();
}

function myLoans() {
  return USE_MOCK_API
    ? readDemoLoans().filter(loan => loan.userEmail === userEmail())
    : readerData.loans;
}

function totalFines(loans) {
  return USE_MOCK_API
    ? loans.reduce((total, loan) => total + (Number(loan.fine) || 0), 0)
    : readerData.totalUnpaid;
}
function findBook(id) {
  return (books.all || []).find(book => book.id === id) || (USE_MOCK_API && MOCK_BOOKS.some(book => book.id === id) ? normalizeBook(MOCK_BOOKS.find(book => book.id === id)) : null);
}

function readFavorites() {
  try {
    const ids = readStoredObject(FAVORITES_KEY, {})[userEmail()];
    return Array.isArray(ids) ? ids : [];
  } catch { return []; }
}
function toggleFavorite(id, button) {
  if (!requireLoanLogin()) return;
  try {
    const all = readStoredObject(FAVORITES_KEY, {});
    const ids = readFavorites();
    const adding = !ids.includes(id);
    all[userEmail()] = adding ? [...ids, id] : ids.filter(value => value !== id);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(all));
    button.textContent = adding ? '♥' : '♡';
    button.setAttribute('aria-pressed', String(adding));
    renderBooks();
    renderPopularBooks();
    const region = $('page-search').hidden ? $('popularBooks') : $('bookList');
    const replacement = [...region.querySelectorAll('.favorite-button')].find(item => Number(item.dataset.bookId) === id);
    if (replacement) replacement.focus();
    else $('categoryFilters').querySelector('[aria-pressed="true"]').focus();
    showToast(adding ? 'Đã thêm sách vào yêu thích.' : 'Đã bỏ sách khỏi yêu thích.');
  } catch { showToast('Không thể lưu sách yêu thích. Vui lòng thử lại.'); }
}
function updateFilterButtons() {
  document.querySelectorAll('#categoryFilters [data-filter]').forEach(button => {
    const selected = button.dataset.filter === books.filter;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}
function renderCategoryFilters() {
  const container = $('categoryFilters');
  const pinned = ['all', 'favorites'].map(filter =>
    container.querySelector(`[data-filter="${filter}"]`)
  ).filter(Boolean);
  container.replaceChildren(...pinned);

  const categories = [...new Set((books.all || []).map(book => book.category.trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'vi'));
  if (books.filter !== 'all' && books.filter !== 'favorites' && !categories.includes(books.filter)) {
    books.filter = 'all';
  }
  categories.forEach(category => {
    const button = el('button', 'btn btn--sm btn--secondary filter-chip', category);
    button.type = 'button';
    button.dataset.filter = category;
    button.setAttribute('aria-pressed', 'false');
    container.append(button);
  });
  updateFilterButtons();
}
$('categoryFilters').addEventListener('click', event => {
  const button = event.target.closest('button[data-filter]');
  if (!button || !event.currentTarget.contains(button)) return;
    clearTimeout(searchTimer);
    books.keyword = $('searchInput').value;
    books.filter = button.dataset.filter;
    books.page = 1;
    updateFilterButtons();
    renderBooks();
});

function getReviews(bookId) {
  let saved = [];
  try {
    saved = readStoredObject(REVIEWS_KEY, []);
    if (!Array.isArray(saved)) throw new Error('Dữ liệu đánh giá đã lưu không hợp lệ.');
  } catch (error) {
    console.error('Không thể đọc đánh giá đã lưu:', error);
    saved = [];
    if (!reviewStorageErrorShown) {
      showToast('Không thể đọc đánh giá cá nhân đã lưu trên trình duyệt.');
      reviewStorageErrorShown = true;
    }
  }
  const samples = window.PTIT_SAMPLE_REVIEWS.forBook(bookId);
  return [...samples, ...saved.filter(review => String(review.bookId) === String(bookId))]
    .sort((left, right) => String(right.date || '').localeCompare(String(left.date || '')));
}
function bookRating(bookId) {
  const reviews = getReviews(bookId);
  return { count: reviews.length, average: reviews.length ? reviews.reduce((sum, review) => sum + review.stars, 0) / reviews.length : 0 };
}

function renderPopularBooks() {
  const list = $('popularBooks');
  list.replaceChildren();
  [3, 1, 4, 5].map(findBook).filter(Boolean).forEach(book => list.append(bookCard(book)));
}

function statusBadge(loan) {
  const status = PTIT.getLoanStatus(loan);
  const badge = el('span', 'loan-status ' + status.statusClass, status.label);
  badge.title = status.status || 'Không xác định';
  badge.setAttribute('aria-label', status.label);
  return badge;
}

function makeTable(headings, label) {
  const wrap = el('div', 'table-scroll');
  wrap.tabIndex = 0;
  wrap.setAttribute('role', 'region');
  wrap.setAttribute('aria-label', label);
  const table = el('table', 'reader-table');
  const head = el('thead');
  const row = el('tr');
  headings.forEach(heading => {
    const cell = el('th', '', heading);
    cell.scope = 'col';
    row.append(cell);
  });
  head.append(row);
  const body = el('tbody');
  table.append(head, body);
  wrap.append(table);
  return { wrap, body };
}

function renderOverview() {
  const user = getUser();
  if (!user) return;
  if (!USE_MOCK_API) {
    Promise.all([loadReaderData(), ensureBooksLoaded()]).then(renderOverviewContent).catch(error => {
      ['statBorrowing', 'statPending', 'statReservations', 'statFines', 'statRemaining'].forEach(id => { $(id).textContent = '—'; });
      $('currentLoans').replaceChildren(el('p', 'error', 'Không thể tải dữ liệu trang tổng quan: ' + error.message));
    });
    return;
  }
  renderOverviewContent();
}

function renderOverviewContent() {
  const user = getUser();
  if (!user) return;
  $('libraryName').textContent = user.fullName || user.name || user.email;
  PTIT.setAvatar($('libraryAvatar'), user.fullName || user.email);
  $('libraryStudentId').textContent = user.studentId || user.studentCode || 'Chưa cập nhật';
  renderPopularBooks();
  const holder = $('currentLoans');
  holder.replaceChildren();
  try {
    const loans = myLoans();
    const borrowing = loans.filter(loan => loan.status === 'BORROWING');
    const pending = loans.filter(loan => loan.status === 'PENDING');
    const activeReservations = readerData.reservations.filter(reservation =>
      ['WAITING', 'HOLDING'].includes(reservation.status));
    $('statBorrowing').textContent = borrowing.length;
    $('statPending').textContent = pending.length;
    $('statReservations').textContent = activeReservations.length;
    $('statFines').textContent = money(totalFines(loans));
    $('statRemaining').textContent = Math.max(0, 3 - borrowing.length - pending.length);
    if (!borrowing.length) {
      holder.append(el('p', 'table-empty', 'Bạn chưa có sách đang mượn.'));
    } else {
      const { wrap, body } = makeTable(['Độc giả', 'Sách', 'Hạn trả', 'Trạng thái'], 'Sách đang mượn');
      borrowing.forEach(loan => {
        const row = el('tr');
        const status = el('td');
        status.append(statusBadge(loan));
        row.append(el('td', '', user.fullName || user.email), el('td', '', loan.bookTitle), el('td', '', displayDate(loan.dueDate)), status);
        body.append(row);
      });
      holder.append(wrap);
    }
  } catch {
    ['statBorrowing', 'statPending', 'statReservations', 'statFines', 'statRemaining'].forEach(id => { $(id).textContent = '—'; });
    holder.append(el('p', 'error', 'Không thể đọc phiếu mượn đã lưu.'));
  }
  updateReaderNotificationBadge();
}

function renderMyLoans() {
  const list = $('myLoanList');
  list.replaceChildren();
  if (!USE_MOCK_API) {
    list.append(stateBox('Đang tải phiếu mượn...', 'loading'));
    Promise.all([ensureBooksLoaded(), loadReaderData()]).then(renderMyLoansContent).catch(error => {
      $('myFines').textContent = 'Tổng tiền phạt: —';
      list.replaceChildren(stateBox('Không thể tải dữ liệu Sách của tôi: ' + error.message, 'error'));
    });
    return;
  }
  renderMyLoansContent();
}

function renderMyLoansContent() {
  const list = $('myLoanList');
  const fineList = $('myFineList');
  list.replaceChildren();
  fineList.replaceChildren();
  try {
    const mine = myLoans();
    $('myFines').textContent = 'Tổng tiền phạt: ' + money(totalFines(mine));
    const pendingCount = mine.filter(loan => loan.status === 'PENDING').length;
    const borrowingCount = mine.filter(loan => loan.status === 'BORROWING').length;
    const activeReservations = readerData.reservations.filter(reservation => ['WAITING', 'HOLDING'].includes(reservation.status));

    const summary = el('div', 'my-library-summary');
    const summaryIcons = [
      '<path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v18H7.5A2.5 2.5 0 0 0 5 22z"/><path d="M5 4.5v15A2.5 2.5 0 0 1 7.5 17H20"/>',
      '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
      '<path d="M4 5h16v16H4z"/><path d="m8 12 2.5 2.5L16 9"/>',
      '<circle cx="12" cy="12" r="9"/><path d="M15 8.5c-.7-.7-1.6-1-3-1-1.7 0-3 .8-3 2s1.3 2 3 2 3 .8 3 2-1.3 2-3 2c-1.3 0-2.3-.4-3-1.1M12 6v12"/>',
    ];
    [
      ['Đang mượn', borrowingCount, 'Đang đọc'],
      ['Chờ duyệt', pendingCount, 'Chờ thủ thư'],
      ['Đặt trước', activeReservations.length, 'Đang chờ giữ'],
      ['Tiền phạt', money(totalFines(mine)), 'Chưa thanh toán'],
    ].forEach(([label, value, caption], index) => {
      const card = el('article', 'my-summary-card');
      const icon = el('span', 'summary-icon');
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = `<svg viewBox="0 0 24 24">${summaryIcons[index]}</svg>`;
      card.append(icon, el('strong', '', String(value)), el('span', '', label), el('small', '', caption));
      summary.append(card);
    });
    list.append(summary);

    const activeLoans = mine.filter(loan => ['PENDING', 'BORROWING'].includes(loan.status));
    const activeHeading = el('h2', 'section-title section-title--spaced', 'Đang mượn / Chờ duyệt');
    activeHeading.id = 'myActiveLoansHeading';
    list.append(activeHeading);
    if (!activeLoans.length) {
      list.append(el('p', 'table-empty my-empty-state', 'Bạn chưa có sách đang mượn hoặc phiếu chờ duyệt.'));
    } else {
      const { wrap, body } = makeTable(['Sách', 'Đăng ký', 'Hạn trả', 'Trạng thái', 'Phạt', ''], 'Phiếu đang hoạt động');
      activeLoans.forEach(loan => {
        const row = el('tr');
        const title = el('td', '', loan.bookTitle);
        if (loan.status === 'PENDING') title.append(el('small', 'loan-duration', loan.days + ' ngày'));
        const status = el('td');
        status.append(statusBadge(loan));
        const action = el('td');
        if (loan.status === 'PENDING') {
          const cancel = el('button', 'btn btn-outline table-action', 'Hủy phiếu');
          cancel.type = 'button';
          cancel.addEventListener('click', () => cancelLoanRequest(loan.id));
          action.append(cancel);
        } else if (loan.status === 'BORROWING') {
          const renew = el('button', 'btn btn-outline table-action', 'Gia hạn');
          renew.type = 'button';
          renew.disabled = Number(loan.extensionCount) >= 1;
          if (renew.disabled) renew.title = 'Phiếu này đã được gia hạn';
          renew.addEventListener('click', () => extendLoanRequest(loan.id));
          action.append(renew);
        }
        row.append(title, el('td', '', displayDate(loan.createdAt)), el('td', '', displayDate(loan.dueDate)), status, el('td', '', loan.fine ? money(loan.fine) : '–'), action);
        body.append(row);
      });
      list.append(wrap);
    }

    const history = mine.filter(loan => !['PENDING', 'BORROWING'].includes(PTIT.getLoanStatus(loan).status));
    list.append(el('h2', 'section-title section-title--spaced', 'Lịch sử mượn'));
    if (!history.length) {
      list.append(el('p', 'table-empty my-empty-state', 'Chưa có lịch sử mượn trả.'));
    } else {
      const pages = Math.max(1, Math.ceil(history.length / 8));
      myLoansPage = Math.min(Math.max(1, myLoansPage), pages);
      const { wrap, body } = makeTable(['Sách', 'Đăng ký', 'Hạn/Trả', 'Trạng thái', ''], 'Lịch sử mượn');
      history.slice((myLoansPage - 1) * 8, myLoansPage * 8).forEach(loan => {
        const row = el('tr');
        const action = el('td');
        if (loan.status === 'RETURNED' && findBook(loan.bookId)) {
          const review = el('button', 'btn btn-outline table-action', 'Đánh giá');
          review.type = 'button';
          review.addEventListener('click', () => openReview(findBook(loan.bookId)));
          action.append(review);
        }
        const status = el('td');
        status.append(statusBadge(loan));
        row.append(el('td', '', loan.bookTitle), el('td', '', displayDate(loan.createdAt)), el('td', '', displayDate(loan.returnDate || loan.dueDate)), status, action);
        body.append(row);
      });
      list.append(wrap);
      const pager = el('nav', 'pagination loan-pagination');
      pager.setAttribute('aria-label', 'Phân trang lịch sử mượn');
      const add = (label, target, disabled = false) => {
        const button = el('button', 'page-btn' + (Number(label) === myLoansPage ? ' active' : ''), label);
        button.type = 'button';
        button.disabled = disabled;
        if (Number(label) === myLoansPage) button.setAttribute('aria-current', 'page');
        button.addEventListener('click', () => { myLoansPage = target; renderMyLoans(); });
        pager.append(button);
      };
      add('‹ Trước', myLoansPage - 1, myLoansPage === 1);
      pageNumbers(myLoansPage, pages).forEach(number => number === '…' ? pager.append(el('span', 'page-gap', number)) : add(String(number), number));
      add('Sau ›', myLoansPage + 1, myLoansPage === pages);
      pager.append(el('span', 'pagination-count', history.length + ' mục'));
      list.append(pager);
    }

    const rsvHeading = el('h2', 'section-title section-title--spaced', 'Đặt trước sách');
    rsvHeading.id = 'myReservationsHeading';
    list.append(rsvHeading);
    const reservations = readerData.reservations;
    if (!reservations.length) list.append(el('p', 'table-empty my-empty-state', 'Bạn chưa có phiếu đặt trước nào.'));
    else {
      const { wrap, body } = makeTable(['Sách', 'Ngày đặt', 'Trạng thái', 'Giữ đến', ''], 'Danh sách đặt trước');
      const labels = { WAITING: 'Đang chờ', HOLDING: 'Đang giữ sách', FULFILLED: 'Đã mượn', EXPIRED: 'Hết hạn', CANCELLED: 'Đã hủy' };
      reservations.forEach(reservation => {
        const action = el('td');
        if (['WAITING', 'HOLDING'].includes(reservation.status)) {
          const cancel = el('button', 'btn btn-outline table-action', 'Hủy');
          cancel.type = 'button';
          cancel.addEventListener('click', () => cancelReservationRequest(reservation.id));
          action.append(cancel);
        }
        const row = el('tr');
        row.append(
          el('td', '', findBook(reservation.bookId)?.title || reservation.bookTitle),
          el('td', '', displayDate(reservation.createdAt)),
          el('td', '', labels[reservation.status] || reservation.status),
          el('td', '', displayDate(reservation.holdExpiresAt)),
          action,
        );
        body.append(row);
      });
      list.append(wrap);
    }

    if (!readerData.fines.length) fineList.append(el('p', 'table-empty my-empty-state', 'Chưa có khoản phạt.'));
    else {
      const { wrap, body } = makeTable(['Sách', 'Số ngày trễ', 'Số tiền', 'Trạng thái'], 'Các khoản phạt');
      readerData.fines.forEach(fine => {
        const row = el('tr');
        row.append(
          el('td', '', fine.bookTitle),
          el('td', '', String(fine.overdueDays || 0)),
          el('td', '', money(fine.amount)),
          el('td', '', fine.paid ? 'Đã thanh toán' : fine.type === 'PROVISIONAL' ? 'Tạm tính' : 'Chưa thanh toán'),
        );
        body.append(row);
      });
      fineList.append(wrap);
    }
  } catch {
    $('myFines').textContent = 'Tổng tiền phạt: —';
    list.append(stateBox('Không thể đọc phiếu mượn.', 'error'));
  }
}

function renderBookDetails(book) {
  const bookKey = String(book.id);
  if (reviewFilterBookId !== bookKey) {
    reviewFilterBookId = bookKey;
    selectedReviewStars = 0;
  }
  const isHoldingForMe = readerData.reservations.some(
    r => r.bookId === book.id && r.status === 'HOLDING'
  );
  const canBorrow = book.copies > 0 || isHoldingForMe;
  $('registerLoanButton').hidden = !canBorrow;
  $('reserveBookButton').hidden = canBorrow;
  $('bookDetailDescription').textContent = getBookIntroduction(book);
  const meta = $('bookDetailMeta');
  meta.replaceChildren();
  const line = (label, value) => {
    const row = el('p');
    row.append(document.createTextNode(label), el('strong', '', value));
    meta.append(row);
  };
  line('Tác giả: ', book.author || 'Chưa cập nhật');
  line('Thể loại: ', book.category || 'Chưa phân loại');
  line('ISBN: ', book.isbn || 'Chưa cập nhật');
  line('Nhà xuất bản: ', book.publisher || 'Chưa cập nhật');
  line('Năm xuất bản: ', book.publicationYear || 'Chưa cập nhật');
  const demoBook = USE_MOCK_API && MOCK_BOOKS.find(item => item.id === book.id);
  if (demoBook) {
    line('Vị trí kệ: ', 'K' + (Math.floor((book.id - 1) / 8) + 2) + '-B' + ((book.id - 1) % 8 + 1));
    line('Còn lại: ', book.copies + '/' + (demoBook.availableCopies + 1) + ' bản');
    line('Đã được mượn: ', ({ 1: 5, 2: 3, 3: 7, 4: 4, 5: 3 }[book.id] || 1) + ' lượt');
    line('Hàng chờ đặt trước: ', '0 người');
    $('bookDetailAvailability').hidden = true;
  } else { $('bookDetailAvailability').hidden = false; }
  const reviews = getReviews(book.id);
  const rating = bookRating(book.id);
  const summary = $('reviewSummary');
  summary.replaceChildren();
  const score = el('div', 'rating-score');
  score.append(el('strong', '', rating.count ? rating.average.toFixed(1) : '—'), el('span', 'stars', rating.count ? '★'.repeat(Math.round(rating.average)) : '☆☆☆☆☆'), el('small', 'muted', rating.count + ' đánh giá'));
  const bars = el('div', 'rating-bars');
  for (let stars = 5; stars >= 1; stars--) {
    const count = reviews.filter(review => review.stars === stars).length;
    const row = el('button', 'rating-bar-row');
    row.type = 'button';
    row.dataset.reviewStars = String(stars);
    row.setAttribute('aria-pressed', String(selectedReviewStars === stars));
    const track = el('span', 'rating-track');
    const fill = el('span', 'rating-fill');
    fill.style.width = (reviews.length ? count / reviews.length * 100 : 0) + '%';
    track.append(fill);
    row.append(el('span', '', stars + ' ★'), track, el('span', '', String(count)));
    bars.append(row);
  }
  summary.append(score, bars);
  const list = $('reviewList');
  list.replaceChildren();
  const visibleReviews = selectedReviewStars
    ? reviews.filter(review => review.stars === selectedReviewStars)
    : reviews;
  if (reviews.some(review => review.isSample)) {
    list.append(el('p', 'review-demo-note', 'Dữ liệu minh họa phục vụ demo'));
  }
  if (!reviews.length) list.append(el('p', 'muted', 'Chưa có đánh giá. Hãy chia sẻ cảm nhận của bạn.'));
  else if (!visibleReviews.length) list.append(el('p', 'muted', 'Không có nhận xét ở mức sao này.'));
  visibleReviews.forEach(review => {
    const row = el('article', 'reader-review');
    const content = el('div', 'review-content');
    const heading = el('p', 'review-author');
    heading.append(el('strong', '', review.name), el('span', 'stars', '★'.repeat(review.stars) + '☆'.repeat(5 - review.stars)));
    if (review.isSample) heading.append(el('span', 'review-sample-badge', 'Đánh giá mẫu'));
    content.append(heading, el('small', 'muted', displayDate(review.date)), el('p', 'review-comment', review.comment || 'Độc giả đã đánh giá ' + review.stars + ' sao.'));
    const avatar = el('span', 'avatar');
    PTIT.setAvatar(avatar, review.name);
    row.append(avatar, content);
    if (!review.isSample && isOwnReview(review)) {
      const actions = el('div', 'review-actions');
      const edit = el('button', 'btn btn--sm btn--outline', 'Sửa');
      edit.type = 'button';
      edit.addEventListener('click', () => openReview(book));
      const remove = el('button', 'btn btn--sm btn--danger', 'Xóa');
      remove.type = 'button';
      remove.addEventListener('click', () => deleteReview(review, book));
      actions.append(edit, remove);
      content.append(actions);
    }
    list.append(row);
  });
}

$('reviewSummary').addEventListener('click', event => {
  const button = event.target.closest('button[data-review-stars]');
  if (!button) return;
  const stars = Number(button.dataset.reviewStars);
  selectedReviewStars = selectedReviewStars === stars ? 0 : stars;
  if (loanState.book) renderBookDetails(loanState.book);
});

function deleteReview(review, book) {
  PTIT.confirm('Bạn có chắc chắn muốn xóa đánh giá này?', {
    confirmText: 'Xóa đánh giá',
    onConfirm: async () => {
      try {
        const saved = readStoredObject(REVIEWS_KEY, []);
        if (!Array.isArray(saved)) throw new Error('Dữ liệu đánh giá đã lưu không hợp lệ.');
        const id = reviewUserId();
        const email = userEmail();
        const remaining = saved.filter(item => !(
          String(item.bookId) === String(book.id) &&
          (String(item.userId || '') === id || (!item.userId && item.userEmail === email))
        ));
        localStorage.setItem(REVIEWS_KEY, JSON.stringify(remaining));
        selectedReviewStars = 0;
        renderBookDetails(book);
        renderBooks();
        renderPopularBooks();
        showToast('Đã xóa đánh giá của bạn.');
      } catch (error) {
        console.error('Không thể xóa đánh giá đã lưu:', error);
        showToast('Không thể xóa đánh giá trên trình duyệt này.');
      }
    }
  });
}

const SAMPLE_BOOK_INTRODUCTIONS = new Map([
  ['tâm lý học đám đông', 'Khám phá cách cảm xúc, niềm tin và ảnh hưởng xã hội có thể định hình hành vi của con người khi ở trong đám đông. Nội dung phù hợp với bạn đọc quan tâm tới tâm lý học xã hội và hành vi con người.'],
  ['chính trị học đại cương', 'Giới thiệu những khái niệm nền tảng về quyền lực, nhà nước, thể chế và đời sống chính trị. Cuốn sách giúp bạn đọc tiếp cận các vấn đề chính trị - xã hội một cách có hệ thống.'],
  ['kinh tế việt nam trong hội nhập', 'Khái quát những chuyển động của kinh tế Việt Nam trong bối cảnh hội nhập, từ cơ hội phát triển đến các thách thức về cạnh tranh và chính sách. Hữu ích cho bạn đọc muốn hiểu bức tranh kinh tế trong nước.'],
  ['tư duy phản biện', 'Gợi mở cách đặt câu hỏi, kiểm tra luận cứ và đánh giá thông tin trước khi đưa ra kết luận. Những kỹ năng này có thể áp dụng trong học tập, trao đổi và giải quyết vấn đề.'],
  ['quản lý thời gian hiệu quả', 'Tổng hợp cách xác định ưu tiên, lập kế hoạch và tổ chức công việc để sử dụng thời gian chủ động hơn. Phù hợp với bạn đọc cần cân bằng nhiều đầu việc trong học tập và cuộc sống.'],
  ['kỹ năng thuyết trình', 'Hướng dẫn cách chuẩn bị nội dung, sắp xếp ý tưởng và trình bày rõ ràng trước người nghe. Tài liệu phù hợp để rèn sự tự tin khi thuyết trình trong học tập và công việc.'],
]);

function getBookIntroduction(book) {
  const description = String(book.description || '').trim();
  const isPlaceholder = description.startsWith('Dữ liệu mẫu giới thiệu sách ') &&
    description.includes('Vui lòng cập nhật bằng thông tin thư mục chính thức.');

  if (description && !isPlaceholder) return description;

  const titleKey = String(book.title || '').trim().toLocaleLowerCase('vi-VN');
  const sampleIntroduction = SAMPLE_BOOK_INTRODUCTIONS.get(titleKey);
  if (sampleIntroduction) return sampleIntroduction;

  const category = book.category ? `thuộc lĩnh vực ${book.category}` : 'trong danh mục thư viện';
  return `Tài liệu “${book.title}” ${category}, giới thiệu các kiến thức nền tảng và khái niệm trọng tâm để bạn đọc tham khảo, học tập và tìm hiểu sâu hơn về chủ đề.`;
}

async function cancelLoanRequest(loanId) {
  await PTIT.confirm('Bạn có chắc muốn hủy phiếu mượn này?', {
    danger: true,
    confirmText: 'Hủy phiếu mượn',
    onConfirm: async () => {
      try {
        const response = await authRequest(`/loans/${loanId}/cancel`, { method: 'PUT' });
        if (!response.ok) throw new Error(response.message);
      } catch (error) {
        showToast('Không thể hủy phiếu mượn: ' + error.message);
        throw error;
      }
      try {
        await loadReaderData();
        renderMyLoans();
        renderOverview();
      } catch (error) {
        showToast('Đã hủy phiếu mượn nhưng không thể tải lại dữ liệu: ' + error.message);
        return;
      }
      showToast('Đã hủy phiếu mượn.');
    }
  });
}

async function extendLoanRequest(loanId) {
  await PTIT.confirm('Gia hạn phiếu mượn thêm 7 ngày?', {
    confirmText: 'Gia hạn',
    onConfirm: async () => {
      try {
        const response = await authRequest(`/loans/${loanId}/extend`, { method: 'POST' });
        if (!response.ok) throw new Error(response.message);
      } catch (error) {
        showToast('Không thể gia hạn: ' + error.message);
        throw error;
      }
      try {
        await loadReaderData();
        renderMyLoans();
        renderOverview();
      } catch (error) {
        showToast('Đã gia hạn phiếu nhưng không thể tải lại dữ liệu: ' + error.message);
        return;
      }
      showToast('Đã gia hạn phiếu mượn thành công.');
    }
  });
}

async function cancelReservationRequest(reservationId) {
  await PTIT.confirm('Bạn có chắc muốn hủy phiếu đặt trước này?', {
    danger: true,
    confirmText: 'Hủy đặt trước',
    onConfirm: async () => {
      try {
        const response = await authRequest(`/reservations/${reservationId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error(response.message);
      } catch (error) {
        showToast('Không thể hủy phiếu đặt trước: ' + error.message);
        throw error;
      }
      try {
        await loadReaderData();
        renderMyLoans();
        renderOverview();
      } catch (error) {
        showToast('Đã hủy đặt trước nhưng không thể tải lại dữ liệu: ' + error.message);
        return;
      }
      showToast('Đã hủy phiếu đặt trước.');
    }
  });
}

$('reserveBookButton').addEventListener('click', async () => {
  if (!loanState.book || !requireLoanLogin()) return;
  const book = loanState.book;
  const button = $('reserveBookButton');
  button.disabled = true;
  try {
    const response = await authRequest('/reservations', {
      method: 'POST',
      body: JSON.stringify({ book_id: book.id }),
    });

    closeBookDetail();

    if (!response.ok) {
      if (window.PTIT?.confirm) {
        await PTIT.confirm(
          response.message || 'Bạn đã đặt trước cuốn sách này và đang trong hàng chờ.',
          {
            title: 'Không thể đặt trước',
            confirmText: 'Đã hiểu',
            cancelText: 'Đóng',
          }
        );
      } else {
        alert(response.message || 'Bạn đã đặt trước cuốn sách này và đang trong hàng chờ.');
      }
      return;
    }

    await loadReaderData();
    if (!$('page-mybooks').hidden) renderMyLoans();
    if (!$('page-overview').hidden) renderOverview();

    if (window.PTIT?.confirm) {
      const goMyBooks = await PTIT.confirm(
        `Đã đặt trước sách “${book.title}”. Bạn có muốn xem danh sách đặt trước trong mục Sách của tôi không?`,
        {
          title: 'Đặt trước thành công',
          confirmText: 'Xem Sách của tôi',
          cancelText: 'Đóng',
        }
      );
      if (goMyBooks) navigate('mybooks');
    } else {
      showToast('Đã đặt trước sách. Theo dõi trạng thái trong mục Sách của tôi.');
    }
  } catch (error) {
    closeBookDetail();
    alert('Không thể đặt trước sách: ' + error.message);
  } finally {
    button.disabled = false;
  }
});

function openReview(book) {
  if (!requireLoanLogin()) return;
  reviewBook = book;
  reviewReturnFocus = document.activeElement;
  $('reviewTitle').textContent = 'Đánh giá: ' + book.title;
  const previous = getReviews(book.id).find(isOwnReview);
  $('reviewStars').value = previous ? previous.stars : '5';
  $('reviewComment').value = previous ? previous.comment : '';
  $('reviewError').textContent = '';
  $('reviewForm').querySelector('[type="submit"]').textContent = previous ? 'Cập nhật đánh giá' : 'Gửi đánh giá';
  if (window.PTIT?.openModal) PTIT.openModal('reviewDialog');
  else $('reviewDialog').showModal();
  document.body.style.overflow = 'hidden';
  $('reviewStars').focus();
}
function closeReview() {
  if (!$('reviewDialog').open) return;
  if (window.PTIT?.closeModal) PTIT.closeModal('reviewDialog');
  else $('reviewDialog').close();
  reviewBook = null;
  document.body.style.overflow = $('bookDialog').open ? 'hidden' : '';
  if (reviewReturnFocus && reviewReturnFocus.isConnected) reviewReturnFocus.focus();
}
$('writeReviewButton').addEventListener('click', () => openReview(loanState.book));
$('reviewDialog').addEventListener('cancel', event => { event.preventDefault(); closeReview(); });
$('reviewForm').addEventListener('submit', event => {
  event.preventDefault();
  if (!reviewBook || !requireLoanLogin()) return;
  const stars = Number($('reviewStars').value);
  const comment = $('reviewComment').value.trim();
  if (!Number.isInteger(stars) || stars < 1 || stars > 5 || comment.length > 300) {
    $('reviewError').textContent = 'Chọn từ 1 đến 5 sao và nhập nhận xét tối đa 300 ký tự.';
    return;
  }
  try {
    const saved = readStoredObject(REVIEWS_KEY, []);
    if (!Array.isArray(saved)) throw new Error('Dữ liệu đánh giá không hợp lệ');
    const reviewedBook = reviewBook;
    const user = getUser() || {};
    const email = userEmail(user);
    const id = reviewUserId(user);
    const review = {
      bookId: reviewBook.id,
      userId: id,
      userEmail: email,
      name: user.fullName || user.full_name || user.name || user.email || 'Độc giả',
      stars,
      comment,
      date: dateInVietnam(),
    };
    const remaining = saved.filter(item => !(
      String(item.bookId) === String(review.bookId) &&
      (String(item.userId || '') === id || (!item.userId && item.userEmail === email))
    ));
    localStorage.setItem(REVIEWS_KEY, JSON.stringify([...remaining, review]));
    closeReview();
    selectedReviewStars = 0;
    if (loanState.book && String(loanState.book.id) === String(reviewedBook.id)) {
      renderBookDetails(loanState.book);
    }
    renderBooks();
    renderPopularBooks();
    showToast('Đã lưu đánh giá của bạn.');
  } catch { $('reviewError').textContent = 'Không thể lưu đánh giá. Vui lòng kiểm tra quyền lưu trữ rồi thử lại.'; }
});

/* ---------- Tiện ích Hồ sơ & Thông báo (Chấm đỏ + Chi tiết từng sách + Chuyển hướng) ---------- */
function getReaderNotifications() {
  const loans = myLoans();
  const items = [];

  (readerData.reservations || []).filter(r => r.status === 'HOLDING').forEach(r => {
    const title = findBook(r.bookId)?.title || r.bookTitle;
    items.push({
      key: 'rsv-hold-' + r.id,
      rowKey: 'rsv-' + r.id,
      text: `${title} · Sách đặt trước đã có, giữ đến ${displayDate(r.holdExpiresAt)}`,
      section: 'reservations',
    });
  });

  loans.filter(loan => loan.status === 'PENDING').forEach(loan => {
    items.push({
      key: 'pending-' + loan.id,
      rowKey: 'loan-' + loan.id,
      text: `${loan.bookTitle} · Đang chờ duyệt (${loan.days} ngày)`,
      section: 'loans',
    });
  });

  loans.filter(loan => loan.status === 'BORROWING').forEach(loan => {
    items.push({
      key: 'borrowing-' + loan.id + '-' + (isLoanOverdue(loan) ? 'late' : 'ok'),
      rowKey: 'loan-' + loan.id,
      text: `${loan.bookTitle} · ${isLoanOverdue(loan) ? 'Đã quá hạn trả: ' : 'Hạn trả: '}${displayDate(loan.dueDate)}`,
      section: 'loans',
    });
  });

  (readerData.fines || []).filter(f => !f.paid && Number(f.amount) > 0).forEach((fine, idx) => {
    items.push({
      key: 'fine-' + (fine.loanId || idx) + '-' + fine.amount,
      rowKey: 'fine-' + (fine.loanId || ''),
      text: `${fine.bookTitle} · Tiền phạt ${fine.type === 'PROVISIONAL' ? '(tạm tính)' : 'chưa nộp'}: ${money(fine.amount)}`,
      section: 'fines',
    });
  });

  return items;
}

function goFromNotification(item) {
  if (window.PTIT?.closeModal) PTIT.closeModal('utilityDialog');
  else if ($('utilityDialog').open) $('utilityDialog').close();

  navigate('mybooks');

  // Chờ API tải xong bảng Sách của tôi rồi cuộn tới đúng dòng & nháy sáng
  let attempts = 0;
  const timer = setInterval(() => {
    attempts++;
    const row = document.querySelector(`tr[data-noti-key="${item.rowKey}"]`);
    if (row) {
      clearInterval(timer);
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      row.classList.remove('noti-highlight-row');
      void row.offsetWidth; // reset animation nếu bấm lại
      row.classList.add('noti-highlight-row');
    } else if (attempts >= 20) {
      clearInterval(timer);
    }
  }, 100);
}

function updateReaderNotificationBadge() {
  const badge = $('readerNotificationBadge');
  if (!badge || !hasLoanSession()) return;
  try {
    const items = getReaderNotifications();
    const seenKey = 'ptit_seen_noti_' + userEmail();
    const seen = JSON.parse(sessionStorage.getItem(seenKey) || '[]');
    const unread = items.filter(item => !seen.includes(item.key)).length;
    badge.textContent = unread > 9 ? '9+' : String(unread);
    badge.hidden = unread === 0;
  } catch {
    badge.hidden = true;
  }
}

function goFromNotification(section) {
  if (window.PTIT?.closeModal) PTIT.closeModal('utilityDialog');
  else if ($('utilityDialog').open) $('utilityDialog').close();

  navigate('mybooks');

  setTimeout(() => {
    const target = section === 'reservations'
      ? $('myReservationsHeading')
      : section === 'fines'
        ? $('myFineList')
        : $('myActiveLoansHeading');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 150);
}

function openUtility(title, render) {
  if (!requireLoanLogin()) return;
  $('utilityTitle').textContent = title;
  $('utilityContent').replaceChildren();
  render($('utilityContent'));
  if (window.PTIT?.openModal) PTIT.openModal('utilityDialog');
  else {
    $('utilityDialog').showModal();
  }
}
$('utilityDialog').addEventListener('close', () => { document.body.style.overflow = ''; });
$('profileButton').addEventListener('click', () => openUtility('Hồ sơ độc giả', content => {
  const user = getUser();
  [['Họ và tên', user.fullName || user.name], ['Mã sinh viên', user.studentId || user.studentCode], ['Email', user.email], ['Vai trò', ROLE_LABELS[normalizeRole(user.role)]]].forEach(([label, value]) => {
    const row = el('p', 'profile-row');
    row.append(el('span', 'muted', label), el('strong', '', value || 'Chưa cập nhật'));
    content.append(row);
  });

  const form = el('form', 'password-change-form');
  form.append(el('h3', '', 'Đổi mật khẩu'));
  const fields = [
    ['currentPassword', 'Mật khẩu hiện tại', 'current-password'],
    ['newPassword', 'Mật khẩu mới (ít nhất 6 ký tự)', 'new-password'],
    ['confirmPassword', 'Nhập lại mật khẩu mới', 'new-password'],
  ];
  fields.forEach(([id, label, autocomplete]) => {
    const inputLabel = el('label', '', label);
    inputLabel.htmlFor = id;
    const input = el('input');
    input.id = id;
    input.type = 'password';
    input.required = true;
    input.autocomplete = autocomplete;
    if (id === 'newPassword') input.minLength = 6;
    form.append(inputLabel, input);
  });
  const error = el('p', 'error');
  error.setAttribute('role', 'alert');
  const submit = el('button', 'btn btn-primary', 'Đổi mật khẩu');
  submit.type = 'submit';
  form.append(error, submit);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const currentPassword = form.querySelector('#currentPassword').value;
    const newPassword = form.querySelector('#newPassword').value;
    const confirmPassword = form.querySelector('#confirmPassword').value;
    if (newPassword.length < 6 || newPassword !== confirmPassword) {
      error.textContent = newPassword.length < 6
        ? 'Mật khẩu mới cần có ít nhất 6 ký tự.'
        : 'Mật khẩu nhập lại chưa khớp.';
      return;
    }
    submit.disabled = true;
    error.textContent = '';
    try {
      const response = await authRequest('/auth/password', {
        method: 'PUT',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      if (!response.ok) throw new Error(response.message);
      form.reset();
      showToast('Đã đổi mật khẩu.');
    } catch (requestError) {
      error.textContent = 'Không thể đổi mật khẩu: ' + requestError.message;
    } finally {
      submit.disabled = false;
    }
  });
  content.append(form);
}));

$('notificationsButton').addEventListener('click', () => openUtility('Thông báo', content => {
  try {
    const items = getReaderNotifications();

    // Đánh dấu đã đọc để tắt chấm đỏ sau khi mở xem
    sessionStorage.setItem(
      'ptit_seen_noti_' + userEmail(),
      JSON.stringify(items.map(item => item.key))
    );
    updateReaderNotificationBadge();

    if (!items.length) {
      content.append(el('p', 'table-empty', 'Bạn chưa có thông báo nào.'));
      return;
    }

    items.forEach(item => {
      const btn = el('button', 'notification-item');
      btn.type = 'button';
      btn.append(
        el('span', '', item.text),
        el('span', 'notification-item__action', 'Xem →')
      );
      btn.addEventListener('click', () => goFromNotification(item.section));
      content.append(btn);
    });
  } catch {
    content.append(el('p', 'error', 'Không thể đọc thông báo từ phiếu mượn.'));
  }
}));
PTIT.initThemeButton($('themeButton'));

/* ---------- Khởi động: giữ đăng nhập nếu token còn hạn ---------- */
(function init() {
  const token = getToken();
  const user = getUser();
  if (token && user && !isTokenExpired(token)) showApp(user);
  else if (token || user) logout();
})();