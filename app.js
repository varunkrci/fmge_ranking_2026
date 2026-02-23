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
}

function hideRecord() {
  resultCard.classList.add("hidden");
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
