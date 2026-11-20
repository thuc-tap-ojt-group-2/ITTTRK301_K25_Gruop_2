---
marp: true
theme: default
paginate: true
title: Hệ thống quản lý thư viện PTIT
---

# Hệ thống Quản lý Thư viện PTIT

**Nhóm 2 - Thực tập OJT**

Nguyễn Văn Thông • Nguyễn Hoàng Thành  
Huỳnh Hồ Nhĩ Đan • Hà Ngọc Hoàng Tân

---

# Đặt vấn đề

- Tra cứu và quản lý tài liệu thủ công
- Quy trình mượn/trả chưa thống nhất
- Khó theo dõi tồn kho, phạt và đặt trước
- Cần phân quyền cho độc giả, thủ thư và quản trị viên

---

# Mục tiêu

- Số hóa tra cứu, mượn/trả và đặt trước
- Tự động cập nhật tồn kho và tiền phạt
- Phân quyền rõ ràng theo vai trò
- Cung cấp dashboard và nhật ký hoạt động

---

# Kiến trúc hệ thống

- Frontend: HTML, CSS, JavaScript
- Backend: FastAPI, SQLAlchemy
- Cơ sở dữ liệu: MySQL 8
- Xác thực: BCrypt và JWT
- Triển khai: Docker Compose

---

# Chức năng độc giả

- Đăng ký, đăng nhập và đổi mật khẩu
- Tìm kiếm/lọc và xem chi tiết sách
- Tạo mượn 7/14/30 ngày
- Hủy phiếu chờ duyệt
- Đặt trước, xem phạt và gia hạn một lần

---

# Chức năng thủ thư

- Quản lý sách và thể loại
- Duyệt/từ chối phiếu mượn
- Nhận trả sách
- Thu tiền phạt
- Xem độc giả và lịch sử mượn

---

# Chức năng quản trị

- Quản lý vai trò và trạng thái tài khoản
- Xem dashboard tổng quan
- Top sách được mượn
- Thống kê mượn theo tháng
- Xem nhật ký hệ thống

---

# Quy tắc nghiệp vụ chính

- Phạt trễ: 5.000đ/ngày
- Hàng đợi đặt trước giữ chỗ 48 giờ
- Gia hạn tối đa một lần, cộng 7 ngày
- Không gia hạn phiếu quá hạn
- Chặn gia hạn nếu có độc giả khác chờ/giữ sách

---

# Demo luồng xuyên suốt

1. Độc giả đăng nhập và tạo yêu cầu mượn
2. Hệ thống giữ trạng thái chờ, chưa giảm kho
3. Thủ thư duyệt yêu cầu
4. Độc giả gia hạn phiếu hợp lệ
5. Thủ thư nhận trả và hệ thống chốt phạt

---

# Kiểm thử

- Unit test Auth/Loan bằng SQLite
- Test tính tiền phạt
- Kiểm tra cú pháp Python/JavaScript
- Docker Compose cho MySQL, API và frontend
- Cần ghi lại thêm kết quả MySQL + trình duyệt trên máy demo

---

# Hạn chế và hướng phát triển

- Hoàn tất kiểm thử end-to-end trên môi trường demo
- Đối chiếu chính thức với bản SRS/NFR
- Kiểm tra giới hạn đăng nhập/rate limiting
- Bổ sung HTTPS cho môi trường công khai
- Dùng tài khoản DB tối thiểu quyền

---

# Kết luận

- Đã xây dựng luồng chính của hệ thống
- Frontend, FastAPI và MySQL đã được nối
- Docker Compose hỗ trợ khởi chạy nhất quán
- Chưa tuyên bố hoàn tất trước khi kiểm thử MySQL/trình duyệt thật

**Cảm ơn hội đồng**
