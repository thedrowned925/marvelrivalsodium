#!/usr/bin/env python3
import io
import json
import sys
from pathlib import Path

import requests
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "assets" / "characters" / "sources.json"
OUT = ROOT / "assets" / "characters"

SIZES = {
    "normal": (1200, 1600),
    "hover": (1200, 1600),
    "detail": (1600, 2000),
}

SESSION = requests.Session()
SESSION.headers.update({
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/147 Safari/537.36",
    "Referer": "https://marvelrivals.fandom.com/",
    "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
})


def download(url: str) -> Image.Image:
    last = None
    for _ in range(3):
        try:
            r = SESSION.get(url, timeout=45, allow_redirects=True)
            r.raise_for_status()
            ctype = (r.headers.get("content-type") or "").lower()
            if "image" not in ctype and len(r.content) < 10_000:
                raise RuntimeError(f"not an image: {ctype}, {len(r.content)} bytes")
            img = Image.open(io.BytesIO(r.content))
            img.load()
            return img.convert("RGBA")
        except Exception as exc:
            last = exc
    raise RuntimeError(f"download failed: {url}: {last}")


def fit_canvas(img: Image.Image, size: tuple[int, int]) -> Image.Image:
    tw, th = size
    work = img.copy()
    work.thumbnail((tw, th), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
    x = (tw - work.width) // 2
    y = (th - work.height) // 2
    canvas.alpha_composite(work, (x, y))
    return canvas


def save_webp(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fitted = fit_canvas(img, SIZES[path.parent.name])
    fitted.save(path, "WEBP", quality=93, method=6, lossless=False)


def main() -> int:
    if not MANIFEST.exists():
        print(f"Manifest not found: {MANIFEST}")
        return 0

    data = json.loads(MANIFEST.read_text("utf-8"))
    failures = []

    for slug, sources in data.items():
        normal_url = sources.get("normal")
        hover_url = sources.get("hover")
        detail_url = sources.get("detail") or hover_url or normal_url

        loaded = {}
        for kind, url in (("normal", normal_url), ("hover", hover_url), ("detail", detail_url)):
            if not url:
                continue
            try:
                # Reuse the same downloaded source when detail == hover.
                if url in loaded:
                    img = loaded[url]
                else:
                    print(f"[{slug}] downloading {kind}: {url}")
                    img = download(url)
                    loaded[url] = img
                target = OUT / kind / f"{slug}.webp"
                save_webp(img, target)
                print(f"[{slug}] wrote {target.relative_to(ROOT)} {SIZES[kind][0]}x{SIZES[kind][1]}")
            except Exception as exc:
                failures.append(f"{slug}/{kind}: {exc}")
                print(f"ERROR {slug}/{kind}: {exc}", file=sys.stderr)

    if failures:
        print("\nFailures:", file=sys.stderr)
        for failure in failures:
            print(f" - {failure}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
