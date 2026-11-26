## Cảnh 0.1 — Thẻ tên đề tài
Người đọc: Thông
Thời lượng mục tiêu: 6 giây
Việc cần làm: Hiển thị thẻ toàn màn hình với tên đề tài, Nhóm 2, môn học và thành viên.
Lời đọc: Em xin chào thầy cô. Nhóm 2 xin trình bày đề tài Hệ thống website quản lý thư viện PTIT, môn Dịch vụ phát triển web.
Phụ đề: Hệ thống quản lý thư viện PTIT
Chế độ ghi: KHÔNG

## Cảnh 0.2 — Thẻ bài toán
Người đọc: Thông
Thời lượng mục tiêu: 12 giây
Việc cần làm: Hiển thị thẻ bài toán.
Lời đọc: Khi mượn trả làm thủ công, sinh viên không biết sách còn hay hết, thủ thư mất thời gian ghi phiếu, tính phạt bằng tay dễ sai và khó truy vết khi có sai sót.
Phụ đề: Thủ công, dễ sai, khó truy vết
Chế độ ghi: KHÔNG

## Cảnh 0.3 — Thẻ mục tiêu
Người đọc: Thông
Thời lượng mục tiêu: 18 giây
Việc cần làm: Hiển thị ba đến bốn mục tiêu của hệ thống.
Lời đọc: Hệ thống cho sinh viên tra cứu và đăng ký mượn trực tuyến. Thủ thư duyệt đăng ký và nhận sách trả, số bản tự cập nhật. Tiền phạt tự tính năm nghìn đồng mỗi ngày trễ. Ba vai trò có quyền tách bạch và mọi thao tác quan trọng đều có nhật ký.
Phụ đề: Tự động hóa quy trình mượn - trả
Chế độ ghi: KHÔNG

## Cảnh 0.4 — Thẻ công nghệ
Người đọc: Thành
Thời lượng mục tiêu: 12 giây
Việc cần làm: Hiển thị sơ đồ trình duyệt, FastAPI và MySQL.
Lời đọc: Backend dùng Python FastAPI, cơ sở dữ liệu MySQL 8, xác thực bằng JWT, mật khẩu băm BCrypt. Giao diện viết bằng HTML, CSS và JavaScript.
Phụ đề: Trình duyệt - FastAPI - MySQL
Chế độ ghi: KHÔNG

## Cảnh 1 — Đăng nhập độc giả
Người đọc: Đan
Thời lượng mục tiêu: 12 giây
Việc cần làm: Mở login.html, nhập tài khoản READER và đăng nhập.
Lời đọc: Độc giả đăng nhập bằng email và mật khẩu. Sai thông tin, hệ thống chỉ báo một thông báo chung.
Phụ đề: Xác thực độc giả
Chế độ ghi: KHÔNG

## Cảnh 2 — Tra cứu sách
Người đọc: Đan
Thời lượng mục tiêu: 15 giây
Việc cần làm: Gõ nguyen vào ô tìm kiếm rồi bấm tìm.
Lời đọc: Tìm sách theo tên, tác giả, thể loại, không phân biệt hoa thường và dấu. Gõ nguyen vẫn ra Nguyễn. Mỗi trang mười sách, có số bản còn lại.
Phụ đề: Tìm kiếm không dấu
Chế độ ghi: KHÔNG

## Cảnh 3 — Đăng ký mượn
Người đọc: Đan
Thời lượng mục tiêu: 15 giây
Việc cần làm: Chọn một cuốn còn bản, thời hạn và xác nhận.
Lời đọc: Độc giả chọn thời hạn mượn rồi đăng ký, phiếu ở trạng thái chờ duyệt.
Phụ đề: LOAN-03 · Tạo phiếu chờ duyệt
Chế độ ghi: CÓ - cần xác nhận đã sao lưu database

## Cảnh 4 — Giới hạn phiếu
Người đọc: Thông
Thời lượng mục tiêu: 15 giây
Việc cần làm: Đăng xuất, đăng nhập READER3 và thử đăng ký một cuốn.
Lời đọc: Mỗi độc giả tối đa ba phiếu. Vượt quá, hệ thống trả mã 409 kèm lý do.
Phụ đề: LOAN-04 · Giới hạn ba phiếu
Chế độ ghi: CÓ - cần xác nhận đã sao lưu database

## Cảnh 5 — Duyệt phiếu
Người đọc: Thông
Thời lượng mục tiêu: 18 giây
Việc cần làm: Đăng nhập ADMIN, mở quản lý mượn trả và duyệt phiếu cảnh 3.
Lời đọc: Thủ thư duyệt phiếu. Số bản còn lại giảm một trong cùng một giao dịch, lỗi giữa chừng thì hoàn tác.
Phụ đề: LOAN-05 · Duyệt và trừ bản
Chế độ ghi: CÓ - cần xác nhận đã sao lưu database

## Cảnh 6 — Nhận trả quá hạn
Người đọc: Thành
Thời lượng mục tiêu: 18 giây
Việc cần làm: Chọn phiếu quá hạn ba ngày và nhận trả.
Lời đọc: Khi nhận trả, số bản tăng một. Trả trễ ba ngày, hệ thống tính đúng mười lăm nghìn đồng và chốt một khoản phạt.
Phụ đề: LOAN-06 · Tính phạt 15.000đ
Chế độ ghi: CÓ - cần xác nhận đã sao lưu database

## Cảnh 7 — Chặn xóa sách đang mượn
Người đọc: Thành
Thời lượng mục tiêu: 15 giây
Việc cần làm: Mở quản lý sách và thử xóa sách đang được mượn.
Lời đọc: Thủ thư thêm, sửa, xóa sách. Sách đang được mượn thì không xóa được.
Phụ đề: BOOK-07 · Bảo vệ sách đang mượn
Chế độ ghi: CÓ - cần xác nhận đã sao lưu database

## Cảnh 8 — Tổng quan thống kê
Người đọc: Thành
Thời lượng mục tiêu: 15 giây
Việc cần làm: Mở dashboard và hiển thị thẻ số liệu, top sách, thống kê theo tháng.
Lời đọc: Tổng quan gồm tổng sách, đang mượn, quá hạn, tổng phạt, cùng top sách và số phiếu theo tháng.
Phụ đề: STAT-08 · Tổng quan hoạt động
Chế độ ghi: KHÔNG

## Cảnh 9 — Nhật ký hoạt động
Người đọc: Thông
Thời lượng mục tiêu: 12 giây
Việc cần làm: Mở admin.html và cuộn đến nhật ký hoạt động.
Lời đọc: Quản trị viên xem nhật ký thao tác, mới nhất lên đầu. Độc giả truy cập sẽ nhận mã 403.
Phụ đề: AUDIT-09 · Nhật ký mới nhất
Chế độ ghi: KHÔNG

## Cảnh 10 — Thẻ kết
Người đọc: Thông
Thời lượng mục tiêu: 18 giây
Việc cần làm: Hiển thị thẻ kết và hạn chế, hướng phát triển.
Lời đọc: Hệ thống đã hoàn thành các yêu cầu bắt buộc. Hạn chế là chưa có thanh toán trực tuyến và gia hạn sách. Hướng phát triển là gia hạn, xuất báo cáo CSV và thanh toán phạt. Em xin cảm ơn thầy cô.
Phụ đề: Hoàn thành yêu cầu bắt buộc
Chế độ ghi: KHÔNG
