#!/usr/bin/env python3
"""Stage only runtime assets for the isolated Sites preview. GitHub root stays usable."""
import shutil, re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'dist'
OUT.mkdir(exist_ok=True)
files=['index.html','styles.css','details.css','rivals-ui.css','dossier.css','dossier.js','poster-renderer.js','live-sync.js','feature-tour.js','feature-tour.css','popup-v1.css','app.js','character-art.js','audio-v10.js','device-mode-v1.js','popup-v1.js','favicon.svg','.nojekyll']
files += re.findall(r'(?:src|href)="([^"]+\.[a-f0-9]{12}\.(?:js|css))"',(ROOT/'index.html').read_text())
for name in files:
 target=OUT/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(ROOT/name,target)
for name in ['assets','data']:shutil.copytree(ROOT/name,OUT/name,dirs_exist_ok=True)
print('Staged preview assets in dist/')
