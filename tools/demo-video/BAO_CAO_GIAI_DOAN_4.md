# Bao cao Giai doan 4

## Trang thai

- Da co 13 ban ghi WebM trong thu muc recordings/.
- Da xac dinh edge-tts co hai giong tieng Viet: HoaiMy va NamMinh.
- edge-tts hien khong tra duoc audio: loi NoAudioReceived.
- Windows khong co giong tieng Viet cuc bo; chi co giong English va Japanese.
- ffmpeg day du chua co trong PATH; chi co ffmpeg-win64.exe cua Playwright chua kiem tra du dung mo rong.
- Chua xuat demo_thu_vien_ptit.mp4 de khong lam gia ket qua.

## Ban dung de ghep ngoai

- Ban ghi quay tu Playwright: tools/demo-video/recordings/
- LOI-THOAI.md: loi va cau truc tung canh
- demo.srt: phu de tham chieu
- script.json: loi doc va thu tu canh

## Canh can bo theo du lieu

- Cảnh 4: khong co du lieu READER3 du 3 phieu.
- Cảnh 6: khong co phieu qua han dung 3 ngay.

## Lenh thu cong neu dung edge-tts

```powershell
py -m edge_tts --voice vi-VN-HoaiMyNeural --text "noi dung canh" --write-media audio/scene.mp3
```

Sau khi co FFmpeg va audio:

```powershell
ffmpeg -version
```
