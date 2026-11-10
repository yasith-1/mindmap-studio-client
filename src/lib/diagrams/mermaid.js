import * as d3 from 'd3';

// Pulls every ```mermaid fenced block out of the Markdown.
const MERMAID_RE = /```mermaid\s*\n([\s\S]*?)```/g;

function extractMermaid(md) {
  const out = [];
  MERMAID_RE.lastIndex = 0;
  let m;
  while ((m = MERMAID_RE.exec(md || ''))) out.push(m[1].trim());
  return out.filter(Boolean);
}

// Match Mermaid's theme to the app's current light/dark mode.
function isDark() {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'dark') return true;
  if (attr === 'light') return false;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

let seq = 0;

/**
 * Render the Markdown's first ```mermaid block to a standalone SVG string,
 * suitable for rasterising to PNG. Uses SVG text labels (htmlLabels:false) so
 * the result has no <foreignObject> and won't taint an export canvas. Returns
 * null when the document has no mermaid block.
 */
export async function mermaidToSvgString(markdown) {
  const blocks = extractMermaid(markdown);
  if (blocks.length === 0) return null;

  const { default: mermaid } = await import('mermaid');
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: isDark() ? 'dark' : 'default',
    flowchart: { htmlLabels: false, curve: 'basis' },
    fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
  });

  const id = `mmd-export-${++seq}`;
  try {
    const { svg } = await mermaid.render(id, blocks[0]);
    return svg;
  } finally {
    document.getElementById(id)?.remove();
  }
}

/**
 * Render the Markdown's ```mermaid blocks as real Mermaid diagrams into
 * `container` (a div). Returns a controller ({ fit, zoomIn, zoomOut, destroy,
 * count }) matching the other diagram renderers so the shared zoom buttons
 * work. Mermaid is loaded lazily so it stays out of the main bundle.
 */
export async function renderMermaid(container, markdown) {
  const blocks = extractMermaid(markdown);

  d3.select(container).on('.zoom', null); // drop any previous pan/zoom
  container.innerHTML = '';

  if (blocks.length === 0) {
    container.innerHTML =
      '<div class="mermaid-empty">No <code>```mermaid</code> diagram in this document.<br>Add a fenced <code>mermaid</code> block to render one here.</div>';
    return { fit() {}, zoomIn() {}, zoomOut() {}, destroy() {}, count: 0 };
  }

  const { default: mermaid } = await import('mermaid');
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: isDark() ? 'dark' : 'default',
    flowchart: { htmlLabels: true, curve: 'basis' },
    fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
  });

  const inner = document.createElement('div');
  inner.className = 'mermaid-inner';
  container.appendChild(inner);

  for (let i = 0; i < blocks.length; i++) {
    const id = `mmd-${++seq}`;
    try {
      const { svg } = await mermaid.render(id, blocks[i]);
      const box = document.createElement('div');
      box.className = 'mermaid-diagram';
      box.innerHTML = svg;
      inner.appendChild(box);
    } catch (err) {
      const pre = document.createElement('pre');
      pre.className = 'mermaid-error';
      pre.textContent = `Mermaid error in block ${i + 1}:\n${err?.message || err}`;
      inner.appendChild(pre);
      // Mermaid can leave an orphaned error element on <body>; clean it up.
      document.getElementById(id)?.remove();
    }
  }

  // Give each SVG an explicit intrinsic size and record it. Zooming then resizes
  // the SVGs (vector-crisp) rather than CSS-scaling a bitmap (which blurs the
  // strokes into a "glow"); only panning uses a CSS translate.
  const diagrams = [...inner.querySelectorAll('svg')].map((el) => {
    const vb = el.viewBox && el.viewBox.baseVal;
    const w = vb && vb.width ? vb.width : el.getBBox().width || 1;
    const h = vb && vb.height ? vb.height : el.getBBox().height || 1;
    el.style.maxWidth = 'none';
    el.setAttribute('width', w);
    el.setAttribute('height', h);
    return { el, w, h };
  });
  const GAP = 24;
  const natW = Math.max(...diagrams.map((d) => d.w), 1);
  const natH = diagrams.reduce((sum, d) => sum + d.h, 0) + Math.max(0, diagrams.length - 1) * GAP;

  const applyScale = (k) => {
    for (const d of diagrams) {
      d.el.style.width = `${d.w * k}px`;
      d.el.style.height = `${d.h * k}px`;
    }
  };

  const zoom = d3
    .zoom()
    .scaleExtent([0.2, 4])
    .on('zoom', (ev) => {
      applyScale(ev.transform.k); // crisp vector scaling
      inner.style.transformOrigin = '0 0';
      inner.style.transform = `translate(${ev.transform.x}px,${ev.transform.y}px)`; // pan only
    });
  const sel = d3.select(container);
  sel.call(zoom).on('dblclick.zoom', null);

  // Fit the diagram sensibly: tall diagrams (e.g. flowchart TD) fit to WIDTH and
  // align to the top so nodes stay readable and you pan down; others fit whole.
  const fitTransform = () => {
    const cw = container.clientWidth || 1;
    const ch = container.clientHeight || 1;
    const pad = 32;
    const kWidth = (cw - pad) / natW;
    const tall = natH * kWidth > ch; // still taller than the viewport once width-fit
    const k = Math.min(tall ? kWidth : Math.min(kWidth, (ch - pad) / natH), 1.5);
    const tx = (cw - natW * k) / 2;
    const ty = tall ? pad / 2 : (ch - natH * k) / 2;
    return d3.zoomIdentity.translate(tx, ty).scale(k);
  };

  sel.call(zoom.transform, fitTransform()); // fit on first render

  return {
    zoomIn: () => sel.transition().duration(150).call(zoom.scaleBy, 1.25),
    zoomOut: () => sel.transition().duration(150).call(zoom.scaleBy, 0.8),
    fit: () => sel.transition().duration(200).call(zoom.transform, fitTransform()),
    destroy: () => sel.on('.zoom', null),
    count: blocks.length,
  };
}
