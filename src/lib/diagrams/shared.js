import * as d3 from 'd3';
import { Transformer } from 'markmap-lib';

// Shared markdown transformer (same one markmap uses).
const transformer = new Transformer();

/** Strip HTML from a markmap node's `content` down to plain text. */
function stripHtml(html) {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
}

function clean(node) {
  return {
    name: stripHtml(node.content) || '•',
    children: (node.children || []).map(clean),
  };
}

/** Markdown -> a plain { name, children } hierarchy for d3. */
export function parseTree(markdown) {
  const { root } = transformer.transform(markdown || '');
  return clean(root);
}

/** Read the live theme colors from CSS custom properties. */
export function theme() {
  const s = getComputedStyle(document.documentElement);
  const v = (name, fallback) => {
    const val = s.getPropertyValue(name).trim();
    return val || fallback;
  };
  return {
    accent: v('--accent', '#0d9488'),
    accentWeak: v('--accent-weak', 'rgba(13,148,136,0.12)'),
    fg: v('--fg', '#121a18'),
    muted: v('--muted', '#5a6663'),
    border: v('--border', '#dde3e1'),
    surface: v('--surface', '#ffffff'),
  };
}

// A categorical palette echoing markmap's coloured branches.
const BRANCH_PALETTE = d3.schemeCategory10;

/**
 * Assign each node a branch colour (markmap-style) on `d.color`, cycling a
 * categorical palette in traversal order so siblings and branches differ.
 */
export function assignColors(root) {
  root.descendants().forEach((d, i) => {
    d.color = BRANCH_PALETTE[i % BRANCH_PALETTE.length];
  });
}

/** Truncate a label and keep it tidy for a fixed-width node. */
export function truncate(text, max) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

// A single floating tooltip element, reused by every diagram.
let tipEl = null;
function ensureTip() {
  if (tipEl && tipEl.isConnected) return tipEl;
  tipEl = document.createElement('div');
  tipEl.className = 'diagram-tip';
  tipEl.hidden = true;
  document.body.appendChild(tipEl);
  return tipEl;
}

/**
 * Show the full label in a floating tooltip when a (usually truncated) node
 * is hovered. `fullText(d)` returns the text to show, or a falsy value to skip
 * the tooltip for that node (e.g. when the label isn't truncated).
 */
export function attachTooltip(nodeSel, fullText) {
  const tip = ensureTip();
  tip.hidden = true;

  const place = (event) => {
    const pad = 14;
    tip.style.left = `${event.clientX + pad}px`;
    tip.style.top = `${event.clientY + pad}px`;
    const r = tip.getBoundingClientRect();
    if (r.right > window.innerWidth) tip.style.left = `${event.clientX - r.width - pad}px`;
    if (r.bottom > window.innerHeight) tip.style.top = `${event.clientY - r.height - pad}px`;
  };

  nodeSel
    .on('mouseenter.tip', (event, d) => {
      const text = fullText(d);
      if (!text) return;
      tip.textContent = text;
      tip.hidden = false;
      place(event);
    })
    .on('mousemove.tip', (event) => {
      if (!tip.hidden) place(event);
    })
    .on('mouseleave.tip', () => {
      tip.hidden = true;
    });
}

/**
 * Make hierarchy nodes draggable. Each node datum carries cartesian centre
 * coordinates on `px`/`py`; dragging updates them, re-positions the node, and
 * redraws the links. Shows a grab / grabbing hand cursor, and stops the drag
 * from also panning the zoom canvas.
 *
 * @param nodeSel  selection of node <g> elements (data = hierarchy nodes)
 * @param linkSel  selection of link <path> elements
 * @param linkPath (d) => path string, computed from d.source/d.target px,py
 */
export function enableNodeDrag(nodeSel, linkSel, linkPath) {
  nodeSel.style('cursor', 'grab');
  const drag = d3
    .drag()
    .on('start', (event) => {
      // Don't let the canvas pan while a node is being dragged.
      event.sourceEvent?.stopPropagation();
      if (tipEl) tipEl.hidden = true;
    })
    .on('drag', function dragged(event, d) {
      d.px += event.dx;
      d.py += event.dy;
      d3.select(this).attr('transform', `translate(${d.px},${d.py})`).style('cursor', 'grabbing');
      linkSel.attr('d', linkPath);
    })
    .on('end', function ended() {
      d3.select(this).style('cursor', 'grab');
    });
  nodeSel.call(drag);
}

/**
 * Prepare an <svg> for a zoomable/pannable d3 drawing.
 * Clears the svg, adds a <g> to draw into, and wires up d3-zoom.
 * Returns the group plus fit / zoom helpers used by the toolbar.
 */
export function makeZoomable(svgEl) {
  const svg = d3.select(svgEl);
  svg.selectAll('*').remove();
  const g = svg.append('g');

  const zoom = d3
    .zoom()
    .scaleExtent([0.1, 4])
    .on('zoom', (event) => g.attr('transform', event.transform));

  svg.call(zoom).on('dblclick.zoom', null);

  function fit(padding = 48) {
    const node = g.node();
    const parent = svgEl.parentElement;
    if (!node || !parent) return;
    const b = node.getBBox();
    if (!b.width || !b.height) return;
    const W = parent.clientWidth;
    const H = parent.clientHeight;
    const scale = Math.min((W - padding * 2) / b.width, (H - padding * 2) / b.height, 1.6);
    const tx = (W - b.width * scale) / 2 - b.x * scale;
    const ty = (H - b.height * scale) / 2 - b.y * scale;
    svg
      .transition()
      .duration(300)
      .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
  }

  const zoomBy = (k) => svg.transition().duration(200).call(zoom.scaleBy, k);

  return {
    g,
    svg,
    fit,
    zoomIn: () => zoomBy(1.25),
    zoomOut: () => zoomBy(0.8),
    destroy: () => {
      svg.on('.zoom', null);
      svg.selectAll('*').remove();
    },
  };
}
