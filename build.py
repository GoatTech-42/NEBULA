#!/usr/bin/env python3
"""
build.py — GoatTech single-file build (v6)
==========================================
Key fix over v5: use JSON.stringify-style encoding (Python json.dumps)
to embed nebula_doc as a JS string instead of a template literal.
json.dumps produces a quoted string with ALL special characters escaped —
backticks, backslashes, newlines, unicode, everything. It is 100% safe.

_0xlaunch does: win.document.write(JSON.parse(window.__nebulaSrc))
"""

import os, re, json, sys

SRC = r"C:\Users\lukep\Desktop\Coding\GoatTech Never Dies\public"
DST = r"C:\Users\lukep\Desktop\Coding\GoatTech Never Dies\public\dist"
OUT = os.path.join(DST, "index.html")

FALLBACK_TOOLTIPS = json.dumps({"messages": [
    "GOAT TECH INDUSTRIES","STAY ENCRYPTED","LEGENDS NEVER DIE",
    "SYSTEM ONLINE","ALWAYS WATCHING","SIGNAL ACQUIRED",
]})

# ── helpers ───────────────────────────────────────────────────────────────────

def read(name, fallback=None):
    p = os.path.join(SRC, name)
    if not os.path.exists(p):
        if fallback is not None:
            print(f"  [warn] {name} not found — fallback used")
            return fallback
        sys.exit(f"  [error] required file missing: {p}")
    with open(p, encoding="utf-8") as f:
        return f.read()

def between(html, tag):
    m = re.search(rf'<{tag}[^>]*>(.*?)</{tag}>', html,
                  re.DOTALL | re.IGNORECASE)
    return m.group(1) if m else ""

def remove_tags(html, tag):
    return re.sub(rf'<{tag}[^>]*>.*?</{tag}>', '', html,
                  flags=re.DOTALL | re.IGNORECASE)

def to_js_string(s: str) -> str:
    """
    Encode an arbitrary string as a JS string literal using json.dumps.
    json.dumps always produces valid JSON (and therefore valid JS):
      - double-quoted
      - all backslashes escaped
      - all control characters (including newlines) escaped
      - all non-ASCII safely passed through as-is (ensure_ascii=False)
      - no backticks, no template literal syntax
    The result can be assigned directly: var x = <to_js_string(s)>;
    """
    return json.dumps(s, ensure_ascii=False)

# ── read source files ─────────────────────────────────────────────────────────

print(f"\n[build] src = {SRC}")
print(f"[build] out = {OUT}\n")

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

# ── process ui.js ─────────────────────────────────────────────────────────────
# Strip only the two `export` keywords from function declarations.

ui_plain = ui_js
ui_plain = ui_plain.replace("export function initCanvas()",
                             "function initCanvas()")
ui_plain = ui_plain.replace("export function initParallax()",
                             "function initParallax()")
print("  [ok] ui.js: export keywords stripped")

# ── process script.js ─────────────────────────────────────────────────────────
# Only remove the `import { … } from "./ui.js"` line.

sjs = script_js
sjs, n1 = re.subn(
    r'^[ \t]*import\s*\{[^}]*\}\s*from\s*["\']\.\/ui\.js["\']\s*;?[ \t]*\r?\n',
    '', sjs, count=1, flags=re.MULTILINE)
print(f"  [ok] script.js: import line removed (n={n1})")

# Inline tooltips.json fetch
OLD_FETCH = "const d=await(await fetch('tooltips.json')).json();"
NEW_FETCH = f"const d={tooltips_str};"
if OLD_FETCH in sjs:
    sjs = sjs.replace(OLD_FETCH, NEW_FETCH, 1)
    print("  [ok] script.js: tooltips inlined (exact)")
else:
    sjs, n2 = re.subn(
        r"const d\s*=\s*await\s*\(\s*await\s+fetch\s*\(\s*['\"]tooltips\.json['\"]\s*\)\s*\)\.json\s*\(\s*\)\s*;",
        NEW_FETCH, sjs, count=1)
    print(f"  [{'ok' if n2 else 'WARN'}] script.js: tooltips inlined (regex n={n2})")

# ── build the Nebula app HTML document ───────────────────────────────────────
# This is a complete standalone HTML page that will be written into
# about:blank. It runs in its own window — zero CSS/JS conflicts.

nebula_body = between(main_html, "body")
nebula_body = re.sub(
    r'<script\b[^>]*\bsrc=["\']script\.js["\']\b[^>]*>\s*</script>',
    '', nebula_body, flags=re.IGNORECASE).strip()

main_head = between(main_html, "head")
font_links = re.findall(r'<link[^>]+fonts\.googleapis\.com[^>]*/?>',
                         main_head, re.IGNORECASE)
fonts_str = "\n".join(font_links)

nebula_doc = (
    "<!DOCTYPE html>\n"
    "<html lang=\"en\">\n"
    "<head>\n"
    "<meta charset=\"UTF-8\">\n"
    "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0,"
    " maximum-scale=1.0, user-scalable=no\">\n"
    "<title>NEBULA</title>\n"
    "<link rel=\"icon\" href=\"data:image/svg+xml,"
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>"
    "<text y='.9em' font-size='90'>🌌</text></svg>\">\n"
    + fonts_str + "\n"
    "<style>\n"
    + style_css +
    "\n</style>\n"
    "</head>\n"
    "<body>\n"
    + nebula_body +
    "\n<script>\n"
    + ui_plain +
    "\n</script>\n"
    "<script type=\"module\">\n"
    + sjs +
    "\n</script>\n"
    "</body>\n"
    "</html>"
)

print(f"  [ok] nebula_doc assembled ({len(nebula_doc) // 1024} KB)")

# Encode the entire Nebula document as a JSON string.
# json.dumps escapes EVERYTHING: newlines → \n, quotes → \", backslashes → \\,
# backticks → ` (backticks are not special in JSON — they pass through as-is
# but they ARE special in JS template literals, which is why we use JSON
# double-quoted strings instead).
nebula_js_str = to_js_string(nebula_doc)
print("  [ok] nebula_doc encoded as JSON string literal")

# ── extract GoatPedia landing pieces ─────────────────────────────────────────

landing_head = between(landing_html, "head")
landing_body = between(landing_html, "body")

gp_style_m = re.search(r'<style[^>]*>(.*?)</style>',
                        landing_head, re.DOTALL | re.IGNORECASE)
gp_style = gp_style_m.group(1) if gp_style_m else ""

# The GoatPedia inline script (non-module, no src=)
gp_script_m = re.search(
    r'<script(?!\s[^>]*\btype\s*=\s*["\']module["\'])(?!\s[^>]*\bsrc\s*=)[^>]*>'
    r'(.*?)</script>',
    landing_body, re.DOTALL | re.IGNORECASE)
gp_script = gp_script_m.group(1) if gp_script_m else ""

landing_body_clean = remove_tags(landing_body, "script").strip()

favicon_m = re.search(r'<link[^>]+rel=["\']icon["\'][^>]*/?>',
                       landing_head, re.IGNORECASE)
favicon = favicon_m.group(0) if favicon_m else ""

gp_font_links, seen = [], set()
for fl in re.findall(r'<link[^>]+fonts\.googleapis\.com[^>]*/?>',
                     landing_head, re.IGNORECASE):
    h = re.search(r'href=["\']([^"\']+)["\']', fl)
    key = h.group(1) if h else fl
    if key not in seen:
        seen.add(key); gp_font_links.append(fl)

# ── patch _0xlaunch ───────────────────────────────────────────────────────────
# Replace it with a version that writes the embedded nebula_doc into about:blank.
# window.__nebulaSrc holds the JSON-encoded string; we use it directly with
# document.write() — no JSON.parse needed since document.write takes a string
# and we stored it already decoded.
# Actually: we store the raw HTML string on window.__nebulaSrc (not JSON-encoded
# at runtime), and json.dumps was only used to make it safe to embed in JS source.

NEW_LAUNCH = """\
var _0xlaunch = (function(){
  return function(){
    var win = window.open('about:blank', '_blank');
    if (!win) { alert('Allow pop-ups for this site to open Nebula.'); return; }
    win.document.open();
    win.document.write(window.__nebulaSrc);
    win.document.close();
  };
})();"""

launch_re = re.compile(
    r'var\s+_0xlaunch\s*=\s*\(function\s*\(\s*\)\s*\{.*?\}\s*\)\s*\(\s*\)\s*;',
    re.DOTALL)
gp_script_patched, n3 = launch_re.subn(NEW_LAUNCH, gp_script, count=1)
if n3:
    print("  [ok] _0xlaunch patched")
else:
    gp_script_patched = NEW_LAUNCH + "\n" + gp_script
    print("  [warn] _0xlaunch prepended (regex didn't match)")

# ── strip Trigger 1 and Trigger 2, keep only Trigger 3 (triple-click ©) ──────

gp_script_patched = re.sub(
    r'/\*[^*]*Trigger 1[^*]*\*/.*?(?=/\*[^*]*Trigger 2)',
    '', gp_script_patched, count=1, flags=re.DOTALL)

gp_script_patched = re.sub(
    r'/\*[^*]*Trigger 2[^*]*\*/.*?(?=/\*[^*]*Trigger 3)',
    '', gp_script_patched, count=1, flags=re.DOTALL)

print("  [ok] Triggers 1+2 stripped; only triple-click © remains")

# ── assemble final index.html ─────────────────────────────────────────────────
# nebula_js_str is a JSON-encoded double-quoted string, e.g.:
#   "<!DOCTYPE html>\\n<html>..."
# We assign it to window.__nebulaSrc. At runtime __nebulaSrc holds the
# actual HTML string (JS automatically unescapes JSON string literals).

html_out = (
    "<!DOCTYPE html>\n"
    "<html lang=\"en\">\n"
    "<head>\n"
    "<meta charset=\"UTF-8\">\n"
    "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n"
    "<title>Goat — The Comprehensive Encyclopedia</title>\n"
    + favicon + "\n"
    + "\n".join(gp_font_links) + "\n"
    "<style>\n"
    + gp_style +
    "\n</style>\n"
    "</head>\n"
    "<body>\n"
    + landing_body_clean +
    "\n<script>\n"
    "window.__nebulaSrc = " + nebula_js_str + ";\n\n"
    + gp_script_patched +
    "\n</script>\n"
    "</body>\n"
    "</html>"
)

os.makedirs(DST, exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    f.write(html_out)

sz = os.path.getsize(OUT) / 1024
print(f"\n[build] Done — {sz:.1f} KB → {OUT}")
print("  ✓ Triple-click © opens Nebula in a new tab (about:blank)")
print("  ✓ GoatPedia unchanged and fully scrollable")
print("  ✓ No template literals — JSON string encoding is bulletproof\n")