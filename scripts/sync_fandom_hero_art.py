#!/usr/bin/env python3
"""Cache two Marvel Rivals artworks per tracked character.

cards/: compact roster art used by hero cards
details/: a second, stronger artwork selected from Fandom's File namespace

The script intentionally stores the images in the repository so the public site
never depends on Fandom hotlinking/CORS at runtime.
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
CARDS = OUT / "cards"
DETAILS = OUT / "details"
MANIFEST = OUT / "art-manifest.json"
FANDOM = "https://marvelrivals.fandom.com"
API = f"{FANDOM}/api.php"
HEROES_PAGE = f"{FANDOM}/wiki/Heroes"

FILE_BASE = {
    "Adam Warlock":"Hero Card Adam Warlock","Angela":"Angela Hero Card","Black Cat":"Hero Card Black Cat","Black Panther":"Hero Card Black Panther","Black Widow":"Hero Card Black Widow","Blade":"Blade Hero Card","Hulk":"Hulk Hero Card","Capt. America":"Hero Card Captain America","Cloak":"Hero Card Cloak & Dagger","Dagger":"Hero Card Cloak & Dagger","Cyclops":"Hero Card Cyclops","Dare Devil":"Daredevil Hero Card","Deadpool":"Hero Card Deadpool","Devil Dinosaur":"Hero Card Devil Dinosaur","Dr.Strange":"Hero Card Doctor Strange","Elsa Bloodstone":"Hero Card Elsa Bloodstone","Emma Frost":"Hero Card Emma Frost","Gambit":"Gambit Hero Card","Groot":"Hero Card Groot","Hawkeye":"Hero Card Hawkeye","Hela":"Hela Prestige Artwork","Human Torch":"Hero Card Human Torch","Invisible Woman":"Hero Card Invisible Woman","Iron Fist":"Prestigeironfist","Iron Man":"Iron man prestige","Jeff":"Hero Card Jeff","Loki":"Hero Card Loki","Luna Snow":"Hero Card Luna Snow","Magik":"Magik marvel rivals prestige art","Magneto":"Magneto prestige","Mantis":"Hero Card Mantis","Mr.Fantastic":"Hero Card Mister Fantastic","Moon Knight":"Moonknight prestige","Namor":"Namor prestige","Peni Parker":"Peni Parker Prestige Artwork","Phoenix":"Phoenix prestige","Psylocke":"Hero Card Psylocke","Rocket Raccoon":"Hero Card Rocket Raccoon","Rogue":"Rogue Hero Card","Scarlet Witch":"Hero Card Scarlet Witch","Spider-Man":"Hero Card Spider-Man","Squirrel Girl":"Prestige squirellgirl","Star Lord":"Hero Card Star-Lord","Storm":"Hero Card Storm","The Punisher":"Punisher prestige","The Thing":"The Thing Prestige art","Thor":"Hero Card Thor","Ultron":"Ultron Prestige art","Venom":"Hero Card Venom","White Fox":"Hero Card White Fox","Winter Soldier":"Winter soldier prestige","Wolverine":"Hero Card Wolverine","Galacta":"Galacta"
}
CANON = {"Capt. America":"Captain America","Dr.Strange":"Doctor Strange","Mr.Fantastic":"Mister Fantastic","Dare Devil":"Daredevil","Jeff":"Jeff the Land Shark","Star Lord":"Star-Lord","Cloak":"Cloak & Dagger","Dagger":"Cloak & Dagger"}
BAD_DETAIL = ("icon","ability","spray","emoji","emote","nameplate","portrait","logo","avatar","achievement","loading","banner","mvp","costume","skin","team-up","team up")


def slug(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", value).strip("-")


def redirect(file_name: str) -> str:
    return f"{FANDOM}/wiki/Special:Redirect/file/{quote(file_name)}"


def guessed_files(base: str) -> list[str]:
    if re.search(r"\.(png|jpe?g|webp)$", base, re.I):
        return [base]
    return [base + ext for ext in (".png", ".jpg", ".jpeg", ".webp")]


def card_files(name: str) -> list[str]:
    canonical = CANON.get(name, name)
    bases = [FILE_BASE.get(name, f"Hero Card {canonical}"), f"Hero Card {canonical}", f"{canonical} Hero Card"]
    result: list[str] = []
    for base in bases:
        for file_name in guessed_files(base):
            if file_name not in result:
                result.append(file_name)
    return result


def search_fandom_files(session: requests.Session, name: str) -> list[str]:
    canonical = CANON.get(name, name)
    queries = [f'"{canonical}" artwork', f'"{canonical}" prestige', canonical]
    found: list[str] = []
    for query in queries:
        try:
            r = session.get(API, params={"action":"query","format":"json","list":"search","srnamespace":6,"srlimit":50,"srsearch":query}, timeout=30)
            r.raise_for_status()
            for item in r.json().get("query", {}).get("search", []):
                title = item.get("title", "")
                if title.lower().startswith("file:"):
                    title = title[5:]
                if title and title not in found:
                    found.append(title)
        except Exception as exc:
            print(f"search warning {name}: {exc}")
    return found


def score_detail(name: str, title: str, card_names: set[str]) -> int:
    canonical = CANON.get(name, name).lower()
    low = title.lower()
    score = 0
    if title in card_names:
        score -= 300
    for token in re.findall(r"[a-z0-9]+", canonical):
        if token in low:
            score += 18
    if "prestige" in low: score += 145
    if "artwork" in low or " art." in low or " art " in low: score += 120
    if "splash" in low: score += 110
    if "render" in low: score += 95
    if "key art" in low: score += 90
    if "character art" in low: score += 80
    if "hero card" in low: score -= 75
    for bad in BAD_DETAIL:
        if bad in low: score -= 160
    return score


def detail_files(session: requests.Session, name: str) -> list[str]:
    canonical = CANON.get(name, name)
    cards = set(card_files(name))
    hints = [f"{canonical} Prestige Artwork", f"{canonical} prestige", f"Prestige {canonical}", f"{canonical} Artwork", f"{canonical} character art"]
    files: list[str] = []
    for hint in hints:
        files.extend(guessed_files(hint))
    searched = search_fandom_files(session, name)
    searched.sort(key=lambda title: score_detail(name, title, cards), reverse=True)
    files.extend(searched)
    dedup: list[str] = []
    for item in files:
        if item not in dedup and item not in cards:
            dedup.append(item)
    return dedup


def download_first(session: requests.Session, files: list[str]) -> tuple[bytes, str, str]:
    errors: list[str] = []
    for file_name in files:
        url = redirect(file_name)
        try:
            r = session.get(url, timeout=35, allow_redirects=True)
            ctype = r.headers.get("content-type", "").lower()
            if r.ok and ctype.startswith("image/") and len(r.content) > 6000:
                return r.content, r.url, file_name
            errors.append(f"{r.status_code}:{file_name}")
        except requests.RequestException as exc:
            errors.append(f"{type(exc).__name__}:{file_name}")
    raise RuntimeError(" | ".join(errors[-5:]))


def to_webp(raw: bytes, target: Path, max_w: int, max_h: int) -> tuple[int, int]:
    with Image.open(io.BytesIO(raw)) as im:
        im.load()
        if im.mode not in ("RGB", "RGBA"):
            im = im.convert("RGBA")
        ratio = min(1.0, max_w / im.width, max_h / im.height)
        if ratio < 1:
            im = im.resize((round(im.width * ratio), round(im.height * ratio)), Image.Resampling.LANCZOS)
        target.parent.mkdir(parents=True, exist_ok=True)
        im.save(target, "WEBP", quality=91, method=6)
        return im.size


def asset_info(target: Path, source: str, file_name: str, size: tuple[int, int]) -> dict:
    return {"file":str(target.relative_to(ROOT)).replace("\\","/"),"source":source,"fandomFile":file_name,"width":size[0],"height":size[1]}


def main() -> None:
    data = json.loads(DATA.read_text("utf-8"))
    session = requests.Session()
    session.headers.update({"User-Agent":"Mozilla/5.0 ODIUM-Marvel-Rivals-Art-Sync/2.0","Referer":HEROES_PAGE,"Accept":"image/avif,image/webp,image/apng,image/*,*/*;q=0.8"})
    old = {}
    if MANIFEST.exists():
        try: old = json.loads(MANIFEST.read_text("utf-8")).get("characters", {})
        except Exception: pass
    manifest = {"source":HEROES_PAGE,"characters":{}}
    card_ok = detail_ok = 0
    for index, character in enumerate(data["characters"], 1):
        name = character["name"]
        key = character.get("slug") or slug(name)
        entry = {"card":None,"detail":None}
        try:
            raw, source, file_name = download_first(session, card_files(name))
            target = CARDS / f"{key}.webp"
            size = to_webp(raw, target, 1200, 1650)
            entry["card"] = asset_info(target, source, file_name, size)
            card_ok += 1
        except Exception as exc:
            print(f"CARD WARN {name}: {exc}")
            entry["card"] = old.get(name, {}).get("card")
        try:
            raw, source, file_name = download_first(session, detail_files(session, name))
            target = DETAILS / f"{key}.webp"
            size = to_webp(raw, target, 1900, 1600)
            entry["detail"] = asset_info(target, source, file_name, size)
            detail_ok += 1
        except Exception as exc:
            print(f"DETAIL WARN {name}: {exc}")
            entry["detail"] = old.get(name, {}).get("detail") or entry["card"]
        manifest["characters"][name] = entry
        print(f"[{index:02}/{len(data['characters'])}] {name}: card={'OK' if entry['card'] else 'MISS'} detail={'OK' if entry['detail'] else 'MISS'}")
        time.sleep(.12)
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print(f"card assets: {card_ok}/{len(data['characters'])}; detail assets: {detail_ok}/{len(data['characters'])}")
    if card_ok == 0:
        raise SystemExit("No card images could be downloaded")

if __name__ == "__main__":
    main()
