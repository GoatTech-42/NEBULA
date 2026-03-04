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
      if (Date.now() - ts < cacheTTL) return data;
    }
  } catch {}

  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch('https://cdn.jsdelivr.net/gh/genizy/ugs-singlefile@main/games.js?t=' + Date.now(), { signal: ctrl.signal });
    clearTimeout(tid);
    const text = await res.text();

    const games = [];
    let i = 0;

    // Pattern 1: addGame('Name', 'url') or addGame("Name", "url")
    const pat1 = /addGame\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)/g;
    let m;
    while ((m = pat1.exec(text)) !== null) {
      games.push({ id: 'ugs_' + i++, name: m[1], url: m[2], cover: null, source: 'ugs' });
    }

    // Pattern 2: addButton('Name', 'url')
    if (games.length === 0) {
      const pat2 = /addButton\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)/g;
      while ((m = pat2.exec(text)) !== null) {
        games.push({ id: 'ugs_' + i++, name: m[1], url: m[2], cover: null, source: 'ugs' });
      }
    }

    // Pattern 3: value='Name' onclick="location.href='url'" — input button in HTML-in-JS strings
    if (games.length === 0) {
      const pat3 = /value=['"]([^'"]+)['"]\s+onclick=['"](?:location\.href|window\.location)\s*=\s*\\?['"]([^'"\\]+)\\?['"]/g;
      while ((m = pat3.exec(text)) !== null) {
        games.push({ id: 'ugs_' + i++, name: m[1], url: m[2], cover: null, source: 'ugs' });
      }
    }

    // Pattern 4: innerHTML / template literal patterns with location.href
    if (games.length === 0) {
      const pat4 = /value=['"]((?:[^'"\\]|\\.)+)['"]\s+onclick=['"]\s*location\.href\s*=\s*\\?['"]([^'"\\]+)/g;
      while ((m = pat4.exec(text)) !== null) {
        games.push({ id: 'ugs_' + i++, name: m[1].replace(/\\'/g, "'"), url: m[2], cover: null, source: 'ugs' });
      }
    }

    // Pattern 5: Generic — find all pairs of quoted strings where 2nd looks like a URL
    if (games.length === 0) {
      const pat5 = /['"]([A-Za-z0-9 :!@#$%^&*()\-_+=,.?/\\]{3,60})['"]\s*,\s*['"]((https?:\/\/|\/)[^'"]{5,})['"]/g;
      while ((m = pat5.exec(text)) !== null) {
        if (!m[2].includes('.js') && !m[2].includes('.css')) {
          games.push({ id: 'ugs_' + i++, name: m[1], url: m[2], cover: null, source: 'ugs' });
        }
      }
    }

    try { sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: games })); } catch {}
    return games;
  } catch {
    return [];
  }
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
  if (z.source === 'ugs' || z.source === 'petezah') {
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