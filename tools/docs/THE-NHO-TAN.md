# Thẻ nhớ bảo vệ — Hà Ngọc Hoàng Tân

## Phần của mình

Frontend thủ thư/admin: quản lý sách/thể loại, duyệt và nhận trả, độc giả/lịch sử, thu phạt, tài khoản, nhật ký và dashboard. README là phân công; backend API do Thành/Thông phối hợp.

## Bản đồ file và hàm phải mở

| Chủ đề | Mở nhanh |
|---|---|
| Sách/thể loại | `frontend/books.html`, `frontend/books.js`: `loadCategories`, `loadBooks`, `displayBooks`, `validateBook`, `removeBook` |
| Mượn/trả | `frontend/loans.html`, `frontend/loans.js`: `loadLoans`, `displayLoans`, `handleLoanAction` |
| Độc giả/lịch sử | `frontend/readers.html`, `frontend/readers.js`: `loadReaders`, `showReaderHistory` |
| Tiền phạt | `frontend/fines.html`, `frontend/fines.js`: `loadFines`, `renderFinePage` |
| Admin | `frontend/admin.html`, `frontend/admin.js`: `loadAdminUsers`, `loadAdminLogs`, `loadAdminData` |
| Dashboard | `frontend/dashboard.html`, `frontend/dashboard.js`: `loadDashboard`, `renderOverview`, unavailable renderers |
| API helpers | `frontend/api.js`: `approveLoanAPI`, `rejectLoanAPI`, `returnLoanAPI`, `getAdminUsers`, `getAdminLogs`, `getStatsOverview` |
| Backend partner | `routers/books.py`, `loans.py`, `readers.py`, `fines.py`, `admin.py`, `stats.py` |
| Kiểm thử | Không thấy automated frontend tests; backend tests không thay UI tests |

## 12 câu hỏi của Tân — đáp án lõi

1. **Books và categories tải riêng thế nào?** Mở `loadCategories/loadBooks`; nêu loading/error behavior đang có, không tự nhận API lỗi không ảnh hưởng nếu chưa thử.
2. **Tổng sách lấy từ đâu?** Pagination response field tổng; nếu không có, nhãn phải là “Trong trang này”.
3. **CRUD books/category quyền ở đâu?** UI gọi helper; backend route role `LIBRARIAN/ADMIN` bảo vệ thao tác.
4. **Approve loan làm gì?** UI gọi API, backend kiểm trạng thái/kho và cập nhật loan/book; UI reload response.
5. **Double click có được chặn không?** Chỉ trả lời sau khi mở action handler và xác nhận busy/disabled guard.
6. **Staff history bảo vệ ra sao?** API readers staff role; UI hiển thị reader/historical loans.
7. **Thu fine trùng xử lý thế nào?** API trả conflict nếu đã paid; UI phải hiện lỗi, không giả thành công.
8. **Admin đổi role/lock endpoint nào?** `/api/admin/users/{id}/role` và `/lock`; API chỉ admin.
9. **Audit log ai đọc được?** Admin-only endpoint; UI format actor/time từ response.
10. **Dashboard gọi gì?** Overview/top-books/monthly, và loan list cho mục due; từng API lỗi cần render fallback.
11. **API chết dashboard có số demo không?** Code hiện cần hiện `—`/thông báo/retry; không bịa số.
12. **UI đã automated test?** Không thấy suite; chỉ nói test thủ công có bằng chứng nếu đã chạy.

## 10 con số phải thuộc

1. Tối đa **3** loan active mỗi reader.
2. Kỳ mượn **7 / 14 / 30 ngày**.
3. Fine **5.000đ/ngày**.
4. Hold **48 giờ**.
5. JWT **24 giờ**.
6. Gia hạn **+7 ngày**.
7. Gia hạn tối đa **1 lần**.
8. Staff pages thường **10 dòng/trang**.
9. Dashboard top **5**, monthly **6 tháng**.
10. Test backend hiện **23/23**; UI test tự động chưa thấy.

## Điểm yếu phần mình — nói trung thực

- Không có automated frontend test/coverage.
- Chưa có bằng chứng tất cả responsive/network/error states đã được chụp trên máy bảo vệ.
- Admin/account/log/dashboard cần kiểm role trên API, không chỉ dựa menu UI.
- Dashboard stats phụ thuộc API response; số live chỉ đúng tại thời điểm query.

**Câu trả lời thật:** “Em phụ trách màn staff/admin, UI gọi API helper và hiển thị dữ liệu response; quyết định quyền và transaction nằm ở backend. Em chưa tuyên bố automated frontend test hoặc E2E nếu chưa có log/ảnh kiểm chứng.”

## Nếu nhóm trưởng bổ sung

Nhóm trưởng giải thích RBAC, API/service, commit transaction và giới hạn MySQL. Tân trả lời trực tiếp event handler, table/modal rendering, reload/error state và thao tác đã thực sự thử.
