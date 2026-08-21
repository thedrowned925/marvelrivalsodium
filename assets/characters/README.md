# ODIUM Marvel Rivals — Yerel Karakter Görselleri

Bu klasörler site tarafından doğrudan okunur. Dış CDN/Fandom görseli kullanılmaz.

## Klasörler

- `normal/` — kartın normal, solgun görünen ilk artwork'i.
- `hover/` — masaüstünde karta mouse gelince görünen güçlü/renkli ikinci artwork.
- `detail/` — karakter detay ekranının sağındaki büyük artwork. Bu dosya yoksa `hover/`, o da yoksa `normal/` kullanılır.

## Dosya adı kuralı

Dosya adı karakter slug'ı ile birebir aynı olmalıdır. Örnek:

- `normal/groot.webp`
- `hover/groot.webp`
- `detail/groot.webp`
- `normal/the-punisher.webp`
- `hover/the-punisher.webp`
- `detail/the-punisher.webp`

Desteklenen uzantılar: `.webp`, `.png`, `.jpg`, `.jpeg`.
Öncelik: WebP → PNG → JPG → JPEG.

## Tavsiye edilen görsel ölçüleri

### normal
- 3:4 dikey
- 1200×1600 ideal
- Karakter ortada, baş ve gövde kart içinde kalmalı

### hover
- 3:4 veya 4:5
- 1200×1600 / 1400×1750 ideal
- Fandom Heroes sayfasındaki sarı çerçeveli/güçlü kart artwork'leri için uygun

### detail
- Şeffaf PNG/WebP tavsiye edilir
- 1600×1600 veya daha büyük
- Tam/yarım karakter, mümkün olduğunca güçlü splash artwork

## Fallback

- `normal` yok ama `hover` varsa: hover görseli normal kartta solgun gösterilir.
- `hover` yok ama `normal` varsa: normal görsel hover'da renklenir.
- `detail` yoksa: hover, o da yoksa normal kullanılır.

`FILENAMES.txt` dosyasında 54 karakterin tam dosya isimleri vardır.
