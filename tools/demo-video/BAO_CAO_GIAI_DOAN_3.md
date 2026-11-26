# Bao cao Giai doan 3

## Ket qua

- Da ghi canh 3: tao phieu muon PENDING qua giao dien doc gia.
- Da ghi canh 5: mo quan ly muon tra va duyet phieu PENDING qua giao dien quan tri.
- Da ghi canh 7: thu xoa sach qua giao dien va cho loi tu tuong tac cua backend.
- Cac canh ghi 4 va 6 bi bo vi du lieu demo khong dap ung dieu kien.

## Cau hinh du lieu khi kiem tra

- READER dang nhap thanh cong.
- READER3 dang nhap thanh cong va co 0 phieu PENDING/BORROWING.
- ADMIN dang nhap thanh cong.
- Co sach voi availableCopies = 1.
- Co 2 phieu BORROWING.
- Khong co phieu PENDING truoc khi ghi canh 3.
- Khong co phieu qua han dung 3 ngay.

## Canh bo

- Cảnh 4: READER3 chưa có đủ ba phiếu PENDING hoặc BORROWING nên không chứng minh được mã 409 giới hạn.
- Cảnh 6: không có phiếu BORROWING có hạn trả trễ đúng ba ngày.

## Xac minh sau ghi

Nguoi dung tu choi lenh API kiem tra sau khi ghi. Vi the khong xac nhan them bang du lieu sau quay.

## Nguyen tac

- Chi ghi trong tools/demo-video/.
- Tat ca canh ghi chi chay voi co --allow-write.
- Khong chay seed_catalog.py hoac seed demo.
- Khong sua frontend, backend, .env hoac file database.
