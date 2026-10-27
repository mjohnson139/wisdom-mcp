"""One-off importer: splits Project Gutenberg #216 (Legge, 1891) into 81 chapter texts.

Usage: python3 -I scripts/import-legge.py <pg216.txt> <out.json>
"""
import json, re, sys

raw = open(sys.argv[1], encoding="utf-8").read().replace("\r\n", "\n")
body = raw.split("*** START OF")[1].split("*** END OF")[0]
blocks = [b.strip("\n") for b in re.split(r"\n\s*\n\s*\n", body)]

chapters = {}
for block in blocks:
    m = re.match(r"^(?:Ch\. )?(\d+)\.(?:\s|$)", block)
    if not m:
        continue
    n = int(m.group(1))
    if n != len(chapters) + 1:
        raise SystemExit(f"unexpected chapter {n} after {len(chapters)}")
    text = block[m.end():].lstrip("\n")  # keep indentation: it marks verse
    paras = [p for p in re.split(r"\n\s*\n", text) if p.strip()]
    clean = []
    for p in paras:
        if p.startswith("   ") or p.startswith("  '"):  # verse: keep line breaks
            clean.append("\n".join(l.strip() for l in p.splitlines()))
        else:
            p = re.sub(r"^\d+\.\s*", "", p.strip())  # drop Legge's verse numbers
            if p:
                clean.append(" ".join(l.strip() for l in p.splitlines()))
    chapters[n] = "\n\n".join(clean)

if len(chapters) != 81:
    raise SystemExit(f"found {len(chapters)} chapters")
json.dump(chapters, open(sys.argv[2], "w"), indent=1, ensure_ascii=False)
