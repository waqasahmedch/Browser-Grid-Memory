# Grid Memory — Chrome & Edge MVP

Grid Memory is a browser-local extension for internal systems with data grids.

## What it does

- You enable it explicitly for your internal site.
- When you open a record/detail URL, the extension stores that URL locally as visited.
- Query parameters remain part of the URL, so `/detail?id=1001` and `/detail?id=1002` are separate records.
- When you return to a table/grid, previously opened record links are marked with a check and the row receives a subtle highlight.
- Hover a previously visited link to see:
  - last visit time
  - visit count
  - your saved note
- Open the extension popup while on a record to add or update its note.
- A Saved Records page lets you search, delete, export, and import your local data.

## Privacy model

- No server.
- No API calls.
- No analytics or telemetry.
- No remote JavaScript.
- Data is stored in `chrome.storage.local` in the current browser profile.
- The extension is inactive on sites until you explicitly grant access to that site.

## Install in Google Chrome

1. Extract this folder somewhere permanent.
2. Open `chrome://extensions`.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select the `browser-memory-extension` folder.
6. Optionally pin **Grid Memory** to the toolbar.

## Install in Microsoft Edge

1. Extract this folder somewhere permanent.
2. Open `edge://extensions`.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select the `browser-memory-extension` folder.
6. Optionally pin **Grid Memory** to the toolbar.

## First test

1. Open your internal grid page.
2. Click the Grid Memory icon and choose **Enable on this site**.
3. Open one record from the grid.
4. Click the extension icon on the record page and add a note.
5. Return to the grid.
6. The previously opened row/link should now be marked.
7. Hover the link to see its visit information and note.

## Notes for this MVP

- It is intentionally generic and looks at same-site links, prioritizing links inside HTML table rows when a table is present.
- It removes URL fragments (`#section`) from the identity but preserves the full path and query string.
- If your grid uses custom components instead of `<table>/<tr>` markup, the link will still be tracked, but row-level highlighting may need a selector tailored to your application.
- If the application uses URLs containing temporary/session query parameters, a later version should add URL normalization rules so only business identifiers are used as the record key.


## Reset all local data

Open the Grid Memory popup and choose **Reset all data**. This permanently deletes every saved note, first/last visit timestamp, and visit counter. It does **not** uninstall the extension or disable the site. The same reset is available from **Saved records**.


## Reset current URL

Open the Grid Memory popup while viewing a specific record and choose **Reset current URL**. This permanently deletes only that exact URL's saved note, first/last visit timestamps, and visit counter. Other records remain unchanged.
