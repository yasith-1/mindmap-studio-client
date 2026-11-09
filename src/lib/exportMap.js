// Render a SAVED map (just its markdown + diagram kind, not anything currently
// on screen) into a crisp PNG. The map is drawn into a detached, off-screen
// <svg> using the same engines as the live canvas, then rasterised and handed
// back as a PNG blob. Used by the "download" action in the saved-maps list.
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import { parseTree } from './diagrams/shared.js';
import { renderTree } from './diagrams/tree.js';
import { renderFlow } from './diagrams/flow.js';
import { renderConcept } from './diagrams/concept.js';
import { svgElementToPngBlob } from './exportSvg.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const transformer = new Transformer();

// Mirrors the live canvas options; duration 0 so the layout settles instantly.
const MARKMAP_OPTIONS = {
  duration: 0,
  nodeMinHeight: 16,
  spacingVertical: 8,
  spacingHorizontal: 92,
  paddingX: 14,
  maxWidth: 260,
  autoFit: false,
  fitRatio: 0.92,
};

const D3_RENDERERS = { tree: renderTree, flow: renderFlow, concept: renderConcept };

// setTimeout (not requestAnimationFrame) so the render still progresses when
// the tab is in the background — rAF is paused in hidden tabs, which would hang
// a download started just before the user switched away.
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// markmap measures its HTML nodes asynchronously; resolve once the content
// group's width stops changing (or we give up after maxTries).
async function waitForStableContent(svg, { step = 40, maxTries = 60 } = {}) {
  let last = -1;
  let stable = 0;
  for (let tries = 0; tries < maxTries; tries++) {
    await delay(step);
    const g = svg.querySelector('g');
    const w = g ? g.getBBox().width : 0;
    stable = w > 0 && Math.abs(w - last) < 0.5 ? stable + 1 : 0;
    last = w;
    if (stable >= 2) return;
  }
}

/**
 * @param {string} markdown
 * @param {string} kind  'mindmap' | 'tree' | 'flow' | 'concept'
 * @param {number} scale pixel multiplier (higher = sharper / larger)
 * @returns {Promise<Blob>} a PNG blob
 */
export async function renderMapToPngBlob(markdown, kind = 'mindmap', scale = 3) {
  // Off-screen but still laid out, so getBBox() works (display:none would not).
  const host = document.createElement('div');
  host.style.cssText =
    'position:fixed;left:-10000px;top:0;width:1600px;height:1000px;opacity:0;pointer-events:none;z-index:-1;';
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', '1600');
  svg.setAttribute('height', '1000');
  svg.style.cssText = 'width:1600px;height:1000px;display:block;';
  host.appendChild(svg);
  document.body.appendChild(host);

  let mm = null;
  let ctrl = null;
  try {
    if (kind === 'mindmap') {
      mm = Markmap.create(svg, { ...MARKMAP_OPTIONS });
      const { root } = transformer.transform(markdown || '');
      mm.setData(root);
      await waitForStableContent(svg);
    } else {
      const renderer = D3_RENDERERS[kind] || renderTree;
      ctrl = renderer(svg, parseTree(markdown || ''));
      await delay(120); // let the d3 layout + fit settle
    }
    return await svgElementToPngBlob(svg, scale);
  } finally {
    try {
      mm?.destroy?.();
    } catch {
      /* ignore */
    }
    try {
      ctrl?.destroy?.();
    } catch {
      /* ignore */
    }
    host.remove();
  }
}
