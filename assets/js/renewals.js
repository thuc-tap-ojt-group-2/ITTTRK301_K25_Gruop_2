/* =====================================================
   DA-12 — Gia hạn phiếu mượn (LOAN-08)

   Giao diện gọi PATCH /loans/:id/renew qua authRequest() (JWT). Khi USE_MOCK_API = true,
   endpoint được mô phỏng trong trình duyệt bởi mockRenewLoan(). Toàn bộ kiểm tra điều kiện
   (quyền sở hữu, quá hạn, người đặt trước, chỉ một lần, chống gửi trùng) nằm ở tầng
   "server" (mockRenewLoan), KHÔNG nằm ở giao diện. Giao diện chỉ ẩn/hiện nút để gợi ý
   và hiển thị đúng message do server trả về.

   HỢP ĐỒNG API (backend cần cài đặt khi USE_MOCK_API = false):
   - PATCH /loans/:id/renew  (JWT; chỉ chủ phiếu) -> 200 phiếu đã cập nhật
       { ..., dueDate (mới), renewCount: 1, renewedAt, originalDueDate }
       401 chưa đăng nhập / hết hạn
       404 phiếu không tồn tại hoặc không thuộc tài khoản đang đăng nhập
       409 phiếu không còn ở trạng thái đang mượn / đã quá hạn /
           có độc giả khác đang đặt trước (WAITING, HELD) / đã gia hạn một lần
     Gia hạn thêm RENEW_DAYS ngày tính từ hạn trả hiện tại. Kiểm tra + ghi trong một
     giao dịch có khóa (UPDATE ... WHERE renew_count = 0 ở SQL) để hai yêu cầu đồng thời
     chỉ có một yêu cầu thành công.
   ===================================================== */
const RENEW_DAYS = 7;
const RENEW_LIMIT = 1;
const renewState = { loan: null, token: null, busy: false, version: 0, lastFocus: null };

/* =====================================================
   1. SERVICE (mô phỏng backend — chỉ chạy khi USE_MOCK_API = true)
   ===================================================== */
function mockRenewLoan(id, options) {
  return withDemoLoanLock(() => {
    const owner = demoLoanOwner(options); // chủ phiếu lấy từ JWT, không nhận email từ giao diện
    if (!owner) return mockReply(401, { message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });
    if (options.method !== 'PATCH') return mockReply(405, { message: 'Thao tác không được hỗ trợ.' });
    settleReservations(); // xử lý giữ chỗ hết hạn trước khi đếm người đặt trước
    const loans = readDemoLoans();
    const index = loans.findIndex(loan => String(loan.id) === id && userEmail({ email: loan.userEmail }) === owner);
    if (index < 0) return mockReply(404, { message: 'Không tìm thấy phiếu mượn của bạn.' });
    const loan = loans[index];
    if (loan.status !== 'BORROWING' || loan.returnDate || !loan.dueDate) {
      return mockReply(409, { message: 'Chỉ có thể gia hạn phiếu đang mượn. Phiếu này không còn hợp lệ để gia hạn.' });
    }
    if (isLoanOverdue(loan)) {
      return mockReply(409, { message: 'Sách đã quá hạn nên không thể gia hạn. Vui lòng trả sách cho thư viện.' });
    }
    if (Number(loan.renewCount) >= RENEW_LIMIT) {
      return mockReply(409, { message: 'Phiếu mượn này đã được gia hạn một lần, không thể gia hạn thêm.' });
    }
    const waitingOthers = readReservations().some(r =>
      r.bookId === loan.bookId && RSV_ACTIVE.includes(r.status) && userEmail({ email: r.userEmail }) !== owner);
    if (waitingOthers) {
      return mockReply(409, { message: 'Không thể gia hạn: đang có độc giả khác đặt trước cuốn sách này.' });
    }
    const newDue = dateInVietnam(new Date(Date.parse(loan.dueDate.slice(0, 10)) + RENEW_DAYS * 86400000));
    loans[index] = {
      ...loan, originalDueDate: loan.originalDueDate || loan.dueDate, dueDate: newDue,
      renewCount: (Number(loan.renewCount) || 0) + 1, renewedAt: new Date(serverNow()).toISOString(),
    };
    localStorage.setItem(DEMO_LOANS_KEY, JSON.stringify(loans));
    return mockReply(200, loans[index]);
  });
}

/* =====================================================
   2. Giao diện: nút "Gia hạn" + hộp thoại xác nhận
   ===================================================== */
/* Chỉ gợi ý hiển thị nút; backend vẫn kiểm tra lại mọi điều kiện (kể cả người đặt trước). */
function canOfferRenew(loan) {
  return loan.status === 'BORROWING' && !loan.returnDate && Boolean(loan.dueDate) &&
    !isLoanOverdue(loan) && !(Number(loan.renewCount) >= RENEW_LIMIT);
}

function setRenewBusy(busy) {
  renewState.busy = busy;
  $('renewLoanForm').setAttribute('aria-busy', String(busy));
  $('renewLoanLoading').hidden = !busy;
  $('cancelRenewLoan').disabled = busy;
  $('confirmRenewLoan').disabled = busy;
  $('confirmRenewLoan').textContent = busy ? 'Đang gia hạn…' : 'Xác nhận gia hạn';
}

function openRenewLoan(loan, trigger) {
  if (!requireLoanLogin() || myLoansState.token !== getToken()) return;
  renewState.loan = loan;
  renewState.token = getToken();
  renewState.lastFocus = trigger;
  renewState.version++;
  const newDue = dateInVietnam(new Date(Date.parse(String(loan.dueDate).slice(0, 10)) + RENEW_DAYS * 86400000));
  $('renewLoanText').textContent = `Gia hạn thêm ${RENEW_DAYS} ngày cho sách “${loan.bookTitle}”? Hạn trả hiện tại là ${displayDate(loan.dueDate)}, ` +
    `dự kiến hạn mới ${displayDate(newDue)}. Mỗi phiếu chỉ được gia hạn một lần.`;
  $('renewLoanError').textContent = '';
  setRenewBusy(false);
  $('renewLoanDialog').showModal();
  document.body.style.overflow = 'hidden';
  $('cancelRenewLoan').focus(); // mặc định focus vào "Hủy" để tránh bấm nhầm
}

function closeRenewLoan(force = false) {
  if (renewState.busy && !force) return;
  renewState.version++;
  renewState.loan = null;
  renewState.token = null;
  setRenewBusy(false);
  if ($('renewLoanDialog').open) {
    $('renewLoanDialog').close();
    document.body.style.overflow = '';
    if (renewState.lastFocus && renewState.lastFocus.isConnected) renewState.lastFocus.focus();
  }
  renewState.lastFocus = null;
}

$('cancelRenewLoan').addEventListener('click', () => closeRenewLoan());
$('renewLoanDialog').addEventListener('cancel', event => { event.preventDefault(); closeRenewLoan(); });
$('renewLoanForm').addEventListener('submit', async event => {
  event.preventDefault();
  if (renewState.busy || !renewState.loan) return; // chặn bấm liên tiếp ở giao diện (backend vẫn tự chặn)
  if (!requireLoanLogin()) return;
  const { loan, token, version } = renewState;
  if (token !== getToken()) { closeRenewLoan(true); renderMyLoans(); return; }
  $('renewLoanError').textContent = '';
  setRenewBusy(true);
  try {
    const result = await authRequest(ENDPOINTS.loans + '/' + encodeURIComponent(loan.id) + '/renew', { method: 'PATCH' });
    if (version !== renewState.version) return;
    if (token !== getToken()) { closeRenewLoan(true); resetMyLoans(); if (requireLoanLogin()) renderMyLoans(); return; }
    if (!result.ok) {
      $('renewLoanError').textContent = result.message || 'Không thể gia hạn. Vui lòng thử lại.'; // message từ backend
      if ([404, 409].includes(result.status)) renderMyLoans(); // dữ liệu trên màn hình đã cũ -> tải lại
      return;
    }
    if (Number(result.data.renewCount) < 1 || !result.data.dueDate) throw new Error('Chưa xác nhận được việc gia hạn. Vui lòng tải lại danh sách.');
    closeRenewLoan(true);
    myLoansState.focusId = loan.id;
    await renderMyLoans();
    if (token !== getToken()) return;
    renderOverview();
    showToast(`Gia hạn thành công “${loan.bookTitle}”. Hạn trả mới: ${displayDate(result.data.dueDate)}.`);
    const heading = $('page-mybooks').querySelector('h1');
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  } catch (error) {
    if (version === renewState.version && token === getToken()) {
      $('renewLoanError').textContent = error.message || 'Không thể gia hạn. Vui lòng thử lại.';
    }
  } finally {
    if (version === renewState.version) setRenewBusy(false);
  }
});
