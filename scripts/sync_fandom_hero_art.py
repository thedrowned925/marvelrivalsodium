#!/usr/bin/env python3
"""Cache Marvel Rivals hero art from the Fandom Heroes page/file namespace.

The tracker uses the cached WebP files from assets/characters so the public site
is not dependent on Fandom hotlink/CORS behaviour. Every generated asset keeps
its Fandom source URL in assets/characters/fandom-manifest.json.
"""
from __future__ import annotations

import io
import json
import re
import time
import unicodedata
from pathlib import Path
from urllib.parse import quote

import requests
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "data.json"
OUT = ROOT / "assets" / "characters"
MANIFEST = OUT / "fandom-manifest.json"
FANDOM = "https://marvelrivals.fandom.com"
HEROES_PAGE = f"{FANDOM}/wiki/Heroes"

FILE_BASE = {
    "Adam Warlock": "Hero Card Adam Warlock", "Angela": "Angela Hero Card",
    "Black Cat": "Hero Card Black Cat", "Black Panther": "Hero Card Black Panther",
    "Black Widow": "Hero Card Black Widow", "Blade": "Blade Hero Card",
    "Hulk": "Hulk Hero Card", "Capt. America": "Hero Card Captain America",
    "Cloak": "Hero Card Cloak & Dagger", "Dagger": "Hero Card Cloak & Dagger",
    "Cyclops": "Hero Card Cyclops", "Dare Devil": "Daredevil Hero Card",
    "Deadpool": "Hero Card Deadpool", "Devil Dinosaur": "Hero Card Devil Dinosaur",
    "Dr.Strange": "Hero Card Doctor Strange", "Elsa Bloodstone": "Hero Card Elsa Bloodstone",
    "Emma Frost": "Hero Card Emma Frost", "Gambit": "Gambit Hero Card",
    "Groot": "Hero Card Groot", "Hawkeye": "Hero Card Hawkeye",
    "Hela": "Hela Prestige Artwork", "Human Torch": "Hero Card Human Torch",
    "Invisible Woman": "Hero Card Invisible Woman", "Iron Fist": "Prestigeironfist",
    "Iron Man": "Iron man prestige", "Jeff": "Hero Card Jeff",
    "Loki": "Hero Card Loki", "Luna Snow": "Hero Card Luna Snow",
    "Magik": "Magik marvel rivals prestige art", "Magneto": "Magneto prestige",
    "Mantis": "Hero Card Mantis", "Mr.Fantastic": "Hero Card Mister Fantastic",
    "Moon Knight": "Moonknight prestige", "Namor": "Namor prestige",
    "Peni Parker": "Peni Parker Prestige Artwork", "Phoenix": "Phoenix prestige",
    "Psylocke": "Hero Card Psylocke", "Rocket Raccoon": "Hero Card Rocket Raccoon",
    "Rogue": "Rogue Hero Card", "Scarlet Witch": "Hero Card Scarlet Witch",
    "Spider-Man": "Hero Card Spider-Man", "Squirrel Girl": "Prestige squirellgirl",
    "Star Lord": "Hero Card Star-Lord", "Storm": "Hero Card Storm",
    "The Punisher": "Punisher prestige", "The Thing": "The Thing Prestige art",
    "Thor": "Hero Card Thor", "Ultron": "Hero Card Ultron",
    "Venom": "Hero Card Venom", "White Fox": "Hero Card White Fox",
    "Winter Soldier": "Winter soldier prestige", "Wolverine": "Hero Card Wolverine",
    "Galacta": "Galacta",
}

CANON = {
    "Capt. America": "Captain America", "Dr.Strange": "Doctor Strange",
    "Mr.Fantastic": "Mister Fantastic", "Dare Devil": "Daredevil",
    "Jeff": "Jeff the Land Shark", "Star Lord": "Star-Lord",
    "Cloak": "Cloak & Dagger", "Dagger": "Cloak & Dagger",
}


def slug(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", value).strip("-")


def candidates(name: str) -> list[str]:
    canonical = CANON.get(name, name)
    base = FILE_BASE.get(name, f"Hero Card {canonical}")
    names = [base, f"Hero Card {canonical}", f"{canonical} Hero Card"]
    urls: list[str] = []
    for item in names:
        for ext in ("png", "jpg", "jpeg", "webp"):
            url = f"{FANDOM}/wiki/Special:Redirect/file/{quote(item + '.' + ext)}"
            if url not in urls:
                urls.append(url)
    return urls


def get_image(session: requests.Session, name: str) -> tuple[bytes, str]:
    errors = []
    for url in candidates(name):
        try:
            r = session.get(url, timeout=35, allow_redirects=True)
            ctype = r.headers.get("content-type", "").lower()
            if r.ok and ctype.startswith("image/") and len(r.content) > 5000:
                return r.content, r.url
            errors.append(f"{r.status_code}:{ctype}:{url}")
        except requests.RequestException as exc:
            errors.append(f"{type(exc).__name__}:{url}")
    raise RuntimeError(" | ".join(errors[-4:]))


def to_webp(raw: bytes, target: Path) -> tuple[int, int]:
    with Image.open(io.BytesIO(raw)) as im:
        im.load()
        if im.mode not in ("RGB", "RGBA"):
            im = im.convert("RGBA")
        max_w, max_h = 1400, 1900
        ratio = min(1.0, max_w / im.width, max_h / im.height)
        if ratio < 1:
            im = im.resize((round(im.width * ratio), round(im.height * ratio)), Image.Resampling.LANCZOS)
        target.parent.mkdir(parents=True, exist_ok=True)
        im.save(target, "WEBP", quality=90, method=6)
        return im.size


def main() -> None:
    data = json.loads(DATA.read_text("utf-8"))
    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/147 Safari/537.36 ODIUMTracker/1.0",
        "Referer": HEROES_PAGE,
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    })

    old = {}
    if MANIFEST.exists():
        try:
            old = json.loads(MANIFEST.read_text("utf-8")).get("characters", {})
        except Exception:
            pass

    manifest = {"source": HEROES_PAGE, "characters": {}}
    failures: list[str] = []
    for index, character in enumerate(data["characters"], 1):
        name = character["name"]
        target = OUT / f"{character.get('slug') or slug(name)}.webp"
        try:
            raw, source = get_image(session, name)
            width, height = to_webp(raw, target)
            manifest["characters"][name] = {
                "file": str(target.relative_to(ROOT)).replace("\\", "/"),
                "source": source,
                "fandomFileHint": FILE_BASE.get(name),
                "width": width, "height": height,
            }
            print(f"[{index:02}/{len(data['characters'])}] {name}: {width}x{height}")
        except Exception as exc:
            failures.append(name)
            print(f"WARN {name}: {exc}")
            if name in old:
                manifest["characters"][name] = old[name]
        time.sleep(0.15)

    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Cached {len(manifest['characters'])}/{len(data['characters'])} character images from Fandom")
    if failures:
        print("Failed this run:", ", ".join(failures))
        if len(failures) == len(data["characters"]):
            raise SystemExit("Fandom returned no usable hero images")


if __name__ == "__main__":
    main()
