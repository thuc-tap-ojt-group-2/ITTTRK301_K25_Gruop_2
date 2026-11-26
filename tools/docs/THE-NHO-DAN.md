# Thẻ nhớ bảo vệ — Huỳnh Hồ Nhĩ Đan

## Phần của mình

Frontend độc giả: đăng nhập/đăng ký, tra cứu/chi tiết sách, sách của tôi, đặt trước, đổi mật khẩu, trang độc giả và tiền phạt. Theo README và SRS nhóm cung cấp; xác nhận file thực tế trước khi trình bày vì repository có hai cây frontend.

## Bản đồ file và hàm phải mở

| Chủ đề | Mở nhanh |
|---|---|
| Reader entry | `frontend/index.html`; script `frontend/assets/js/script.js` |
| Auth/session | `getToken`, `getUser`, `request`, `authRequest`, `showApp`, `logout` |
| Search | `fetchBooksPage`, `fetchAllBooks`, `loadBooks`, `renderBooks`, `applySearch` |
| Chi tiết/mượn | `openBookDetail`, submit handler, `LOAN_DAYS`, `ACTIVE_LOAN_STATUSES` |
| My loans/reservations/fines | `loadReaderData`, `renderMyLoans`, `cancelLoanRequest`, `cancelReservationRequest` |
| Password/theme | `changePassword` trong `frontend/api.js`; `applyTheme`; `frontend/assets/js/ui.js` |
| Hợp đồng API | `frontend/api.js`: `getBooks`, `getMyFines`, `getMyReservations`, `createReservation`, `changePassword` |
| Backend partner | `backend/app/routers/auth.py`, `loans.py`, `reservations.py`, `fines.py` |
| Kiểm thử | Chưa thấy automated frontend test; nêu manual evidence thật nếu có |

## 12 câu hỏi của Đan — đáp án lõi

1. **Trang độc giả khởi tạo thế nào?** `index.html` nạp CSS/JS; `showApp` bật app khi session hợp lệ. Backend vẫn kiểm tra quyền.
2. **Token lưu ở đâu?** Key `ptit_token`, user `ptit_user`; không chụp/ghi token ra slide.
3. **Search xử lý phân trang ra sao?** `fetchBooksPage` gọi trang; `fetchAllBooks` tải thêm trang khi cần; không cộng trang hiện tại thành tổng.
4. **Khi API lỗi/trống?** Chỉ mô tả trạng thái code đã có và browser evidence thật; không dùng data mock để nói là live.
5. **Tạo loan ngày nào hợp lệ?** 7/14/30; backend tự validate, frontend chỉ hỗ trợ nhập.
6. **Kho sách giảm khi nào?** Sau khi thủ thư approve, không phải khi reader gửi request.
7. **Hủy loan được khi nào?** Chỉ `PENDING` của chính user.
8. **Reservation khác loan thế nào?** Queue `WAITING/HOLDING`, hold 48h; tách khỏi BR01 loan active.
9. **Reader fine lấy user bằng gì?** `/api/fines/mine` dùng current user từ token, không cho client chọn user id.
10. **Đổi mật khẩu cần gì?** Auth token, current password đúng, backend hash new password.
11. **Sáng/tối lưu ở đâu?** `ptit_theme` trong localStorage; đây là UI preference.
12. **Có frontend test?** Không thấy automated frontend test trong tracked files; coverage frontend không có số.

## 10 con số phải thuộc

1. Tối đa **3** loan active.
2. Chọn kỳ mượn **7 / 14 / 30 ngày**.
3. Fine **5.000đ/ngày**.
4. Hold **48 giờ**.
5. JWT **24 giờ**.
6. Gia hạn **+7 ngày**.
7. Gia hạn tối đa **1 lần**.
8. Trang sách staff mặc định **10 dòng/trang**.
9. Top books **5**.
10. Test backend hiện **23/23**; frontend automated tests chưa thấy.

## Điểm yếu phần mình — nói trung thực

- Không có automated frontend tests/coverage.
- Có bộ frontend ở root song song với `frontend/`; README/runbook chạy `frontend/`, cần tránh mở nhầm bản.
- Reader search cần kiểm tra trường hợp lỗi, danh sách rỗng, token hết hạn và responsive bằng browser evidence.
- Không khẳng định backend đã cho phép/đã ghi dữ liệu nếu chưa có response thực tế.

**Câu trả lời thật:** “Em phụ trách giao diện độc giả và có thể mở các handler search/mượn/đặt trước. Em chưa có bộ test frontend tự động; phần quyền và nghiệp vụ cuối cùng vẫn do backend kiểm tra.”

## Nếu nhóm trưởng bổ sung

Nhóm trưởng bổ sung API contract, status code, BR01–BR03 và vai trò backend. Đan trả lời phần layout, state UI, mapping sự kiện và kiểm thử browser cá nhân; không cần nhận phần SQL/service backend.
