#!/usr/bin/env python3
"""Download the public ODIUM Marvel Rivals workbook and build site data JSON."""
from __future__ import annotations
import argparse, datetime as dt, json, tempfile
from pathlib import Path
import requests
import openpyxl

STATUS_KEYS = {
    "Bekliyor": "waiting",
    "Kayit Alindi": "recorded",
    "Kayıt Alındı": "recorded",
    "Kontrol Edildi": "checked",
    "Oyuna Eklendi": "added",
}

def download(url: str, target: Path) -> None:
    with requests.get(url, stream=True, timeout=60, allow_redirects=True) as r:
        r.raise_for_status()
        with target.open("wb") as f:
            for chunk in r.iter_content(chunk_size=1024 * 256):
                if chunk:
                    f.write(chunk)
    if target.stat().st_size < 50_000:
        raise RuntimeError(f"Downloaded file looks too small ({target.stat().st_size} bytes)")

def status_counts(wb, sheet_name: str, total: int, fallback: dict[str,int]) -> dict[str,int]:
    if sheet_name not in wb.sheetnames:
        return fallback
    ws = wb[sheet_name]
    out = {"waiting":0,"recorded":0,"checked":0,"added":0}
    for row in ws.iter_rows(min_row=2, min_col=1, max_col=7, values_only=True):
        if not any(v is not None for v in row[:6]):
            continue
        raw = row[6]
        key = STATUS_KEYS.get(str(raw).strip()) if raw is not None else None
        if key:
            out[key] += 1
    if sum(out.values()) == 0 and sum(fallback.values()) > 0:
        return fallback
    return out

def build(workbook: Path, existing: dict | None = None) -> dict:
    wb = openpyxl.load_workbook(workbook, data_only=True, read_only=True)
    if "Karakter Bazli" not in wb.sheetnames:
        raise RuntimeError("'Karakter Bazli' sheet not found")
    summary = wb["Karakter Bazli"]
    characters=[]
    for row in summary.iter_rows(min_row=2, max_col=9, values_only=True):
        name=row[0]
        if not name:
            continue
        total=int(row[1] or 0)
        fallback={"waiting":int(row[2] or 0),"recorded":int(row[3] or 0),"checked":int(row[4] or 0),"added":int(row[5] or 0)}
        counts=status_counts(wb,str(name),total,fallback)
        worked=counts["recorded"]+counts["checked"]+counts["added"]
        progress=round(worked/total*100,2) if total else 0
        if total and counts["added"]==total:
            status="Tamamlandi"
        elif total and counts["waiting"]==total:
            status="Baslamadi"
        else:
            status="Devam Ediyor"
        characters.append({
            "name":str(name),"total":total,**counts,"progress":progress,"status":status,
            "voiceActor":row[8] if row[8] else None,
        })
    total_lines=sum(c["total"] for c in characters)
    stats={k:sum(c[k] for c in characters) for k in ("waiting","recorded","checked","added")}
    worked=stats["recorded"]+stats["checked"]+stats["added"]
    status_counts_summary={}
    for c in characters:
        status_counts_summary[c["status"]]=status_counts_summary.get(c["status"],0)+1
    source_label=None
    if "Genel" in wb.sheetnames:
        raw=wb["Genel"]["B4"].value
        if raw: source_label=str(raw)
    result={
        "project":"Marvel Rivals Türkçe Dublaj Projesi",
        "managers":["Efe Karatepe","Hasan Çağın Yıldırım"],
        "sourceWorkbookUpdatedText":source_label,
        "stats":{
            "characters":len(characters),"totalLines":total_lines,**stats,"worked":worked,
            "progress":round(worked/total_lines*100,2) if total_lines else 0,
            "statusCounts":status_counts_summary,
            "assigned":sum(1 for c in characters if c["voiceActor"]),
        },
        "characters":characters,
    }
    comparable_old=dict(existing or {}); comparable_old.pop("generatedAt",None)
    if comparable_old==result and existing and existing.get("generatedAt"):
        result["generatedAt"]=existing["generatedAt"]
    else:
        result["generatedAt"]=dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00","Z")
    return result

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--url",required=True)
    ap.add_argument("--output",default="data/data.json")
    args=ap.parse_args()
    out=Path(args.output); out.parent.mkdir(parents=True,exist_ok=True)
    existing=None
    if out.exists():
        try: existing=json.loads(out.read_text("utf-8"))
        except Exception: pass
    with tempfile.TemporaryDirectory() as td:
        xlsx=Path(td)/"source.xlsx"
        download(args.url,xlsx)
        data=build(xlsx,existing)
    rendered=json.dumps(data,ensure_ascii=False,indent=2)+"\n"
    out.write_text(rendered,encoding="utf-8")
    print(f"Wrote {out}: {data['stats']['characters']} characters, {data['stats']['totalLines']} lines, {data['stats']['progress']}%")

if __name__=="__main__":
    main()
