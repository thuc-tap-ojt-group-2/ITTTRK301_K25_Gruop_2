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

## Phạm vi chức năng

**Độc giả (READER):** đăng ký, đăng nhập, tra cứu sách, đăng ký mượn (7, 14 hoặc 30 ngày), hủy đăng ký, xem phiếu mượn và tiền phạt của mình.

**Thủ thư (LIBRARIAN):** quản lý sách và thể loại, duyệt hoặc từ chối đăng ký mượn, nhận trả sách, xem độc giả và tiền phạt.

**Quản trị viên (ADMIN):** dự kiến có toàn bộ quyền của thủ thư, quản lý tài khoản, xem thống kê và nhật ký hệ thống.

Quy tắc chính theo yêu cầu: tiền phạt trả trễ là **5.000đ mỗi ngày**; đặt trước giữ chỗ **48 giờ**; mật khẩu tối thiểu 6 ký tự; token đăng nhập hết hạn sau 24 giờ. Đây là phạm vi dự kiến; xem phần trạng thái bên dưới để biết phần nào đã được nối và kiểm chứng trong mã hiện tại.

## Cập nhật công việc ngày 13/11/2026

### Đã làm

- Khôi phục trang chủ với các phần theo đúng thứ tự: trang chủ, giới thiệu, sách mới, nội dung, nội quy, FAQ, liên hệ và chân trang.
- Giữ hiệu ứng sách chuyển động, hiệu ứng hiện dần khi cuộn, ticker sách chạy qua lại và dữ liệu thống kê lấy từ API.
- Chỉnh trang chủ theo hướng gọn và đồng nhất hơn: giảm gradient/đổ bóng, cân lại khoảng cách và chữ, điều chỉnh menu để không tràn ở desktop cỡ trung bình và hiển thị đủ liên kết trên điện thoại.
- Sửa các trang đăng nhập/đăng ký để nạp `api.js`; bổ sung hướng dẫn khi mở trang bằng `file://`. Trang cần được mở qua máy chủ HTTP để API, CORS và phiên đăng nhập hoạt động đúng.
- Sửa bộ đếm để hoàn tất giá trị khi tab bị ẩn, tránh số liệu bị kẹt ở 0.
- Tạo `backend/seed_catalog.py`: bổ sung 5 thể loại (Giáo dục, Kinh tế, Tiểu thuyết, Thiên văn, Khám phá) và 10 sách, mỗi sách 2 bản. Script có thể chạy lại mà không thêm trùng sách/thể loại.
- Cập nhật hướng dẫn chạy và nạp dữ liệu mẫu trong README.

### Đã kiểm tra

- Trong môi trường chạy thử, `GET /api/books` trả về 17 đầu sách với tổng 73 bản sách; trang chủ hiển thị 17 đầu sách, 73 bản sách và 7 thể loại đang có sách. Cơ sở dữ liệu có 8 thể loại; thể loại không có sách chưa được tính vào bộ đếm trang chủ.
- Ticker hiển thị 10 thẻ sách. Frontend và backend đã được kiểm tra hoạt động qua HTTP; CORS từ frontend ở cổng 5500 đã được kiểm tra trong lần thử trước.
- Giao diện được xem ở desktop, desktop cỡ trung bình và mobile; không còn tràn ngang ở các kích thước đã thử.
- Chạy lại seed không tạo bản ghi trùng. `git diff --check` không báo lỗi định dạng.

### Chưa làm / cần xử lý tiếp

- Chưa chạy toàn bộ bộ kiểm thử tự động hoặc kiểm thử end-to-end đầy đủ; các kiểm tra nêu trên là kiểm tra tập trung và chạy trên môi trường local.
- Trình duyệt đã báo một ảnh bìa lấy từ Unsplash bị chặn. Nên chuyển ảnh đó sang tài nguyên local hoặc xác nhận URL/nguồn ảnh để tránh ảnh bìa bị thiếu khi trình duyệt không truy cập được nguồn ngoài.
- Quản lý tài khoản admin (đổi vai trò, khóa/mở khóa), đổi mật khẩu và API xem nhật ký **chưa có trong backend hiện tại**. `User` chưa có trường `locked`; `users_admin.py` không có và `main.py` không nạp router này.
- Luồng thủ thư duyệt/từ chối phiếu và nhận trả sách **chưa có API được nạp trong `main.py`**. Router hiện tại không đăng ký `loans.py`; chưa có `loans_staff.py`.
- `app/log_service.py` đang tham chiếu model `SystemLog`, trong khi `app/models.py` khai báo `AuditLog`. Cần đồng bộ hai phần này trước khi bật luồng ghi nhật ký/phiếu mượn liên quan.
- JWT đang có hai khóa hard-code khác nhau giữa `app/auth_service.py` và `app/dependencies.py`; token do route đăng nhập tạo có thể không được dependency xác thực chấp nhận. `SECRET_KEY` trong `.env` hiện chưa được các file này đọc. Cần đồng bộ cấu hình trước khi kiểm thử luồng đăng nhập cần xác thực.
- `main.py` hiện cấu hình CORS với wildcard (`allow_origins=["*"]`); `FRONTEND_ORIGINS` trong `.env` chưa được sử dụng. Chỉ nên dùng cấu hình hiện tại khi phát triển local; cần giới hạn origin trước khi triển khai.
- Phân quyền API chưa đồng nhất: một số route dữ liệu/sách/tiền phạt chưa khai báo kiểm tra vai trò hoặc người dùng hiện tại. Không nên đưa backend hiện tại ra môi trường công khai trước khi rà soát và bổ sung bảo vệ quyền truy cập.

## Tiến độ hiện tại

| Module | Trạng thái |
|---|---|
| Trang chủ và giao diện responsive | Đã khôi phục, tinh chỉnh và xem thử |
| Thống kê trang chủ từ API | Đã kiểm tra trên dữ liệu local |
| Dữ liệu mẫu sách/thể loại | Đã có script seed idempotent |
| Đăng ký/đăng nhập JWT | Có route; chưa chạy lại kiểm thử đầy đủ trong cập nhật này |
| Sách/thể loại | Có các route CRUD; kiểm tra quyền truy cập API chưa đầy đủ |
| Mượn sách độc giả | Có file router nhưng chưa được nạp trong `main.py` hiện tại |
| Duyệt/từ chối/trả sách cho thủ thư | Chưa hoàn tất |
| Tiền phạt, độc giả, thống kê | Có một số route; chưa kiểm thử toàn bộ và cần rà soát bảo vệ quyền |
| Khóa tài khoản, quản lý user, đổi mật khẩu, nhật ký admin | Chưa hoàn tất |
| Kiểm thử tự động/end-to-end toàn hệ thống | Chưa chạy |

## Cấu trúc thư mục

```
.
├── backend/              # FastAPI
│   ├── main.py           # Khởi tạo FastAPI, CORS và router
│   ├── app/              # models, schemas, routers, services, dependencies
│   ├── seed_catalog.py   # Nạp dữ liệu mẫu sách/thể loại (chạy từ backend/)
│   └── .env              # Cấu hình riêng, không đưa lên GitHub
├── frontend/             # HTML, CSS, JS thuần
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── books.html
│   ├── api.js
│   ├── assets/           # CSS, JS và hình ảnh
│   └── landing.js        # Hiệu ứng và dữ liệu trang chủ
└── README.md
```

Tạo `backend/.env` theo hướng dẫn chạy bên dưới; không đưa file này lên GitHub.

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
```

`SECRET_KEY` và `FRONTEND_ORIGINS` chưa được ứng dụng đọc từ `.env` ở trạng thái hiện tại; xem cảnh báo ở phần công việc chưa hoàn tất.

### 4. Chạy backend

Trên Windows PowerShell:

```powershell
cd backend
py -m venv venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.\venv\Scripts\Activate.ps1
pip install fastapi "uvicorn[standard]" sqlalchemy pymysql pyjwt bcrypt python-dotenv "pydantic[email]"
```

Tạo các bảng còn thiếu theo model:

```powershell
python -c "from app.database import Base, engine; from app import models; Base.metadata.create_all(engine)"
```

Khởi động máy chủ:

```powershell
uvicorn main:app --reload --port 8000
```

Mở <http://127.0.0.1:8000/docs> để xem và thử API.

### 5. Thêm dữ liệu sách mẫu

Trong terminal backend đã kích hoạt virtual environment, chạy:

```powershell
python seed_catalog.py
```

Script bổ sung 5 thể loại (Giáo dục, Kinh tế, Tiểu thuyết, Thiên văn, Khám phá)
và 10 sách, mỗi sách 2 bản. Script không sửa dữ liệu hiện có và có thể chạy lại
mà không tạo thể loại hoặc sách trùng.

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

Mở <http://localhost:5500/index.html> trên trình duyệt. Không mở HTML trực tiếp bằng `file://`.

## API chính

Xem đầy đủ và thử trực tiếp tại `http://127.0.0.1:8000/docs`.

| Phương thức | Đường dẫn | Mô tả | Cần đăng nhập |
|---|---|---|---|
| POST | `/api/auth/register` | Đăng ký tài khoản | Không |
| POST | `/api/auth/login` | Đăng nhập, nhận token | Không |
| GET | `/api/books` | Danh sách sách, có phân trang | Không |
| GET | `/api/books/categories` | Danh sách thể loại | Không |
| POST | `/api/books` | Thêm sách (hiện chưa có kiểm tra vai trò ở route này) | Không |
| PUT | `/api/books/{book_id}` | Cập nhật sách (hiện chưa có kiểm tra vai trò ở route này) | Không |
| DELETE | `/api/books/{book_id}` | Xóa sách (hiện chưa có kiểm tra vai trò ở route này) | Không |
| GET | `/api/stats/overview` | Thống kê tổng quan | Thủ thư/admin |
| GET | `/api/stats/top-books` | Sách được mượn nhiều | Thủ thư/admin |
| GET | `/api/stats/monthly` | Thống kê theo tháng | Thủ thư/admin |

`backend/app/routers/loans.py` có mã nguồn nhưng hiện chưa được include trong `backend/main.py`; vì vậy các route mượn sách trong file đó chưa được đăng ký khi chạy ứng dụng. Các route tiền phạt/độc giả cũng cần được rà soát quyền truy cập trước khi dùng với dữ liệu thật.

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
(ví dụ `http://localhost:8000`). Nếu backend ở địa chỉ khác, đặt
`window.PTIT_API_BASE_URL` trước khi nạp `api.js`. Hiện `main.py` cấu hình CORS
bằng wildcard; `FRONTEND_ORIGINS` chưa được ứng dụng đọc. Chỉ dùng cấu hình
này khi phát triển local, không đưa backend trực tiếp ra Internet. Hãy chạy
MySQL, backend và frontend ở các cửa sổ terminal riêng:

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

   Mở `http://localhost:5500/index.html` (không mở HTML trực tiếp bằng
   `file://`).
4. Mở `http://127.0.0.1:8000/` hoặc
   `http://127.0.0.1:8000/docs`. Nếu không mở được, backend chưa chạy tại
   cổng 8000; nếu `/docs` mở được nhưng frontend báo lỗi, kiểm tra địa chỉ/cổng
   trang frontend và cấu hình CORS trong `backend/main.py`.

Nếu frontend và backend chạy trên hai máy khác nhau, `127.0.0.1` sẽ trỏ về
máy của trình duyệt chứ không phải máy backend. Khi đó cần đổi
`window.PTIT_API_BASE_URL` sang địa chỉ backend có thể truy cập, chạy backend
với `uvicorn main:app --reload --host 0.0.0.0 --port 8000` trên mạng tin cậy,
đồng thời giới hạn CORS theo đúng origin của frontend trong cấu hình backend.
Chỉ mở cổng backend trên mạng tin
cậy, không public trực tiếp máy phát triển ra Internet.

| Hiện tượng | Cách xử lý |
|---|---|
| Không mở được `http://127.0.0.1:8000/docs` / báo `ERR_CONNECTION_REFUSED` | Chạy backend từ thư mục `backend` bằng `uvicorn main:app --reload --port 8000`; kiểm tra terminal backend và cổng 8000 |
| Backend báo lỗi kết nối database khi khởi động | Bật MySQL, tạo database `library_management`, kiểm tra thông tin trong `backend/.env` |
| Gọi API bị chặn, Console ghi CORS | Mở frontend qua HTTP; kiểm tra địa chỉ API và cấu hình CORS trong `backend/main.py`. `FRONTEND_ORIGINS` hiện chưa được ứng dụng đọc |
| Trang báo `Method Not Allowed` khi tải thể loại | Route `GET /api/books/categories` đã có; kiểm tra đang chạy đúng backend/cổng 8000 và xem route tại `/docs` |
| Đăng nhập xong vẫn báo 401 | Kiểm tra khóa JWT khi tạo và giải mã token. Hai module hiện có giá trị hard-code khác nhau; cần đồng bộ mã nguồn trước khi luồng này hoạt động ổn định |
| Sửa code frontend mà trang không đổi | Nhấn `Ctrl + F5` để tải lại, bỏ bộ nhớ đệm |
| Không kích hoạt được môi trường ảo trên Windows | Chạy `Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned` trước khi kích hoạt |
