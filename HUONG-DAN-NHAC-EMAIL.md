# Hướng dẫn cài nhắc học qua email lúc 6h sáng

Dùng **Google Apps Script** — chạy trên server Google, miễn phí, tự gửi mỗi sáng dù máy tính tắt.
Làm 1 lần, khoảng 3 phút.

## Các bước

1. Mở **https://script.google.com** → đăng nhập bằng Gmail `levietdung147@gmail.com`.
2. Bấm **Dự án mới / New project**.
3. Xoá hết code mẫu, rồi **dán toàn bộ nội dung file `nhac-email.gs`** vào.
4. Kiểm tra 2 dòng đầu (mục CONFIG):
   - `EMAIL_NHAN` — email nhận nhắc (mặc định đã đúng).
   - `APP_URL` — đã điền sẵn `https://levietdung147-byte.github.io/hoc-tieng-trung/`.
5. Bấm **Lưu** (biểu tượng đĩa mềm 💾).
6. Ở thanh chọn hàm phía trên, chọn **`caiLichNhac`** → bấm **▶ Run / Chạy**.
7. Lần đầu Google hỏi quyền:
   - *Review permissions* → chọn tài khoản → *Advanced* → *Go to … (unsafe)* → **Allow**.
   - (Đây là script của chính bạn nên an toàn.)
8. Xong! Mỗi **6h sáng** sẽ có email nhắc học.

## Mẹo

- **Gửi thử ngay:** chọn hàm `guiNhacBayGio` → Run → kiểm tra hộp thư.
- **Đổi giờ:** sửa `GIO_GUI` (vd `7` = 7h sáng) → Lưu → chạy lại `caiLichNhac`.
- **Tắt nhắc:** chọn hàm `xoaLichNhac` → Run.
- Apps Script dùng múi giờ trong **Project Settings → Time zone** = `(GMT+07:00) Bangkok/Hanoi`. Kiểm tra cho đúng giờ Việt Nam.

> Giờ chạy có thể lệch vài phút (Google gom lịch trong khung 1 tiếng) — bình thường.
