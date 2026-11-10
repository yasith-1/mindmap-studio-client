import * as d3 from 'd3';
import {
  assignColors,
  attachTooltip,
  enableNodeDrag,
  makeZoomable,
  theme,
  truncate,
} from './shared.js';

const MAX_LABEL = 24;

const NODE_W = 188;
const NODE_H = 40;
const ROW_GAP = 22; // vertical space between siblings (room for diamonds)
const COL_GAP = 70; // horizontal space between stages

const IO_RE = /^(input|output|read|print|display|show|get|enter|scan|write|return|fetch|load|save)\b/i;

/**
 * Pick the standard flowchart symbol for a node from its position and text:
 *   terminal (oval)   — the root (Start) and leaves (End)
 *   decision (diamond) — text phrased as a question ("...?")
 *   io (parallelogram) — input/output verbs
 *   process (rectangle) — everything else
 */
function shapeOf(d) {
  const name = (d.data?.name || '').trim();
  if (d.depth === 0) return 'terminal'; // Start
  if (/\?\s*$/.test(name)) return 'decision';
  if (IO_RE.test(name)) return 'io';
  if (!d.children) return 'terminal'; // End
  return 'process';
}

/**
 * Left-to-right flow chart using proper flowchart symbols — oval start/end,
 * diamond decisions, parallelogram input/output and rectangle processes —
 * joined by orthogonal connectors with arrowheads (flow parent -> child).
 */
export function renderFlow(svgEl, data) {
  const t = theme();
  const { g, svg, fit, zoomIn, zoomOut, destroy } = makeZoomable(svgEl);
  const root = d3.hierarchy(data);

  d3.tree().nodeSize([NODE_H + ROW_GAP, NODE_W + COL_GAP])(root);
  assignColors(root);
  // Cartesian node centres (left-to-right: depth → x, breadth → y).
  root.each((d) => {
    d.px = d.y;
    d.py = d.x;
    d.shape = shapeOf(d);
  });

  // Arrowhead marker — `context-stroke` makes each arrow take its link's colour.
  svg
    .append('defs')
    .append('marker')
    .attr('id', 'flow-arrow')
    .attr('viewBox', '0 0 10 10')
    .attr('refX', 9)
    .attr('refY', 5)
    .attr('markerWidth', 7)
    .attr('markerHeight', 7)
    .attr('orient', 'auto-start-reverse')
    .append('path')
    .attr('d', 'M0,0 L10,5 L0,10 z')
    .attr('fill', 'context-stroke');

  // Orthogonal connector: out the right of the source, into the left of the target.
  const elbow = (d) => {
    const sx = d.source.px + NODE_W / 2;
    const sy = d.source.py;
    const tx = d.target.px - NODE_W / 2 - 7; // stop short for the arrowhead
    const ty = d.target.py;
    const mx = (sx + tx) / 2;
    return `M${sx},${sy} H${mx} V${ty} H${tx}`;
  };

  const link = g
    .append('g')
    .attr('fill', 'none')
    .attr('stroke-width', 1.5)
    .selectAll('path')
    .data(root.links())
    .join('path')
    .attr('stroke', (d) => d.target.color) // colour each branch, markmap-style
    .attr('d', elbow)
    .attr('marker-end', 'url(#flow-arrow)');

  const node = g
    .append('g')
    .selectAll('g')
    .data(root.descendants())
    .join('g')
    .attr('transform', (d) => `translate(${d.px},${d.py})`);

  // Draw the correct flowchart symbol for each node.
  const SKEW = 16; // parallelogram slant
  const DIA_HY = NODE_H * 0.62; // diamond half-height
  node.each(function (d) {
    const el = d3.select(this);
    const w = NODE_W;
    const h = NODE_H;
    let shape;
    if (d.shape === 'decision') {
      shape = el
        .append('polygon')
        .attr('points', `0,${-DIA_HY} ${w / 2},0 0,${DIA_HY} ${-w / 2},0`);
    } else if (d.shape === 'io') {
      shape = el
        .append('polygon')
        .attr(
          'points',
          `${-w / 2 + SKEW},${-h / 2} ${w / 2},${-h / 2} ${w / 2 - SKEW},${h / 2} ${-w / 2},${h / 2}`
        );
    } else if (d.shape === 'terminal') {
      // Oval / stadium (fully rounded ends).
      shape = el
        .append('rect')
        .attr('x', -w / 2)
        .attr('y', -h / 2)
        .attr('width', w)
        .attr('height', h)
        .attr('rx', h / 2)
        .attr('ry', h / 2);
    } else {
      // Process rectangle.
      shape = el
        .append('rect')
        .attr('x', -w / 2)
        .attr('y', -h / 2)
        .attr('width', w)
        .attr('height', h)
        .attr('rx', 3);
    }
    shape
      .attr('fill', d.depth === 0 ? t.accent : t.surface)
      .attr('stroke', d.depth === 0 ? t.accent : d.color)
      .attr('stroke-width', d.depth === 0 ? 1.5 : 2);
  });

  node
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '0.32em')
    .attr('font-size', 13)
    .attr('font-family', "'Hanken Grotesk', system-ui, sans-serif")
    .attr('font-weight', (d) => (d.depth === 0 ? 600 : 500))
    .attr('fill', (d) => (d.depth === 0 ? '#fff' : t.fg))
    .text((d) => truncate(d.data.name, MAX_LABEL));

  // Full label on hover when it's been truncated.
  attachTooltip(node, (d) => (d.data.name.length > MAX_LABEL ? d.data.name : null));
  enableNodeDrag(node, link, elbow);

  requestAnimationFrame(() => fit());

  return { fit, zoomIn, zoomOut, destroy, count: root.descendants().length };
}
