/**
 * gamefetch.js — NEBULA game fetching logic
 * Supports two sources: gn-math (default) and UGS (Ultimate Game Stash)
 */

export const COVER_URL = "https://cdn.jsdelivr.net/gh/gn-math/covers@main";
export const HTML_URL  = "https://cdn.jsdelivr.net/gh/gn-math/html@main";

const GN_ZONE_URLS = [
  "https://cdn.jsdelivr.net/gh/gn-math/assets@main/zones.json",
  "https://cdn.jsdelivr.net/gh/gn-math/assets@latest/zones.json",
  "https://cdn.jsdelivr.net/gh/gn-math/assets@master/zones.json",
];

/* ═══════════════════════════════════��══════
   GN-MATH SOURCE
══════════════════════════════════════════ */
export async function loadGnMathGames() {
  const cacheKey = 'nebula-zones-gn-cache';
  const cacheTTL = 30 * 60 * 1000;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const { ts, data } = JSON.parse(cached);
      if (Date.now() - ts < cacheTTL) return data;
    }
  } catch {}

  let url = GN_ZONE_URLS[0];
  try {
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), 4000);
    const r    = await fetch("https://api.github.com/repos/gn-math/assets/commits?t=" + Date.now(), { signal: ctrl.signal });
    clearTimeout(tid);
    if (r.status === 200) {
      const j = await r.json();
      const sha = j[0]?.sha;
      if (sha) url = `https://cdn.jsdelivr.net/gh/gn-math/assets@${sha}/zones.json`;
    }
  } catch {}

  const ctrl = new AbortController();
  const tid  = setTimeout(() => ctrl.abort(), 8000);
  const res  = await fetch(url + "?t=" + Date.now(), { signal: ctrl.signal });
  clearTimeout(tid);
  let zones = await res.json();
  zones = zones
    .filter(z => !z.name.includes("SUGGEST"))
    .map(z => ({ ...z, source: 'gn-math' }));

  try { sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: zones })); } catch {}
  return zones;
}

export async function fetchGnMathPopularity() {
  const pop = {};
  try {
    const res  = await fetch("https://data.jsdelivr.com/v1/stats/packages/gh/gn-math/html@main/files?period=year");
    const data = await res.json();
    data.forEach(file => {
      const m = file.name.match(/\/(\d+)\.html$/);
      if (m) pop[parseInt(m[1])] = file.hits.total;
    });
  } catch {}
  return pop;
}

/* ══════════════════════════════════════════
   UGS SOURCE
══════════════════════════════════════════ */
export async function loadUGSGames() {
  const cacheKey = 'nebula-zones-ugs-cache';
  const cacheTTL = 30 * 60 * 1000;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const { ts, data } = JSON.parse(cached);
      if (Date.now() - ts < cacheTTL && data.length > 0) return data;
    }
  } catch {}

  return new Promise((resolve) => {
    // Build a minimal host page that mirrors the UGS reference HTML
    const html = `<!DOCTYPE html><html><head></head><body>
      <div id="sections-container"></div>
      <script>
        // Relay parsed games back to parent once script finishes
        function _sendGames() {
          const games = [];
          document.querySelectorAll('input[type="button"]').forEach((btn, i) => {
            const name = btn.value || '';
            const onclick = btn.getAttribute('onclick') || '';
            const m = onclick.match(/(?:location\\.href|window\\.location(?:\\.href)?|location)\\s*=\\s*['"]([^'"]+)['"]/);
            if (name && m && m[1]) {
              games.push({ id: 'ugs_' + i, name, url: m[1], cover: null, source: 'ugs' });
            }
          });
          window.parent.postMessage({ type: '__ugs_games__', games }, '*');
        }
      <\/script>
      <script
        src="https://cdn.jsdelivr.net/gh/genizy/ugs-singlefile@main/games.js"
        onload="setTimeout(_sendGames, 200)"
        onerror="window.parent.postMessage({type:'__ugs_games__',games:[]},'*')"
      ><\/script>
    </body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;border:none;visibility:hidden;pointer-events:none;';
    iframe.src = blobUrl;

    const timeout = setTimeout(() => {
      cleanup();
      resolve([]);
    }, 12000);

    function onMessage(e) {
      if (!e.data || e.data.type !== '__ugs_games__') return;
      cleanup();
      const games = e.data.games || [];
      try { sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: games })); } catch {}
      resolve(games);
    }

    function cleanup() {
      clearTimeout(timeout);
      window.removeEventListener('message', onMessage);
      try { document.body.removeChild(iframe); } catch {}
      URL.revokeObjectURL(blobUrl);
    }

    window.addEventListener('message', onMessage);
    document.body.appendChild(iframe);
  });
}

/* ══════════════════════════════════════════
   FILTER + SORT
══════════════════════════════════════════ */
/**
 * @param {Array}  games
 * @param {Object} opts
 *   query        {string}  search text
 *   sortBy       {string}  'popular' | 'name' | 'id'
 *   popularityData {Object}
 *   favsOnly     {boolean}
 *   favIds       {Array}
 */
export function filterAndSort(games, { query = '', sortBy = 'popular', popularityData = {}, favsOnly = false, favIds = [] } = {}) {
  let filtered = games.filter(z => {
    const matchSearch = z.name.toLowerCase().includes(query.toLowerCase());
    const matchFav    = favsOnly ? favIds.includes(z.id) : true;
    return matchSearch && matchFav;
  });

  if (sortBy === 'name') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'id') {
    filtered.sort((a, b) => {
      const ai = typeof a.id === 'number' ? a.id : 0;
      const bi = typeof b.id === 'number' ? b.id : 0;
      return bi - ai;
    });
  } else {
    // popular (default) — only meaningful for gn-math; petezah gets original order
    filtered.sort((a, b) => (popularityData[b.id] || 0) - (popularityData[a.id] || 0));
  }
  return filtered;
}

/* ══════════════════════════════════════════
   URL RESOLVERS
══════════════════════════════════════════ */
export function resolveGameUrl(z) {
  if (!z) return '';
  if (z.source === 'ugs') return z.url || '';
  if (z.source === 'petezah') {
    return z.url || '';
  }
  // gn-math
  if (z.url && z.url.startsWith('http')) return z.url;
  return (z.url || '').replace('{HTML_URL}', HTML_URL).replace('{COVER_URL}', COVER_URL);
}

export function resolveCoverUrl(z) {
  if (!z) return '';
  if (z.source === 'ugs') return '';
  if (z.source === 'petezah') return z.cover || '';
  return (z.cover || '').replace('{COVER_URL}', COVER_URL).replace('{HTML_URL}', HTML_URL);
}