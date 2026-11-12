const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const report = { browser: browser.version(), viewport: '1912x910', tests: [], search: [] };
  const output = path.join(__dirname, 'screenshots'); fs.mkdirSync(output, { recursive: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1912, height: 910 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    await page.route('https://fonts.gstatic.com/**', route => route.abort());
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    async function login(email) {
      await page.locator('[data-open="login"]').click();
      await page.locator('#loginEmail').fill(email); await page.locator('#loginPassword').fill('123456');
      await page.locator('#loginForm button[type="submit"]').click(); await page.locator('#appView').waitFor();
    }
    const ready = id => page.waitForFunction(id => document.getElementById(id).getAttribute('aria-busy') === 'false', id);
    async function nav(key) { await page.locator(`[data-nav="${key}"]`).click(); await ready(key === 'readers' ? 'readersList' : key + 'Content'); }
    const api = (url, options = {}) => page.evaluate(({ url, options }) => PTIT.authRequest(url, options), { url, options });
    const pass = text => { report.tests.push(text); console.log('PASS', text); };
    await login('thuthu@ptit.edu.vn'); await ready('staffOverviewContent');
    assert.equal(await page.locator('.sidebar-menu .menu-item:visible').count(), 6);
    assert.match(await page.locator('#staffOverviewTitle').textContent(), /Trần Thị Thủ Thư/);
    for (const key of ['staffOverview', 'manageBooks', 'approvals', 'circulation', 'readers', 'fines']) {
      await nav(key); await page.screenshot({ path: path.join(output, key + '.png'), fullPage: true });
      assert.ok((await page.locator('#page-' + key).textContent()).length > 100);
    }
    await nav('readers');
    assert.equal(await page.locator('#readersList tbody tr').count(), 2);
    assert.match(await page.locator('#readersCount').textContent(), /^2 thành viên$/);
    for (const [email, count] of [['docgia@ptit.edu.vn', '1'], ['ha@stu.ptit.edu.vn', '2']]) {
      assert.equal(await page.locator(`[data-reader-email="${email}"] td`).nth(3).textContent(), count);
    }
    pass('6 màn hình, menu thủ thư riêng, số độc giả và sách chưa trả (gồm quá hạn)');
    await page.locator('#readersList button').first().click(); await ready('readerHistoryList');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.getElementById('readerHistoryDialog').contains(document.activeElement)), true);
    assert.match(await page.locator('#readerHistoryIdentity').textContent(), /Nguyễn Hoàng An.*B22DCCN101/);
    const ids = []; do {
      ids.push(...await page.locator('#readerHistoryList tbody tr').evaluateAll(rows => rows.map(row => row.dataset.loanId)));
      const next = page.locator('#readerHistoryPagination button').filter({ hasText: 'Sau' });
      if (await next.count() === 0 || await next.isDisabled()) break;
      await next.click(); await ready('readerHistoryList');
    } while (true);
    const expected = await page.evaluate(() => readDemoLoans().filter(l => l.userEmail === 'docgia@ptit.edu.vn').sort((a,b) => String(b.createdAt).localeCompare(String(a.createdAt)) || String(b.id).localeCompare(String(a.id))).map(l => l.id));
    assert.deepEqual(ids, expected);
    await page.screenshot({ path: path.join(output, 'history.png') });
    await page.keyboard.press('Escape'); assert.equal(await page.locator('#readerHistoryDialog').evaluate(d => d.open), false);
    pass('Lịch sử đúng người, đủ mọi trang, mới nhất trước, Escape đóng và trả tiêu điểm');
    await page.evaluate(() => {
      window.beforeHistoryTests = localStorage.getItem(DEMO_LOANS_KEY);
      const base = {userEmail:'docgia@ptit.edu.vn',bookId:1,bookTitle:'Sách thử lịch sử',createdAt:'2099-01-01',dueDate:null,returnDate:null,days:14};
      localStorage.setItem(DEMO_LOANS_KEY,JSON.stringify([...readDemoLoans(),{...base,id:'TEST-CANCELLED',status:'CANCELLED'},{...base,id:'TEST-REJECTED',status:'REJECTED'}]));
    });
    await page.locator('#readersList button').first().click(); await ready('readerHistoryList');
    assert.match(await page.locator('#readerHistoryList').textContent(),/Đã hủy/); assert.match(await page.locator('#readerHistoryList').textContent(),/Từ chối/);
    await page.keyboard.press('Escape');
    await page.evaluate(() => localStorage.setItem(DEMO_LOANS_KEY,window.beforeHistoryTests));
    // Đổi người trong khi request trước đang chạy: không lẫn dữ liệu.
    await page.locator('#readersList button').first().click(); await page.keyboard.press('Escape');
    await page.locator('#readersList button').nth(1).click(); await ready('readerHistoryList');
    assert.match(await page.locator('#readerHistoryIdentity').textContent(),/Lê Thu Hà/);
    assert.equal(await page.locator('#readerHistoryList [data-loan-id^="STAFF-HISTORY-0"]').count(),0);
    await page.keyboard.press('Escape');
    await page.evaluate(() => { localStorage.setItem(DEMO_LOANS_KEY,'[]'); });
    await page.locator('#readersList button').first().click(); await ready('readerHistoryList');
    assert.match(await page.locator('#readerHistoryList').textContent(),/chưa có lịch sử/); await page.keyboard.press('Escape');
    await page.evaluate(() => localStorage.setItem(DEMO_LOANS_KEY,'{bad'));
    await page.locator('#readersList button').first().click(); await ready('readerHistoryList');
    assert.match(await page.locator('#readerHistoryList').textContent(),/Không thể đọc/);
    await page.evaluate(() => localStorage.setItem(DEMO_LOANS_KEY,window.beforeHistoryTests));
    await page.locator('#readerHistoryList button').click(); await ready('readerHistoryList');
    await page.keyboard.press('Escape');
    pass('Lịch sử có CANCELLED/REJECTED, rỗng/lỗi/Thử lại, đổi người khi đang tải và giữ bàn phím trong dialog');

    // Đo ở trình duyệt từ input cuối tới DOM mới được vẽ (2 animation frames), gồm debounce 180ms và service 400ms.
    async function measure(term, dataset) {
      const ms = await page.evaluate(term => new Promise(resolve => {
        const input = document.getElementById('readersSearch'), holder = document.getElementById('readersList');
        const start = performance.now();
        const observer = new MutationObserver(() => {
          if (holder.getAttribute('aria-busy') === 'false') { observer.disconnect(); requestAnimationFrame(() => requestAnimationFrame(() => resolve(performance.now() - start))); }
        });
        observer.observe(holder, { attributes: true, attributeFilter: ['aria-busy'] });
        input.value = term; input.dispatchEvent(new Event('input', { bubbles: true }));
      }), term);
      report.search.push({ dataset, term, milliseconds: Math.round(ms * 10) / 10 }); assert.ok(ms < 1000, `Search ${ms}ms`);
    }
    for (const term of ['  NGUYEN HOANG  ', 'b22dccn142', 'không tồn tại', '']) await measure(term, '2 readers, 27 loans');
    assert.equal(await page.locator('#readersList tbody tr').count(), 2);
    // Lỗi lưu trữ không được âm thầm trả danh sách rỗng.
    await page.evaluate(() => { window.savedLoans = localStorage.getItem(DEMO_LOANS_KEY); localStorage.setItem(DEMO_LOANS_KEY, '{bad'); });
    await nav('readers'); assert.match(await page.locator('#readersList').textContent(), /Không thể đọc/);
    await page.evaluate(() => localStorage.setItem(DEMO_LOANS_KEY, window.savedLoans));
    await page.locator('#readersList button').click(); await ready('readersList');
    pass('Tìm tên không dấu, mã SV, rỗng, không khớp; lỗi tải và Thử lại');

    // Dữ liệu lớn chỉ nằm trong browser context kiểm thử.
    await page.evaluate(() => {
      window.originalUsers = localStorage.getItem(MOCK_USERS_KEY);
      const users = readReaderUsers();
      for (let i=0;i<1000;i++) users.push({ fullName: `Bạn đọc ${i}`, studentId: `TEST${i}`, email: `reader${i}@example.com`, role:'READER', status:i === 999 ? 'LOCKED' : 'ACTIVE' });
      localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
      const loans = readDemoLoans();
      for(let i=0;i<5000;i++) loans.push({ id:`PERF-${i}`, userEmail:`reader${i%1000}@example.com`, bookId:1, bookTitle:'Sách kiểm thử', status:i%2 ? 'RETURNED':'BORROWING', createdAt:'2026-01-01', dueDate:'2000-01-01', returnDate:i%2?'2026-01-15':null });
      localStorage.setItem(DEMO_LOANS_KEY, JSON.stringify(loans));
    });
    await nav('readers'); await page.locator('#readersPagination button').filter({hasText:'Sau'}).click(); await ready('readersList');
    for (const term of ['TEST999','ban doc 999','TEST998','zzzz','']) await measure(term, '1002 readers, 5027 loans');
    await measure('TEST999', '1002 readers, 5027 loans');
    assert.equal(await page.locator('#readersList tbody tr').count(), 1);
    assert.match(await page.locator('#readersList').textContent(), /Đã khóa/);
    assert.match(await page.locator('#readersCount').textContent(), /^1 kết quả \/ 1002/);
    await page.locator('#clearReadersSearch').click(); await ready('readersList');
    assert.equal(await page.locator('#readersPagination [aria-current="page"]').textContent(), '1');
    await page.locator('#readersSearch').fill('TEST990'); await page.waitForTimeout(210); await page.locator('#readersSearch').fill('TEST999'); await ready('readersList');
    assert.match(await page.locator('#readersList').textContent(), /TEST999/); assert.doesNotMatch(await page.locator('#readersList').textContent(), /TEST990/);
    pass('Tìm trên toàn bộ 1002 độc giả, reset trang, trạng thái khóa, chống phản hồi cũ; mọi mẫu đo <1 giây');
    await page.evaluate(() => { localStorage.setItem(MOCK_USERS_KEY,window.originalUsers); localStorage.setItem(DEMO_LOANS_KEY,window.savedLoans); });

    await nav('approvals');
    const approve = page.locator('[data-staff-id="STAFF-PENDING-0"] button').filter({hasText:/^Duyệt$/});
    await approve.click(); await page.locator('#staffActionConfirm').click(); await page.waitForFunction(() => !document.getElementById('staffActionDialog').open); await ready('approvalsContent');
    assert.equal(await page.locator('[data-staff-id="STAFF-PENDING-0"]').count(), 0);
    assert.equal((await api('/librarian/loans/STAFF-PENDING-0/approve',{method:'PATCH'})).status,409);
    await page.locator('[data-staff-id="STAFF-PENDING-1"] button').filter({hasText:'Từ chối'}).click(); await page.locator('#staffActionConfirm').click(); await page.waitForFunction(() => !document.getElementById('staffActionDialog').open); await ready('approvalsContent');
    assert.match(await page.locator('#approvalsContent').textContent(), /Không có đăng ký/);
    const before = (await api('/librarian')).data.books.find(b=>b.id===4).availableCopies;
    const returned = await api('/librarian/loans/STAFF-CURRENT-1-0/return',{method:'PATCH'});
    assert.equal(returned.data.status,'RETURNED'); assert.equal(returned.data.fine,30000);
    assert.equal((await api('/librarian')).data.books.find(b=>b.id===4).availableCopies,before+1);
    assert.equal((await api('/librarian/loans/STAFF-CURRENT-1-0/return',{method:'PATCH'})).status,409);
    assert.equal((await api('/librarian/books/1',{method:'DELETE'})).status,409);
    await nav('manageBooks'); await page.locator('#staffAddBook').click();
    await page.locator('#staffBook-title').fill('Sách kiểm thử mới'); await page.locator('#staffBook-author').fill('Tác giả'); await page.locator('#staffBook-category').fill('Công nghệ'); await page.locator('#staffBook-copies').fill('3'); await page.locator('#staffActionConfirm').click();
    await page.waitForFunction(() => !document.getElementById('staffActionDialog').open); await ready('manageBooksContent');
    await page.locator('#staffBookSearch').fill('Sách kiểm thử mới'); await ready('manageBooksContent');
    assert.match(await page.locator('#manageBooksContent').textContent(), /3\/3/);
    await page.reload(); await ready('staffOverviewContent'); await nav('manageBooks'); await page.locator('#staffBookSearch').fill('Sách kiểm thử mới'); await ready('manageBooksContent');
    await page.locator('#manageBooksContent tbody button').click(); await page.locator('#staffActionConfirm').click(); await page.waitForFunction(() => !document.getElementById('staffActionDialog').open); await ready('manageBooksContent');
    assert.match(await page.locator('#manageBooksContent').textContent(), /Chưa có dữ liệu/);
    pass('Duyệt/từ chối, nhận trả tính phạt và tồn kho, chống xử lý lặp, thêm/xóa sách và lưu qua reload');

    await nav('readers'); await page.locator('#themeButton').click(); await page.screenshot({path:path.join(output,'readers-dark.png')});
    assert.equal(await page.locator('#sidebar').evaluate(node=>getComputedStyle(node).color),'rgb(255, 255, 255)');
    await page.setViewportSize({width:390,height:844}); await page.waitForTimeout(300); await page.screenshot({path:path.join(output,'readers-mobile.png'),animations:'disabled'});
    assert.ok(await page.locator('#sidebar').evaluate(node=>node.getBoundingClientRect().right<=1));
    await page.locator('#menuToggle').click(); await page.waitForTimeout(300);
    await page.locator('[data-nav="readers"]').click(); await ready('readersList');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),true);
    await page.locator('#readersList button').first().click(); await ready('readerHistoryList'); await page.screenshot({path:path.join(output,'history-mobile.png')});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),true); await page.keyboard.press('Escape');
    await page.setViewportSize({width:1912,height:910}); await page.locator('#logoutBtn').click();
    assert.equal((await api('/readers')).status,401);
    await page.keyboard.press('Escape'); await login('docgia@ptit.edu.vn');
    assert.equal(await page.locator('[data-nav="readers"]').isVisible(),false);
    for(const url of ['/readers','/readers/docgia%40ptit.edu.vn/loans','/librarian']) assert.equal((await api(url)).status,403);
    assert.equal((await api('/librarian/loans/STAFF-PENDING-0/return',{method:'PATCH'})).status,403);
    await page.evaluate(() => navigate('readers')); assert.equal(await page.locator('#page-readers').isVisible(),false);
    assert.deepEqual(errors,[]); pass('Mobile/sáng-tối, chặn điều hướng và service trực tiếp cho độc giả/khách, không lỗi JavaScript');
    fs.writeFileSync(path.join(__dirname,'librarian-results.json'),JSON.stringify(report,null,2));
    console.log('Search ms:',report.search.map(s=>s.milliseconds).join(', '));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode=1; });
