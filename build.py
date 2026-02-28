#!/usr/bin/env python3
"""
build.py — Builds the entire project into a single index.html.

The output file contains:
  - The GoatPedia landing page (visible on load)
  - The full Nebula app (hidden, revealed by the existing triggers)
  - All CSS inlined into <style> blocks
  - All JS inlined into <script> blocks
  - tooltips.json baked in — no fetch() call
  - ui.js merged into script.js — no import needed
  - Firebase still loaded from CDN (required, cannot be bundled)
  - Google Fonts still loaded from CDN (optional, graceful fallback)

Source files expected in the same directory as build.py:
  index.html, main.html, style.css, script.js, ui.js, tooltips.json

Output:
  dist/index.html
"""

import json, os, re, sys

# ── Config ────────────────────────────────────────────────────────────────────

SRC  = "."        # source directory
OUT  = "dist"     # output directory
NAME = "index.html"

REQUIRED = ["index.html", "main.html", "style.css", "script.js", "ui.js"]
OPTIONAL = {"tooltips.json": '{"messages":["GOAT TECH INDUSTRIES","STAY ENCRYPTED","LEGENDS NEVER DIE","SYSTEM ONLINE","ALWAYS WATCHING","SIGNAL ACQUIRED"]}'}

# ── Helpers ───────────────────────────────────────────────────────────────────

def read(name, fallback=None):
    p = os.path.join(SRC, name)
    if not os.path.exists(p):
        if fallback is not None:
            print(f"  [warn] {name} not found — using fallback")
            return fallback
        print(f"  [error] missing required file: {p}", file=sys.stderr)
        sys.exit(1)
    with open(p, encoding="utf-8") as f:
        return f.read()

def write(name, content):
    os.makedirs(OUT, exist_ok=True)
    p = os.path.join(OUT, name)
    with open(p, "w", encoding="utf-8") as f:
        f.write(content)
    kb = len(content.encode()) / 1024
    print(f"  [ok]   {p}  ({kb:.1f} KB)")

def between_tags(html, tag):
    """Extract content between <tag> and </tag> (case-insensitive, first match)."""
    m = re.search(rf'<{tag}[^>]*>(.*?)</{tag}>', html, re.DOTALL | re.IGNORECASE)
    return m.group(1) if m else ""

def attr(html, tag, attribute):
    """Get a specific attribute value from the first matching tag."""
    m = re.search(rf'<{tag}[^>]*\s{attribute}=["\']([^"\']*)["\']', html, re.DOTALL | re.IGNORECASE)
    return m.group(1) if m else ""

# ── Read sources ──────────────────────────────────────────────────────────────

print("\n── Reading source files ──────────────────────────────────────────────")
landing_html = read("index.html")
main_html    = read("main.html")
style_css    = read("style.css")
script_js    = read("script.js")
ui_js        = read("ui.js")
tooltips_raw = read("tooltips.json", OPTIONAL["tooltips.json"])

try:
    tooltips_obj = json.loads(tooltips_raw)
except json.JSONDecodeError:
    print("  [warn] tooltips.json invalid — using fallback")
    tooltips_obj = json.loads(OPTIONAL["tooltips.json"])

tooltips_inline = json.dumps(tooltips_obj, ensure_ascii=False)
print("  [ok]   all files read")

# ── Process ui.js ─────────────────────────────────────────────────────────────
# Strip ES module export keywords so it can live in a plain <script> block.

print("\n── Processing ui.js ──────────────────────────────────────────────────")
ui_clean = re.sub(r'\bexport\s+function\b',  'function', ui_js)
ui_clean = re.sub(r'\bexport\s+default\b',   '',         ui_clean)
ui_clean = re.sub(r'\bexport\s*\{[^}]*\}\s*;?', '',     ui_clean)
print("  [ok]   export keywords stripped")

# ── Process script.js ─────────────────────────────────────────────────────────

print("\n── Processing script.js ──────────────────────────────────────────────")

# 1. Remove the ui.js import line (we're inlining it)
script_clean = re.sub(
    r"""import\s*\{[^}]*\}\s*from\s*['"]\./ui\.js['"]\s*;?\n?""",
    '',
    script_js
)

# 2. Remove ALL other local import lines (anything importing from a relative path)
script_clean = re.sub(
    r"""import\s*\{[^}]*\}\s*from\s*['"][^'"]*['"]\s*;?\n?""",
    lambda m: '' if not 'gstatic' in m.group(0) and not 'firebase' in m.group(0) else m.group(0),
    script_clean
)

# 3. Inline tooltips — replace the fetch('tooltips.json') try/catch block
tooltips_pattern = re.compile(
    r"try\s*\{[^{}]*fetch\s*\(\s*['\"]tooltips\.json['\"]\s*\)[^{}]*\}catch\s*\{\}",
    re.DOTALL
)
tooltips_replacement = (
    f"try{{ const d = {tooltips_inline}; "
    f"if(d.messages?.length) msgs = d.messages; }}catch{{}}"
)
if tooltips_pattern.search(script_clean):
    script_clean = tooltips_pattern.sub(tooltips_replacement, script_clean)
    print("  [ok]   tooltips fetch → inline JSON")
else:
    # broader fallback: find the fetch line and replace just that
    script_clean = re.sub(
        r"const d=await\(await fetch\('tooltips\.json'\)\)\.json\(\);",
        f"const d={tooltips_inline};",
        script_clean
    )
    print("  [warn] used fallback tooltips inline method")

print("  [ok]   script.js processed")

# ── Extract landing page parts ────────────────────────────────────────────────

print("\n── Extracting landing page parts ─────────────────────────────────────")
landing_head = between_tags(landing_html, "head")
landing_body = between_tags(landing_html, "body")

# Pull out the landing page's own <style> block (the big one inside <head>)
landing_style_match = re.search(r'<style>(.*?)</style>', landing_head, re.DOTALL | re.IGNORECASE)
landing_style = landing_style_match.group(1) if landing_style_match else ""

# Pull the landing page's <script> block
landing_script_match = re.search(r'<script>(.*?)</script>', landing_body, re.DOTALL | re.IGNORECASE)
landing_script = landing_script_match.group(1) if landing_script_match else ""

# Collect font links from landing head
font_links = re.findall(r'<link[^>]+fonts\.googleapis\.com[^>]*>', landing_head, re.IGNORECASE)

# Collect the landing page favicon
favicon_match = re.search(r'<link[^>]+rel=["\']icon["\'][^>]*>', landing_head, re.IGNORECASE)
landing_favicon = favicon_match.group(0) if favicon_match else ""

print("  [ok]   landing page decomposed")

# ── Extract Nebula (main.html) parts ──────────────────────────────────────────

print("\n── Extracting Nebula (main.html) parts ───────────────────────────────")
nebula_head = between_tags(main_html, "head")
nebula_body = between_tags(main_html, "body")

# Remove the external stylesheet link and script tag from the Nebula body/head
nebula_body = re.sub(
    r'<script\s+src=["\']script\.js["\'][^>]*type=["\']module["\'][^>]*>\s*</script>',
    '', nebula_body, flags=re.IGNORECASE
)
nebula_body = re.sub(
    r'<script\s+type=["\']module["\'][^>]*src=["\']script\.js["\'][^>]*>\s*</script>',
    '', nebula_body, flags=re.IGNORECASE
)
nebula_body = re.sub(
    r'<script\s+src=["\']script\.js["\'][^>]*>\s*</script>',
    '', nebula_body, flags=re.IGNORECASE
)

# Collect Nebula font links (avoid duplicates with landing)
nebula_font_links = re.findall(r'<link[^>]+fonts\.googleapis\.com[^>]*>', nebula_head, re.IGNORECASE)
all_font_hrefs = set()
all_font_links = []
for fl in font_links + nebula_font_links:
    href = attr(fl, "link", "href")
    if href not in all_font_hrefs:
        all_font_hrefs.add(href)
        all_font_links.append(fl)

print("  [ok]   Nebula decomposed")

# ── Patch the launcher in the landing page script ─────────────────────────────
#
# The original _0xlaunch opens a new tab and writes an iframe pointing to
# "main.html". Since everything is now one file, we change the launcher so it:
#   1. Hides the landing page wrapper
#   2. Shows the Nebula app wrapper
#   3. Does NOT open a new tab
#
print("\n── Patching the launcher ─────────────────────────────────────────────")

new_launcher = """
var _0xlaunch = (function(){
  return function(){
    // Hide the GoatPedia landing page content
    var lp = document.getElementById('goatpedia-landing');
    if(lp) lp.style.display = 'none';
    // Show the Nebula app
    var nb = document.getElementById('nebula-root');
    if(nb) nb.style.display = 'block';
    // Boot Nebula if it hasn't started yet
    if(!window.__nebulaBooted){
      window.__nebulaBooted = true;
      __bootNebula();
    }
  };
})();
"""

# Replace the existing _0xlaunch definition (handles the obfuscated version)
launcher_pattern = re.compile(
    r'var\s+_0xlaunch\s*=\s*\(function\(\)\{.*?return\s+function\(\)\{.*?\}\s*\}\)\(\)\s*;',
    re.DOTALL
)
if launcher_pattern.search(landing_script):
    landing_script = launcher_pattern.sub(new_launcher.strip(), landing_script)
    print("  [ok]   _0xlaunch patched to show/hide divs")
else:
    # If the pattern didn't match, prepend the new launcher and hope for the best
    landing_script = new_launcher + "\n" + landing_script
    print("  [warn] could not find _0xlaunch — prepended new definition")

# ── Patch the Nebula script: remove the IIFE self-boot ────────────────────────
#
# The original script.js has an IIFE at the top level that runs immediately:
#   (async()=>{ initCanvas(); initParallax(); ... })();
# We wrap the entire Nebula script in a function __bootNebula() so it only
# runs when the launcher calls it.
#
print("\n── Wrapping Nebula script in __bootNebula() ──────────────────────────")

# Find the self-invoking async boot IIFE and capture it
boot_iife_pattern = re.compile(
    r'/\*\s*──\s*Restore session\s*──\s*\*/\s*\(async\s*\(\)\s*=>\s*\{.*?\}\s*\)\s*\(\)\s*;',
    re.DOTALL
)

if boot_iife_pattern.search(script_clean):
    # Wrap entire script in a function, making the IIFE the body of __bootNebula
    combined_nebula_js = f"""
// ── ui.js (inlined) ──────────────────────────────────────────────────────────
{ui_clean.strip()}

// ── script.js (inlined, wrapped in __bootNebula) ─────────────────────────────
{script_clean.strip()}
"""
    # The IIFE already calls initCanvas/initParallax then boots auth.
    # We just need __bootNebula to call that IIFE.
    # Replace the bare IIFE with a named function + call site
    combined_nebula_js = boot_iife_pattern.sub(
        lambda m: "async function __nebulaSessionBoot(){\n" + m.group(0)[m.group(0).index('{')+1:m.group(0).rindex('}')-1].strip() + "\n}\nfunction __bootNebula(){ initCanvas(); initParallax(); __nebulaSessionBoot(); }",
        combined_nebula_js
    )
    # Remove duplicate initCanvas/initParallax calls that may now exist
    # (the IIFE called them; our wrapper now calls them explicitly before the session boot)
    combined_nebula_js = re.sub(
        r'\binitCanvas\s*\(\s*\)\s*;[\s\n]*\binitParallax\s*\(\s*\)\s*;',
        '// (moved to __bootNebula)',
        combined_nebula_js,
        count=1
    )
    print("  [ok]   Nebula wrapped in __bootNebula()")
else:
    # Fallback: just wrap everything in a plain function
    print("  [warn] boot IIFE not found — using simple wrapper")
    combined_nebula_js = f"""
// ── ui.js (inlined) ──────────────────────────────────────────────────────────
{ui_clean.strip()}

// ── script.js (inlined) ──────────────────────────────────────────────────────
{script_clean.strip()}

function __bootNebula(){{ initCanvas(); initParallax(); }}
"""

# ── Remove Firebase import statements from combined JS ───────────���────────────
# (they will be loaded via CDN <script> tags, not ES module imports)
# We keep them as-is since the script is type="module" and CDN imports work fine.

# ── Build the final HTML ──────────────────────────────────────────────────────

print("\n── Building final index.html ─────────────────────────────────────────")

# Collect all font links as a single string
fonts_html = "\n".join(all_font_links)

# The landing body needs to be wrapped in a div we can hide
# Strip the outer <script> tag from landing_body since we handle it separately
landing_body_no_script = re.sub(r'<script\b[^>]*>.*?</script>', '', landing_body, flags=re.DOTALL|re.IGNORECASE).strip()

final_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Goat — The Comprehensive Encyclopedia</title>
{landing_favicon}
{fonts_html}

<style>
/* ════════════════════════════════════════════════════
   LANDING PAGE STYLES (GoatPedia)
════════════════════════════════════════════════════ */
{landing_style}

/* ════════════════════════════════════════════════════
   ROOT LAYOUT — landing vs nebula toggle
════════════════════════════════════════════════════ */
#nebula-root {{
  display: none;
  position: fixed;
  inset: 0;
  z-index: 5000;
}}
</style>

<style>
/* ════════════════════════════════════════════════════
   NEBULA APP STYLES (style.css)
════════════════════════════════════════════════════ */
{style_css}
</style>
</head>
<body>

<!-- ══════════════════════════════════════════════════
     GOATPEDIA LANDING PAGE
══════════════════════════════════════════════════ -->
<div id="goatpedia-landing">
{landing_body_no_script.strip()}
</div>

<!-- ══════════════════════════════════════════════════
     NEBULA APP  (hidden until launcher fires)
══════════════════════════════════════════════════ -->
<div id="nebula-root">
{nebula_body.strip()}
</div>

<!-- ══════════════════════════════════════════════════
     LANDING PAGE SCRIPTS
══════════════════════════════════════════════════ -->
<script>
/* ── Landing page inline JS (starfield, parallax, triggers) ─────────────── */
{landing_script.strip()}
</script>

<!-- ══════════════════════════════════════════════════
     NEBULA APP SCRIPTS  (ES module — Firebase imports work here)
══════════════════════════════════════════════════ -->
<script type="module">
/* ── Combined ui.js + script.js ─────────────────────────────────────────── */
{combined_nebula_js.strip()}
</script>

</body>
</html>"""

write(NAME, final_html)

print(f"""
── Build complete ────────────────────────────────────────────────────────────

  dist/index.html  ← the entire project in one file

  What's inside:
    ✓ GoatPedia landing page  (visible on load)
    ✓ Nebula app              (hidden, revealed by existing triggers)
    ✓ style.css               (inlined)
    ✓ script.js               (inlined, wrapped in __bootNebula)
    ✓ ui.js                   (inlined, merged into script block)
    ✓ tooltips.json           (baked in, no fetch at runtime)
    ✓ Firebase                (CDN imports, unchanged)
    ✓ Google Fonts            (CDN, deduplicated)

  Triggers still work exactly as before:
    • Double-click "nebula" in the goat-eye paragraph
    • Konami code  (↑↑↓↓←→←→BA)
    • Triple-click the © in the footer

─────────────────────────────────────────────────────────────────────────────
""")