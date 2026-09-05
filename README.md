# ODIUM // Marvel Rivals Türkçe Dublaj Tracker

Ultra-animated static tracker for the ODIUM Stüdyo **Marvel Rivals Türkçe Dublaj Projesi**.

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

## Character dossiers — second independent design

Branch: `ui/rivals-character-dossiers`. This is an alternative to the first
preview, with its own Sites project. Neither preview is merged into `main`.

- All 54 characters have their own portrait and associated color. 48 profiles
  have a verified emblem; the others intentionally omit it.
- Home includes a browsable character dossier. The same composition appears
  above the complete searchable/paginated line list in every character modal.
- Panels show real voice actor, progress, counts and four production stages.
- **Afişi indir** exports a 1920×1080 PNG from current character data, using
  same-origin images and fonts. No external rendering service is involved.
- `assets/design/hero-design.json` and its JS companion define the visuals.
  `dossier.js` composes them; `poster-renderer.js` draws downloadable posters.
- Turkish text uses local Bebas Neue and Barlow fonts, with checked glyphs.

Visual composition inspired by Sean Onamade's
[Marvel Rivals character concept app](https://github.com/SeanOnamade/marvel-rivals-character-concept-app),
especially its Doctor Strange ability page. Emblems and the shared scene are
sourced from reference commit `8a0b68eaa32f7102ef72ea6221083e3f0379f513`;
individual source paths are recorded in `assets/design/sources.json`.
Hero artwork attribution remains in `assets/characters/README.md` and the art
manifest. Marvel Rivals imagery and characters belong to Marvel / NetEase.
Bebas Neue and Barlow are from Google Fonts; their OFL licenses are included.
The reference's original fonts were not retained because some Turkish glyphs
were missing or blank.

Validation for this variant: local asset verification, JavaScript syntax,
DOM checks of original controls plus dossier navigation and PNG export wiring,
audio checks, and rendered poster inspection. Full browser visual QA remains
outstanding; inspect the independent preview before approving a merge.

## Main release: tour, branding and data refresh

The approved dossier design is released to `main` and the public GitHub Pages
site. First-preview branch and private preview remain available as backups.
All runtime branding is **ODIUM Stüdyo**, including downloadable posters.

`feature-tour.js` includes the release devlog and existing project notice. It
opens on every page load unless the visitor explicitly selects **Bir daha
gösterme**. Completion, × and Escape do not save an opt-out. The device-local
preference is permanent across tour versions until browser/site storage is
cleared. The footer can reopen the tour manually. If storage is blocked, the
tour explains that the preference could not be saved.

`live-sync.js` checks a lightweight revision marker every 10 seconds in visible
tabs and immediately on focus/reconnection. Matching revisions preserve the
page. Updated open character data preserves search, status filter, page size,
page and scroll position. Summary and details must have matching revisions.

Source-side instant update is **not yet connected**: the XLSX upload/edit system
must notify the implemented repository-dispatch hook. The five-minute scheduled
job remains a recovery fallback. See `scripts/LIVE_DATA.md` for the concrete
integration hook and latency limits. The tour does not claim zero-delay Excel
updates. Only one scheduled data workflow remains.

## Runtime release integrity

Run `python scripts/version_runtime.py` after changing any page script or style,
then commit its generated snapshots and index together. The page loads files
with content hashes in their names; a cached legacy `app.js` or stylesheet can
no longer be combined with a new HTML release. Snapshots stay in the same
directory as their original files so CSS image/font URLs remain valid.
`assets/runtime-manifest.json` records the exact expected hashes.

Before publishing: `python scripts/verify_assets.py` and
`python scripts/stage_preview.py`. Publish the matching main tree to gh-pages.

## Audio management panel

`admin/` provides single-owner setup/login, character search, hover/detail audio
previews and uploads, GitHub connection, account settings and pending publication
recovery. The dedicated Supabase project handles authorization, encrypted GitHub
credentials, storage and realtime publication. See `supabase/README.md` for
setup, security boundaries and deployment. Existing sounds remain the fallback.
The owner must configure their own repository-scoped GitHub token in the panel;
no ChatGPT connector credentials are embedded in the application.
