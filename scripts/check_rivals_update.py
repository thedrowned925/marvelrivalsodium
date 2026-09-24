#!/usr/bin/env python3
"""Watch Marvel Rivals' public Steam build and publish site announcement data."""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

APP_ID = "2767030"
BRANCH = "public"
DEFAULT_API = f"https://api.steamcmd.net/v1/info/{APP_ID}"
ROOT = Path(__file__).resolve().parents[1]
STATUS_PATH = ROOT / "data" / "rivals-update.json"
COMPAT_PATH = ROOT / "data" / "rivals-compatibility.json"


def load_json(path: Path, default):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return default


def iso_from_epoch(value) -> str | None:
    try:
        return datetime.fromtimestamp(int(value), tz=timezone.utc).isoformat().replace("+00:00", "Z")
    except (TypeError, ValueError, OSError):
        return None


def fetch_app_info(url: str) -> dict:
    request = urllib.request.Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "ODIUM-Rivals-Update-Watcher/1.0 (+https://github.com/thedrowned925/marvelrivalsodium)",
        },
    )
    with urllib.request.urlopen(request, timeout=25) as response:
        payload = json.load(response)
    if payload.get("status") not in (None, "success"):
        raise RuntimeError(f"Steam info service returned status={payload.get('status')!r}")
    app = payload.get("data", {}).get(APP_ID)
    if not isinstance(app, dict):
        raise RuntimeError(f"App {APP_ID} was not present in Steam info response")
    return app


def public_branch(app: dict) -> tuple[str, str | None]:
    branch = app.get("depots", {}).get("branches", {}).get(BRANCH, {})
    build_id = str(branch.get("buildid", "")).strip()
    if not build_id:
        raise RuntimeError(f"Steam response has no {BRANCH!r} build ID for app {APP_ID}")
    return build_id, iso_from_epoch(branch.get("timeupdated"))


def default_notice(build_id: str, updated_at: str | None, detected_at: str) -> dict:
    return {
        "schemaVersion": 1,
        "appId": int(APP_ID),
        "appName": "Marvel Rivals",
        "branch": BRANCH,
        "buildId": build_id,
        "buildUpdatedAt": updated_at,
        "detectedAt": detected_at,
        "patchVersion": None,
        "patchDate": detected_at[:10],
        "status": "checking",
        "title": "Yeni Marvel Rivals güncellemesi algılandı",
        "message": "Yeni public build algılandı. ODIUM modu için uyumluluk kontrolü yapılana kadar durum bu alanda güncellenecek.",
        "compatibilityNote": "Kontrol bekleniyor",
        "checkedAt": None,
        "action": None,
        "source": {
            "label": "SteamDB",
            "url": f"https://steamdb.info/app/{APP_ID}/depots/",
        },
    }


def apply_compatibility(notice: dict, compatibility: dict) -> dict:
    override = compatibility.get("builds", {}).get(notice["buildId"])
    if not isinstance(override, dict):
        return notice
    allowed = {
        "status",
        "title",
        "message",
        "compatibilityNote",
        "checkedAt",
        "action",
        "patchVersion",
        "patchDate",
    }
    for key in allowed:
        if key in override:
            notice[key] = override[key]
    return notice


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--api-url", default=os.environ.get("STEAM_INFO_URL", DEFAULT_API))
    parser.add_argument("--status-path", type=Path, default=STATUS_PATH)
    parser.add_argument("--compat-path", type=Path, default=COMPAT_PATH)
    args = parser.parse_args()

    app = fetch_app_info(args.api_url)
    build_id, build_updated_at = public_branch(app)
    current = load_json(args.status_path, {})
    now = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    detected_at = current.get("detectedAt") if current.get("buildId") == build_id else now
    detected_at = detected_at or now

    notice = default_notice(build_id, build_updated_at, detected_at)
    notice = apply_compatibility(notice, load_json(args.compat_path, {}))

    serialized = json.dumps(notice, ensure_ascii=False, indent=2) + "\n"
    previous = args.status_path.read_text(encoding="utf-8") if args.status_path.exists() else ""
    changed = serialized != previous
    if changed:
        args.status_path.parent.mkdir(parents=True, exist_ok=True)
        args.status_path.write_text(serialized, encoding="utf-8")

    print(f"BUILD_ID={build_id}")
    print(f"STATUS={notice['status']}")
    print(f"UPDATE_CHANGED={1 if changed else 0}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Rivals update check failed: {exc}", file=sys.stderr)
        raise
