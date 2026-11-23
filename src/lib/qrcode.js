// QR encoding boundary. The `qrcode` package is imported ONLY here — the rest
// of the app talks to these thin, intent-revealing functions, so swapping the
// library (or its options) is a one-file change and never ripples outwards.
import QRCode from 'qrcode';

// Dark-on-white with a quiet margin scans most reliably on any screen or print,
// regardless of the app's light/dark theme — so QR colours are deliberately
// fixed here rather than following the UI accent.
const DEFAULTS = {
  size: 220, // px, square
  margin: 2, // modules of quiet zone
  dark: '#0b1220',
  light: '#ffffff',
  ecLevel: 'M', // error correction: tolerates ~15% damage
};

const opts = (o) => {
  const { size, margin, dark, light, ecLevel } = { ...DEFAULTS, ...o };
  return { width: size, margin, errorCorrectionLevel: ecLevel, color: { dark, light } };
};

/** Encode `text` as a PNG data URL — ready to drop into an <img src>. */
export async function qrToDataUrl(text, options = {}) {
  if (!text) throw new Error('Nothing to encode');
  return QRCode.toDataURL(text, opts(options));
}

/** Encode `text` as a PNG Blob — for downloads and clipboard writes. */
export async function qrToPngBlob(text, options = {}) {
  const dataUrl = await qrToDataUrl(text, options);
  return dataUrlToBlob(dataUrl);
}

// Decode a data URL to a Blob locally. We avoid fetch(dataUrl) on purpose: the
// production CSP restricts connect-src, and this keeps QR generation offline.
function dataUrlToBlob(dataUrl) {
  const [meta, b64] = dataUrl.split(',');
  const mime = meta.match(/:(.*?);/)?.[1] || 'image/png';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
