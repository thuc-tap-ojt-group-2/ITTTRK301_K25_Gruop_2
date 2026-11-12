// Chạy: node tests/my-loans.cjs (Playwright + Chrome).
// Kiểm thử service demo hiện có, không thay thế request/response bằng mock của test.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1887, height: 936 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    await page.route('https://fonts.gstatic.com/**', route => route.abort());
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    const waitText = (id, text) => page.waitForFunction(({ id, text }) => document.getElementById(id).textContent.includes(text), { id, text });
    const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('ptit_da05_loans_v1')));
    const status = async id => (await saved()).find(loan => loan.id === id).status;
    const row = id => page.locator(`[data-loan-id="${id}"]`);
    const myBooks = async () => {
      await page.locator('[data-nav="mybooks"]').click();
      await page.waitForFunction(() => document.getElementById('myLoanList').getAttribute('aria-busy') === 'false');
    };
    async function login() {
      await page.locator('[data-open="login"]').click();
      await page.locator('.chip[data-email="docgia@ptit.edu.vn"]').click();
      await page.locator('#loginForm button[type="submit"]').click();
      await page.locator('#appView').waitFor();
    }
    const cancelDirect = id => page.evaluate(id => PTIT.authRequest('/loans/' + id + '/cancel', { method: 'PATCH' }), id);
    const capture = async name => {
      const filename = path.join(os.tmpdir(), 'da06-' + name + '.png');
      await page.screenshot({ path: filename, animations: 'disabled' });
      console.log('Screenshot:', filename);
    };
    await login();
    // Dữ liệu kiểm thử cố định để bao phủ tất cả trạng thái; không tự nạp vào sản phẩm.
    await page.evaluate(() => {
      const base = { userEmail: PTIT.getUser().email, days: 14, createdAt: new Date().toISOString(), dueDate: null, returnDate: null, fine: 0 };
      localStorage.setItem('ptit_da05_loans_v1', JSON.stringify([
        { ...base, id: 'pending', bookId: 3, bookTitle: 'Nhà giả kim', status: 'PENDING' },
        { ...base, id: 'borrowing', bookId: 4, bookTitle: 'Clean Code', status: 'BORROWING', dueDate: '2099-12-31' },
        { ...base, id: 'overdue', bookId: 1, bookTitle: 'Dế Mèn phiêu lưu ký', status: 'BORROWING', dueDate: '2000-01-01' },
        { ...base, id: 'returned', bookId: 2, bookTitle: 'Số đỏ', status: 'RETURNED', dueDate: '2000-01-01', returnDate: '2000-01-01', fine: 15000 },
        { ...base, id: 'cancelled', bookId: 5, bookTitle: 'Cấu trúc dữ liệu', status: 'CANCELLED' },
        { ...base, id: 'other', userEmail: 'other@example.com', bookId: 6, bookTitle: 'Phiếu riêng tư', status: 'PENDING' },
      ]));
    });
    await page.locator('[data-nav="mybooks"]').click();
    await waitText('myLoanList', 'Đang tải');
    await row('pending').waitFor();
    assert.equal(await page.locator('#myLoanList tbody tr').count(), 5);
    assert.equal(await page.locator('#myLoanList .cancel-loan').count(), 1);
    assert.equal(await row('pending').locator('.cancel-loan').evaluate(node => getComputedStyle(node).color), 'rgb(192, 57, 43)');
    assert.equal(await row('other').count(), 0);
    assert.match(await row('pending').textContent(), /Sau khi duyệt/);
    const expected = { pending: 'Chờ duyệt', borrowing: 'Đang mượn', overdue: 'Quá hạn', returned: 'Đã trả', cancelled: 'Đã hủy' };
    const colors = [];
    for (const [id, label] of Object.entries(expected)) {
      assert.equal(await row(id).locator('.pill').textContent(), label);
      colors.push(await row(id).locator('.pill').evaluate(node => getComputedStyle(node).color));
    }
    assert.equal(new Set(colors).size, 5);
    await capture('my-books');
    console.log('PASS loading, dữ liệu của tài khoản hiện tại, 5 nhãn với 5 màu, chỉ PENDING có nút hủy');

    assert.equal((await cancelDirect('other')).status, 404);
    for (const id of ['borrowing', 'overdue', 'returned', 'cancelled']) assert.equal((await cancelDirect(id)).status, 409);
    assert.equal((await cancelDirect('missing')).status, 404);
    assert.equal(await status('other'), 'PENDING');
    console.log('PASS service từ chối phiếu người khác, phiếu không tồn tại và phiếu không PENDING');

    await row('pending').locator('.cancel-loan').click();
    assert.equal(await page.locator('#keepLoanButton').evaluate(node => node === document.activeElement), true);
    await capture('confirm');
    await page.locator('#keepLoanButton').click();
    assert.equal(await status('pending'), 'PENDING');
    await row('pending').locator('.cancel-loan').click();
    await page.keyboard.press('Escape');
    assert.equal(await status('pending'), 'PENDING');
    await row('pending').locator('.cancel-loan').click();
    await page.locator('#confirmCancelLoan').click();
    assert.equal(await page.locator('#confirmCancelLoan').isDisabled(), true);
    await page.locator('#cancelLoanForm').evaluate(form => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#cancelLoanDialog').evaluate(dialog => dialog.open), true);
    await waitText('appToast', 'CANCELLED');
    await row('pending').locator('.status-cancelled').waitFor();
    assert.equal(await status('pending'), 'CANCELLED');
    assert.equal(await page.locator('#myLoanList .cancel-loan').count(), 0);
    assert.equal((await saved()).length, 6);
    assert.equal(await status('other'), 'PENDING');
    await capture('cancelled');
    await page.reload();
    await myBooks();
    await row('pending').locator('.status-cancelled').waitFor();
    console.log('PASS Giữ phiếu/Escape, xác nhận, chống gửi trùng, CANCELLED lưu qua reload');

    // Đăng ký mới bằng luồng DA-05, rồi kiểm tra hủy khi gặp lỗi lưu trữ và trạng thái đổi.
    await page.evaluate(() => PTIT.demo.loadScenario('ready'));
    await page.locator('[data-nav="search"]').click();
    await page.locator('#bookList .book-open').first().click();
    await page.locator('#registerLoanButton').click();
    await page.locator('input[name="loanDays"][value="7"]').check();
    await page.locator('#confirmLoanButton').click();
    await waitText('loanSuccess', 'PENDING');
    await page.locator('#viewMyLoans').click();
    await page.locator('#myLoanList .cancel-loan').waitFor();
    const newId = (await saved()).find(loan => loan.userEmail === 'docgia@ptit.edu.vn').id;
    await page.locator('#myLoanList .cancel-loan').click();
    await page.evaluate(() => {
      window.savedSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === 'ptit_da05_loans_v1') throw new DOMException('Storage full', 'QuotaExceededError');
        return window.savedSetItem.call(this, key, value);
      };
    });
    await page.locator('#confirmCancelLoan').click();
    await waitText('cancelLoanError', 'Không thể đọc hoặc lưu');
    assert.equal(await status(newId), 'PENDING');
    assert.equal(await page.locator('#confirmCancelLoan').isEnabled(), true);
    await page.evaluate(() => { Storage.prototype.setItem = window.savedSetItem; });
    // Thủ thư đã duyệt sau khi độc giả mở hộp xác nhận.
    await page.evaluate(id => {
      const loans = JSON.parse(localStorage.getItem('ptit_da05_loans_v1'));
      loans.find(loan => loan.id === id).status = 'BORROWING';
      localStorage.setItem('ptit_da05_loans_v1', JSON.stringify(loans));
    }, newId);
    await page.locator('#confirmCancelLoan').click();
    await waitText('cancelLoanError', 'Chỉ có thể hủy phiếu');
    await row(newId).locator('.status-borrowing').waitFor();
    await page.locator('#keepLoanButton').click();
    assert.equal(await status(newId), 'BORROWING');
    console.log('PASS đăng ký từ DA-05, lỗi lưu trữ, không hủy phiếu đã được duyệt sau khi mở xác nhận');

    // Lỗi tải và phục hồi; dữ liệu rỗng sau khi thử lại.
    await page.evaluate(() => {
      window.validLoans = localStorage.getItem('ptit_da05_loans_v1');
      localStorage.setItem('ptit_da05_loans_v1', '{broken');
    });
    await myBooks();
    await waitText('myLoanList', 'Không thể đọc hoặc lưu');
    await page.evaluate(() => localStorage.setItem('ptit_da05_loans_v1', '[]'));
    await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
    await waitText('myLoanList', 'Bạn chưa có sách nào');
    console.log('PASS lỗi tải, Thử lại và danh sách trống');

    await page.evaluate(() => PTIT.demo.loadScenario('duplicate'));
    await myBooks();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#myLoanList .cancel-loan').click();
    const box = await page.locator('#cancelLoanDialog').boundingBox();
    assert.ok(box.x >= 0 && box.x + box.width <= 390 && box.y >= 0 && box.y + box.height <= 844);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await capture('mobile-confirm');
    await page.locator('#keepLoanButton').click();
    await page.setViewportSize({ width: 1887, height: 936 });
    await page.locator('#themeButton').click();
    await capture('dark');
    await page.locator('#themeButton').click();
    console.log('PASS giao diện mobile, dark mode và hộp xác nhận không tràn màn hình');

    // Hai yêu cầu đồng thời chỉ có một yêu cầu được hủy.
    const concurrentId = (await saved()).find(loan => loan.status === 'PENDING').id;
    const results = await page.evaluate(id => Promise.all([
      PTIT.authRequest('/loans/' + id + '/cancel', { method: 'PATCH' }),
      PTIT.authRequest('/loans/' + id + '/cancel', { method: 'PATCH' }),
    ]), concurrentId);
    assert.deepEqual(results.map(result => result.status).sort(), [200, 409]);
    console.log('PASS hai yêu cầu đồng thời chỉ hủy thành công một lần');

    // Sau khi hủy, tự chuyển đến trang chứa phiếu CANCELLED nếu danh sách dài.
    await page.evaluate(() => {
      const loans = JSON.parse(localStorage.getItem('ptit_da05_loans_v1'));
      const original = loans.find(loan => loan.userEmail === PTIT.getUser().email);
      const history = Array.from({ length: 12 }, (_, i) => ({ ...original, id: 'history-' + i, status: 'RETURNED' }));
      localStorage.setItem('ptit_da05_loans_v1', JSON.stringify([...history, { ...original, id: 'last-pending', status: 'PENDING' }]));
    });
    await myBooks();
    await row('last-pending').locator('.cancel-loan').click();
    await page.locator('#confirmCancelLoan').click();
    await row('last-pending').locator('.status-cancelled').waitFor();
    assert.equal(await page.locator('.loan-pagination [aria-current="page"]').textContent(), '2');
    console.log('PASS danh sách nhiều trang hiển thị ngay phiếu vừa hủy');

    await page.evaluate(() => PTIT.demo.loadScenario('duplicate'));
    await myBooks();
    await page.locator('#myLoanList .cancel-loan').click();
    const expiringId = (await saved()).find(loan => loan.status === 'PENDING').id;
    await page.locator('#confirmCancelLoan').click();
    await page.evaluate(() => localStorage.removeItem('ptit_token'));
    await page.locator('#panel-login').waitFor();
    assert.equal(await status(expiringId), 'PENDING');
    assert.equal(await page.locator('#cancelLoanDialog').evaluate(dialog => dialog.open), false);
    assert.equal(await page.locator('#myLoanList tbody tr').count(), 0);
    console.log('PASS hết phiên giữa lúc hủy không thay đổi phiếu, xóa danh sách của phiên cũ');
    assert.deepEqual(errors, []);
    console.log('PASS DA-06 LOAN-02 / LOAN-06');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
