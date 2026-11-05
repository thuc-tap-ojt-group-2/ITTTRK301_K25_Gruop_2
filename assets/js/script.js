/* =====================================================
   CẤU HÌNH API — chỉnh lại cho khớp với backend của bạn
   ===================================================== */
const API_BASE_URL = 'http://localhost:8080/api';
const ENDPOINTS = {
  register: '/auth/register',
  login: '/auth/login',
};

// true  = chạy DEMO, dữ liệu giả lưu trong trình duyệt (không cần backend)
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

async function mockRequest(path, options) {
  await new Promise(r => setTimeout(r, 400)); // giả lập độ trễ mạng
  const body = options.body ? JSON.parse(options.body) : {};
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
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
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
  return request(path, {
    ...options,
    headers: { ...(options.headers || {}), Authorization: 'Bearer ' + getToken() },
  }).then(r => {
    if (r.status === 401) logout();
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
}

document.querySelectorAll('[data-nav]').forEach(btn =>
  btn.addEventListener('click', () => navigate(btn.dataset.nav)));

$('menuToggle').addEventListener('click', () => {
  $('sidebar').classList.add('open');
  $('sidebarBackdrop').hidden = false;
});
$('sidebarBackdrop').addEventListener('click', closeSidebar);

$('searchForm').addEventListener('submit', e => e.preventDefault()); // khung giao diện, chưa nối API

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

/* ---------- AUTH-03: Đăng xuất ---------- */
function logout() {
  localStorage.removeItem(STORAGE_TOKEN);
  localStorage.removeItem(STORAGE_USER);
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
