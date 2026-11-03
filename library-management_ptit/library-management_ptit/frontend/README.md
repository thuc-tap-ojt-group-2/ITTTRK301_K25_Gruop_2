# Giao diện (HTML, CSS, JavaScript)

Chỉ dùng HTML, CSS, JavaScript thuần (không framework). Chạy bằng Live Server của VS Code (cổng bất kỳ trên localhost đều gọi được API).

Gợi ý cấu trúc để Đan và Tân dùng chung:

```
frontend/
  css/style.css        biến màu ở :root, bố cục chung
  js/api.js            hàm request(url, options): gắn token, xử lý lỗi ở một chỗ
  js/common.js         hàm dùng chung (hiện lỗi, xác nhận, vẽ bảng)
  pages/               mỗi màn hình một file .html
  index.html
```

Quy ước: tên biến, hàm bằng tiếng Anh (camelCase); dùng `textContent` thay `innerHTML` cho dữ liệu người dùng nhập; xem `backend/docs/api-mau.md` để biết mẫu API.
