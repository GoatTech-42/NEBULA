#!/usr/bin/env python3
"""
build.py — Single-file build for GoatTech Never Dies.
Reads from: C:\\Users\\lukep\\Desktop\\Coding\\GoatTech Never Dies\\public
Writes to:  C:\\Users\\lukep\\Desktop\\Coding\\GoatTech Never Dies\\public\\dist\\index.html

Strategy (no regex surgery on JS):
  1. Inline CSS into <style> tags.
  2. Keep the Nebula app HTML hidden under #nebula-root.
  3. Patch _0xlaunch in the GoatPedia script so it reveals #nebula-root instead
     of opening a new window — done with a simple string replacement, not regex.
  4. Inline ui.js as a plain <script> (export keywords stripped with two simple
     str.replace calls — no regex DOTALL madness).
  5. Inline script.js as a <script type="module"> with only the import line
     removed — the rest of the file is left byte-for-byte identical so no
     syntax errors can be introduced.
  6. Patch the session-restore IIFE inside the module so it only runs when
     window.__bootNebula() is called (single targeted string replacement).
"""

import os, sys, re, json

# ── Paths ─────────────────────────────────────────────────────────────────────
SRC = r"C:\Users\lukep\Desktop\Coding\GoatTech Never Dies\public"
DST = r"C:\Users\lukep\Desktop\Coding\GoatTech Never Dies\public\dist"
OUT = os.path.join(DST, "index.html")

FALLBACK_TOOLTIPS = json.dumps({"messages": [
    "GOAT TECH INDUSTRIES", "STAY ENCRYPTED", "LEGENDS NEVER DIE",
    "SYSTEM ONLINE", "ALWAYS WATCHING", "SIGNAL ACQUIRED",
]})

# ── Helpers ───────────────────────────────────────────────────────────��───────
def src(name, fallback=None):
    p = os.path.join(SRC, name)
    if not os.path.exists(p):
        if fallback is not None:
            print(f"  [warn] {name} missing — using fallback")
            return fallback
        sys.exit(f"  [error] required file not found: {p}")
    with open(p, encoding="utf-8") as f:
        return f.read()

def tag_inner(html, tag):
    """Return the content between the first <tag …> … </tag>."""
    m = re.search(rf'<{tag}[^>]*>(.*?)</{tag}>', html, re.DOTALL | re.IGNORECASE)
    return m.group(1) if m else ""

def strip_tag(html, tag):
    """Remove all <tag …> … </tag> blocks."""
    return re.sub(rf'<{tag}[^>]*>.*?</{tag}>', '', html, flags=re.DOTALL | re.IGNORECASE)

def first_tag(html, tag):
    m = re.search(rf'(<{tag}[^>]*>)', html, re.IGNORECASE)
    return m.group(1) if m else ''

# ── Read ──────────────────────────────────────────────────────────────────────
print(f"\n[build] SRC = {SRC}")
print(f"[build] OUT = {OUT}\n")

landing_html = src("index.html")
main_html    = src("main.html")
style_css    = src("style.css")
script_js    = src("script.js")
ui_js        = src("ui.js")

try:
    tooltips_json = json.loads(src("tooltips.json", FALLBACK_TOOLTIPS))
except json.JSONDecodeError:
    tooltips_json = json.loads(FALLBACK_TOOLTIPS)
    print("  [warn] tooltips.json invalid JSON — using fallback")

tooltips_str = json.dumps(tooltips_json, ensure_ascii=False)

# ── Landing page pieces ───────────────────────────────────────────────────────
landing_head = tag_inner(landing_html, "head")
landing_body = tag_inner(landing_html, "body")

# Extract <style> from landing head
landing_style_m = re.search(r'<style[^>]*>(.*?)</style>', landing_head, re.DOTALL | re.IGNORECASE)
landing_style   = landing_style_m.group(1) if landing_style_m else ""

# Extract inline <script> from landing body (the non-module, non-src one)
landing_script_m = re.search(
    r'<script(?!\s+type=["\']module["\'])(?!\s+src)[^>]*>(.*?)</script>',
    landing_body, re.DOTALL | re.IGNORECASE
)
landing_script = landing_script_m.group(1) if landing_script_m else ""

# Strip <script> and <canvas>/<parallax> elements that duplicate into nebula-root
landing_body_no_script = strip_tag(landing_body, "script").strip()

# Favicon
favicon_m = re.search(r'<link[^>]+rel=["\']icon["\'][^>]*/?>',
                       landing_head, re.IGNORECASE)
favicon   = favicon_m.group(0) if favicon_m else ""

# Google Fonts (deduplicate)
font_links, seen_hrefs = [], set()
for fl in re.findall(r'<link[^>]+fonts\.googleapis\.com[^>]*/?>',
                     landing_head + tag_inner(main_html, "head"),
                     re.IGNORECASE):
    h = (re.search(r'href=["\']([^"\']+)["\']', fl) or None)
    href = h.group(1) if h else fl
    if href not in seen_hrefs:
        seen_hrefs.add(href)
        font_links.append(fl)

# ── Nebula app HTML body ───────────────────────────────────────────────────────
nebula_body = tag_inner(main_html, "body")
# Remove the <script src="script.js" type="module"> tag
nebula_body = re.sub(
    r'<script\b[^>]*\bsrc=["\']script\.js["\'][^>]*>\s*</script>',
    '', nebula_body, flags=re.IGNORECASE
).strip()

# ── Process ui.js ─────────────────────────────────────────────────────────────
# Strip ES module export keywords so it works as a plain <script>.
# Two targeted string replacements — no DOTALL regex on the whole file.
ui_plain = ui_js
ui_plain = ui_plain.replace("export function initCanvas()",   "function initCanvas()")
ui_plain = ui_plain.replace("export function initParallax()", "function initParallax()")
# Catch any remaining bare `export {…}` or `export default`
ui_plain = re.sub(r'\bexport\s+default\b', '', ui_plain)
ui_plain = re.sub(r'\bexport\s*\{[^}]*\}\s*;?', '', ui_plain)
print("  [ok] ui.js export keywords stripped")

# ── Process script.js ─────────────────────────────────────────────────────────
# 1. Remove the single `import { … } from "./ui.js"` line.
script_patched = re.sub(
    r'^\s*import\s*\{[^}]*\}\s*from\s*["\']\.\/ui\.js["\']\s*;?\s*\n?',
    '',
    script_js,
    count=1,
    flags=re.MULTILINE
)
print("  [ok] script.js: ui.js import removed")

# 2. Inline tooltips.json — replace the try/catch fetch block.
#    We do a targeted search for the fetch call and replace only that line.
tooltips_fetch_old = "const d=await(await fetch('tooltips.json')).json();"
tooltips_fetch_new = f"const d={tooltips_str};"
if tooltips_fetch_old in script_patched:
    script_patched = script_patched.replace(tooltips_fetch_old, tooltips_fetch_new, 1)
    print("  [ok] script.js: tooltips.json fetch inlined")
else:
    # Broader fallback — try with spaces
    script_patched = re.sub(
        r"const d\s*=\s*await\s*\(\s*await fetch\s*\(\s*['\"]tooltips\.json['\"]\s*\)\s*\)\.json\(\)\s*;",
        f"const d={tooltips_str};",
        script_patched, count=1
    )
    print("  [warn] script.js: tooltips inline used fallback regex")

# 3. Wrap the session-restore IIFE so it only fires via window.__bootNebula().
#    The IIFE starts with the comment "/* ── Restore session ── */" in the source.
#    We replace the comment + opening `(async` with a named async function,
#    and replace the closing `})();` with `}; window.__bootNebula = __nebulaSessionBoot;`
#
#    We do NOT use DOTALL regex on thousands of lines.
#    Instead we do simple string anchor replacements.

BOOT_COMMENT = "(async()=>{"
BOOT_COMMENT_FULL = """(async()=>{
  initCanvas();
  initParallax();
  showSkeleton();"""

BOOT_REPLACEMENT_START = """async function __nebulaSessionBoot(){
  initCanvas();
  initParallax();
  showSkeleton();"""

# Find the exact boot IIFE signature in the file
# The file has: (async()=>{\n  initCanvas();\n  initParallax();\n  showSkeleton();
if "initCanvas();\n  initParallax();\n  showSkeleton();" in script_patched:
    # Replace opening
    script_patched = script_patched.replace(
        "(async()=>{\n  initCanvas();\n  initParallax();\n  showSkeleton();",
        "async function __nebulaSessionBoot(){\n  initCanvas();\n  initParallax();\n  showSkeleton();",
        1
    )
    # Replace closing call  })();  that follows the IIFE
    # It appears as `})();` on its own line after `hideSkeleton();}catch{...}catch{...}  }`
    # We only want to replace the LAST `})();` before the next function/var declaration.
    # Safe approach: replace first occurrence of `\n})();` after the boot function.
    script_patched = script_patched.replace("\n})();", "\n}\nwindow.__bootNebula = __nebulaSessionBoot;", 1)
    print("  [ok] script.js: boot IIFE wrapped in __nebulaSessionBoot()")
else:
    print("  [warn] script.js: boot IIFE signature not found — Nebula will auto-boot on load")

# ── Patch _0xlaunch in the landing script ─────────────────────────────────────
# Replace the function body so it shows #nebula-root instead of opening a new window.
# We locate the function by its unique variable name and replace its body entirely.
NEW_LAUNCHER_BODY = """var _0xlaunch = (function(){
  return function(){
    var lp = document.getElementById('goatpedia-landing');
    if(lp) lp.style.display = 'none';
    var nb = document.getElementById('nebula-root');
    if(nb){ nb.style.display = 'block'; nb.style.position = 'fixed'; nb.style.inset = '0'; }
    if(!window.__nebulaBooted){
      window.__nebulaBooted = true;
      if(typeof window.__bootNebula === 'function') window.__bootNebula();
    }
  };
})();"""

# Find the existing _0xlaunch declaration and replace it wholesale.
# The declaration ends at the first `})();` after `var _0xlaunch`.
launcher_re = re.compile(
    r'var\s+_0xlaunch\s*=\s*\(function\(\)\{.*?\}\)\(\)\s*;',
    re.DOTALL
)
if launcher_re.search(landing_script):
    landing_script = launcher_re.sub(NEW_LAUNCHER_BODY, landing_script, count=1)
    print("  [ok] landing: _0xlaunch patched to show #nebula-root")
else:
    # Prepend it — original will still be defined but ours wins (last write wins for var)
    landing_script = NEW_LAUNCHER_BODY + "\n" + landing_script
    print("  [warn] landing: _0xlaunch not matched — prepended override")

# ── ONLY triple-click © should launch — remove the other two triggers ─────────
# Remove: Trigger 1 (double-click ghost span #nebula-trigger)
landing_script = re.sub(
    r'/\* ══ Trigger 1.*?/\* ══ Trigger 2',
    '/* ══ Trigger 2',
    landing_script, count=1, flags=re.DOTALL
)
# Remove: Trigger 2 (Konami code)
landing_script = re.sub(
    r'/\* ══ Trigger 2.*?/\* ══ Trigger 3',
    '/* ══ Trigger 3',
    landing_script, count=1, flags=re.DOTALL
)
print("  [ok] landing: only triple-click © trigger kept")

# ── Build final HTML ──────────────────────────────────────────────────────────
fonts = "\n".join(font_links)

html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Goat — The Comprehensive Encyclopedia</title>
{favicon}
{fonts}

<!-- ═══ GoatPedia CSS ═══ -->
<style>
{landing_style}
</style>

<!-- ═══ Nebula App CSS ═══ -->
<style>
{style_css}
</style>

<!-- ═══ Layout glue ═══ -->
<style>
/* GoatPedia sits on top by default; Nebula is hidden */
#nebula-root {{
  display: none;
  position: fixed;
  inset: 0;
  z-index: 5000;
  background: #060d1a;
  overflow: hidden;
}}
/* Game vault and its header must always be on top */
#game-vault  {{ z-index: 10000 !important; }}
.ghdr        {{ z-index: 10001 !important; pointer-events: all !important; }}
</style>
</head>
<body>

<!-- ══════════════════════════════════════════
     GoatPedia landing page
═════════════════════════════════════��════ -->
<div id="goatpedia-landing">
{landing_body_no_script}
</div>

<!-- ══════════════════════════════════════════
     Nebula app  (hidden until launcher fires)
══════════════════════════════════════════ -->
<div id="nebula-root">
{nebula_body}
</div>

<!-- ══════════════════════════════════════════
     ui.js — visual helpers (plain script, no module)
══════════════════════════════════════════ -->
<script>
{ui_plain}
</script>

<!-- ══════════════════════════════════════════
     script.js — Nebula core (ES module, deferred)
══════════════════════════════════════════ -->
<script type="module">
{script_patched}
</script>

<!-- ══════════════════════════════════════════
     GoatPedia inline script
     (starfield, parallax, triggers, patched _0xlaunch)
══════════════════════════════════════════ -->
<script>
{landing_script}
</script>

</body>
</html>"""

# ── Write output ──────────────────────────────────────────────────────────────
os.makedirs(DST, exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    f.write(html)

kb = os.path.getsize(OUT) / 1024
print(f"\n[build] Done — {OUT}  ({kb:.1f} KB)\n")
print("  Triggers active:")
print("    ✓  Triple-click the © in the footer")
print()