/* =====================================================
   BẢN DEMO — chạy không cần backend
   DA-06: giữ giao diện DA-05 và LOAN-01, bổ sung LOAN-02 / LOAN-06.
   Đăng ký, Đăng nhập, danh sách sách và phiếu mượn dùng dữ liệu demo.
   Phiếu mượn lưu trong trình duyệt; chưa tích hợp API mượn thật.
   ===================================================== */
const API_BASE_URL = 'http://localhost:8080/api';
const ENDPOINTS = {
  register: '/auth/register',
  login: '/auth/login',
  books: '/books',
  loans: '/loans', // Service demo dùng chung cho đăng ký và hủy phiếu.
  myLoans: '/loans/my-loans',
};

// Cách lấy danh sách sách từ API (chỉnh cho khớp backend)
const BOOKS_CONFIG = {
  pageParam: 'page',  // tên tham số số trang
  sizeParam: 'size',  // tên tham số số phần tử mỗi trang
  firstPage: 1,       // trang đầu tiên đánh số từ 1 hay 0 (Spring: 0)
  fetchSize: 100,     // số sách lấy về mỗi lần gọi API
};
const PAGE_SIZE = 8; // số sách hiển thị trên mỗi trang

// true = DEMO: Đăng ký, Đăng nhập, danh sách sách và mượn sách không cần backend.
// false = giữ luồng API cũ của DA-04; chức năng mượn báo chưa tích hợp.
const USE_MOCK_API = true;

const STORAGE_TOKEN = 'ptit_token';
const STORAGE_USER = 'ptit_user';

const ROLE_LABELS = { READER: 'Độc giả', LIBRARIAN: 'Thủ thư', ADMIN: 'Quản trị viên' };
const PAGE_TITLES = { overview: 'Tổng quan', search: 'Tra cứu sách', mybooks: 'Sách của tôi', readers: 'Độc giả' };

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
    syncLibrarianCatalog();
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
  if (path === ENDPOINTS.myLoans) return mockGetMyLoans(options);
  const cancelMatch = path.match(/^\/loans\/([^/]+)\/cancel$/);
  if (cancelMatch) return mockCancelLoan(decodeURIComponent(cancelMatch[1]), options);

  if (path === '/readers' || path.startsWith('/readers/')) return mockReadersRequest(path, query, options);
  if (path === '/librarian' || path.startsWith('/librarian/')) return mockLibrarianRequest(path, options, body);
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
      return { ok: false, status: res.status, data, message: data.message || (typeof data.detail === 'string' ? data.detail : '') || 'Đã có lỗi xảy ra. Vui lòng thử lại.' };
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
    // Chỉ kết thúc đúng phiên gửi request; không đăng xuất phiên mới vì response cũ.
    if (r.status === 401 && getToken() === token) {
      logout();
      openModal('login');
      $('loginNotice').textContent = r.message || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    }
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
  resetReaders();
  resetLibrarian();
  prepareLibrarianDemo(user);
  prepareReaderDemo(user);
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
  const librarian = canViewReaders();
  configureLibrarianMenu(librarian);
  navigate(librarian ? 'staffOverview' : 'overview');
}

/* ---------- Điều hướng trong giao diện Độc giả ---------- */
function closeSidebar() {
  $('sidebar').classList.remove('open');
  $('sidebarBackdrop').hidden = true;
}

function navigate(page) {
  if (!Object.hasOwn(PAGE_TITLES, page)) page = 'overview';
  if (LIBRARIAN_PAGES.includes(page) && !canViewReaders()) {
    resetReaders(); showToast('Chỉ thủ thư được xem danh sách và lịch sử độc giả.'); page = 'overview';
  }
  if (page !== 'readers') resetReaders();
  Object.keys(PAGE_TITLES).forEach(key => { $('page-' + key).hidden = key !== page; });
  document.querySelectorAll('.menu-item').forEach(b =>
    b.classList.toggle('active', b.dataset.nav === page));
  $('topbarTitle').textContent = PAGE_TITLES[page];
  closeSidebar();
  window.scrollTo(0, 0);
  if (page === 'search') loadBooks();
  if (page === 'mybooks') renderMyLoans();
  if (page === 'overview') renderOverview();
  if (page === 'readers') loadReaders();
  if (LIBRARIAN_PAGES.includes(page) && page !== 'readers') renderLibrarian(page);
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
const books = { all: null, filter: 'all', keyword: '', page: 1, loading: false, error: '', token: 0 };

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
  Object.assign(books, { all: null, filter: 'all', keyword: '', page: 1, loading: false, error: '' });
  $('searchInput').value = '';
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
  return books.all.filter(book =>
    (books.filter === 'all' || (books.filter === 'favorites' ? favorites.includes(book.id) : book.category === books.filter)) &&
    tokens.every(token => book.search.includes(token)));
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

function bookCover(b) {
  const [c1, c2] = COVER_COLORS[(Number(b.id) - 1) % COVER_COLORS.length] || COVER_COLORS[0];

  const cover = el('div', 'book-cover');
  cover.style.background = `linear-gradient(135deg, ${c1}, ${c2})`;
  cover.append(el('span', 'book-cat', b.category), el('h3', 'book-title', b.title), el('span', 'book-author', b.author));
  return cover;
}

/* =====================================================
   DA-05 / LOAN-01 — service demo, không gọi API mượn thật.
   Quy tắc lấy từ SRS v1.2: BR01 tối đa 3 phiếu hoạt động,
   BR02 không trùng sách, BR03 không có sách quá hạn chưa trả.
   ===================================================== */
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

function dateInVietnam(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const part = type => parts.find(item => item.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function isLoanOverdue(loan) {
  return loan.status === 'OVERDUE' || (loan.status === 'BORROWING' && !loan.returnDate &&
    Boolean(loan.dueDate) && loan.dueDate < dateInVietnam());
}

// DA-06: kiểm tra quyền trong service, kể cả khi gọi trực tiếp ngoài giao diện.
function demoLoanOwner(options) {
  const token = String(options.headers && options.headers.Authorization || '').replace(/^Bearer /, '');
  return token === getToken() && hasLoanSession() ? userEmail() : null;
}

function mockGetMyLoans(options) {
  const owner = demoLoanOwner(options);
  if (!owner) return mockReply(401, { message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });
  if ((options.method || 'GET') !== 'GET') return mockReply(405, { message: 'Thao tác không được hỗ trợ.' });
  return mockReply(200, readDemoLoans().filter(loan => loan.userEmail === owner));
}

function mockCancelLoan(id, options) {
  return withDemoLoanLock(() => {
    const owner = demoLoanOwner(options);
    if (!owner) return mockReply(401, { message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });
    if (options.method !== 'PATCH') return mockReply(405, { message: 'Thao tác không được hỗ trợ.' });
    const loans = readDemoLoans();
    const index = loans.findIndex(loan => String(loan.id) === id && loan.userEmail === owner);
    if (index < 0) return mockReply(404, { message: 'Không tìm thấy phiếu mượn của bạn.' });
    if (loans[index].status !== 'PENDING') {
      return mockReply(409, { message: 'Chỉ có thể hủy phiếu đang chờ duyệt (PENDING). Vui lòng kiểm tra lại trạng thái.' });
    }
    const cancelled = { ...loans[index], status: 'CANCELLED', cancelledAt: new Date().toISOString() };
    loans[index] = cancelled;
    // DA-05 chưa trừ bản sách khi đăng ký, vì vậy hủy PENDING không cộng lại bản sách.
    localStorage.setItem(DEMO_LOANS_KEY, JSON.stringify(loans));
    return mockReply(200, cancelled);
  });
}

function withDemoLoanLock(action) {
  // Các tab cùng trình duyệt kiểm tra quy tắc và lưu lần lượt.
  return navigator.locks ? navigator.locks.request(DEMO_LOANS_KEY, action) : Promise.resolve().then(action);
}

function mockCreateLoan(body, options) {
  return withDemoLoanLock(() => {
    syncLibrarianCatalog();
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
    // BR05: không giảm số bản khi mới đăng ký; chỉ giảm khi thủ thư duyệt.
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
  $('bookDialog').showModal();
  document.body.style.overflow = 'hidden';
  $('bookDetailTitle').focus();
}

function closeBookDetail(force = false) {
  if (loanState.busy && !force) return;
  loanState.version++;
  loanState.book = null;
  setLoanBusy(false);
  if ($('bookDialog').open) $('bookDialog').close();
  document.body.style.overflow = '';
  if (loanState.lastFocus && loanState.lastFocus.isConnected) loanState.lastFocus.focus();
  loanState.lastFocus = null;
}

function requireLoanLogin() {
  if (hasLoanSession()) return true;
  closeBookDetail(true);
  logout();
  openModal('login');
  $('loginNotice').textContent = 'Vui lòng đăng nhập để xem và quản lý phiếu mượn.';
  return false;
}

function hasLoanSession() {
  const token = getToken();
  const claims = token && decodeJwt(token);
  return Boolean(claims && Number.isFinite(claims.exp) && claims.exp * 1000 > Date.now() && userEmail() &&
    (!USE_MOCK_API || String(claims.email || claims.sub).toLowerCase() === userEmail()));
}

function showLoanError(message, code = '') {
  $('loanError').textContent = (code ? code + ' — ' : '') + message;
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
  if (!USE_MOCK_API) {
    showLoanError('Chức năng mượn sách hiện chỉ hỗ trợ chế độ demo. Chưa kết nối API mượn thật.');
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
    $('loanSuccess').textContent = `Đăng ký mượn thành công! “${loanState.book.title}” · ${days} ngày. Trạng thái: PENDING — Chờ duyệt. Phiếu demo đã được lưu trong trình duyệt.`;
    $('loanSuccess').focus();
    myLoansPage = 1;
    renderMyLoans();
    renderOverview();
  } catch {
    showLoanError('Không thể hoàn tất đăng ký mượn. Vui lòng kiểm tra Sách của tôi trước khi thử lại.');
  } finally {
    if (version === loanState.version) setLoanBusy(false);
  }
});

['closeBookDialog', 'cancelBookDetail', 'finishLoan'].forEach(id => {
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

// Dành cho kiểm thử qua Console; không thêm điều khiển vào giao diện DA-04.
// Chỉ thay phiếu demo của tài khoản đang đăng nhập.
if (USE_MOCK_API) {
  window.PTIT.demo = {
    async loadScenario(scenario) {
      if (!['ready', 'limit', 'duplicate', 'overdue'].includes(scenario)) {
        throw new Error('Kịch bản hợp lệ: ready, limit, duplicate, overdue.');
      }
      if (!hasLoanSession()) throw new Error('Vui lòng đăng nhập trước khi nạp kịch bản.');
      if (loanState.busy) throw new Error('Vui lòng chờ gửi yêu cầu xong.');
      const token = getToken();
      const email = userEmail();
      await withDemoLoanLock(() => {
        if (getToken() !== token || !hasLoanSession()) throw new Error('Phiên đăng nhập đã thay đổi.');
        const others = readDemoLoans().filter(loan => loan.userEmail !== email);
        const ids = scenario === 'limit' ? [1, 2, 3] : scenario === 'duplicate' ? [1] : scenario === 'overdue' ? [2] : [];
        const seed = ids.map(id => ({
          id: 'DEMO-' + crypto.randomUUID(), userEmail: email, bookId: id,
          bookTitle: MOCK_BOOKS.find(book => book.id === id).title, days: 14,
          status: scenario === 'overdue' ? 'BORROWING' : 'PENDING',
          createdAt: new Date().toISOString(), returnDate: null,
          dueDate: scenario === 'overdue' ? dateInVietnam(new Date(Date.now() - 86400000)) : null,
        }));
        localStorage.setItem(DEMO_LOANS_KEY, JSON.stringify([...others, ...seed]));
      });
      myLoansPage = 1;
      renderMyLoans();
      renderOverview();
      return 'Đã nạp kịch bản ' + scenario + '. Chọn Dế Mèn phiêu lưu ký để thử mượn.';
    },
  };
}

/* ---------- AUTH-03: Đăng xuất ---------- */
function logout() {
  resetReaders();
  resetLibrarian();
  resetMyLoans();
  closeCancelLoan(true);
  closeReview();
  if ($('utilityDialog').open) $('utilityDialog').close();
  $('appToast').hidden = true;
  closeBookDetail(true);
  localStorage.removeItem(STORAGE_TOKEN);
  localStorage.removeItem(STORAGE_USER);
  resetBooks();
  closeSidebar();
  showPublic();
}
$('logoutBtn').addEventListener('click', logout);

/* ---------- Giao diện độc giả theo ảnh tham chiếu ---------- */
const READER_DEMO_EMAIL = 'docgia@ptit.edu.vn';
const FAVORITES_KEY = 'ptit_reader_favorites_v1';
const REVIEWS_KEY = 'ptit_reader_reviews_v1';
const SEED_KEY = 'ptit_reader_demo_seed_v1';
const SAMPLE_REVIEWS = [
  { bookId: 1, stars: 5, comment: 'Tuổi thơ ùa về, bản in sạch đẹp.', date: '2026-10-13' },
  { bookId: 3, stars: 5, comment: 'Một hành trình nhiều cảm hứng, rất đáng đọc.', date: '2026-10-15' },
  { bookId: 4, stars: 4, comment: 'Nhiều ví dụ hữu ích cho việc viết mã dễ đọc.', date: '2026-10-17' },
  { bookId: 5, stars: 4, comment: 'Nội dung rõ ràng, phù hợp để ôn tập.', date: '2026-10-19' },
].map(review => ({ ...review, userEmail: READER_DEMO_EMAIL, name: 'Nguyễn Hoàng An' }));
let myLoansPage = 1;
let reviewBook = null;
let reviewReturnFocus = null;
let toastTimer;

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
  // Chỉ đổi tên mặc định cũ, giữ nguyên thông tin tự nhập của các tài khoản khác.
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
      // Phiếu đang mượn có hạn trả tương đối để bản demo không tự thành quá hạn.
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
function myLoans() { return readDemoLoans().filter(loan => loan.userEmail === userEmail()); }
function totalFines(loans) { return loans.reduce((total, loan) => total + (Number(loan.fine) || 0), 0); }
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
  document.querySelectorAll('[data-filter]').forEach(button => {
    const selected = button.dataset.filter === books.filter;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}
document.querySelectorAll('[data-filter]').forEach(button => {
  button.addEventListener('click', () => {
    clearTimeout(searchTimer);
    books.keyword = $('searchInput').value;
    books.filter = button.dataset.filter;
    books.page = 1;
    updateFilterButtons();
    renderBooks();
  });
});

function getReviews(bookId) {
  let saved = [];
  try { saved = readStoredObject(REVIEWS_KEY, []); } catch { /* vẫn hiển thị mẫu */ }
  if (!Array.isArray(saved)) saved = [];
  const base = USE_MOCK_API ? SAMPLE_REVIEWS : [];
  return [...base.filter(review => !saved.some(item => item.bookId === review.bookId && item.userEmail === review.userEmail)), ...saved]
    .filter(review => review.bookId === bookId);
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
  const labels = { PENDING: 'Chờ duyệt', BORROWING: 'Đang mượn', OVERDUE: 'Quá hạn', RETURNED: 'Đã trả', CANCELLED: 'Đã hủy', REJECTED: 'Từ chối' };
  const status = isLoanOverdue(loan) ? 'OVERDUE' : loan.status;
  const badge = el('span', 'pill status-' + status.toLowerCase(), labels[status] || status);
  badge.title = loan.status;
  badge.setAttribute('aria-label', loan.status + ' — ' + badge.textContent);
  if (isLoanOverdue(loan)) badge.classList.add('pill-out');
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
  $('libraryName').textContent = user.fullName || user.name || user.email;
  $('libraryAvatar').textContent = initials(user.fullName || user.email);
  $('libraryStudentId').textContent = user.studentId || user.studentCode || 'Chưa cập nhật';
  renderPopularBooks();
  const holder = $('currentLoans');
  holder.replaceChildren();
  try {
    const loans = myLoans();
    const borrowing = loans.filter(loan => loan.status === 'BORROWING');
    const pending = loans.filter(loan => loan.status === 'PENDING');
    $('statBorrowing').textContent = borrowing.length;
    $('statPending').textContent = pending.length;
    $('statFines').textContent = money(totalFines(loans));
    $('statRemaining').textContent = Math.max(0, 3 - borrowing.length - pending.length);
    if (!borrowing.length) { holder.append(el('p', 'table-empty', 'Bạn chưa có sách đang mượn.')); return; }
    const { wrap, body } = makeTable(['Độc giả', 'Sách', 'Hạn trả', 'Trạng thái'], 'Sách đang mượn');
    borrowing.forEach(loan => {
      const row = el('tr');
      const status = el('td');
      status.append(statusBadge(loan));
      row.append(el('td', '', user.fullName || user.email), el('td', '', loan.bookTitle), el('td', '', displayDate(loan.dueDate)), status);
      body.append(row);
    });
    holder.append(wrap);
  } catch {
    ['statBorrowing', 'statPending', 'statFines', 'statRemaining'].forEach(id => { $(id).textContent = '—'; });
    holder.append(el('p', 'error', 'Không thể đọc phiếu mượn đã lưu.'));
  }
}

const myLoansState = { items: [], token: null, version: 0, focusId: null };

function resetMyLoans() {
  myLoansState.version++;
  myLoansState.items = [];
  myLoansState.token = null;
  myLoansState.focusId = null;
  myLoansPage = 1;
  $('myLoanList').replaceChildren();
  $('myLoanList').setAttribute('aria-busy', 'false');
  $('myFines').textContent = 'Tổng tiền phạt: —';
}

async function renderMyLoans() {
  const list = $('myLoanList');
  if (!requireLoanLogin()) return;
  const token = getToken();
  const version = ++myLoansState.version;
  myLoansState.items = [];
  myLoansState.token = token;
  list.replaceChildren();
  list.setAttribute('aria-busy', 'true');
  $('myFines').textContent = 'Tổng tiền phạt: —';
  const loading = el('p', 'table-empty', 'Đang tải phiếu mượn…');
  loading.setAttribute('role', 'status');
  list.append(loading);
  try {
    const result = await authRequest(ENDPOINTS.myLoans);
    if (version !== myLoansState.version) return;
    if (getToken() !== token) { resetMyLoans(); requireLoanLogin(); return; }
    if (!result.ok) throw new Error(result.message);
    if (!Array.isArray(result.data)) throw new Error('Danh sách phiếu mượn không hợp lệ.');
    myLoansState.items = result.data;
    renderMyLoansTable();
  } catch (error) {
    if (version !== myLoansState.version || getToken() !== token) return;
    list.replaceChildren();
    const message = el('p', 'error', error.message || 'Không thể tải phiếu mượn. Vui lòng thử lại.');
    message.setAttribute('role', 'alert');
    const retry = el('button', 'btn btn-outline', 'Thử lại');
    retry.type = 'button';
    retry.addEventListener('click', renderMyLoans);
    list.append(message, retry);
  } finally {
    if (version === myLoansState.version) list.setAttribute('aria-busy', 'false');
  }
}

function renderMyLoansTable() {
  if (myLoansState.token !== getToken()) return;
  const list = $('myLoanList');
  list.replaceChildren();
  const mine = myLoansState.items;
  $('myFines').textContent = 'Tổng tiền phạt: ' + money(totalFines(mine));
  if (!mine.length) { list.append(el('p', 'table-empty', 'Bạn chưa có sách nào.')); return; }
  // Phiếu mới chờ duyệt đứng đầu; lịch sử mẫu giữ thứ tự như ảnh.
  const ordered = [...mine.filter(loan => loan.status === 'PENDING').reverse(), ...mine.filter(loan => loan.status !== 'PENDING')];
  if (myLoansState.focusId !== null) {
    const index = ordered.findIndex(loan => loan.id === myLoansState.focusId);
    if (index >= 0) myLoansPage = Math.floor(index / 8) + 1;
    myLoansState.focusId = null;
  }
  const pages = Math.ceil(ordered.length / 8);
  myLoansPage = Math.min(Math.max(1, myLoansPage), pages);
  const { wrap, body } = makeTable(['Sách', 'Đăng ký', 'Hạn trả', 'Trạng thái', 'Phạt', ''], 'Danh sách phiếu mượn');
  ordered.slice((myLoansPage - 1) * 8, myLoansPage * 8).forEach(loan => {
    const row = el('tr');
    row.dataset.loanId = loan.id;
    const title = el('td', '', loan.bookTitle);
    if (loan.status === 'PENDING') title.append(el('small', 'loan-duration', loan.days + ' ngày'));
    const status = el('td');
    status.append(statusBadge(loan));
    const action = el('td');
    if (loan.status === 'PENDING') {
      const cancel = el('button', 'btn btn-outline table-action cancel-loan', 'Hủy phiếu');
      cancel.type = 'button';
      cancel.setAttribute('aria-label', 'Hủy phiếu mượn ' + loan.bookTitle);
      cancel.addEventListener('click', () => openCancelLoan(loan, cancel));
      action.append(cancel);
    }
    if (loan.status === 'RETURNED' && findBook(loan.bookId)) {
      const review = el('button', 'btn btn-outline table-action', 'Đánh giá');
      review.type = 'button';
      review.addEventListener('click', () => openReview(findBook(loan.bookId)));
      action.append(review);
    }
    row.append(title, el('td', '', displayDate(loan.createdAt)), el('td', '', loan.status === 'PENDING' ? 'Sau khi duyệt' : displayDate(loan.dueDate)), status, el('td', '', loan.fine ? money(loan.fine) : '–'), action);
    body.append(row);
  });
  list.append(wrap);
  const pager = el('nav', 'pagination loan-pagination');
  pager.setAttribute('aria-label', 'Phân trang phiếu mượn');
  const add = (label, target, disabled = false) => {
    const button = el('button', 'page-btn' + (Number(label) === myLoansPage ? ' active' : ''), label);
    button.type = 'button';
    button.disabled = disabled;
    if (Number(label) === myLoansPage) button.setAttribute('aria-current', 'page');
    button.addEventListener('click', () => { myLoansPage = target; renderMyLoansTable(); });
    pager.append(button);
  };
  add('‹ Trước', myLoansPage - 1, myLoansPage === 1);
  pageNumbers(myLoansPage, pages).forEach(number => number === '…' ? pager.append(el('span', 'page-gap', number)) : add(String(number), number));
  add('Sau ›', myLoansPage + 1, myLoansPage === pages);
  pager.append(el('span', 'pagination-count', mine.length + ' mục'));
  list.append(pager);
}

const cancelLoanState = { loan: null, token: null, busy: false, version: 0, lastFocus: null };

function setCancelLoanBusy(busy) {
  cancelLoanState.busy = busy;
  $('cancelLoanForm').setAttribute('aria-busy', String(busy));
  $('keepLoanButton').disabled = busy;
  $('confirmCancelLoan').disabled = busy;
  $('confirmCancelLoan').textContent = busy ? 'Đang hủy…' : 'Xác nhận hủy';
}

function openCancelLoan(loan, trigger) {
  if (!requireLoanLogin() || loan.status !== 'PENDING' || myLoansState.token !== getToken()) return;
  cancelLoanState.loan = loan;
  cancelLoanState.token = getToken();
  cancelLoanState.lastFocus = trigger;
  cancelLoanState.version++;
  $('cancelLoanBook').textContent = loan.bookTitle;
  $('cancelLoanError').textContent = '';
  setCancelLoanBusy(false);
  $('cancelLoanDialog').showModal();
  document.body.style.overflow = 'hidden';
  $('keepLoanButton').focus();
}

function closeCancelLoan(force = false) {
  if (cancelLoanState.busy && !force) return;
  cancelLoanState.version++;
  cancelLoanState.loan = null;
  cancelLoanState.token = null;
  setCancelLoanBusy(false);
  if ($('cancelLoanDialog').open) {
    $('cancelLoanDialog').close();
    document.body.style.overflow = '';
    if (cancelLoanState.lastFocus?.isConnected) cancelLoanState.lastFocus.focus();
  }
  cancelLoanState.lastFocus = null;
}

$('keepLoanButton').addEventListener('click', () => closeCancelLoan());
$('cancelLoanDialog').addEventListener('cancel', event => {
  event.preventDefault();
  closeCancelLoan();
});
$('cancelLoanForm').addEventListener('submit', async event => {
  event.preventDefault();
  if (cancelLoanState.busy || !cancelLoanState.loan) return;
  if (!requireLoanLogin()) return;
  if (cancelLoanState.token !== getToken()) { closeCancelLoan(true); renderMyLoans(); return; }
  const { loan, token, version } = cancelLoanState;
  setCancelLoanBusy(true);
  $('cancelLoanError').textContent = '';
  try {
    const result = await authRequest(ENDPOINTS.loans + '/' + encodeURIComponent(loan.id) + '/cancel', { method: 'PATCH' });
    if (version !== cancelLoanState.version) return;
    if (token !== getToken()) {
      closeCancelLoan(true);
      resetMyLoans();
      if (requireLoanLogin()) renderMyLoans();
      return;
    }
    if (!result.ok) {
      $('cancelLoanError').textContent = result.message || 'Không thể hủy phiếu. Vui lòng thử lại.';
      if (result.status === 404 || result.status === 409) await renderMyLoans();
      return;
    }
    if (result.data.status !== 'CANCELLED') throw new Error('Chưa xác nhận được việc hủy phiếu. Vui lòng tải lại danh sách.');
    closeCancelLoan(true);
    showToast('Hủy phiếu thành công. Trạng thái: CANCELLED — Đã hủy.');
    myLoansState.focusId = loan.id;
    await renderMyLoans();
    if (token !== getToken()) return;
    renderOverview();
    const heading = $('page-mybooks').querySelector('h1');
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  } catch (error) {
    if (version === cancelLoanState.version && token === getToken()) {
      $('cancelLoanError').textContent = error.message || 'Không thể hủy phiếu. Vui lòng thử lại.';
    }
  } finally {
    if (version === cancelLoanState.version) setCancelLoanBusy(false);
  }
});

// Làm mới khi phiếu thay đổi ở tab khác; bỏ kết quả cũ khi đổi phiên đăng nhập.
window.addEventListener('storage', event => {
  if ([STORAGE_TOKEN, STORAGE_USER].includes(event.key) || event.key === null) {
    resetMyLoans();
    closeCancelLoan(true);
    closeBookDetail(true);
    closeReview();
    if ($('utilityDialog').open) $('utilityDialog').close();
    resetBooks();
    if (hasLoanSession()) showApp(getUser());
    else showPublic();
  } else if (event.key === DEMO_LOANS_KEY && hasLoanSession()) {
    if (!$('page-mybooks').hidden) renderMyLoans();
    renderOverview();
  }
});

function renderBookDetails(book) {
  const meta = $('bookDetailMeta');
  meta.replaceChildren();
  const line = (label, value) => {
    const row = el('p');
    row.append(document.createTextNode(label), el('strong', '', value));
    meta.append(row);
  };
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
    const row = el('div', 'rating-bar-row');
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
  if (!reviews.length) list.append(el('p', 'muted', 'Chưa có đánh giá. Hãy chia sẻ cảm nhận của bạn.'));
  reviews.forEach(review => {
    const row = el('article', 'reader-review');
    const content = el('div', 'review-content');
    const heading = el('p', 'review-author');
    heading.append(el('strong', '', review.name), el('span', 'stars', '★'.repeat(review.stars) + '☆'.repeat(5 - review.stars)));
    content.append(heading, el('small', 'muted', displayDate(review.date)), el('p', 'review-comment', review.comment || 'Độc giả đã đánh giá ' + review.stars + ' sao.'));
    row.append(el('span', 'avatar', initials(review.name)), content);
    list.append(row);
  });
}

function openReview(book) {
  if (!requireLoanLogin()) return;
  reviewBook = book;
  reviewReturnFocus = document.activeElement;
  $('reviewTitle').textContent = 'Đánh giá: ' + book.title;
  const previous = getReviews(book.id).find(review => review.userEmail === userEmail());
  $('reviewStars').value = previous ? previous.stars : '5';
  $('reviewComment').value = previous ? previous.comment : '';
  $('reviewError').textContent = '';
  $('reviewDialog').showModal();
  document.body.style.overflow = 'hidden';
  $('reviewStars').focus();
}
function closeReview() {
  if (!$('reviewDialog').open) return;
  $('reviewDialog').close();
  reviewBook = null;
  document.body.style.overflow = $('bookDialog').open ? 'hidden' : '';
  if (reviewReturnFocus && reviewReturnFocus.isConnected) reviewReturnFocus.focus();
}
$('writeReviewButton').addEventListener('click', () => openReview(loanState.book));
$('cancelReview').addEventListener('click', closeReview);
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
    const review = { bookId: reviewBook.id, userEmail: userEmail(), name: getUser().fullName || getUser().email, stars, comment, date: dateInVietnam() };
    localStorage.setItem(REVIEWS_KEY, JSON.stringify([...saved.filter(item => !(item.bookId === review.bookId && item.userEmail === review.userEmail)), review]));
    closeReview();
    if (loanState.book) renderBookDetails(loanState.book);
    renderBooks();
    renderPopularBooks();
    showToast('Đã lưu đánh giá của bạn.');
  } catch { $('reviewError').textContent = 'Không thể lưu đánh giá. Vui lòng kiểm tra quyền lưu trữ rồi thử lại.'; }
});

function openUtility(title, render) {
  if (!requireLoanLogin()) return;
  $('utilityTitle').textContent = title;
  $('utilityContent').replaceChildren();
  render($('utilityContent'));
  $('utilityDialog').showModal();
  document.body.style.overflow = 'hidden';
}
$('closeUtility').addEventListener('click', () => $('utilityDialog').close());
$('utilityDialog').addEventListener('close', () => { document.body.style.overflow = ''; });
$('profileButton').addEventListener('click', () => openUtility('Hồ sơ độc giả', content => {
  const user = getUser();
  [['Họ và tên', user.fullName || user.name], ['Mã sinh viên', user.studentId || user.studentCode], ['Email', user.email], ['Vai trò', ROLE_LABELS[normalizeRole(user.role)]]].forEach(([label, value]) => {
    const row = el('p', 'profile-row');
    row.append(el('span', 'muted', label), el('strong', '', value || 'Chưa cập nhật'));
    content.append(row);
  });
}));
$('notificationsButton').addEventListener('click', () => openUtility('Thông báo', content => {
  try {
    const loans = myLoans();
    const pending = loans.filter(loan => loan.status === 'PENDING').length;
    content.append(el('p', 'notification-item', pending ? 'Bạn có ' + pending + ' yêu cầu mượn đang chờ duyệt.' : 'Bạn không có yêu cầu mượn đang chờ duyệt.'));
    loans.filter(loan => loan.status === 'BORROWING').forEach(loan => content.append(el('p', 'notification-item', loan.bookTitle + ' · ' + (isLoanOverdue(loan) ? 'Đã quá hạn trả: ' : 'Hạn trả: ') + displayDate(loan.dueDate))));
    content.append(el('p', 'muted', 'Dữ liệu demo được lưu trên trình duyệt này.'));
  } catch { content.append(el('p', 'error', 'Không thể đọc thông báo từ phiếu mượn.')); }
}));
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  $('themeButton').setAttribute('aria-pressed', String(theme === 'dark'));
}
try { applyTheme(localStorage.getItem('ptit_theme') === 'dark' ? 'dark' : 'light'); } catch { applyTheme('light'); }
$('themeButton').addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(theme);
  try { localStorage.setItem('ptit_theme', theme); } catch { showToast('Giao diện đã đổi, nhưng không thể lưu lựa chọn.'); }
});

/* ---------- Khởi động: giữ đăng nhập nếu token còn hạn ---------- */
window.addEventListener('DOMContentLoaded', () => {
  const token = getToken();
  const user = getUser();
  if (token && user && !isTokenExpired(token)) showApp(user);
  else if (token || user) logout();
});
