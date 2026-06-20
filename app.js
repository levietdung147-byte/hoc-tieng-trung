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
}));

/* ====== Phát âm (Web Speech API) ====== */
function speak(text) {
  if (!window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "zh-CN"; u.rate = 0.85;
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
