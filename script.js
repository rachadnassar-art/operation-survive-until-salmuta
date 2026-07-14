/* ============================================
   OPERATION: SURVIVE UNTIL SALMUTA — script.js v5
   Real-time sync via Firebase Realtime Database
   ============================================ */

/* ---------- FIREBASE INIT ---------- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, onValue, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCDKbF7dPVGhqdszW0NJi6HGQ4ES_n4Lzs",
  authDomain: "operation-salmuta.firebaseapp.com",
  databaseURL: "https://operation-salmuta-default-rtdb.firebaseio.com",
  projectId: "operation-salmuta",
  storageBucket: "operation-salmuta.firebasestorage.app",
  messagingSenderId: "725621348407",
  appId: "1:725621348407:web:2e2b8bcbe823099912c7b2"
};

const fbApp = initializeApp(firebaseConfig);
const db    = getDatabase(fbApp);

/* Helper: write a path */
function fbSet(path, data) {
  return set(ref(db, path), data);
}

/* Helper: subscribe to a path, call cb(data) on every change */
function fbListen(path, cb) {
  onValue(ref(db, path), snap => {
    cb(snap.exists() ? snap.val() : null);
  });
}

/* ---------- LOCAL FALLBACK (for preview without Firebase) ---------- */
const _mem = {};
function safeGet(k)        { try { return localStorage.getItem(k); } catch { return _mem[k]||null; } }
function safeSet(k,v)      { try { localStorage.setItem(k,String(v)); } catch {} _mem[k]=String(v); }
function safeGetJSON(k,fb) { try { const v=safeGet(k); return v?JSON.parse(v):fb; } catch { return fb; } }
function safeSetJSON(k,v)  { safeSet(k, JSON.stringify(v)); }

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/* ---------- DATES ---------- */
const departureDate = new Date("2026-06-18T00:00:00");
const reunionDate   = new Date("2026-08-14T00:00:00");
const today         = new Date();

function daysBetween(a, b) {
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

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

let _bucketState = {};

function renderBucket(state) {
  _bucketState = state || {};
  const done  = Object.values(_bucketState).filter(Boolean).length;
  const badge = document.getElementById("bucketBadge");
  const grid  = document.getElementById("bucketGrid");
  if (badge) badge.textContent = `${done} / ${bucket.length}`;
  if (!grid) return;
  grid.innerHTML = "";
  bucket.forEach((item, i) => {
    const isDone = !!_bucketState[i];
    const li = document.createElement("li");
    li.className = "bucket-item" + (isDone ? " done" : "");
    li.innerHTML = `<span class="bi-check">${isDone ? "✓" : ""}</span><span class="bi-label">${item}</span>`;
    li.addEventListener("click", () => {
      const s = { ..._bucketState };
      s[i] = !s[i];
      fbSet("bucket", s);
    });
    grid.appendChild(li);
  });
}

function initBucket() {
  fbListen("bucket", data => renderBucket(data || {}));
}

/* ---------- XP + BADGES ---------- */
const XP_GOAL = 500;
const badgeDefs = [
  { label: "Survived One Week",               threshold: 1,       hint: "Awarded automatically — you made it this far" },
  { label: "Only One Continent Apart",        threshold: 50,      hint: "Earn 50 XP — try a video call (+20) and a deep question (+25)" },
  { label: "Emergency Hug Request Submitted", threshold: 100,     hint: "Earn 100 XP — a date night (+50) gets you halfway there" },
  { label: "Volleyball Correspondent",        threshold: 150,     hint: "Earn 150 XP — log volleyball updates (+30) and surprise photos (+35)" },
  { label: "Bucket List Pioneer",             threshold: 200,     hint: "Earn 200 XP — stack a date night, deep question, and video call" },
  { label: "Mission Completed",               threshold: XP_GOAL, hint: "Reach 500 XP — the final badge, earned together" }
];

let _xp = 0;

function addXP(points, label) {
  const newXP = _xp + points;
  fbSet("xp", newXP);
  const toast = document.getElementById("xpToast");
  if (toast) {
    toast.textContent = `+${points} XP — ${label}`;
    toast.classList.remove("hidden");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.add("hidden"), 3000);
  }
}

function renderXP(xp) {
  _xp = xp || 0;
  const pct   = Math.min((_xp / XP_GOAL) * 100, 100);
  const badge = document.getElementById("xpBadge");
  const bar   = document.getElementById("xpBarFill");
  if (badge) badge.textContent  = `${_xp} XP`;
  if (bar)   bar.style.width    = pct + "%";
  renderBadges(_xp);
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

function initXP() {
  fbListen("xp", data => renderXP(data || 0));
}

/* ---------- DONKEY RACE ---------- */
const NUDGE_STEP = 3;
const FINISH_PCT = 46;
let _raceState = { rach: 0, salm: 0, winner: null };

function nudgeDonkey(who) {
  const state = { ..._raceState };
  if (state.winner) return;
  state[who] = Math.min((state[who] || 0) + NUDGE_STEP, FINISH_PCT);
  const el = document.getElementById(who === "rach" ? "donkeyRach" : "donkeySalm");
  if (el) { el.style.animation = "none"; el.offsetHeight; el.style.animation = who === "rach" ? "bobLeft 0.5s ease-out" : "bobRight 0.5s ease-out"; }
  if (state.rach >= FINISH_PCT && state.salm >= FINISH_PCT) state.winner = "tie";
  else if (state.rach >= FINISH_PCT) state.winner = "rach";
  else if (state.salm >= FINISH_PCT) state.winner = "salm";
  fbSet("race", state);
}

function renderRace(state) {
  _raceState = state || { rach: 0, salm: 0, winner: null };
  const dr = document.getElementById("donkeyRach");
  const ds = document.getElementById("donkeySalm");
  const rs = document.getElementById("rachSteps");
  const ss = document.getElementById("salmSteps");
  const we = document.getElementById("raceWinner");
  const th = document.getElementById("trackHeart");
  const nr = (_raceState.rach || 0) / NUDGE_STEP;
  const ns = (_raceState.salm || 0) / NUDGE_STEP;
  if (dr) dr.style.left  = (_raceState.rach || 0) + "%";
  if (ds) ds.style.right = (_raceState.salm || 0) + "%";
  if (rs) rs.textContent = nr + " nudge" + (nr !== 1 ? "s" : "");
  if (ss) ss.textContent = ns + " nudge" + (ns !== 1 ? "s" : "");
  if (we && _raceState.winner) {
    we.classList.remove("hidden");
    we.textContent = _raceState.winner === "tie"  ? "🫏❤️🫏 They meet in the middle — both win!" :
      _raceState.winner === "rach" ? "🫏 Rachdouda wins! Bragging rights secured until Nairobi. 🏆" :
      "🫏 Salmuta wins! She'll remind him of this for years. 🏆";
  } else if (we) { we.classList.add("hidden"); }
  if (th && _raceState.winner) th.style.animation = "heartbeat 0.4s ease-in-out infinite";
}

function initRace() {
  fbListen("race", data => renderRace(data));
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
const wheelState = { date: { angle: 0, spinning: false }, question: { angle: 0, spinning: false } };

function drawWheel(id, items, colors, angle) {
  const canvas = document.getElementById(id + "Wheel");
  if (!canvas) return;
  const dpr  = Math.min(window.devicePixelRatio || 1, 3);
  const size = 260;
  canvas.width  = size * dpr; canvas.height = size * dpr;
  canvas.style.width = size + "px"; canvas.style.height = size + "px";
  const ctx   = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  const cx = size/2, cy = size/2, r = cx - 6;
  const slice = (2 * Math.PI) / items.length;

  const grad = ctx.createRadialGradient(cx,cy,r-2,cx,cy,r+6);
  grad.addColorStop(0,"rgba(255,255,255,0.9)"); grad.addColorStop(1,"rgba(200,180,160,0.4)");
  ctx.beginPath(); ctx.arc(cx,cy,r+4,0,2*Math.PI); ctx.fillStyle=grad; ctx.fill();

  items.forEach((item,i) => {
    const start = angle + i*slice, end = start+slice;
    const sg = ctx.createRadialGradient(cx,cy,0,cx,cy,r);
    sg.addColorStop(0, lighten(colors[i%colors.length],0.3));
    sg.addColorStop(1, colors[i%colors.length]);
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,start,end); ctx.closePath();
    ctx.fillStyle = sg; ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 2; ctx.stroke();
    ctx.save(); ctx.translate(cx,cy); ctx.rotate(start+slice/2); ctx.textAlign="right";
    ctx.fillStyle="rgba(255,255,255,0.97)"; ctx.shadowColor="rgba(0,0,0,0.5)"; ctx.shadowBlur=4;
    ctx.font=`bold 10.5px DM Sans,sans-serif`;
    const words=item.split(" "); let lines=[],line="";
    words.forEach(w=>{ if((line+" "+w).trim().length>13&&line){lines.push(line.trim());line=w;}else line=(line+" "+w).trim(); });
    if(line) lines.push(line.trim()); lines=lines.slice(0,3);
    const lineH=12, startY=-(lines.length-1)*lineH/2;
    lines.forEach((l,li)=>ctx.fillText(l,r-10,startY+li*lineH));
    ctx.restore();
  });

  items.forEach((_,i)=>{
    const a=angle+i*slice;
    ctx.beginPath(); ctx.arc(cx+(r+1)*Math.cos(a),cy+(r+1)*Math.sin(a),3,0,2*Math.PI);
    ctx.fillStyle="rgba(255,255,255,0.8)"; ctx.fill();
  });

  const cg=ctx.createRadialGradient(cx-4,cy-4,2,cx,cy,20);
  cg.addColorStop(0,"#ffffff"); cg.addColorStop(1,"#f0e8e0");
  ctx.beginPath(); ctx.arc(cx,cy,20,0,2*Math.PI); ctx.fillStyle=cg; ctx.fill();
  ctx.strokeStyle="rgba(0,0,0,0.1)"; ctx.lineWidth=1.5; ctx.stroke();
  ctx.font="15px serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.shadowColor="transparent"; ctx.fillText("❤️",cx,cy);
}

function lighten(hex, amount) {
  const n=parseInt(hex.slice(1),16);
  const r=Math.min(255,((n>>16)&0xff)+Math.round(255*amount));
  const g=Math.min(255,((n>>8)&0xff)+Math.round(255*amount));
  const b=Math.min(255,((n>>0)&0xff)+Math.round(255*amount));
  return `rgb(${r},${g},${b})`;
}

function spinWheel(type) {
  const state = wheelState[type];
  if (state.spinning) return;
  const items     = type==="date" ? dates : questions;
  const colors    = wheelColors[type];
  const resultEl  = document.getElementById(type==="date" ? "dateResult" : "question");
  const winnerIdx = Math.floor(Math.random()*items.length);
  const slice     = (2*Math.PI)/items.length;
  const target    = -Math.PI/2-(winnerIdx*slice+slice/2);
  const spins     = 6+Math.floor(Math.random()*4);
  const total     = state.angle+spins*2*Math.PI+((target-state.angle%(2*Math.PI)+2*Math.PI)%(2*Math.PI));
  state.spinning  = true;
  if (resultEl) resultEl.textContent = "";
  const dur=4000+Math.random()*1200, t0=performance.now(), a0=state.angle;
  function ease(t){ return 1-Math.pow(1-t,4); }
  function tick(now) {
    const t=Math.min((now-t0)/dur,1);
    state.angle=a0+(total-a0)*ease(t);
    drawWheel(type,items,colors,state.angle);
    if(t<1){ requestAnimationFrame(tick); }
    else {
      state.spinning=false;
      const canvas=document.getElementById(type+"Wheel");
      if(canvas){ canvas.style.transition="transform 0.15s ease"; canvas.style.transform="scale(1.05)"; setTimeout(()=>{canvas.style.transform="scale(1)";},180); }
      if(resultEl) resultEl.textContent=items[winnerIdx];
      showWinPopup(items[winnerIdx],type);
      /* Save result to Firebase so other person sees it */
      fbSet("wheel/"+type, { result: items[winnerIdx], ts: Date.now() });
    }
  }
  requestAnimationFrame(tick);
}

function initWheels() {
  drawWheel("date",questions,wheelColors.date,0);
  drawWheel("question",questions,wheelColors.question,0);
  /* Actually draw with correct items */
  drawWheel("date",dates,wheelColors.date,0);
  drawWheel("question",questions,wheelColors.question,0);

  /* Listen for remote wheel spins — show result to the other person */
  fbListen("wheel/date", data => {
    if (!data) return;
    const el = document.getElementById("dateResult");
    if (el && !wheelState.date.spinning) el.textContent = data.result || "";
  });
  fbListen("wheel/question", data => {
    if (!data) return;
    const el = document.getElementById("question");
    if (el && !wheelState.question.spinning) el.textContent = data.result || "";
  });
}

/* ---------- WIN POPUP ---------- */
function showWinPopup(prize, type) {
  const popup = document.getElementById("winPopup");
  const label = document.getElementById("winPopupLabel");
  const sub   = document.getElementById("winPopupSub");
  if (!popup) return;
  if (label) label.textContent = prize;
  if (sub)   sub.textContent   = type==="date"
    ? "Tonight's mission is set. No excuses. 🌙"
    : "Answer this honestly on your next call. No dodging. ❤️";
  popup.classList.remove("hidden");
  requestAnimationFrame(()=>popup.classList.add("show"));
  launchMiniConfetti();
  clearTimeout(popup._t);
  popup._t = setTimeout(closeWinPopup, 5500);
}

function closeWinPopup() {
  const popup = document.getElementById("winPopup");
  if (!popup) return;
  popup.classList.remove("show");
  setTimeout(()=>popup.classList.add("hidden"), 320);
}

function launchMiniConfetti() {
  const canvas = document.getElementById("miniConfettiCanvas");
  if (!canvas) return;
  const parent = canvas.parentElement;
  canvas.width = parent?parent.offsetWidth:380; canvas.height = parent?parent.offsetHeight:300;
  canvas.style.display = "block";
  const ctx=canvas.getContext("2d");
  const colors=["#c4446c","#e8a040","#6b8f71","#fce8ef","#fde68a","#7b5ea7","#3a8fb5"];
  const pieces=Array.from({length:90},()=>({
    x:Math.random()*canvas.width, y:-10-Math.random()*80,
    size:4+Math.random()*6, speed:2.5+Math.random()*3, drift:Math.random()*2-1,
    spin:Math.random()*Math.PI, color:colors[Math.floor(Math.random()*colors.length)], shape:Math.random()>0.5?"r":"c"
  }));
  let frame=0;
  function tick(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    pieces.forEach(p=>{
      p.y+=p.speed; p.x+=p.drift; p.spin+=0.05;
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.spin); ctx.fillStyle=p.color;
      if(p.shape==="c"){ctx.beginPath();ctx.arc(0,0,p.size/2,0,2*Math.PI);ctx.fill();}
      else ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size*0.6);
      ctx.restore(); if(p.y>canvas.height) p.y=-10;
    });
    if(++frame<220) requestAnimationFrame(tick); else canvas.style.display="none";
  }
  requestAnimationFrame(tick);
}

/* ---------- KNOW EACH OTHER GAME ---------- */
const knowQuestions = [
  { q:"What is your go-to comfort food?",                          answerer:"Rachdouda", judge:"Salmuta" },
  { q:"What do you do to decompress after a hard day?",            answerer:"Rachdouda", judge:"Salmuta" },
  { q:"What is your favourite sport to watch?",                    answerer:"Rachdouda", judge:"Salmuta" },
  { q:"Describe your ideal Saturday in three words.",              answerer:"Rachdouda", judge:"Salmuta" },
  { q:"What is your worst habit?",                                 answerer:"Rachdouda", judge:"Salmuta" },
  { q:"What are you most proud of right now?",                     answerer:"Rachdouda", judge:"Salmuta" },
  { q:"Where do you most want to travel next?",                    answerer:"Rachdouda", judge:"Salmuta" },
  { q:"What do you find most attractive about Salmuta?",           answerer:"Rachdouda", judge:"Salmuta" },
  { q:"What would you order on a first date?",                     answerer:"Rachdouda", judge:"Salmuta" },
  { q:"What is your biggest fear?",                                answerer:"Rachdouda", judge:"Salmuta" },
  { q:"What is your favourite thing to do on a lazy Sunday?",      answerer:"Salmuta",   judge:"Rachdouda" },
  { q:"What are you most likely to order at a restaurant?",        answerer:"Salmuta",   judge:"Rachdouda" },
  { q:"What is your biggest pet peeve?",                           answerer:"Salmuta",   judge:"Rachdouda" },
  { q:"What do you always have in your bag?",                      answerer:"Salmuta",   judge:"Rachdouda" },
  { q:"What is your favourite cuisine?",                           answerer:"Salmuta",   judge:"Rachdouda" },
  { q:"What makes you laugh the hardest?",                         answerer:"Salmuta",   judge:"Rachdouda" },
  { q:"What would your dream job be?",                             answerer:"Salmuta",   judge:"Rachdouda" },
  { q:"What is your go-to movie genre?",                           answerer:"Salmuta",   judge:"Rachdouda" },
  { q:"Describe Rachdouda in one word.",                           answerer:"Salmuta",   judge:"Rachdouda" },
  { q:"What is something you want to do differently this year?",   answerer:"Salmuta",   judge:"Rachdouda" },
];

function getKnowDayQ() {
  const start  = new Date(2026,5,18);
  const dayIdx = Math.floor((new Date()-start)/(1000*60*60*24));
  return knowQuestions[Math.abs(dayIdx)%knowQuestions.length];
}

let _knowState = {};

function renderKnow(state) {
  _knowState = state || {};
  if (_knowState.dateKey !== getTodayKey()) _knowState = { dateKey: getTodayKey(), answer: null, verdict: null };
  const el = document.getElementById("knowArea");
  if (!el) return;
  const q = getKnowDayQ();
  let html = `
    <div class="know-roles">
      <span class="know-role know-role--answer">✍️ <strong>${q.answerer}</strong> answers</span>
      <span class="know-role-divider">→</span>
      <span class="know-role know-role--judge">⚖️ <strong>${q.judge}</strong> judges</span>
    </div>
    <p class="mg-question">${q.q}</p>`;
  if (!_knowState.answer) {
    html += `<div class="know-input-wrap">
      <textarea id="knowInput" class="know-textarea" placeholder="${q.answerer}'s answer..." rows="3"></textarea>
      <button class="btn-action know-submit-btn" onclick="submitKnowAnswer()">Submit answer →</button>
    </div>`;
  } else if (_knowState.verdict === null || _knowState.verdict === undefined) {
    html += `<div class="know-answer-display">
      <div class="know-answer-label">${q.answerer} said:</div>
      <div class="know-answer-text">"${_knowState.answer}"</div>
    </div>
    <div class="know-judge-prompt">
      <p>${q.judge}, is this right?</p>
      <div class="know-verdict-btns">
        <button class="know-verdict-btn know-verdict-yes" onclick="judgeKnow(true)">✓ Correct</button>
        <button class="know-verdict-btn know-verdict-no" onclick="judgeKnow(false)">✗ Wrong</button>
      </div>
    </div>`;
  } else {
    const icon = _knowState.verdict ? "🎉" : "😅";
    const msg  = _knowState.verdict
      ? `${q.judge} confirmed it — nice one, ${q.answerer}!`
      : `${q.judge} said no — come back tomorrow!`;
    html += `<div class="know-answer-display">
      <div class="know-answer-label">${q.answerer} said:</div>
      <div class="know-answer-text">"${_knowState.answer}"</div>
    </div>
    <div class="know-result ${_knowState.verdict ? "know-result--correct" : "know-result--wrong"}">${icon} ${msg}</div>`;
  }
  const qIdx = Math.abs(Math.floor((new Date()-new Date(2026,5,18))/(1000*60*60*24)))%knowQuestions.length;
  html += `<div class="know-footer">Question ${qIdx+1} of ${knowQuestions.length} · resets at midnight</div>`;
  el.innerHTML = html;
}

function submitKnowAnswer() {
  const input = document.getElementById("knowInput");
  if (!input || !input.value.trim()) return;
  const state = { dateKey: getTodayKey(), answer: input.value.trim(), verdict: null };
  fbSet("know", state);
}

function judgeKnow(correct) {
  const state = { ..._knowState, verdict: correct };
  fbSet("know", state);
}

function initKnow() {
  fbListen("know", data => renderKnow(data));
}

/* ---------- SNAKE & LADDERS ---------- */
const SNL_LADDERS = { 4:14, 9:31, 17:37, 20:42, 28:48, 40:59, 51:68, 63:81, 71:91, 88:98 };
const SNL_SNAKES  = { 16:6, 29:10, 35:22, 46:25, 53:33, 62:43, 76:58, 85:65, 93:73, 97:78 };
const SNL_TRIVIA_SQUARES = [7,13,24,38,47,55,64,72,83,96];
const SNL_EVENTS = {
  3:{type:"bonus",val:3,emoji:"🍀",label:"Lucky clover! +3"},
  8:{type:"miss",val:1,emoji:"😴",label:"Nap time! Miss a turn"},
  11:{type:"swap",val:0,emoji:"🔀",label:"Swap positions!"},
  15:{type:"bonus",val:2,emoji:"🌟",label:"Star square! +2"},
  19:{type:"miss",val:1,emoji:"🍕",label:"Pizza coma. Miss a turn"},
  22:{type:"bonus",val:4,emoji:"🎉",label:"Party square! +4"},
  26:{type:"back",val:3,emoji:"🌧️",label:"Rainy day. Go back 3"},
  30:{type:"roll2",val:0,emoji:"🎲",label:"Double roll! Roll again"},
  32:{type:"bonus",val:5,emoji:"✈️",label:"Upgrade! +5 spaces"},
  36:{type:"miss",val:1,emoji:"🚦",label:"Red light! Miss a turn"},
  39:{type:"swap",val:0,emoji:"🔁",label:"Switcheroo! Swap positions"},
  41:{type:"bonus",val:3,emoji:"☕",label:"Coffee boost! +3"},
  44:{type:"back",val:4,emoji:"🐢",label:"Slow down! Back 4"},
  49:{type:"roll2",val:0,emoji:"🌈",label:"Rainbow! Roll again"},
  50:{type:"bonus",val:5,emoji:"🏖️",label:"Halfway bonus! +5"},
  54:{type:"miss",val:1,emoji:"📚",label:"Study time! Miss a turn"},
  57:{type:"bonus",val:3,emoji:"🦋",label:"Butterfly effect! +3"},
  60:{type:"back",val:5,emoji:"🌀",label:"Turbulence! Back 5"},
  65:{type:"bonus",val:4,emoji:"🎸",label:"Rock star! +4"},
  67:{type:"swap",val:0,emoji:"🃏",label:"Wild card! Swap positions"},
  69:{type:"miss",val:1,emoji:"🎭",label:"Drama queen. Miss a turn"},
  74:{type:"bonus",val:3,emoji:"🌺",label:"Blossom! +3"},
  77:{type:"back",val:3,emoji:"👻",label:"Ghost square! Back 3"},
  80:{type:"roll2",val:0,emoji:"⚡",label:"Lightning! Roll again"},
  82:{type:"bonus",val:5,emoji:"🏆",label:"Champion! +5"},
  86:{type:"back",val:4,emoji:"🌊",label:"Wipeout! Back 4"},
  89:{type:"bonus",val:3,emoji:"🚀",label:"Rocket boost! +3"},
  92:{type:"miss",val:1,emoji:"🛁",label:"Bubble bath! Miss a turn"},
  95:{type:"swap",val:0,emoji:"🎪",label:"Circus swap! Trade positions"},
  99:{type:"back",val:5,emoji:"💫",label:"So close! Back 5"},
};

const SNL_TRIVIA = [
  {q:"What city does Rachdouda pick up Salmuta in?",         a:"Nairobi",     opts:["Cairo","Geneva","Nairobi","Tokyo"]},
  {q:"What sport does Rachdouda play competitively?",        a:"Volleyball",  opts:["Football","Tennis","Volleyball","Basketball"]},
  {q:"What lake is Evian-les-Bains on?",                    a:"Lake Geneva", opts:["Lake Como","Lake Zurich","Lake Geneva","Lake Annecy"]},
  {q:"What is the boat trip on the bucket list?",            a:"Dhow cruise", opts:["Felucca ride","Dhow cruise","Catamaran trip","Ferry ride"]},
  {q:"Which tournament comes after St Disdille?",            a:"Excenevex",   opts:["Geneva Open","Lausanne Cup","Excenevex","Montreux Finals"]},
  {q:"What ocean is Lamu on?",                               a:"Indian Ocean",opts:["Atlantic","Mediterranean","Indian Ocean","Red Sea"]},
  {q:"What day does the airport pickup happen?",             a:"14 August",   opts:["29 July","5 August","14 August","1 September"]},
  {q:"What city does Rachdouda fly from on 5 August?",       a:"Tokyo",       opts:["Geneva","Cairo","Nairobi","Tokyo"]},
  {q:"What is the XP goal to unlock Mission Complete?",      a:"500 XP",      opts:["200 XP","350 XP","500 XP","750 XP"]},
  {q:"What country did we visit together most recently?",    a:"Japan",       opts:["Morocco","Japan","Kenya","France"]},
];

const SNL_SQ = {};
Object.assign(SNL_SQ,{4:"📸",9:"🌙",17:"🏐",20:"💬",28:"☀️",40:"🗓️",51:"🎵",63:"🌅",71:"📞",88:"✅"});
Object.assign(SNL_SQ,{16:"🐍",29:"🐍",35:"🐍",46:"🐍",53:"🐍",62:"🐍",76:"🐍",85:"🐍",93:"🐍",97:"🐍"});
SNL_TRIVIA_SQUARES.forEach(s=>{SNL_SQ[s]="❓";});
Object.keys(SNL_EVENTS).forEach(s=>{SNL_SQ[+s]=SNL_EVENTS[+s].emoji;});
SNL_SQ[1]="🚀"; SNL_SQ[100]="❤️";

const SNL_COLS=10, SNL_ROWS=10;
let snlBoardCache=null, snlCellPx=56;
let _snlState = null;

function snlDefaultState() {
  return {rach:1,salm:1,turn:"rach",log:[],rolling:false,winner:null,pendingEvent:null,pendingTrivia:null,animating:false};
}

function snlSqToGrid(sq) {
  const idx=sq-1, row=Math.floor(idx/SNL_COLS);
  const col=(row%2===0)?(idx%SNL_COLS):(SNL_COLS-1-idx%SNL_COLS);
  return {col, drawRow:SNL_ROWS-1-row};
}
function snlCenter(sq,cs) {
  const {col,drawRow}=snlSqToGrid(sq);
  return {x:col*cs+cs/2, y:drawRow*cs+cs/2};
}

function snlBuildBoardCache(cs,dpr) {
  const px=cs*SNL_COLS;
  const oc=document.createElement("canvas");
  oc.width=px*dpr; oc.height=px*dpr;
  const ctx=oc.getContext("2d");
  ctx.scale(dpr,dpr);
  const PAL=["#fdf6ec","#fce8ef","#eaf2eb","#fdf3e3","#e8f4fd","#f3eafd","#fff8f0","#f0fdf4"];
  for(let sq=1;sq<=100;sq++){
    const{col,drawRow}=snlSqToGrid(sq);
    const x=col*cs,y=drawRow*cs;
    let bg=PAL[sq%PAL.length];
    if(SNL_LADDERS[sq]) bg="#c6f0ce";
    else if(SNL_SNAKES[sq]) bg="#fbd5d5";
    else if(SNL_TRIVIA_SQUARES.includes(sq)) bg="#e0d9fb";
    else if(SNL_EVENTS[sq]){const t=SNL_EVENTS[sq].type;bg=t==="bonus"||t==="roll2"?"#fff8d6":t==="miss"?"#fde8d8":t==="back"?"#ffd6e0":"#d6f0ff";}
    else if(sq===1) bg="#bbf7d0";
    else if(sq===100) bg="#fef08a";
    ctx.fillStyle=bg; ctx.fillRect(x,y,cs,cs);
    if((Math.floor((sq-1)/10)+((sq-1)%10))%2===1){ctx.fillStyle="rgba(0,0,0,0.025)";ctx.fillRect(x,y,cs,cs);}
    ctx.strokeStyle="rgba(0,0,0,0.10)";ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,cs-1,cs-1);
    ctx.fillStyle="rgba(0,0,0,0.4)";ctx.font=`600 ${Math.max(9,Math.floor(cs*.17))}px DM Sans,sans-serif`;
    ctx.textAlign="left";ctx.textBaseline="top";ctx.fillText(String(sq),x+4,y+3);
    if(SNL_SQ[sq]){ctx.font=`${Math.floor(cs*.36)}px serif`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(SNL_SQ[sq],x+cs/2,y+cs/2+4);}
  }
  /* Ladders */
  Object.entries(SNL_LADDERS).forEach(([f,t])=>{
    const a=snlCenter(+f,cs),b=snlCenter(+t,cs);
    const ang=Math.atan2(b.y-a.y,b.x-a.x),perp=ang+Math.PI/2,w=cs*.08;
    [[1],[-1]].forEach(([s])=>{
      ctx.beginPath();ctx.moveTo(a.x+Math.cos(perp)*w*s,a.y+Math.sin(perp)*w*s);
      ctx.lineTo(b.x+Math.cos(perp)*w*s,b.y+Math.sin(perp)*w*s);
      ctx.strokeStyle="#2d6b33";ctx.lineWidth=Math.max(2,cs*.04);ctx.stroke();
    });
    const steps=Math.max(3,Math.floor(Math.hypot(b.x-a.x,b.y-a.y)/(cs*.6)));
    for(let i=1;i<steps;i++){const tt=i/steps,rx=a.x+(b.x-a.x)*tt,ry=a.y+(b.y-a.y)*tt;
      ctx.beginPath();ctx.moveTo(rx+Math.cos(perp)*w*1.2,ry+Math.sin(perp)*w*1.2);
      ctx.lineTo(rx-Math.cos(perp)*w*1.2,ry-Math.sin(perp)*w*1.2);
      ctx.strokeStyle="#4ade80";ctx.lineWidth=Math.max(1.5,cs*.025);ctx.stroke();}
  });
  /* Snakes */
  Object.entries(SNL_SNAKES).forEach(([f,t])=>{
    const a=snlCenter(+f,cs),b=snlCenter(+t,cs);
    const dx=b.x-a.x,dy=b.y-a.y;
    const cx1=a.x+dx*.3+dy*.3,cy1=a.y+dy*.3-dx*.3,cx2=a.x+dx*.7-dy*.3,cy2=a.y+dy*.7+dx*.3;
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.bezierCurveTo(cx1,cy1,cx2,cy2,b.x,b.y);
    ctx.strokeStyle="#ef4444";ctx.lineWidth=Math.max(3,cs*.055);ctx.lineCap="round";ctx.stroke();
    ctx.font=`${Math.floor(cs*.38)}px serif`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("🐍",a.x,a.y);
    ctx.beginPath();ctx.arc(b.x,b.y,cs*.08,0,Math.PI*2);ctx.fillStyle="#ef4444";ctx.fill();
  });
  snlBoardCache={canvas:oc,cs,dpr};
  return oc;
}

function snlDrawFrame(state, overridePos) {
  const canvas=document.getElementById("snlCanvas");
  if(!canvas) return;
  const wrap=canvas.parentElement;
  const wrapPx=wrap?Math.min(wrap.clientWidth,620):560;
  const cs=Math.floor(wrapPx/SNL_COLS);
  const dpr=Math.min(window.devicePixelRatio||1,3);
  const boardPx=cs*SNL_COLS;
  if(!snlBoardCache||snlBoardCache.cs!==cs||snlBoardCache.dpr!==dpr) snlBuildBoardCache(cs,dpr);
  canvas.width=boardPx*dpr; canvas.height=boardPx*dpr;
  canvas.style.width=boardPx+"px"; canvas.style.height=boardPx+"px";
  const ctx=canvas.getContext("2d");
  ctx.scale(dpr,dpr);
  ctx.drawImage(snlBoardCache.canvas,0,0,boardPx,boardPx);
  const positions={rach:state.rach||1,salm:state.salm||1,...overridePos};
  [["rach","👦","#c4446c"],["salm","👧","#e8a040"]].forEach(([who,emoji,color])=>{
    const sq=positions[who],ctr=snlCenter(sq,cs),off=who==="rach"?-cs*.16:cs*.16;
    ctx.beginPath();ctx.arc(ctr.x+off,ctr.y,cs*.28,0,Math.PI*2);
    ctx.fillStyle=color+"33";ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();
    ctx.font=`${Math.floor(cs*.42)}px serif`;ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.shadowColor="rgba(0,0,0,0.5)";ctx.shadowBlur=8;ctx.fillText(emoji,ctr.x+off,ctr.y);ctx.shadowBlur=0;
  });
  snlCellPx=cs;
}

function snlAnimateMove(state, who, path, onDone) {
  let step=0;
  const over={};
  function tick(){
    if(step>=path.length){onDone();return;}
    over[who]=path[step++];
    snlDrawFrame(state,over);
    setTimeout(tick,180);
  }
  tick();
}

const DICE_FACES=["⚀","⚁","⚂","⚃","⚄","⚅"];

function snlRoll() {
  if(!_snlState) return;
  const state=JSON.parse(JSON.stringify(_snlState));
  if(state.rolling||state.winner||state.pendingTrivia||state.pendingEvent||state.animating) return;
  state.rolling=true; state.animating=true;
  fbSet("snl",state);
  const btn=document.getElementById("snlRollBtn");
  if(btn) btn.disabled=true;
  const diceEl=document.getElementById("snlDice");
  let ticks=0;
  const iv=setInterval(()=>{
    if(diceEl) diceEl.textContent=DICE_FACES[Math.floor(Math.random()*6)];
    if(++ticks>14){
      clearInterval(iv);
      const roll=Math.floor(Math.random()*6)+1;
      if(diceEl){diceEl.textContent=DICE_FACES[roll-1];diceEl.style.transform="scale(1.3)";setTimeout(()=>{diceEl.style.transform="scale(1)";},200);}
      snlApplyRoll(roll,state);
    }
  },70);
}

function snlBuildPath(from,to){
  const path=[];
  if(to>from) for(let s=from+1;s<=to;s++) path.push(s);
  else        for(let s=from-1;s>=to;s--) path.push(s);
  return path;
}

function snlApplyRoll(roll,state){
  const who=state.turn,name=who==="rach"?"Rachdouda":"Salmuta";
  const from=state[who]||1;
  let raw=from+roll;
  if(raw>100) raw=100-(raw-100);
  const path=snlBuildPath(from,raw);
  snlAnimateMove(state,who,path,()=>{
    state[who]=raw; state.rolling=false; state.animating=false;
    let logMsg=`${name} rolled ${roll} → sq ${raw}`;
    if(SNL_LADDERS[raw]){
      const dest=SNL_LADDERS[raw]; logMsg+=` 🪜 Ladder → ${dest}!`; state[who]=dest;
      state.log=[logMsg,...(state.log||[])].slice(0,8); fbSet("snl",state);
      snlDrawFrame(state,{});
      snlAnimateMove(state,who,snlBuildPath(raw,dest),()=>{
        state.turn=who==="rach"?"salm":"rach"; fbSet("snl",state);
      });
      return;
    } else if(SNL_SNAKES[raw]){
      const dest=SNL_SNAKES[raw]; logMsg+=` 🐍 Snake → ${dest}!`; state[who]=dest;
      state.log=[logMsg,...(state.log||[])].slice(0,8); fbSet("snl",state);
      snlDrawFrame(state,{});
      snlAnimateMove(state,who,snlBuildPath(raw,dest),()=>{
        state.turn=who==="rach"?"salm":"rach"; fbSet("snl",state);
      });
      return;
    } else if(SNL_TRIVIA_SQUARES.includes(raw)){
      logMsg+=` ❓ Trivia!`; state.pendingTrivia={who,pos:raw};
    } else if(SNL_EVENTS[raw]){
      const ev=SNL_EVENTS[raw]; logMsg+=` ${ev.emoji} ${ev.label}`; state.pendingEvent={who,pos:raw,ev};
    }
    if(raw>=100&&!state.pendingTrivia&&!state.pendingEvent) state.winner=who;
    state.log=[logMsg,...(state.log||[])].slice(0,8);
    fbSet("snl",state);
  });
}

function snlResolveEvent(state){
  const{who,ev}=state.pendingEvent;
  const other=who==="rach"?"salm":"rach";
  const name=who==="rach"?"Rachdouda":"Salmuta";
  const otherName=other==="rach"?"Rachdouda":"Salmuta";
  let logMsg=`${ev.emoji} ${ev.label}`;
  state.pendingEvent=null;
  switch(ev.type){
    case"bonus":{
      const from=state[who],to=Math.min(state[who]+ev.val,100),path=snlBuildPath(from,to);
      state[who]=to; if(to>=100) state.winner=who;
      state.log=[logMsg,...(state.log||[])].slice(0,8); fbSet("snl",state);
      snlAnimateMove(state,who,path,()=>{
        if(!state.winner){state.turn=other;fbSet("snl",state);}
        else setTimeout(()=>snlShowWinner(state),500);
      }); return;
    }
    case"back":{
      const from=state[who],to=Math.max(state[who]-ev.val,1),path=snlBuildPath(from,to);
      state[who]=to; state.log=[logMsg,...(state.log||[])].slice(0,8); fbSet("snl",state);
      snlAnimateMove(state,who,path,()=>{state.turn=other;fbSet("snl",state);}); return;
    }
    case"miss": logMsg=`${name} misses a turn! ${ev.emoji}`; state.turn=other; break;
    case"swap":{const tmp=state[who];state[who]=state[other];state[other]=tmp;logMsg=`${name} & ${otherName} swap! ${ev.emoji}`;state.turn=other;break;}
    case"roll2": logMsg=`${name} rolls again! ${ev.emoji}`; break;
  }
  state.log=[logMsg,...(state.log||[])].slice(0,8);
  fbSet("snl",state);
}

function snlShowTrivia(state){
  const t=state.pendingTrivia;
  const idx=SNL_TRIVIA_SQUARES.indexOf(t.pos);
  const q=SNL_TRIVIA[idx%SNL_TRIVIA.length];
  const who=t.who==="rach"?"Rachdouda":"Salmuta";
  const modal=document.getElementById("snlTriviaModal");
  const qEl=document.getElementById("snlTriviaQ");
  const optsEl=document.getElementById("snlTriviaOpts");
  const fbEl=document.getElementById("snlTriviaFeedback");
  if(!modal) return;
  qEl.textContent=`${who}, answer correctly to stay and roll again!\n${q.q}`;
  fbEl.textContent=""; optsEl.innerHTML="";
  [...q.opts].sort(()=>Math.random()-.5).forEach(opt=>{
    const btn=document.createElement("button");
    btn.className="mg-option"; btn.textContent=opt;
    btn.onclick=()=>snlAnswerTrivia(opt,q.a,state);
    optsEl.appendChild(btn);
  });
  modal.classList.remove("hidden");
}

function snlAnswerTrivia(chosen,correct,state){
  const isOk=chosen===correct;
  const fbEl=document.getElementById("snlTriviaFeedback");
  document.querySelectorAll("#snlTriviaOpts .mg-option").forEach(b=>{
    b.disabled=true;
    if(b.textContent===correct) b.classList.add("mg-correct");
    else if(b.textContent===chosen&&!isOk) b.classList.add("mg-wrong");
  });
  if(fbEl){fbEl.textContent=isOk?"✓ Correct! Roll again! 🎉":`✗ Wrong — ${correct}. Turn passes.`;
    fbEl.className="snl-trivia-feedback "+(isOk?"mg-fb-correct":"mg-fb-wrong");}
  setTimeout(()=>{
    document.getElementById("snlTriviaModal")?.classList.add("hidden");
    const s=JSON.parse(JSON.stringify(_snlState));
    const who=s.pendingTrivia.who;
    s.pendingTrivia=null;
    if(!isOk){s.turn=who==="rach"?"salm":"rach";s.log=["Trivia wrong — turn passes.",...(s.log||[])].slice(0,8);}
    else{s.log=["Trivia correct — roll again! 🎉",...(s.log||[])].slice(0,8);}
    if(s[who]>=100) s.winner=who;
    fbSet("snl",s);
    if(s.winner) setTimeout(()=>snlShowWinner(s),400);
  },1800);
}

function snlShowWinner(state){
  const modal=document.getElementById("snlWinnerModal");
  const title=document.getElementById("snlWinnerTitle");
  if(!modal||!title) return;
  title.textContent=(state.winner==="rach"?"Rachdouda":"Salmuta")+" wins! 🎉";
  modal.classList.remove("hidden");
  launchConfetti();
}

function snlRender(state){
  _snlState=state;
  snlDrawFrame(state,{});
  const pr=document.getElementById("snlPosRach");
  const ps=document.getElementById("snlPosSalm");
  if(pr) pr.textContent=state.rach>=100?"WINNER 🏆":`Square ${state.rach}`;
  if(ps) ps.textContent=state.salm>=100?"WINNER 🏆":`Square ${state.salm}`;
  const turnEl=document.getElementById("snlTurn");
  const rollBtn=document.getElementById("snlRollBtn");
  const locked=state.winner||state.pendingTrivia||state.pendingEvent||state.rolling||state.animating;
  if(turnEl){
    if(state.winner) turnEl.textContent="Game over!";
    else if(state.pendingTrivia) turnEl.textContent="Answering trivia...";
    else if(state.pendingEvent){
      const ev=state.pendingEvent.ev;
      if(ev.type==="roll2") turnEl.textContent="Roll again!";
      else turnEl.textContent="Event!";
    }
    else turnEl.textContent=(state.turn==="rach"?"Rachdouda":"Salmuta")+"'s turn";
  }
  if(rollBtn) rollBtn.disabled=!!locked;
  const logEl=document.getElementById("snlLog");
  if(logEl) logEl.innerHTML=(state.log||[]).map(l=>`<div class="snl-log-entry">${l}</div>`).join("");
  document.getElementById("snlPlayerRach")?.classList.toggle("snl-player--active",state.turn==="rach"&&!state.winner);
  document.getElementById("snlPlayerSalm")?.classList.toggle("snl-player--active",state.turn==="salm"&&!state.winner);
  /* Show pending modals */
  if(state.pendingTrivia) snlShowTrivia(state);
  if(state.pendingEvent)  setTimeout(()=>snlResolveEvent(JSON.parse(JSON.stringify(state))),400);
  if(state.winner)        setTimeout(()=>snlShowWinner(state),600);
}

function snlReset(){
  document.getElementById("snlWinnerModal")?.classList.add("hidden");
  document.getElementById("snlTriviaModal")?.classList.add("hidden");
  snlBoardCache=null;
  fbSet("snl", snlDefaultState());
}

function initSnl(){
  fbListen("snl", data => {
    snlRender(data || snlDefaultState());
  });
  window.addEventListener("resize",()=>{snlBoardCache=null; if(_snlState) snlRender(_snlState);});
}

/* ---------- REUNION CONFETTI ---------- */
function checkReunion(){
  if(today>=reunionDate){
    document.getElementById("reunionOverlay")?.classList.remove("hidden");
    launchConfetti();
  }
}

function launchConfetti(){
  const canvas=document.getElementById("confettiCanvas");
  if(!canvas) return;
  canvas.style.display="block";
  canvas.width=window.innerWidth; canvas.height=window.innerHeight;
  const ctx=canvas.getContext("2d");
  const colors=["#c4446c","#e8a040","#6b8f71","#fce8ef","#fdf3e3","#fde68a"];
  const pieces=Array.from({length:160},()=>({
    x:Math.random()*canvas.width,y:Math.random()*-canvas.height,
    size:5+Math.random()*7,speed:2+Math.random()*3,drift:Math.random()*2-1,
    color:colors[Math.floor(Math.random()*colors.length)],spin:Math.random()*Math.PI
  }));
  let frame=0;
  function tick(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    pieces.forEach(p=>{
      p.y+=p.speed;p.x+=p.drift;p.spin+=0.04;
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.spin);
      ctx.fillStyle=p.color;ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size);
      ctx.restore();if(p.y>canvas.height)p.y=-10;
    });
    if(++frame<480) requestAnimationFrame(tick); else canvas.style.display="none";
  }
  requestAnimationFrame(tick);
}

/* ---------- INIT ---------- */
document.addEventListener("DOMContentLoaded", () => {
  updateCountdown();
  initBucket();
  initXP();
  initRace();
  initWheels();
  initKnow();
  initSnl();
  checkReunion();
});

window.addEventListener("resize",()=>{
  const c=document.getElementById("confettiCanvas");
  if(c&&c.style.display==="block"){c.width=window.innerWidth;c.height=window.innerHeight;}
});

/* ---------- EXPOSE TO GLOBAL BRIDGE (required for ES module + onclick) ---------- */
window._bridge.nudgeDonkey    = nudgeDonkey;
window._bridge.addXP          = addXP;
window._bridge.spinWheel      = spinWheel;
window._bridge.submitKnowAnswer = submitKnowAnswer;
window._bridge.judgeKnow      = judgeKnow;
window._bridge.snlRoll        = snlRoll;
window._bridge.snlReset       = snlReset;
window._bridge.snlAnswerTrivia = snlAnswerTrivia;
window._bridge.closeWinPopup  = closeWinPopup;
