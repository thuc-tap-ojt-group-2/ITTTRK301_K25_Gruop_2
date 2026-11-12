// Chạy: node tests/loan-demo.cjs (cần playwright và Chrome/Chromium).
// Kiểm thử trực tiếp ứng dụng demo; không thay thế response bằng mock của test.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const root = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const baseline = url.startsWith('/baseline/');
  const directory = baseline ? path.resolve(root, '../DA-04') : root;
  const file = path.resolve(directory, '.' + (baseline ? url.slice('/baseline'.length) : url === '/' ? '/index.html' : url));
  if (!file.startsWith(directory + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error, bytes) => {
    if (error) { res.writeHead(404).end(); return; }
    const type = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png' }[path.extname(file)];
    res.writeHead(200, { 'Content-Type': type || 'application/octet-stream' });
    res.end(bytes);
  });
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    const apiRequests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (request.url().includes('/api/')) apiRequests.push(request.url()); });
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    await page.route('https://fonts.gstatic.com/**', route => route.abort());
    await page.goto(`http://127.0.0.1:${server.address().port}`);

    const count = () => page.evaluate(() => JSON.parse(localStorage.getItem('ptit_da05_loans_v1') || '[]').length);
    const waitText = (id, text) => page.waitForFunction(({ id, text }) => document.getElementById(id).textContent.includes(text), { id, text });
    async function search() {
      await page.locator('[data-nav="search"]').click();
      await page.locator('#bookList .book-card').first().waitFor();
    }
    async function scenario(value) {
      await page.evaluate(value => window.PTIT.demo.loadScenario(value), value);
    }
    async function openLoan(title = 'Dế Mèn phiêu lưu ký') {
      await page.locator('#searchInput').fill(title);
      await page.locator('#searchForm').evaluate(form => form.requestSubmit());
      await page.getByRole('button', { name: 'Xem chi tiết ' + title, exact: true }).click();
      await page.locator('#registerLoanButton').click();
    }
    async function submit(days) {
      await page.locator(`input[name="loanDays"][value="${days}"]`).check();
      await page.locator('#confirmLoanButton').click();
    }

    await page.locator('[data-open="login"]').click();
    await page.locator('.chip[data-email="docgia@ptit.edu.vn"]').click();
    await page.locator('#loginForm button[type="submit"]').click();
    await page.locator('#appView').waitFor();
    await search();
    assert.equal(await page.locator('#bookList .book-card').count(), 8);
    await page.locator('#searchInput').fill('de men');
    await page.locator('#searchForm').evaluate(form => form.requestSubmit());
    assert.equal(await page.locator('#bookList .book-card').count(), 1);
    await page.locator('#searchInput').fill('');
    await page.locator('#searchForm').evaluate(form => form.requestSubmit());
    console.log('PASS đăng nhập, tìm kiếm không dấu, phân trang');

    for (const days of [7, 14, 30]) {
      await scenario('ready');
      await openLoan();
      assert.equal(await page.locator('input[name="loanDays"]:checked').count(), 0);
      await page.locator('#confirmLoanButton').click();
      await waitText('loanError', 'Vui lòng chọn');
      assert.equal(await count(), 0);
      await submit(days);
      assert.equal(await page.locator('#confirmLoanButton').isDisabled(), true);
      assert.equal(await page.locator('#loanLoading').isVisible(), true);
      // Giả lập hai lần submit sát nhau; service chỉ được tạo một phiếu.
      await page.locator('#loanForm').evaluate(form => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#bookDialog').evaluate(dialog => dialog.open), true);
      await waitText('loanSuccess', `${days} ngày`);
      assert.equal(await count(), 1);
      const loan = await page.evaluate(() => JSON.parse(localStorage.getItem('ptit_da05_loans_v1'))[0]);
      assert.equal(loan.days, days);
      assert.equal(loan.status, 'PENDING');
      assert.equal(loan.dueDate, null);
      assert.equal(await page.locator('#bookDetailAvailability').textContent(), 'Còn lại: 4 bản');
      await page.locator('#viewMyLoans').click();
      await waitText('myLoanList', 'Chờ duyệt');
      await page.reload();
      await page.locator('[data-nav="mybooks"]').click();
      await waitText('myLoanList', `${days} ngày`);
      await search();
      console.log(`PASS ${days} ngày: bắt buộc chọn, loading, chống gửi trùng, PENDING, lưu qua reload`);
    }

    for (const [value, code] of [['limit', 'BR01'], ['duplicate', 'BR02'], ['overdue', 'BR03']]) {
      await scenario(value);
      const before = await count();
      await openLoan();
      await submit(14);
      await waitText('loanError', code);
      assert.equal(await count(), before);
      assert.equal(await page.locator('#confirmLoanButton').isEnabled(), true);
      assert.equal(await page.locator('#loanLoading').isHidden(), true);
      assert.equal(await page.locator('#loanResult').isHidden(), true);
      if (code === 'BR02') {
        const screenshot = path.join(os.tmpdir(), 'da05-loan-br02.png');
        await page.screenshot({ path: screenshot });
        console.log('Screenshot:', screenshot);
      }
      await page.locator('#closeBookDialog').click();
      console.log(`PASS ${code}: đúng lỗi, không thêm phiếu, hết loading`);
    }

    await scenario('ready');
    await openLoan('Lão Hạc');
    await submit(7);
    await waitText('loanError', 'hết bản sao');
    assert.equal(await count(), 0);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#bookDialog').evaluate(dialog => dialog.open), false);
    console.log('PASS hết bản, Escape đóng hộp thoại');

    // Lỗi lưu trữ: không báo thành công và nút được khôi phục.
    await openLoan();
    await page.evaluate(() => {
      window.originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === 'ptit_da05_loans_v1') throw new DOMException('Storage full', 'QuotaExceededError');
        return window.originalSetItem.call(this, key, value);
      };
    });
    await submit(14);
    await waitText('loanError', 'Không thể đọc hoặc lưu');
    assert.equal(await count(), 0);
    assert.equal(await page.locator('#confirmLoanButton').isEnabled(), true);
    await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; });
    await page.locator('#closeBookDialog').click();
    console.log('PASS lỗi localStorage không tạo phiếu hoặc treo giao diện');

    await page.setViewportSize({ width: 390, height: 740 });
    await openLoan();
    await page.locator('input[value="30"][name="loanDays"]').check();
    const screenshot = path.join(os.tmpdir(), 'da05-loan-mobile.png');
    await page.screenshot({ path: screenshot });
    console.log('Screenshot:', screenshot);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    const dialog = await page.locator('#bookDialog').boundingBox();
    assert.ok(dialog.x >= 0 && dialog.x + dialog.width <= 390);
    assert.ok(dialog.y >= 0 && dialog.y + dialog.height <= 740);
    await page.locator('#backToBookDetail').click();
    await page.locator('#registerLoanButton').click();
    assert.equal(await page.locator('input[value="30"][name="loanDays"]').isChecked(), true);
    await page.locator('#closeBookDialog').click();
    await page.setViewportSize({ width: 1280, height: 900 });
    console.log('PASS mobile, quay lại giữ lựa chọn, không tràn ngang');

    // Hết phiên ngay trước khi xác nhận: chuyển về đăng nhập, không tạo phiếu.
    await openLoan();
    await page.evaluate(() => localStorage.removeItem('ptit_token'));
    await submit(7);
    await page.locator('#panel-login').waitFor();
    await waitText('loginNotice', 'Vui lòng đăng nhập');
    assert.equal(await count(), 0);
    console.log('PASS chưa đăng nhập không được gửi yêu cầu');

    // Đăng ký tài khoản mới và phân tách phiếu theo độc giả.
    await page.locator('#panel-login [data-switch="register"]').click();
    await page.locator('#regName').fill('Độc giả kiểm thử');
    await page.locator('#regId').fill('DEMO-TEST');
    await page.locator('#regEmail').fill('loan-test@example.com');
    await page.locator('#regPass').fill('demo123456');
    await page.locator('#regPass2').fill('demo123456');
    await page.locator('#registerForm button[type="submit"]').click();
    await waitText('loginNotice', 'Đăng ký thành công');
    await page.locator('#loginPassword').fill('demo123456');
    await page.locator('#loginForm button[type="submit"]').click();
    await page.locator('#appView').waitFor();
    await search();
    await openLoan();
    await submit(7);
    await waitText('loanSuccess', 'PENDING');
    await page.locator('#finishLoan').click();
    await page.locator('#logoutBtn').click();
    assert.equal(await page.evaluate(() => localStorage.getItem('ptit_token')), null);
    assert.equal(await count(), 1);
    await page.locator('[data-open="login"]').click();
    await page.locator('.chip[data-email="docgia@ptit.edu.vn"]').click();
    await page.locator('#loginForm button[type="submit"]').click();
    await page.locator('#appView').waitFor();
    await page.locator('[data-nav="mybooks"]').click();
    await waitText('myLoanList', 'chưa có sách');
    console.log('PASS đăng ký, đăng xuất, phiếu được tách riêng theo tài khoản');
    assert.deepEqual(apiRequests, []);
    assert.deepEqual(errors, []);
    console.log('PASS không gọi API, không có lỗi JavaScript');

    const filePage = await browser.newPage();
    const { pathToFileURL } = require('node:url');
    await filePage.goto(pathToFileURL(path.join(root, 'index.html')).href);
    await filePage.locator('[data-open="login"]').click();
    await filePage.locator('.chip[data-email="docgia@ptit.edu.vn"]').click();
    await filePage.locator('#loginForm button[type="submit"]').click();
    await filePage.locator('#appView').waitFor();
    await filePage.evaluate(() => PTIT.demo.loadScenario('ready'));
    await filePage.locator('[data-nav="search"]').click();
    await filePage.locator('#bookList .book-open').first().click();
    await filePage.locator('#registerLoanButton').click();
    await filePage.locator('input[name="loanDays"][value="7"]').check();
    await filePage.locator('#confirmLoanButton').click();
    await filePage.waitForFunction(() => document.getElementById('loanSuccess').textContent.includes('PENDING'));
    console.log('PASS mở index.html trực tiếp và mượn demo không cần máy chủ');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
