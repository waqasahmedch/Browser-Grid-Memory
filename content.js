(() => {
  if (globalThis.__GRID_MEMORY_CONTENT_LOADED__) return;
  globalThis.__GRID_MEMORY_CONTENT_LOADED__ = true;

  const RECORD_PREFIX = "record:";
  const TOOLTIP_ID = "grid-memory-tooltip";
  let currentPageKey = null;
  let scanTimer = null;

  function canonicalize(rawUrl) {
    try {
      const url = new URL(rawUrl, location.href);
      if (!/^https?:$/.test(url.protocol)) return null;
      url.hash = "";
      return url.href;
    } catch {
      return null;
    }
  }

  function keyForUrl(url) {
    return `${RECORD_PREFIX}${url}`;
  }

  async function recordVisit(rawUrl) {
    const url = canonicalize(rawUrl);
    if (!url) return;

    const key = keyForUrl(url);
    if (key === currentPageKey) return;
    currentPageKey = key;

    const now = new Date().toISOString();
    const stored = await chrome.storage.local.get(key);
    const previous = stored[key] || {};

    const record = {
      url,
      title: document.title || previous.title || "",
      firstVisited: previous.firstVisited || now,
      lastVisited: now,
      visitCount: Number(previous.visitCount || 0) + 1,
      note: previous.note || ""
    };

    await chrome.storage.local.set({ [key]: record });
    scheduleScan(0);
  }

  function collectCandidateLinks() {
    const all = Array.from(document.querySelectorAll("a[href]"));
    const rows = document.querySelectorAll("tr");
    const source = rows.length ? all.filter(a => a.closest("tr")) : all;

    return source
      .map(anchor => ({ anchor, url: canonicalize(anchor.href) }))
      .filter(item => item.url && new URL(item.url).origin === location.origin)
      .filter(item => item.url !== canonicalize(location.href));
  }

  function clearMarks() {
    document.querySelectorAll("a.grid-memory-visited-link").forEach(el => {
      el.classList.remove("grid-memory-visited-link");
      el.removeAttribute("data-grid-memory-key");
    });

    document.querySelectorAll("tr.grid-memory-visited-row").forEach(el => {
      el.classList.remove("grid-memory-visited-row");
    });
  }

  function formatDate(iso) {
    if (!iso) return "Unknown";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function getTooltip() {
    let tooltip = document.getElementById(TOOLTIP_ID);
    if (tooltip) return tooltip;

    tooltip = document.createElement("div");
    tooltip.id = TOOLTIP_ID;
    tooltip.setAttribute("role", "tooltip");
    document.documentElement.appendChild(tooltip);
    return tooltip;
  }

  function hideTooltip() {
    const tooltip = document.getElementById(TOOLTIP_ID);
    if (tooltip) tooltip.classList.remove("grid-memory-tooltip-visible");
  }

  function showTooltip(anchor, record) {
    const tooltip = getTooltip();
    tooltip.replaceChildren();

    const heading = document.createElement("div");
    heading.className = "grid-memory-tooltip-heading";
    heading.textContent = "✓ Previously visited";
    tooltip.appendChild(heading);

    const details = document.createElement("div");
    details.className = "grid-memory-tooltip-details";
    details.textContent = `Last visit: ${formatDate(record.lastVisited)} · Visits: ${record.visitCount || 1}`;
    tooltip.appendChild(details);

    if (record.note && record.note.trim()) {
      const note = document.createElement("div");
      note.className = "grid-memory-tooltip-note";
      note.textContent = record.note.trim();
      tooltip.appendChild(note);
    }

    const rect = anchor.getBoundingClientRect();
    const margin = 10;
    tooltip.style.left = `${Math.min(window.innerWidth - 330, Math.max(margin, rect.left))}px`;
    tooltip.style.top = `${Math.min(window.innerHeight - 160, rect.bottom + 8)}px`;
    tooltip.classList.add("grid-memory-tooltip-visible");
  }

  async function scanAndMarkLinks() {
    clearMarks();
    const candidates = collectCandidateLinks();
    if (!candidates.length) return;

    const uniqueUrls = [...new Set(candidates.map(item => item.url))];
    const keys = uniqueUrls.map(keyForUrl);
    const stored = await chrome.storage.local.get(keys);

    for (const { anchor, url } of candidates) {
      const key = keyForUrl(url);
      const record = stored[key];
      if (!record) continue;

      anchor.classList.add("grid-memory-visited-link");
      anchor.setAttribute("data-grid-memory-key", key);
      const row = anchor.closest("tr");
      if (row) row.classList.add("grid-memory-visited-row");

      if (!anchor.dataset.gridMemoryBound) {
        anchor.dataset.gridMemoryBound = "1";
        anchor.addEventListener("mouseenter", async () => {
          const liveKey = anchor.getAttribute("data-grid-memory-key");
          if (!liveKey) return;
          const current = await chrome.storage.local.get(liveKey);
          if (current[liveKey]) showTooltip(anchor, current[liveKey]);
        });
        anchor.addEventListener("mouseleave", hideTooltip);
        anchor.addEventListener("blur", hideTooltip);
      }
    }
  }

  function scheduleScan(delay = 200) {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(() => {
      scanAndMarkLinks().catch(console.error);
    }, delay);
  }

  const observer = new MutationObserver(() => scheduleScan());
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["href"]
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return;
    if (Object.keys(changes).some(key => key.startsWith(RECORD_PREFIX))) {
      scheduleScan(0);
    }
  });

  let lastUrl = canonicalize(location.href);
  recordVisit(lastUrl).catch(console.error);
  scheduleScan(0);

  // Covers client-side/SPAs where the URL changes without a full page reload.
  setInterval(() => {
    const now = canonicalize(location.href);
    if (now && now !== lastUrl) {
      lastUrl = now;
      currentPageKey = null;
      recordVisit(now).catch(console.error);
      scheduleScan(0);
    }
  }, 1000);
})();
