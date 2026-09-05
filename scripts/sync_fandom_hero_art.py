#!/usr/bin/env python3
"""Compatibility entrypoint for the existing art workflow.

Keep valid committed artwork. Restore missing/corrupt assets only from the exact
verified provenance manifest; never guess Fandom filenames or hotlink at runtime.
Use --refresh to intentionally redownload all registered artwork.
"""
import io, json, sys, urllib.request, concurrent.futures
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/'assets/characters/art-manifest.json'
def valid(path):
 try:
  with Image.open(path) as image:image.verify()
  return True
 except Exception:return False
def restore(job):
 name,kind,item=job
 if not item:return f'{name}: no verified {kind} source registered'
 target=ROOT/item['file']
 if not target.resolve().is_relative_to(ROOT/'assets/characters'):return f'{name}: invalid asset path'
 if '--refresh' not in sys.argv and valid(target):return None
 source=item['source'].replace('https://github.com/','https://raw.githubusercontent.com/').replace('/blob/','/')
 try:
  with urllib.request.urlopen(source,timeout=25) as response:raw=response.read()
  with Image.open(io.BytesIO(raw)) as image:
   image=image.convert('RGBA');box=image.getbbox()
   if not box:raise ValueError('Empty image')
   image=image.crop(box);size=650 if kind=='card' else 1050;image.thumbnail((size,size),Image.Resampling.LANCZOS)
   target.parent.mkdir(parents=True,exist_ok=True);temp=target.with_suffix('.tmp');image.save(temp,'WEBP',quality=88,method=4);temp.replace(target)
   item.update(width=image.width,height=image.height)
  return None
 except Exception as e:return f'{name} {kind}: {e}'
def main():
 manifest=json.loads(MANIFEST.read_text());art=manifest['characters'];roster=json.loads((ROOT/'data/data.json').read_text())['characters']
 jobs=[(c['name'],kind,art.get(c['name'],{}).get(kind)) for c in roster for kind in ['card','detail']]
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:errors=[e for e in pool.map(restore,jobs) if e]
 MANIFEST.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
 (MANIFEST.parent/'art-manifest.js').write_text('window.ODIUM_ART='+json.dumps(art,ensure_ascii=False,separators=(',',':'))+';\n')
 if errors:raise SystemExit('\n'.join(errors))
 print(f'{len(jobs)} verified local artwork files ready')
if __name__=='__main__':main()
