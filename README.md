# Grid Memory

**A local-first Chrome and Microsoft Edge extension that remembers which records you have already visited in web-based data grids — and lets you attach private notes to each record.**

Grid Memory is designed for internal systems, dashboards, portals, ticketing tools, case-management systems, administrative applications, and other websites where many rows look similar and it becomes difficult to remember which records you have already reviewed.

The extension works entirely inside your browser. It does not require changes to the target application and does not send your browsing data or notes to any server.

---

## Why Grid Memory?

Imagine an internal application with a grid containing hundreds of records:

```text
Date          Record          Status
--------------------------------------
10-Aug-2026   Record 12345    Open
10-Aug-2026   Record 12346    Open
09-Aug-2026   Record 12347    Open
```

Each row opens a technically unique URL, for example:

```text
https://internal.example.com/details?id=12345
https://internal.example.com/details?id=12346
```

After reviewing several records, it can be difficult to remember:

- Which records have I already opened?
- When did I last review this record?
- How many times have I opened it?
- What did I notice last time?

Grid Memory adds a lightweight browser-side memory layer without modifying the application itself.

---

## Features

- Automatically remembers visited record URLs.
- Marks previously visited links when you return to a grid or list page.
- Highlights matching HTML table rows when possible.
- Shows a hover tooltip containing:
  - last visit date/time
  - visit count
  - your personal note
- Add or update a note for the current page from the extension popup.
- Tracks different query-string URLs as separate records.
- Supports traditional multi-page applications and basic SPA/client-side navigation.
- Search all saved records.
- Delete individual saved records.
- Reset only the current URL.
- Reset all locally stored records.
- Export saved data to JSON.
- Import previously exported JSON data.
- Enable the extension only for sites you explicitly choose.
- Works with Chromium-based **Google Chrome** and **Microsoft Edge**.

---

## Privacy First

Grid Memory is intentionally local-first.

**Your data stays in your browser profile.**

The extension has:

- no backend server
- no cloud database
- no analytics
- no telemetry
- no advertising
- no external APIs
- no remote JavaScript
- no account or login requirement

Visited records and notes are stored using:

```text
chrome.storage.local
```

The extension only requests access to a website when you explicitly choose **Enable on this site**.

> Important: exported JSON files are normal files on your computer. Once exported, their security depends on how you store or share them.

---

## How It Works

The extension treats the page URL as the record identifier.

For example:

```text
/details?id=1001
/details?id=1002
```

are treated as two different records.

The URL fragment is ignored:

```text
/details?id=1001#comments
```

is stored as:

```text
/details?id=1001
```

However, the path and query string are preserved.

### High-level flow

```text
┌───────────────────────────────┐
│ User opens a record URL       │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│ Grid Memory records locally   │
│                               │
│ URL                           │
│ First visited                 │
│ Last visited                  │
│ Visit count                   │
│ Personal note                 │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│ User returns to grid/list     │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│ Extension scans page links    │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│ Matching URLs are marked ✓    │
│ Hover displays saved memory   │
└───────────────────────────────┘
```

### Dynamic pages

Grid Memory watches DOM changes so it can detect links added after the initial page load.

It also checks for URL changes in client-side applications where navigation may occur without a complete browser refresh.

---

## What Is Stored?

A saved record is conceptually similar to:

```json
{
  "url": "https://internal.example.com/details?id=12345",
  "title": "Record Details",
  "firstVisited": "2026-08-10T10:30:00.000Z",
  "lastVisited": "2026-08-10T13:45:00.000Z",
  "visitCount": 3,
  "note": "Reviewed. Waiting for approval."
}
```

Storage keys use the following format:

```text
record:<canonical-url>
```

---

## Installation

Grid Memory currently uses **Manifest V3** and can be loaded as an unpacked extension.

### Google Chrome

1. Download or clone this repository.
2. Open:

   ```text
   chrome://extensions
   ```

3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the folder containing `manifest.json`.
6. Open the Extensions menu and optionally **pin Grid Memory** to the toolbar.

### Microsoft Edge

1. Download or clone this repository.
2. Open:

   ```text
   edge://extensions
   ```

3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the folder containing `manifest.json`.
6. Open the Extensions menu and optionally **show Grid Memory in the toolbar**.

---

## First Use

1. Open the web application containing your grid.
2. Click the **Grid Memory** extension icon.
3. Click **Enable on this site**.
4. Open a record from the grid.
5. Grid Memory automatically records the visit.
6. Optionally open the extension popup and add a note.
7. Return to the grid.
8. Previously visited links should now display a check mark.
9. Hover over a visited link to see its saved information.

Example hover information:

```text
✓ Previously visited
Last visit: Aug 10, 2026, 03:14 PM · Visits: 3

Reviewed — waiting for finance approval.
```

---

## Notes

While viewing a record page:

1. Click the Grid Memory icon.
2. Enter your note.
3. Click **Save note**.

The note is associated with the exact canonical URL of the current page.

When that URL appears again as a link on a supported grid/list page, the note is shown in the hover tooltip.

---

## Resetting Data

### Reset Current URL

Use **Reset current URL** from the popup to remove only the current page's:

- note
- first visited timestamp
- last visited timestamp
- visit counter

Other records are not affected.

### Reset All Data

Use **Reset all data** to permanently remove all Grid Memory records from browser-local storage.

This does **not**:

- uninstall Grid Memory
- disable the extension
- revoke previously granted site permissions

---

## Saved Records

Open **Saved records** from the extension popup to manage your local memory database.

You can:

- search by URL
- search by page title
- search inside notes
- view first and last visit timestamps
- view visit counters
- delete individual records
- export records to JSON
- import records from JSON
- reset all records

---

## Export and Import

Grid Memory supports local JSON backup.

### Export

From **Saved records**, click **Export**.

A file similar to this will be created:

```text
grid-memory-2026-08-10.json
```

### Import

Choose **Import** and select a previously exported Grid Memory JSON file.

Imported records are written into browser-local storage.

---

## Site Permissions

The manifest does **not** permanently request access to every website.

Instead, Grid Memory declares optional host permissions:

```json
"optional_host_permissions": [
  "http://*/*",
  "https://*/*"
]
```

Access to an individual site is requested only when you click:

```text
Enable on this site
```

The content script is then registered for that site's origin.

You can disable Grid Memory for that site again from the extension popup.

Disabling a site does not automatically delete previously stored Grid Memory records.

---

## Browser Permissions

Grid Memory currently requests:

```text
storage
scripting
activeTab
```

### `storage`

Used to store visited URLs, timestamps, counters, and notes locally.

### `scripting`

Used to inject/register Grid Memory's local content script and CSS for explicitly enabled sites.

### `activeTab`

Used when interacting with the currently active browser tab from the extension popup.

---

## InPrivate / Incognito Mode

Chrome and Edge normally require users to explicitly allow an extension to run in private browsing.

Open the extension's **Details** page and enable the browser's option such as:

```text
Allow in Incognito
```

or:

```text
Allow in InPrivate
```

The exact wording depends on the browser version and organizational policies.

Enterprise-managed browsers may prevent extensions from being enabled in private mode.

---

## Current Grid Detection

Grid Memory scans same-origin links (`<a href="...">`) on the current page.

If the page contains HTML table rows (`<tr>`), it prioritizes links located inside those rows and can visually mark the entire matching row.

This makes the current version work particularly well with traditional HTML tables.

The extension also watches for dynamically added or changed links using a `MutationObserver`.

---

## Current Limitations

Grid Memory is intentionally generic, but web applications can implement grids in many different ways.

Known limitations include:

- Custom grids that do not use normal `<a href>` links may require custom detection logic.
- Virtualized grids may constantly create and destroy rows; behavior depends on the grid framework.
- Buttons using JavaScript navigation instead of links may not currently be recognized from the grid view.
- Applications using temporary/session-specific query parameters may produce multiple records for what is logically the same business item.
- URLs are currently the identity mechanism; Grid Memory does not yet understand application-specific record IDs independently of the URL.
- Browser-local storage is tied to the browser profile and is not automatically synchronized between computers.
- Clearing browser extension/site data or uninstalling the extension may remove stored records.

---

## URL Normalization

Current behavior:

```text
https://example.com/item?id=1001#details
```

becomes:

```text
https://example.com/item?id=1001
```

Query parameters are otherwise preserved.

A future release may allow configurable normalization rules such as ignoring:

```text
sessionId
trackingId
timestamp
cacheBust
```

while retaining business identifiers such as:

```text
id
recordId
caseId
requestId
```

---

## Project Structure

```text
Grid-Memory/
├── manifest.json
├── content.js
├── content.css
├── popup.html
├── popup.js
├── popup.css
├── options.html
├── options.js
├── options.css
└── README.md
```

### `manifest.json`

Manifest V3 extension definition, permissions, popup, and options configuration.

### `content.js`

Tracks visits, scans page links, detects matching saved URLs, and displays hover information.

### `content.css`

Provides visited-link, row-highlight, and tooltip styling.

### `popup.*`

Handles:

- enabling/disabling the current site
- displaying current record information
- adding notes
- resetting the current URL
- resetting all data

### `options.*`

Implements the **Saved records** management interface, search, deletion, export, and import.

---

## Development

No build process or package manager is currently required.

The extension uses plain:

- JavaScript
- HTML
- CSS
- Chrome Extension Manifest V3 APIs

To develop locally:

1. Clone the repository.
2. Make your changes.
3. Open `chrome://extensions` or `edge://extensions`.
4. Click **Reload** on Grid Memory.
5. Refresh the target application page if necessary.

Because the extension is loaded unpacked, edits can be tested immediately without recompilation.

---

## Updating an Unpacked Installation

If Grid Memory is already loaded from a local folder:

1. Replace/update the source files inside that same folder.
2. Open the browser extension management page.
3. Click **Reload**.

Using the same installation folder avoids unnecessary reinstallation and helps preserve existing browser-local data.

Before making major changes, exporting your records is recommended.

---

## Security Considerations

Grid Memory may be used with sensitive internal applications, so contributions should preserve the following principles:

1. **Local-first by default** — browsing history and notes should not leave the browser.
2. **Least privilege** — request only permissions required for the feature.
3. **Explicit site activation** — do not silently enable the extension across all websites.
4. **No remote code execution** — all executable extension code should ship with the extension.
5. **Safe DOM handling** — notes and page content must be inserted as text, not trusted HTML.
6. **No hidden telemetry** — any future network capability must be explicit, optional, and documented.

If you discover a security issue, avoid publishing sensitive exploit details in a public GitHub issue until the maintainer has had an opportunity to review it.

---

## Roadmap Ideas

Potential future improvements include:

- configurable visited-row colors
- custom grid selectors
- support for button-based rows without normal links
- configurable URL normalization rules
- domain-specific record ID extraction
- tags and categories for notes
- starred / important records
- note editing directly from the grid tooltip
- optional expiry of old visit history
- manual mark as reviewed/unreviewed
- per-site behavior settings
- keyboard shortcuts
- local encrypted backup
- Firefox support

The project should remain **local-first and privacy-preserving** even as features are added.

---

## Contributing

Contributions are welcome.

A typical contribution flow:

1. Fork the repository.
2. Create a feature branch.
3. Make and test your changes in Chrome and/or Edge.
4. Keep the extension local-first and avoid unnecessary permissions.
5. Submit a pull request describing:
   - the problem
   - the proposed change
   - how it was tested

For application-specific grid support, please include a sanitized description of the relevant HTML structure. Do not post confidential internal-system data in public issues.

---

## Compatibility

Current target:

- Google Chrome — Chromium / Manifest V3
- Microsoft Edge — Chromium / Manifest V3

Other Chromium-based browsers may work but are not currently considered officially tested targets.

---

## License

Before publishing the repository as open source, add an explicit `LICENSE` file.

**MIT License** is a simple option for a small browser-extension project because it permits use, modification, redistribution, and commercial use while retaining the copyright and license notice.

Until a license file is added, the repository should **not** be assumed to grant open-source reuse rights merely because the source code is publicly visible.

---

## Project Philosophy

Grid Memory is based on a simple idea:

> **Your browser should be able to remember the context you have already seen — without requiring the application itself to change.**

The website remains untouched. Grid Memory adds a private, local memory layer controlled by the user.
