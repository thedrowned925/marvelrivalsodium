#!/usr/bin/env python3
"""Stage only runtime assets for the isolated Sites preview. GitHub root stays usable."""
import shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'dist'
OUT.mkdir(exist_ok=True)
files=['index.html','styles.css','details.css','rivals-ui.css','popup-v1.css','app.js','character-art.js','audio-v10.js','device-mode-v1.js','popup-v1.js','favicon.svg','.nojekyll']
for name in files:shutil.copy2(ROOT/name,OUT/name)
for name in ['assets','data']:shutil.copytree(ROOT/name,OUT/name,dirs_exist_ok=True)
print('Staged preview assets in dist/')
