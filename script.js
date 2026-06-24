/* ============================================
   OPERATION: SURVIVE UNTIL SALMUTA — script.js
   ============================================ */

/* ---------- CONFIG: DATES ---------- */
// Change these if the mission dates shift.
const departureDate = new Date("2026-06-18T00:00:00");
const reunionDate   = new Date("2026-08-14T00:00:00");
const today = new Date();

/* ---------- COUNTDOWN ---------- */
function daysBetween(a, b){
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((b - a) / msPerDay);
}

function updateCountdown(){
  const daysLeft = Math.max(daysBetween(today, reunionDate), 0);
  const daysSurvived = Math.max(daysBetween(departureDate, today), 0);

  document.getElementById("daysLeft").textContent = daysLeft;
  document.getElementById("daysSurvived").textContent = daysSurvived;
}

/* ---------- JOURNEY ANIMATION ---------- */
function updateJourney(){
  const totalDays = daysBetween(departureDate, reunionDate);
  const elapsedDays = daysBetween(departureDate, today);
  let progress = totalDays > 0 ? elapsedDays / totalDays : 0;
  progress = Math.min(Math.max(progress, 0), 1);

  document.getElementById("rachdouda").style.left = `calc(${progress * 50}% )`;
  document.getElementById("salmuta").style.right = `calc(${progress * 50}% )`;
  document.getElementById("trackFill").style.width = `${progress * 100}%`;

  // mark waypoints as "passed" proportionally to progress
  const waypoints = document.querySelectorAll(".waypoint");
  waypoints.forEach((wp, i) => {
    const wpProgress = i / (waypoints.length - 1);
    wp.classList.toggle("passed", wpProgress <= progress);
  });
}

/* ---------- DATE GENERATOR ---------- */
const dates = [
  "Cook Japanese comfort food together",
  "Movie night: loser writes dramatic review",
  "Sunset exchange challenge",
  "Wingspan tournament",
  "Plan your first reunion weekend",
  "Music swap challenge",
  "Online board game night",
  "Show each other one place nearby"
];

function generateDate(){
  const random = dates[Math.floor(Math.random() * dates.length)];
  document.getElementById("dateResult").textContent = random;
}

/* ---------- QUESTION GENERATOR ---------- */
const questions = [
  "What is one thing we do better than most couples?",
  "What would our ideal weekend look like?",
  "What memory from Japan do you revisit most often?",
  "What should we learn together next year?",
  "What is something you've changed your mind about recently?"
];

function generateQuestion(){
  const q = questions[Math.floor(Math.random() * questions.length)];
  document.getElementById("question").textContent = q;
}

/* ---------- BUCKET LIST ---------- */
const bucket = [
  "Breakfast date",
  "Japanese restaurant",
  "Sunset on the lake",
  "Volleyball together",
  "Weekend getaway"
];

const BUCKET_KEY = "ousm_bucket_done";

function loadBucketState(){
  try{
    const raw = sessionStorage.getItem(BUCKET_KEY);
    return raw ? JSON.parse(raw) : {};
  }catch(e){
    return {};
  }
}

function saveBucketState(state){
  try{ sessionStorage.setItem(BUCKET_KEY, JSON.stringify(state)); }catch(e){ /* ignore */ }
}

function renderBucket(){
  const grid = document.getElementById("bucketGrid");
  const state = loadBucketState();
  grid.innerHTML = "";

  bucket.forEach((item, i) => {
    const li = document.createElement("li");
    li.className = "bucket-item" + (state[i] ? " done" : "");
    li.innerHTML = `<span class="checkbox">${state[i] ? "✓" : ""}</span><span class="label">${item}</span>`;
    li.addEventListener("click", () => {
      const s = loadBucketState();
      s[i] = !s[i];
      saveBucketState(s);
      renderBucket();
    });
    grid.appendChild(li);
  });
}

/* ---------- XP SYSTEM ----------
   Note: uses sessionStorage instead of localStorage so it works
   reliably inside preview/artifact environments. Swap back to
   localStorage if hosting standalone and you want it to persist
   across browser sessions. */
const XP_KEY = "ousm_xp";
const XP_LOG_KEY = "ousm_xp_log";
const XP_GOAL = 500; // tune this to whatever feels like "mission complete"

const badgeDefs = [
  { id: "week1",     label: "Survived One Week",            threshold: 1 },
  { id: "continent", label: "Only One Continent Apart",     threshold: 50 },
  { id: "emergency", label: "Emergency Hug Request Submitted", threshold: 100 },
  { id: "volleyball",label: "Volleyball Correspondent",     threshold: 150 },
  { id: "salma",     label: "Salma Watches Producer",       threshold: 200 },
  { id: "compliance",label: "UN Compliance Officer",        threshold: 300 },
  { id: "complete",  label: "Mission Completed",            threshold: XP_GOAL }
];

function getXP(){
  const v = sessionStorage.getItem(XP_KEY);
  return v ? parseInt(v, 10) : 0;
}

function setXP(v){
  sessionStorage.setItem(XP_KEY, String(v));
}

function getXPLog(){
  try{
    const raw = sessionStorage.getItem(XP_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){
    return [];
  }
}

function addXP(points, label){
  const xp = getXP() + points;
  setXP(xp);

  const log = getXPLog();
  log.unshift(`+${points} XP — ${label}`);
  sessionStorage.setItem(XP_LOG_KEY, JSON.stringify(log.slice(0, 5)));

  renderXP();
}

function renderXP(){
  const xp = getXP();
  const pct = Math.min((xp / XP_GOAL) * 100, 100);

  document.getElementById("xpLabel").textContent = `${xp} XP`;
  document.getElementById("xpBarFill").style.width = `${pct}%`;

  const log = getXPLog();
  document.getElementById("xpLog").textContent = log.length ? log[0] : "";

  renderBadges(xp);
}

function renderBadges(xp){
  const grid = document.getElementById("badgesGrid");
  grid.innerHTML = "";
  badgeDefs.forEach(b => {
    const unlocked = xp >= b.threshold;
    const pill = document.createElement("span");
    pill.className = "badge-pill" + (unlocked ? "" : " locked");
    pill.textContent = unlocked ? b.label : `🔒 ${b.label}`;
    grid.appendChild(pill);
  });
}

/* ---------- REUNION TRIGGER + CONFETTI ---------- */
function checkReunion(){
  if (today >= reunionDate){
    document.body.classList.add("reunion");
    document.getElementById("reunionOverlay").classList.remove("hidden");
    launchConfetti();
  }
}

function launchConfetti(){
  const canvas = document.getElementById("confettiCanvas");
  canvas.style.display = "block";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext("2d");

  const colors = ["#ff6b4a", "#ffb347", "#2dd4bf", "#fdf6ec"];
  const pieces = Array.from({ length: 140 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * -canvas.height,
    size: 5 + Math.random() * 6,
    speed: 2 + Math.random() * 3,
    drift: Math.random() * 2 - 1,
    color: colors[Math.floor(Math.random() * colors.length)],
    spin: Math.random() * Math.PI
  }));

  let frame = 0;
  const maxFrames = 420; // ~7 seconds at 60fps

  function tick(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.y += p.speed;
      p.x += p.drift;
      p.spin += 0.05;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.spin);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
      if (p.y > canvas.height) p.y = -10;
    });
    frame++;
    if (frame < maxFrames){
      requestAnimationFrame(tick);
    } else {
      canvas.style.display = "none";
    }
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
  const canvas = document.getElementById("confettiCanvas");
  if (canvas.style.display === "block"){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
});
