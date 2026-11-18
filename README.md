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

## Rà soát code theo người phụ trách ngày 15/11/2026

Chỉ đối chiếu mã nguồn trong repository với phần việc được phân công trong SRS; không đánh giá việc nộp link, biên bản họp, triển khai server, báo cáo hoặc slide. **✓** = đã có luồng code chính; **✗** = còn thiếu hoặc chưa kiểm chứng đủ. Kết quả tự động không thay thế kiểm thử end-to-end trên MySQL và trình duyệt.

### Nguyễn Văn Thông — Backend: AUTH, LOAN, LOG

| Phần việc | Trạng thái | Kết quả kiểm tra code |
|---|---|---|
| AUTH-01, AUTH-02, AUTH-04 | ✓ | Đăng ký tài khoản READER; đăng nhập bằng email hoặc tên đăng nhập; mật khẩu BCrypt; JWT dùng chung cấu hình xác minh. |
| AUTH-03 | ✓ | Logout thu hồi `jti`; giao diện gọi API và xóa token ở các trang. |
| AUTH-05, AUTH-06, AUTH-07 | ✓ | Role guard cho API; ADMIN đổi vai trò/khóa tài khoản; API và giao diện độc giả hỗ trợ đổi mật khẩu. |
| LOAN-01 đến LOAN-07 | ✓ | Router được mount; đăng ký/hủy, duyệt/từ chối/trả; kiểm tra giới hạn và cập nhật tồn kho; nhận trả chốt tiền phạt. |
| LOG-01, LOG-02 | ✓ | Thao tác xác thực, quản trị, sách, mượn/trả và đặt trước ghi vào `AuditLog`; endpoint xem log chỉ dành cho ADMIN. |

### Nguyễn Hoàng Thành — Backend: BOOK, RDR, FINE, STAT, RSV

| Phần việc | Trạng thái | Kết quả kiểm tra code |
|---|---|---|
| BOOK-01 đến BOOK-06 | ✓ | Danh sách phân trang, tìm kiếm bỏ dấu, CRUD sách/thể loại và kiểm tra quyền; có giao diện quản lý. |
| RDR-01 đến RDR-03 | ✓ | API danh sách/tìm/lịch sử chỉ cho staff; username được dùng làm mã sinh viên và unique. Có giao diện xem danh sách/lịch sử. |
| FINE-01 đến FINE-05 | ✓ | Phạt 5.000đ/ngày; API xem/thu tiền có role guard; khoản cá nhân lấy theo token; có màn thu phạt. |
| STAT-01 đến STAT-03 | ✓ | API tổng quan, top 5, thống kê 6 tháng; dashboard có biểu đồ và bảng số liệu. |
| RSV-01 đến RSV-03 | ✓ | Có model, API đặt/hủy, hàng đợi theo thứ tự và thời gian giữ chỗ 48 giờ; hết hạn được đồng bộ khi truy cập/nghiệp vụ tiếp theo. |

### Huỳnh Hồ Nhĩ Đan — Frontend: độc giả, độc giả/thủ thư, tiền phạt

| Phần việc | Trạng thái | Kết quả kiểm tra code |
|---|---|---|
| AUTH-01 đến AUTH-04, AUTH-07 | ✓ | Form trang riêng và modal trang chủ gọi API thật; token/role được lưu đồng bộ; có logout và đổi mật khẩu. |
| BOOK-01, BOOK-02 | ✓ | Trang độc giả tải danh sách thật, tìm kiếm/lọc sách và mở chi tiết. |
| LOAN-01, LOAN-02, LOAN-06 | ✓ | Đăng ký 7/14/30 ngày, xem/hủy phiếu và xem khoản phạt cá nhân qua API. |
| RSV-01 đến RSV-03 | ✓ | Đặt trước khi không còn bản khả dụng; xem/hủy phiếu và thời hạn giữ chỗ. |

### Hà Ngọc Hoàng Tân — Frontend: thủ thư, admin, Dashboard

| Phần việc | Trạng thái | Kết quả kiểm tra code |
|---|---|---|
| BOOK-03 đến BOOK-06 | ✓ | Quản lý sách và CRUD thể loại nối API; route ghi yêu cầu ADMIN/LIBRARIAN. |
| LOAN-03 đến LOAN-07 | ✓ | Staff lọc phiếu, duyệt/từ chối và nhận trả; có thể cập nhật danh sách sau thao tác. |
| AUTH-06, LOG-02 | ✓ | Trang ADMIN đổi vai trò, khóa/mở khóa user và đọc nhật ký. |
| STAT-01 đến STAT-03 | ✓ | Dashboard tải số liệu thật, top sách và biểu đồ mượn theo tháng. |

## Cập nhật công việc ngày 15/11/2026

### Đã hoàn thành trong code

- Nối đăng nhập/đăng ký, tra cứu, mượn/trả, đặt trước, tiền phạt và các màn quản trị với API thật; chế độ mock không còn bật mặc định.
- Bổ sung AUTH/LOAN/LOG, role guard, CRUD thể loại, quản lý độc giả, dashboard, user admin và nhật ký.
- Thêm migration cho các cột AUTH/LOAN mới; bảng reservations được tạo từ metadata.

### Kiểm thử vừa chạy

- `python -m unittest discover -s tests -v`: **9/9 test đạt**.
- `python -m compileall -q app main.py migrate_auth_loan.py`: đạt.
- `node --check` cho JavaScript đã sửa và `git diff --check`: đạt.

## Kế hoạch công việc tuần tới (16–22/11/2026)

### Đã hoàn thành đến 15/11

- [x] Hoàn thiện các luồng code chính AUTH, BOOK, LOAN, LOG, RDR, FINE, STAT và RSV; đã cập nhật giao diện theo chức năng.
- [x] Thêm quản trị tài khoản/nhật ký, dashboard, quản lý thể loại, độc giả, tiền phạt và đặt trước.
- [x] Chạy 9/9 backend unit tests; compile Python, kiểm tra cú pháp JavaScript và `git diff --check` đều đạt.
- [x] Cập nhật checklist phần việc theo từng thành viên trong README.

### Việc cần làm trong tuần tới

| Người phụ trách | Công việc | Tiêu chí hoàn thành |
|---|---|---|
| Nguyễn Văn Thông | Chạy migration trên bản sao MySQL; khởi động API và kiểm tra đăng nhập, logout, đổi mật khẩu, quyền ADMIN/LIBRARIAN/READER. | Migration chạy được trên DB cũ; API trả dữ liệu đúng và user sai quyền nhận `403`. |
| Nguyễn Hoàng Thành | Kiểm tra dữ liệu sách/thể loại, tìm kiếm bỏ dấu, tồn kho, độc giả, tiền phạt, thống kê và hàng đợi đặt trước trên MySQL. | Số liệu khớp DB; đặt/hủy/giữ chỗ 48 giờ không vượt tồn kho; chốt các yêu cầu SRS về mã sinh viên riêng hay dùng username. |
| Huỳnh Hồ Nhĩ Đan | Kiểm thử giao diện độc giả trên trình duyệt: đăng ký/đăng nhập, tìm sách, mượn/hủy, đặt trước/hủy, xem phạt, đổi mật khẩu. | Các luồng chạy với API thật; thông báo lỗi rõ ràng; kiểm tra desktop và điện thoại. |
| Hà Ngọc Hoàng Tân | Kiểm thử giao diện staff/admin: CRUD sách/thể loại, duyệt/từ chối/trả, thu phạt, lịch sử độc giả, quản lý user/log và dashboard. | Các thao tác cập nhật đúng DB; phân quyền hiển thị và API được kiểm tra cho từng vai trò. |
| Cả nhóm | Chạy kiểm thử end-to-end hồi quy, sửa lỗi phát hiện được và tổng duyệt kịch bản demo trước ngày bảo vệ 27/11. | Có danh sách ca kiểm thử đạt/chưa đạt; không trình bày tính năng chưa xác minh trên máy demo. |
| Người triển khai | Cấu hình `SECRET_KEY` riêng và `FRONTEND_ORIGINS` phù hợp môi trường demo/production. | Không dùng secret mặc định development; frontend được phép gọi API từ đúng origin. |

## Các hạng mục còn cần xử lý ngày 17/11/2026

Mục này chỉ theo dõi phần chưa hoàn tất hoặc chưa được kiểm chứng; không lặp lại danh sách chức năng đã có. Hạn bên dưới theo bảng công việc nhóm.

| Task | Phần còn thiếu | Việc cần làm / tiêu chí xác nhận |
|---|---|---|
| TH-08 — hạn 17/11 | Chưa xác nhận luồng Auth/Loan chạy xuyên suốt với MySQL và trình duyệt; tài khoản demo ở `index.html` là dữ liệu mock trong trình duyệt, không phải tài khoản backend. | Dùng tài khoản đăng ký thật để kiểm tra đăng nhập, quyền và nghiệp vụ mượn/trả qua API; ghi lại kết quả và lỗi tích hợp nếu có. |
| TH-12 — bonus, hạn 17/11 | Chưa có API gia hạn phiếu mượn và giới hạn gia hạn một lần. | Bổ sung quy tắc trong `backend/app/loan_service.py`, endpoint trong `backend/app/routers/loans.py`, trường lưu số lần gia hạn và migration cho database cũ, cùng test thành công/lặp lại/không đủ điều kiện. Trước khi code cần chốt số ngày được gia hạn, xử lý phiếu quá hạn và phiếu có người đặt trước. |
| TH-09 — hạn 18/11 | Chưa chốt đối chiếu các yêu cầu SRS M/S, rà NFR-02 và phương án Docker hay bản triển khai chạy thật. | Đối chiếu từng yêu cầu còn lại với API hiện có, ghi nhận rủi ro bảo mật và chọn một phương án chạy có thể kiểm chứng; lưu minh chứng kết quả. |
| TH-10 — hạn 20/11 | Chưa xác nhận đồng bộ mã nguồn/tag `v1.0`, ghép báo cáo và slide của nhóm, và buổi tập bảo vệ. | Đồng bộ nhánh và phiên bản với nhóm, hoàn tất tài liệu chung, rồi chạy thử kịch bản demo trên đúng môi trường bảo vệ. |

### Trạng thái kiểm tra local ngày 17/11

- Bộ kiểm thử Auth/Loan chưa thay thế được kiểm thử tích hợp trên MySQL và trình duyệt; các luồng cần được kiểm tra với tài khoản thật trong database.
- Trong lần kiểm tra hiện tại, frontend ở cổng `5500` trả `200`, còn kết nối tới backend ở cổng `8000` bị từ chối. Cần khởi động API rồi kiểm tra lại trước khi kết luận luồng frontend/backend hoạt động.
- Không dùng các tài khoản demo hiển thị trên trang chủ để thử API backend nếu chưa tạo chúng trong database; đăng ký tài khoản backend riêng và cấp role cần thiết trên database local.

## Lịch sử cập nhật ngày 13/11/2026 (ảnh chụp trước khi hoàn thiện)

### Đã làm

- Khôi phục trang chủ với các phần theo đúng thứ tự: trang chủ, giới thiệu, sách mới, nội dung, nội quy, FAQ, liên hệ và chân trang.
- Giữ hiệu ứng sách chuyển động, hiệu ứng hiện dần khi cuộn, ticker sách chạy qua lại và dữ liệu thống kê lấy từ API.
- Chỉnh trang chủ theo hướng gọn và đồng nhất hơn: giảm gradient/đổ bóng, cân lại khoảng cách và chữ, điều chỉnh menu để không tràn ở desktop cỡ trung bình và hiển thị đủ liên kết trên điện thoại.
- Tách rõ hai luồng xác thực hiện có: trang chủ `frontend/index.html` dùng luồng demo trong `assets/js/script.js`; `frontend/login.html` và `frontend/register.html` được thiết kế để gọi API qua `assets/js/auth.js`. Tình trạng kiểm thử từng luồng được ghi ở mục bên dưới.
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

## Nhật ký kiểm thử ngày 13/11/2026 (lịch sử, không phải trạng thái hiện tại)

**Thời điểm kiểm tra:** 13/11/2026, 21:49 (UTC+7).

**Mốc bảo vệ:** 27/11/2026. Bảng dưới đây chỉ ghi trạng thái local ở ngày 13/11; xem rà soát ngày 15/11 phía trên để biết trạng thái hiện tại.

### Kết quả đã kiểm tra

| Thời điểm | Phần kiểm tra | Kết quả thực tế | Trạng thái |
|---|---|---|---|
| 13/11/2026 21:39 | Frontend tại `http://localhost:5500/index.html` và các tài nguyên CSS/JS | Máy chủ HTTP trả `200`; trang chủ được tải. | Đạt |
| 13/11/2026 21:39 | `http://localhost:5500/favicon.ico` | Trả `404` vì dự án chưa có favicon ở đường dẫn này. Không ảnh hưởng chức năng trang chủ. | Không cần sửa gấp |
| 13/11/2026 21:45 | Backend FastAPI tại cổng `8000` | Uvicorn báo `Application startup complete`. | Đạt |
| 13/11/2026 21:49 | `GET /`, `GET /docs`, `GET /api/books?page=1&size=100` | Cả ba endpoint trả `HTTP 200`. | Đạt |
| 13/11/2026 21:49 | `python test_fine.py` trong `backend` | Bốn ca tính tiền phạt chạy qua. | Đạt |
| 13/11/2026 21:49 | `node --check` cho `landing.js`, `script.js`, `api.js`; `git diff --check` | Không báo lỗi cú pháp JavaScript hoặc whitespace. | Đạt |
| 13/11/2026 21:49 | `http://localhost:5500/app.js` | Trả `HTTP 404`; file `frontend/app.js` không tồn tại nhưng các trang đăng nhập/đăng ký vẫn tham chiếu file này. | Chặn kiểm thử đăng nhập/đăng ký qua giao diện riêng |
| 13/11/2026 21:49 | `python -m pytest -q` | Không chạy được vì virtualenv chưa cài `pytest` (`No module named pytest`). Bài test tính phạt hiện vẫn chạy được trực tiếp bằng `python test_fine.py`. | Chưa có bộ pytest |

### Checklist test thủ công

Chạy backend và frontend ở **hai terminal riêng**; không cần chạy backend lần thứ hai nếu terminal Uvicorn hiện đã chạy:

**Terminal backend** (từ thư mục gốc):

```powershell
cd D:\Rikkei_Internship\backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000
```

Chờ dòng `Application startup complete`. Mở `http://127.0.0.1:8000/docs`.

**Terminal frontend**:

```powershell
cd D:\Rikkei_Internship\frontend
py -m http.server 5500
```

Mở `http://localhost:5500/index.html`, không mở file bằng `file://`. Sau khi sửa code, nhấn `Ctrl+F5`.

| Bước | Cách test | Mong đợi | Tình trạng / ghi chú |
|---|---|---|---|
| Trang chủ và API sách | Mở trang chủ; thử `http://127.0.0.1:8000/api/books?page=1&size=100`; xem ticker sách và footer. | API trả `200`; sách có ảnh tải được và ticker di chuyển. | API `200` đã xác nhận lúc 21:49. Ảnh bìa phụ thuộc URL trong database; một URL ngoài từng bị trình duyệt chặn. |
| Tài khoản đăng ký/đăng nhập qua trang chủ | Bấm Đăng ký/Đăng nhập trên `index.html`; thử đăng ký email đã dùng. | Nếu dùng backend thật, tài khoản được lưu DB; trùng tên đăng nhập, mã SV hoặc email bị từ chối. | **Không phải kiểm thử backend:** `frontend/assets/js/script.js` đặt `USE_MOCK_API = true`, lưu dữ liệu vào `localStorage`, không gửi request đến FastAPI. Chế độ demo hiện chỉ chặn trùng email, chưa chặn trùng mã SV. |
| Tài khoản qua trang riêng | Mở `register.html` và `login.html`; kiểm tra Console/Network rồi thử đăng ký/đăng nhập. | Trang tải script dùng chung, gọi `/api/auth/register` và `/api/auth/login`. | **Đang bị chặn:** hai HTML nạp `/app.js`, nhưng `frontend/app.js` không có (HTTP 404). Ngoài ra `assets/js/auth.js` gọi `PTIT.loadStats`/`PTIT.fillStats`, trong khi các hàm này chưa được cung cấp ở `assets/js/ui.js`; `apiRequest` hiện nằm trong `frontend/api.js` nhưng HTML không nạp file đó. |
| Chặn trùng tài khoản ở API | Dùng Swagger `POST /api/auth/register`: gửi một username/email mới hai lần; sau đó thử trùng riêng username hoặc email. Chỉ thử trên database local. | Lần đầu `201`; các lần trùng `400`. | Backend có kiểm tra username/email trong `backend/app/routers/auth.py` và unique constraint ở `backend/app/models.py`. Trang riêng dùng mã SV làm `username`, nên API sẽ chặn trùng mã SV theo username; database **không có cột `student_id` riêng**. |
| Đăng nhập và API cần token | Đăng nhập bằng tài khoản local để nhận token, sau đó gọi endpoint có bảo vệ như `/api/stats/overview` với `Authorization: Bearer <token>`. | Token được chấp nhận và trả dữ liệu theo quyền. | **Có lỗi đã xác định:** khóa ký trong `backend/app/auth_service.py` khác khóa xác minh trong `backend/app/dependencies.py`; token có thể bị trả `401`. |
| Sách/thể loại | Thử GET danh sách; thử POST/PUT/DELETE chỉ trên database local và với dữ liệu kiểm thử. | CRUD trả mã phù hợp và dữ liệu được cập nhật. | GET sách đã đạt `200`; CRUD chưa được kiểm thử đầy đủ. Các route ghi sách/thể loại chưa kiểm tra vai trò ở backend, không dùng dữ liệu thật trước khi bổ sung phân quyền. |
| Mượn/trả | Kiểm tra danh sách route trong `/docs`, sau đó thử tạo/hủy phiếu nếu route xuất hiện. | Các route mượn/trả hoạt động và cập nhật số bản sách chính xác. | **Chưa hoạt động qua API:** `backend/main.py` không include `loans.router`, nên OpenAPI không có `/api/loans`; giao diện `frontend/loans.js` gọi các route này. Khi bật router cần sửa thêm lệch `SystemLog`/`AuditLog` trong `backend/app/log_service.py` và `backend/app/models.py`. |
| Độc giả, tiền phạt, thống kê, admin | Thử các route tương ứng trong `/docs` bằng tài khoản có quyền; so sánh kết quả với database. | Dữ liệu đúng và user không đủ quyền nhận `403`. | Route một phần đã được đăng ký nhưng chưa có kiểm thử tích hợp đầy đủ; quyền truy cập một số route chưa đồng nhất. Quản lý/khóa tài khoản và nhật ký admin chưa hoàn tất. |
| Responsive và footer/bản đồ | Xem trang chủ ở desktop và điện thoại; kiểm tra footer, link và bản đồ. | Không tràn ngang; footer và bản đồ hiển thị. | Đã xem responsive ở lần kiểm tra trước; cần chạy lại sau thay đổi mới. Lỗi favicon `404` không phải lỗi API. |

### Nguyên nhân chính và thứ tự xử lý trước bảo vệ

1. **P0 — Khôi phục luồng đăng ký/đăng nhập chạy được:** tạo lại `frontend/app.js` hoặc hợp nhất đúng các hàm cần thiết vào script đang dùng; cập nhật `login.html`/`register.html` để nạp `api.js`, `ui.js` và `auth.js` đúng thứ tự; bảo đảm có `PTIT.loadStats`, `PTIT.fillStats`, `apiRequest`. Sau đó kiểm tra Console không còn `404 app.js`, `apiRequest is not defined` hoặc `PTIT.loadStats is not a function`.
2. **P0 — Chọn một luồng đăng ký thật:** chuyển form trên trang chủ khỏi chế độ mock trong `frontend/assets/js/script.js`, hoặc hướng nút đăng ký đến trang riêng. Nếu nối form trang chủ, đổi API base từ cổng `8080` sang `8000` và đổi payload từ `studentId`/`fullName` sang `username`/`full_name` đúng schema `backend/app/schemas.py`.
3. **P0 — Đồng bộ JWT:** dùng cùng một `SECRET_KEY` và `ALGORITHM` từ cấu hình chung cho cả tạo token và xác minh token trong `auth_service.py` và `dependencies.py`; kiểm thử đăng nhập rồi gọi API cần token.
4. **P1 — Chốt quy tắc mã sinh viên:** hiện trang riêng lưu mã SV vào cột `username`, nên uniqueness được thừa hưởng từ username. Nếu yêu cầu đồ án bắt buộc lưu trường `student_id` riêng, cần bổ sung schema/model và migration có giữ dữ liệu hiện tại, rồi kiểm thử trùng mã SV trên database local.
5. **P1 — Mượn/trả:** chỉ bật `loans.router` sau khi sửa `log_service.py` để dùng model log hiện có và kiểm thử lại từ `/docs`. Nếu chưa kịp hoàn tất, không trình bày chức năng này như một luồng API đã chạy.
6. **P1 — Phân quyền và hồi quy:** bổ sung kiểm tra vai trò ở các API ghi sách/thể loại/tiền phạt; chạy lại checklist trên sau mỗi thay đổi. Không triển khai backend hiện tại ra Internet trước khi rà soát quyền và CORS.

**Ưu tiên demo:** chỉ trình bày chức năng đã chạy lại được trên đúng máy demo; ghi rõ phần đang dùng dữ liệu demo hoặc còn thiếu API. Không dùng tài khoản, dữ liệu thật để thử đăng ký trùng hay CRUD.

## Tiến độ code tại ngày 15/11/2026

| Module | Trạng thái |
|---|---|
| AUTH, role guard, admin, nhật ký | Đã có code; 9 unit test đạt cho auth/loan cốt lõi |
| Sách, thể loại, độc giả, tìm kiếm | Đã nối API; cần kiểm thử trên MySQL và trình duyệt |
| Mượn/trả, phạt, đặt trước | Đã có API và giao diện chính; cần kiểm thử end-to-end |
| Dashboard | Đã nối API thống kê và hiển thị biểu đồ |
| Kiểm thử toàn hệ thống | Chưa chạy trên DB/MySQL thật hoặc browser |

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
│   ├── dashboard.html
│   ├── books.html
│   ├── loans.html
│   ├── readers.html
│   ├── fines.html
│   ├── admin.html
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

Để tạo các tài khoản demo đang hiển thị trên trang đăng nhập, chạy trong terminal
backend:

```powershell
python seed_demo_users.py
```

Tài khoản demo dùng mật khẩu `123456`:

| Vai trò | Email đăng nhập |
|---|---|
| Quản trị viên | `admin@ptit.edu.vn` |
| Thủ thư | `thuthu@ptit.edu.vn` |
| Độc giả | `docgia@ptit.edu.vn` |

Lệnh chỉ tạo tài khoản còn thiếu, không thay đổi tài khoản đã tồn tại. Đây là
tài khoản phục vụ demo local; không tạo hoặc dùng chúng trên môi trường thật.

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
| POST | `/api/auth/register`, `/api/auth/login` | Đăng ký, đăng nhập | Không |
| POST | `/api/auth/logout`; PUT `/api/auth/password` | Thu hồi token, đổi mật khẩu | Đăng nhập |
| GET | `/api/books` | Danh sách/tìm kiếm sách, phân trang | Không |
| POST/PUT/DELETE | `/api/books`, `/api/books/{id}` | CRUD sách | LIBRARIAN/ADMIN |
| GET/POST/PUT/DELETE | `/api/categories` | Thể loại | GET công khai; ghi LIBRARIAN/ADMIN |
| POST/GET/PUT | `/api/loans` và `/api/loans/{id}/...` | Đăng ký, hủy, duyệt, từ chối, nhận trả | READER hoặc LIBRARIAN/ADMIN |
| POST/GET/DELETE | `/api/reservations` | Đặt trước, xem của tôi, hủy | READER |
| GET | `/api/readers`, `/api/readers/{id}/loans` | Danh sách và lịch sử độc giả | LIBRARIAN/ADMIN |
| GET/PUT | `/api/fines` | Xem, đánh dấu khoản phạt đã thu | LIBRARIAN/ADMIN |
| GET | `/api/fines/mine` | Khoản phạt cá nhân | READER |
| GET | `/api/admin/users`, `/api/admin/logs` | Quản lý tài khoản và nhật ký (hiện tên tài khoản trong nhật ký) | ADMIN |
| GET | `/api/stats/overview`, `/api/stats/top-books`, `/api/stats/monthly` | Thống kê dashboard | LIBRARIAN/ADMIN |

Sau khi cập nhật schema, chạy `python migrate_auth_loan.py` từ thư mục `backend` trước khi dùng database cũ. `main.py` dùng danh sách `FRONTEND_ORIGINS` trong `backend/.env`; không cấu hình wildcard cho môi trường triển khai.

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
