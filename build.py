#!/usr/bin/env python3
"""
build.py  –  GoatTech single-file build
============================================================
Input  : C:\\Users\\lukep\\Desktop\\Coding\\GoatTech Never Dies\\public\\
Output : C:\\Users\\lukep\\Desktop\\Coding\\GoatTech Never Dies\\public\\dist\\index.html

WHAT THIS SCRIPT DOES (and why it's safe):
------------------------------------------
1.  Reads index.html, main.html, style.css, script.js, ui.js
2.  Inlines style.css inside #nebula-root so it can't affect GoatPedia
3.  Inlines ui.js as a plain <script> (strips the two `export function` keywords
    with simple .replace() — nothing else is touched)
4.  Inlines script.js as <script type="module"> after removing ONLY the
    single `import { … } from "./ui.js"` line (one regex, one line, safe)
5.  Wraps the auto-boot IIFE in a named function __nebulaSessionBoot so it
    doesn't run until _0xlaunch calls it
6.  Patches _0xlaunch to show #nebula-root instead of window.open()
7.  Strips Trigger 1 (ghost span) and Trigger 2 (Konami) from landing script
8.  Escapes </script> inside every <script> block so the HTML parser doesn't
    terminate the tag early  ← this is what caused error at line 1416
9.  Adds a scoped CSS reset so Nebula's `overflow:hidden` on body/html
    doesn't bleed into GoatPedia, and GoatPedia can scroll normally
"""

import os, re, json, sys, textwrap

SRC = r"C:\Users\lukep\Desktop\Coding\GoatTech Never Dies\public"
DST = r"C:\Users\lukep\Desktop\Coding\GoatTech Never Dies\public\dist"
OUT = os.path.join(DST, "index.html")

FALLBACK_TOOLTIPS = json.dumps({"messages": [
    "GOAT TECH INDUSTRIES","STAY ENCRYPTED","LEGENDS NEVER DIE",
    "SYSTEM ONLINE","ALWAYS WATCHING","SIGNAL ACQUIRED",
]})

# ─── helpers ────────────────────────────────────────────────────────────────

def read(name, fallback=None):
    p = os.path.join(SRC, name)
    if not os.path.exists(p):
        if fallback is not None:
            print(f"  [warn] {name} missing — using fallback")
            return fallback
        sys.exit(f"  [error] required: {p}")
    with open(p, encoding="utf-8") as f:
        return f.read()

def between(html, tag):
    """Content between first <tag…>…</tag>."""
    m = re.search(rf'<{tag}[^>]*>(.*?)</{tag}>', html, re.DOTALL | re.IGNORECASE)
    return m.group(1) if m else ""

def remove_tags(html, tag):
    return re.sub(rf'<{tag}[^>]*>.*?</{tag}>', '', html,
                  flags=re.DOTALL | re.IGNORECASE)

def safe_script(js: str) -> str:
    """
    Escape </script> and </style> inside JS so the HTML parser
    doesn't terminate the enclosing tag prematurely.
    This is the primary fix for 'Invalid or unexpected token' errors.
    """
    js = js.replace("</script>", r"<\/script>")
    js = js.replace("</style>",  r"<\/style>")
    return js

def safe_style(css: str) -> str:
    """Escape </style> inside a CSS block."""
    return css.replace("</style>", r"<\/style>")

# ─── read source files ───────────────────────────────────────────────────────

print(f"\n[build] src={SRC}")
print(f"[build] out={OUT}\n")

landing_html = read("index.html")
main_html    = read("main.html")
style_css    = read("style.css")
script_js    = read("script.js")
ui_js        = read("ui.js")

try:
    tooltips = json.loads(read("tooltips.json", FALLBACK_TOOLTIPS))
except json.JSONDecodeError:
    tooltips = json.loads(FALLBACK_TOOLTIPS)
    print("  [warn] tooltips.json bad JSON — fallback used")

tooltips_str = json.dumps(tooltips, ensure_ascii=False)

# ─── extract landing pieces ──────────────────────────────────────────────────

landing_head = between(landing_html, "head")
landing_body = between(landing_html, "body")

# GoatPedia inline <style>
gp_style_m = re.search(r'<style[^>]*>(.*?)</style>', landing_head,
                        re.DOTALL | re.IGNORECASE)
gp_style = gp_style_m.group(1) if gp_style_m else ""

# GoatPedia inline <script> (non-module, no src= attribute)
gp_script_m = re.search(
    r'<script(?!\s+type=["\']module["\'])(?!\s[^>]*\bsrc\b)[^>]*>(.*?)</script>',
    landing_body, re.DOTALL | re.IGNORECASE)
gp_script = gp_script_m.group(1) if gp_script_m else ""

# Landing body without <script> blocks
landing_body_clean = remove_tags(landing_body, "script").strip()

# Favicon
favicon_m = re.search(r'<link[^>]+rel=["\']icon["\'][^>]*/?>',
                       landing_head, re.IGNORECASE)
favicon = favicon_m.group(0) if favicon_m else ""

# Google Fonts (deduplicated)
font_links, seen = [], set()
for fl in re.findall(r'<link[^>]+fonts\.googleapis\.com[^>]*/?>',
                     landing_head + between(main_html, "head"),
                     re.IGNORECASE):
    href_m = re.search(r'href=["\']([^"\']+)["\']', fl)
    key = href_m.group(1) if href_m else fl
    if key not in seen:
        seen.add(key)
        font_links.append(fl)

# Nebula app body (strip <script src="script.js"> tag)
nebula_body = between(main_html, "body")
nebula_body = re.sub(
    r'<script\b[^>]*\bsrc=["\']script\.js["\']\b[^>]*>\s*</script>',
    '', nebula_body, flags=re.IGNORECASE).strip()

# ─── process ui.js ──────────────────────────────────────────────────────────
# Strip only the `export` keyword from the two exported functions.
# Do NOT touch anything else.

ui_plain = ui_js
ui_plain = ui_plain.replace("export function initCanvas()",
                             "function initCanvas()")
ui_plain = ui_plain.replace("export function initParallax()",
                             "function initParallax()")
# Remove any remaining bare export statements just in case
ui_plain = re.sub(r'\bexport\s+default\b', '', ui_plain)
ui_plain = re.sub(r'\bexport\s*\{[^}]*\}\s*;?', '', ui_plain)
print("  [ok] ui.js: export keywords stripped")

# ─── process script.js ──────────────────────────────────────────────────────

sjs = script_js

# 1. Remove the import line for ui.js
sjs, n = re.subn(
    r'^[ \t]*import\s*\{[^}]*\}\s*from\s*["\']\.\/ui\.js["\']\s*;?[ \t]*\n?',
    '', sjs, count=1, flags=re.MULTILINE)
print(f"  [ok] script.js: ui.js import removed (n={n})")

# 2. Inline tooltips
OLD_FETCH = "const d=await(await fetch('tooltips.json')).json();"
NEW_FETCH = f"const d={tooltips_str};"
if OLD_FETCH in sjs:
    sjs = sjs.replace(OLD_FETCH, NEW_FETCH, 1)
    print("  [ok] script.js: tooltips inlined (exact match)")
else:
    sjs, n2 = re.subn(
        r"const d\s*=\s*await\s*\(\s*await\s+fetch\s*\(\s*['\"]tooltips\.json['\"]\s*\)\s*\)\.json\s*\(\s*\)\s*;",
        NEW_FETCH, sjs, count=1)
    print(f"  [{'ok' if n2 else 'warn'}] script.js: tooltips inlined (regex, n={n2})")

# 3. Wrap the session-restore IIFE so it only runs when called explicitly.
#
#    The file contains exactly this pattern (checked against source):
#
#      (async()=>{
#        initCanvas();
#        initParallax();
#        showSkeleton();
#        try{
#          ...
#        }catch{localStorage.removeItem('nebula_sess');hideSkeleton();}
#      })();
#
#    We convert it to:
#      async function __nebulaSessionBoot(){
#        ...
#      }
#      window.__bootNebula = __nebulaSessionBoot;
#
#    Strategy: find the exact opening string, replace it; then find the
#    matching closing `})();` by counting braces from that position.
#    This is 100% syntax-safe because we don't touch anything inside the body.

IIFE_OPEN = "(async()=>{\n  initCanvas();\n  initParallax();\n  showSkeleton();"
IIFE_OPEN_ALT = "(async()=>{\n  initCanvas();\n  initParallax();\n  showSkeleton();"

if IIFE_OPEN in sjs:
    open_pos = sjs.index(IIFE_OPEN)
    # Replace the opening `(async()=>{` with a named function declaration
    sjs = (
        sjs[:open_pos]
        + "async function __nebulaSessionBoot(){\n  initCanvas();\n  initParallax();\n  showSkeleton();"
        + sjs[open_pos + len(IIFE_OPEN):]
    )
    # Now find the matching `})();` by brace counting from the function open brace
    # The `{` of the function is at open_pos + len("async function __nebulaSessionBoot()")
    func_prefix = "async function __nebulaSessionBoot()"
    brace_start = sjs.index("{", open_pos + len(func_prefix))
    depth = 0
    close_pos = None
    for i, ch in enumerate(sjs[brace_start:], brace_start):
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                close_pos = i
                break

    if close_pos is not None:
        # After the closing `}` there should be `();`
        after = sjs[close_pos+1:close_pos+5]
        if after.startswith("();"):
            sjs = (sjs[:close_pos+1]
                   + "\nwindow.__bootNebula = __nebulaSessionBoot;\n"
                   + sjs[close_pos+4:])   # skip `();`
            print("  [ok] script.js: boot IIFE wrapped (brace-counted)")
        else:
            # Try matching `})();` which is the IIFE closing form
            # If brace counting landed on the inner `}` of a try/catch,
            # we need to scan forward for `})();`
            search_from = close_pos
            iife_close = sjs.find("\n})();", search_from)
            if iife_close != -1:
                sjs = (sjs[:iife_close]
                       + "\n}\nwindow.__bootNebula = __nebulaSessionBoot;"
                       + sjs[iife_close+6:])
                print("  [ok] script.js: boot IIFE wrapped (})(); scan fallback)")
            else:
                print("  [warn] script.js: couldn't find IIFE close — boot will fire on load")
    else:
        print("  [warn] script.js: brace matching failed — boot will fire on load")
else:
    print("  [warn] script.js: boot IIFE open signature not found — boot will fire on load")

# ─── patch _0xlaunch ────────────────────────────────────────────────────────
# Replace the entire _0xlaunch body with one that shows #nebula-root.
# We locate it by its unique var name and replace up to the first `})();`
# after it, which is the IIFE self-call.

NEW_LAUNCH = textwrap.dedent("""\
    var _0xlaunch = (function(){
      return function(){
        var lp = document.getElementById('goatpedia-landing');
        if(lp){ lp.style.display = 'none'; }
        var nb = document.getElementById('nebula-root');
        if(nb){ nb.style.display = 'block'; }
        if(!window.__nebulaBooted){
          window.__nebulaBooted = true;
          if(typeof window.__bootNebula === 'function') window.__bootNebula();
        }
      };
    })();""")

launch_re = re.compile(
    r'var\s+_0xlaunch\s*=\s*\(function\(\)\{.*?\}\)\(\)\s*;',
    re.DOTALL)
gp_script_patched, n3 = launch_re.subn(NEW_LAUNCH, gp_script, count=1)
if n3:
    print("  [ok] landing: _0xlaunch patched")
else:
    gp_script_patched = NEW_LAUNCH + "\n" + gp_script
    print("  [warn] landing: _0xlaunch not matched — prepended override")

# ─── strip Trigger 1 (ghost span) and Trigger 2 (Konami) ────────────────────
# Keep ONLY Trigger 3 (triple-click ©)

# Remove Trigger 1 block
gp_script_patched = re.sub(
    r'/\* ══ Trigger 1:.*?(?=/\* ══ Trigger 2)',
    '', gp_script_patched, count=1, flags=re.DOTALL)

# Remove Trigger 2 block
gp_script_patched = re.sub(
    r'/\* ══ Trigger 2:.*?(?=/\* ══ Trigger 3)',
    '', gp_script_patched, count=1, flags=re.DOTALL)

print("  [ok] landing: Trigger 1 + 2 removed, only © triple-click kept")

# ─── build HTML ─────────────────────────────────────────────────────────────

fonts_str = "\n".join(font_links)

# Nebula CSS — scoped inside #nebula-root via a style block that lives
# inside that div, plus we override body/html rules to be no-ops outside it.
# The simplest safe approach: wrap nebula CSS in a @layer so it doesn't
# win specificity battles, and undo the body overflow:hidden for GoatPedia.
#
# Because browsers don't support scoped <style> anymore, we instead:
#   a) Put Nebula CSS in its own <style> block AFTER GoatPedia's.
#   b) Override the body/html rules that would break GoatPedia scrolling
#      via a higher-specificity rule tied to #nebula-root being visible.
#
# When #nebula-root is display:none, its styles still apply globally —
# so we MUST add overrides. The cleanest fix is to add:
#
#   #goatpedia-landing { overflow-y: auto !important; }
#   body:has(#nebula-root[style*="display: block"]) { overflow: hidden; }
#   body:not(:has(#nebula-root[style*="display: block"])) { overflow: auto; }

GLUE_CSS = """
/* ═══ Layout glue ═══ */
#nebula-root {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 5000;
  background: #060d1a;
  overflow: hidden;
}
/* Force GoatPedia page scrollable when Nebula is hidden */
#goatpedia-landing {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  overflow-y: auto;
}
/* Override Nebula's html,body overflow:hidden when Nebula is not shown */
html, body {
  overflow: auto;
}
/* Re-apply overflow:hidden only when Nebula is active */
body:has(#nebula-root:not([style*="display: none"]):not([style=""])) {
  overflow: hidden;
}
/* Game vault always on top */
#game-vault  { z-index: 10000 !important; }
.ghdr        { z-index: 10001 !important; pointer-events: all !important; }
"""

html_out = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Goat — The Comprehensive Encyclopedia</title>
{favicon}
{fonts_str}

<!-- GoatPedia CSS -->
<style>
{safe_style(gp_style)}
</style>

<!-- Nebula App CSS -->
<style>
{safe_style(style_css)}
</style>

<!-- Layout / scoping glue -->
<style>
{GLUE_CSS}
</style>
</head>
<body>

<!-- ── GoatPedia ── -->
<div id="goatpedia-landing">
{landing_body_clean}
</div>

<!-- ── Nebula (hidden until launcher fires) ── -->
<div id="nebula-root">
{nebula_body}
</div>

<!-- ui.js (visual helpers, plain script) -->
<script>
{safe_script(ui_plain)}
</script>

<!-- script.js (Nebula core, ES module) -->
<script type="module">
{safe_script(sjs)}
</script>

<!-- GoatPedia script (patched) -->
<script>
{safe_script(gp_script_patched)}
</script>

</body>
</html>"""

os.makedirs(DST, exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    f.write(html_out)

kb = os.path.getsize(OUT) / 1024
print(f"\n[build] Done — {kb:.1f} KB → {OUT}")
print("  ✓  Triple-click © to open Nebula")
print("  ✓  GoatPedia scrolls normally")
print("  ✓  </script> tags inside JS are escaped\n")