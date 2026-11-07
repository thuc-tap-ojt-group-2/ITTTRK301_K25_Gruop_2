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
│   ├── app/              # models, schemas, routers, services, dependencies
│   ├── requirements.txt
│   └── .env              # cấu hình riêng (KHÔNG đưa lên GitHub)
├── frontend/             # HTML, CSS, JS thuần
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
DB_PASSWORD=mat_khau_mysql_cua_ban
DB_HOST=localhost
DB_PORT=3306
DB_NAME=library_management
SECRET_KEY=mot_chuoi_bi_mat_dai_va_kho_doan
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

Tạo các bảng (chỉ cần chạy một lần, chạy lại không làm mất dữ liệu):

```powershell
python -c "from app.database import Base, engine; from app import models; Base.metadata.create_all(engine)"
```

Khởi động máy chủ:

```powershell
uvicorn app.main:app --reload --port 8000
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
| POST | `/api/books` | Thêm sách | Thủ thư, admin |
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

| Hiện tượng | Cách xử lý |
|---|---|
| Trang báo `Method Not Allowed` khi tải thể loại | Backend chưa có route `GET /api/books/categories` hoặc đường dẫn bị route khác nuốt. Kiểm tra ở `/docs` |
| Gọi API bị chặn, Console ghi CORS | Backend cần cho phép nguồn `http://localhost:5500` (CORSMiddleware) |
| Đăng nhập xong vẫn báo 401 | `SECRET_KEY` lúc tạo token và lúc giải mã phải cùng một giá trị |
| Sửa code frontend mà trang không đổi | Nhấn `Ctrl + F5` để tải lại, bỏ bộ nhớ đệm |
| Không kích hoạt được môi trường ảo trên Windows | Chạy `Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned` trước khi kích hoạt |
