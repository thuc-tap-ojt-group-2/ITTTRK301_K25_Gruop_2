# Sổ tay bảo vệ — Hệ thống quản lý thư viện PTIT

**Ngày đối chiếu:** 26/11/2026  
**Phạm vi:** kiểm tra repository, Git history, code và unit tests; sau đó bổ sung bản đồ dự án, bộ câu hỏi nhóm, kịch bản bảo vệ và thẻ nhớ. Không chạy migration/seed, không thử thao tác ghi lên database, không sửa mã nguồn.  
**Giới hạn nguồn:** không tìm thấy bản SRS chính thức, backlog hay file GitHub Projects trong các file được Git theo dõi. Các mã yêu cầu dưới đây được đối chiếu với cách nhóm ghi trong `README.md` và chú thích trong code; đây không phải chứng nhận tuân thủ SRS chính thức.

## Quy ước đọc tài liệu

- **✓**: có luồng code chính và bằng chứng trực tiếp; không đồng nghĩa đã nghiệm thu toàn hệ thống.
- **⚠**: code có một phần, thiếu test tương ứng, tài liệu mâu thuẫn, hoặc chưa xác minh ở môi trường thật.
- **✗**: không tìm thấy bằng chứng cần thiết trong repository hoặc chưa đo/kiểm chứng.
- Xác suất bị hỏi **Cao / Vừa / Thấp** là ước lượng để ôn tập, không phải dự đoán kết quả bảo vệ.
- “SRS” trong các câu trả lời chỉ được khẳng định ở mức đối chiếu code. Bản SRS đầy đủ không có trong repository.

# Giai đoạn 1 — Kiểm kê chỉ đọc

## 1. Kết quả repository và Git

| Hạng mục | Kết quả đọc được | Cách nói trung thực khi bảo vệ |
|---|---|---|
| Nhánh hiện tại | `main`; có các nhánh local/remote dạng `feature/HT-*`, `feature/TA-*`, `feature/da-*`, `feature/th-*` và các nhánh tích hợp. | “Đây là những nhánh còn có ref trong bản clone; không suy ra tất cả nhánh đều đang được phát triển.” |
| Pull Request đã merge | Local Git history có merge subjects cho PR #1–#7, #9, #11–#15, #17–#20, #23–#34. Đây là bằng chứng merge commit trong lịch sử local, không phải trạng thái PR trực tiếp từ GitHub. | “Em xác nhận theo merge commit có trong bản clone; chưa đối chiếu trạng thái GitHub trực tiếp.” |
| Tag | `git tag --list` không có tag; chưa có bằng chứng tag `v1.0`. | “Nhóm chưa gắn tag phát hành `v1.0` trong repository này.” |
| File kế hoạch | `git ls-files` không thấy SRS, backlog, sprint board hay file export GitHub Projects. | “Em chưa thể xác nhận ưu tiên backlog so với SRS hoặc trạng thái board bên ngoài.” |
| README | Có hướng dẫn chạy, module, API, test cũ và tiến độ. Một số đoạn trạng thái/hướng dẫn mâu thuẫn với code hiện tại; chưa chạy toàn bộ hướng dẫn vì có bước tạo bảng/nạp dữ liệu. | “README là tài liệu tham khảo, cần cập nhật trước khi coi là runbook đã nghiệm thu.” |
| Nhóm thư mục hỗ trợ | `tools/cover-fix` có script/cache/report; `tools/demo-video` có script, package, recordings/renders và tệp cấu hình demo; `backups` có bản dump SQL; `.pytest_cache` là cache. Không xóa trong lượt này. | “Đây không phải phần runtime chính. Cần xác nhận chủ sở hữu và chính sách lưu trữ trước khi dọn; backup và file cấu hình demo không được chia sẻ tùy tiện.” |
| Cấu trúc trùng cần lưu ý | Có `index.html`/`assets/` ở root song song với `frontend/index.html`/`frontend/assets/`. README và lệnh chạy frontend chỉ rõ `frontend/` là đường chạy chính. Chưa xóa bản root vì chưa có yêu cầu và có thể còn được tham chiếu. | “Có dấu vết hai bộ frontend; khi demo dùng `frontend/`, còn bộ ở root cần xác minh lịch sử trước khi quyết định dọn.” |
| Công cụ docs | `tools/docs/` chưa có trong danh sách file được theo dõi; lượt này tạo sổ tay mới tại đây. | “Đây là tài liệu chuẩn bị bảo vệ mới, không phải file SRS hay hồ sơ nghiệm thu.” |

### Đóng góp theo tác giả commit

Đếm commit không-merge bằng `git log --all --no-merges`, gom bí danh cùng email; nhóm file là vùng đường dẫn được chạm nhiều trong commit history. Đây là số liệu lịch sử Git, **không** đo khối lượng, chất lượng hay mức đóng góp thực tế. Không dùng để xếp hạng thành viên.

| Thành viên theo README | Commit không-merge trong refs local | Nhóm file nổi bật trong lịch sử | Ghi chú |
|---|---:|---|---|
| Nguyễn Văn Thông | 365 | `frontend/`, `frontend/assets/`, `backend/app/`, file root/docs | Nhiều commit tích hợp/chỉnh sửa liên vùng; không đồng nghĩa chỉ một mình phụ trách mọi vùng đó. |
| Nguyễn Hoàng Thành | 14 | `backend/app/`, `backend/app/routers/`, `backend/tests/`, docs/root | Khớp phần backend sách/thể loại/độc giả/phạt/thống kê/đặt trước được README phân công. |
| Huỳnh Hồ Nhĩ Đan | 10 | `assets/` ở root, file root, `frontend/` | Lịch sử có file reader ở bộ root; frontend hiện còn hai cây `assets/` cần phân biệt. |
| Hà Ngọc Hoàng Tân | 14 | `frontend/`, một phần `frontend/assets/`, docs và một số file backend | README phân công màn thủ thư/admin; lịch sử commit có một số vùng dùng chung. |

Bí danh `Nguyen Van Thong`/`Nguyễn Văn Thông` và `Hà Tân`/`Tân Hà` được gom theo cùng email Git. Chênh lệch với `git shortlog` có thể do shortlog tính cả merge commit và hiển thị tên bí danh riêng. Khi được hỏi ai chịu trách nhiệm cuối cùng cho một file, ưu tiên hỏi người trực tiếp triển khai/review; Git author không đủ để kết luận quyền sở hữu.

### README có chạy được không?

- Có hướng dẫn Docker Compose và hướng dẫn chạy backend/frontend riêng; nhưng lượt này **không chạy `docker compose up`, migration, `create_all` hay seed** vì các thao tác đó có thể tạo/thay đổi dữ liệu.
- Có mâu thuẫn cần sửa tài liệu ở lần sau: README còn nói `SECRET_KEY`/`FRONTEND_ORIGINS` chưa được đọc (`README.md` khoảng dòng 299, 416, 461), trong khi code hiện đọc `SECRET_KEY` ở `backend/app/security.py` và đọc `FRONTEND_ORIGINS` ở `backend/main.py`.
- README mô tả `DB_NAME=library_management`; cấu hình Docker Compose dùng `library_ptit`. Hai cách chạy có thể dùng database khác nhau.
- `backend/main.py` gọi `Base.metadata.create_all()` khi import. Vì vậy lệnh chạy backend không phải thao tác hoàn toàn chỉ đọc; chỉ chạy trên database demo đã backup và được phép ghi.
- Kết luận: tài liệu có thể làm điểm khởi đầu, nhưng chưa đủ bằng chứng để nói README đã được chạy tuần tự thành công trên máy bảo vệ.

## 2. Bản đồ module theo code, SRS nhóm cung cấp và test

Các nhãn trạng thái là mức có bằng chứng trong code/test, không phải phê duyệt SRS. Tên màn hình SCR trong yêu cầu của nhóm được giữ để thuận tiện đối chiếu; chưa có SRS gốc để xác thực từng tiêu chí.

| Module/nhóm SCR | Phân công theo README/SRS nhóm cung cấp | Bằng chứng code chính | Test hiện có | Kết luận thận trọng |
|---|---|---|---|---|
| AUTH / SCR-01, SCR-05, SCR-12 | Thông backend; Đan độc giả; Tân admin | `backend/app/routers/auth.py`, `auth_service.py`, `dependencies.py`, `admin.py`; frontend `assets/js/auth.js`, `frontend/login.html`, `register.html`, `admin.js` | Có test đăng ký/đăng nhập/đổi mật khẩu/logout, JWT thu hồi, khóa user; không có test trình duyệt frontend | **Đủ luồng chính ở code; một phần kiểm thử**. |
| LOAN / SCR-03, SCR-08, SCR-09 | Thông backend; Đan độc giả; Tân thủ thư | `backend/app/loan_service.py`, `routers/loans.py`; giao diện `frontend/loans.js` và reader JS | Nhiều ca BR01–BR03, duyệt/từ chối/trả, tồn kho, gia hạn; không kiểm thử end-to-end MySQL | **Đủ luồng chính ở code; test unit có**. |
| LOG-01/LOG-02 / SCR-13 | Thông backend; Tân giao diện admin | `backend/app/log_service.py`, `services.py`, `models.py`, `routers/admin.py`, `frontend/admin.js` | Có test hiển thị actor hiện có/đã xóa/không rõ; không có test đầy đủ từng action hoặc quyền endpoint | **Một phần**; không khẳng định mọi thao tác đều được log. |
| BOOK / SCR-02, SCR-06 | Thành backend; Đan tra cứu; Tân quản lý | `backend/app/crud.py`, `routers/books.py`, `frontend/assets/js/script.js`, `frontend/books.js` | Có test tìm kiếm, phân trang/CRUD qua CRUD layer; không có test UI | **Đủ luồng code chính; test unit có**. |
| CATEGORY / SCR-07 | Thành backend; Tân giao diện | `backend/app/crud.py`, `routers/categories.py`, `frontend/books.js` | CRUD category nằm trong test CRUD sách/thể loại | **Đủ luồng code chính; test unit có**. |
| RDR / SCR-10 | Thành API; Đan/Tân giao diện theo phần độc giả và staff | `backend/app/routers/readers.py`, `crud.py`, `frontend/readers.js` | Không thấy test endpoint độc giả/lịch sử riêng trong 23 test hiện có | **Một phần; code có, kiểm thử tự động thiếu**. |
| FINE / SCR-11 | Thành backend; Đan độc giả; Tân màn thu phạt | `backend/app/services.py`, `crud.py`, `routers/fines.py`, `frontend/fines.js` | Có một test tính phạt, nhận trả, thu phạt và chặn thu trùng | **Đủ luồng chính ở code; độ phủ test còn hẹp**. |
| RSV / SCR-04 | Thành backend; Đan độc giả | `backend/app/reservation_service.py`, `routers/reservations.py`, reader JS | Có test hàng đợi, giữ chỗ 48 giờ, hết hạn, hủy và đồng bộ khi trả sách | **Đủ luồng chính ở code; chưa có test runtime/UI**. |
| STAT / SCR-14 | Thành API; Tân dashboard | `backend/app/crud.py`, `routers/stats.py`, `frontend/dashboard.js` | Có test overview/top/monthly | **Đủ luồng code chính; test unit có**. |
| NFR-02 | Theo phân công dự kiến của Thông | Bản SRS/NFR không có; code có BCrypt, JWT, RBAC, lock, revoke, audit log; chưa thấy rate-limit trong router | Một phần test auth/role-related; không có test kiểm tra NFR-02 chính thức | **Chưa xác định được mức đạt NFR-02**; cần đúng nội dung yêu cầu gốc. |
| Docker/deploy | Thông/nhóm theo yêu cầu | `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile` | Chưa chạy Docker trong lượt này; runbook nói chưa xác nhận Docker trên máy bảo vệ | **Có cấu hình; chưa xác minh vận hành**. |
| Test & coverage | Thành phần backend được chia cho Thông/Thành | `backend/tests/` có 3 file unittest | Chạy hiện tại **23/23 đạt** trên SQLite trong bộ nhớ; `coverage` không cài và chưa đo | **Test unit có; coverage chưa biết; chưa phải E2E**. |
| Frontend độc giả/thủ thư/admin | Đan/Tân theo README; có file dùng chung do cả nhóm sửa | `frontend/index.html`, `frontend/assets/js/script.js`, `frontend/books.js`, `loans.js`, `readers.js`, `fines.js`, `admin.js`, `dashboard.js` | Không tìm thấy bộ test tự động cho frontend | **Một phần kiểm thử**; không có cơ sở nói toàn bộ SCR đã nghiệm thu. |

### Các điểm tài liệu cần trả lời thẳng

1. **Spring Boot hay FastAPI?** Code và README hiện tại là Python/FastAPI + SQLAlchemy, MySQL; Dockerfile backend cũng chạy Python. Không tìm thấy backlog chính thức trong repo nên không xác nhận được backlog từng ghi Spring Boot, ai đổi, hay thời điểm đổi.
2. **Ưu tiên backlog khác SRS?** Không có SRS/backlog được Git theo dõi, nên không thể so sánh P0/P1 hoặc kết luận ưu tiên nào đã đổi. Không tự tạo lý do thay nhóm.
3. **Chế độ sáng/tối?** Có nút giao diện ở trang độc giả và lưu lựa chọn `ptit_theme`; CSS có `data-theme="dark"`. README/slide chưa mô tả chi tiết chức năng này. Bằng chứng: `frontend/index.html`, `frontend/assets/js/script.js`, `frontend/assets/js/ui.js`, CSS reader/pages.
4. **Tiến độ trong file theo dõi?** Không thấy file board/tracker trong danh sách Git. README có ảnh chụp công việc ngày 15/11 và trạng thái task ngày 18/11; commit gần nhất trong local history tới 24/11. Trả lời rằng README là snapshot cũ, chưa thay thế trạng thái board hiện hành.

## 3. Quy ước 5 mức cho 70 câu

| Mức | Ý nghĩa |
|---|---|
| M1 — Nhận biết | Nêu đúng mục tiêu, vai trò, công nghệ, thuật ngữ. |
| M2 — Giải thích luồng | Trình bày request đi qua UI/API/service/database như thế nào. |
| M3 — Truy code | Chỉ đúng file/hàm và giải thích vì sao code làm như vậy. |
| M4 — Ca biên | Xử lý lỗi, quyền, tranh chấp dữ liệu, rollback, thời gian, test. |
| M5 — Tổng hợp/đánh đổi | Kết nối nhiều module, nói rõ giới hạn và điều cần xác minh thêm. |

# Sổ tay hỏi–đáp mục 1–10: 70 câu

## Mục 1 — Bài toán, phạm vi và thông điệp mở đầu

**1. [M1] Hệ thống giải quyết bài toán gì?** (✓; xác suất: Cao; trả lời: Thông)  
**Đáp án mẫu:** Hệ thống số hóa tra cứu sách, đăng ký mượn, duyệt/trả, quản lý độc giả, phạt, đặt trước, tài khoản, nhật ký và thống kê. Em mô tả đúng phần có trong code, không khẳng định mọi yêu cầu SRS đã nghiệm thu.  
**Mở:** [README.md](../../README.md#L1), [main.py](../../backend/main.py#L44).

**2. [M1] Ai là người dùng và mỗi vai trò làm gì?** (✓; xác suất: Cao; trả lời: Thông)  
**Đáp án mẫu:** `READER` tra cứu và thao tác dữ liệu cá nhân; `LIBRARIAN` xử lý sách, phiếu và tiền phạt; `ADMIN` quản lý user, nhật ký và thống kê. Phân quyền được chốt ở backend, không chỉ ẩn menu ở frontend.  
**Mở:** [dependencies.py](../../backend/app/dependencies.py#L50), [README.md](../../README.md#L26).

**3. [M1] Công nghệ thực tế đang chạy là gì?** (✓; xác suất: Cao; trả lời: Thông)  
**Đáp án mẫu:** Frontend là HTML/CSS/JavaScript thuần; backend Python/FastAPI/SQLAlchemy; database MySQL; xác thực BCrypt/JWT; có Docker Compose. Không gọi đây là Spring Boot.  
**Mở:** [README.md](../../README.md#L16), [requirements.txt](../../backend/requirements.txt), [docker-compose.yml](../../docker-compose.yml#L1).

**4. [M2] Một yêu cầu đi qua các tầng nào?** (✓; xác suất: Cao; trả lời: Thông)  
**Đáp án mẫu:** UI gọi helper ở `frontend/api.js` hoặc request helper của reader; router FastAPI kiểm tra schema/dependency/role; service hoặc CRUD đọc/ghi ORM; SQLAlchemy kết nối MySQL; response được serialize về UI. Một số frontend còn có bản helper riêng, nên khi debug phải xác định đúng trang đang chạy.  
**Mở:** [api.js](../../frontend/api.js#L7), [main.py](../../backend/main.py#L44), [database.py](../../backend/app/database.py#L29).

**5. [M5] Vì sao không nói “đã hoàn tất theo SRS”?** (⚠; xác suất: Cao; trả lời: Thông)  
**Đáp án mẫu:** Vì bản SRS/NFR đầy đủ không nằm trong repository; em chỉ đối chiếu được bảng phân công và mã yêu cầu được ghi trong README/code. Unit test đạt không thay thế nghiệm thu tiêu chí SRS hoặc E2E trên MySQL/trình duyệt.  
**Mở:** [README.md](../../README.md#L36), [pre-defense-runbook.md](../../docs/pre-defense-runbook.md#L89).

**6. [M2] Ba vai trò khác nhau ở quyền backend ra sao?** (✓; xác suất: Cao; trả lời: Thông)  
**Đáp án mẫu:** `get_current_user` xác thực token và user; `RoleChecker` chuẩn hóa role rồi trả 403 nếu role không được phép. Mỗi router khai báo dependency phù hợp; cần mở đúng handler để chỉ ra quyền cụ thể.  
**Mở:** [dependencies.py](../../backend/app/dependencies.py#L15), [dependencies.py](../../backend/app/dependencies.py#L50).

**7. [M5] Nếu hội đồng hỏi một chức năng chưa kiểm chứng, em trả lời sao?** (✓; xác suất: Vừa; trả lời: Thông)  
**Đáp án mẫu:** “Code hiện có luồng này ở file/hàm …; test unit kiểm tra …; em chưa xác nhận trên MySQL và máy demo nên chưa tuyên bố E2E đạt. Em sẽ trình bày bằng chứng đã có và phần cần chạy bổ sung.”  
**Mở:** [pre-defense-runbook.md](../../docs/pre-defense-runbook.md#L1), [README.md](../../README.md#L123).

## Mục 2 — Repository, Git và lịch sử nhóm

**8. [M1] Nhánh chính hiện tại là nhánh nào?** (✓; xác suất: Vừa; trả lời: Thông)  
**Đáp án mẫu:** Trong bản clone đang kiểm tra, nhánh hiện hành là `main`. Ngoài ra còn các nhánh feature local và remote; sự tồn tại của ref không chứng minh nhánh còn được dùng.  
**Mở:** Bằng chứng lệnh `git branch --all` trong lượt kiểm kê; không có file nguồn để mở.

**9. [M1] Đã có tag `v1.0` chưa?** (✗; xác suất: Cao; trả lời: Thông)  
**Đáp án mẫu:** Chưa. `git tag --list` trả danh sách rỗng; runbook cũng ghi đây là điều kiện cần làm sau khi kiểm thử/đóng băng, không phải việc đã hoàn tất.  
**Mở:** [pre-defense-runbook.md](../../docs/pre-defense-runbook.md#L105).

**10. [M2] Có bằng chứng PR đã merge không?** (✓; xác suất: Vừa; trả lời: Thông)  
**Đáp án mẫu:** Local history có merge commit như PR #34, #33, #32, #31 và các PR trước đó. Em chỉ xác nhận theo commit trong bản clone; nếu cần tình trạng PR trực tiếp thì phải mở GitHub.  
**Mở:** Bằng chứng `git log --all --merges`; các subject được ghi trong báo cáo kiểm kê phía trên.

**11. [M2] Nhóm có tuân thủ nhánh/PR như README hướng dẫn không?** (⚠; xác suất: Vừa; trả lời: Thông)  
**Đáp án mẫu:** README mô tả quy trình feature branch, PR vào main và review. Merge commit trong lịch sử là bằng chứng có dùng PR cho một số phần, nhưng không đủ chứng minh mọi commit đều đã được review theo cùng checklist.  
**Mở:** [README.md](../../README.md#L401).

**12. [M3] Vì sao số commit tác giả khác nhau theo cách xem?** (⚠; xác suất: Thấp; trả lời: Thông)  
**Đáp án mẫu:** Git có tên hiển thị bí danh và merge commit; số trong tài liệu này đếm non-merge commit trên mọi ref và gộp theo email. Số commit không đo độ lớn hay chất lượng đóng góp.  
**Mở:** Bằng chứng `git shortlog -sne --all` và `git log --all --no-merges` trong lượt kiểm kê.

**13. [M4] Có thể dùng số commit để kết luận ai làm nhiều nhất không?** (✗; xác suất: Vừa; trả lời: Thông)  
**Đáp án mẫu:** Không. Commit có thể là merge, chỉnh nhiều file, hoặc chỉnh nhỏ; file cũng được nhiều người cùng sửa. Em dùng history để tìm người cần hỏi module, không dùng để chấm điểm đóng góp.  
**Mở:** [README.md](../../README.md#L7), lịch sử Git đã kiểm tra.

**14. [M5] Hai cây frontend ở root và `frontend/` xử lý thế nào?** (⚠; xác suất: Vừa; trả lời: Thông)  
**Đáp án mẫu:** Repository có cả `index.html`/`assets/` ở root lẫn `frontend/index.html`/`frontend/assets/`. Hướng dẫn chạy và Docker frontend trỏ tới `frontend/`; chưa xóa bộ root khi chưa truy hết tham chiếu và lịch sử.  
**Mở:** [README.md](../../README.md#L235), [frontend/index.html](../../frontend/index.html), [index.html](../../index.html).

## Mục 3 — Kiến trúc, dữ liệu và khởi động

**15. [M1] Backend mount những nhóm router nào?** (✓; xác suất: Cao; trả lời: Thông)  
**Đáp án mẫu:** Auth, admin, books, categories, readers, loans, reservations, fines và stats được include trong app. Đây là entry point để bắt đầu lần theo endpoint.  
**Mở:** [main.py](../../backend/main.py#L44).

**16. [M2] Các entity cốt lõi trong database là gì?** (✓; xác suất: Cao; trả lời: Thành)  
**Đáp án mẫu:** `User`, `Book`, `Category`, `Loan`, `Fine`, `Reservation`, `AuditLog`, `RevokedToken`. Quan hệ chính: sách thuộc thể loại; khoản phạt gắn phiếu; giữ chỗ gắn user/sách; token bị thu hồi định danh bằng `jti`.  
**Mở:** [models.py](../../backend/app/models.py#L9).

**17. [M3] Vì sao số lượng tổng và số lượng khả dụng tách riêng?** (✓; xác suất: Vừa; trả lời: Thành)  
**Đáp án mẫu:** `total_copies` lưu tổng bản; `available_copies` phản ánh số bản hiện có thể cho mượn. Duyệt phiếu giảm available; nhận trả tăng lại; tổng không tự giảm khi người đọc mới gửi yêu cầu.  
**Mở:** [models.py](../../backend/app/models.py#L18), [loan_service.py](../../backend/app/loan_service.py#L174), [loan_service.py](../../backend/app/loan_service.py#L276).

**18. [M3] `Loan` nối với `User` bằng foreign key không?** (⚠; xác suất: Thấp; trả lời: Thành)  
**Đáp án mẫu:** Trong model hiện tại `Loan.user_id` là `BigInteger` nhưng không khai báo `ForeignKey`; `book_id` có foreign key. Đây là chi tiết cần xác minh với schema đang chạy và SRS, không được nói model đã bảo đảm FK user.  
**Mở:** [models.py](../../backend/app/models.py#L38).

**19. [M2] Mỗi thao tác ghi được commit ở đâu?** (✓; xác suất: Vừa; trả lời: Thông)  
**Đáp án mẫu:** Các service nghiệp vụ thêm/sửa ORM, ghi audit log cùng transaction rồi gọi `db.commit()`. Nếu thao tác thất bại trước commit, router/service trả lỗi; cần xem từng hàm để khẳng định rollback cụ thể.  
**Mở:** [loan_service.py](../../backend/app/loan_service.py#L21), [auth.py](../../backend/app/routers/auth.py#L17).

**20. [M4] Có khóa hàng để giảm tranh chấp tồn kho không?** (⚠; xác suất: Vừa; trả lời: Thông)  
**Đáp án mẫu:** Một số luồng khóa user/book/loan bằng `with_for_update()` trước cập nhật. Test hiện chạy SQLite trong bộ nhớ, nên không chứng minh locking cạnh tranh trên MySQL; cần concurrency test trên MySQL demo.  
**Mở:** [loan_service.py](../../backend/app/loan_service.py#L21), [test_auth_and_loans.py](../../backend/tests/test_auth_and_loans.py#L1).

**21. [M2] Phân trang sách trả những trường gì?** (✓; xác suất: Vừa; trả lời: Thành)  
**Đáp án mẫu:** Endpoint sách dùng schema `PageResponse`; UI lấy tổng từ phản hồi phân trang thay vì cộng số sách trong trang hiện tại. Cần kiểm tra `totalElements`/schema trực tiếp nếu hội đồng hỏi tên field.  
**Mở:** [books.py](../../backend/app/routers/books.py#L16), [schemas.py](../../backend/app/schemas.py#L58), [books.js](../../frontend/books.js#L292).

**22. [M3] Model và migration phối hợp thế nào?** (⚠; xác suất: Vừa; trả lời: Thông)  
**Đáp án mẫu:** Model là cấu trúc ORM hiện tại; repository có script migration cụ thể như `migrate_auth_loan.py`. `main.py` còn gọi `create_all()` lúc import, vì vậy không được nhầm `create_all` với migration có kiểm soát trên database production.  
**Mở:** [main.py](../../backend/main.py#L22), [migrate_auth_loan.py](../../backend/migrate_auth_loan.py).

**23. [M4] Lệnh khởi động API có thể tự thay schema không?** (✓; xác suất: Cao; trả lời: Thông)  
**Đáp án mẫu:** Có. Import `main.py` gọi `Base.metadata.create_all(bind=engine)`. Chỉ chạy với database demo đã backup/được phép; trong lượt audit này không chạy `create_all` lên DB thật.  
**Mở:** [main.py](../../backend/main.py#L22).

**24. [M5] Docker Compose gồm gì và điều gì chưa được xác minh?** (⚠; xác suất: Vừa; trả lời: Thông)  
**Đáp án mẫu:** Compose khai báo MySQL, backend và frontend, có healthcheck MySQL và volume dữ liệu. Chưa chạy Docker Desktop/migration/E2E trên máy bảo vệ nên chỉ xác nhận cấu hình tồn tại, không nói triển khai đã đạt.  
**Mở:** [docker-compose.yml](../../docker-compose.yml#L1), [pre-defense-runbook.md](../../docs/pre-defense-runbook.md#L7).

## Mục 4 — Auth, phân quyền và an toàn

**25. [M1] Đăng ký tạo loại tài khoản nào?** (✓; xác suất: Cao; trả lời: Thông)  
**Đáp án mẫu:** Endpoint đăng ký tạo user role `READER`, chuẩn hóa username/email, hash mật khẩu và ghi log. Người đăng ký không tự chọn ADMIN/LIBRARIAN.  
**Mở:** [auth.py](../../backend/app/routers/auth.py#L17).

**26. [M2] Đăng nhập chấp nhận định danh nào?** (✓; xác suất: Cao; trả lời: Thông)  
**Đáp án mẫu:** Tìm theo username hoặc email không phân biệt hoa thường; kiểm tra tài khoản tồn tại, chưa khóa và BCrypt password hợp lệ; sau đó tạo JWT.  
**Mở:** [auth.py](../../backend/app/routers/auth.py#L73).

**27. [M3] Mật khẩu được lưu như thế nào?** (✓; xác suất: Cao; trả lời: Thông)  
**Đáp án mẫu:** Mật khẩu rõ được chuyển qua `bcrypt.hashpw` với salt do bcrypt tạo; xác minh bằng `bcrypt.checkpw`. Database lưu `password_hash`, không lưu mật khẩu rõ.  
**Mở:** [auth_service.py](../../backend/app/auth_service.py#L13), [models.py](../../backend/app/models.py#L113).

**28. [M3] JWT chứa gì và hết hạn sau bao lâu?** (✓; xác suất: Cao; trả lời: Thông)  
**Đáp án mẫu:** Token có `sub`, `user_id`, role và thông tin định danh; hàm tạo token thêm `exp` và `jti`. Mặc định thời hạn là 24 giờ; xác minh dùng cùng secret/algorithm trong code hiện tại.  
**Mở:** [auth_service.py](../../backend/app/auth_service.py#L10), [auth.py](../../backend/app/routers/auth.py#L100), [security.py](../../backend/app/security.py#L8).

**29. [M4] Backend phân biệt 401 và 403 ra sao?** (✓; xác suất: Vừa; trả lời: Thông)  
**Đáp án mẫu:** Token thiếu/sai/hết hạn, user bị khóa hoặc không tồn tại dẫn đến 401; token hợp lệ nhưng role không được phép thì `RoleChecker` trả 403.  
**Mở:** [dependencies.py](../../backend/app/dependencies.py#L15), [dependencies.py](../../backend/app/dependencies.py#L54).

**30. [M3] Logout vô hiệu hóa JWT vốn stateless bằng cách nào?** (✓; xác suất: Vừa; trả lời: Thông)  
**Đáp án mẫu:** Logout lưu `jti` và `expires_at` vào `RevokedToken`; mỗi lần xác thực, dependency kiểm tra token có bị thu hồi không. Bản ghi hết hạn được dọn trong luồng logout.  
**Mở:** [auth.py](../../backend/app/routers/auth.py#L133), [dependencies.py](../../backend/app/dependencies.py#L36), [models.py](../../backend/app/models.py#L86).

**31. [M4] Đổi mật khẩu có kiểm tra mật khẩu hiện tại không?** (✓; xác suất: Vừa; trả lời: Thông)  
**Đáp án mẫu:** Có; endpoint so sánh mật khẩu hiện tại với hash rồi mới hash mật khẩu mới, ghi audit và commit. Không nói token cũ tự bị thu hồi nếu code không thực hiện việc đó.  
**Mở:** [auth.py](../../backend/app/routers/auth.py#L158).

**32. [M4] Khóa tài khoản có chặn token đang còn hạn không?** (✓; xác suất: Vừa; trả lời: Thông)  
**Đáp án mẫu:** Dependency lấy user hiện tại từ database ở mỗi request và từ chối user `is_locked`; do đó token cũ của user bị khóa cũng không sử dụng được. Có test cho trường hợp này.  
**Mở:** [dependencies.py](../../backend/app/dependencies.py#L43), [test_auth_and_loans.py](../../backend/tests/test_auth_and_loans.py#L133).

**33. [M5] NFR-02 bảo mật đã đạt chưa?** (⚠; xác suất: Cao; trả lời: Thông)  
**Đáp án mẫu:** Em chưa thể kết luận vì thiếu tiêu chí NFR-02 chính thức. Code có BCrypt/JWT/RBAC/lock/revocation/audit; chưa có bằng chứng rate-limit, kiểm thử bảo mật, HTTPS triển khai hoặc rà soát đầy đủ từng endpoint.  
**Mở:** [security.py](../../backend/app/security.py#L8), [pre-defense-runbook.md](../../docs/pre-defense-runbook.md#L89).

**34. [M4] Có thể dùng secret mặc định trong production không?** (✗; xác suất: Cao; trả lời: Thông)  
**Đáp án mẫu:** Không. `security.py` chỉ có khóa fallback cho development và ném lỗi nếu production thiếu secret; Compose hiện có fallback development key nên phải thay secret cấu hình trước khi triển khai.  
**Mở:** [security.py](../../backend/app/security.py#L8), [docker-compose.yml](../../docker-compose.yml#L25).

## Mục 5 — Mượn/trả và quy tắc LOAN

**35. [M1] Các trạng thái hoạt động được tính vào giới hạn BR01 là gì?** (✓; xác suất: Cao; trả lời: Thông)  
**Đáp án mẫu:** `PENDING` và `BORROWING`; nếu độc giả đã có 3 phiếu trong hai trạng thái này thì yêu cầu mới bị từ chối. Reservation không được cộng thành loan.  
**Mở:** [loan_service.py](../../backend/app/loan_service.py#L14), [loan_service.py](../../backend/app/loan_service.py#L64).

**36. [M2] Yêu cầu mượn hợp lệ nhận thời hạn nào?** (✓; xác suất: Vừa; trả lời: Thông)  
**Đáp án mẫu:** Chỉ 7, 14 hoặc 30 ngày; phiếu mới ở `PENDING`. Test có ca chấp nhận 30 ngày và từ chối số ngày khác.  
**Mở:** [loan_service.py](../../backend/app/loan_service.py#L15), [test_auth_and_loans.py](../../backend/tests/test_auth_and_loans.py#L207).

**37. [M3] Vì sao tạo yêu cầu chưa giảm tồn kho?** (✓; xác suất: Cao; trả lời: Thông)  
**Đáp án mẫu:** Tạo phiếu chỉ ghi `PENDING`. Khi thủ thư approve, service khóa sách, kiểm tra tồn kho/hold, mới trừ một bản, chuyển `BORROWING` và đặt hạn trả.  
**Mở:** [loan_service.py](../../backend/app/loan_service.py#L21), [loan_service.py](../../backend/app/loan_service.py#L174), [test_auth_and_loans.py](../../backend/tests/test_auth_and_loans.py#L169).

**38. [M4] Những điều kiện nào chặn yêu cầu mượn mới?** (✓; xác suất: Cao; trả lời: Thông)  
**Đáp án mẫu:** Thời hạn không hợp lệ, user/sách không hợp lệ, sách không khả dụng, vượt 3 phiếu hoạt động, trùng sách đã pending/borrowing, hoặc còn phiếu borrowing quá hạn chưa trả.  
**Mở:** [loan_service.py](../../backend/app/loan_service.py#L21).

**39. [M3] Độc giả hủy phiếu ở trạng thái nào?** (✓; xác suất: Vừa; trả lời: Thông)  
**Đáp án mẫu:** Chỉ phiếu `PENDING` của chính user; hủy chuyển sang `CANCELLED`. Không trả tồn kho vì bản chưa bị trừ khi tạo phiếu.  
**Mở:** [loan_service.py](../../backend/app/loan_service.py#L125), [test_auth_and_loans.py](../../backend/tests/test_auth_and_loans.py#L363).

**40. [M3] Thủ thư duyệt phiếu làm thay đổi những gì?** (✓; xác suất: Cao; trả lời: Thông)  
**Đáp án mẫu:** Chuyển `PENDING` sang `BORROWING`, giảm `available_copies`, đặt `borrow_date`/`due_date`, lưu `approved_by`, hoàn tất hold của chính người đó nếu có, ghi log và commit.  
**Mở:** [loan_service.py](../../backend/app/loan_service.py#L174).

**41. [M4] Nếu sách hết bản ngay lúc duyệt thì sao?** (✓; xác suất: Vừa; trả lời: Thông)  
**Đáp án mẫu:** API trả 409; phiếu vẫn ở trạng thái chờ, không trừ tồn kho. Khi duyệt có kiểm tra cả số bản khả dụng và số hold đang hoạt động.  
**Mở:** [loan_service.py](../../backend/app/loan_service.py#L194).

**42. [M3] Từ chối phiếu ảnh hưởng tồn kho thế nào?** (✓; xác suất: Vừa; trả lời: Thông)  
**Đáp án mẫu:** Chuyển phiếu từ `PENDING` sang `REJECTED`, ghi log; không giảm/tăng tồn kho vì bản chưa bị giữ bằng loan.  
**Mở:** [loan_service.py](../../backend/app/loan_service.py#L245), [test_auth_and_loans.py](../../backend/tests/test_auth_and_loans.py#L363).

**43. [M3] Khi nhận trả sách, loan và book thay đổi ra sao?** (✓; xác suất: Cao; trả lời: Thông)  
**Đáp án mẫu:** Chỉ nhận trả phiếu `BORROWING`; đặt `RETURNED` và `return_date`, tăng available copies, tính/chốt phạt nếu có, đồng bộ reservation, ghi audit và commit. Chặn nhận trả lần hai.  
**Mở:** [loan_service.py](../../backend/app/loan_service.py#L276), [test_auth_and_loans.py](../../backend/tests/test_auth_and_loans.py#L373).

**44. [M4] Gia hạn có giới hạn gì?** (✓; xác suất: Vừa; trả lời: Thông)  
**Đáp án mẫu:** Chỉ chủ phiếu `BORROWING`, chưa quá hạn, có due date và chưa gia hạn lần nào; cộng 7 ngày; bị chặn nếu reservation của người khác đang chờ/giữ sách. Test bao phủ các ca chính.  
**Mở:** [loan_service.py](../../backend/app/loan_service.py#L337), [test_auth_and_loans.py](../../backend/tests/test_auth_and_loans.py#L233).

**45. [M5] Hai nhân viên cùng duyệt một phiếu có thể gây gì và code phòng thế nào?** (⚠; xác suất: Vừa; trả lời: Thông)  
**Đáp án mẫu:** Có nguy cơ cập nhật trùng tồn kho; service khóa bản ghi loan/book và chỉ approve trạng thái `PENDING`. Test SQLite không chứng minh khóa hàng MySQL khi có hai request đồng thời; đó là ca cần E2E/concurrency test.  
**Mở:** [loan_service.py](../../backend/app/loan_service.py#L174), [test_auth_and_loans.py](../../backend/tests/test_auth_and_loans.py#L1).

## Mục 6 — Sách, thể loại, độc giả, phạt, đặt trước, thống kê

**46. [M2] Tìm kiếm sách hỗ trợ những trường nào?** (✓; xác suất: Vừa; trả lời: Thành)  
**Đáp án mẫu:** Endpoint nhận keyword, phân trang và bộ lọc tìm kiếm; CRUD layer có chuẩn hóa chữ để tìm tiếng Việt không dấu. Test có tìm theo title/author/ISBN và tìm “nguyen” khớp “Nguyễn”.  
**Mở:** [books.py](../../backend/app/routers/books.py#L16), [crud.py](../../backend/app/crud.py#L17), [test_books_and_stats.py](../../backend/tests/test_books_and_stats.py#L110).

**47. [M3] Có thể xóa thể loại đang có sách không?** (✓; xác suất: Vừa; trả lời: Thành)  
**Đáp án mẫu:** Không; CRUD trả conflict nếu còn sách tham chiếu. Test kiểm tra xóa thể loại đang dùng bị 409 rồi xóa được sau khi sách được xử lý.  
**Mở:** [crud.py](../../backend/app/crud.py#L357), [test_books_and_stats.py](../../backend/tests/test_books_and_stats.py#L66).

**48. [M2] API độc giả cho phép ai xem danh sách/lịch sử?** (✓; xác suất: Vừa; trả lời: Thành)  
**Đáp án mẫu:** Các route readers yêu cầu vai trò staff theo khai báo dependency; dữ liệu lịch sử được lấy theo reader id. Trong test suite hiện tại chưa thấy test endpoint authorization riêng cho readers.  
**Mở:** [readers.py](../../backend/app/routers/readers.py#L14), [readers.py](../../backend/app/routers/readers.py#L22).

**49. [M3] Tiền phạt tính theo công thức nào?** (✓; xác suất: Cao; trả lời: Thành)  
**Đáp án mẫu:** `max(0, số ngày trễ) × 5.000đ`; đúng hạn/trả sớm hoặc thiếu ngày thì 0. Khi nhận trả, khoản fine được chốt theo loan và unique loan id.  
**Mở:** [services.py](../../backend/app/services.py#L6), [services.py](../../backend/app/services.py#L10), [models.py](../../backend/app/models.py#L61).

**50. [M4] Hệ thống ngăn thu một khoản phạt hai lần thế nào?** (✓; xác suất: Vừa; trả lời: Thành)  
**Đáp án mẫu:** CRUD kiểm tra khoản đã paid trước khi cập nhật, trả 409 khi thu lặp; test xác nhận tổng chưa thu về 0 sau khi thanh toán và lần hai bị chặn.  
**Mở:** [crud.py](../../backend/app/crud.py#L504), [test_fines_and_reservations.py](../../backend/tests/test_fines_and_reservations.py#L70).

**51. [M2] Khi nào độc giả được đặt trước?** (✓; xác suất: Vừa; trả lời: Thành)  
**Đáp án mẫu:** Chỉ khi sách hết bản có thể mượn; user không được có reservation `WAITING`/`HOLDING` trùng cùng sách. Phiếu mới xếp `WAITING`.  
**Mở:** [reservation_service.py](../../backend/app/reservation_service.py#L74).

**52. [M3] Hàng đợi đặt trước chuyển sang giữ chỗ ra sao?** (✓; xác suất: Cao; trả lời: Thành)  
**Đáp án mẫu:** `sync_book` sắp `WAITING` theo thời gian tạo rồi id; với số bản có thể cấp, chuyển các phiếu đầu hàng đợi sang `HOLDING`, đặt hạn 48 giờ và log.  
**Mở:** [reservation_service.py](../../backend/app/reservation_service.py#L28), [reservation_service.py](../../backend/app/reservation_service.py#L64).

**53. [M4] Có worker tự chạy để hết hạn reservation không?** (✗; xác suất: Vừa; trả lời: Thành)  
**Đáp án mẫu:** Không thấy scheduler/worker trong repo. Hết hạn được đồng bộ khi các luồng gọi `sync_book`, ví dụ tạo/hủy reservation, mượn/trả hoặc list của reader; không nên nói hệ thống quét nền liên tục.  
**Mở:** [reservation_service.py](../../backend/app/reservation_service.py#L28), [reservation_service.py](../../backend/app/reservation_service.py#L218).

**54. [M5] Trả sách liên hệ tới người đặt trước kế tiếp như thế nào?** (✓; xác suất: Cao; trả lời: Thành)  
**Đáp án mẫu:** Trả sách tăng available copies rồi gọi đồng bộ reservation; hàng đợi được xử lý theo thứ tự và người kế tiếp có thể nhận giữ chỗ. Khi chủ hold đăng ký mượn và được duyệt, hold chuyển `FULFILLED`.  
**Mở:** [loan_service.py](../../backend/app/loan_service.py#L276), [reservation_service.py](../../backend/app/reservation_service.py#L28), [test_auth_and_loans.py](../../backend/tests/test_auth_and_loans.py#L393).

**55. [M3] Dashboard thống kê những nhóm nào?** (✓; xác suất: Vừa; trả lời: Thành)  
**Đáp án mẫu:** Có overview, top sách và số phiếu theo tháng; router thống kê có endpoint public riêng và các endpoint staff. Test tạo loan/return mẫu rồi kiểm tra overview, top và chuỗi 6 tháng.  
**Mở:** [stats.py](../../backend/app/routers/stats.py#L15), [crud.py](../../backend/app/crud.py#L630), [test_books_and_stats.py](../../backend/tests/test_books_and_stats.py#L132).

**56. [M4] Nếu một endpoint thống kê không có field cần cho UI thì có nên tự bịa không?** (✓; xác suất: Vừa; trả lời: Tân)  
**Đáp án mẫu:** Không. UI phải ẩn chỉ số không có dữ liệu hoặc thể hiện trạng thái lỗi; không dùng số demo giả thay backend. Cần đối chiếu schema response với cách render trên dashboard.  
**Mở:** [schemas.py](../../backend/app/schemas.py#L247), [dashboard.js](../../frontend/dashboard.js#L51).

## Mục 7 — Frontend và hợp đồng API

**57. [M2] Reader search tải dữ liệu và phân trang thế nào?** (✓; xác suất: Vừa; trả lời: Đan)  
**Đáp án mẫu:** Reader JS gọi endpoint sách theo trang, chuẩn hóa response rồi render danh sách/phân trang; helper `fetchAllBooks` có luồng lấy thêm trang để phục vụ các màn cần toàn bộ danh sách. Không suy ra dữ liệu đã hiển thị đúng nếu chưa quan sát trang chạy với API.  
**Mở:** [script.js](../../frontend/assets/js/script.js#L478), [script.js](../../frontend/assets/js/script.js#L536).

**58. [M3] Reader frontend lưu token ở đâu và gắn vào request ra sao?** (⚠; xác suất: Cao; trả lời: Đan)  
**Đáp án mẫu:** Reader helper đọc token theo key `ptit_token`, user theo `ptit_user`; các request cần auth thêm bearer token. Khi trả lời cần mở đúng helper đang được trang `frontend/index.html` nạp, không nhầm với `assets/js/script.js` ở root.  
**Mở:** [script.js](../../frontend/assets/js/script.js#L23), [script.js](../../frontend/assets/js/script.js#L190), [api.js](../../frontend/api.js#L7).

**59. [M2] Những thao tác chính của độc giả nối API nào?** (✓; xác suất: Vừa; trả lời: Đan)  
**Đáp án mẫu:** Tra cứu qua books; tạo/hủy loan và xem loan của mình qua loans; đặt/hủy reservation; xem fine cá nhân; đổi mật khẩu qua auth. Cần nêu đúng endpoint theo helper và router, không nói frontend tự quyết quyền.  
**Mở:** [api.js](../../frontend/api.js#L95), [api.js](../../frontend/api.js#L157), [api.js](../../frontend/api.js#L247), [loans.py](../../backend/app/routers/loans.py#L52).

**60. [M2] Màn thủ thư cập nhật loan ra sao?** (✓; xác suất: Vừa; trả lời: Tân)  
**Đáp án mẫu:** `loans.js` tải phiếu, lọc và gọi helper approve/reject/return; backend là nơi quyết định hợp lệ và cập nhật tồn kho.  
**Mở:** [loans.js](../../frontend/loans.js#L300), [loans.js](../../frontend/loans.js#L360), [api.js](../../frontend/api.js#L165).

**61. [M3] Admin quản lý tài khoản và audit log qua đâu?** (✓; xác suất: Vừa; trả lời: Tân)  
**Đáp án mẫu:** `admin.js` gọi các helper đọc user/log và cập nhật role/lock; API ở `/api/admin` yêu cầu ADMIN. Không dựa riêng vào việc menu bị ẩn.  
**Mở:** [admin.js](../../frontend/admin.js#L316), [admin.py](../../backend/app/routers/admin.py#L21).

**62. [M4] Có automated frontend tests không?** (✗; xác suất: Vừa; trả lời: Đan hoặc Tân)  
**Đáp án mẫu:** Trong file được Git theo dõi không thấy bộ unit/component test frontend. Có manual checklist và video/demo artifacts, nhưng chúng không tương đương test tự động; cần trình bày rõ cách đã kiểm tra trên browser nếu có.  
**Mở:** [defense-rehearsal.md](../../docs/defense-rehearsal.md#L1), danh sách file `git ls-files`.

## Mục 8 — Nhật ký, lỗi và tình huống biên

**63. [M2] Nhật ký ghi những nhóm hoạt động nào?** (⚠; xác suất: Vừa; trả lời: Thông)  
**Đáp án mẫu:** Các luồng auth, admin, sách, loan, reservation có gọi log helper; `AuditLog` lưu actor/action/detail/time. Phải kiểm tra từng route để không khẳng định mọi thao tác đều được ghi.  
**Mở:** [log_service.py](../../backend/app/log_service.py#L1), [models.py](../../backend/app/models.py#L72).

**64. [M3] Ai được xem nhật ký?** (✓; xác suất: Vừa; trả lời: Tân)  
**Đáp án mẫu:** Endpoint admin logs có role guard ADMIN; frontend admin render actor/action/thời gian.  
**Mở:** [admin.py](../../backend/app/routers/admin.py#L94), [admin.js](../../frontend/admin.js#L249).

**65. [M4] Nếu người ghi log đã bị xóa thì giao diện xử lý thế nào?** (✓; xác suất: Thấp; trả lời: Thông)  
**Đáp án mẫu:** Test kiểm tra actor hiện hữu, actor id không còn user và actor null; API trả nhãn fallback thay vì lỗi khi map actor.  
**Mở:** [test_auth_and_loans.py](../../backend/tests/test_auth_and_loans.py#L145), [admin.py](../../backend/app/routers/admin.py#L94).

**66. [M4] Khi request không hợp lệ, backend trả lỗi gì?** (✓; xác suất: Vừa; trả lời: Thông)  
**Đáp án mẫu:** Code dùng các status HTTP như 400 cho input sai, 401 cho xác thực, 403 cho quyền, 404 cho không tìm thấy và 409 cho xung đột nghiệp vụ. Cụ thể phải chỉ đúng nhánh trong service/route.  
**Mở:** [dependencies.py](../../backend/app/dependencies.py#L15), [loan_service.py](../../backend/app/loan_service.py#L21).

**67. [M5] Một thao tác nghiệp vụ có log nhưng commit chính thất bại thì sao?** (⚠; xác suất: Thấp; trả lời: Thông)  
**Đáp án mẫu:** Log thường được thêm trong cùng SQLAlchemy session trước `commit`, nên cùng transaction sẽ commit/rollback theo thao tác. Phải xác minh từng đường lỗi và không nói có transaction phân tán hay outbox nếu code chưa có.  
**Mở:** [loan_service.py](../../backend/app/loan_service.py#L21), [log_service.py](../../backend/app/log_service.py#L1).

## Mục 9 — Kiểm thử, Docker và khả năng tái lập

**68. [M1] Bộ unit test hiện chạy được bao nhiêu ca?** (✓; xác suất: Cao; trả lời: Thông)  
**Đáp án mẫu:** Lượt này chạy `python -m unittest discover -s tests -v` trong `backend/`: 23/23 đạt. README còn ghi kết quả cũ 18/18 nên cần cập nhật tài liệu; đây là test trên SQLite trong bộ nhớ.  
**Mở:** [test_auth_and_loans.py](../../backend/tests/test_auth_and_loans.py#L1), [test_books_and_stats.py](../../backend/tests/test_books_and_stats.py#L1), [test_fines_and_reservations.py](../../backend/tests/test_fines_and_reservations.py#L1), [README.md](../../README.md#L123).

**69. [M4] Test có chứng minh coverage là bao nhiêu phần trăm không?** (✗; xác suất: Vừa; trả lời: Thông)  
**Đáp án mẫu:** Chưa. Lệnh kiểm tra cho thấy package `coverage` không được cài; không cài thêm trong lượt audit. Vì vậy em báo số test pass, không tự ước lượng phần trăm coverage.  
**Mở:** [requirements.txt](../../backend/requirements.txt), ba file trong [backend/tests/](../../backend/tests/).

**70. [M5] Kết luận ngắn gọn về độ sẵn sàng bảo vệ là gì?** (⚠; xác suất: Cao; trả lời: Thông, bổ sung đúng owner)  
**Đáp án mẫu:** “Các luồng backend chính có code và 23 unit test đang đạt trên SQLite. Còn thiếu đối chiếu SRS/NFR-02 chính thức, coverage, E2E MySQL/browser và xác nhận Docker trên máy demo; README/tiến độ cần cập nhật. Em không tuyên bố các mục chưa kiểm chứng là đã đạt.”  
**Mở:** [README.md](../../README.md#L112), [pre-defense-runbook.md](../../docs/pre-defense-runbook.md#L89), [defense-rehearsal.md](../../docs/defense-rehearsal.md#L1).

## Kết thúc lượt 1

- Đã kiểm tra chỉ đọc Git refs/log/file list và đối chiếu code/test; chạy 23 backend unit tests trên SQLite trong bộ nhớ.
- Không chạy Docker, migration, `create_all`, seed hay thao tác ghi database; không đọc nội dung `.env`/`.env.demo`.
- Không cài package coverage; coverage chưa đo.
- Tại thời điểm chốt lượt 1, các mục 11A/11B/11C, mục 12 và 40 câu bổ sung còn chờ; nội dung đã được bổ sung ở phần lượt 2 bên dưới.
- Trong lượt 1 này, tôi chưa sửa mã nguồn; chỉ tạo tài liệu trong `tools/docs/`.

# Lượt 2 — Bản đồ nhóm, câu hỏi bổ sung và điều phối

> Bổ sung theo yêu cầu tiếp tục. Ngân hàng chính có 110 câu: 70 câu mục 1–10 ở trên + 25 câu quy trình (71–95) + 15 câu liên module (96–110). Bộ 15 câu sâu của Thông và 36 câu theo thành viên ở mục 11B/11C là danh sách ôn tập chọn lọc, không cộng thêm vào con số 110.

## 11A. Bản đồ dự án

### Cây thư mục rút gọn và người phụ trách

| Thư mục/file | Vai trò | Phụ trách theo phân công / history |
|---|---|---|
| `backend/main.py` | Tạo FastAPI, CORS, mount router; hiện gọi `create_all` khi import. | Thông tích hợp; Thành sở hữu nhiều API nghiệp vụ. |
| `backend/app/models.py`, `schemas.py`, `database.py` | ORM, hợp đồng dữ liệu, session/engine. | Thành phụ trách DB/nghiệp vụ; Thông tích hợp Auth/Loan. |
| `backend/app/routers/` | Endpoint auth, sách, category, readers, loans, fine, reservation, admin, stats. | Theo module: Thông (auth/loan/log), Thành (book/readers/fine/reservation/stats); đồng sở hữu router admin. |
| `backend/app/auth_service.py`, `dependencies.py`, `loan_service.py`, `log_service.py`, `reservation_service.py`, `services.py`, `crud.py` | Logic dịch vụ, quyền, nghiệp vụ và truy vấn. | Theo module và README; file giao nhau cần xác nhận người trực tiếp sửa. |
| `backend/tests/` | Ba file unittest backend. | Cả nhóm; history có test từ nhiều tác giả. |
| `frontend/` | Bộ giao diện được README/Docker dùng để chạy. | Đan (reader), Tân (librarian/admin), Thông tích hợp. |
| `frontend/api.js`, `assets/js/auth.js`, `assets/js/ui.js` | API helper, xác thực/UI dùng chung. | Có thay đổi giao nhau trong Git; không gán độc quyền chỉ dựa README. |
| `frontend/assets/js/script.js`, `index.html` | SPA độc giả: overview, search, my loans, reservation, fine, password. | Đan theo phân công; Thông có commit tích hợp. |
| `frontend/books.js`, `loans.js`, `readers.js`, `fines.js`, `admin.js`, `dashboard.js` và HTML tương ứng | Màn thủ thư/quản trị. | Tân theo phân công; API do Thành/Thông cung cấp. |
| `assets/`, `index.html` tại root | Một bộ frontend/reader song song; không phải đường chạy trong README hiện hành. | History có commit của Đan/Thông; chưa xóa vì còn phải truy tham chiếu. |
| `docker-compose.yml`, Dockerfiles | Cấu hình MySQL + backend + frontend. | Cả nhóm; chưa có bằng chứng đã chạy trên máy bảo vệ. |
| `docs/` | Slide, runbook, checklist tập. | Tài liệu nhóm; một số đoạn cũ/mâu thuẫn. |
| `tools/cover-fix/`, `tools/demo-video/`, `backups/` | Công cụ/hồ sơ hỗ trợ, không phải runtime chính. | Giữ nguyên cho đến khi chủ sở hữu xác nhận dọn. |

### Ma trận module × người × file × API × màn hình × test

| Module | Người chính / phối hợp | File và hàm mở | API chính | Màn hình | Test |
|---|---|---|---|---|---|
| Auth/JWT/RBAC | Thông; Đan/Tân UI | `auth_service.hash_password/create_access_token`; `dependencies.get_current_user/RoleChecker`; `routers/auth.py` | `/api/auth/*` | `login.html`, `register.html`, reader auth modal, `admin.html` | `test_auth_and_loans.py` |
| Loan/duyệt/trả | Thông; Đan reader; Tân thủ thư | `LoanService.create_request/cancel_request/approve/reject/return_book/extend` | `/api/loans/*` | reader “Sách của tôi”; `loans.html` | `test_auth_and_loans.py` |
| Log | Thông; Tân xem log | `create_system_log`; `routers/admin.list_audit_logs` | `/api/admin/logs` | `admin.html` | test actor mapping trong `test_auth_and_loans.py` |
| DB/Book/Category | Thành; Tân UI; Đan tra cứu | `models.Book/Category`; `crud.get_books_paginated/create_book/update_book`; `books.js` | `/api/books`, `/api/categories` | `index.html`, `books.html` | `test_books_and_stats.py` |
| Reader API | Thành; Tân UI | `routers/readers.get_readers/get_reader_loans`; `crud.get_readers/get_reader_loan_history` | `/api/readers/*` | `readers.html` | Không thấy test endpoint riêng |
| Fine | Thành; Đan reader; Tân thu phạt | `FineService.calculate_fine`; `crud.mark_fine_as_paid`; `fines.js` | `/api/fines/*` | reader “Tiền phạt”, `fines.html` | `test_fines_and_reservations.py` |
| Reservation/Hold | Thành; Đan UI | `ReservationService.create/sync_book/cancel/list_for_reader` | `/api/reservations/*` | reader “Đặt trước” | Test hàng đợi/48h trong `test_fines_and_reservations.py` |
| Stats | Thành API; Tân UI | `crud.get_stats_overview/get_top_borrowed_books/get_monthly_loan_stats`; `dashboard.js` | `/api/stats/*` | `dashboard.html` | `test_books_and_stats.py` |
| Reader frontend | Đan; Thông tích hợp | `fetchAllBooks/loadBooks/loadReaderData/renderMyLoans` trong `frontend/assets/js/script.js` | Books, loans, reservations, fines, auth | `frontend/index.html` | Không thấy automated frontend test |
| Staff/admin frontend | Tân; Thành/Thông API | `loadBooks`, `handleLoanAction`, `loadReaders`, `loadFines`, `loadAdminData`, `loadDashboard` | Books, loans, readers, fines, admin, stats | `books.html`, `loans.html`, `readers.html`, `fines.html`, `admin.html`, `dashboard.html` | Không thấy automated frontend test |

Tên hàm và route trên đây là điểm bắt đầu tra code; tên màn hình SCR trong yêu cầu cần đối chiếu bản SRS gốc trước khi tuyên bố đủ từng tiêu chí.

### Luồng đầu-cuối theo vai trò

- **Độc giả:** `frontend/index.html` → `frontend/assets/js/script.js` (đăng nhập, `fetchBooksPage`/`fetchAllBooks`, gửi mượn hoặc reservation, tải dữ liệu cá nhân) → `frontend/api.js`/reader request helper → `routers/auth.py`, `books.py`, `loans.py`, `reservations.py`, `fines.py` → dependency role/token → service/CRUD → models/database → response render lại. Chỉ gửi POST/PUT/PATCH/DELETE trong demo database đã chuẩn bị.
- **Thủ thư:** `loans.html`/`books.html`/`readers.html`/`fines.html` → các file JS cùng tên → helper trong `frontend/api.js` → router staff → `LoanService`/CRUD → cập nhật tồn kho, phạt, log cùng session → UI tải lại danh sách. API mới là nơi quyết định role và điều kiện nghiệp vụ.
- **Quản trị:** `admin.html`/`dashboard.html` → `admin.js`/`dashboard.js` → helper admin/stats → `/api/admin/*` và `/api/stats/*` → role ADMIN/role staff theo route → database → bảng/log/chỉ số. Không được coi dashboard là quyền admin nếu endpoint chỉ giới hạn librarian/admin.

## 11B. Nhóm trưởng — câu sâu phần Thông và quản lý nhóm

### 15 câu sâu phần Thông (các câu thuộc ngân hàng 70 câu; mở file/hàm)

| Câu ôn sâu | Đáp án lõi cần nói | File/hàm mở | Nhãn / khả năng bị hỏi |
|---|---|---|---|
| Vì sao hash bcrypt, không mã hóa ngược? | Lưu hash một chiều có salt; kiểm tra bằng `checkpw`, không khôi phục password gốc. | `auth_service.hash_password/verify_password` | ✓ / Cao |
| JWT dùng trường nào để nhận diện user và quyền? | `sub`, `user_id`, `role`; `jti` định danh token để revoke; không nhầm token payload với dữ liệu bí mật. | `routers/auth.login`, `auth_service.create_access_token` | ✓ / Cao |
| Token hết hạn bao lâu, ai kiểm tra? | Mặc định 24h; `get_current_user` decode JWT mỗi request. | `ACCESS_TOKEN_EXPIRE_MINUTES`, `dependencies.get_current_user` | ✓ / Cao |
| Logout làm token hết hiệu lực ra sao? | Lưu `jti` vào `RevokedToken` tới `exp`; dependency tra bảng đó. | `routers/auth.logout`, `models.RevokedToken` | ✓ / Vừa |
| Tài khoản bị khóa nhưng JWT còn hạn thì sao? | Dependency truy lại user; `is_locked` khiến request nhận 401. | `dependencies.get_current_user` | ✓ / Vừa |
| Role guard ở backend tránh lỗi gì của frontend? | Ẩn menu không phải bảo mật; backend trả 403 nếu role không được phép. | `dependencies.RoleChecker`, router staff/admin | ✓ / Cao |
| BR01 tính loan hay reservation? | Đếm loan `PENDING` + `BORROWING`, tối đa 3; reservation là entity riêng. | `loan_service.ACTIVE_LOAN_STATUSES/create_request` | ✓ / Cao |
| Vì sao tạo loan chưa trừ tồn? | Tạo `PENDING`; chỉ `approve` mới trừ một available copy. | `LoanService.create_request/approve` | ✓ / Cao |
| Duyệt loan có khóa dữ liệu gì? | Khóa loan/book, kiểm tra trạng thái, tồn kho và hold trước khi commit; concurrency vẫn cần test MySQL. | `LoanService.approve` | ⚠ / Vừa |
| Trả sách liên quan fine/reservation/log ra sao? | Đặt returned/date, tính fine, tăng available, sync queue, audit, rồi commit cùng session. | `LoanService.return_book` | ✓ / Cao |
| Điều kiện gia hạn và lần gia hạn thứ hai? | Chỉ BORROWING chưa quá hạn; tối đa một lần, +7 ngày; 409 nếu sai/đã gia hạn/đang có người khác chờ hoặc giữ. | `LoanService.extend` | ✓ / Vừa |
| Nếu commit trả sách lỗi giữa chừng thì log/fine có thể lệch không? | Cùng session/transaction giúp rollback đồng bộ nếu request thất bại trước commit; phải chứng minh theo exception path, không khẳng định ngoài code. | `LoanService.return_book`, `create_system_log` | ⚠ / Thấp |
| LOG-01/02 chứng minh bao phủ mọi hành động chưa? | Có log ở các luồng chính, admin-only list; chưa có test mọi route nên không nói bao phủ tuyệt đối. | `log_service.create_system_log`, `routers/admin.list_audit_logs` | ⚠ / Vừa |
| NFR-02 đã nghiệm thu chưa? | Chưa xác định vì thiếu bản SRS/NFR gốc; có BCrypt/JWT/role guard/lock/revoke nhưng chưa có chứng cứ rate limit/HTTPS audit. | `security.py`, `dependencies.py`, runbook | ⚠ / Cao |
| Test Auth/Loan nói được điều gì và không nói được gì? | 18 test trong file Auth/Loan; 23 test toàn suite hiện đạt trên SQLite memory; không chứng minh MySQL E2E, browser hay coverage. | `backend/tests/test_auth_and_loans.py`, lệnh unittest | ⚠ / Cao |

### 25 câu quy trình/quản lý nhóm — câu 71–95

**71. Nhóm chia việc theo cơ sở nào?** (✓; Cao; Thông)  
**Mẫu:** README ghi phân công theo module: Thông Auth/Loan/Log, Thành backend dữ liệu và nghiệp vụ, Đan giao diện độc giả, Tân giao diện thủ thư/admin. Đây là phân công được ghi trong README; muốn chứng minh quyết định ban đầu cần biên bản/board mà repo hiện không có.

**72. Vì sao chia theo backend module và màn hình frontend?** (⚠; Vừa; Thông)  
**Mẫu:** Cách chia giảm giao cắt giữa API nghiệp vụ và màn hình, nhưng các file shared (`api.js`, auth, models, index) vẫn cần phối hợp/review. Em trình bày đây là cách phân công thể hiện trong README/code, không bịa biên bản họp.

**73. Tiến độ được theo dõi ở đâu?** (⚠; Cao; Thông)  
**Mẫu:** Trong repo có ảnh chụp checklist/progress tại README ngày 15/11 và 18/11; không thấy file export backlog/board. Em chưa xác nhận trạng thái GitHub Projects hiện tại.

**74. Nhóm có dùng GitHub Projects không?** (⚠; Vừa; Thông)  
**Mẫu:** Không có bằng chứng từ file local đã kiểm tra. Nếu nhóm có dùng board online, em sẽ mở board thật để xác nhận; không nói đã dùng chỉ vì có nhánh Git.

**75. Ưu tiên backlog khác SRS thế nào?** (⚠; Cao; Thông)  
**Mẫu:** Bản SRS và backlog không có trong repo, nên em chưa so được thứ tự ưu tiên. README có nhắc việc và hạn nhưng không đủ để kết luận yêu cầu nào bị đổi ưu tiên.

**76. Spring Boot được đổi sang FastAPI khi nào/vì sao?** (⚠; Cao; Thông)  
**Mẫu:** Code hiện tại là FastAPI/Python; repo không có backlog/SRS chính thức hay quyết định đổi công nghệ. Em không khẳng định thời điểm/lý do nếu không có commit/biên bản chứng minh.

**77. Definition of Done của nhóm là gì?** (⚠; Vừa; Thông)  
**Mẫu:** Chưa thấy DoD chính thức được ghi. Có thể đề xuất: code được review/merge, test liên quan đạt, API/UI cùng hợp đồng, không còn lỗi blocker, và có bằng chứng demo; không gọi đây là quy tắc cũ nếu nhóm chưa thống nhất.

**78. Quy tắc “trễ 2 task bị cấm thi” có trong repo không?** (✗; Vừa; Thông)  
**Mẫu:** Không tìm thấy văn bản này trong file Git. Em không đại diện nhà trường xác nhận chế tài; chỉ nhắc thành viên theo dõi hạn và báo sớm nguy cơ trễ.

**79. Quy trình Git được mô tả thế nào?** (✓; Cao; Thông)  
**Mẫu:** README hướng dẫn không đẩy thẳng main, làm feature branch, commit có mã việc và mở PR để nhóm trưởng review/merge. Local log có merge commits nhưng không xác nhận mọi quy trình đã tuân thủ đầy đủ.

**80. Có bằng chứng code review trên mọi PR không?** (⚠; Vừa; Thông)  
**Mẫu:** Có merge commit PR trong local history; review comments/approval status không nằm trong commit log. Muốn xác nhận cần mở PR thật trên GitHub.

**81. Khi có conflict thì nhóm xử lý thế nào?** (⚠; Vừa; Thông)  
**Mẫu:** Git history có commit merge và resolve conflict, nhưng không có quy trình thống nhất được ghi. Cách trả lời là nêu ví dụ commit cụ thể nếu đã xem PR; không khẳng định ai review mọi conflict.

**82. Commit count nói gì về đóng góp?** (✓; Vừa; Thông)  
**Mẫu:** Chỉ nói ai đã tạo commit và nhóm file chạm; không đo LOC, độ khó, công sức hay chất lượng. Aliases được gom theo email và merge commits được tách khỏi số non-merge.

**83. Nhóm xử lý hạn công việc ra sao?** (⚠; Vừa; Thông)  
**Mẫu:** README ghi mốc task và kế hoạch tới ngày 22/11, nhưng snapshot ngày 18/11 chưa cập nhật tới commit 24/11. Em sẽ lấy trạng thái từng người từ board/trao đổi trực tiếp thay vì dùng ảnh chụp cũ làm hiện trạng.

**84. Nếu một thành viên vắng buổi demo?** (⚠; Vừa; Thông)  
**Mẫu:** Nhóm trưởng giữ luồng tổng quan; người còn lại chỉ trình bày phần đã đọc/được bàn giao, mở đúng file/hàm và nói rõ giới hạn. Không giả vờ là tác giả nếu chưa trực tiếp làm; cần có người dự phòng cho thao tác demo.

**85. Nếu một thành viên trễ task?** (⚠; Vừa; Thông)  
**Mẫu:** Xác định blocker, chia nhỏ phần bắt buộc cho demo, ghép người hỗ trợ có kiến thức module, chốt phạm vi đóng băng và cập nhật trạng thái thật. Không che trễ bằng cách đánh dấu hoàn thành khi chưa test.

**86. Đóng góp của từng bạn là gì?** (✓; Cao; Thông)  
**Mẫu:** Nêu module theo README, sau đó dùng history làm bằng chứng phụ: Thông tích hợp/Auth/Loan/Log; Thành API/data; Đan reader UI; Tân staff/admin UI. Có giao thoa nên không quy mọi commit của một module cho một người.

**87. Tiến độ trong README có thể gọi là realtime không?** (✗; Cao; Thông)  
**Mẫu:** Không. README ghi ảnh chụp 15/11 và task status 18/11, trong khi local history có commit đến 24/11. Cần cập nhật tiến độ sát ngày bảo vệ.

**88. Có feature freeze và tag `v1.0` chưa?** (✗; Cao; Thông)  
**Mẫu:** `git tag --list` rỗng; runbook mô tả điều kiện tương lai để đóng băng và gắn tag. Chưa nói đã freeze hoặc phát hành v1.0.

**89. Các rủi ro lớn cần theo dõi là gì?** (⚠; Cao; Thông)  
**Mẫu:** Thiếu SRS/NFR-02, chưa chạy E2E MySQL/browser, coverage chưa đo, frontend thiếu automated test, README mâu thuẫn, main import gọi `create_all`, Compose có fallback development config. Đây là risk từ code/tài liệu, không phải danh sách risk board chính thức.

**90. Nếu yêu cầu SRS mâu thuẫn code/backlog thì xử lý?** (⚠; Vừa; Thông)  
**Mẫu:** Đánh dấu mâu thuẫn, xin người sở hữu yêu cầu/hướng dẫn xác nhận, lưu quyết định và acceptance criteria; không tự đoán theo code hoặc backlog.

**91. Ai quyết định thay đổi công nghệ/phạm vi?** (⚠; Vừa; Thông)  
**Mẫu:** Repo không lưu biên bản quyết định. Nhóm trưởng điều phối và xin thống nhất nhóm/giảng viên theo quy trình thực tế; không tự nhận đã có phê duyệt nếu không có bằng chứng.

**92. Cách xử lý code chung để tránh conflict?** (⚠; Vừa; Thông)  
**Mẫu:** Báo trước vùng file giao nhau, chia API contract, mỗi thay đổi có PR nhỏ, review route/schema/JS call site cùng lúc và chạy test hồi quy. README có nhánh/PR nhưng không mô tả đủ checklist review.

**93. Bài học lớn nhất của nhóm là gì?** (⚠; Vừa; Thông)  
**Mẫu:** Phải kiểm thử contract và dữ liệu thật sớm; unit test SQLite hữu ích nhưng không thay MySQL/browser; tài liệu tiến độ và SRS phải được quản lý cùng source để tránh câu trả lời lỗi thời.

**94. Nếu làm lại dự án, nhóm sẽ thay đổi điều gì?** (⚠; Vừa; Thông)  
**Mẫu:** Chốt SRS/DoD/board ngay từ đầu; xác định frontend canonical path; quản lý config/deploy an toàn; thêm frontend/E2E/concurrency tests; cập nhật runbook cùng mỗi release. Đây là đề xuất nhìn lại, không phải việc đã làm.

**95. Làm sao nói về bạn khác một cách trung lập?** (✓; Vừa; Thông)  
**Mẫu:** Nêu đúng phạm vi được phân công và file/commit bằng chứng, nói cả phần giao nhau và phần chưa test; không so sánh số commit hay đánh giá cá nhân.

### 15 câu liên module — câu 96–110

**96. Từ độc giả gửi yêu cầu đến khi được mượn, dữ liệu đi đâu?** (✓; Cao; Thông + Đan + Tân)  
**Mẫu:** Reader UI gửi POST loan → auth/role dependency → `create_request` tạo `PENDING` và log → staff UI gọi approve → `approve` kiểm tồn, cập nhật loan/book, log và commit → reader tải lại.  
**Mở:** `script.js` → `routers/loans.py` → `LoanService.create_request/approve`.

**97. Vì sao BR01 không đếm reservation?** (✓; Cao; Thông)  
**Mẫu:** BR01 giới hạn loan `PENDING`/`BORROWING`; reservation là hàng đợi riêng với trạng thái `WAITING`/`HOLDING`. Tính chung sẽ áp sai nghiệp vụ.  
**Mở:** `loan_service.ACTIVE_LOAN_STATUSES`, `ReservationService.ACTIVE_RESERVATION_STATUSES`.

**98. Quá hạn ảnh hưởng tạo loan và fine ở thời điểm nào?** (✓; Cao; Thông + Thành)  
**Mẫu:** Loan borrowing quá hạn chặn tạo yêu cầu mới; fine được tính khi thủ thư nhận trả và chốt khoản tiền. Không khẳng định fine tự phát sinh hàng ngày nếu chưa có scheduled process.  
**Mở:** `LoanService.create_request/return_book`, `FineService.calculate_fine`.

**99. Một bản sách được tính available khi có hold ra sao?** (✓; Vừa; Thành)  
**Mẫu:** `available_copies` là bản chưa checkout; active `HOLDING` được trừ khỏi số có thể cấp cho người khác. Người đang giữ chỗ được phép gửi yêu cầu cho hold của chính mình.  
**Mở:** `ReservationService.active_holds`, `LoanService.create_request/approve`.

**100. Trả sách có thể cấp giữ chỗ và đổi trạng thái loan cùng lúc không?** (✓; Cao; Thông + Thành)  
**Mẫu:** Trong cùng session, return chuyển loan, tăng kho, `sync_book` chuyển người đầu queue sang hold 48h, ghi log rồi commit. Test unit kiểm tra chuyển hold; vẫn cần E2E MySQL.  
**Mở:** `LoanService.return_book`, `ReservationService.sync_book`.

**101. Hủy loan và hủy reservation có khác nhau không?** (✓; Vừa; Thành)  
**Mẫu:** Hủy loan chỉ được khi `PENDING`; hủy reservation chỉ trong trạng thái active `WAITING`/`HOLDING`, sau đó đồng bộ queue. Hai entity và endpoint tách biệt.  
**Mở:** `LoanService.cancel_request`, `ReservationService.cancel`.

**102. UI ẩn nút có thay thế RBAC không?** (✓; Cao; Thông + Tân)  
**Mẫu:** Không; frontend giúp trải nghiệm, backend `RoleChecker`/route dependency mới bảo vệ quyền. Kiểm tra API trực tiếp vẫn phải trả 401/403.  
**Mở:** `dependencies.RoleChecker`, router admin/loans/books.

**103. Admin khóa user thì có ảnh hưởng reservation/loan đã tồn tại không?** (⚠; Vừa; Thông + Thành)  
**Mẫu:** User bị khóa không qua `get_current_user`, nên không gọi tiếp API bằng token hiện tại; code không tự xóa loan/reservation cũ khi khóa. Nêu đúng hai hành vi khác nhau.  
**Mở:** `dependencies.get_current_user`, `routers/admin.update_user_lock`.

**104. Logout liên quan audit và token revocation thế nào?** (✓; Vừa; Thông)  
**Mẫu:** Lấy jti/exp từ token, ghi revoked token và audit logout rồi commit; lần request kế tiếp dependency từ chối jti bị thu hồi.  
**Mở:** `routers/auth.logout`, `dependencies.get_current_user`.

**105. Trả sách sinh fine nào và chống tạo trùng ra sao?** (✓; Vừa; Thành + Thông)  
**Mẫu:** Fine tính từ due date đến ngày trả, rate 5.000đ/ngày, lưu một fine cho mỗi loan; unique loan_id và kiểm tra đã có fine giúp tránh chốt trùng.  
**Mở:** `LoanService.return_book`, `FineService.calculate_fine`, `models.Fine`.

**106. Dashboard/top books/monthly có chung nguồn dữ liệu không?** (✓; Vừa; Thành + Tân)  
**Mẫu:** Ba endpoint thống kê riêng dùng CRUD database; dashboard gọi helper rồi render từng phần. Snapshot đã kiểm tra 26/11/2026: 43 đầu sách, 133 bản, 3 đang mượn, 0 quá hạn, 18 độc giả, 25.000đ chưa thu; đây là số tại thời điểm kiểm tra, không phải hằng số.

**107. Tổng sách trang staff và số kết quả reader search phải lấy ở đâu?** (✓; Vừa; Thành + Đan + Tân)  
**Mẫu:** Tổng trang staff lấy field tổng của response phân trang; reader list dùng dữ liệu tải theo trang và cách tính trong reader JS. Không cộng số dòng trên trang hiện tại rồi gọi là tổng.

**108. Đổi schema giữa ORM và MySQL xử lý bằng cách nào?** (⚠; Cao; Thông + Thành)  
**Mẫu:** Có migration script cụ thể nhưng `main.py` còn gọi create_all; phải kiểm tra schema/backup và chạy migration trên DB demo, không coi import app là deploy an toàn.

**109. Nếu frontend gọi sai endpoint/field, nhóm trace theo thứ tự nào?** (✓; Vừa; Đan/Tân + owner API)  
**Mẫu:** Network request → helper `api.js`/reader request → router path/method/query → schema response → service/CRUD → UI renderer. So sánh status/JSON mà không in token hoặc secret.

**110. Khi demo dữ liệu thống kê không khớp, ai xử lý phần nào?** (⚠; Vừa; Thông điều phối)  
**Mẫu:** Thành kiểm tra query/DB/API; Tân dashboard/list rendering; Đan reader count/search; Thông xác thực/role/loan state. Nhóm dừng thao tác ghi tiếp, ghi lại request và so với database demo đã chuẩn bị.

## 11C. Bộ hỏi riêng từng thành viên

Các câu dưới đây là lượt hỏi miệng theo người phụ trách, không cộng vào ngân hàng 110. “Chủ sở hữu” nghĩa là người có thể trả lời từ trải nghiệm trực tiếp; nhóm trưởng có thể trả lời phần kiến trúc/tổng quan nhưng không giả nhận trải nghiệm triển khai cá nhân của bạn. Mỗi câu có nhãn mức độ bằng chứng và ước lượng xác suất bị hỏi.

### Thành — DB, Sách, Thể loại, Độc giả, Phạt, Đặt trước, Thống kê

| # | Câu khó | File/hàm cần mở | Nếu thiếu, nhóm trưởng bổ sung | Trả lời |
|---|---|---|---|---|
| 1 | Quan hệ Book–Category và Loan–Fine là gì? (✓; Vừa) | `models.py`: `Book`, `Category`, `Loan`, `Fine` | Nêu FK/relationship đang có; `Loan.user_id` hiện chưa khai báo FK. | Chủ sở hữu; nhóm trưởng thay được về model. |
| 2 | Phân trang trả tổng toàn cục ở field nào? (✓; Vừa) | `crud.get_books_paginated`; `schemas.PageResponse` | Mở response model, giải thích không cộng dòng trang hiện tại. | Chủ sở hữu; nhóm trưởng thay được. |
| 3 | Chuẩn hóa tìm kiếm không dấu hoạt động thế nào? (✓; Vừa) | `crud._normalize_search_text`, `get_books_paginated` | Nêu giới hạn Unicode/DB nếu được hỏi; không đoán query optimizer. | Chủ sở hữu. |
| 4 | Cập nhật total copies ảnh hưởng available copies ra sao? (⚠; Vừa) | `crud.update_book` | Phân biệt tổng bản và khả dụng; kiểm tra nhánh khi sách đã mượn. | Chủ sở hữu; nhóm trưởng bổ sung nghiệp vụ. |
| 5 | Vì sao không xóa Category khi còn Book? (✓; Vừa) | `crud.delete_category` | Nêu conflict để tránh orphan. | Chủ sở hữu; nhóm trưởng thay được. |
| 6 | API readers bảo vệ dữ liệu thế nào? (⚠; Vừa) | `routers/readers.get_readers/get_reader_loans` | Chỉ staff đọc; đề nghị chỉ test endpoint role nếu chưa có. | Chủ sở hữu; nhóm trưởng thay được kiến trúc. |
| 7 | Tiền phạt tính trả sớm/đúng/trễ ra sao? (✓; Cao) | `FineService.calculate_fine` | Nêu 0 hoặc `max(0, days)*5000`. | Chủ sở hữu. |
| 8 | Thu phạt trùng bị chặn đâu? (✓; Vừa) | `crud.mark_fine_as_paid` | Nêu trạng thái paid và 409; test xác nhận. | Chủ sở hữu. |
| 9 | Queue chọn reservation kế tiếp theo tiêu chí nào? (✓; Cao) | `ReservationService.sync_book` | Thứ tự created_at rồi id; chốt 48h. | Chủ sở hữu. |
| 10 | Hết 48h được chạy bởi worker nào? (⚠; Vừa) | `ReservationService.sync_book/list_for_reader` | Không thấy worker; đồng bộ khi nghiệp vụ/list gọi. | Chủ sở hữu; nhóm trưởng có thể nói giới hạn. |
| 11 | Khi return làm hold thì transaction gồm những bước nào? (✓; Cao) | `LoanService.return_book`, `sync_book` | Loan/kho/fine/queue/audit commit cùng session. | Chủ sở hữu; nhóm trưởng thay được flow. |
| 12 | Stats top/monthly tính gì, test ra sao? (⚠; Vừa) | `crud.get_stats_overview/get_top_borrowed_books/get_monthly_loan_stats` | Test chỉ chạy SQLite memory; phân biệt count theo dữ liệu test. | Chủ sở hữu; nhóm trưởng bổ sung giới hạn test. |

### Đan — giao diện độc giả

| # | Câu khó | File/hàm cần mở | Nếu thiếu, nhóm trưởng bổ sung | Trả lời |
|---|---|---|---|---|
| 1 | Trang độc giả khởi tạo và xác định role thế nào? (✓; Vừa) | `frontend/index.html`; `script.js`: `getUser/showApp` | Nêu frontend điều hướng UI, backend vẫn kiểm tra token/role. | Chủ sở hữu; nhóm trưởng thay được kiến trúc. |
| 2 | Token/user lấy từ đâu? (✓; Vừa) | `script.js`: `getToken/getUser/request/authRequest` | Key hiện dùng là `ptit_token`/`ptit_user`; không đưa token lên màn hình. | Chủ sở hữu. |
| 3 | Search tải trang và dựng tổng sách ra sao? (✓; Cao) | `fetchBooksPage/fetchAllBooks/loadBooks` | Phân biệt current page, total pages và dataset tải thêm. | Chủ sở hữu. |
| 4 | Khi API search lỗi/trống thì UI xử lý sao? (⚠; Vừa) | `loadBooks/renderBooks/stateBox` | Nêu loading, empty/error state theo code thực tế, không gọi demo là thật. | Chủ sở hữu; nhóm trưởng bổ sung hợp đồng API. |
| 5 | Gửi loan 7/14/30 ngày đi qua hàm nào? (✓; Cao) | `openBookDetail`, loan submission handler, `ENDPOINTS` | Nêu server vẫn validate ngày và BR01–BR03. | Chủ sở hữu; nhóm trưởng thay được logic server. |
| 6 | Tồn kho thay đổi khi nào trên reader? (✓; Cao) | `create_request` backend; reader UI reload | Không tự trừ bản khi submit; chờ staff approve. | Nhóm trưởng/Thông có thể trả lời. |
| 7 | Reader xem/hủy phiếu của mình ra sao? (✓; Vừa) | `loadReaderData/myLoans/cancelLoanRequest` | API lọc theo user token; chỉ hủy pending. | Chủ sở hữu. |
| 8 | Đặt trước khác đăng ký mượn chỗ nào? (✓; Cao) | `createReservation/cancelReservationRequest` | Reservation chờ/giữ chỗ không cộng loan count BR01. | Chủ sở hữu; nhóm trưởng bổ sung API. |
| 9 | Reader xem fine cá nhân thế nào? (✓; Vừa) | `loadReaderData`, helper `getMyFines` | Endpoint lấy user từ token; không gửi user_id để chọn người khác. | Chủ sở hữu; Thành bổ sung cách tính. |
| 10 | Đổi mật khẩu gọi endpoint nào và điều kiện gì? (✓; Vừa) | `api.js`: `changePassword`; `routers/auth.change_password` | Mật khẩu hiện tại phải đúng; request cần auth; backend hash lại. | Chủ sở hữu; nhóm trưởng thay được API logic. |
| 11 | Giao diện sáng/tối lưu ở đâu? (✓; Vừa) | `frontend/assets/js/script.js`: `applyTheme`; `ui.js` account theme | Nêu `ptit_theme` localStorage; đây là UI setting, không phải quyền. | Chủ sở hữu. |
| 12 | Frontend có automated test/coverage không? (✗; Vừa) | Danh sách test; reader JS | Chưa tìm thấy frontend automated suite; trình bày manual/browser evidence nếu có, không bịa coverage. | Chủ sở hữu phần thực thi; nhóm trưởng trả lời kết quả repo. |

### Tân — giao diện thủ thư và quản trị

| # | Câu khó | File/hàm cần mở | Nếu thiếu, nhóm trưởng bổ sung | Trả lời |
|---|---|---|---|---|
| 1 | Màn sách tải categories/books ra sao? (✓; Vừa) | `books.js`: `loadCategories/loadBooks` | Nêu API và pagination total, category độc lập với book load nếu có lỗi. | Chủ sở hữu; Thành bổ sung response. |
| 2 | Thêm/sửa/xóa book có bảo vệ role ở đâu? (✓; Vừa) | `books.js`: modal/form/action; `routers/books.py` | Backend LIBRARIAN/ADMIN mới là nơi bảo vệ. | Chủ sở hữu; nhóm trưởng thay được RBAC. |
| 3 | Duyệt loan UI xử lý pending state thế nào? (✓; Cao) | `loans.js`: `loadLoans/handleLoanAction` | Nêu reload sau action; server xác nhận status/tồn. | Chủ sở hữu; Thông bổ sung LoanService. |
| 4 | Khi approve thành công, tồn kho lấy từ đâu? (✓; Cao) | `LoanService.approve`, loans renderer | Không cập nhật số giả ở client; tải lại response/backend. | Nhóm trưởng/Thông bổ sung. |
| 5 | Làm sao tránh double click tạo action lặp? (⚠; Vừa) | `loans.js` action handler | Chỉ mô tả guard/spinner nếu chỉ đúng trong code; nếu thiếu, nhận là điểm cần kiểm tra. | Chủ sở hữu. |
| 6 | Trang độc giả staff tải lịch sử thế nào? (✓; Vừa) | `readers.js`: `loadReaders/showReaderHistory` | API cần staff role; nêu trạng thái lỗi/trống nếu có. | Chủ sở hữu; Thành bổ sung API. |
| 7 | Thu phạt ở màn nào và xử lý 409 ra sao? (✓; Vừa) | `fines.js`: `loadFines/renderFinePage` | Nêu API paid update; trùng thanh toán bị server chặn. | Chủ sở hữu; Thành bổ sung nghiệp vụ. |
| 8 | Admin đổi role/khóa user đi qua đâu? (✓; Cao) | `admin.js`: `loadAdminUsers/createRoleSelect/createLockButton` | API admin chỉ cho ADMIN; khóa ảnh hưởng request mới qua dependency. | Chủ sở hữu; Thông bổ sung auth. |
| 9 | Audit logs hiển thị tên/thời gian thế nào? (⚠; Vừa) | `admin.js`: `renderAdminLogs/formatAuditLogTimestamp` | Đọc JSON response và timezone code; không tuyên bố timezone nếu không mở formatter. | Chủ sở hữu; Thông bổ sung semantics. |
| 10 | Dashboard gọi những API nào? (✓; Cao) | `dashboard.js`: `loadDashboard` | Overview, top books, monthly, loans/due; xử lý lỗi theo từng phần. | Chủ sở hữu; Thành bổ sung schema. |
| 11 | Khi API lỗi, dashboard có bịa số không? (✓; Cao) | `dashboard.js`: `renderOverviewUnavailable`, unavailable renderers | Nêu `—`/thông báo/retry; không dùng demo data che lỗi. | Chủ sở hữu. |
| 12 | Responsive/visual test chứng minh bằng gì? (⚠; Vừa) | HTML/CSS trang tương ứng; `docs/defense-rehearsal.md` | Checklist chỉ là kế hoạch nếu chưa đánh dấu; đưa ảnh chụp/browser log thật nếu có. | Chủ sở hữu trải nghiệm; nhóm trưởng có thể nêu tình trạng kiểm chứng. |

## Mục 12. Điều phối buổi bảo vệ — kịch bản 15 phút

### Lịch và câu chuyển lời

| Thời gian | Người | Nội dung | Câu chuyển |
|---|---|---|---|
| 0:00–0:40 | Thông | Chào, đề tài, vấn đề, vai trò người dùng, stack và giới hạn kiểm chứng. | “Sau phần kiến trúc và xác thực, em xin chuyển sang luồng nghiệp vụ dữ liệu.” |
| 0:40–3:30 | Thông | Auth/JWT/role guard; đăng ký loan, BR01, duyệt/trả và log. | “Em xin mời Thành trình bày mô hình dữ liệu và các API sách, phạt, thống kê, đặt trước.” |
| 3:30–6:30 | Thành | DB model, sách/thể loại, độc giả, Fine, Reservation 48h, Stats. | “Tiếp theo, Đan sẽ minh họa luồng người dùng độc giả trên giao diện.” |
| 6:30–8:30 | Đan | Đăng nhập, tra cứu/chi tiết sách, phiếu của tôi, đặt trước/phạt. | “Phần độc giả kết thúc tại request API; Tân sẽ tiếp tục với nghiệp vụ staff xử lý request.” |
| 8:30–11:00 | Tân | Quản lý sách/category, duyệt/trả, admin/log/dashboard. | “Các màn hình đều gọi API; nhóm xin chạy một luồng ngắn xuyên suốt trên database demo.” |
| 11:00–13:30 | Thông điều phối; Tân thao tác | Demo Reader → Staff approve → dashboard/log; chỉ thao tác đã thử trên DB demo. | “Đó là luồng demo; em xin tóm tắt giới hạn đã biết và trả lời câu hỏi.” |
| 13:30–15:00 | Thông + nhóm | Kết luận, hạn chế, hướng phát triển, mời hội đồng. | “Nhóm em xin cảm ơn hội đồng và sẵn sàng giải đáp.” |

Thời lượng là đề xuất 15 phút, căn theo runbook; nếu hội đồng cho thời gian khác, rút ngắn demo trước, không cắt mất nêu giới hạn.

### Máy demo, thứ tự thao tác, kế hoạch dự phòng

1. **Người ngồi máy:** Tân làm operator để giữ thao tác nhất quán; người trình bày vẫn là owner module. Chuẩn bị sẵn browser profile/tài khoản demo riêng cho Reader và Librarian/Admin; không đổi tài khoản giữa luồng nếu chưa rehearsal.
2. **Trước buổi:** xác nhận Docker/MySQL/API/frontend health trên máy demo; kiểm tra CORS, role và dữ liệu; backup database demo; không trỏ tới database thật. Chụp ảnh từng màn và lưu video dự phòng đã kiểm tra phiên bản.
3. **Thứ tự demo ít rủi ro:** mở trang/login → tra cứu sách có tồn → gửi request → chuyển sang staff tab duyệt → xác nhận status/tồn → hiển thị dashboard/log. Chỉ thử nhận trả/fine nếu có fixture đã chuẩn bị trên DB demo riêng.
4. **Không demo:** migration, seed hoặc SQL update trực tiếp trước hội đồng; tài khoản/password mặc định nếu chưa xác nhận; hành động trên dữ liệu thật; tính năng chưa rehearsal.
5. **Nếu demo lỗi:** operator dừng retry để tránh tạo trùng; nói rõ “API/máy demo hiện không phản hồi nên nhóm xin chuyển sang phương án dự phòng”; dùng video/ảnh theo đúng phiên bản đã kiểm tra; sau đó giải thích endpoint/file và phân biệt code/test với runtime evidence.
6. **Khi một bạn bí:** nhóm trưởng xin phép bổ sung: “Em xin bổ sung phần luồng chung; phần chi tiết triển khai này bạn X trực tiếp phụ trách và sẽ mở file/hàm để xác nhận.” Không tự trả lời trải nghiệm cá nhân thay bạn.
7. **Câu “em không biết”:** “Em chưa xác minh điều đó trong code/môi trường nên không muốn đoán. Phần em xác nhận được là … ở file/hàm …; nhóm sẽ kiểm tra thêm theo yêu cầu SRS.”
8. **Câu chốt:** “Nhóm đã kiểm thử các luồng backend bằng unit test SQLite; những mục chưa có SRS/NFR hoặc chưa E2E MySQL/browser được nêu đúng giới hạn. Nhóm xin tiếp thu góp ý để hoàn thiện.”

## Kết thúc lượt 2

- Đã bổ sung bản đồ dự án, câu sâu theo vai trò, 40 câu quản lý/liên module, kịch bản điều phối và bốn thẻ nhớ trong `tools/docs/`.
- Sổ tay cập nhật gồm ngân hàng chính 110 câu; 36 câu owner-specific là bộ luyện riêng, không cộng vào tổng.
- Không sửa mã nguồn; không xóa media/video/lời thoại theo lựa chọn giữ nguyên của bạn.
