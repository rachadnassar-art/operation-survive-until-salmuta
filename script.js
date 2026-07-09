/* ============================================
   OPERATION: SURVIVE UNTIL SALMUTA — script.js v4
   Complete rewrite: correct order, safe storage, all sections guaranteed
   ============================================ */

/* ---------- SAFE STORAGE (defined first so everything can use it) ---------- */
const _mem = {};
function safeGet(k) {
  try { const v = localStorage.getItem(k); return v; }
  catch { return _mem[k] !== undefined ? _mem[k] : null; }
}
function safeSet(k, v) {
  try { localStorage.setItem(k, String(v)); } catch {}
  _mem[k] = String(v); /* always mirror to memory so preview works */
}
function safeGetJSON(k, fallback) {
  try { const v = safeGet(k); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function safeSetJSON(k, v) { safeSet(k, JSON.stringify(v)); }

function getTodayKey() {
  const d = new Date();
  return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate();
}

/* ---------- DATES ---------- */
const departureDate = new Date("2026-06-18T00:00:00");
const reunionDate   = new Date("2026-08-14T00:00:00");
const today         = new Date();

function daysBetween(a, b) {
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

/* ---------- COUNTDOWN ---------- */
function updateCountdown() {
  const daysLeft     = Math.max(daysBetween(today, reunionDate), 0);
  const daysSurvived = Math.max(daysBetween(departureDate, today), 0);
  const total        = daysBetween(departureDate, reunionDate);
  const pct          = total > 0 ? Math.round((daysSurvived / total) * 100) : 0;
  document.getElementById("daysLeft").textContent     = daysLeft;
  document.getElementById("daysSurvived").textContent = daysSurvived;
  document.getElementById("pctDone").textContent      = pct + "%";
}

/* ---------- BUCKET LIST ---------- */
const bucket = [
  "Sunset on the lake",
  "Hike in the mountains",
  "Drive in Cairo",
  "Dhow cruise in Lamu",
  "Heightened security brunch in Westlands"
];
const BUCKET_KEY = "ousm_bucket";

function renderBucket() {
  const state = safeGetJSON(BUCKET_KEY, {});
  const done  = Object.values(state).filter(Boolean).length;
  const badge = document.getElementById("bucketBadge");
  const grid  = document.getElementById("bucketGrid");
  if (badge) badge.textContent = `${done} / ${bucket.length}`;
  if (!grid) return;
  grid.innerHTML = "";
  bucket.forEach((item, i) => {
    const isDone = !!state[i];
    const li = document.createElement("li");
    li.className = "bucket-item" + (isDone ? " done" : "");
    li.innerHTML = `<span class="bi-check">${isDone ? "✓" : ""}</span><span class="bi-label">${item}</span>`;
    li.addEventListener("click", () => {
      const s = safeGetJSON(BUCKET_KEY, {});
      s[i] = !s[i];
      safeSetJSON(BUCKET_KEY, s);
      renderBucket();
    });
    grid.appendChild(li);
  });
}

/* ---------- XP + BADGES ---------- */
const XP_KEY  = "ousm_xp";
const XP_GOAL = 500;
const badgeDefs = [
  { label: "Survived One Week",               threshold: 1,       hint: "Awarded automatically — you made it this far" },
  { label: "Only One Continent Apart",        threshold: 50,      hint: "Earn 50 XP — try a video call (+20) and a deep question (+25)" },
  { label: "Emergency Hug Request Submitted", threshold: 100,     hint: "Earn 100 XP — a date night (+50) gets you halfway there" },
  { label: "Volleyball Correspondent",        threshold: 150,     hint: "Earn 150 XP — log volleyball updates (+30) and surprise photos (+35)" },
  { label: "Bucket List Pioneer",             threshold: 200,     hint: "Earn 200 XP — stack a date night, deep question, and video call" },
  { label: "Mission Completed",               threshold: XP_GOAL, hint: "Reach 500 XP — the final badge, earned together" }
];

function getXP() { return parseInt(safeGet(XP_KEY) || "0", 10); }

function addXP(points, label) {
  const xp = getXP() + points;
  safeSet(XP_KEY, xp);
  const toast = document.getElementById("xpToast");
  if (toast) {
    toast.textContent = `+${points} XP — ${label}`;
    toast.classList.remove("hidden");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.add("hidden"), 3000);
  }
  renderXP();
}

function renderXP() {
  const xp  = getXP();
  const pct = Math.min((xp / XP_GOAL) * 100, 100);
  const badge = document.getElementById("xpBadge");
  const bar   = document.getElementById("xpBarFill");
  if (badge) badge.textContent   = `${xp} XP`;
  if (bar)   bar.style.width     = pct + "%";
  renderBadges(xp);
}

function renderBadges(xp) {
  const grid = document.getElementById("badgesGrid");
  if (!grid) return;
  grid.innerHTML = "";
  badgeDefs.forEach(b => {
    const unlocked = xp >= b.threshold;
    const wrap = document.createElement("div");
    wrap.className = "badge-wrap";
    const pill = document.createElement("span");
    pill.className = "badge-pill " + (unlocked ? "unlocked" : "locked");
    pill.textContent = (unlocked ? "✓ " : "🔒 ") + b.label;
    wrap.appendChild(pill);
    if (!unlocked) {
      const hint = document.createElement("span");
      hint.className = "badge-hint";
      hint.textContent = b.hint;
      wrap.appendChild(hint);
    }
    grid.appendChild(wrap);
  });
}

/* ---------- DONKEY RACE ---------- */
const RACE_KEY   = "ousm_race";
const NUDGE_STEP = 3;
const FINISH_PCT = 46;

function loadRace() { return safeGetJSON(RACE_KEY, { rach: 0, salm: 0, winner: null }); }
function saveRace(s) { safeSetJSON(RACE_KEY, s); }

function nudgeDonkey(who) {
  const state = loadRace();
  if (state.winner) return;
  const el = document.getElementById(who === 'rach' ? "donkeyRach" : "donkeySalm");
  if (who === 'rach') {
    state.rach = Math.min(state.rach + NUDGE_STEP, FINISH_PCT);
    if (el) { el.style.animation = "none"; el.offsetHeight; el.style.animation = "bobLeft 0.5s ease-out"; }
  } else {
    state.salm = Math.min(state.salm + NUDGE_STEP, FINISH_PCT);
    if (el) { el.style.animation = "none"; el.offsetHeight; el.style.animation = "bobRight 0.5s ease-out"; }
  }
  if (state.rach >= FINISH_PCT && state.salm >= FINISH_PCT) state.winner = "tie";
  else if (state.rach >= FINISH_PCT) state.winner = "rach";
  else if (state.salm >= FINISH_PCT) state.winner = "salm";
  saveRace(state);
  renderRace(state);
}

function renderRace(state) {
  const dr = document.getElementById("donkeyRach");
  const ds = document.getElementById("donkeySalm");
  const rs = document.getElementById("rachSteps");
  const ss = document.getElementById("salmSteps");
  const we = document.getElementById("raceWinner");
  const th = document.getElementById("trackHeart");
  if (dr) dr.style.left  = state.rach + "%";
  if (ds) ds.style.right = state.salm + "%";
  if (rs) rs.textContent = (state.rach / NUDGE_STEP) + " nudge" + (state.rach / NUDGE_STEP !== 1 ? "s" : "");
  if (ss) ss.textContent = (state.salm / NUDGE_STEP) + " nudge" + (state.salm / NUDGE_STEP !== 1 ? "s" : "");
  if (we && state.winner) {
    we.classList.remove("hidden");
    we.textContent = state.winner === "tie" ? "🫏❤️🫏 They meet in the middle — both win!" :
      state.winner === "rach" ? "🫏 Rachdouda wins! Bragging rights secured until Nairobi. 🏆" :
      "🫏 Salmuta wins! She'll remind him of this for years. 🏆";
  }
  if (th && state.winner) th.style.animation = "heartbeat 0.4s ease-in-out infinite";
}

/* ---------- SPIN WHEELS ---------- */
const dates = [
  "Movie night — drawing straws, loser writes dramatic review",
  "Game night",
  "Cooking time together",
  "Deep talk",
  "Sunset exchange challenge — each send a photo at golden hour",
  "Music swap challenge — make each other a 5-song playlist and sing along!",
  "Plan our first reunion weekend",
  "Show each other one place nearby we love"
];

const questions = [
  "What memory from Japan do you revisit most often?",
  "What should we do together this year?",
  "What is something you've changed your mind about recently?",
  "Where do we see ourselves in a year?",
  "What does your ideal weekend look like?",
  "What is one thing we do worse than other couples?"
];

const wheelColors = {
  date:     ["#c4446c","#e8833a","#6b8f71","#7b5ea7","#3a8fb5","#d4622a","#4a8f6a","#b44080"],
  question: ["#3a8fb5","#c4446c","#7b5ea7","#6b8f71","#e8a040","#d4622a","#4a6fb5","#a05080"]
};
const wheelState = {
  date:     { angle: 0, spinning: false },
  question: { angle: 0, spinning: false }
};

function drawWheel(id, items, colors, angle) {
  const canvas = document.getElementById(id + "Wheel");
  if (!canvas) return;
  const ctx   = canvas.getContext("2d");
  const cx    = canvas.width / 2;
  const cy    = canvas.height / 2;
  const r     = cx - 6;
  const slice = (2 * Math.PI) / items.length;

  /* Outer decorative ring */
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const grad = ctx.createRadialGradient(cx, cy, r - 2, cx, cy, r + 6);
  grad.addColorStop(0, "rgba(255,255,255,0.9)");
  grad.addColorStop(1, "rgba(200,180,160,0.4)");
  ctx.beginPath();
  ctx.arc(cx, cy, r + 4, 0, 2 * Math.PI);
  ctx.fillStyle = grad;
  ctx.fill();

  items.forEach((item, i) => {
    const start = angle + i * slice;
    const end   = start + slice;

    /* Segment with gradient for depth */
    const segGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    segGrad.addColorStop(0, lighten(colors[i % colors.length], 0.3));
    segGrad.addColorStop(1, colors[i % colors.length]);

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle = segGrad;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 2;
    ctx.stroke();

    /* Label */
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(start + slice / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,255,255,0.97)";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur  = 4;
    ctx.font = "bold 10.5px DM Sans, sans-serif";

    const words = item.split(" ");
    let lines = [], line = "";
    words.forEach(w => {
      if ((line + " " + w).trim().length > 13 && line) { lines.push(line.trim()); line = w; }
      else line = (line + " " + w).trim();
    });
    if (line) lines.push(line.trim());
    lines = lines.slice(0, 3);

    const lineH = 12;
    const startY = -(lines.length - 1) * lineH / 2;
    lines.forEach((l, li) => ctx.fillText(l, r - 10, startY + li * lineH));
    ctx.restore();
  });

  /* Dot markers on outer edge */
  items.forEach((_, i) => {
    const a = angle + i * slice;
    ctx.beginPath();
    ctx.arc(cx + (r + 1) * Math.cos(a), cy + (r + 1) * Math.sin(a), 3, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fill();
  });

  /* Centre cap with gradient */
  const capGrad = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, 20);
  capGrad.addColorStop(0, "#ffffff");
  capGrad.addColorStop(1, "#f0e8e0");
  ctx.beginPath();
  ctx.arc(cx, cy, 20, 0, 2 * Math.PI);
  ctx.fillStyle = capGrad;
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.1)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = "15px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "transparent";
  ctx.fillText("❤️", cx, cy);
}

function lighten(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((n >> 16) & 0xff) + Math.round(255 * amount));
  const g = Math.min(255, ((n >> 8)  & 0xff) + Math.round(255 * amount));
  const b = Math.min(255, ((n >> 0)  & 0xff) + Math.round(255 * amount));
  return `rgb(${r},${g},${b})`;
}

function spinWheel(type) {
  const state = wheelState[type];
  if (state.spinning) return;

  const items    = type === "date" ? dates : questions;
  const colors   = wheelColors[type];
  const resultEl = document.getElementById(type === "date" ? "dateResult" : "question");
  const winnerIdx = Math.floor(Math.random() * items.length);
  const slice     = (2 * Math.PI) / items.length;
  const targetAngle = -Math.PI / 2 - (winnerIdx * slice + slice / 2);
  const spins     = 6 + Math.floor(Math.random() * 4);
  const totalAngle = state.angle + spins * 2 * Math.PI + ((targetAngle - state.angle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI));

  state.spinning = true;
  if (resultEl) resultEl.textContent = "";

  const duration   = 4000 + Math.random() * 1200;
  const startTime  = performance.now();
  const startAngle = state.angle;

  function easeOut(t) { return 1 - Math.pow(1 - t, 4); }

  function tick(now) {
    const t     = Math.min((now - startTime) / duration, 1);
    state.angle = startAngle + (totalAngle - startAngle) * easeOut(t);
    drawWheel(type, items, colors, state.angle);
    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      state.spinning = false;
      const canvas = document.getElementById(type + "Wheel");
      if (canvas) {
        canvas.style.transition = "transform 0.15s ease";
        canvas.style.transform  = "scale(1.05)";
        setTimeout(() => { canvas.style.transform = "scale(1)"; }, 180);
      }
      if (resultEl) resultEl.textContent = items[winnerIdx];
      showWinPopup(items[winnerIdx], type);
    }
  }
  requestAnimationFrame(tick);
}

function initWheels() {
  drawWheel("date",     dates,     wheelColors.date,     0);
  drawWheel("question", questions, wheelColors.question, 0);
}

/* ---------- WIN POPUP + MINI CONFETTI ---------- */
function showWinPopup(prize, type) {
  const popup = document.getElementById("winPopup");
  const label = document.getElementById("winPopupLabel");
  const sub   = document.getElementById("winPopupSub");
  if (!popup) return;
  if (label) label.textContent = prize;
  if (sub)   sub.textContent   = type === "date"
    ? "Tonight's mission is set. No excuses. 🌙"
    : "Answer this honestly on your next call. No dodging. ❤️";
  popup.classList.remove("hidden");
  requestAnimationFrame(() => popup.classList.add("show"));
  launchMiniConfetti();
  clearTimeout(popup._t);
  popup._t = setTimeout(closeWinPopup, 5500);
}

function closeWinPopup() {
  const popup = document.getElementById("winPopup");
  if (!popup) return;
  popup.classList.remove("show");
  setTimeout(() => popup.classList.add("hidden"), 320);
}

function launchMiniConfetti() {
  const canvas = document.getElementById("miniConfettiCanvas");
  if (!canvas) return;
  const parent = canvas.parentElement;
  canvas.width  = parent ? parent.offsetWidth  : 380;
  canvas.height = parent ? parent.offsetHeight : 300;
  canvas.style.display = "block";
  const ctx    = canvas.getContext("2d");
  const colors = ["#c4446c","#e8a040","#6b8f71","#fce8ef","#fde68a","#7b5ea7","#3a8fb5"];
  const pieces = Array.from({ length: 90 }, () => ({
    x: Math.random() * canvas.width, y: -10 - Math.random() * 80,
    size: 4 + Math.random() * 6, speed: 2.5 + Math.random() * 3,
    drift: Math.random() * 2 - 1, spin: Math.random() * Math.PI,
    color: colors[Math.floor(Math.random() * colors.length)],
    shape: Math.random() > 0.5 ? "r" : "c"
  }));
  let frame = 0;
  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.y += p.speed; p.x += p.drift; p.spin += 0.05;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.spin);
      ctx.fillStyle = p.color;
      if (p.shape === "c") { ctx.beginPath(); ctx.arc(0,0,p.size/2,0,2*Math.PI); ctx.fill(); }
      else ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size*0.6);
      ctx.restore();
      if (p.y > canvas.height) p.y = -10;
    });
    if (++frame < 220) requestAnimationFrame(tick);
    else canvas.style.display = "none";
  }
  requestAnimationFrame(tick);
}

/* ---------- GAME 1: HOW WELL DO WE KNOW EACH OTHER ---------- */
const knowQuestions = [
  { q: "What is your go-to comfort food?",                          answerer: "Rachdouda", judge: "Salmuta" },
  { q: "What do you do to decompress after a hard day?",            answerer: "Rachdouda", judge: "Salmuta" },
  { q: "What is your favourite sport to watch?",                    answerer: "Rachdouda", judge: "Salmuta" },
  { q: "Describe your ideal Saturday in three words.",              answerer: "Rachdouda", judge: "Salmuta" },
  { q: "What is your worst habit?",                                 answerer: "Rachdouda", judge: "Salmuta" },
  { q: "What are you most proud of right now?",                     answerer: "Rachdouda", judge: "Salmuta" },
  { q: "Where do you most want to travel next?",                    answerer: "Rachdouda", judge: "Salmuta" },
  { q: "What do you find most attractive about Salmuta?",           answerer: "Rachdouda", judge: "Salmuta" },
  { q: "What would you order on a first date?",                     answerer: "Rachdouda", judge: "Salmuta" },
  { q: "What is your biggest fear?",                                answerer: "Rachdouda", judge: "Salmuta" },
  { q: "What is your favourite thing to do on a lazy Sunday?",      answerer: "Salmuta",   judge: "Rachdouda" },
  { q: "What are you most likely to order at a restaurant?",        answerer: "Salmuta",   judge: "Rachdouda" },
  { q: "What is your biggest pet peeve?",                           answerer: "Salmuta",   judge: "Rachdouda" },
  { q: "What do you always have in your bag?",                      answerer: "Salmuta",   judge: "Rachdouda" },
  { q: "What is your favourite cuisine?",                           answerer: "Salmuta",   judge: "Rachdouda" },
  { q: "What makes you laugh the hardest?",                         answerer: "Salmuta",   judge: "Rachdouda" },
  { q: "What would your dream job be?",                             answerer: "Salmuta",   judge: "Rachdouda" },
  { q: "What is your go-to movie genre?",                           answerer: "Salmuta",   judge: "Rachdouda" },
  { q: "Describe Rachdouda in one word.",                           answerer: "Salmuta",   judge: "Rachdouda" },
  { q: "What is something you want to do differently this year?",   answerer: "Salmuta",   judge: "Rachdouda" },
];

const KNOW_KEY = "ousm_know";

function getKnowDayQ() {
  const start  = new Date(2026, 5, 18);
  const dayIdx = Math.floor((new Date() - start) / (1000 * 60 * 60 * 24));
  return knowQuestions[Math.abs(dayIdx) % knowQuestions.length];
}

function loadKnow() {
  const raw = safeGetJSON(KNOW_KEY, {});
  if (raw.dateKey !== getTodayKey()) return { dateKey: getTodayKey(), answer: null, verdict: null };
  return raw;
}
function saveKnow(s) { safeSetJSON(KNOW_KEY, s); }

function renderKnow() {
  const el = document.getElementById("knowArea");
  if (!el) return;
  const q     = getKnowDayQ();
  const state = loadKnow();

  let html = `
    <div class="know-roles">
      <span class="know-role know-role--answer">✍️ <strong>${q.answerer}</strong> answers</span>
      <span class="know-role-divider">→</span>
      <span class="know-role know-role--judge">⚖️ <strong>${q.judge}</strong> judges</span>
    </div>
    <p class="mg-question">${q.q}</p>`;

  if (state.answer === null) {
    /* Step 1: answerer types their response */
    html += `
      <div class="know-input-wrap">
        <textarea id="knowInput" class="know-textarea" placeholder="${q.answerer}'s answer..." rows="3"></textarea>
        <button class="btn-action know-submit-btn" onclick="submitKnowAnswer()">Submit answer →</button>
      </div>`;
  } else if (state.verdict === null) {
    /* Step 2: answer submitted, waiting for judge */
    html += `
      <div class="know-answer-display">
        <div class="know-answer-label">${q.answerer} said:</div>
        <div class="know-answer-text">"${state.answer}"</div>
      </div>
      <div class="know-judge-prompt">
        <p>${q.judge}, is this right?</p>
        <div class="know-verdict-btns">
          <button class="know-verdict-btn know-verdict-yes" onclick="judgeKnow(true)">✓ Correct</button>
          <button class="know-verdict-btn know-verdict-no"  onclick="judgeKnow(false)">✗ Wrong</button>
        </div>
      </div>`;
  } else {
    /* Step 3: verdict given */
    const icon = state.verdict ? "🎉" : "😅";
    const msg  = state.verdict
      ? `${q.judge} confirmed it — nice one, ${q.answerer}!`
      : `${q.judge} said no — come back tomorrow for another chance!`;
    html += `
      <div class="know-answer-display">
        <div class="know-answer-label">${q.answerer} said:</div>
        <div class="know-answer-text">"${state.answer}"</div>
      </div>
      <div class="know-result ${state.verdict ? 'know-result--correct' : 'know-result--wrong'}">
        ${icon} ${msg}
      </div>`;
  }

  /* Score streak */
  html += `<div class="know-footer">Question ${(Math.abs(Math.floor((new Date() - new Date(2026,5,18))/(1000*60*60*24))) % knowQuestions.length) + 1} of ${knowQuestions.length} · resets at midnight</div>`;

  el.innerHTML = html;
}

function submitKnowAnswer() {
  const input = document.getElementById("knowInput");
  if (!input || !input.value.trim()) return;
  const state  = loadKnow();
  state.answer = input.value.trim();
  saveKnow(state);
  renderKnow();
}

function judgeKnow(correct) {
  const state   = loadKnow();
  state.verdict = correct;
  saveKnow(state);
  renderKnow();
}

/* ---------- GAME 2: SILLY GAME ---------- */
const sillyPool = [
  { q: "What city does Rachdouda pick up Salmuta in?",         a: "Nairobi",           opts: ["Cairo","Geneva","Nairobi","Tokyo"] },
  { q: "What sport does Rachdouda play competitively?",        a: "Volleyball",        opts: ["Football","Tennis","Volleyball","Basketball"] },
  { q: "What lake is Evian-les-Bains on?",                    a: "Lake Geneva",       opts: ["Lake Como","Lake Zurich","Lake Geneva","Lake Annecy"] },
  { q: "What is the name of the boat trip on the bucket list?",a: "Dhow cruise",       opts: ["Felucca ride","Dhow cruise","Catamaran trip","Ferry ride"] },
  { q: "Which tournament comes after St Disdille?",            a: "Excenevex",         opts: ["Geneva Open","Lausanne Cup","Excenevex","Montreux Finals"] },
  { q: "What ocean is Lamu on?",                               a: "Indian Ocean",      opts: ["Atlantic","Mediterranean","Indian Ocean","Red Sea"] },
  { q: "What day does the airport pickup happen?",             a: "14 August",         opts: ["29 July","5 August","14 August","1 September"] },
  { q: "What city does Rachdouda fly from on 5 August?",       a: "Tokyo",             opts: ["Geneva","Cairo","Nairobi","Tokyo"] },
  { q: "What is the XP goal to unlock Mission Complete?",      a: "500 XP",            opts: ["200 XP","350 XP","500 XP","750 XP"] },
  { q: "What country did we visit together most recently?",    a: "Japan",             opts: ["Morocco","Japan","Kenya","France"] },
];

const SILLY_KEY = "ousm_silly";

function getSillyDayQ() {
  const start  = new Date(2026, 5, 18);
  const dayIdx = Math.floor((new Date() - start) / (1000 * 60 * 60 * 24));
  return sillyPool[Math.abs(dayIdx) % sillyPool.length];
}

function loadSilly() {
  const raw = safeGetJSON(SILLY_KEY, {});
  if (raw.dateKey !== getTodayKey()) return { dateKey: getTodayKey(), rach: null, salm: null, shuffled: null };
  return raw;
}
function saveSilly(s) { safeSetJSON(SILLY_KEY, s); }

function renderSilly() {
  const el = document.getElementById("sillyArea");
  if (!el) return;
  const q     = getSillyDayQ();
  const state = loadSilly();

  if (!state.shuffled) {
    state.shuffled = [...q.opts].sort(() => Math.random() - 0.5);
    saveSilly(state);
  }
  const opts     = state.shuffled;
  const bothDone = state.rach !== null && state.salm !== null;

  let html = `<p class="mg-question">${q.q}</p><div class="mg-options">`;
  opts.forEach(opt => {
    let cls = "mg-option";
    if (bothDone && opt === q.a) cls += " mg-correct";
    html += `<button class="${cls}" onclick="sillySumbit(this,'${opt.replace(/'/g,"\'")}','${q.a.replace(/'/g,"\'")}')" ${bothDone ? "disabled" : ""}>${opt}</button>`;
  });
  html += `</div>`;

  if (!bothDone) {
    html += `<div id="sillyFeedback" class="mg-feedback"></div>`;
    html += `<div class="mg-who"><p>Who's answering?</p><div class="mg-who-btns">`;
    if (state.rach === null) html += `<button class="mg-who-btn" id="sillyBtnRach" onclick="setSillyPlayer('rach')">🧔 Rachdouda</button>`;
    if (state.salm === null) html += `<button class="mg-who-btn mg-who-btn--right" id="sillyBtnSalm" onclick="setSillyPlayer('salm')">👩 Salmuta</button>`;
    html += `</div></div>`;
  } else {
    const both  = state.rach === 1 && state.salm === 1;
    const none  = state.rach === 0 && state.salm === 0;
    const msg   = both ? "You both got it! 🎉 Operationally excellent." : none ? "You both got it wrong 😅 Back to the mission briefing!" : "One for one — not bad, agents.";
    html += `<div class="mg-feedback mg-fb-correct">${msg}</div>`;
  }

  html += `<div class="mg-scores">`;
  html += `<div class="mg-score-block"><img src="Rachdouda.png" class="mg-avatar" onerror="this.style.display='none'"><span class="mg-name">Rachdouda</span><span class="mg-score-val ${state.rach===1?'mg-sv-correct':state.rach===0?'mg-sv-wrong':''}">${state.rach===null?"—":state.rach===1?"✓ Correct!":"✗ Wrong"}</span></div>`;
  html += `<div class="mg-score-block"><img src="Salmuta.png" class="mg-avatar" onerror="this.style.display='none'"><span class="mg-name">Salmuta</span><span class="mg-score-val ${state.salm===1?'mg-sv-correct':state.salm===0?'mg-sv-wrong':''}">${state.salm===null?"—":state.salm===1?"✓ Correct!":"✗ Wrong"}</span></div>`;
  html += `</div>`;

  el.innerHTML = html;
  window._sillyPlayer = null;
  if (!bothDone) lockSillyOptions(true);
}

function setSillyPlayer(who) {
  window._sillyPlayer = who;
  document.querySelectorAll(".mg-who-btn").forEach(b => b.classList.remove("active"));
  const btn = document.getElementById(who === "rach" ? "sillyBtnRach" : "sillyBtnSalm");
  if (btn) btn.classList.add("active");
  lockSillyOptions(false);
}

function lockSillyOptions(lock) {
  const state = loadSilly();
  if (state.rach !== null && state.salm !== null) return;
  document.querySelectorAll("#sillyArea .mg-option").forEach(b => { b.disabled = lock; });
}

function sillySumbit(btn, chosen, correct) {
  if (!window._sillyPlayer) {
    const fb = document.getElementById("sillyFeedback");
    if (fb) { fb.textContent = "👆 Pick who's answering first!"; fb.className = "mg-feedback mg-fb-wrong"; }
    return;
  }
  const state     = loadSilly();
  const isCorrect = chosen === correct;
  if (window._sillyPlayer === "rach") state.rach = isCorrect ? 1 : 0;
  else state.salm = isCorrect ? 1 : 0;
  saveSilly(state);
  window._sillyPlayer = null;

  document.querySelectorAll("#sillyArea .mg-option").forEach(b => {
    b.disabled = true;
    if (b.textContent === correct) b.classList.add("mg-correct");
    else if (b.textContent === chosen && !isCorrect) b.classList.add("mg-wrong");
  });

  const fb = document.getElementById("sillyFeedback");
  if (fb) {
    fb.textContent = isCorrect ? "✓ Correct! 🎉" : `✗ The answer was: ${correct}`;
    fb.className   = "mg-feedback " + (isCorrect ? "mg-fb-correct" : "mg-fb-wrong");
  }
  setTimeout(() => renderSilly(), 900);
}

/* ---------- REUNION CONFETTI ---------- */
function checkReunion() {
  if (today >= reunionDate) {
    const ov = document.getElementById("reunionOverlay");
    if (ov) ov.classList.remove("hidden");
    launchConfetti();
  }
}

function launchConfetti() {
  const canvas = document.getElementById("confettiCanvas");
  if (!canvas) return;
  canvas.style.display = "block";
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  const ctx    = canvas.getContext("2d");
  const colors = ["#c4446c","#e8a040","#6b8f71","#fce8ef","#fdf3e3","#fde68a"];
  const pieces = Array.from({ length: 160 }, () => ({
    x: Math.random() * canvas.width, y: Math.random() * -canvas.height,
    size: 5 + Math.random() * 7, speed: 2 + Math.random() * 3,
    drift: Math.random() * 2 - 1, color: colors[Math.floor(Math.random() * colors.length)],
    spin: Math.random() * Math.PI
  }));
  let frame = 0;
  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.y += p.speed; p.x += p.drift; p.spin += 0.04;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.spin);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
      ctx.restore();
      if (p.y > canvas.height) p.y = -10;
    });
    if (++frame < 480) requestAnimationFrame(tick);
    else canvas.style.display = "none";
  }
  requestAnimationFrame(tick);
}

/* ---------- INIT ---------- */
document.addEventListener("DOMContentLoaded", () => {
  updateCountdown();
  renderBucket();
  renderXP();
  renderRace(loadRace());
  initWheels();
  renderKnow();
  renderSilly();
  checkReunion();
});

window.addEventListener("resize", () => {
  const c = document.getElementById("confettiCanvas");
  if (c && c.style.display === "block") { c.width = window.innerWidth; c.height = window.innerHeight; }
});
