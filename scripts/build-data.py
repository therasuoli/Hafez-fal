#!/usr/bin/env python3
"""Build data/faals.json from upstream sources.

Sources
  1. Faals.json  - https://github.com/mahmoud-eskandari/HafezFaalDatabase (GPL-3.0)
                   -> ghazal text (hemistichs) and the traditional interpretation ("t")
  2. hafez_ghazals.json (optional) - https://github.com/parsasandoughi/hafez-ghazals-json
                   -> only the short interpretation ("t2", a list of paragraphs).
                   Its "verses" are NOT used: hemistichs are glued together and in many
                   ghazals the interpretation text leaked into the verse list.

Usage:
  python3 scripts/build-data.py Faals.json [--extra hafez_ghazals.json] [-o data/faals.json]

Numbering
  Faals.json orders ghazals 353-418 differently from the standard Qazvini-Ghani diwan
  (e.g. "من ترک عشق شاهد و ساغر نمی‌کنم" is no. 353 there, but sits at 384 in Faals.json).
  hafez_ghazals.json follows the standard order, so when --extra is given every ghazal is
  re-numbered to the standard order by matching its first line.

Output (array; index + 1 == ghazal number in the diwan):
  {"id": 1, "v": ["hemistich", ...], "t": "interpretation", "t2": ["paragraph", ...]}
"""
import argparse
import difflib
import json
import pathlib
import re
import sys

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument("faals", type=pathlib.Path)
ap.add_argument("--extra", type=pathlib.Path, help="hafez_ghazals.json for the second interpretation")
ap.add_argument("-o", "--out", type=pathlib.Path, default=pathlib.Path("data/faals.json"))
args = ap.parse_args()

norm = lambda s: re.sub(r"[\s‌]+", "", s).replace("ي", "ی").replace("ك", "ک")

raw = json.loads(args.faals.read_text(encoding="utf-8"))
extra = json.loads(args.extra.read_text(encoding="utf-8")) if args.extra else None
if extra is not None and len(extra) != len(raw):
    sys.exit(f"error: {len(raw)} ghazals in Faals.json but {len(extra)} in the extra file")

def first_line(item):
    return [l for l in item["poem"].replace("\r", "").split("\n") if l.strip()][0]

# order[i] = index in Faals.json of the ghazal that has standard number i + 1
order = list(range(len(raw)))
moved = []
if extra is not None:
    old_first = [norm(first_line(o))[:25] for o in raw]
    for i, e in enumerate(extra):
        key = norm(e["verses"][0])[:25]
        if key[:14] == old_first[i][:14]:
            continue
        best = max(range(len(raw)), key=lambda j: difflib.SequenceMatcher(None, key, old_first[j]).ratio())
        score = difflib.SequenceMatcher(None, key, old_first[best]).ratio()
        if best != i and score < 0.8:
            sys.exit(f"error: cannot match ghazal {i + 1} (best {best + 1}, score {score:.2f})")
        order[i] = best
        if best != i:
            moved.append((i + 1, best + 1))
    if sorted(order) != list(range(len(raw))):
        sys.exit("error: re-numbering is not a permutation")
    if moved:
        print(f"re-numbered {len(moved)} ghazals to the standard order (e.g. {moved[0][1]} -> {moved[0][0]})")

result = []
for i in range(len(raw)):
    item = raw[order[i]]
    lines = [l.strip() for l in item["poem"].replace("\r", "").split("\n") if l.strip()]
    if len(lines) % 2:
        print(f"warning: ghazal {i + 1} has an odd number of hemistichs ({len(lines)})", file=sys.stderr)
    entry = {"id": i + 1, "v": lines, "t": " ".join(item["interpretation"].split())}
    if extra is not None:
        paragraphs = [" ".join(p.split()) for p in extra[i]["interpretation"].splitlines()]
        entry["t2"] = [p for p in paragraphs if p]
    result.append(entry)

args.out.parent.mkdir(parents=True, exist_ok=True)
args.out.write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(f"wrote {len(result)} ghazals to {args.out}")
