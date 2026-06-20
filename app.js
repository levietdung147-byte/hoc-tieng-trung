/* ====== Lưu trữ tiến độ (localStorage) ====== */
const KEY = "hoc-tieng-trung-v1";
const store = {
  load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch { return {}; }
  },
  save(d) { localStorage.setItem(KEY, JSON.stringify(d)); },
};
let state = Object.assign({ dates: [], lessonIndex: 0 }, store.load());

const todayStr = () => new Date().toISOString().slice(0, 10);

/* ====== Bài học hôm nay ====== */
const lesson = LESSONS[state.lessonIndex % LESSONS.length];
const words = lesson.tu;
document.getElementById("lessonTitle").textContent =
  `Bài ${(state.lessonIndex % LESSONS.length) + 1}: ${lesson.chude}`;

/* Danh sách chữ Hán đơn (cho luyện viết), bỏ trùng */
const chars = [...new Set(words.flatMap(w => [...w.hanzi]))];

/* ====== Tabs ====== */
const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".panel");
tabs.forEach(t => t.addEventListener("click", () => {
  tabs.forEach(x => x.classList.remove("is-active"));
  panels.forEach(p => p.classList.remove("is-active"));
  t.classList.add("is-active");
  document.getElementById("tab-" + t.dataset.tab).classList.add("is-active");
  if (t.dataset.tab === "write") renderWriter();
  if (t.dataset.tab === "speak") { stopListening(); renderSpeak(); }
}));

/* ====== Phát âm (Web Speech API) ====== */
function speak(text, rate) {
  if (!window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "zh-CN"; u.rate = rate || 0.85;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

/* ====== Flashcard ====== */
let fi = 0;
const flashcard = document.getElementById("flashcard");
function renderFlash() {
  const w = words[fi];
  document.getElementById("flashHanzi").textContent = w.hanzi;
  document.getElementById("flashPinyin").textContent = w.pinyin;
  document.getElementById("flashVn").textContent = w.vn;
  document.getElementById("flashCounter").textContent = `${fi + 1} / ${words.length}`;
  flashcard.classList.remove("flipped");
}
flashcard.addEventListener("click", () => flashcard.classList.toggle("flipped"));
document.getElementById("flashNext").addEventListener("click", e => {
  e.stopPropagation(); fi = (fi + 1) % words.length; renderFlash();
});
document.getElementById("flashPrev").addEventListener("click", e => {
  e.stopPropagation(); fi = (fi - 1 + words.length) % words.length; renderFlash();
});
document.getElementById("flashAudio").addEventListener("click", () => speak(words[fi].hanzi));
renderFlash();

/* ====== Luyện viết (Hanzi Writer) ====== */
let wi = 0, writer = null;
function renderWriter() {
  const ch = chars[wi];
  const w = words.find(x => x.hanzi.includes(ch)) || {};
  document.getElementById("writeHanzi").textContent = ch;
  document.getElementById("writePinyin").textContent = w.pinyin || "";
  document.getElementById("writeVn").textContent = w.vn || "";
  document.getElementById("writeCounter").textContent = `${wi + 1} / ${chars.length}`;
  const box = document.getElementById("writeTarget");
  box.innerHTML = "";
  const size = Math.min(280, box.clientWidth || 280);
  writer = HanziWriter.create("writeTarget", ch, {
    width: size, height: size, padding: 12,
    strokeColor: "#e8635b", radicalColor: "#e0b450",
    outlineColor: "#383743", drawingColor: "#4caf7d",
    showOutline: true, showCharacter: true,
  });
}
document.getElementById("writeAnim").addEventListener("click", () => {
  if (writer) writer.animateCharacter();
});
document.getElementById("writeQuiz").addEventListener("click", () => {
  if (writer) { writer.hideCharacter(); writer.quiz({ showHintAfterMisses: 2 }); }
});
document.getElementById("writeNext").addEventListener("click", () => {
  wi = (wi + 1) % chars.length; renderWriter();
});
document.getElementById("writePrev").addEventListener("click", () => {
  wi = (wi - 1 + chars.length) % chars.length; renderWriter();
});

/* ====== Luyện nói (Speech Recognition) ====== */
let si = 0, speakOk = 0, speakTotal = 0, recognizing = false;
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const $speakHanzi = document.getElementById("speakHanzi");
const $speakStatus = document.getElementById("speakStatus");
const $speakResult = document.getElementById("speakResult");
const $micBtn = document.getElementById("micBtn");

// chỉ giữ lại ký tự chữ Hán để so sánh (bỏ dấu câu, khoảng trắng, latin)
function onlyHan(s) { return (s || "").replace(/[^一-鿿]/g, ""); }

function renderSpeak() {
  const w = words[si];
  $speakHanzi.textContent = w.hanzi;
  document.getElementById("speakPinyin").textContent = w.pinyin;
  document.getElementById("speakVn").textContent = w.vn;
  document.getElementById("speakCounter").textContent = `${si + 1} / ${words.length}`;
  $speakResult.hidden = true;
  $speakResult.className = "speak__result";
  $speakStatus.textContent = SR ? "Nhấn micro rồi đọc to chữ phía trên" : "";
}

function setScore() {
  document.getElementById("speakScore").textContent = `Đọc đúng: ${speakOk} / ${speakTotal}`;
}

function stopListening() {
  if (recognition && recognizing) { try { recognition.abort(); } catch (e) {} }
  recognizing = false;
  $micBtn.classList.remove("listening");
}

let recognition = null;
if (SR) {
  recognition = new SR();
  recognition.lang = "zh-CN";
  recognition.interimResults = false;
  recognition.maxAlternatives = 5;
  recognition.continuous = false;

  recognition.onresult = (ev) => {
    const target = onlyHan(words[si].hanzi);
    const alts = [];
    for (let i = 0; i < ev.results[0].length; i++) alts.push(onlyHan(ev.results[0][i].transcript));
    const heard = alts[0] || "(không rõ)";

    const perfect = alts.some(a => a === target);
    const close = !perfect && alts.some(a => a.includes(target) || target.includes(a));

    speakTotal++;
    $speakResult.hidden = false;
    if (perfect) {
      speakOk++;
      $speakResult.className = "speak__result good";
      $speakResult.innerHTML = "✅ <b>Tuyệt vời! Phát âm rõ ràng.</b>";
      speak(words[si].hanzi);
    } else if (close) {
      speakOk++;
      $speakResult.className = "speak__result good";
      $speakResult.innerHTML = "👍 <b>Khá tốt!</b> Máy nhận ra đúng từ." +
        `<div class="heard">Máy nghe: <b>${heard}</b></div>`;
    } else {
      $speakResult.className = "speak__result bad";
      $speakResult.innerHTML = "🔁 <b>Chưa khớp — thử lại nhé.</b>" +
        `<div class="heard">Máy nghe: <b>${heard}</b> · Cần đọc: <b>${words[si].hanzi}</b> (${words[si].pinyin})</div>` +
        `<div class="heard">Mẹo: chú ý <b>thanh điệu</b>, nghe lại mẫu rồi đọc theo.</div>`;
      setTimeout(() => speak(words[si].hanzi), 400);
    }
    setScore();
  };

  recognition.onerror = (ev) => {
    recognizing = false;
    $micBtn.classList.remove("listening");
    if (ev.error === "not-allowed" || ev.error === "service-not-allowed") {
      $speakStatus.textContent = "🚫 Chưa được phép dùng micro. Hãy cho phép quyền micro cho trang này.";
    } else if (ev.error === "no-speech") {
      $speakStatus.textContent = "Không nghe thấy gì — nhấn micro và đọc to hơn nhé.";
    } else {
      $speakStatus.textContent = "Có lỗi khi nghe, thử lại nhé.";
    }
  };

  recognition.onend = () => {
    recognizing = false;
    $micBtn.classList.remove("listening");
  };

  $micBtn.addEventListener("click", () => {
    if (recognizing) { stopListening(); return; }
    speechSynthesis && speechSynthesis.cancel();
    try {
      recognition.start();
      recognizing = true;
      $micBtn.classList.add("listening");
      $speakStatus.textContent = "🎙️ Đang nghe… đọc to chữ phía trên";
      $speakResult.hidden = true;
    } catch (e) { /* start khi đang chạy → bỏ qua */ }
  });
} else {
  $micBtn.disabled = true;
  document.getElementById("speakWarn").hidden = false;
  $speakStatus.textContent = "";
}

document.getElementById("speakModel").addEventListener("click", () => speak(words[si].hanzi));
document.getElementById("speakSlow").addEventListener("click", () => speak(words[si].hanzi, 0.55));
document.getElementById("speakNext").addEventListener("click", () => { stopListening(); si = (si + 1) % words.length; renderSpeak(); });
document.getElementById("speakPrev").addEventListener("click", () => { stopListening(); si = (si - 1 + words.length) % words.length; renderSpeak(); });
renderSpeak();

/* ====== Ôn tập (Quiz nghĩa) ====== */
let score = 0;
const pool = LESSONS.slice(0, (state.lessonIndex % LESSONS.length) + 1).flatMap(l => l.tu);
function newQuiz() {
  document.getElementById("quizFeedback").textContent = "";
  const q = pool[Math.floor(Math.random() * pool.length)];
  document.getElementById("quizHanzi").textContent = q.hanzi;
  const opts = new Set([q.vn]);
  while (opts.size < Math.min(4, pool.length)) {
    opts.add(pool[Math.floor(Math.random() * pool.length)].vn);
  }
  const shuffled = [...opts].sort(() => Math.random() - 0.5);
  const box = document.getElementById("quizOpts");
  box.innerHTML = "";
  shuffled.forEach(opt => {
    const b = document.createElement("button");
    b.className = "quiz__opt"; b.textContent = opt;
    b.addEventListener("click", () => {
      if (box.dataset.answered) return;
      box.dataset.answered = "1";
      if (opt === q.vn) {
        b.classList.add("correct"); score++;
        document.getElementById("quizFeedback").textContent = "✅ Chính xác!";
        speak(q.hanzi);
      } else {
        b.classList.add("wrong");
        [...box.children].forEach(c => { if (c.textContent === q.vn) c.classList.add("correct"); });
        document.getElementById("quizFeedback").textContent = `❌ Đáp án: ${q.vn} (${q.pinyin})`;
      }
      document.getElementById("quizScore").textContent = "Đúng: " + score;
    });
    box.appendChild(b);
  });
  box.dataset.answered = "";
}
document.getElementById("quizNext").addEventListener("click", newQuiz);
newQuiz();

/* ====== Timer 30 phút ====== */
let secs = 0, timerId = null;
const goalSecs = 30 * 60;
function fmt(s) { return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); }
function updateGoal() {
  const pct = Math.min(100, Math.round((secs / goalSecs) * 100));
  document.getElementById("goalRing").style.setProperty("--pct", pct);
  document.getElementById("goalPct").textContent = pct + "%";
}
document.getElementById("timerBtn").addEventListener("click", () => {
  const btn = document.getElementById("timerBtn");
  if (timerId) {
    clearInterval(timerId); timerId = null; btn.textContent = "▶ Tiếp tục";
  } else {
    btn.textContent = "⏸ Tạm dừng";
    timerId = setInterval(() => {
      secs++;
      document.getElementById("timerDisplay").textContent = fmt(secs);
      updateGoal();
      if (secs === goalSecs) { speak("好"); alert("🎉 Hoàn thành 30 phút! Đừng quên bấm Hoàn thành buổi học."); }
    }, 1000);
  }
});

/* ====== Streak & Hoàn thành ====== */
function calcStreak() {
  if (!state.dates.length) return 0;
  const set = new Set(state.dates);
  let n = 0; const d = new Date();
  // nếu hôm nay chưa học, bắt đầu đếm từ hôm qua
  if (!set.has(todayStr())) d.setDate(d.getDate() - 1);
  while (set.has(d.toISOString().slice(0, 10))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function renderStreak() {
  document.getElementById("streakNum").textContent = calcStreak();
}
function renderHeatmap() {
  const set = new Set(state.dates);
  const box = document.getElementById("heatmap");
  box.innerHTML = "";
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    const cell = document.createElement("div");
    cell.className = "heatmap__cell" + (set.has(ds) ? " on" : "") + (ds === todayStr() ? " today" : "");
    cell.title = ds;
    box.appendChild(cell);
  }
}
const doneBtn = document.getElementById("markDone");
function refreshDone() {
  if (state.dates.includes(todayStr())) {
    doneBtn.textContent = "✅ Đã hoàn thành hôm nay — hẹn gặp lại ngày mai!";
    doneBtn.classList.add("done");
  }
}
doneBtn.addEventListener("click", () => {
  if (state.dates.includes(todayStr())) return;
  state.dates.push(todayStr());
  state.lessonIndex = (state.lessonIndex || 0) + 1; // mai sang bài mới
  store.save(state);
  refreshDone(); renderStreak(); renderHeatmap();
  alert(`🎉 Tuyệt vời! Chuỗi học: ${calcStreak()} ngày. Mai ta học bài tiếp theo nhé!`);
});

renderStreak(); renderHeatmap(); refreshDone();
