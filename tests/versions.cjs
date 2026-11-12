const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const results=[];
  try {
    const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../delivery/manifest.json'),'utf8'));
    for(const entry of manifest) {
      const context=await browser.newContext({viewport:{width:1440,height:960}});
      const page=await context.newPage(); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
      const location=process.argv.includes('--installed')?entry.target:entry.staged;
      await page.goto(pathToFileURL(path.join(location,'index.html')).href);
      async function login(email){await page.locator('[data-open="login"]').click();await page.locator('#loginEmail').fill(email);await page.locator('#loginPassword').fill('123456');await page.locator('#loginForm button[type="submit"]').click();await page.locator('#appView').waitFor();}
      await login('thuthu@ptit.edu.vn');
      for(const key of ['staffOverview','manageBooks','approvals','circulation','readers','fines']){
        await page.locator(`[data-nav="${key}"]`).click();
        await page.waitForFunction(id=>document.getElementById(id).getAttribute('aria-busy')==='false',key==='readers'?'readersList':key+'Content');
        assert.equal(await page.locator('#page-'+key).isVisible(),true);
        assert.doesNotMatch(await page.locator('#page-'+key).textContent(),/Không thể đọc|Chỉ thủ thư|Không tìm thấy API/);
      }
      await page.locator('[data-nav="readers"]').click(); await page.waitForFunction(()=>document.getElementById('readersList').getAttribute('aria-busy')==='false');
      await page.locator('#readersSearch').fill('nguyen hoang'); await page.waitForFunction(()=>document.getElementById('readersList').getAttribute('aria-busy')==='false');
      assert.equal(await page.locator('#readersList tbody tr').count(),1);
      await page.locator('#readersList button').click();await page.waitForFunction(()=>document.getElementById('readerHistoryList').getAttribute('aria-busy')==='false');
      assert.match(await page.locator('#readerHistoryIdentity').textContent(),/B22DCCN101/);await page.keyboard.press('Escape');
      await page.reload();await page.waitForFunction(()=>document.getElementById('staffOverviewContent').getAttribute('aria-busy')==='false');
      await page.locator('#themeButton').click();
      assert.equal(await page.locator('#sidebar').evaluate(n=>getComputedStyle(n).color),'rgb(255, 255, 255)');
      await page.locator('#logoutBtn').click();await login('docgia@ptit.edu.vn');
      assert.equal(await page.locator('#page-overview').isVisible(),true);assert.equal(await page.locator('.sidebar-menu .menu-item:visible').count(),3);
      await page.locator('[data-nav="search"]').click();await page.locator('#bookList .book-open').first().waitFor();
      await page.locator('[data-nav="mybooks"]').click(); await page.locator('#myLoanList tbody tr').first().waitFor();
      const denied=await page.evaluate(()=>PTIT.authRequest('/readers'));assert.equal(denied.status,403);
      assert.deepEqual(errors,[]);results.push({name:entry.name,path:location,status:'PASS'});console.log('PASS',entry.name,location);
      await context.close();
    }
    fs.writeFileSync(path.join(__dirname,process.argv.includes('--installed')?'installed-results.json':'staged-results.json'),JSON.stringify(results,null,2));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
