#!/usr/bin/env python3
"""Import verified character images from a local StreamHelperAssets checkout.
No runtime hotlinks. Regenerates both the JSON provenance and browser manifest.
Usage: python scripts/import_local_art.py /path/to/StreamHelperAssets
Requires Pillow. Existing verified artwork is retained when a source is absent.
"""
import json, re, sys, unicodedata, subprocess
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
ALIASES={'Capt. America':'Captain America','Dr.Strange':'Doctor Strange','Mr.Fantastic':'Mister Fantastic','Dare Devil':'Daredevil','Jeff':'Jeff the Land Shark','Star Lord':'Star-Lord','Cloak':'Cloak & Dagger','Dagger':'Cloak & Dagger','Phoenix':'Jean Grey'}
def slug(s):return re.sub(r'[^a-z0-9]+','-',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower()).strip('-')
def main():
 source=Path(sys.argv[1]); pack=source/'games/mriv'
 mapping=json.loads((pack/'base_files/config.json').read_text())['character_to_codename']
 revision=subprocess.check_output(['git','rev-parse','HEAD'],cwd=source,text=True).strip()
 target=ROOT/'assets/characters';target.mkdir(exist_ok=True)
 manifest_path=target/'art-manifest.json'
 manifest=json.loads(manifest_path.read_text()) if manifest_path.exists() else {'characters':{}}
 missing=[]
 for c in json.loads((ROOT/'data/data.json').read_text())['characters']:
  name=c['name'];canonical=ALIASES.get(name,name);code=mapping.get(canonical,{}).get('codename')
  entry=manifest['characters'].get(name,{})
  if code:
   for kind,folder,size in [('card','base_files/icon',650),('detail','full',1050)]:
    src=pack/folder/f'file_{code}_0.png'
    if not src.exists():continue
    with Image.open(src) as image:
     image=image.convert('RGBA');bounds=image.getbbox()
     if not bounds:raise ValueError(f'Empty artwork: {src}')
     image=image.crop(bounds);image.thumbnail((size,size),Image.Resampling.LANCZOS)
     dest=target/('cards' if kind=='card' else 'details')/(slug(name)+'.webp');dest.parent.mkdir(exist_ok=True)
     image.save(dest,'WEBP',quality=88,method=6)
     entry[kind]={'file':dest.relative_to(ROOT).as_posix(),'width':image.width,'height':image.height,'source':f'https://github.com/joaorb64/StreamHelperAssets/blob/{revision}/{src.relative_to(source).as_posix()}'}
  manifest['characters'][name]=entry
  if not entry.get('card'):missing.append(name)
 manifest['missing']=missing
 manifest['credits']='Marvel / NetEase game artwork; distributed by StreamHelperAssets, source: https://www.marvelrivals.com/heroes/index.html'
 manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
 (target/'art-manifest.js').write_text('window.ODIUM_ART='+json.dumps(manifest['characters'],ensure_ascii=False,separators=(',',':'))+';\n')
 print(f"Local cards: {len(manifest['characters'])-len(missing)}/{len(manifest['characters'])}. Missing: {', '.join(missing) or 'none'}")
if __name__=='__main__':main()
