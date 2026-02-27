/**
 * icons.js — NEBULA SVG icon library
 *
 * All icons are returned as raw SVG strings sized to 1em × 1em by default.
 * Pass { size, stroke, fill, className } to override per-call.
 *
 * Usage (in any ES module):
 *   import { icon } from './icons.js';
 *   element.innerHTML = icon('send');
 *   element.innerHTML = icon('star', { size: 20, stroke: '#38bdf8' });
 */

const PATHS = {
  /* ─ Navigation ─ */
  home:         `<path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/>`,
  chat:         `<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>`,
  mail:         `<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>`,
  gamepad:      `<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4M8 10v4M15 12h.01M18 12h.01"/>`,
  link:         `<path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>`,
  bell:         `<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>`,
  star:         `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`,
  /* ─ Actions ─ */
  send:         `<path d="M2 21l21-9L2 3v7l15 2-15 2z"/>`,
  plus:         `<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>`,
  close:        `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`,
  edit:         `<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>`,
  trash:        `<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>`,
  search:       `<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>`,
  logout:       `<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>`,
  fullscreen:   `<path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/>`,
  /* ─ Status / Info ─ */
  lock:         `<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>`,
  shield:       `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>`,
  clock:        `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`,
  eye:          `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`,
  eyeOff:       `<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9 9 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`,
  announce:     `<path d="M22 3L2 10l7.5 2.5L12 21l3-6 7-12z"/>`,
  hash:         `<line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>`,
  /* ─ Space / Cosmic ─ */
  orbit:        `<circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(45 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-45 12 12)"/>`,
  planet:       `<circle cx="12" cy="12" r="7"/><path d="M2.5 8.5C5 6.5 9.5 6 14 8.5s7.5 6 5.5 8" stroke-linecap="round"/>`,
  comet:        `<path d="M6 18L18 6M8 6h10v10" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6" cy="18" r="2"/>`,
  satellite:    `<path d="M4.5 16.5l-1-1 7-7 1 1M15 7l2-2 2 2-2 2M7 15l-2 2-2-2 2-2"/><circle cx="12" cy="12" r="3"/><path d="M19.5 4.5l1 1"/>`,
  telescope:    `<path d="M10 15l-3 3M3.5 10.5l7-7 7 7M7 13.5l3-3 3 3"/><path d="M12 17v4M10 21h4"/>`,
  nebula:       `<path d="M12 2a10 10 0 100 20A10 10 0 0012 2z"/><path d="M12 8c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4z"/><path d="M2 12h2M20 12h2M12 2v2M12 20v2"/>`,
  rocket:       `<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09zM12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>`,
  star4:        `<path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>`,
  /* ─ Heart / Fav ─ */
  heart:        `<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>`,
};

/**
 * @param {string} name  - key from PATHS above
 * @param {object} opts
 * @param {number}  [opts.size=16]
 * @param {string}  [opts.stroke='currentColor']
 * @param {string}  [opts.fill='none']
 * @param {number}  [opts.strokeWidth=2]
 * @param {string}  [opts.className='']
 * @returns {string} SVG HTML string
 */
export function icon(name, {
  size        = 16,
  stroke      = 'currentColor',
  fill        = 'none',
  strokeWidth = 2,
  className   = '',
} = {}) {
  const paths = PATHS[name];
  if(!paths){
    console.warn(`[icons.js] Unknown icon: "${name}"`);
    return '';
  }
  const cls = className ? ` class="${className}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" `
    + `width="${size}" height="${size}" `
    + `fill="${fill}" stroke="${stroke}" `
    + `stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"${cls}>`
    + paths
    + `</svg>`;
}

/**
 * Injects an icon into a DOM element, replacing its innerHTML.
 * @param {HTMLElement} el
 * @param {string} name
 * @param {object} opts  same as icon()
 */
export function setIcon(el, name, opts = {}) {
  if(el) el.innerHTML = icon(name, opts);
}

/**
 * Convenience: returns a detached <span> wrapping the icon SVG.
 * Useful when building DOM nodes programmatically.
 */
export function iconEl(name, opts = {}) {
  const span = document.createElement('span');
  span.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;';
  span.innerHTML = icon(name, opts);
  return span;
}

/** All available icon names, for tooling / debugging. */
export const iconNames = Object.keys(PATHS);