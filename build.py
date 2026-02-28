#!/usr/bin/env python3
"""
build.py — Builds the entire project into a single index.html.
Source: C:\\Users\\lukep\\Desktop\\Coding\\GoatTech Never Dies\\public
Output: C:\\Users\\lukep\\Desktop\\Coding\\GoatTech Never Dies\\public\\dist\\index.html
"""

import json, os, re, sys

# ── Config ────────────────────────────────────────────────────────────────────

SRC  = r"C:\Users\lukep\Desktop\Coding\GoatTech Never Dies\public"
OUT  = r"C:\Users\lukep\Desktop\Coding\GoatTech Never Dies\public\dist"
NAME = "index.html"

OPTIONAL_TOOLTIPS = '{"messages":["GOAT TECH INDUSTRIES","STAY ENCRYPTED","LEGENDS NEVER DIE","SYSTEM ONLINE","ALWAYS WATCHING","SIGNAL ACQUIRED"]}'

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

def write(content):
    os.makedirs(OUT, exist_ok=True)
    p = os.path.join(OUT, NAME)
    with open(p, "w", encoding="utf-8") as f:
        f.write(content)
    kb = len(content.encode()) / 1024
    print(f"  [ok]   wrote {p}  ({kb:.1f} KB)")

def between_tags(html, tag):
    m = re.search(rf'<{tag}[^>]*>(.*?)</{tag}>', html, re.DOTALL | re.IGNORECASE)
    return m.group(1) if m else ""

# ── Read sources ──────────────────────────────────────────────────────────────

print(f"\n── Source: {SRC}")
print(f"── Output: {OUT}\\{NAME}")
print("\n── Reading source files ──────────────────────────────────────────────")

landing_html = read("index.html")
main_html    = read("main.html")
style_css    = read("style.css")
script_js    = read("script.js")
ui_js        = read("ui.js")
tooltips_raw = read("tooltips.json", OPTIONAL_TOOLTIPS)

try:
    tooltips_obj = json.loads(tooltips_raw)
except json.JSONDecodeError:
    print("  [warn] tooltips.json is invalid JSON — using fallback")
    tooltips_obj = json.loads(OPTIONAL_TOOLTIPS)

tooltips_inline = json.dumps(tooltips_obj, ensure_ascii=False)
print("  [ok]   all files read")

# ── Process ui.js — strip ES module export keywords ──────────────────────────

print("\n── Processing ui.js ──────────────────────────────────────────────────")
ui_clean = re.sub(r'\bexport\s+function\b',      'function', ui_js)
ui_clean = re.sub(r'\bexport\s+default\b',       '',         ui_clean)
ui_clean = re.sub(r'\bexport\s*\{[^}]*\}\s*;?', '',         ui_clean)
print("  [ok]   export keywords stripped")

# ── Process script.js ─────────────────────────────────────────────────────────

print("\n── Processing script.js ──────────────────────────────────────────────")

# 1. Remove the ui.js import line
script_clean = re.sub(
    r'import\s*\{[^}]*\}\s*from\s*[\'\"]\./ui\.js[\'\"]\s*;?\n?',
    '',
    script_js
)

# 2. Inline tooltips — replace fetch('tooltips.json') try/catch
tooltips_pattern = re.compile(
    r'try\s*\{[^{}]*fetch\s*\(\s*[\'\""]tooltips\.json[\'\""]\s*\)[^{}]*\}catch\s*\{\}',
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
    # broader fallback: just replace the fetch line directly
    script_clean = re.sub(
        r"const d=await\(await fetch\('tooltips\.json'\)\)\.json\(\);",
        f"const d={tooltips_inline};",
        script_clean
    )
    print("  [warn] used fallback tooltips inline method")

# 3. Combine ui.js + script.js
combined_js = (
    "// ── ui.js (inlined) ─────────────────────────────────────────────────────\n"
    + ui_clean.strip()
    + "\n\n"
    + "// ── script.js ───────────────────────────────────────────────────────────\n"
    + script_clean.strip()
)
print("  [ok]   ui.js + script.js combined")

# ── Decompose landing page (index.html) ───────────────────────────────────────

print("\n── Decomposing landing page ──────────────────────────────────────────")
landing_head = between_tags(landing_html, "head")
landing_body = between_tags(landing_html, "body")

# Extract the landing page's <style> block
landing_style_m = re.search(r'<style[^>]*>(.*?)</style>', landing_head, re.DOTALL | re.IGNORECASE)
landing_style   = landing_style_m.group(1) if landing_style_m else ""

# Extract the landing page's inline <script> block (the one inside <body>)
landing_script_m = re.search(r'<script(?!\s+type=["\']module["\'])(?!\s+src)[^>]*>(.*?)</script>',
                              landing_body, re.DOTALL | re.IGNORECASE)
landing_script   = landing_script_m.group(1) if landing_script_m else ""

# Collect Google Fonts links (deduplicated across both files)
all_font_links = []
seen_hrefs     = set()
for fl in re.findall(r'<link[^>]+fonts\.googleapis\.com[^>]*>', landing_head + between_tags(main_html,"head"), re.IGNORECASE):
    href_m = re.search(r'href=["\']([^"\']+)["\']', fl)
    if href_m and href_m.group(1) not in seen_hrefs:
        seen_hrefs.add(href_m.group(1))
        all_font_links.append(fl)

# Grab the landing favicon
favicon_m  = re.search(r'<link[^>]+rel=["\']icon["\'][^>]*>', landing_head, re.IGNORECASE)
favicon    = favicon_m.group(0) if favicon_m else ""

print("  [ok]   landing page decomposed")

# ── Decompose main.html (Nebula) ──────────────────────────────────────────────

print("\n── Decomposing main.html ─────────────────────────────────────────────")
nebula_body = between_tags(main_html, "body")

# Remove the <script src="script.js"> tag — we're inlining it
nebula_body = re.sub(
    r'<script\b[^>]*\bsrc=["\']script\.js["\'][^>]*>\s*</script>',
    '',
    nebula_body,
    flags=re.IGNORECASE
)
print("  [ok]   Nebula body extracted")

# ── Patch the launcher (_0xlaunch) ───────────────────────────────────────────
#
# Original: opens a new tab/window and loads main.html inside an iframe.
# New:      hides #goatpedia-landing, shows #nebula-root, boots Nebula in-page.
#
print("\n── Patching _0xlaunch ────────────────────────────────────────────────")

new_launcher = """var _0xlaunch = (function(){
  return function(){
    var lp = document.getElementById('goatpedia-landing');
    if(lp) lp.style.display = 'none';
    var nb = document.getElementById('nebula-root');
    if(nb) nb.style.display = 'block';
    // Boot Nebula once — the module script exposes __bootNebula on window
    if(!window.__nebulaBooted){
      window.__nebulaBooted = true;
      if(typeof window.__bootNebula === 'function') window.__bootNebula();
    }
  };
})();"""

launcher_pattern = re.compile(
    r'var\s+_0xlaunch\s*=\s*\(function\(\)\{.*?return\s+function\(\)\{.*?\}\s*;\s*\}\)\(\)\s*;',
    re.DOTALL
)
if launcher_pattern.search(landing_script):
    landing_script = launcher_pattern.sub(new_launcher, landing_script)
    print("  [ok]   _0xlaunch patched (show/hide divs)")
else:
    landing_script = new_launcher + "\n" + landing_script
    print("  [warn] _0xlaunch pattern not matched — prepended new definition")

# ── Wrap Nebula JS so it only runs when the launcher fires ───────────────────
#
# The session-restore IIFE at the bottom of script.js runs immediately on load.
# We wrap the whole combined JS in __bootNebula() so it only executes when
# the user triggers the launcher.
#
print("\n── Wrapping Nebula JS in __bootNebula() ──────────────────────────────")

# Find the self-invoking async IIFE that boots the app:
#   (async()=>{ initCanvas(); initParallax(); showSkeleton(); ... })();
boot_pattern = re.compile(
    r'\(async\s*\(\)\s*=>\s*\{.*?hideSkeleton\(\)\s*;?\s*\}\s*\)\s*\(\)\s*;',
    re.DOTALL
)

if boot_pattern.search(combined_js):
    # Replace the bare IIFE call with a named async function
    combined_js = boot_pattern.sub(
        'async function __nebulaSessionBoot(){ initCanvas(); initParallax(); '
        + boot_pattern.search(combined_js).group(0)
          .lstrip('(').rsplit('()',1)[0].strip()   # body of the IIFE
          .lstrip('async()=>').lstrip('async () =>').strip()
          .strip('{}')
          .strip()
        + ' }',
        combined_js,
        count=1
    )
    # Simpler, more reliable approach: just append the wrapper at the end
    combined_js = boot_pattern.sub(
        '/* boot IIFE replaced by __bootNebula — see bottom of file */',
        script_clean,  # re-process from clean copy
    )
    # Actually the cleanest way: wrap everything and expose one entry point
    print("  [ok]   wrapping via function envelope")
    nebula_js_final = f"""// ── ui.js (inlined) ────────────────────────────────────────────────────────
{ui_clean.strip()}

// ── script.js (inlined) ────────────────────────────────────────────────────
// All top-level code is deferred — __bootNebula() is the entry point.
(function() {{
  // Replace the self-invoking boot IIFE with a named function so it only
  // runs when _0xlaunch calls window.__bootNebula().
  const _originalInit = async function() {{
    {script_clean.strip()}
  }};

  window.__bootNebula = function() {{
    _originalInit();
  }};
}})();
"""
else:
    print("  [warn] boot IIFE not found — using simple envelope")
    nebula_js_final = f"""// ── ui.js (inlined) ────────────────────────────────────────────────────────
{ui_clean.strip()}

// ── script.js (inlined) ────────────────────────────────────────────────────
(function() {{
  {script_clean.strip()}
  window.__bootNebula = function() {{ initCanvas(); initParallax(); }};
}})();
"""

# The approach above gets too clever — use a clean, simple wrapper instead.
# Wrap the entire combined JS (ui + script) in a function body.
# The session-restore IIFE is already at module top level; we just need to
# prevent it running on page load. We do this by wrapping everything in
# window.__bootNebula and NOT calling it immediately.

nebula_js_final = f"""// ── ui.js + script.js — deferred until _0xlaunch fires ─────────────────────
(function() {{

{ui_clean.strip()}

{script_clean.strip()}

// Expose the boot entry point
window.__bootNebula = function() {{
  initCanvas();
  initParallax();
  (async () => {{
    showSkeleton();
    try {{
      const saved = localStorage.getItem('nebula_sess');
      if (!saved) {{ hideSkeleton(); return; }}
      const sess = JSON.parse(saved);
      await loadAccounts();
      if (sess.username === ADMIN_USERNAME) {{
        await ensureAdminAccount();
        currentUser = {{ ...DB.accounts[ADMIN_USERNAME], username: ADMIN_USERNAME, isAdmin: true, proxyAccess: true }};
        launchApp(); return;
      }}
      const live = DB.accounts[sess.username];
      if (!live || live.banned) {{ localStorage.removeItem('nebula_sess'); hideSkeleton(); return; }}
      if (!live.approved) {{ currentUser = {{ ...live, username: sess.username }}; showPending(); hideSkeleton(); return; }}
      currentUser = {{ ...live, username: sess.username, isAdmin: false }};
      launchApp();
    }} catch {{ localStorage.removeItem('nebula_sess'); hideSkeleton(); }}
  }})();
}};

}})();
"""

print("  [ok]   __bootNebula() defined")

# ── Strip the original self-invoking session boot from the JS ────────────────
# (it's now inside __bootNebula so we don't want it running twice)

# Remove the bare IIFE:  (async()=>{ ... })();
bare_iife = re.compile(
    r'/\*\s*──\s*Restore session\s*──\s*\*/\s*\(async\s*\(\)\s*=>\s*\{.*?\}\s*\)\s*\(\)\s*;',
    re.DOTALL
)
if bare_iife.search(nebula_js_final):
    nebula_js_final = bare_iife.sub('/* session boot moved to __bootNebula() */', nebula_js_final)
    print("  [ok]   original session IIFE removed from module body")

# ── Strip the landing body of its own <script> tag (handled separately) ──────

landing_body_clean = re.sub(
    r'<script\b[^>]*>.*?</script>', '', landing_body, flags=re.DOTALL | re.IGNORECASE
).strip()

# ── Build final HTML ──────────────────────────────────────────────────────────

print("\n── Building final HTML ───────────────────────────────────────────────")

fonts_html = "\n".join(all_font_links)

final_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Goat — The Comprehensive Encyclopedia</title>
{favicon}
{fonts_html}

<style>
/* ════════════════════════════════════════
   LANDING PAGE CSS (GoatPedia)
════════════════════════════════════════ */
{landing_style}
</style>

<style>
/* ════════════════════════════════════════
   NEBULA APP CSS (style.css)
════════════════════════════════════════ */
{style_css}
</style>

<style>
/* ════════════���═══════════════════════════
   LAYOUT — landing / nebula toggle
════════════════════════════════════════ */
#nebula-root {{
  display: none;
  position: fixed;
  inset: 0;
  z-index: 4000;
  background: var(--bg, #060d1a);
  overflow: hidden;
}}
/* game vault must be above everything */
#game-vault {{
  z-index: 10000 !important;
}}
.ghdr {{
  position: relative;
  z-index: 10001 !important;
  pointer-events: all !important;
}}
</style>
</head>
<body>

<!-- ══════════════════════════════════════
     GOATPEDIA LANDING PAGE
══════════════════════════════════════ -->
<div id="goatpedia-landing">
{landing_body_clean}
</div>

<!-- ══════════════════════════════════════
     NEBULA APP  (hidden until launcher fires)
══════════════════════════════════════ -->
<div id="nebula-root">
{nebula_body.strip()}
</div>

<!-- ══════════════════════════════════════
     LANDING PAGE SCRIPTS
     (starfield, parallax, triggers, patched _0xlaunch)
══════════════════════════════════════ -->
<script>
{landing_script.strip()}
</script>

<!-- ══════════════════════════════════════
     NEBULA APP SCRIPTS
     (ui.js + script.js, wrapped in __bootNebula)
══════════════════════════════════════ -->
<script type="module">
{nebula_js_final.strip()}
</script>

</body>
</html>"""

write(final_html)

print(f"""
── Build complete ────────────────────────────────────────────────────────────

  {OUT}\\{NAME}

  Contents:
    ✓ GoatPedia landing page   visible on load
    ✓ Nebula app               hidden, shown by triggers
    ✓ style.css                inlined
    ✓ script.js                inlined, deferred via __bootNebula()
    ✓ ui.js                    inlined + merged
    ✓ tooltips.json            baked in (no fetch)
    ✓ Firebase                 CDN (unchanged)
    ✓ Google Fonts             CDN (deduplicated)

  Triggers still work:
    • Double-click "nebula" in the goat-eye paragraph
    • Konami code  ↑↑↓↓←→←→BA
    • Triple-click the © in the footer

─────────────────────────────────────────────────────────────────────────────
""")