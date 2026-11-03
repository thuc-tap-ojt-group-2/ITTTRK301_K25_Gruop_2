# Mẫu API (chốt ở lần kiểm tra 2, thứ Ba 03/11/2026)

Đây là file để **Đan và Tân làm giao diện bằng dữ liệu giả** trước khi API thật chạy. Phần Auth do Thông làm xong ở lần 2; phần Sách do Thành làm ở lần 2–3 và theo đúng mẫu dưới đây.

## Quy ước chung

- Địa chỉ gốc: `http://localhost:8080` (chạy bằng uvicorn). Mọi đường dẫn bắt đầu bằng `/api`. Trang thử API tự sinh: `http://localhost:8080/docs`.
- Dữ liệu trao đổi là JSON, UTF-8. Tên trường viết camelCase.
- Xác thực: gửi header `Authorization: Bearer <token>` (token nhận từ đăng nhập, hết hạn sau 24 giờ).
- Lỗi luôn có dạng `{ "message": "..." }` để giao diện hiển thị trực tiếp.

| Mã | Ý nghĩa |
| --- | --- |
| 200 | Thành công |
| 201 | Tạo mới thành công |
| 400 | Dữ liệu gửi lên sai (thiếu trường, sai định dạng) |
| 401 | Chưa đăng nhập, token sai hoặc hết hạn, hoặc sai email/mật khẩu |
| 403 | Không đủ quyền, hoặc tài khoản bị khóa |
| 404 | Không tìm thấy |
| 409 | Vi phạm quy tắc nghiệp vụ (trùng email, vượt 3 phiếu...) |

## Auth (Thông)

### POST /api/auth/register — công khai

Yêu cầu:

```json
{
  "fullName": "Nguyễn Văn A",
  "studentCode": "B21DCCN001",
  "email": "a@ptit.edu.vn",
  "password": "123456"
}
```

Thành công `201`:

```json
{
  "id": 1,
  "fullName": "Nguyễn Văn A",
  "studentCode": "B21DCCN001",
  "email": "a@ptit.edu.vn",
  "role": "READER"
}
```

Lỗi thường gặp:

```json
{ "message": "Email đã được đăng ký" }                 // 409
{ "message": "Mã sinh viên đã được đăng ký" }          // 409
{ "message": "Mật khẩu phải từ 6 đến 50 ký tự" }       // 400
{ "message": "Email không đúng định dạng" }            // 400
```

### POST /api/auth/login — công khai

Yêu cầu:

```json
{ "email": "a@ptit.edu.vn", "password": "123456" }
```

Thành công `200`:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": 1,
  "fullName": "Nguyễn Văn A",
  "role": "READER"
}
```

Lỗi:

```json
{ "message": "Email hoặc mật khẩu không đúng" }                       // 401
{ "message": "Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên" } // 403
```

Giao diện lưu `token` vào `localStorage`, gửi kèm mọi lời gọi sau đó. Vai trò đọc từ `role` hoặc từ phần payload của token.

## Sách (Thành — mẫu để làm giao diện)

### GET /api/books?page=0&keyword=nguyen — cần đăng nhập

`page` tính từ 0, mỗi trang 10 sách. `keyword` có thể bỏ trống; tìm theo tên, tác giả, thể loại, không phân biệt hoa thường và dấu.

```json
{
  "content": [
    {
      "id": 1,
      "title": "Lập trình Java cơ bản",
      "author": "Nguyễn Văn B",
      "category": "Công nghệ thông tin",
      "total": 5,
      "available": 2
    }
  ],
  "page": 0,
  "size": 10,
  "totalElements": 23,
  "totalPages": 3
}
```

### POST /api/books — thủ thư, quản trị viên

```json
{ "title": "Cấu trúc dữ liệu", "author": "Trần Văn C", "categoryId": 1, "total": 3 }
```

Thành công `201` trả về sách vừa tạo (cùng dạng một phần tử `content` ở trên). Thiếu trường trả `400` kèm `message`.
