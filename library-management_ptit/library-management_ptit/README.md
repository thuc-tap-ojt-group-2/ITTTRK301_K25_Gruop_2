# Website quản lý thư viện PTIT (Nhóm 2)

Ngôn ngữ sử dụng: **HTML, CSS, JavaScript** (giao diện) và **Python** (backend, FastAPI + MySQL). Tài liệu yêu cầu: SRS v1.2.

```
backend/    Python: FastAPI, SQLAlchemy, MySQL, JWT, bcrypt
frontend/   HTML, CSS, JavaScript (Đan: phía độc giả, Tân: phía thủ thư và admin)
```

## Chạy backend

1. Cài Python 3.11 trở lên và MySQL 8.
2. Tạo cơ sở dữ liệu: `mysql -u root -p < backend/database/schema.sql`
3. Tạo môi trường ảo và cài thư viện:

   ```bash
   cd backend
   python -m venv .venv
   .venv\Scripts\activate          # Windows;  macOS/Linux: source .venv/bin/activate
   pip install -r requirements.txt
   ```
4. Sao chép `.env.example` thành `.env`, điền mật khẩu MySQL và `JWT_SECRET` (ít nhất 32 ký tự).
5. Chạy: `uvicorn app.main:app --reload --port 8080`, rồi mở `http://localhost:8080/docs` để thử API.
6. Kiểm thử: `pytest` (hoặc không cài gì thêm: `python -m unittest discover -s tests -v`).

## Cấu trúc backend

```
backend/app/
  constants.py      hằng số dùng chung (3 phiếu, 5.000đ, 7/14/30 ngày, 48 giờ)
  config.py         đọc cấu hình từ biến môi trường / .env
  database.py       kết nối MySQL, phiên làm việc
  models.py         model SQLAlchemy (ánh xạ bảng)
  domain.py         đối tượng nghiệp vụ thuần Python
  schemas.py        request, response (Pydantic), JSON camelCase
  exceptions.py     BusinessError, UnauthorizedError, ForbiddenError, NotFoundError
  error_handlers.py mọi lỗi trả dạng {"message": "..."}
  passwords.py      băm mật khẩu bcrypt
  tokens.py         tạo và đọc JWT
  repositories/     truy cập dữ liệu
  services/         nghiệp vụ (có kiểm thử đơn vị)
  routers/          API (FastAPI); main.py tự nạp mọi file trong thư mục này
backend/database/schema.sql   thiết kế CSDL
backend/docs/                 mẫu API cho Frontend, Postman collection
```

## Quy ước

- Tên biến, hàm, lớp, bảng, cột bằng tiếng Anh. Python: `snake_case` cho biến và hàm, `PascalCase` cho lớp. JavaScript: `camelCase`.
- Mỗi task một nhánh `feature/<mã-task>-<việc>`; commit có mã task, ví dụ `[TH-02] ...`. Không push thẳng vào `main`.
- Không commit mật khẩu, khóa bí mật (file `.env` đã nằm trong `.gitignore`).
- Task xong phải push lên GitHub trước 21h cùng ngày.

## Tiến độ backend (Thông)

| Task | Nội dung | Trạng thái |
| --- | --- | --- |
| TH-01 | Khung dự án, cấu hình, xử lý lỗi chung, schema.sql | Xong |
| TH-02 | Mẫu API, đăng ký, đăng nhập, bcrypt, JWT (AUTH-01, 02, 04) | Xong |
| TH-03 | Kiểm tra JWT, phân quyền theo vai trò, ghi nhật ký (AUTH-03, 05, LOG-01) | Kế tiếp |
