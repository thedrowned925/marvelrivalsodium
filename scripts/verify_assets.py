#!/usr/bin/env python3
"""Fail before publishing if any roster artwork, JSON detail or audio is missing."""
import json, re, hashlib
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
data=json.loads((ROOT/'data/data.json').read_text())
art=json.loads((ROOT/'assets/characters/art-manifest.json').read_text())['characters']
errors=[]
for c in data['characters']:
 for kind in ['card','detail']:
  item=art.get(c['name'],{}).get(kind)
  if not item:errors.append(f"{c['name']}: missing {kind}");continue
  try:
   p=ROOT/item['file']
   if not p.resolve().is_relative_to(ROOT/'assets/characters'):raise ValueError('Nonlocal artwork')
   with Image.open(p) as image:
    image.verify()
   with Image.open(p) as image:
    assert image.width==item['width'] and image.height==item['height']
  except Exception as e:errors.append(f"{c['name']} {kind}: {e}")
 path=c.get('detailPath')
 if path:
  try:assert isinstance(json.loads((ROOT/path).read_text())['rows'],list)
  except Exception as e:errors.append(f"{c['name']} data: {e}")
for audio in re.findall(r"(?:hover|detail):'([^']+\.wav)'",(ROOT/'audio-v10.js').read_text()):
 if not (ROOT/'assets/audio'/audio).is_file():errors.append('Missing audio '+audio)
design=json.loads((ROOT/'assets/design/hero-design.json').read_text())
if set(design)!=set(c['name'] for c in data['characters']):errors.append('Hero design roster mismatch')
for name,profile in design.items():
 for kind in ['portrait','card','emblem']:
  path=profile.get(kind)
  if kind=='emblem' and not path:continue
  try:
   assert path and (ROOT/path).resolve().is_relative_to(ROOT/'assets')
   with Image.open(ROOT/path) as image:image.verify()
  except Exception as e:errors.append(f'{name} design {kind}: {e}')
for font in ['BebasNeue-Regular.ttf','Barlow-Regular.ttf']:
 if not (ROOT/'assets/design/fonts'/font).is_file():errors.append('Missing local font '+font)
runtime=json.loads((ROOT/'assets/runtime-manifest.json').read_text())
page=(ROOT/'index.html').read_text()
for logical,item in runtime.items():
 try:
  source=(ROOT/logical).read_bytes();published=(ROOT/item['url']).read_bytes()
  assert source==published and hashlib.sha256(published).hexdigest()==item['sha256']
  assert '"'+item['url']+'"' in page
 except Exception as e:errors.append(f'{logical}: stale runtime snapshot; run scripts/version_runtime.py ({e})')
if errors:raise SystemExit('\n'.join(errors))
print(f"PASS: {len(data['characters'])} characters, {2*len(data['characters'])} local artwork references, character datasets, all voice tracks.")
