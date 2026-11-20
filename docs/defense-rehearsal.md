# Checklist tập demo bảo vệ

## Thông tin buổi tập

- Ngày:
- Máy/địa chỉ:
- Người ghi nhận:
- Phiên Docker:
- Phiên MySQL:

## Trước buổi tập

- [ ] Sao chép `.env.example` thành `.env` và đặt secret riêng.
- [ ] Chạy `docker compose up --build`.
- [ ] Mở frontend tại `http://localhost:5500`.
- [ ] Mở API docs tại `http://localhost:8000/docs`.
- [ ] Tạo tài khoản độc giả, thủ thư và quản trị demo.
- [ ] Chuẩn bị sách còn bản, hết bản và dữ liệu phạt.
- [ ] Sao lưu database demo trước khi ghi dữ liệu.

## Phân công trình bày

| Tiết mục | Người phụ trách | Đạt |
|---|---|---|
| Giới thiệu, kiến trúc, bảo mật | Nguyễn Văn Thông | [ ] |
| Luồng độc giả | Huỳnh Hồ Nhĩ Đan | [ ] |
| Luồng thủ thư/admin | Hà Ngọc Hoàng Tân | [ ] |
| Sách, độc giả, phạt, thống kê | Nguyễn Hoàng Thành | [ ] |

## Ca demo

| Ca | Kỳ vọng | Kết quả |
|---|---|---|
| Đăng nhập theo từng role | Token hợp lệ, sai role bị từ chối | |
| Tạo phiếu mượn 7/14/30 ngày | Trạng thái PENDING, tồn kho chưa giảm | |
| Duyệt phiếu | BORROWING, tồn kho giảm, hạn trả cập nhật | |
| Gia hạn hợp lệ | Cộng 7 ngày, extension_count = 1 | |
| Gia hạn lần hai | HTTP 409 | |
| Gia hạn khi quá hạn/có reservation khác | HTTP 409 | |
| Nhận trả/phạt | Trả sách cập nhật kho, phạt đúng quy tắc | |
| Dashboard/log | Số liệu và log khớp dữ liệu demo | |

## Hậu kiểm

- [ ] Thời lượng thực tế: phút.
- [ ] Ghi được các bước thành công/thất bại.
- [ ] Chụp/ghi log ngoại trừ secret/database.
- [ ] Ghi lỗi phát sinh và người sửa.
- [ ] Xác nhận lần tập lại.
