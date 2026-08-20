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
