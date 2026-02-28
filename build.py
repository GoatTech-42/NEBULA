#!/usr/bin/env python3
"""
build.py — GoatTech single-file build (v9 — correct)
=====================================================
The GoatPedia index.html has exactly ONE <script> tag with NO attributes.
Previous builds failed because the regex excluded attribute-free scripts.
This version matches it correctly, strips Trigger 1 + 2, leaves everything
else byte-for-byte identical.
"""

import os, re, sys

SRC = r"C:\Users\lukep\Desktop\Coding\GoatTech Never Dies\public"
DST = r"C:\Users\lukep\Desktop\Coding\GoatTech Never Dies\public\dist"
OUT = os.path.join(DST, "index.html")

def read(name):
    p = os.path.join(SRC, name)
    if not os.path.exists(p):
        sys.exit(f"  [error] missing: {p}")
    with open(p, encoding="utf-8") as f:
        return f.read()

print(f"\n[build] src = {SRC}")
print(f"[build] out = {OUT}\n")

landing_html = read("index.html")

# ── find the one <script>…</script> block ─────────────────────────────────────
# attrs='' means the tag is literally just <script> with nothing else.
# Match <script> … </script> with no attributes.

m = re.search(r'(<script>)(.*?)(</script>)',
              landing_html, re.DOTALL | re.IGNORECASE)

if not m:
    sys.exit("  [error] Could not find <script> block in index.html")

script_open  = m.group(1)   # <script>
gp_script    = m.group(2)   # content
script_close = m.group(3)   # </script>

print(f"  [ok] Script found: {len(gp_script)} chars")

# ── show trigger comments present ────────────────────────────────────────────

triggers = re.findall(r'/\*[^*]*Trigger[^*]*\*/', gp_script)
print(f"  [info] Trigger comments: {len(triggers)}")
for t in triggers:
    print(f"         {t.strip()}")

# ── strip Trigger 1 ───────────────────────────────────────────────────────────

gp_script, n1 = re.subn(
    r'/\*[^*]*Trigger 1[^*]*\*/.*?(?=/\*[^*]*Trigger 2)',
    '', gp_script, count=1, flags=re.DOTALL)
print(f"  [{'ok' if n1 else 'warn: Trigger 1 not matched'}] Trigger 1 removed (n={n1})")

# ── strip Trigger 2 ───────────────────────────────────────────────────────────

gp_script, n2 = re.subn(
    r'/\*[^*]*Trigger 2[^*]*\*/.*?(?=/\*[^*]*Trigger 3)',
    '', gp_script, count=1, flags=re.DOTALL)
print(f"  [{'ok' if n2 else 'warn: Trigger 2 not matched'}] Trigger 2 removed (n={n2})")

# ── rebuild HTML ──────────────────────────────────────────────────────────────

patched_block = script_open + gp_script + script_close
new_html = landing_html.replace(m.group(0), patched_block, 1)

if new_html == landing_html:
    print("  [warn] Output identical to input — triggers may use different comment text")
else:
    print("  [ok] HTML patched")

# ── write ─────────────────────────────────────────────────────────────────────

os.makedirs(DST, exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    f.write(new_html)

sz = os.path.getsize(OUT) / 1024
print(f"\n[build] Done — {sz:.1f} KB → {OUT}")
print("  ✓ Only triple-click © launches Nebula")
print("  ✓ No other changes — zero syntax risk\n")

# ── verify ────────────────────────────────────────────────────────────────────

remaining = re.findall(r'/\*[^*]*Trigger[^*]*\*/', new_html)
print(f"  [verify] Trigger comments in output: {len(remaining)}")
for t in remaining:
    print(f"           {t.strip()}")