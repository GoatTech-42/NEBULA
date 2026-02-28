#!/usr/bin/env python3
"""
build.py — GoatTech single-file build (v10)
============================================
The _0xlaunch function decodes _k (a char-code array) to get "main.html"
then tries to load it via an iframe src — which 404s from about:blank.

Fix: replace the _k array with the full encoded Nebula HTML document,
and replace the iframe-src approach with a direct document.write.

The _0xlaunch function becomes:
    var _k = [/* char codes of full nebula HTML */];
    return function(){
        var win = window.open('about:blank','_blank');
        if(!win) return;
        var html = _k.map(function(c){return String.fromCharCode(c);}).join('');
        win.document.open();
        win.document.write(html);
        win.document.close();
    };

We keep the char-code obfuscation style to match the original.
The only thing that changes inside _0xlaunch is _k and the write logic.
Everything else (trigger, starfield, etc.) is untouched.
"""

import os, re, sys, json

SRC = r"C:\Users\lukep\Desktop\Coding\GoatTech Never Dies\public"
DST = r"C:\Users\lukep\Desktop\Coding\GoatTech Never Dies\public\dist"
OUT = os.path.join(DST, "index.html")

FALLBACK_TOOLTIPS = json.dumps({"messages": [
    "GOAT TECH INDUSTRIES","STAY ENCRYPTED","LEGENDS NEVER DIE",
    "SYSTEM ONLINE","ALWAYS WATCHING","SIGNAL ACQUIRED",
]})

def read(name, fallback=None):
    p = os.path.join(SRC, name)
    if not os.path.exists(p):
        if fallback is not None:
            print(f"  [warn] {name} missing — fallback"); return fallback
        sys.exit(f"  [error] missing: {p}")
    with open(p, encoding="utf-8") as f:
        return f.read()

def between(html, tag):
    m = re.search(rf'<{tag}[^>]*>(.*?)</{tag}>', html,
                  re.DOTALL | re.IGNORECASE)
    return m.group(1) if m else ""

print(f"\n[build] src = {SRC}")
print(f"[build] out = {OUT}\n")

# ── read all source files ─────────────────────────────────────────────────────

landing_html = read("index.html")
main_html    = read("main.html")
style_css    = read("style.css")
script_js    = read("script.js")
ui_js        = read("ui.js")

try:
    tooltips = json.loads(read("tooltips.json", FALLBACK_TOOLTIPS))
except json.JSONDecodeError:
    tooltips = json.loads(FALLBACK_TOOLTIPS)
    print("  [warn] tooltips.json invalid — fallback")
tooltips_str = json.dumps(tooltips, ensure_ascii=False)

# ── process ui.js — strip export keywords only ───────────────────────────────

ui_plain = ui_js
ui_plain = ui_plain.replace("export function initCanvas()",
                             "function initCanvas()")
ui_plain = ui_plain.replace("export function initParallax()",
                             "function initParallax()")
print("  [ok] ui.js: exports stripped")

# ── process script.js — remove import line only ──────────────────────────────

sjs = script_js
sjs, n1 = re.subn(
    r'^[ \t]*import\s*\{[^}]*\}\s*from\s*["\']\.\/ui\.js["\']\s*;?[ \t]*\r?\n',
    '', sjs, count=1, flags=re.MULTILINE)
print(f"  [ok] script.js: import removed (n={n1})")

# Inline tooltips
OLD_FETCH = "const d=await(await fetch('tooltips.json')).json();"
if OLD_FETCH in sjs:
    sjs = sjs.replace(OLD_FETCH, f"const d={tooltips_str};", 1)
    print("  [ok] tooltips inlined (exact)")
else:
    sjs, n2 = re.subn(
        r"const d\s*=\s*await\s*\(\s*await\s+fetch\s*\(\s*['\"]tooltips\.json['\"]\s*\)\s*\)\.json\s*\(\s*\)\s*;",
        f"const d={tooltips_str};", sjs, count=1)
    print(f"  [{'ok' if n2 else 'WARN'}] tooltips inlined (regex n={n2})")

# ── build the full Nebula HTML document ──────────────────────────────────────

nebula_body = between(main_html, "body")
nebula_body = re.sub(
    r'<script\b[^>]*\bsrc=["\']script\.js["\']\b[^>]*>\s*</script>',
    '', nebula_body, flags=re.IGNORECASE).strip()

main_head  = between(main_html, "head")
font_links = re.findall(r'<link[^>]+fonts\.googleapis\.com[^>]*/?>',
                         main_head, re.IGNORECASE)

nebula_doc = "\n".join([
    "<!DOCTYPE html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1.0,'
        'maximum-scale=1.0,user-scalable=no">',
    "<title>NEBULA</title>",
    # Favicon using HTML entity to avoid quote issues
    "<link rel=\"icon\" href=\"data:image/svg+xml,"
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>"
        "<text y='.9em' font-size='90'>&#127756;</text></svg>\">",
    "\n".join(font_links),
    "<style>",
    style_css,
    "</style>",
    "</head>",
    "<body>",
    nebula_body,
    "<script>",
    ui_plain,
    "</script>",
    '<script type="module">',
    sjs,
    "</script>",
    "</body>",
    "</html>",
])

print(f"  [ok] nebula_doc assembled ({len(nebula_doc)//1024} KB)")

# ── encode nebula_doc as a JS char-code array ─────────────────────────────────
# Encode to UTF-8 bytes, then represent each byte as a char code.
# This matches the obfuscation style already used in _0xlaunch.
# We use UTF-8 byte values and String.fromCharCode — for ASCII content
# (which HTML/CSS/JS all are) this is identical to Unicode code points.

nebula_bytes  = nebula_doc.encode("utf-8")
char_codes    = list(nebula_bytes)
print(f"  [ok] encoded as {len(char_codes)} char codes")

# Format the array as lines of 20 numbers each for readability
lines = []
for i in range(0, len(char_codes), 20):
    lines.append(",".join(str(c) for c in char_codes[i:i+20]))
k_array = "[\n" + ",\n".join(lines) + "\n]"

# ── build the replacement _0xlaunch ──────────────────────────────────────────

NEW_LAUNCH = (
    "var _0xlaunch=(function(){\n"
    "    var _k=" + k_array + ";\n"
    "    return function(){\n"
    "        var win=window.open('about:blank','_blank'); if(!win)return;\n"
    "        var html=_k.map(function(c){return String.fromCharCode(c);}).join('');\n"
    "        win.document.open();\n"
    "        win.document.write(html);\n"
    "        win.document.close();\n"
    "    };\n"
    "})();"
)

print(f"  [ok] _0xlaunch replacement built")

# ── patch the GoatPedia script ────────────────────────────────────────────────

m = re.search(r'<script>(.*?)</script>', landing_html,
              re.DOTALL | re.IGNORECASE)
if not m:
    sys.exit("  [error] <script> block not found in index.html")

gp_script = m.group(1)
print(f"  [ok] GoatPedia script found ({len(gp_script)} chars)")

# Replace _0xlaunch declaration
launch_re = re.compile(
    r'var\s+_0xlaunch\s*=\s*\(function\s*\(\s*\)\s*\{.*?\}\s*\)\s*\(\s*\)\s*;',
    re.DOTALL)
gp_script, n3 = launch_re.subn(NEW_LAUNCH, gp_script, count=1)
if n3:
    print("  [ok] _0xlaunch replaced")
else:
    sys.exit("  [error] _0xlaunch not matched — check source")

# ── assemble and write output ─────────────────────────────────────────────────

new_html = landing_html.replace(
    m.group(0),
    "<script>" + gp_script + "</script>",
    1)

os.makedirs(DST, exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    f.write(new_html)

sz = os.path.getsize(OUT) / 1024
print(f"\n[build] Done — {sz:.1f} KB → {OUT}")
print("  ✓ Triple-click © opens Nebula in new tab")
print("  ✓ Nebula HTML fully embedded as char-code array")
print("  ✓ No fetch/iframe/404 risk — self-contained\n")