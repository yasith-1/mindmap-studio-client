// Theme concerns: colour maths and the CSS-variable/attribute plumbing that
// drives the app's look. Kept free of React so it can be tested and reused.

export const DEFAULT_ACCENT = '#2dd4bf';

/** Normalise any CSS colour to a #rrggbb hex the picker and maths can use. */
export function toHex(value) {
  const v = (value || '').trim();
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(v)) {
    return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`.toLowerCase();
  }
  const m = /rgba?\(([^)]+)\)/i.exec(v);
  if (m) {
    const [r, g, b] = m[1].split(',').map((n) => parseInt(n, 10));
    return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
  }
  return '';
}

/** Drive the whole app's colour by setting the accent CSS variables. */
export function applyAccent(hex) {
  const h = toHex(hex);
  if (!h) return;
  const n = parseInt(h.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const root = document.documentElement;
  root.style.setProperty('--accent', h);
  root.style.setProperty('--accent-weak', `rgba(${r}, ${g}, ${b}, 0.16)`);
}

/** Force the light/dark palette. */
export function applyMode(mode) {
  document.documentElement.setAttribute('data-theme', mode);
}

export function prefersDark() {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

/** The accent currently resolved from CSS (used to seed the picker). */
export function currentAccent() {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--accent');
  return toHex(value) || DEFAULT_ACCENT;
}
