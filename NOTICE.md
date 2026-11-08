# Notices and credits

## Poem and interpretation data

`data/faals.json` is derived from **HafezFaalDatabase** by Mahmoud Eskandari
(https://github.com/mahmoud-eskandari/HafezFaalDatabase), released under the
**GNU GPL v3**. It holds 495 ghazals of Hafez with a traditional interpretation
for each. `scripts/build-data.py` shows exactly how the upstream file was converted.

Because that data is GPL-3.0, this whole project is distributed under GPL-3.0 too
(see `LICENSE`).

## Short interpretations

The `t2` field (short interpretations, 1-4 paragraphs per ghazal) comes from
**hafez-ghazals-json** by parsasandoughi
(https://github.com/parsasandoughi/hafez-ghazals-json).

- That repository has **no license file**; its README only says the data may be used for
  educational, research or personal use. Confirm with the author before redistributing
  this project publicly or commercially, or remove the field (see below).
- Only the interpretations are used. Its `verses` are not: the two hemistichs of each beyt are
  glued together, and in 114 ghazals the interpretation text leaked into the verse list.
- Its numbering follows the standard Qazvini-Ghani diwan. HafezFaalDatabase orders ghazals
  353-419 differently, so `scripts/build-data.py` re-numbers them by matching the first line.

To ship without this source, rebuild without `--extra`; the interpretation tabs disappear
automatically and nothing else changes.

## Fonts (loaded from CDNs at run time, not bundled)

- Vazirmatn by Saber Rastikerdar (OFL-1.1), via jsDelivr
- Aref Ruqaa by Abdullah Aref and Khaled Hosny (OFL-1.1), via Google Fonts
- Noto Naskh Arabic by Google (OFL-1.1), via Google Fonts
