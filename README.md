# Website quản lý thư viện PTIT

Hệ thống web giúp thư viện quản lý sách, độc giả và việc mượn trả. Độc giả tra cứu sách và đăng ký mượn trực tuyến. Thủ thư duyệt đăng ký, nhận trả sách và theo dõi tiền phạt. Quản trị viên quản lý tài khoản và xem thống kê.

Dự án thực tập OJT, **Nhóm 2**, học phần thực tập doanh nghiệp (Rikkei Education, PTIT).

## Thành viên

| Thành viên | Vai trò | Phụ trách chính |
|---|---|---|
| Nguyễn Văn Thông | Nhóm trưởng, Backend | Xác thực, phân quyền, mượn/trả, nhật ký hệ thống |
| Nguyễn Hoàng Thành | Backend | Sách, thể loại, độc giả, tiền phạt, thống kê, đặt trước |
| Huỳnh Hồ Nhĩ Đan | Frontend | Giao diện độc giả: đăng nhập, tra cứu sách, sách của tôi |
| Hà Ngọc Hoàng Tân | Frontend | Giao diện thủ thư và admin: quản lý sách, duyệt đăng ký, mượn/trả, dashboard |

## Công nghệ

| Phần | Công nghệ |
|---|---|
| Backend | Python 3.11, FastAPI, SQLAlchemy, Pydantic |
| Xác thực | JWT (PyJWT), mã hóa mật khẩu bằng bcrypt |
| Cơ sở dữ liệu | MySQL 8 |
| Frontend | HTML, CSS, JavaScript thuần |
| Công cụ | Git, GitHub, Postman, Swagger (`/docs`) |

## Chức năng

**Độc giả (READER):** đăng ký, đăng nhập, tra cứu sách, đăng ký mượn (7, 14 hoặc 30 ngày), hủy đăng ký, xem phiếu mượn và tiền phạt của mình.

**Thủ thư (LIBRARIAN):** quản lý sách và thể loại, duyệt hoặc từ chối đăng ký mượn, nhận trả sách, xem độc giả và tiền phạt.

**Quản trị viên (ADMIN):** toàn bộ quyền của thủ thư, thêm quản lý tài khoản (đổi vai trò, khóa, mở khóa), xem thống kê và nhật ký hệ thống.

Quy tắc chính: tiền phạt trả trễ là **5.000đ mỗi ngày**; sách đang được mượn thì không xóa được; đặt trước giữ chỗ **48 giờ**; mật khẩu tối thiểu 6 ký tự; token đăng nhập hết hạn sau 24 giờ. Chi tiết xem tài liệu đặc tả yêu cầu (SRS).

## Tiến độ

| Module | Trạng thái |
|---|---|
| Đăng ký, đăng nhập (JWT), phân quyền | Đã có |
| Sách: xem danh sách, thêm, xóa | Đã có |
| Sách: tìm kiếm, sửa; thể loại | Đang làm |
| Mượn sách: tạo phiếu, danh sách, phiếu của tôi, hủy | Đã có |
| Mượn sách: duyệt, từ chối, nhận trả | Đang làm |
| Tiền phạt, đặt trước, thống kê, nhật ký, quản lý tài khoản | Chưa làm |

## Cấu trúc thư mục

```
.
├── backend/              # FastAPI
│   ├── main.py           # Khởi tạo FastAPI, CORS và router
│   ├── app/              # models, schemas, routers, services, dependencies
│   └── .env              # cấu hình riêng (KHÔNG đưa lên GitHub)
├── frontend/             # HTML, CSS, JS thuần
│   ├── index.html
│   ├── login.html
│   ├── books.html
│   ├── books.js
│   ├── books.css
│   └── app.js
└── README.md
```

## Cài đặt và chạy thử

### Yêu cầu

- Python 3.11
- MySQL 8
- Git

### 1. Lấy mã nguồn

```bash
git clone https://github.com/thuc-tap-ojt-group-2/ITTTRK301_K25_Gruop_2.git
cd ITTTRK301_K25_Gruop_2
```

### 2. Tạo cơ sở dữ liệu

Mở MySQL (Workbench hoặc dòng lệnh) rồi chạy:

```sql
CREATE DATABASE library_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

### 3. Cấu hình môi trường

Tạo file `backend/.env` (mỗi người một file, không đưa lên GitHub):

```env
DB_USER=root
DB_PASSWORD=123456
DB_HOST=localhost
DB_PORT=3306
DB_NAME=library_management
SECRET_KEY=mot_chuoi_bi_mat_dai_va_kho_doan
FRONTEND_ORIGINS=http://localhost:5500,http://127.0.0.1:5500
```

### 4. Chạy backend

Trên Windows PowerShell:

```powershell
cd backend
py -m venv venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.\venv\Scripts\Activate.ps1
pip install fastapi "uvicorn[standard]" sqlalchemy pymysql pyjwt bcrypt python-dotenv "pydantic[email]"
```

Tạo hoặc cập nhật cấu trúc bảng (chạy lại không làm mất dữ liệu; khi khởi động,
ứng dụng cũng tự bổ sung cột `users.is_active` nếu cơ sở dữ liệu cũ chưa có):

```powershell
python -c "from app.database import Base, engine; from app import models; Base.metadata.create_all(engine)"
```

Khởi động máy chủ:

```powershell
uvicorn main:app --reload --port 8000
```

Mở <http://127.0.0.1:8000/docs> để xem và thử API.

### 5. Thêm dữ liệu mẫu

Trang Quản lý sách cần có thể loại trong CSDL để chọn khi thêm sách:

```sql
USE library_management;

INSERT INTO categories (id, name) VALUES
(1, 'Công nghệ thông tin'),
(2, 'Khoa học máy tính'),
(3, 'Kỹ năng & Quản trị')
ON DUPLICATE KEY UPDATE name = VALUES(name);
```

Muốn thử với tài khoản quản trị, đăng ký một tài khoản trên trang đăng ký rồi nâng quyền:

```sql
UPDATE users SET role = 'ADMIN' WHERE username = 'ten_dang_nhap_cua_ban';
```

### 6. Chạy frontend

Mở cửa sổ terminal thứ hai:

```powershell
cd frontend
py -m http.server 5500
```

Mở <http://localhost:5500/login.html> trên trình duyệt.

## API chính

Xem đầy đủ và thử trực tiếp tại `http://127.0.0.1:8000/docs`.

| Phương thức | Đường dẫn | Mô tả | Cần đăng nhập |
|---|---|---|---|
| POST | `/api/auth/register` | Đăng ký tài khoản | Không |
| POST | `/api/auth/login` | Đăng nhập, nhận token | Không |
| GET | `/api/books` | Danh sách sách, có phân trang | Không |
| GET | `/api/books/categories` | Danh sách thể loại | Không |
| POST | `/api/books` | Thêm sách | Thủ thư, admin |
| PUT | `/api/books/{book_id}` | Cập nhật sách | Thủ thư, admin |
| DELETE | `/api/books/{book_id}` | Xóa sách | Thủ thư, admin |
| POST | `/api/loans/` | Đăng ký mượn sách | Có |
| GET | `/api/loans/` | Danh sách phiếu mượn | Có |
| GET | `/api/loans/my-loans` | Phiếu mượn của tôi | Có |
| PATCH | `/api/loans/{loan_id}/cancel` | Hủy đăng ký | Có |

Các API gọi cần đăng nhập thì gửi kèm header:

```
Authorization: Bearer <access_token>
```

## Quy trình làm việc với Git

1. Không đẩy thẳng lên `main`. Mỗi việc làm trên một nhánh riêng: `feature/<mã-việc>-<tên-ngắn>`, ví dụ `feature/th-04-dang-ky-muon`.
2. Commit có mã việc ở đầu: `[TH-04] thêm API đăng ký mượn`.
3. Gửi Pull Request vào `main` trước **17h** ngày chấm; nhóm trưởng xem xét rồi mới merge.
4. Push mã lên GitHub trước **21h** mỗi ngày, kể cả việc đang làm dở (đẩy lên nhánh của mình).
5. Mỗi thành viên tự nộp minh chứng cho task của chính mình trên nền tảng quản lý dự án.

## Lỗi thường gặp

### Kiểm tra nhanh khi frontend không kết nối được Backend

Frontend tự lấy hostname của trang hiện tại và gọi API qua cổng `8000`
(ví dụ `http://localhost:8000`). Nếu backend ở địa chỉ khác, khai báo
`window.PTIT_API_BASE_URL` trước khi nạp `app.js`. Backend mặc định cho phép
hai địa chỉ frontend `http://localhost:5500` và `http://127.0.0.1:5500`;
có thể ghi đè danh sách này bằng `FRONTEND_ORIGINS` trong `backend/.env`, phân
cách các origin bằng dấu phẩy. Hãy chạy đúng hai máy chủ ở hai cửa sổ terminal
riêng:

1. Kiểm tra MySQL đang chạy, database `library_management` đã được tạo và
   thông tin trong `backend/.env` (đặc biệt `DB_USER`, `DB_PASSWORD`,
   `DB_HOST`, `DB_PORT`, `DB_NAME`) là chính xác.
2. Tại terminal thứ nhất, chạy backend từ thư mục `backend`:

   ```powershell
   cd backend
   .\venv\Scripts\Activate.ps1
   uvicorn main:app --reload --port 8000
   ```

   Giữ terminal này mở. Nếu lệnh dừng với lỗi `OperationalError` hoặc
   `Can't connect to MySQL server`, xử lý MySQL/cấu hình `.env` trước; ứng
   dụng kết nối database ngay khi khởi động nên backend chưa sẵn sàng cho đến
   khi lệnh chạy thành công.
3. Tại terminal thứ hai, chạy frontend từ thư mục `frontend`:

   ```powershell
   cd frontend
   py -m http.server 5500
   ```

   Mở `http://localhost:5500/login.html` (không mở HTML trực tiếp bằng
   `file://`). Không dùng cổng khác, trừ khi cũng thêm origin đó vào
   `FRONTEND_ORIGINS` trong `backend/.env`.
4. Mở `http://127.0.0.1:8000/` hoặc
   `http://127.0.0.1:8000/docs`. Nếu không mở được, backend chưa chạy tại
   cổng 8000; nếu `/docs` mở được nhưng frontend báo lỗi, kiểm tra địa chỉ/cổng
   trang frontend và `FRONTEND_ORIGINS` trong `backend/.env`.

Nếu frontend và backend chạy trên hai máy khác nhau, `127.0.0.1` sẽ trỏ về
máy của trình duyệt chứ không phải máy backend. Khi đó cần đổi
`window.PTIT_API_BASE_URL` sang địa chỉ backend có thể truy cập, chạy backend
với `uvicorn main:app --reload --host 0.0.0.0 --port 8000` trên mạng tin cậy,
đồng thời thêm chính xác origin của frontend vào `FRONTEND_ORIGINS` trong
`backend/.env` và khởi động lại backend. Chỉ mở cổng backend trên mạng tin
cậy, không public trực tiếp máy phát triển ra Internet.

| Hiện tượng | Cách xử lý |
|---|---|
| Không mở được `http://127.0.0.1:8000/docs` / báo `ERR_CONNECTION_REFUSED` | Chạy backend từ thư mục `backend` bằng `uvicorn main:app --reload --port 8000`; kiểm tra terminal backend và cổng 8000 |
| Backend báo lỗi kết nối database khi khởi động | Bật MySQL, tạo database `library_management`, kiểm tra thông tin trong `backend/.env` |
| Gọi API bị chặn, Console ghi CORS | Mở frontend qua `http://localhost:5500` hoặc `http://127.0.0.1:5500`; nếu dùng cổng/host khác, thêm đúng origin vào `FRONTEND_ORIGINS` trong `backend/.env` rồi khởi động lại backend |
| Trang báo `Method Not Allowed` khi tải thể loại | Route `GET /api/books/categories` đã có; kiểm tra đang chạy đúng backend/cổng 8000 và xem route tại `/docs` |
| Đăng nhập xong vẫn báo 401 | `SECRET_KEY` lúc tạo token và lúc giải mã phải cùng một giá trị |
| Sửa code frontend mà trang không đổi | Nhấn `Ctrl + F5` để tải lại, bỏ bộ nhớ đệm |
| Không kích hoạt được môi trường ảo trên Windows | Chạy `Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned` trước khi kích hoạt |
