/* =====================================================
   BẢN DEMO — chạy không cần backend
   Đăng ký, Đăng nhập và danh sách sách đều dùng DỮ LIỆU GIẢ
   lưu trong trình duyệt. Muốn nối API thật: đặt USE_MOCK_API = false
   và chỉnh lại cấu hình bên dưới (hoặc dùng bản trong thư mục my-project).
   ===================================================== */
const API_BASE_URL = 'http://localhost:8080/api';
const ENDPOINTS = {
  register: '/auth/register',
  login: '/auth/login',
  books: '/books',
};

// Cách lấy danh sách sách từ API (chỉnh cho khớp backend)
const BOOKS_CONFIG = {
  pageParam: 'page',  // tên tham số số trang
  sizeParam: 'size',  // tên tham số số phần tử mỗi trang
  firstPage: 1,       // trang đầu tiên đánh số từ 1 hay 0 (Spring: 0)
  fetchSize: 100,     // số sách lấy về mỗi lần gọi API
};
const PAGE_SIZE = 10; // số sách hiển thị trên mỗi trang

// true  = DEMO: Đăng ký, Đăng nhập, danh sách sách dùng dữ liệu giả (không cần backend)
// false = gọi API thật tại API_BASE_URL
const USE_MOCK_API = true;

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

function initials(name) {
  const w = String(name || '?').trim().split(/\s+/);
  return w.slice(-2).map(x => x[0]).join('').toUpperCase();
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
   Mật khẩu lưu dạng thô nên KHÔNG dùng cho sản phẩm thật.
   ===================================================== */
const MOCK_USERS_KEY = 'ptit_mock_users';

function mockLoadUsers() {
  let users = null;
  try { users = JSON.parse(localStorage.getItem(MOCK_USERS_KEY)); } catch { /* bỏ qua */ }
  if (!Array.isArray(users)) {
    // Tài khoản có sẵn cho các nút "Tài khoản thử nghiệm"
    users = [
      { fullName: 'Quản trị viên', studentId: '', email: 'admin@ptit.edu.vn', password: '123456', role: 'ADMIN', status: 'ACTIVE' },
      { fullName: 'Thủ thư', studentId: '', email: 'thuthu@ptit.edu.vn', password: '123456', role: 'LIBRARIAN', status: 'ACTIVE' },
      { fullName: 'Độc giả', studentId: 'B22DCCN101', email: 'docgia@ptit.edu.vn', password: '123456', role: 'READER', status: 'ACTIVE' },
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
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // hết hạn sau 24 giờ
  });
  return header + '.' + payload + '.demo-signature';
}

function mockReply(status, data) {
  return status < 400
    ? { ok: true, status, data }
    : { ok: false, status, data, message: data.message };
}

async function mockRequest(fullPath, options) {
  await new Promise(r => setTimeout(r, 400)); // giả lập độ trễ mạng
  const [path, query = ''] = fullPath.split('?');
  const body = options.body ? JSON.parse(options.body) : {};

  // Danh sách sách: trả về theo từng trang giống một API có phân trang (trang đánh số từ 1)
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
  if (USE_MOCK_API) return mockRequest(path, options);
  try {
    const res = await fetch(API_BASE_URL + path, {
      ...options,
      headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, status: res.status, data, message: data.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.' };
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
    // Token hết hạn/không hợp lệ -> đăng xuất (không áp dụng khi đang dùng token giả của chế độ demo)
    if (r.status === 401 && !USE_MOCK_API) logout();
    return r;
  });
}
window.PTIT = { getToken, getUser, authRequest };

/* ---------- Chuyển giữa trang công khai và giao diện Độc giả ---------- */
function showPublic() {
  $('appView').hidden = true;
  $('publicView').hidden = false;
  document.body.style.overflow = '';
}

function showApp(user) {
  const name = user.fullName || user.name || user.email || 'Người dùng';
  const role = ROLE_LABELS[normalizeRole(user.role)] || 'Độc giả';

  $('publicView').hidden = true;
  $('appView').hidden = false;
  $('userName').textContent = name;
  $('userAvatar').textContent = initials(name);
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
  document.querySelectorAll('.menu-item').forEach(b =>
    b.classList.toggle('active', b.dataset.nav === page));
  $('topbarTitle').textContent = PAGE_TITLES[page];
  closeSidebar();
  window.scrollTo(0, 0);
  if (page === 'search') loadBooks();
}

document.querySelectorAll('[data-nav]').forEach(btn =>
  btn.addEventListener('click', () => navigate(btn.dataset.nav)));

$('menuToggle').addEventListener('click', () => {
  $('sidebar').classList.add('open');
  $('sidebarBackdrop').hidden = false;
});
$('sidebarBackdrop').addEventListener('click', closeSidebar);

/* ---------- Modal Đăng nhập / Đăng ký ---------- */
const overlay = $('overlay');
const panels = { login: $('panel-login'), register: $('panel-register') };
let lastFocus = null;

function showPanel(name) {
  Object.entries(panels).forEach(([key, el]) => { el.hidden = key !== name; });
  $('loginError').textContent = '';
  $('regError').textContent = '';
}

function openModal(name) {
  lastFocus = document.activeElement;
  showPanel(name);
  $('loginNotice').textContent = '';
  overlay.hidden = false;
  document.body.style.overflow = 'hidden';
  panels[name].querySelector('input').focus();
}

function closeModal() {
  overlay.hidden = true;
  document.body.style.overflow = '';
  if (lastFocus) lastFocus.focus();
}

document.querySelectorAll('[data-open]').forEach(btn =>
  btn.addEventListener('click', () => openModal(btn.dataset.open)));
document.querySelectorAll('[data-switch]').forEach(btn =>
  btn.addEventListener('click', () => { showPanel(btn.dataset.switch); $('loginNotice').textContent = ''; }));

$('closeBtn').addEventListener('click', closeModal);
overlay.addEventListener('mousedown', e => { if (e.target === overlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !overlay.hidden) closeModal(); });

document.querySelectorAll('.chip').forEach(chip =>
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
    $('loginEmail').value = chip.dataset.email;
    $('loginPassword').value = chip.dataset.pass;
  }));

function setBusy(form, busy) {
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = busy;
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

  if (!fullName || !studentId || !email || !password) { err.textContent = 'Vui lòng nhập đầy đủ thông tin.'; return; }
  if (password.length < 6) { err.textContent = 'Mật khẩu cần có ít nhất 6 ký tự.'; return; }
  if (password !== confirm) { err.textContent = 'Mật khẩu nhập lại chưa khớp.'; return; }

  err.textContent = '';
  setBusy(form, true);
  // Email trùng sẽ được API trả lỗi qua `message`
  const res = await request(ENDPOINTS.register, {
    method: 'POST',
    body: JSON.stringify({ fullName, studentId, email, password, role: 'READER' }),
  });
  setBusy(form, false);

  if (!res.ok) { err.textContent = res.message; return; }

  form.reset();
  showPanel('login');
  $('loginEmail').value = email;
  $('loginNotice').textContent = 'Đăng ký thành công! Hãy đăng nhập để tiếp tục.';
});

/* ---------- AUTH-02: Đăng nhập ---------- */
$('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.currentTarget;
  const err = $('loginError');

  const email = $('loginEmail').value.trim();
  const password = $('loginPassword').value;
  if (!email || !password) { err.textContent = 'Vui lòng nhập email và mật khẩu.'; return; }

  err.textContent = '';
  $('loginNotice').textContent = '';
  setBusy(form, true);
  const res = await request(ENDPOINTS.login, { method: 'POST', body: JSON.stringify({ email, password }) });
  setBusy(form, false);

  if (!res.ok) { err.textContent = res.message; return; }

  // Chấp nhận các dạng phản hồi phổ biến: {token, user} hoặc {data: {token, user}}
  const d = res.data.data && typeof res.data.data === 'object' ? res.data.data : res.data;
  const token = d.token || d.accessToken || d.jwt;
  if (!token) { err.textContent = 'Phản hồi đăng nhập không có token.'; return; }

  const payload = decodeJwt(token) || {};
  const user = d.user || {
    fullName: d.fullName || payload.fullName || payload.name,
    email: d.email || payload.email || payload.sub || email,
    role: d.role || payload.role || payload.roles,
  };
  user.role = normalizeRole(user.role);

  if (isLocked(user)) { err.textContent = 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ thư viện.'; return; }

  localStorage.setItem(STORAGE_TOKEN, token);
  localStorage.setItem(STORAGE_USER, JSON.stringify(user));
  form.reset();
  closeModal();
  showApp(user);
});

/* =====================================================
   BOOK-01 / BOOK-02 — Tra cứu sách (phân trang, tìm kiếm)
   Cách làm: lấy toàn bộ sách từ API, rồi lọc + chia 10 sách/trang ở trình duyệt
   để tìm kiếm không phân biệt hoa thường và dấu tiếng Việt.
   ===================================================== */
const books = { all: null, keyword: '', page: 1, loading: false, error: '', token: 0 };

// Màu bìa sách (cặp màu gradient), chọn theo thể loại
const COVER_COLORS = [
  ['#3f7f86', '#17525d'], ['#8a4a5e', '#6e2a40'], ['#4a5c9a', '#2d4284'], ['#8f6a1f', '#7a520f'],
  ['#5d8147', '#3f6030'], ['#7a5a98', '#573a78'], ['#a85a3e', '#8a3a20'], ['#4b7088', '#245068'],
];

/* Bỏ dấu tiếng Việt + chữ thường: "Văn Học" -> "van hoc" */
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

/* Chuẩn hóa 1 cuốn sách từ API. Nếu backend dùng tên trường khác, thêm vào các danh sách bên dưới. */
function normalizeBook(raw) {
  const category = pickFirst(raw, ['category', 'categoryName', 'genre']);
  const author = pickFirst(raw, ['author', 'authorName', 'authors']);
  const copies = pickFirst(raw, ['availableCopies', 'availableQuantity', 'available', 'remainingCopies', 'remaining', 'copiesAvailable', 'quantity']);
  const book = {
    id: pickFirst(raw, ['id', '_id', 'bookId']),
    title: String(pickFirst(raw, ['title', 'name', 'bookName']) || 'Chưa có tên'),
    author: Array.isArray(author) ? author.map(a => a.name || a).join(', ') : String((author && author.name) || author || ''),
    category: String((category && category.name) || category || ''),
    copies: copies !== undefined && Number.isFinite(Number(copies)) ? Number(copies) : null,
  };
  book.search = normalizeText([book.title, book.author, book.category].join(' '));
  return book;
}

/* Đọc phản hồi danh sách: hỗ trợ mảng thuần, {data:[...]}, {content:[...], totalPages}, {items:[...], total}... */
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

/* Lấy toàn bộ sách từ API (gọi lần lượt các trang nếu API có phân trang) */
async function fetchAllBooks() {
  let start = BOOKS_CONFIG.firstPage;
  let first = await fetchBooksPage(start);
  // API đánh số từ 0 nhưng mình gọi từ 1 -> gọi lại từ trang 0 để không bỏ sót
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
  if (books.loading || (books.all && !force)) return;
  const id = ++books.token;
  books.loading = true;
  books.error = '';
  renderBooks();
  try {
    const all = await fetchAllBooks();
    if (id !== books.token) return; // đã đăng xuất hoặc có lần tải mới hơn
    books.all = all;
  } catch (err) {
    if (id !== books.token) return;
    books.all = null;
    books.error = err.message || 'Không thể tải danh sách sách.';
  }
  books.loading = false;
  renderBooks();
}

function resetBooks() {
  books.token++;
  Object.assign(books, { all: null, keyword: '', page: 1, loading: false, error: '' });
  $('searchInput').value = '';
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
  if (!tokens.length) return books.all;
  return books.all.filter(b => tokens.every(t => b.search.includes(t)));
}

function bookCard(b) {
  const seed = [...(b.category || b.title)].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const [c1, c2] = COVER_COLORS[seed % COVER_COLORS.length];

  const cover = el('div', 'book-cover');
  cover.style.background = `linear-gradient(135deg, ${c1}, ${c2})`;
  cover.append(el('span', 'book-cat', b.category), el('h3', 'book-title', b.title), el('span', 'book-author', b.author));

  const foot = el('div', 'book-foot');
  if (b.copies > 0) foot.append(el('span', 'pill', 'Còn ' + b.copies + ' bản'));
  else if (b.copies === 0) foot.append(el('span', 'pill pill-out', 'Hết sách'));

  const card = el('article', 'book-card');
  card.append(cover, foot);
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
    list.append(stateBox('Không tìm thấy sách phù hợp với “' + books.keyword.trim() + '”.'));
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

/* Đảm bảo giao diện Tra cứu sách có đủ phần tử và CSS.
   Nhờ vậy file script.js này chạy được kể cả khi index.html / style.css là bản cũ. */
function ensureBookUI() {
  const search = $('searchForm');
  const list = $('bookList');
  $('searchInput').placeholder = 'Tìm theo tên, tác giả hoặc thể loại';
  if (!$('resultInfo')) {
    const p = el('p', 'result-info');
    p.id = 'resultInfo';
    p.setAttribute('aria-live', 'polite');
    search.after(p);
  }
  if (!$('pagination')) {
    const nav = el('nav', 'pagination');
    nav.id = 'pagination';
    nav.setAttribute('aria-label', 'Phân trang');
    list.after(nav);
  }
  if (!document.getElementById('ptit-books-style')) {
    const style = document.createElement('style');
    style.id = 'ptit-books-style';
    style.textContent = `
#bookList { margin-top: 0; }
.result-info { min-height: 20px; margin-bottom: 14px; font-size: 13px; color: var(--muted); }

.book-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--radius);
}
.book-cover {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 190px;
  padding: 14px;
  color: var(--white);
  background-blend-mode: overlay;
  position: relative;
}
.book-cover::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(90deg, rgba(255, 255, 255, .06) 0 2px, transparent 2px 6px);
}
.book-cover > * { position: relative; z-index: 1; }
.book-cat { font-size: 13px; opacity: .85; }
.book-title { align-self: center; font-size: 17px; font-weight: 800; line-height: 1.3; overflow-wrap: anywhere; }
.book-author { font-size: 13px; opacity: .85; }

.book-foot { display: flex; align-items: center; min-height: 48px; padding: 10px 12px; }
.pill {
  padding: 3px 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--green-dark);
  border: 1px solid var(--green);
  border-radius: 999px;
}
.pill-out { color: var(--danger); border-color: var(--danger); }

.empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; }
.empty.error { color: var(--danger); border-color: var(--danger); }
.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--green-soft);
  border-top-color: var(--green);
  border-radius: 50%;
  animation: spin .8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.pagination { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 6px; margin-top: 26px; }
.page-btn {
  min-width: 38px;
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 600;
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: 8px;
}
.page-btn:hover:not(:disabled) { background: var(--green-soft); }
.page-btn.active { color: var(--white); background: var(--green); border-color: var(--green); }
.page-btn:disabled { opacity: .45; cursor: not-allowed; }
.page-gap { padding: 0 4px; color: var(--muted); }

@media (prefers-reduced-motion: reduce) { .spinner { animation-duration: 2s; } }
`;
    document.head.append(style);
  }
}

ensureBookUI();

/* ---------- Tìm kiếm (BOOK-02) ---------- */
function applySearch(value) {
  books.keyword = value;
  books.page = 1; // đổi từ khóa -> về trang 1
  renderBooks();
}

let searchTimer = null;
$('searchInput').addEventListener('input', e => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => applySearch(e.target.value), 250);
});
$('searchForm').addEventListener('submit', e => {
  e.preventDefault();
  clearTimeout(searchTimer);
  applySearch($('searchInput').value);
});

/* ---------- AUTH-03: Đăng xuất ---------- */
function logout() {
  localStorage.removeItem(STORAGE_TOKEN);
  localStorage.removeItem(STORAGE_USER);
  resetBooks();
  closeSidebar();
  showPublic();
}
$('logoutBtn').addEventListener('click', logout);

/* ---------- Khởi động: giữ đăng nhập nếu token còn hạn ---------- */
(function init() {
  const token = getToken();
  const user = getUser();
  if (token && user && !isTokenExpired(token)) showApp(user);
  else if (token || user) logout();
})();
