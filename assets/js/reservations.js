/* =====================================================
   DA-09 — Đặt trước (RSV-01), Hàng chờ & giữ chỗ 48 giờ (RSV-02), Hủy đặt trước (RSV-03)

   Giao diện gọi API qua authRequest() (JWT). Khi USE_MOCK_API = true, các endpoint bên dưới
   được mô phỏng trong trình duyệt bởi mockReservationsRequest(); toàn bộ logic hàng chờ,
   giữ chỗ 48 giờ, chống trùng, chống tranh chấp nằm ở tầng "server" (phần 1), KHÔNG nằm ở giao diện.
   Giao diện chỉ hiển thị mốc thời gian do server trả về (holdExpiresAt, serverTime).

   HỢP ĐỒNG API (backend cần cài đặt khi USE_MOCK_API = false):
   - POST  /reservations            { book_id } -> 201 phiếu đặt trước { id, bookId, bookTitle, status, createdAt, queuePosition }
       409 nếu: sách còn bản; đã đặt trước cuốn này (WAITING/HELD); đang mượn / đã đăng ký mượn cuốn này
   - GET   /reservations/my         -> { items: [phiếu + queuePosition], serverTime }
       status: WAITING (đang chờ) | HELD (giữ chỗ 48h, có holdExpiresAt) | FULFILLED (đã đăng ký mượn)
               | CANCELLED (đã hủy) | EXPIRED (quá 48h không nhận)
   - PATCH /reservations/:id/cancel -> phiếu CANCELLED; 404 nếu không phải của mình; 409 nếu không còn hiệu lực.
       Nếu phiếu đang HELD: bản sách được giữ chỗ cho người kế tiếp trong hàng chờ.
   - GET   /books                   availableCopies = số bản còn lại SAU KHI trừ bản đang giữ chỗ
   - POST  /loans                   người đang được giữ chỗ được phép mượn bản đó; phiếu đặt trước -> FULFILLED
   - Khi có bản trống (trả sách, từ chối/hủy phiếu mượn đã giữ chỗ) hoặc giữ chỗ hết 48h: backend tự
     chuyển WAITING sớm nhất -> HELD (heldAt = giờ server, holdExpiresAt = heldAt + 48h) trong cùng
     một giao dịch có khóa, bảo đảm mỗi bản chỉ giữ cho một người.
   ===================================================== */
const RESERVATIONS_KEY = 'ptit_reservations_v1';
const RSV_CLOCK_KEY = 'ptit_server_clock_offset_ms'; // chỉ để demo: "tua" đồng hồ server
const HOLD_HOURS = 48;
const RSV_ACTIVE = ['WAITING', 'HELD'];
const rsvState = { version: 0, items: null, serverTime: null, busy: false, reserving: false, cancel: null, lastFocus: null };

/* =====================================================
   1. SERVICE (mô phỏng backend — chỉ chạy khi USE_MOCK_API = true)
   ===================================================== */
function serverNow() { return Date.now() + (Number(localStorage.getItem(RSV_CLOCK_KEY)) || 0); }

function readReservations() {
  const list = readStoredObject(RESERVATIONS_KEY, []);
  if (!Array.isArray(list)) throw new Error('Dữ liệu đặt trước không hợp lệ.');
  return list;
}
function saveReservations(list) { localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(list)); }

/* Số bản của một cuốn đang bị giữ chỗ: phiếu HELD + phiếu mượn PENDING được tạo từ giữ chỗ */
function reservedCount(bookId, reservations = readReservations(), loans = readDemoLoans()) {
  return reservations.filter(r => r.bookId === bookId && r.status === 'HELD').length +
    loans.filter(l => l.bookId === bookId && l.status === 'PENDING' && l.fromReservation).length;
}
function findActiveHold(email, bookId) {
  return readReservations().find(r => r.userEmail === email && r.bookId === bookId && r.status === 'HELD') || null;
}
function consumeHold(id) {
  const list = readReservations();
  const index = list.findIndex(r => r.id === id);
  if (index >= 0) { list[index] = { ...list[index], status: 'FULFILLED', fulfilledAt: new Date(serverNow()).toISOString() }; saveReservations(list); }
}

const byQueueOrder = (a, b) => String(a.createdAt).localeCompare(String(b.createdAt)) || String(a.id).localeCompare(String(b.id));

/* Hết hạn giữ chỗ 48h + chuyển lượt. Gọi trong khóa giao dịch; trả true nếu có thay đổi. */
function settleReservations() {
  const now = serverNow();
  const reservations = readReservations();
  let changed = false;
  reservations.forEach(r => {
    if (r.status === 'HELD' && Date.parse(r.holdExpiresAt) <= now) {
      r.status = 'EXPIRED';
      r.expiredAt = new Date(now).toISOString();
      changed = true;
    }
  });
  const loans = readDemoLoans();
  syncLibrarianCatalog();
  [...new Set(reservations.filter(r => r.status === 'WAITING').map(r => r.bookId))].forEach(bookId => {
    const book = MOCK_BOOKS.find(b => b.id === bookId);
    if (!book) return;
    let free = book.availableCopies - reservedCount(bookId, reservations, loans);
    const queue = reservations.filter(r => r.bookId === bookId && r.status === 'WAITING').sort(byQueueOrder);
    while (free > 0 && queue.length) { // người đặt sớm nhất được ưu tiên; mỗi bản chỉ giữ cho một người
      const next = queue.shift();
      next.status = 'HELD';
      next.heldAt = new Date(now).toISOString();
      next.holdExpiresAt = new Date(now + HOLD_HOURS * 3600000).toISOString();
      free--;
      changed = true;
    }
  });
  if (changed) saveReservations(reservations);
  return changed;
}

function publicReservation(r, all) {
  const waiting = all.filter(x => x.bookId === r.bookId && x.status === 'WAITING').sort(byQueueOrder);
  return {
    id: r.id, bookId: r.bookId, bookTitle: r.bookTitle, status: r.status, createdAt: r.createdAt,
    heldAt: r.heldAt || null, holdExpiresAt: r.holdExpiresAt || null,
    queuePosition: r.status === 'WAITING' ? waiting.findIndex(x => x.id === r.id) + 1 : null,
  };
}

function mockReservationsRequest(path, options, body) {
  const owner = demoLoanOwner(options); // chủ phiếu lấy từ JWT, không nhận email từ giao diện
  if (!owner) return mockReply(401, { message: 'Vui lòng đăng nhập để sử dụng chức năng đặt trước.' });
  const method = options.method || 'GET';

  if (path === ENDPOINTS.myReservations) {
    if (method !== 'GET') return mockReply(405, { message: 'Thao tác không được hỗ trợ.' });
    const all = readReservations();
    const items = all.filter(r => r.userEmail === owner)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      .map(r => publicReservation(r, all));
    return mockReply(200, { items, serverTime: new Date(serverNow()).toISOString() });
  }

  if (path === ENDPOINTS.reservations) {
    if (method !== 'POST') return mockReply(405, { message: 'Thao tác không được hỗ trợ.' });
    return withDemoLoanLock(() => {
      settleReservations();
      syncLibrarianCatalog();
      const book = Number.isInteger(body.book_id) ? MOCK_BOOKS.find(b => b.id === body.book_id) : null;
      if (!book) return mockReply(404, { message: 'Không tìm thấy sách.' });
      const all = readReservations();
      const loans = readDemoLoans();
      if (all.some(r => r.userEmail === owner && r.bookId === book.id && RSV_ACTIVE.includes(r.status))) {
        return mockReply(409, { message: 'Bạn đã đặt trước cuốn sách này.' });
      }
      if (loans.some(l => l.userEmail === owner && l.bookId === book.id && ['PENDING', 'BORROWING', 'OVERDUE'].includes(l.status))) {
        return mockReply(409, { message: 'Bạn đang mượn hoặc đã đăng ký mượn cuốn sách này.' });
      }
      if (book.availableCopies - reservedCount(book.id, all, loans) > 0) {
        return mockReply(409, { message: 'Sách này vẫn còn bản, hãy đăng ký mượn trực tiếp.' });
      }
      const reservation = {
        id: 'RSV-' + crypto.randomUUID(), userEmail: owner, bookId: book.id, bookTitle: book.title,
        status: 'WAITING', createdAt: new Date(serverNow()).toISOString(), heldAt: null, holdExpiresAt: null,
      };
      const next = [...all, reservation];
      saveReservations(next);
      return mockReply(201, publicReservation(reservation, next));
    });
  }

  const cancel = path.match(/^\/reservations\/([^/]+)\/cancel$/);
  if (cancel) {
    if (method !== 'PATCH') return mockReply(405, { message: 'Thao tác không được hỗ trợ.' });
    return withDemoLoanLock(() => {
      settleReservations();
      const all = readReservations();
      const index = all.findIndex(r => r.id === decodeURIComponent(cancel[1]) && r.userEmail === owner); // chỉ phiếu của chính mình
      if (index < 0) return mockReply(404, { message: 'Không tìm thấy phiếu đặt trước của bạn.' });
      if (!RSV_ACTIVE.includes(all[index].status)) {
        return mockReply(409, { message: 'Chỉ có thể hủy phiếu đặt trước còn hiệu lực.' });
      }
      all[index] = { ...all[index], status: 'CANCELLED', cancelledAt: new Date(serverNow()).toISOString() };
      saveReservations(all);
      settleReservations(); // nếu phiếu đang giữ chỗ: chuyển lượt cho người kế tiếp
      return mockReply(200, publicReservation(all[index], readReservations()));
    });
  }
  return mockReply(404, { message: 'Không tìm thấy dữ liệu.' });
}

/* =====================================================
   2. RSV-01 — Nút "Đặt trước" ở chi tiết sách (chỉ khi số bản = 0)
   ===================================================== */
function setReserveNote(text, isError = false) {
  const note = $('bookReserveNote');
  note.textContent = text;
  note.hidden = !text;
  note.classList.toggle('is-error', isError);
}

function describeMyReservation(r) {
  if (r.status === 'HELD') return `Bạn đang được giữ chỗ cuốn này đến ${formatDateTime(r.holdExpiresAt)}. Hãy bấm “Đăng ký mượn” trước thời hạn.`;
  return `Bạn đã đặt trước cuốn này — vị trí #${r.queuePosition} trong hàng chờ.`;
}

function updateReserveControls(book) {
  const button = $('reserveButton');
  setReserveNote('');
  button.hidden = true;
  button.disabled = false;
  button.textContent = 'Đặt trước';
  if (book.copies !== 0) return; // RSV-01: còn bản (hoặc chưa rõ) -> không hiển thị nút đặt trước
  button.hidden = false;
  const version = loanState.version;
  authRequest(ENDPOINTS.myReservations).then(result => {
    if (version !== loanState.version || !loanState.book || loanState.book.id !== book.id || !result.ok) return;
    const mine = (result.data.items || []).find(r => r.bookId === book.id && RSV_ACTIVE.includes(r.status));
    if (!mine) return;
    button.hidden = true; // đã đặt trước hoặc đang được giữ chỗ: không đặt trùng
    setReserveNote(describeMyReservation(mine));
  });
}

$('reserveButton').addEventListener('click', async () => {
  const book = loanState.book;
  if (!book || rsvState.reserving || book.copies !== 0) return;
  if (!requireLoanLogin()) return;
  const button = $('reserveButton');
  const version = loanState.version;
  rsvState.reserving = true;
  button.disabled = true;
  button.textContent = 'Đang đặt trước…';
  setReserveNote('');
  const result = await authRequest(ENDPOINTS.reservations, { method: 'POST', body: JSON.stringify({ book_id: book.id }) });
  rsvState.reserving = false;
  const stillOpen = version === loanState.version && loanState.book && loanState.book.id === book.id;
  if (!result.ok) {
    if (result.status === 401) return; // authRequest đã đưa về màn hình đăng nhập
    if (stillOpen) { button.disabled = false; button.textContent = 'Đặt trước'; setReserveNote(result.message, true); }
    showToast(result.message);
    if (result.status === 409 && typeof loadBooks === 'function') loadBooks(true); // số bản trên màn hình đã cũ
    return;
  }
  const position = result.data.queuePosition;
  showToast(`Đặt trước thành công “${book.title}”. Bạn đang ở vị trí #${position} trong hàng chờ.`);
  if (stillOpen) {
    button.hidden = true;
    setReserveNote(`Đặt trước thành công — vị trí #${position} trong hàng chờ. Khi có bản trả về bạn sẽ được giữ chỗ ${HOLD_HOURS} giờ.`);
  }
  loadMyReservations();
});

/* =====================================================
   3. RSV-03 — Danh sách phiếu đặt trước ở "Sách của tôi" + hủy đặt trước
   ===================================================== */
const RSV_LABELS = { WAITING: 'Đang chờ', HELD: 'Đang giữ chỗ', FULFILLED: 'Đã đăng ký mượn', CANCELLED: 'Đã hủy', EXPIRED: 'Hết hạn giữ chỗ' };

function resetMyReservations() {
  rsvState.version++;
  rsvState.items = null;
  $('myReservations').replaceChildren();
  $('myReservations').setAttribute('aria-busy', 'false');
}

function reservationDetail(r) {
  if (r.status === 'WAITING') return `Vị trí #${r.queuePosition} trong hàng chờ`;
  if (r.status === 'HELD') {
    const hours = Math.max(1, Math.ceil((Date.parse(r.holdExpiresAt) - Date.parse(rsvState.serverTime)) / 3600000));
    return `Giữ chỗ đến ${formatDateTime(r.holdExpiresAt)} (còn khoảng ${hours} giờ) — hãy đăng ký mượn trước thời hạn`;
  }
  if (r.status === 'EXPIRED') return `Quá ${HOLD_HOURS} giờ không nhận sách`;
  if (r.status === 'FULFILLED') return 'Đã chuyển thành phiếu mượn';
  return '—';
}

async function loadMyReservations() {
  const token = getToken();
  if (!token) return;
  const holder = $('myReservations');
  const version = ++rsvState.version;
  holder.setAttribute('aria-busy', 'true');
  holder.replaceChildren(el('p', 'table-empty', 'Đang tải phiếu đặt trước…'));
  const result = await authRequest(ENDPOINTS.myReservations);
  if (version !== rsvState.version || token !== getToken()) return;
  holder.setAttribute('aria-busy', 'false');
  holder.replaceChildren();
  if (!result.ok || !result.data || !Array.isArray(result.data.items)) {
    const message = el('p', 'error', result.ok ? 'Dữ liệu đặt trước không hợp lệ.' : result.message);
    message.setAttribute('role', 'alert');
    holder.append(message, readerButton('Thử lại', () => loadMyReservations()));
    return;
  }
  rsvState.items = result.data.items;
  rsvState.serverTime = result.data.serverTime;
  if (!rsvState.items.length) { holder.append(el('p', 'table-empty', 'Bạn chưa đặt trước cuốn sách nào.')); return; }
  const { wrap, body } = makeTable(['Sách', 'Ngày đặt', 'Trạng thái', 'Chi tiết', ''], 'Phiếu đặt trước');
  rsvState.items.forEach(r => {
    const row = el('tr');
    row.dataset.reservationId = r.id;
    const status = el('td');
    status.append(el('span', 'pill rsv-' + r.status.toLowerCase(), RSV_LABELS[r.status] || r.status));
    const action = el('td');
    if (RSV_ACTIVE.includes(r.status)) { // chỉ phiếu còn hiệu lực mới có nút hủy
      const cancel = readerButton('Hủy đặt trước', () => openCancelReservation(r, cancel), 'btn btn-outline table-action btn-cancel');
      cancel.setAttribute('aria-label', 'Hủy đặt trước sách ' + r.bookTitle);
      action.append(cancel);
    }
    row.append(el('td', '', r.bookTitle), el('td', '', displayDate(r.createdAt)), status, el('td', 'rsv-detail', reservationDetail(r)), action);
    body.append(row);
  });
  holder.append(wrap);
}

function setCancelReservationBusy(busy) {
  rsvState.busy = busy;
  $('cancelReservationLoading').hidden = !busy;
  $('keepReservation').disabled = busy;
  $('confirmCancelReservation').disabled = busy;
  $('confirmCancelReservation').textContent = busy ? 'Đang hủy…' : 'Xác nhận hủy';
}

function openCancelReservation(reservation, trigger) {
  if (!requireLoanLogin()) return;
  rsvState.cancel = reservation;
  rsvState.lastFocus = trigger;
  $('cancelReservationText').textContent = `Bạn muốn hủy đặt trước sách “${reservation.bookTitle}”?` +
    (reservation.status === 'HELD' ? ' Bản đang giữ chỗ sẽ được chuyển cho người kế tiếp trong hàng chờ.' : ' Bạn sẽ rời khỏi hàng chờ.');
  $('cancelReservationError').textContent = '';
  setCancelReservationBusy(false);
  $('cancelReservationDialog').showModal();
  document.body.style.overflow = 'hidden';
  $('keepReservation').focus(); // mặc định focus vào "Giữ đặt trước" để tránh bấm nhầm
}

function closeCancelReservation(force = false) {
  if (rsvState.busy && !force) return;
  rsvState.cancel = null;
  setCancelReservationBusy(false);
  if ($('cancelReservationDialog').open) {
    $('cancelReservationDialog').close();
    document.body.style.overflow = '';
    if (rsvState.lastFocus && rsvState.lastFocus.isConnected) rsvState.lastFocus.focus();
  }
  rsvState.lastFocus = null;
}

$('keepReservation').addEventListener('click', () => closeCancelReservation());
$('cancelReservationDialog').addEventListener('cancel', event => { event.preventDefault(); closeCancelReservation(); });
$('cancelReservationForm').addEventListener('submit', async event => {
  event.preventDefault();
  const reservation = rsvState.cancel;
  if (!reservation || rsvState.busy) return;
  const token = getToken();
  $('cancelReservationError').textContent = '';
  setCancelReservationBusy(true);
  const result = await authRequest(ENDPOINTS.reservations + '/' + encodeURIComponent(reservation.id) + '/cancel', { method: 'PATCH' });
  if (rsvState.cancel !== reservation || getToken() !== token) return; // đã đóng hộp thoại hoặc đổi phiên
  setCancelReservationBusy(false);
  if (!result.ok) {
    $('cancelReservationError').textContent = result.message; // message từ API
    if ([404, 409].includes(result.status)) loadMyReservations(); // dữ liệu trên màn hình đã cũ
    return;
  }
  rsvState.lastFocus = null;
  closeCancelReservation(true);
  showToast(`Đã hủy đặt trước “${reservation.bookTitle}”.`);
  await loadMyReservations();
  if (typeof loadBooks === 'function') loadBooks(true); // bản sách có thể vừa được trả lại hàng chờ
});

// Làm mới khi dữ liệu đặt trước thay đổi ở tab khác, hoặc khi quay lại tab
window.addEventListener('storage', event => {
  if ([RESERVATIONS_KEY, DEMO_LOANS_KEY].includes(event.key) && hasLoanSession() && !$('page-mybooks').hidden) loadMyReservations();
});
window.addEventListener('focus', () => {
  if (hasLoanSession() && !$('page-mybooks').hidden) loadMyReservations();
});

/* =====================================================
   4. Công cụ demo (chỉ khi USE_MOCK_API = true)
   - PTIT.demoRsv.advanceClock(giờ): "tua" đồng hồ SERVER để thử hết hạn giữ chỗ 48 giờ
   - PTIT.demoRsv.makeOutOfStock(): cho cuốn "Spring in Action" hết bản (đang do Lê Thu Hà mượn)
   ===================================================== */
window.PTIT.demoRsv = {
  advanceClock(hours) {
    if (!USE_MOCK_API) throw new Error('Chỉ dùng được ở chế độ demo.');
    localStorage.setItem(RSV_CLOCK_KEY, String((Number(localStorage.getItem(RSV_CLOCK_KEY)) || 0) + hours * 3600000));
    return withDemoLoanLock(() => settleReservations()).then(() => { if (!$('page-mybooks').hidden) loadMyReservations(); });
  },
  makeOutOfStock() {
    if (!USE_MOCK_API) throw new Error('Chỉ dùng được ở chế độ demo.');
    const catalog = readStoredObject(STAFF_BOOKS_KEY, null);
    if (!Array.isArray(catalog)) throw new Error('Hãy đăng nhập thủ thư một lần để nạp dữ liệu mẫu trước.');
    const loans = readDemoLoans();
    if (!loans.some(l => l.bookId === 8 && unreturnedLoan(l))) throw new Error('Chưa có phiếu đang mượn cuốn này; hãy đăng nhập thủ thư để nạp dữ liệu mẫu.');
    localStorage.setItem(STAFF_BOOKS_KEY, JSON.stringify(catalog.map(b => b.id === 8 ? { ...b, totalCopies: loans.filter(l => l.bookId === 8 && unreturnedLoan(l)).length } : b)));
    syncLibrarianCatalog();
  },
};
