# ODIUM // Marvel Rivals Türkçe Dublaj Tracker

Ultra-animated static tracker for the ODIUM Studios **Marvel Rivals Türkçe Dublaj Projesi**.

## Live data architecture

- Source: public Google Drive workbook `ODIUM MARVEL RIVALS.xlsx`.
- `.github/workflows/sync-data.yml` checks the workbook every 5 minutes.
- `scripts/sync_data.py` derives counts directly from character sheets and updates `data/data.json` only when data changes.
- The GitHub Pages frontend fetches `data/data.json` from the repository's `main` branch with cache-busting, so the visual site does not need to redeploy for every data change.
- New non-empty rows added to `Karakter Bazli` are included automatically; the site does not use the workbook's older fixed `A2:A47` summary range.

## Local preview

Serve the repository with any static HTTP server, for example:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Isolated Rivals UI preview (September 2026)

Work lives on `ui/rivals-preview-20260905`; merge only after visual approval.
The separate Sites preview does not deploy to the existing GitHub Pages site.

- Preserves live summary updates, all 54 characters, name/voice-actor search,
  status filters, sorting, full line data, line filters/pagination, announcement,
  five characters' hover/detail voice clips and mobile navigation.
- `character-art.js` is the sole artwork owner. Verified WebP images are served
  from the same origin. A failed card image tries that character's detail image;
  if both fail, a readable unavailable state replaces the broken image.
- Hover artwork loads on intent. Unchanged data refreshes preserve existing cards.
- The local data snapshot renders first; live data replaces it when available.
  The header distinguishes live from saved data. Detail cache is revision aware.
- No remote JavaScript evaluation or live runtime import from main.

Validation: `python scripts/verify_assets.py`, JavaScript syntax checks, and DOM
regression checks for roster controls, detail filters/paging, offline data and
image failure handling. Browser visual QA was not performed in this environment.

`python scripts/stage_preview.py` prepares the static `dist/` output for Sites.
The root remains a standard static GitHub Pages site. `dist/` is generated and
ignored. `.openai/hosting.json` identifies only the independent preview.

The existing art workflow now validates committed assets and restores missing
files from verified manifest sources. New characters need a verified manifest
entry before the asset validation gate passes. `--refresh` explicitly refreshes
registered art; valid cached images are otherwise preserved.
