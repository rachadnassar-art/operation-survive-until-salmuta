/* ============================================
   OPERATION: SURVIVE UNTIL SALMUTA — script.js v2
   localStorage used throughout for persistence
   ============================================ */

/* ---------- DATES ---------- */
const departureDate = new Date("2026-06-18T00:00:00");
const reunionDate   = new Date("2026-08-14T00:00:00");
const today         = new Date();

function daysBetween(a, b) {
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

/* ---------- COUNTDOWN ---------- */
function updateCountdown() {
  const daysLeft    = Math.max(daysBetween(today, reunionDate), 0);
  const daysSurvived = Math.max(daysBetween(departureDate, today), 0);
  const total       = daysBetween(departureDate, reunionDate);
  const pct         = total > 0 ? Math.round((daysSurvived / total) * 100) : 0;

  document.getElementById("daysLeft").textContent    = daysLeft;
  document.getElementById("daysSurvived").textContent = daysSurvived;
  document.getElementById("pctDone").textContent     = pct + "%";
}

/* ---------- JOURNEY MAP ---------- */
function updateJourney() {
  const total    = daysBetween(departureDate, reunionDate);
  const elapsed  = daysBetween(departureDate, today);
  const progress = Math.min(Math.max(elapsed / total, 0), 1);

  document.getElementById("trackFill").style.width = (progress * 100) + "%";
  document.getElementById("progressMarker").style.left = (progress * 100) + "%";
}

/* ---------- DATE GENERATOR ---------- */
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

function generateDate() {
  const r = dates[Math.floor(Math.random() * dates.length)];
  document.getElementById("dateResult").textContent = r;
}

/* ---------- QUESTION GENERATOR ---------- */
const questions = [
  "What memory from Japan do you revisit most often?",
  "What should we do together this year?",
  "What is something you've changed your mind about recently?",
  "Where do we see ourselves in a year?",
  "What does your ideal weekend look like?",
  "What is one thing we do worse than other couples?"
];

function generateQuestion() {
  const q = questions[Math.floor(Math.random() * questions.length)];
  document.getElementById("question").textContent = q;
}

/* ---------- BUCKET LIST (localStorage) ---------- */
const bucket = [
  "Sunset on the lake",
  "Hike in the mountains",
  "Drive in Cairo",
  "Dhow cruise in Lamu",
  "Heightened security brunch in Westlands"
];

const BUCKET_KEY = "ousm_bucket";

function loadBucket() {
  try { return JSON.parse(localStorage.getItem(BUCKET_KEY)) || {}; }
  catch { return {}; }
}

function saveBucket(s) {
  try { localStorage.setItem(BUCKET_KEY, JSON.stringify(s)); } catch {}
}

function renderBucket() {
  const state = loadBucket();
  const done  = Object.values(state).filter(Boolean).length;
  const grid  = document.getElementById("bucketGrid");
  document.getElementById("bucketBadge").textContent = `${done} / ${bucket.length}`;

  grid.innerHTML = "";
  bucket.forEach((item, i) => {
    const isDone = !!state[i];
    const li = document.createElement("li");
    li.className = "bucket-item" + (isDone ? " done" : "");
    li.innerHTML = `<span class="bi-check">${isDone ? "✓" : ""}</span><span class="bi-label">${item}</span>`;
    li.addEventListener("click", () => {
      const s = loadBucket();
      s[i] = !s[i];
      saveBucket(s);
      renderBucket();
    });
    grid.appendChild(li);
  });
}

/* ---------- XP SYSTEM (localStorage) ---------- */
const XP_KEY  = "ousm_xp";
const XP_GOAL = 500;

const badgeDefs = [
  { label: "Survived One Week",               threshold: 1,   hint: "Awarded automatically — you made it this far" },
  { label: "Only One Continent Apart",        threshold: 50,  hint: "Earn 50 XP — try a video call (+20) and a deep question (+25)" },
  { label: "Emergency Hug Request Submitted", threshold: 100, hint: "Earn 100 XP — a date night (+50) gets you halfway there" },
  { label: "Volleyball Correspondent",        threshold: 150, hint: "Earn 150 XP — keep logging volleyball updates (+30) and surprise photos (+35)" },
  { label: "Bucket List Pioneer",             threshold: 200, hint: "Earn 200 XP — stack a date night, deep question, and video call" },
  { label: "Mission Completed",               threshold: XP_GOAL, hint: "Reach 500 XP — the final badge, earned together" }
];

function getXP() {
  return parseInt(localStorage.getItem(XP_KEY) || "0", 10);
}

function addXP(points, label) {
  const xp = getXP() + points;
  localStorage.setItem(XP_KEY, String(xp));

  const toast = document.getElementById("xpToast");
  toast.textContent = `+${points} XP — ${label}`;
  toast.classList.remove("hidden");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.add("hidden"), 3000);

  renderXP();
}

function renderXP() {
  const xp  = getXP();
  const pct = Math.min((xp / XP_GOAL) * 100, 100);

  document.getElementById("xpBadge").textContent   = `${xp} XP`;
  document.getElementById("xpBarFill").style.width = pct + "%";

  renderBadges(xp);
}

function renderBadges(xp) {
  const grid = document.getElementById("badgesGrid");
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

/* ---------- REUNION TRIGGER + CONFETTI ---------- */
function checkReunion() {
  if (today >= reunionDate) {
    document.getElementById("reunionOverlay").classList.remove("hidden");
    launchConfetti();
  }
}

function launchConfetti() {
  const canvas = document.getElementById("confettiCanvas");
  canvas.style.display = "block";
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext("2d");
  const colors = ["#c4446c","#e8a040","#6b8f71","#fce8ef","#fdf3e3"];

  const pieces = Array.from({ length: 160 }, () => ({
    x:     Math.random() * canvas.width,
    y:     Math.random() * -canvas.height,
    size:  5 + Math.random() * 7,
    speed: 2 + Math.random() * 3,
    drift: Math.random() * 2 - 1,
    color: colors[Math.floor(Math.random() * colors.length)],
    spin:  Math.random() * Math.PI
  }));

  let frame = 0;
  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.y += p.speed; p.x += p.drift; p.spin += 0.04;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.spin);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
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
  updateJourney();
  renderBucket();
  renderXP();
  checkReunion();
});

window.addEventListener("resize", () => {
  const c = document.getElementById("confettiCanvas");
  if (c.style.display === "block") { c.width = window.innerWidth; c.height = window.innerHeight; }
});
