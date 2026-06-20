/**
 * NHẮC HỌC TIẾNG TRUNG QUA EMAIL — 6H SÁNG MỖI NGÀY
 * ---------------------------------------------------
 * Chạy trên Google Apps Script (script.google.com). Miễn phí, chạy trên
 * server Google nên tự gửi mỗi sáng dù máy tính tắt.
 *
 * CÀI 1 LẦN:
 *   1) Sửa 2 dòng CONFIG bên dưới nếu cần (email nhận + link app).
 *   2) Chọn hàm "caiLichNhac" ở thanh trên → bấm ▶ Run → cho phép quyền.
 *   3) Xong! Mỗi 6h sáng sẽ có email nhắc học.
 *
 * Muốn thử ngay: chọn hàm "guiNhacBayGio" → Run (email gửi liền).
 * Muốn tắt: chọn hàm "xoaLichNhac" → Run.
 */

// ====== CONFIG — chỉnh ở đây ======
const EMAIL_NHAN = "levietdung147@gmail.com";
const APP_URL    = "__APP_URL__"; // ← dán link GitHub Pages vào đây
const GIO_GUI    = 6;             // 6 = 6h sáng (0–23)
// ==================================

// Câu động viên xoay vòng theo ngày
const CAU_DONG_VIEN = [
  "Mỗi ngày 30 phút — kiên trì hơn hoàn hảo. 加油!",
  "Học chữ Hán như xây nhà: mỗi nét là một viên gạch.",
  "Hôm nay biết thêm vài từ, ngày mai đọc được một câu.",
  "学而时习之 — Học rồi ôn lại, đó là niềm vui.",
  "Chuỗi ngày học của bạn đang lớn lên 🔥 — đừng để đứt nhé!",
  "Người giỏi tiếng Trung chỉ là người đã học đều mỗi ngày.",
  "30 phút hôm nay = một bước gần hơn tới mục tiêu HSK."
];

function guiNhacHoc() {
  const ngay = new Date();
  const thu = ["Chủ Nhật","Thứ Hai","Thứ Ba","Thứ Tư","Thứ Năm","Thứ Sáu","Thứ Bảy"][ngay.getDay()];
  const cau = CAU_DONG_VIEN[Math.floor(ngay.getTime() / 86400000) % CAU_DONG_VIEN.length];
  const ngayStr = thu + ", ngày " + ngay.getDate() + "/" + (ngay.getMonth() + 1) + "/" + ngay.getFullYear();

  const html =
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;' +
    'background:#1c1b22;color:#f4f3ef;border-radius:16px;overflow:hidden;border:1px solid #383743">' +
      '<div style="background:#d6453d;padding:24px;text-align:center">' +
        '<div style="font-size:48px;font-weight:700;line-height:1">学中文</div>' +
        '<div style="font-size:12px;letter-spacing:3px;text-transform:uppercase;opacity:.9;margin-top:6px">Học Tiếng Trung</div>' +
      '</div>' +
      '<div style="padding:28px 24px;text-align:center">' +
        '<div style="font-size:13px;color:#9a98a4;text-transform:uppercase;letter-spacing:2px">' + ngayStr + '</div>' +
        '<h1 style="font-size:24px;margin:12px 0 8px">Tới giờ học rồi! ⏰</h1>' +
        '<p style="color:#e0b450;font-size:16px;margin:0 0 22px;font-style:italic">“' + cau + '”</p>' +
        '<a href="' + APP_URL + '" style="display:inline-block;background:#d6453d;color:#fff;' +
        'text-decoration:none;font-weight:700;font-size:16px;padding:14px 32px;border-radius:10px">' +
        '▶ Mở app học 30 phút</a>' +
        '<p style="color:#9a98a4;font-size:13px;margin:22px 0 0">' +
        'Flashcard · Luyện viết chữ Hán · Ôn tập trắc nghiệm</p>' +
      '</div>' +
    '</div>';

  MailApp.sendEmail({
    to: EMAIL_NHAN,
    subject: "🀄 Học tiếng Trung hôm nay — 30 phút thôi nào!",
    htmlBody: html,
    name: "Nhắc Học Tiếng Trung"
  });
}

// Gửi thử ngay lập tức (để kiểm tra)
function guiNhacBayGio() {
  guiNhacHoc();
}

// Cài lịch tự gửi mỗi ngày lúc GIO_GUI giờ sáng (chạy 1 lần)
function caiLichNhac() {
  xoaLichNhac(); // xoá lịch cũ nếu có, tránh trùng
  ScriptApp.newTrigger("guiNhacHoc")
    .timeBased()
    .everyDays(1)
    .atHour(GIO_GUI)
    .nearMinute(0)
    .create();
  Logger.log("✅ Đã cài lịch nhắc lúc " + GIO_GUI + "h sáng mỗi ngày.");
}

// Xoá lịch nhắc
function xoaLichNhac() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "guiNhacHoc") ScriptApp.deleteTrigger(t);
  });
}
