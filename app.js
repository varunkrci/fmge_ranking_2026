const queryInput = document.getElementById("queryInput");
const searchBtn = document.getElementById("searchBtn");
const statusText = document.getElementById("statusText");
const resultCard = document.getElementById("resultCard");
const rollOut = document.getElementById("rollOut");
const appOut = document.getElementById("appOut");
const scoreOut = document.getElementById("scoreOut");
const resultOut = document.getElementById("resultOut");
const rankOut = document.getElementById("rankOut");
const remarkOut = document.getElementById("remarkOut");

let recordsByRoll = null;
let appIdToRoll = null;
let dataLoadPromise = null;
const activeEffects = [];

function setStatus(message, type = "info") {
  statusText.textContent = message;
  statusText.classList.remove("error", "success");
  if (type === "error") statusText.classList.add("error");
  if (type === "success") statusText.classList.add("success");
}

function normalizeQuery(value) {
  return value.trim().toUpperCase();
}

function isRollNumber(value) {
  return /^[0-9]{6,}$/.test(value);
}

function formatNumber(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return "NA";
  return num.toLocaleString("en-IN");
}

function addEffectCleanup(cleanupFn) {
  activeEffects.push(cleanupFn);
}

function clearEffects() {
  while (activeEffects.length) {
    const cleanupFn = activeEffects.pop();
    try {
      cleanupFn();
    } catch {}
  }
}

function createEffectLayer() {
  const layer = document.createElement("div");
  layer.style.position = "fixed";
  layer.style.inset = "0";
  layer.style.pointerEvents = "none";
  layer.style.overflow = "hidden";
  layer.style.zIndex = "9999";
  document.body.appendChild(layer);
  return layer;
}

function startPassEffect() {
  clearEffects();
  const layer = createEffectLayer();
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    layer.remove();
    return;
  }

  layer.appendChild(canvas);

  const colors = [
    "#22c55e",
    "#38bdf8",
    "#facc15",
    "#f97316",
    "#e879f9",
    "#fb7185",
  ];
  const particles = [];
  let rafId = 0;
  let closed = false;

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawnPiece(fromTopOnly = false) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    particles.push({
      x: Math.random() * width,
      y: fromTopOnly ? -20 : Math.random() * height * 0.25 - height * 0.25,
      vx: (Math.random() - 0.5) * 7,
      vy: 2 + Math.random() * 3.8,
      size: 5 + Math.random() * 7,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.25,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }

  function cleanup() {
    if (closed) return;
    closed = true;
    cancelAnimationFrame(rafId);
    window.removeEventListener("resize", resizeCanvas);
    layer.remove();
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  for (let i = 0; i < 180; i += 1) spawnPiece(false);
  const endAt = performance.now() + 2600;
  let lastTs = performance.now();

  function drawFrame(ts) {
    if (closed) return;
    const dt = Math.min((ts - lastTs) / 16.67, 2);
    lastTs = ts;
    const width = window.innerWidth;
    const height = window.innerHeight;
    ctx.clearRect(0, 0, width, height);

    if (ts < endAt) {
      for (let i = 0; i < 7; i += 1) spawnPiece(true);
    }

    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 0.08 * dt;
      p.vx *= 0.995;
      p.angle += p.spin * dt;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
      ctx.restore();

      if (p.y > height + 80 || p.x < -100 || p.x > width + 100) {
        particles.splice(i, 1);
      }
    }

    if (ts < endAt || particles.length) {
      rafId = requestAnimationFrame(drawFrame);
    } else {
      cleanup();
    }
  }

  addEffectCleanup(cleanup);
  rafId = requestAnimationFrame(drawFrame);
}

function startFailEffect() {
  clearEffects();
  const layer = createEffectLayer();
  const emojis = ["😭", "😢", "🥲", "💧"];
  let intervalId = 0;
  let timeoutId = 0;
  let closed = false;

  function spawnEmoji() {
    const drop = document.createElement("span");
    drop.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    drop.style.position = "absolute";
    drop.style.left = `${Math.random() * 100}vw`;
    drop.style.top = "-12vh";
    drop.style.fontSize = `${20 + Math.random() * 18}px`;
    drop.style.filter = "drop-shadow(0 2px 4px rgba(0,0,0,0.35))";
    drop.style.opacity = `${0.82 + Math.random() * 0.18}`;
    layer.appendChild(drop);

    const drift = (Math.random() - 0.5) * 160;
    const rotate = (Math.random() - 0.5) * 80;
    const duration = 1700 + Math.random() * 1500;
    const anim = drop.animate(
      [
        { transform: "translate(0px, -5vh) rotate(0deg)" },
        { transform: `translate(${drift}px, 112vh) rotate(${rotate}deg)` },
      ],
      {
        duration,
        easing: "linear",
        fill: "forwards",
      },
    );
    anim.onfinish = () => drop.remove();
  }

  function cleanup() {
    if (closed) return;
    closed = true;
    window.clearInterval(intervalId);
    window.clearTimeout(timeoutId);
    layer.remove();
  }

  for (let i = 0; i < 24; i += 1) spawnEmoji();
  intervalId = window.setInterval(() => {
    for (let i = 0; i < 4; i += 1) spawnEmoji();
  }, 180);

  timeoutId = window.setTimeout(() => {
    cleanup();
  }, 3000);

  addEffectCleanup(cleanup);
}

async function loadData() {
  if (recordsByRoll) return;

  if (!dataLoadPromise) {
    setStatus("Loading result data. Please wait...");
    dataLoadPromise = fetch("./results_fmge.json", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Could not load JSON (HTTP ${response.status})`);
        }
        return response.json();
      })
      .then((jsonData) => {
        recordsByRoll = jsonData;
        appIdToRoll = new Map();

        for (const [roll, record] of Object.entries(recordsByRoll)) {
          const appId = String(record.application_id || "").toUpperCase();
          if (appId && !appIdToRoll.has(appId)) {
            appIdToRoll.set(appId, roll);
          }
        }
      });
  }

  await dataLoadPromise;
  setStatus(
    `Loaded ${formatNumber(Object.keys(recordsByRoll).length)} records.`,
    "success",
  );
}

function getRemark(record) {
  const score = Number(record.total_score || 0);
  const rank = Number(record.rank || 0);
  const result = String(record.result || "").toUpperCase();
  const isPass = result === "PASS";

  if (score < 50) {
    if (isPass) {
      return "Under 50 and still PASS? That is either data magic or pure luck.";
    }
    return "Below 50. You had way too much fun before exams. Consider another career track.";
  }

  if (isPass) {
    if (rank >= 1 && rank <= 100) {
      return "Touch some grass man!";
    }
    if (score >= 150 && score < 160) {
      return "Barely passed! I hope I never get a consultation from you.";
    }
    if (rank <= 1000) {
      return "Great rank. Family WhatsApp group is probably on fire.";
    }
    if (rank <= 10000) {
      return "You passed. Not cinematic, but mission accomplished.";
    }
    return "Pass is pass. No one asks rank after your first duty shift.";
  }

  if (score >= 145) {
    return "So close and still FAIL. One more serious revision cycle.";
  }
  if (score >= 100) {
    return "FAIL. Good try, but the syllabus still had the last laugh.";
  }
  return "FAIL. This attempt was vibes over revision.";
}

function lookupRecord(query) {
  if (!recordsByRoll) return null;

  if (isRollNumber(query) && recordsByRoll[query]) {
    return { roll: query, record: recordsByRoll[query] };
  }

  const rollFromApp = appIdToRoll.get(query);
  if (rollFromApp && recordsByRoll[rollFromApp]) {
    return { roll: rollFromApp, record: recordsByRoll[rollFromApp] };
  }

  if (recordsByRoll[query]) {
    return { roll: query, record: recordsByRoll[query] };
  }

  return null;
}

function renderRecord(roll, record) {
  const result = String(record.result || "").toUpperCase();

  rollOut.textContent = roll;
  appOut.textContent = String(record.application_id || "NA");
  scoreOut.textContent = formatNumber(record.total_score);
  resultOut.textContent = result || "NA";
  rankOut.textContent = formatNumber(record.rank);
  remarkOut.textContent = getRemark(record);

  resultOut.classList.remove("pass", "fail");
  if (result === "PASS") resultOut.classList.add("pass");
  if (result === "FAIL") resultOut.classList.add("fail");

  resultCard.classList.remove("hidden");
  if (result === "PASS") startPassEffect();
  else if (result === "FAIL") startFailEffect();
  else clearEffects();
}

function hideRecord() {
  resultCard.classList.add("hidden");
  clearEffects();
}

async function handleSearch() {
  const query = normalizeQuery(queryInput.value);
  if (!query) {
    hideRecord();
    setStatus("Enter roll number or application ID.", "error");
    return;
  }

  try {
    await loadData();
    const hit = lookupRecord(query);

    if (!hit) {
      hideRecord();
      setStatus("No record found. Check input and try again.", "error");
      return;
    }

    renderRecord(hit.roll, hit.record);
    setStatus("Record found.", "success");
  } catch (error) {
    hideRecord();
    const message =
      error instanceof Error ? error.message : "Something went wrong while loading data.";
    setStatus(message, "error");
  }
}

searchBtn.addEventListener("click", handleSearch);
queryInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    handleSearch();
  }
});
