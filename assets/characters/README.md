# Verified local character artwork

All 54 tracked characters have committed card and detail WebP assets. The browser
loads these files from the site's own origin and never probes Fandom/CDNs.
`art-manifest.json` records the exact source URL and decoded dimensions for every
asset. `art-manifest.js` is its browser-facing map; regenerate both together.

Credits: Marvel / NetEase. Most artwork is from the official Marvel Rivals hero
site, distributed by [StreamHelperAssets](https://github.com/joaorb64/StreamHelperAssets)
at revision `ca478493cff1575a1db2a46edc950c30945ae5e3`. That repository explicitly
allows other projects to use the assets with pack credits retained. This does not
transfer ownership of Marvel or NetEase artwork.

Additional verified sources:

- Cyclops: https://www.marvelrivals.com/20260611/41360_1303977.html
- Devil Dinosaur: https://www.marvelrivals.com/20260514/41360_1300391.html
- Jubilee: official NetEase image URL already registered in this project; exact URL in the manifest.
- Galacta: Epic Games CDN image already registered in this project; exact URL in the manifest.

Cloak and Dagger intentionally share the game's joint character illustration.
Characters without a distinct second illustration reuse their own artwork at
a larger resolution. No unrelated character is used as a fallback.

`python scripts/verify_assets.py` rejects missing or corrupt artwork before preview
packaging. The legacy-named sync entrypoint preserves valid images and restores
missing files from exact recorded sources. New characters must receive a verified
manifest entry; the UI still displays their data and an explicit image-unavailable
state until that entry is added.
