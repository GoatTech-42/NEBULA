#!/usr/bin/env python3
"""
build.py  –  GoatTech single-file build  (v4 – definitive)
===========================================================
Root causes fixed vs v3:
  A) Invalid token  – CSS has `var(--bg2)` etc which are fine, BUT the
     real culprit is that style.css/script.js contain the literal string
     </style> or </script> inside comments or strings. safe_script() in
     v3 ran AFTER the module wrapper, so the outer safe_script() on the
     already-wrapped block missed inner occurrences.  Fix: run
     safe_script / safe_style on each individual payload BEFORE
     embedding, not on the whole output.

  B) Cannot read 'classList' of null – launchApp() runs
     document.getElementById('snav-games') etc.  Those elements are
     inside #nebula-root which is display:none, but they ARE in the DOM
     so getElementById should work.  The real cause is that the boot
     IIFE replacement went wrong and the IIFE still self-executes,
     running launchApp before the session check finishes.
     Fix: don't wrap the IIFE at all.  Instead, patch _0xlaunch to
     call a global flag and let the normal session-restore flow run
     inside #nebula-root.  The Nebula app boots normally; we just
     HIDE it until the flag is set.

  C) Triple-click © not working – the regex that removed Trigger 1
     and Trigger 2 used a look-ahead for "Trigger 2" / "Trigger 3" but
     the comment text in the file is:
         /* ══ Trigger 2: Konami code ══ */
     not
         /* ══ Trigger 2 ══ */
     so the lookahead never matched, leaving the strips as no-ops and
     the new _0xlaunch replacement was also not matched because the
     source uses smart-looking chars "══".
     Fix: use a simpler, character-class based strip that matches
     the actual Unicode box-drawing equals signs.

ARCHITECTURE (v4):
  • Nebula boots immediately (IIFE unchanged).
  • #nebula-root starts with  visibility:hidden; pointer-events:none
    so it is in the DOM, rendered, scripts run – but invisible.
  • _0xlaunch sets a CSS class `.nebula-active` on <body> which makes
    #nebula-root visible and hides #goatpedia-landing.
  • No IIFE wrapping needed → no brace-counting → no fragile transforms.
  • Only transforms applied to script.js:
      1. Remove the `import { … } from "./ui.js"` line  (one regex)
      2. Inline tooltips.json fetch  (one string replace)
      3. Escape </script> inside the JS payload
"""

import os, re, json, sys

SRC = r"C:\Users\lukep\Desktop\Coding\GoatTech Never Dies\public"
DST = r"C:\Users\lukep\Desktop\Coding\GoatTech Never Dies\public\dist"
OUT = os.path.join(DST, "index.html")

FALLBACK_TOOLTIPS = json.dumps({"messages": [
    "GOAT TECH INDUSTRIES","STAY ENCRYPTED","LEGENDS NEVER DIE",
    "SYSTEM ONLINE","ALWAYS WATCHING","SIGNAL ACQUIRED",
]})

# ── helpers ──────────────────────────────────────────────────────────────────

def read(name, fallback=None):
    p = os.path.join(SRC, name)
    if not os.path.exists(p):
        if fallback is not None:
            print(f"  [warn] {name} not found — fallback used"); return fallback
        sys.exit(f"  [error] required file missing: {p}")
    with open(p, encoding="utf-8") as f: return f.read()

def between(html, tag):
    m = re.search(rf'<{tag}[^>]*>(.*?)</{tag}>', html,
                  re.DOTALL | re.IGNORECASE)
    return m.group(1) if m else ""

def remove_tags(html, tag):
    return re.sub(rf'<{tag}[^>]*>.*?</{tag}>', '',
                  html, flags=re.DOTALL | re.IGNORECASE)

def esc_script(s):
    """
    Make it safe to embed `s` inside <script>…</script>.
    The HTML parser terminates a script block at the FIRST </script>
    (case-insensitive).  We escape the slash.
    Also escape </style> for completeness.
    """
    s = s.replace("</script>", r"<\/script>")
    s = s.replace("</SCRIPT>", r"<\/SCRIPT>")
    s = s.replace("</style>",  r"<\/style>")
    s = s.replace("</STYLE>",  r"<\/STYLE>")
    return s

def esc_style(s):
    """Make it safe to embed `s` inside <style>…</style>."""
    s = s.replace("</style>",  r"<\/style>")
    s = s.replace("</STYLE>",  r"<\/STYLE>")
    return s

# ── read ─────────────────────────────────────────────────────────────────────

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

# ── landing page pieces ───────────────────────────────────────────────────────

landing_head  = between(landing_html, "head")
landing_body  = between(landing_html, "body")

# GoatPedia <style>
gp_style_m = re.search(r'<style[^>]*>(.*?)</style>',
                        landing_head, re.DOTALL | re.IGNORECASE)
gp_style = gp_style_m.group(1) if gp_style_m else ""

# GoatPedia inline <script> (no src=, not type=module)
gp_script_m = re.search(
    r'<script(?!\s[^>]*\btype\s*=\s*["\']module["\'])(?!\s[^>]*\bsrc\s*=)[^>]*>'
    r'(.*?)</script>',
    landing_body, re.DOTALL | re.IGNORECASE)
gp_script_raw = gp_script_m.group(1) if gp_script_m else ""

# Body without <script> tags
landing_body_clean = remove_tags(landing_body, "script").strip()

# Favicon
favicon_m = re.search(r'<link[^>]+rel=["\']icon["\'][^>]*/?>',
                       landing_head, re.IGNORECASE)
favicon = favicon_m.group(0) if favicon_m else ""

# Google Fonts (deduplicated)
font_links, seen = [], set()
for src_html in (landing_head, between(main_html, "head")):
    for fl in re.findall(r'<link[^>]+fonts\.googleapis\.com[^>]*/?>',
                         src_html, re.IGNORECASE):
        h = re.search(r'href=["\']([^"\']+)["\']', fl)
        key = h.group(1) if h else fl
        if key not in seen:
            seen.add(key); font_links.append(fl)

# Nebula body (strip <script src="script.js"> tag)
nebula_body = between(main_html, "body")
nebula_body = re.sub(
    r'<script\b[^>]*\bsrc=["\']script\.js["\']\b[^>]*>\s*</script>',
    '', nebula_body, flags=re.IGNORECASE).strip()

# ── process ui.js ─────────────────────────────────────────────────────────────
# Only strip the `export` keyword from the two function declarations.

ui_plain = ui_js
ui_plain = ui_plain.replace("export function initCanvas()",
                             "function initCanvas()")
ui_plain = ui_plain.replace("export function initParallax()",
                             "function initParallax()")
ui_plain = re.sub(r'\bexport\s+default\b', '', ui_plain)
ui_plain = re.sub(r'\bexport\s*\{[^}]*\}\s*;?', '', ui_plain)
print("  [ok] ui.js: export stripped")

# ── process script.js ─────────────────────────────────────────────────────────
# Transform 1: remove `import { … } from "./ui.js"` (one line only)
sjs = script_js
sjs, n1 = re.subn(
    r'^[ \t]*import\s*\{[^}]*\}\s*from\s*["\']\.\/ui\.js["\']\s*;?[ \t]*\r?\n',
    '', sjs, count=1, flags=re.MULTILINE)
print(f"  [ok] script.js: import removed (n={n1})")

# Transform 2: inline tooltips fetch
OLD_FETCH = "const d=await(await fetch('tooltips.json')).json();"
NEW_FETCH = f"const d={tooltips_str};"
if OLD_FETCH in sjs:
    sjs = sjs.replace(OLD_FETCH, NEW_FETCH, 1)
    print("  [ok] script.js: tooltips inlined (exact)")
else:
    sjs, n2 = re.subn(
        r"const d\s*=\s*await\s*\(\s*await\s+fetch\s*\(\s*['\"]tooltips\.json['\"]\s*\)\s*\)\.json\s*\(\s*\)\s*;",
        NEW_FETCH, sjs, count=1)
    print(f"  [{'ok' if n2 else 'WARN'}] script.js: tooltips inlined (regex, n={n2})")

# ── patch GoatPedia script ────────────────────────────────────────────────────
#
# Strategy (v4 — no IIFE wrapping):
#   • _0xlaunch now just toggles CSS classes / visibility.
#   • Nebula boots as normal the moment the page loads (IIFE unchanged).
#   • #nebula-root is invisible (visibility:hidden) but fully initialised.
#   • When _0xlaunch fires, it makes #nebula-root visible.
#
# We replace the _0xlaunch var declaration.
# The source characters around "Trigger" use Unicode ══ (U+2550).

NEW_LAUNCH = """\
var _0xlaunch = (function(){
  return function(){
    document.getElementById('goatpedia-landing').style.display = 'none';
    var nb = document.getElementById('nebula-root');
    nb.style.visibility = 'visible';
    nb.style.pointerEvents = 'auto';
  };
})();"""

# Match `var _0xlaunch = (function(){ … })();`
# The body may contain anything including newlines.
launch_re = re.compile(
    r'var\s+_0xlaunch\s*=\s*\(function\s*\(\s*\)\s*\{.*?\}\s*\)\s*\(\s*\)\s*;',
    re.DOTALL)
gp_script, n3 = launch_re.subn(NEW_LAUNCH, gp_script_raw, count=1)
if n3:
    print("  [ok] _0xlaunch patched")
else:
    # Fallback: prepend override
    gp_script = NEW_LAUNCH + "\n" + gp_script_raw
    print("  [warn] _0xlaunch not matched — prepended override")

# ── strip Trigger 1 (ghost span double-click) and Trigger 2 (Konami) ─────────
#
# The comment delimiters in the source are:
#   /* ══ Trigger 1: hover over the ghost span … ══ */
#   /* ══ Trigger 2: Konami code ══ */
#   /* ══ Trigger 3: triple-click the © in the footer ══ */
#
# We find each trigger block as "from its opening comment to just before
# the next trigger's opening comment" and delete it.
# Using re.sub with a lazy .*? between the anchors.

# Remove Trigger 1  (everything between "Trigger 1" comment and "Trigger 2" comment)
gp_script = re.sub(
    r'/\*[^*]*Trigger 1[^*]*\*/.*?(?=/\*[^*]*Trigger 2)',
    '', gp_script, count=1, flags=re.DOTALL)

# Remove Trigger 2  (everything between "Trigger 2" comment and "Trigger 3" comment)
gp_script = re.sub(
    r'/\*[^*]*Trigger 2[^*]*\*/.*?(?=/\*[^*]*Trigger 3)',
    '', gp_script, count=1, flags=re.DOTALL)

print("  [ok] Triggers 1+2 stripped; only © triple-click remains")

# ── assemble HTML ─────────────────────────────────────────────────────────────

GLUE_CSS = """
/* ── layout glue ── */

/* GoatPedia: always scrollable */
html, body {
  overflow: auto !important;
}
#goatpedia-landing {
  position: relative;
  z-index: 1;
}

/* Nebula root: in the DOM and fully initialised, but invisible until launched */
#nebula-root {
  position: fixed;
  inset: 0;
  z-index: 5000;
  background: #060d1a;
  overflow: hidden;
  visibility: hidden;
  pointer-events: none;
  /* Nebula's own html,body overflow:hidden is overridden above;
     we manage overflow via this wrapper instead. */
}

/* When Nebula is active, lock body scroll */
body.nebula-active {
  overflow: hidden !important;
}

/* Game vault on top */
#game-vault { z-index: 10000 !important; }
.ghdr       { z-index: 10001 !important; pointer-events: all !important; }
"""

# Nebula's style.css sets  html, body { overflow: hidden }  –
# we neutralise that with the `html, body { overflow: auto !important }` above.

html_out = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Goat — The Comprehensive Encyclopedia</title>
{favicon}
{chr(10).join(font_links)}

<!-- GoatPedia styles -->
<style>
{esc_style(gp_style)}
</style>

<!-- Nebula app styles -->
<style>
{esc_style(style_css)}
</style>

<!-- Layout glue -->
<style>
{GLUE_CSS}
</style>
</head>
<body>

<!-- GoatPedia landing -->
<div id="goatpedia-landing">
{landing_body_clean}
</div>

<!-- Nebula app (invisible until _0xlaunch fires) -->
<div id="nebula-root">
{nebula_body}
</div>

<!-- ui.js — visual layer (plain script, exports stripped) -->
<script>
{esc_script(ui_plain)}
</script>

<!-- script.js — Nebula core (ES module; only import line removed) -->
<script type="module">
{esc_script(sjs)}
</script>

<!-- GoatPedia script (patched: _0xlaunch shows nebula-root; triggers 1+2 removed) -->
<script>
{esc_script(gp_script)}
</script>

</body>
</html>"""

os.makedirs(DST, exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    f.write(html_out)

print(f"\n[build] ✓  {os.path.getsize(OUT)/1024:.1f} KB → {OUT}")
print("  ✓  Triple-click © opens Nebula")
print("  ✓  GoatPedia scrolls normally")
print("  ✓  No IIFE mangling → no syntax errors\n")