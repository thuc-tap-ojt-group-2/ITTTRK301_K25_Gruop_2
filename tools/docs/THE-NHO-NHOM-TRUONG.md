# Thẻ nhớ bảo vệ — Nhóm trưởng Nguyễn Văn Thông

Tài liệu tham khảo đầy đủ: [Sổ tay mục 1–12 và 110 câu](./so-tay-bao-ve.md). Thẻ này là bản ôn nhanh; số liệu tiến độ/quy trình cần xác nhận với nhóm trước buổi bảo vệ.

## 11A — Bản đồ một phút

- **Reader:** `frontend/index.html` → `frontend/assets/js/script.js` → API helper → Auth/Books/Loans/Reservations/Fines routers → service/CRUD → database.
- **Librarian:** `books.js/loans.js/readers.js/fines.js` → books/loans/readers/fines API → CRUD/LoanService → stock/fine/queue/log.
- **Admin:** `admin.js/dashboard.js` → `/api/admin/*`, `/api/stats/*` → role guard → audit/stat queries.
- **Core:** FastAPI + SQLAlchemy + MySQL; HTML/CSS/JS; BCrypt/JWT; Docker Compose tồn tại nhưng chưa xác nhận chạy trên máy bảo vệ.
- **Owner map:** Thông Auth/Loan/Log; Thành DB/Books/Readers/Fine/Reservation/Stats; Đan Reader UI; Tân staff/admin UI. Shared files và integration có giao thoa.
- **Repo truth:** current branch `main`; no v1.0 tag; README progress cũ; SRS/backlog chính thức không có trong repo.

## 11B — 15 câu sâu phần nhóm trưởng

1. bcrypt một chiều? `hash_password/verify_password`.
2. JWT có `exp/jti` và lifetime? `create_access_token`, default 24h.
3. Token bị thu hồi ra sao? `logout` + `get_current_user`.
4. RBAC backend nằm đâu? `RoleChecker`.
5. Lock account có chặn token cũ không? dependency query `is_locked`.
6. BR01 đếm trạng thái gì? `PENDING/BORROWING`, max 3.
7. Vì sao request chưa trừ kho? approve mới decrement.
8. Approve khóa loan/book và kiểm gì? status/available/holds.
9. Return liên hệ fine/reservation/log ra sao? cùng session trước commit.
10. Gia hạn giới hạn gì? loan BORROWING/not overdue/once/+7, queue check.
11. Log có bao phủ hết không? chưa chứng minh; nói các luồng đã thấy.
12. SQLite unit test có chứng minh MySQL locking không? không.
13. NFR-02 đạt không? chưa xác định, thiếu SRS gốc.
14. README nào cũ? claims about secret/CORS contradicted by current code; test count 18 is stale vs current 23.
15. Có v1.0/E2E/coverage? tag absent, E2E unverified, coverage not installed/measured.

## 12 — Điều phối trên sân khấu

- 0:00 Thông mở đầu/stack/Auth/Loan.
- 3:30 Thành DB/Book/Fine/Reservation/Stats.
- 6:30 Đan reader.
- 8:30 Tân librarian/admin.
- 11:00 Tân thao tác demo, Thông điều phối.
- Operator: Tân; chuẩn bị riêng browser profile và DB demo backup.
- Plan B: video/ảnh đã kiểm tra; dừng retry khi lỗi để tránh ghi trùng; nói rõ code evidence khác live demo.
- Bí câu: xin phép bổ sung phần tổng thể, mời owner chỉ đúng hàm; không giả làm người trực tiếp triển khai.
- Câu “em không biết”: “Em chưa xác minh; điều em xác nhận được là … ở file/hàm …; nhóm sẽ kiểm tra tiếp.”

## 25 quy trình (71–95) — nhắc nhanh

Không khẳng định board/DoD/chế tài chưa có evidence. Nêu README phân công/feature branch/PR; Git history có merge; trạng thái snapshot 15/18-11 cũ; không tag v1.0; Spring→FastAPI chưa có quyết định lưu trong repo; nếu người vắng/trễ thì bàn giao thật, chia critical path, không đánh dấu done khi chưa test. Xem sổ tay Q71–Q95 cho câu trả lời đầy đủ.

## 15 câu tổng thể (96–110) — nhắc nhanh

1. Request→PENDING→approve→stock.
2. BR01 loan khác reservation.
3. Overdue chặn loan mới; fine chốt khi return.
4. Active hold giảm số bản khả dụng cho người khác.
5. Return sync queue 48h.
6. Cancel loan chỉ PENDING; cancel reservation trạng thái active.
7. UI role không thay backend RBAC.
8. Lock user khác revoke một JWT.
9. Logout ghi jti+audit.
10. Fine one per loan, 5.000đ/ngày.
11. Public stats khác staff stats.
12. Top books vs monthly vs overview không cùng phép đo.
13. Reader book count khác total copies.
14. `create_all` lúc import là rủi ro startup.
15. Khi số liệu lệch, trace API→query→render, không sửa số cứng.

## 10 con số

**3** active loans · **7/14/30** ngày mượn · **5.000đ/ngày** · **48h** hold · **24h** JWT · **+7 ngày** gia hạn · **1 lần** gia hạn · top **5** · **6 tháng** stats · **23/23** unit tests hiện pass.

## Điểm yếu phải chủ động nói

Thiếu SRS/NFR-02 chính thức; README lệch trạng thái; coverage chưa đo; frontend tests không thấy; E2E MySQL/Docker trên máy bảo vệ chưa xác nhận; `main.py` gọi `create_all` khi import; video/demo cần kiểm tra bản mới nhất trước khi dùng.

**Câu chốt:** “Nhóm trình bày phần có code/test và nói rõ phần chưa kiểm chứng; mong nhận góp ý để hoàn thiện đối chiếu SRS và E2E.”
