# Kiem tra Giai doan 1

## Da xac nhan

- Frontend tai localhost:5500 tra ve HTTP 200.
- Backend tai localhost:8000 tra ve thong diep PTIT Library API is running.
- frontend/api.js lay API theo hostname hien tai va cong 8000.
- Giao dien dang nhap du dung selector #username va #password; vao login.html.
- FastAPI, SQLAlchemy, JWT va BCrypt xuat hien trong backend.
- MySQL duoc cau hinh qua DB_HOST, DB_PORT va DB_NAME trong backend.
- Cac role frontend va backend co ADMIN, LIBRARIAN va READER.
- Co endpoint 409 cho gioi han phiếu va endpoint tra sach voi tinh tien phat.
- Co trang dashboard, quan ly muon tra, quan ly sach, tien phat va admin.
- Co trang nhat ky voi bang logTable va endpoint /api/admin/logs.
- JavaScript dung JWT va kiem tra payload role va thoi gian het han.

## Du lieu demo can ban ghi nhan

- Tai khoan READER: chua xac minh vi .env.demo chua duoc tao.
- Tai khoan READER3 voi toi da 3 phieu: chua xac minh vi khong du mat khau.
- ADMIN: chua xac minh vi khong du thong tin dang nhap.
- Phieu BORROWING qua han 3 ngay: chua duoc kiem tra.
- Sach dang muon de thu xoa: chua duoc kiem tra.
- Gio UTC tren giao dien: chua kiem tra truc tiep.

## Canh bi bo hoac tam tre

- Cac canh ghi 3 den 7 tam tre den Giai doan 3 va can xac nhan da sao luu database.
- Canh 9 chi duoc duyet sau khi xac minh tai khoan ADMIN va du lieu nhat ky.
- Canh 7 chi hien thi loi neu sach dang muon ton tai; neu khong co du lieu thi bo canh va ghi nhan.

## Doi chieu voi SRS

| Yeu cau | Trang thai code |
|---|---|
| Python FastAPI | Dung |
| SQLAlchemy | Dung |
| MySQL 8 | Cau hinh MySQL, khong suy dien phien ban server |
| JWT han 24 gio | Co JWT va kiem tra exp; han token chinh xac can xem cau hinh auth |
| BCrypt | Co bcrypt trong backend |
| HTML/CSS/JavaScript | Dung |
| Ba vai tro | Dung |
| Toi da 3 phieu PENDING/BORROWING | Co kiem tra backend |
| Muon 7, 14 hoac 30 ngay | Can chot o giao dien neu du lieu cho canh 3 |
| Phat 5000 dong/ngay | Co tinh toan backend |
| Phan quyen va nhat ky | Co endpoint va trang admin |
