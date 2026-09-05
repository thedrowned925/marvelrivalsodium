#!/usr/bin/env python3
"""Content-address page scripts/styles, preserving relative CSS asset URLs."""
import hashlib,json,re,os
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
HASHED=re.compile(r'\.[a-f0-9]{12}(?=\.(?:js|css)$)')
def version():
    manifest={};keep=set()
    for page in [ROOT/'index.html',ROOT/'admin/index.html']:
        if not page.exists():continue
        def replace(match):
            prefix,url,suffix=match.groups()
            if re.match(r'(?:https?:)?//',url):return match.group(0)
            logical=HASHED.sub('',url.split('?')[0])
            if not logical.endswith(('.js','.css')):return match.group(0)
            path=(page.parent/logical).resolve()
            if not path.is_relative_to(ROOT):raise ValueError('Nonlocal runtime path')
            data=path.read_bytes();sha=hashlib.sha256(data).hexdigest()
            target=path.with_name(path.stem+'.'+sha[:12]+path.suffix)
            target.write_bytes(data);keep.add(target)
            published=target.relative_to(ROOT).as_posix();href=os.path.relpath(target,page.parent)
            key=path.relative_to(ROOT).as_posix()
            item=manifest.setdefault(key,{'url':published,'sha256':sha,'references':[]})
            item['references'].append({'page':page.relative_to(ROOT).as_posix(),'url':href})
            return prefix+href+suffix
        page.write_text(re.sub(r'((?:src|href)=")([^"<>]+)(")',replace,page.read_text()))
    for logical in manifest:
        p=ROOT/logical
        for old in p.parent.glob(p.stem+'.*'+p.suffix):
            if HASHED.search(old.name) and old not in keep:old.unlink()
    (ROOT/'assets/runtime-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print(f'Versioned {len(manifest)} scripts/styles by content hash.')
if __name__=='__main__':version()
