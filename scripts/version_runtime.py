#!/usr/bin/env python3
"""Publish content-addressed scripts/styles so cached releases cannot mix.
Run after runtime edits and before committing/publishing index.html.
Snapshots stay beside the originals, preserving relative CSS asset URLs.
"""
import hashlib,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
HASHED=re.compile(r'\.[a-f0-9]{12}(?=\.(?:js|css)$)')
def version():
    page=ROOT/'index.html';html=page.read_text();manifest={};keep=set()
    def replace(match):
        prefix,url,suffix=match.groups()
        if re.match(r'(?:https?:)?//',url):return match.group(0)
        logical=HASHED.sub('',url.split('?')[0])
        if not logical.endswith(('.js','.css')):return match.group(0)
        path=ROOT/logical
        if not path.resolve().is_relative_to(ROOT):raise ValueError('Nonlocal runtime path')
        data=path.read_bytes();sha=hashlib.sha256(data).hexdigest()
        target=path.with_name(path.stem+'.'+sha[:12]+path.suffix)
        target.write_bytes(data);keep.add(target)
        published=target.relative_to(ROOT).as_posix();manifest[logical]={'url':published,'sha256':sha}
        return prefix+published+suffix
    html=re.sub(r'((?:src|href)=")([^"<>]+)(")',replace,html)
    page.write_text(html)
    # Only generated files beside the canonical files in this page are eligible.
    for logical in manifest:
        p=ROOT/logical
        for old in p.parent.glob(p.stem+'.*'+p.suffix):
            if HASHED.search(old.name) and old not in keep:old.unlink()
    (ROOT/'assets/runtime-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print(f'Versioned {len(manifest)} scripts/styles by content hash.')
if __name__=='__main__':version()
