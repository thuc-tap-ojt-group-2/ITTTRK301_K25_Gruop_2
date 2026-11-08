const overlay = document.getElementById('overlay');
const panels = {
  login: document.getElementById('panel-login'),
  register: document.getElementById('panel-register'),
};
const regError = document.getElementById('regError');
let lastFocus = null;

function showPanel(name) {
  Object.entries(panels).forEach(([key, el]) => { el.hidden = key !== name; });
  regError.textContent = '';
}

function openModal(name) {
  lastFocus = document.activeElement;
  showPanel(name);
  overlay.hidden = false;
  document.body.style.overflow = 'hidden';
  panels[name].querySelector('input').focus();
}

function closeModal() {
  overlay.hidden = true;
  document.body.style.overflow = '';
  if (lastFocus) lastFocus.focus();
}

// Mở modal từ navbar
document.querySelectorAll('[data-open]').forEach(btn =>
  btn.addEventListener('click', () => openModal(btn.dataset.open))
);

// Chuyển đổi Đăng nhập <-> Đăng ký
document.querySelectorAll('[data-switch]').forEach(btn =>
  btn.addEventListener('click', () => showPanel(btn.dataset.switch))
);

// Đóng modal: nút X, click nền tối, phím Esc
document.getElementById('closeBtn').addEventListener('click', closeModal);
overlay.addEventListener('mousedown', e => { if (e.target === overlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !overlay.hidden) closeModal(); });

// Tài khoản thử nghiệm: tự điền Email và Mật khẩu
document.querySelectorAll('.chip').forEach(chip =>
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
    document.getElementById('loginEmail').value = chip.dataset.email;
    document.getElementById('loginPassword').value = chip.dataset.pass;
  })
);

// Kiểm tra form (chỉ giao diện, chưa kết nối máy chủ)
document.getElementById('loginForm').addEventListener('submit', e => {
  e.preventDefault();
});

document.getElementById('registerForm').addEventListener('submit', e => {
  e.preventDefault();
  const pass = document.getElementById('regPass').value;
  const pass2 = document.getElementById('regPass2').value;
  if (pass.length < 6) {
    regError.textContent = 'Mật khẩu cần có ít nhất 6 ký tự.';
  } else if (pass !== pass2) {
    regError.textContent = 'Mật khẩu nhập lại chưa khớp.';
  } else {
    regError.textContent = '';
  }
});