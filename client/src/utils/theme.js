const STEPS = {
  50: ['w', 0.92], 100: ['w', 0.84], 200: ['w', 0.68], 300: ['w', 0.5], 400: ['w', 0.25],
  500: [null, 0], 600: ['b', 0.12], 700: ['b', 0.28], 800: ['b', 0.42], 900: ['b', 0.56],
};

export const RADIUS_MAP = { none: '0px', sm: '0.25rem', md: '0.5rem', lg: '0.75rem', xl: '1rem' };

const isHex = (v) => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const mix = (rgb, target, amount) => rgb.map((c, i) => Math.round(c + (target[i] - c) * amount));

/** Builds a 50–900 shade scale ("r g b" strings) from a single brand color. */
export function generatePalette(hex) {
  const base = hexToRgb(hex);
  const out = {};
  for (const [shade, [dir, amt]] of Object.entries(STEPS)) {
    const rgb = dir === null ? base : mix(base, dir === 'w' ? [255, 255, 255] : [0, 0, 0], amt);
    out[shade] = rgb.join(' ');
  }
  return out;
}

/** Applies colors, radius and animation preference to <html>. Safe to call repeatedly. */
export function applyTheme(theme = {}) {
  const root = document.documentElement;
  for (const name of ['primary', 'secondary', 'accent']) {
    const hex = theme[`${name}Color`];
    if (!isHex(hex)) continue;
    for (const [shade, value] of Object.entries(generatePalette(hex))) {
      root.style.setProperty(`--color-${name}-${shade}`, value);
    }
  }
  root.style.setProperty('--radius', RADIUS_MAP[theme.borderRadius] || RADIUS_MAP.lg);
  root.dataset.animations = theme.animations === false ? 'off' : 'on';
}
