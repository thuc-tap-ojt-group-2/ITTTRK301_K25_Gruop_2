# Thẻ nhớ bảo vệ — Nguyễn Hoàng Thành

## Phần của mình

Backend dữ liệu và nghiệp vụ: database/model, sách, thể loại, độc giả, tiền phạt, đặt trước/giữ chỗ, thống kê. Phân công này theo README; kiểm chứng thực tế bằng file/hàm và Git history.

## Bản đồ file và hàm phải mở

| Chủ đề | Mở nhanh |
|---|---|
| Model | `backend/app/models.py`: `Category`, `Book`, `Loan`, `Fine`, `Reservation`, `User` |
| Sách/tìm kiếm | `backend/app/crud.py`: `_normalize_search_text`, `get_books_paginated`, `create_book`, `update_book`, `delete_book` |
| Thể loại | `backend/app/crud.py`: `get_categories`, `create_category`, `update_category`, `delete_category` |
| Độc giả | `backend/app/routers/readers.py`: `get_readers`, `get_reader_loans`; `crud.py`: `get_readers`, `get_reader_loan_history` |
| Fine | `backend/app/services.py`: `FineService.calculate_fine`; `backend/app/crud.py`: `calculate_fine`, `mark_fine_as_paid`, `get_user_fines` |
| Reservation | `backend/app/reservation_service.py`: `create`, `sync_book`, `cancel`, `list_for_reader` |
| Stats | `backend/app/crud.py`: `get_stats_overview`, `get_top_borrowed_books`, `get_monthly_loan_stats`; `routers/stats.py` |
| Test | `backend/tests/test_books_and_stats.py`; `backend/tests/test_fines_and_reservations.py`; `backend/tests/test_auth_and_loans.py` return/queue cases |
| UI phối hợp | `frontend/books.js`, `readers.js`, `fines.js`, `dashboard.js` |

## 12 câu hỏi của Thành — đáp án lõi

1. **Book–Category nối ra sao?** `Book.category_id` FK tới Category; Category có relationship books. Mở `models.py:9,18`.
2. **Loan.user_id có FK không?** Hiện model khai báo BigInteger không ForeignKey; nói đúng code, không khẳng định database ngoài model. `models.py:38`.
3. **Search không dấu ở đâu?** `crud._normalize_search_text/get_books_paginated`; có test tìm “nguyen” ra “Nguyễn”. `crud.py:17`, test `test_auth_and_loans.py:346`.
4. **Pagination total lấy đâu?** Từ `PageResponse` do CRUD trả, không đếm trang hiện tại. `schemas.py:58`, `books.py:16`.
5. **Cập nhật copies?** Phân biệt total và available; duyệt loan giảm available, return tăng. `crud.py:221`, `loan_service.py:174,276`.
6. **Xóa category đang dùng?** Trả conflict khi còn sách liên kết. `crud.py:357`; test `test_books_and_stats.py:66`.
7. **Reader API có quyền nào?** Route readers giới hạn staff; hiện không có test endpoint riêng. `routers/readers.py:14,22`.
8. **Fine formula?** `max(0, overdue_days) * 5000`; đúng hạn/trả sớm = 0. `services.py:6,10`.
9. **Chặn thu fine trùng ở đâu?** `crud.mark_fine_as_paid` và trạng thái paid; test lần hai 409. `crud.py:504`; `test_fines_and_reservations.py:70`.
10. **48 giờ giữ chỗ có worker không?** Không thấy worker; `sync_book` được gọi khi nghiệp vụ/list chạy. `reservation_service.py:28,218`.
11. **Queue chọn ai trước?** `created_at`, rồi `id`; đổi WAITING→HOLDING, đặt expiry +48h. `reservation_service.py:28,64`.
12. **Stats test nói được gì?** Overview/top/monthly có unit test SQLite; không phải E2E MySQL/browser. `test_books_and_stats.py:132`.

## 10 con số phải thuộc

1. Tối đa **3** loan active mỗi độc giả.
2. Kỳ mượn chọn **7 / 14 / 30 ngày**.
3. Fine **5.000đ/ngày** quá hạn.
4. Hold reservation **48 giờ**.
5. JWT mặc định **24 giờ**.
6. Gia hạn cộng **7 ngày**.
7. Mỗi phiếu tối đa **1 lần** gia hạn.
8. Dashboard top sách tối đa **5**.
9. Thống kê tháng mặc định **6 tháng**.
10. Unit test hiện chạy **23/23**; coverage chưa đo.

## Điểm yếu phần mình — nói trung thực

- Chưa có test endpoint riêng cho độc giả; coverage chưa đo.
- Chưa có E2E MySQL/browser; test hiện dùng SQLite memory.
- Reservation 48h được đồng bộ theo request/nghiệp vụ, chưa thấy worker nền.
- SRS/backlog chính thức không nằm trong repo nên chưa thể chứng minh từng acceptance criterion.
- `Loan.user_id` trên model không khai báo FK; cần xác minh schema thật và cân nhắc ràng buộc nếu được giao.

**Câu trả lời thật:** “Phần code có luồng chính và unit test cho sách/thể loại, fine, reservation, stats; em chưa xác nhận toàn bộ trên MySQL và chưa đo coverage. Em xin mở đúng service/route và nói rõ phần test đang bao phủ.”

## Nếu nhóm trưởng bổ sung

Nhóm trưởng có thể bổ sung kiến trúc chung, luồng Loan→Fine/Reservation, quyền role và giới hạn test. Thành nên tự trả lời trải nghiệm triển khai CRUD/query/model của mình; không nhận thay kết quả MySQL nếu chưa chạy.
