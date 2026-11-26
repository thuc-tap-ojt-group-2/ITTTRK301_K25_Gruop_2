import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const script = JSON.parse(fs.readFileSync(path.join(here, "script.json"), "utf8"));
const pronounce = JSON.parse(fs.readFileSync(path.join(here, "pronounce.json"), "utf8"));
const args = new Set(process.argv.slice(2));
const sceneArgIndex = process.argv.findIndex((arg) => arg === "--scene");
const sceneId = sceneArgIndex >= 0 ? process.argv[sceneArgIndex + 1] : null;
const allowWrite = args.has("--allow-write");

function applyPronunciation(text) {
  let output = text;
  for (const [from, to] of Object.entries(pronounce).sort((a, b) => b[0].length - a[0].length)) {
    output = output.replaceAll(from, to);
  }
  return output;
}

const selected = sceneId ? script.filter((scene) => scene.id === sceneId) : script;
if (sceneId && selected.length === 0) {
  console.error(`Không tìm thấy cảnh ${sceneId}`);
  process.exit(1);
}

fs.mkdirSync(path.join(here, "audio"), { recursive: true });

function readDemoEnv() {
  const envPath = path.join(here, ".env.demo");
  if (!fs.existsSync(envPath)) return null;
  const values = {};
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) values[match[1].trim()] = match[2].trim();
  }
  return values;
}

async function typeNaturally(page, locator, text) {
  await locator.click();
  await locator.fill("");
  for (const char of text) {
    await page.keyboard.insertText(char);
    await page.waitForTimeout(60 + Math.floor(Math.random() * 30));
  }
}

async function recordBrowserScene(scene) {
  const env = readDemoEnv();
  if (!env) {
    console.log(`Cảnh ${scene.id}: chưa có tools/demo-video/.env.demo.`);
    return;
  }
  const { chromium } = await import("playwright");
  fs.mkdirSync(path.join(here, "recordings"), { recursive: true });
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    locale: "vi-VN",
    timezoneId: "Asia/Ho_Chi_Minh",
    recordVideo: { dir: path.join(here, "recordings"), size: { width: 1920, height: 1080 } }
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const base = "http://127.0.0.1:5500";

  if (scene.id === "1") {
    await page.goto(`${base}/login.html`);
    await page.waitForLoadState("networkidle");
    await typeNaturally(page, page.locator("#username"), env.READER_EMAIL);
    await page.waitForTimeout(500);
    await typeNaturally(page, page.locator("#password"), env.READER_PASSWORD);
    await page.waitForTimeout(700);
    await page.locator("#submitButton").click();
    await page.waitForURL(/index\.html|dashboard\.html/, { timeout: 15000 }).catch(() => {});
  } else if (scene.id === "2") {
    await page.goto(`${base}/login.html`);
    await page.waitForLoadState("networkidle");
    await typeNaturally(page, page.locator("#username"), env.READER_EMAIL);
    await typeNaturally(page, page.locator("#password"), env.READER_PASSWORD);
    await page.locator("#submitButton").click();
    await page.waitForURL(/index\.html/, { timeout: 15000 }).catch(() => {});
    await page.goto(`${base}/index.html`);
    await page.waitForLoadState("networkidle");
    await page.locator('[data-nav="search"]').click();
    await page.locator("#page-search").waitFor({ state: "visible", timeout: 15000 });
    const searchInput = page.locator("#searchInput").first();
    await searchInput.waitFor({ state: "visible", timeout: 15000 }).catch(() => {});
    await typeNaturally(page, searchInput, "nguyen");
    await page.waitForTimeout(500);
    await page.locator("#searchForm button[type=submit]").first().click();
  } else if (scene.id === "8") {
    await page.goto(`${base}/login.html`);
    await page.waitForLoadState("networkidle");
    await typeNaturally(page, page.locator("#username"), env.ADMIN_LOGIN);
    await typeNaturally(page, page.locator("#password"), env.ADMIN_PASSWORD);
    await page.locator("#submitButton").click();
    await page.waitForURL(/dashboard\.html/, { timeout: 15000 }).catch(() => {});
    await page.goto(`${base}/dashboard.html`);
    await page.waitForLoadState("networkidle");
  } else if (scene.id === "9") {
    await page.goto(`${base}/login.html`);
    await page.waitForLoadState("networkidle");
    await typeNaturally(page, page.locator("#username"), env.ADMIN_LOGIN);
    await typeNaturally(page, page.locator("#password"), env.ADMIN_PASSWORD);
    await page.locator("#submitButton").click();
    await page.waitForURL(/dashboard\.html/, { timeout: 15000 }).catch(() => {});
    await page.goto(`${base}/admin.html`);
    await page.waitForLoadState("networkidle");
  } else if (scene.id === "3") {
    await page.goto(`${base}/login.html`);
    await page.waitForLoadState("networkidle");
    await typeNaturally(page, page.locator("#username"), env.READER_EMAIL);
    await typeNaturally(page, page.locator("#password"), env.READER_PASSWORD);
    await page.locator("#submitButton").click();
    await page.waitForURL(/index\.html/, { timeout: 15000 }).catch(() => {});
    await page.goto(`${base}/index.html`);
    await page.locator('[data-nav="search"]').click();
    await page.locator("#page-search").waitFor({ state: "visible", timeout: 15000 });
    const availableCard = page.locator("#bookList .book-card").filter({ hasText: "Còn" }).first();
    await availableCard.waitFor({ state: "visible", timeout: 15000 });
    await availableCard.locator(".book-open").click();
    await page.locator("#registerLoanButton").waitFor({ state: "visible", timeout: 15000 });
    await page.locator("#registerLoanButton").click();
    await page.locator('input[name="loanDays"][value="14"]').check();
    await page.locator("#confirmLoanButton").click();
    await page.locator("#loanResult").waitFor({ state: "visible", timeout: 15000 }).catch(() => {});
  } else if (scene.id === "5") {
    await page.goto(`${base}/login.html`);
    await page.waitForLoadState("networkidle");
    await typeNaturally(page, page.locator("#username"), env.ADMIN_LOGIN);
    await typeNaturally(page, page.locator("#password"), env.ADMIN_PASSWORD);
    await page.locator("#submitButton").click();
    await page.waitForURL(/dashboard\.html/, { timeout: 15000 }).catch(() => {});
    await page.goto(`${base}/loans.html`);
    await page.waitForLoadState("networkidle");
    const approve = page.locator('[data-action="approve"]').first();
    if (await approve.count()) {
      await approve.click();
      await page.locator(".ptit-confirm-ok").click();
      await page.waitForTimeout(1000);
    }
  } else if (scene.id === "7") {
    await page.goto(`${base}/login.html`);
    await page.waitForLoadState("networkidle");
    await typeNaturally(page, page.locator("#username"), env.ADMIN_LOGIN);
    await typeNaturally(page, page.locator("#password"), env.ADMIN_PASSWORD);
    await page.locator("#submitButton").click();
    await page.waitForURL(/dashboard\.html/, { timeout: 15000 }).catch(() => {});
    await page.goto(`${base}/books.html`);
    await page.waitForLoadState("networkidle");
    const deleteButton = page.locator('button[data-action="delete"]').first();
    await deleteButton.waitFor({ state: "visible", timeout: 15000 });
    await deleteButton.click();
    await page.locator(".ptit-confirm-ok").click();
    await page.waitForTimeout(1500);
  }

  await page.waitForTimeout(scene.seconds * 1000);
  await context.close();
  await browser.close();
  console.log(`Đã quay cảnh ${scene.id} trong tools/demo-video/recordings/.`);
}

if (!args.has("--voice-only") && (args.has("--scene") || sceneId)) {
  const scene = selected[0];
  if (!scene) {
    console.error(`Không tìm thấy cảnh ${sceneId}`);
    process.exit(1);
  }
  if (scene.write) {
    if (!allowWrite) {
      console.error(`Cảnh ${scene.id} là cảnh ghi. Chạy Giai đoạn 3 bằng --allow-write sau khi xác nhận sao lưu database.`);
      process.exit(3);
    }
  }
  if (/^0\./.test(scene.id) || scene.id === "10") {
    const { chromium } = await import("playwright");
    fs.mkdirSync(path.join(here, "recordings"), { recursive: true });
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
      locale: "vi-VN",
      timezoneId: "Asia/Ho_Chi_Minh",
      recordVideo: { dir: path.join(here, "recordings"), size: { width: 1920, height: 1080 } }
    });
    const page = await context.newPage();
    await page.goto(`file://${path.join(here, "cards.html").replace(/\\/g, "/")}?id=${encodeURIComponent(scene.id)}`);
    await page.waitForTimeout(scene.seconds * 1000);
    await context.close();
    await browser.close();
    console.log(`Đã quay thẻ cảnh ${scene.id} trong tools/demo-video/recordings/.`);
    process.exit(0);
  }
  if (["1", "2", "3", "5", "7", "8", "9"].includes(scene.id)) {
    await recordBrowserScene(scene);
    process.exit(0);
  }
  if (["4", "6"].includes(scene.id)) {
    console.log(`Cảnh ${scene.id} bị bỏ: dữ liệu demo không đáp ứng điều kiện bắt buộc.`);
    process.exit(0);
  }
  console.log(`Cảnh ${scene.id} thuộc Giai đoạn ghi; chưa khởi chạy.`);
  process.exit(0);
}

if (args.has("--voice-only")) {
  const blocks = [];
  const srt = [];
  let srtTime = 0;

  for (const scene of selected) {
    const end = srtTime + scene.seconds * 1000;
    blocks.push([
      `## Cảnh ${scene.id} — ${scene.name}`,
      `Người đọc: ${scene.speaker || "Mặc định"}`,
      `Thời lượng mục tiêu: ${scene.seconds} giây`,
      `Việc cần làm: ${scene.action}`,
      `Lời đọc: ${scene.voice}`,
      `Phụ đề: ${scene.caption}`,
      `Chế độ ghi: ${scene.write ? "CÓ - cần xác nhận đã sao lưu database" : "KHÔNG"}`
    ].join("\n"));

    srt.push(String(srt.length + 1));
    srt.push(`${formatSrtTime(srtTime)} --> ${formatSrtTime(end)}`);
    srt.push(applyPronunciation(scene.caption));
    srt.push("");
    srtTime = end;
  }

  fs.writeFileSync(path.join(here, "LOI-THOAI.md"), blocks.join("\n\n") + "\n", "utf8");
  fs.writeFileSync(path.join(here, "demo.srt"), srt.join("\n"), "utf8");
  console.log(`Đã tạo LOI-THOAI.md và demo.srt cho ${selected.length} cảnh.`);
  console.log("Chưa tạo giọng đọc vì chưa có xác nhận cài/đọc dịch vụ giọng.");
  console.log("Cảnh ghi yêu cầu xác nhận đã sao lưu database trước Giai đoạn 3.");
  process.exit(0);
}

if (args.has("--dry")) {
  console.log("Chế độ --dry chỉ chạy cảnh đọc. Các cảnh ghi sẽ bị bỏ qua.");
  const readScenes = selected.filter((scene) => !scene.write);
  console.log(readScenes.map((scene) => `Cảnh ${scene.id}: ${scene.name}`).join("\n"));
  process.exit(0);
}

console.error("Chưa có Playwright runtime ở Giai đoạn 1.");
console.error("Chạy: node run.js --voice-only");
process.exit(2);

function formatSrtTime(ms) {
  const hours = Math.floor(ms / 3600000);
  ms %= 3600000;
  const minutes = Math.floor(ms / 60000);
  ms %= 60000;
  const seconds = Math.floor(ms / 1000);
  const millis = ms % 1000;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(millis, 3)}`;
}

function pad(value, length = 2) {
  return String(value).padStart(length, "0");
}
