# Runbook chuẩn bị bảo vệ

Tài liệu này là hướng dẫn chạy và kịch bản kiểm tra dựa trên code trong repository. Các bước MySQL/trình duyệt và buổi tập của nhóm **chưa được thực hiện**; cần ghi lại kết quả thật trước khi đánh dấu hoàn tất.

## 1. Chuẩn bị môi trường demo Windows

### Cách khởi chạy bằng Docker

Từ thư mục gốc:

```powershell
Copy-Item .env.example .env
docker compose up --build
```

- Frontend: `http://localhost:5500`
- Backend: `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`
- MySQL: cổng `3306` trong môi trường demo

Compose khởi động MySQL, migration AUTH/LOAN rồi backend và frontend. Dữ liệu MySQL được giữ trong Docker volume `mysql_data`.

Trước khi triển khai chung, đổi `MYSQL_ROOT_PASSWORD`, `MYSQL_APP_PASSWORD` và `SECRET_KEY`; không dùng giá trị mặc định.

1. Dùng một database MySQL 8 riêng cho demo/kiểm thử, không trỏ tới dữ liệu thật.
2. Tạo virtual environment nếu máy chưa có:

   ```powershell
   Set-Location backend
   py -3.11 -m venv .venv
   .\.venv\Scripts\Activate.ps1
   python -m pip install -r requirements.txt
   ```

3. Nếu chưa có `backend\.env`, sao chép `backend\.env.example` thành `backend\.env`, rồi điền cấu hình database và một `SECRET_KEY` ngẫu nhiên. Không ghi `.env` vào Git hoặc slide.
4. Trước khi migrate, sao lưu database demo và kiểm tra `DB_NAME` trỏ đúng database thử nghiệm. Chạy:

   ```powershell
   python migrate_auth_loan.py
   ```

   Migration tạo các bảng còn thiếu và thêm cột AUTH/LOAN, gồm `loans.extension_count`; không chạy lần đầu trên database production.
5. Khởi động backend từ thư mục `backend`:

   ```powershell
   python -m uvicorn main:app --host 127.0.0.1 --port 8000
   ```

6. Dùng VS Code Live Server phục vụ `frontend\index.html` ở port `5500`; mở `http://127.0.0.1:5500/index.html`. API docs ở `http://127.0.0.1:8000/docs`.
7. Tạo/chuẩn bị tài khoản độc giả, thủ thư và admin trên database demo. Không dùng tài khoản hiển thị trong giao diện nếu chúng chưa tồn tại trong database.

## 2. Kịch bản demo nghiệp vụ

Chuẩn bị trước: một tài khoản mỗi role, một sách còn bản, một sách hết bản, và dữ liệu thử nghiệm có thể xóa/khôi phục. Không thực hiện demo ghi dữ liệu trên production.

| Thứ tự | Người trình bày | Thao tác | Kết quả cần quan sát |
|---|---|---|---|
| 1 | Nguyễn Văn Thông | Giới thiệu đăng nhập, JWT và vai trò; mở `/docs` để cho thấy các nhóm API. | Đăng nhập trả token; endpoint bị từ chối nếu role không đủ quyền. |
| 2 | Huỳnh Hồ Nhĩ Đan | Đăng nhập độc giả, tìm sách, mở chi tiết và gửi yêu cầu mượn 7/14/30 ngày. | Yêu cầu có trạng thái chờ; tồn kho chưa giảm trước khi duyệt. |
| 3 | Hà Ngọc Hoàng Tân | Đăng nhập thủ thư/admin, lọc và duyệt yêu cầu. | Phiếu chuyển sang đang mượn; hạn trả và tồn kho cập nhật. |
| 4 | Nguyễn Văn Thông | Trên phiếu đang mượn chưa quá hạn và không có người khác đặt trước, gọi `POST /api/loans/{loan_id}/extend`. | Hạn trả tăng 7 ngày; `extension_count` là 1. Gọi lần hai phải trả HTTP 409. |
| 5 | Nguyễn Hoàng Thành | Tạo đặt trước cho sách hết bản bằng tài khoản độc giả khác; thử gia hạn phiếu của người đang mượn. | Gia hạn bị từ chối HTTP 409 khi có người khác đang chờ/giữ chỗ. |
| 6 | Hà Ngọc Hoàng Tân | Nhận trả một phiếu đang mượn; mở màn hình phạt và dashboard nếu đã có dữ liệu. | Phiếu chuyển sang đã trả; khoản phạt và số liệu hiển thị theo dữ liệu demo. |
| 7 | Nguyễn Văn Thông | Tóm tắt giới hạn và kết luận. | Nêu rõ các phần chưa kiểm chứng thay vì khẳng định quá mức. |

### Kiểm tra API gia hạn trong Swagger

1. Đăng nhập bằng tài khoản `READER`, bấm **Authorize** và nhập bearer token.
2. Gọi `POST /api/loans/{loan_id}/extend` với ID phiếu thuộc chính độc giả đó.
3. Xác nhận `due_date` tăng 7 ngày và `extension_count` thành 1.
4. Gọi lại cùng endpoint: kỳ vọng HTTP 409.
5. Thử phiếu quá hạn, phiếu không ở trạng thái `BORROWING`, hoặc sách có reservation `WAITING`/`HOLDING` của độc giả khác: đều kỳ vọng HTTP 409.
6. Thử ID của độc giả khác: API không tiết lộ phiếu và trả HTTP 404.

## 3. Kịch bản thuyết trình đề xuất (15 phút)

Thời lượng dưới đây là đề xuất; điều chỉnh theo yêu cầu của hội đồng.

| Thời gian | Người nói | Nội dung |
|---|---|---|
| 0–2 phút | Nguyễn Văn Thông | Chào hội đồng, giới thiệu nhóm, đề tài và vấn đề cần giải quyết. |
| 2–4 phút | Nguyễn Văn Thông | Mục tiêu, nhóm người dùng, kiến trúc frontend–FastAPI–MySQL và xác thực/phân quyền. |
| 4–6 phút | Huỳnh Hồ Nhĩ Đan | Luồng độc giả: đăng nhập, tra cứu và đăng ký mượn/đặt trước. |
| 6–8 phút | Hà Ngọc Hoàng Tân | Luồng thủ thư/admin: quản lý sách, duyệt/trả sách, dashboard. |
| 8–10 phút | Nguyễn Hoàng Thành | Backend sách, độc giả, tiền phạt, thống kê, hàng đợi đặt trước. |
| 10–13 phút | Cả nhóm theo bảng demo | Demo một luồng xuyên suốt, ưu tiên thao tác đã được thử trên máy bảo vệ. |
| 13–15 phút | Nguyễn Văn Thông | Tóm tắt kết quả, hạn chế, hướng phát triển và mời hội đồng đặt câu hỏi. |

## 4. Kiểm thử, bảo mật và triển khai thủ công

- Unit tests Auth/Loan chạy bằng SQLite trong bộ nhớ:

  ```powershell
  python -m unittest discover -s tests -v
  ```

- Test tự động không thay thế kiểm thử end-to-end trên MySQL và trình duyệt; cần ghi lại database/môi trường, bước thử và kết quả thật.
- Production phải đặt `APP_ENV=production` và một `SECRET_KEY` riêng, ngẫu nhiên. Ứng dụng từ chối khởi động production nếu thiếu `SECRET_KEY`.
- Dùng tài khoản MySQL riêng với quyền tối thiểu; không expose MySQL ra Internet; chỉ mở API qua HTTPS/reverse proxy ở môi trường triển khai.
- Đặt `FRONTEND_ORIGINS` thành đúng origin frontend, không dùng wildcard khi bật credentials.
- `backend\.env` đã được kiểm tra là không được Git theo dõi. Không chụp/đưa nội dung file này lên slide.
- Đã có BCrypt, JWT expiration, thu hồi token và role guard trong code. Cần kiểm tra giới hạn đăng nhập/rate limiting, HTTPS tại môi trường chạy, cấu hình database production và quyền từng API.
- File SRS/NFR đầy đủ không có trong workspace hiện tại, nên chưa thể kết luận dự án đáp ứng chính xác NFR-02. Đối chiếu với bản SRS chính thức trước khi ghi “đạt”.

## 5. Điều kiện để đóng băng và gắn tag `v1.0`

- Chạy migration trên bản sao database và xác nhận API/frontend trên máy demo.
- Hoàn tất đối chiếu SRS/NFR-02 và ghi lại ca test end-to-end.
- Nhóm ghép báo cáo/slide, tập thử đúng thời lượng và thống nhất dữ liệu demo.
- Chỉ sau khi nhóm trưởng xác nhận các điều kiện trên mới tạo tag `v1.0`; runbook này không tạo tag hoặc tuyên bố buổi tập đã diễn ra.
