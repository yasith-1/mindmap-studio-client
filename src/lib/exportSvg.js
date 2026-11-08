// Turn the live markmap <svg> into a standalone, styled SVG string.
// markmap applies its styles through a global <style> tag, so for an
// export we have to inline those rules into a clone of the node.

function collectMarkmapCss() {
  let css = '';
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule.selectorText && rule.selectorText.includes('markmap')) {
          css += rule.cssText + '\n';
        }
      }
    } catch {
      // cross-origin stylesheet — skip it
    }
  }
  return css;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

// Chrome taints a canvas when it rasterises an SVG containing <foreignObject>,
// which breaks PNG export of the markmap view. For the raster path we swap each
// foreignObject (markmap's HTML label) for a plain SVG <text> at the same spot.
function inlineForeignObjects(clone, fg) {
  for (const fo of [...clone.querySelectorAll('foreignObject')]) {
    const x = parseFloat(fo.getAttribute('x')) || 0;
    const y = parseFloat(fo.getAttribute('y')) || 0;
    const h = parseFloat(fo.getAttribute('height')) || 20;
    const text = (fo.textContent || '').replace(/\s+/g, ' ').trim();
    const t = document.createElementNS(SVG_NS, 'text');
    t.setAttribute('x', x + 2);
    t.setAttribute('y', y + h / 2);
    t.setAttribute('dominant-baseline', 'middle');
    t.setAttribute('font-size', '13');
    t.setAttribute('font-family', "'Hanken Grotesk', system-ui, sans-serif");
    t.setAttribute('fill', fg);
    t.textContent = text;
    fo.parentNode.replaceChild(t, fo);
  }
}

function buildSvg(svgEl, { rasterSafe = false } = {}) {
  const clone = svgEl.cloneNode(true);

  const cs = getComputedStyle(document.body);
  const fg = cs.getPropertyValue('--fg').trim() || '#111';
  const bg = cs.getPropertyValue('--surface').trim() || '#fff';

  if (rasterSafe) inlineForeignObjects(clone, fg);

  let css = collectMarkmapCss();
  css += `.markmap-foreign,.markmap-foreign *{color:${fg};font-family:'Hanken Grotesk',system-ui,sans-serif}`;

  // Fit the viewBox tightly to the drawn content, ignoring current pan/zoom.
  const g = svgEl.querySelector('g');
  const box = g.getBBox();
  const pad = 24;
  const w = Math.ceil(box.width + pad * 2);
  const h = Math.ceil(box.height + pad * 2);

  const cloneG = clone.querySelector('g');
  if (cloneG) cloneG.removeAttribute('transform');

  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', w);
  clone.setAttribute('height', h);
  clone.setAttribute('viewBox', `${box.x - pad} ${box.y - pad} ${w} ${h}`);

  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = css;
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', box.x - pad);
  rect.setAttribute('y', box.y - pad);
  rect.setAttribute('width', w);
  rect.setAttribute('height', h);
  rect.setAttribute('fill', bg);

  clone.insertBefore(rect, clone.firstChild);
  clone.insertBefore(style, clone.firstChild);

  const svg =
    '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(clone);
  return { svg, width: w, height: h };
}

export function serializeMindmap(svgEl) {
  if (!svgEl) return '';
  return buildSvg(svgEl).svg;
}

export async function copyMindmapSvg(svgEl) {
  const svg = serializeMindmap(svgEl);
  await navigator.clipboard.writeText(svg);
  return svg;
}

// Rasterise the serialized SVG to a PNG blob at `scale`× for a crisp image.
function svgToPngBlob(svg, width, height, scale = 2) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))), 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('SVG image failed to load'));
    };
    img.src = url;
  });
}

export async function copyMindmapPng(svgEl) {
  if (!svgEl) throw new Error('No diagram');
  const { svg, width, height } = buildSvg(svgEl, { rasterSafe: true });
  // Await the blob first so a rasterisation failure throws here (rather than
  // leaving a stale image on the clipboard) and the caller can report it.
  const blob = await svgToPngBlob(svg, width, height);
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
}

// In a real deployment (unlike a sandboxed preview) this triggers a download.
export function downloadMindmapSvg(svgEl, filename = 'mindmap.svg') {
  const svg = serializeMindmap(svgEl);
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
