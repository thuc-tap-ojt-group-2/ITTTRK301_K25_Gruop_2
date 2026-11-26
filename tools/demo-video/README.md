# Công cụ làm video demo

Thư mục này chứa khung Giai đoạn 1 cho video demo. Không thay đổi frontend, backend, `.env` hoặc database.

## Chuẩn bị dữ liệu

1. Sao chép `.env.demo.example` thành `.env.demo`.
2. Điền tài khoản độc giả, READER3 và quản trị viên do dự án cung cấp.
3. Không commit `.env.demo`.
4. Cảnh ghi chỉ chạy sau khi xác nhận đã sao lưu database.

## Lệnh Giai đoạn 1

```powershell
cd tools/demo-video
npm.cmd install
npm.cmd run phase1
```

Tuy nhiên, bước cài thư viện chỉ được thực hiện sau xác nhận. Phiên bản hiện tại đã tạo `LOI-THOAI.md` và `demo.srt` bằng Node.js mà không cần thư viện ngoài.

```powershell
node run.js --voice-only
node run.js --dry
node run.js --scene 5
```

`--dry` chỉ liệt kê cảnh đọc; `--scene` quay sau khi Playwright được cài và cấu hình.
