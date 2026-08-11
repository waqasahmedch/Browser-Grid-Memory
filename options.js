const RECORD_PREFIX = "record:";
const recordsEl = document.getElementById("records");
const emptyEl = document.getElementById("empty");
const searchEl = document.getElementById("search");
const countEl = document.getElementById("count");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");
const clearBtn = document.getElementById("clearBtn");

let allRecords = [];

function formatDate(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}

function createRecordCard(key, record) {
  const card = document.createElement("article");
  card.className = "record";

  const body = document.createElement("div");
  const title = document.createElement("div");
  title.className = "record-title";
  title.textContent = record.title || "Untitled page";

  const url = document.createElement("div");
  url.className = "record-url";
  url.textContent = record.url || key.slice(RECORD_PREFIX.length);

  body.append(title, url);

  if (record.note) {
    const note = document.createElement("div");
    note.className = "record-note";
    note.textContent = record.note;
    body.appendChild(note);
  }

  const meta = document.createElement("div");
  meta.className = "record-meta";
  meta.textContent = `Visits: ${record.visitCount || 1}\nFirst: ${formatDate(record.firstVisited)}\nLast: ${formatDate(record.lastVisited)}`;
  meta.style.whiteSpace = "pre-line";

  const actions = document.createElement("div");
  actions.className = "record-actions";
  const del = document.createElement("button");
  del.className = "delete-btn";
  del.textContent = "Delete";
  del.addEventListener("click", async () => {
    await chrome.storage.local.remove(key);
    await loadRecords();
  });
  actions.appendChild(del);

  card.append(body, meta, actions);
  return card;
}

function render() {
  const term = searchEl.value.trim().toLowerCase();
  const filtered = allRecords.filter(({ record }) => {
    if (!term) return true;
    return [record.url, record.title, record.note]
      .filter(Boolean)
      .some(value => value.toLowerCase().includes(term));
  });

  recordsEl.replaceChildren(...filtered.map(({ key, record }) => createRecordCard(key, record)));
  emptyEl.classList.toggle("hidden", filtered.length !== 0);
  countEl.textContent = `${filtered.length} of ${allRecords.length}`;
}

async function loadRecords() {
  const stored = await chrome.storage.local.get(null);
  allRecords = Object.entries(stored)
    .filter(([key]) => key.startsWith(RECORD_PREFIX))
    .map(([key, record]) => ({ key, record }))
    .sort((a, b) => String(b.record.lastVisited || "").localeCompare(String(a.record.lastVisited || "")));
  render();
}

searchEl.addEventListener("input", render);

exportBtn.addEventListener("click", async () => {
  const stored = await chrome.storage.local.get(null);
  const exported = Object.fromEntries(Object.entries(stored).filter(([key]) => key.startsWith(RECORD_PREFIX)));
  const blob = new Blob([JSON.stringify(exported, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `grid-memory-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

importFile.addEventListener("change", async () => {
  const file = importFile.files?.[0];
  if (!file) return;

  try {
    const parsed = JSON.parse(await file.text());
    const safe = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (!key.startsWith(RECORD_PREFIX) || !value || typeof value !== "object") continue;
      safe[key] = value;
    }
    await chrome.storage.local.set(safe);
    await loadRecords();
  } catch (error) {
    alert(`Import failed: ${error.message}`);
  } finally {
    importFile.value = "";
  }
});

clearBtn.addEventListener("click", async () => {
  if (!confirm("Reset all Grid Memory data?\n\nThis permanently deletes all notes, visit history, timestamps and visit counters. Site permissions are not changed.")) return;
  const stored = await chrome.storage.local.get(null);
  const keys = Object.keys(stored).filter(key => key.startsWith(RECORD_PREFIX));
  await chrome.storage.local.remove(keys);
  await loadRecords();
});

loadRecords().catch(console.error);
