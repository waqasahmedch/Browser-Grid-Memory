const RECORD_PREFIX = "record:";

const ui = {
  site: document.getElementById("site"),
  statusBadge: document.getElementById("statusBadge"),
  unsupported: document.getElementById("unsupported"),
  disabledPanel: document.getElementById("disabledPanel"),
  enabledPanel: document.getElementById("enabledPanel"),
  enableBtn: document.getElementById("enableBtn"),
  disableBtn: document.getElementById("disableBtn"),
  saveBtn: document.getElementById("saveBtn"),
  manageBtn: document.getElementById("manageBtn"),
  resetCurrentBtn: document.getElementById("resetCurrentBtn"),
  resetBtn: document.getElementById("resetBtn"),
  note: document.getElementById("note"),
  visitCount: document.getElementById("visitCount"),
  lastVisited: document.getElementById("lastVisited"),
  saveStatus: document.getElementById("saveStatus")
};

let activeTab = null;
let pageUrl = null;
let originPattern = null;
let scriptId = null;

function canonicalize(rawUrl) {
  const url = new URL(rawUrl);
  url.hash = "";
  return url.href;
}

function recordKey(url) {
  return `${RECORD_PREFIX}${url}`;
}

function patternForUrl(rawUrl) {
  const url = new URL(rawUrl);
  if (!/^https?:$/.test(url.protocol)) return null;
  return `${url.protocol}//${url.hostname}/*`;
}

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function idForPattern(pattern) {
  return `grid_memory_${hashString(pattern)}`;
}

function formatShortDate(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function isEnabled() {
  return chrome.permissions.contains({ origins: [originPattern] });
}

async function ensureRegistered() {
  const registered = await chrome.scripting.getRegisteredContentScripts({ ids: [scriptId] });
  if (registered.length) return;

  await chrome.scripting.registerContentScripts([{
    id: scriptId,
    matches: [originPattern],
    js: ["content.js"],
    css: ["content.css"],
    runAt: "document_idle",
    persistAcrossSessions: true
  }]);
}

async function loadRecord() {
  const key = recordKey(pageUrl);
  const stored = await chrome.storage.local.get(key);
  const record = stored[key] || {};
  ui.note.value = record.note || "";
  ui.visitCount.textContent = String(record.visitCount || 0);
  ui.lastVisited.textContent = formatShortDate(record.lastVisited);
}



async function resetCurrentRecord() {
  if (!pageUrl) return;
  await chrome.storage.local.remove(recordKey(pageUrl));
}

async function resetAllRecords() {
  const stored = await chrome.storage.local.get(null);
  const keys = Object.keys(stored).filter(key => key.startsWith(RECORD_PREFIX));
  if (keys.length) {
    await chrome.storage.local.remove(keys);
  }
}

function renderEnabled(enabled) {
  ui.disabledPanel.classList.toggle("hidden", enabled);
  ui.enabledPanel.classList.toggle("hidden", !enabled);
  ui.statusBadge.textContent = enabled ? "Enabled" : "Off";
  ui.statusBadge.classList.toggle("on", enabled);
}

async function init() {
  activeTab = await getActiveTab();
  if (!activeTab?.url) {
    ui.unsupported.classList.remove("hidden");
    return;
  }

  let parsed;
  try {
    parsed = new URL(activeTab.url);
  } catch {
    ui.unsupported.classList.remove("hidden");
    return;
  }

  originPattern = patternForUrl(activeTab.url);
  if (!originPattern) {
    ui.site.textContent = parsed.protocol;
    ui.unsupported.classList.remove("hidden");
    return;
  }

  pageUrl = canonicalize(activeTab.url);
  scriptId = idForPattern(originPattern);
  ui.site.textContent = parsed.hostname;

  const enabled = await isEnabled();
  renderEnabled(enabled);
  if (enabled) {
    await ensureRegistered();
    await loadRecord();
  }
}

ui.enableBtn.addEventListener("click", async () => {
  ui.enableBtn.disabled = true;
  try {
    const granted = await chrome.permissions.request({ origins: [originPattern] });
    if (!granted) return;

    await ensureRegistered();
    await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      files: ["content.js"]
    });
    await chrome.scripting.insertCSS({
      target: { tabId: activeTab.id },
      files: ["content.css"]
    });

    renderEnabled(true);
    setTimeout(loadRecord, 150);
  } finally {
    ui.enableBtn.disabled = false;
  }
});

ui.saveBtn.addEventListener("click", async () => {
  const key = recordKey(pageUrl);
  const stored = await chrome.storage.local.get(key);
  const now = new Date().toISOString();
  const previous = stored[key] || {};

  const record = {
    url: pageUrl,
    title: previous.title || activeTab.title || "",
    firstVisited: previous.firstVisited || now,
    lastVisited: previous.lastVisited || now,
    visitCount: previous.visitCount || 1,
    note: ui.note.value.trim()
  };

  await chrome.storage.local.set({ [key]: record });
  ui.saveStatus.textContent = "Saved locally.";
  setTimeout(() => { ui.saveStatus.textContent = ""; }, 1200);
  await loadRecord();
});

ui.disableBtn.addEventListener("click", async () => {
  try {
    await chrome.scripting.unregisterContentScripts({ ids: [scriptId] });
  } catch {
    // Ignore if already unregistered.
  }
  await chrome.permissions.remove({ origins: [originPattern] });
  renderEnabled(false);
});

ui.manageBtn.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});


ui.resetCurrentBtn.addEventListener("click", async () => {
  const confirmed = confirm(
    "Reset data for this URL?\n\nThis will permanently delete the note, visit history, timestamps and visit counter only for the current page/record."
  );
  if (!confirmed) return;

  ui.resetCurrentBtn.disabled = true;
  try {
    await resetCurrentRecord();
    ui.note.value = "";
    ui.visitCount.textContent = "0";
    ui.lastVisited.textContent = "—";
    ui.saveStatus.textContent = "Current URL data has been reset.";
    setTimeout(() => { ui.saveStatus.textContent = ""; }, 2500);
  } finally {
    ui.resetCurrentBtn.disabled = false;
  }
});

ui.resetBtn.addEventListener("click", async () => {
  const confirmed = confirm(
    "Reset all Grid Memory data?\n\nThis will permanently delete all notes, visit history, timestamps and visit counters stored by this extension. The extension will remain enabled for this site."
  );
  if (!confirmed) return;

  ui.resetBtn.disabled = true;
  try {
    await resetAllRecords();
    ui.note.value = "";
    ui.visitCount.textContent = "0";
    ui.lastVisited.textContent = "—";
    ui.saveStatus.textContent = "All Grid Memory data has been reset.";
    setTimeout(() => { ui.saveStatus.textContent = ""; }, 2500);
  } finally {
    ui.resetBtn.disabled = false;
  }
});


init().catch(error => {
  console.error(error);
  ui.statusBadge.textContent = "Error";
});
