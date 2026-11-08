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

export function serializeMindmap(svgEl) {
  if (!svgEl) return '';
  const clone = svgEl.cloneNode(true);

  const cs = getComputedStyle(document.body);
  const fg = cs.getPropertyValue('--fg').trim() || '#111';
  const bg = cs.getPropertyValue('--surface').trim() || '#fff';

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

  return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(clone);
}

export async function copyMindmapSvg(svgEl) {
  const svg = serializeMindmap(svgEl);
  await navigator.clipboard.writeText(svg);
  return svg;
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
