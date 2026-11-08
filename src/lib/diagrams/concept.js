import * as d3 from 'd3';
import {
  assignColors,
  attachTooltip,
  enableNodeDrag,
  makeZoomable,
  theme,
  truncate,
} from './shared.js';

const PILL_H = 28;
const MAX_CHARS = 18;

/**
 * Concept map: the central idea in the middle with related concepts
 * radiating outward, linked by soft curves. Emphasises relationships
 * rather than strict top-down hierarchy.
 */
export function renderConcept(svgEl, data) {
  const t = theme();
  const { g, fit, zoomIn, zoomOut, destroy } = makeZoomable(svgEl);
  const root = d3.hierarchy(data);

  const radius = Math.max(240, (root.height + 1) * 150);
  d3
    .tree()
    .size([2 * Math.PI, radius])
    .separation((a, b) => (a.parent === b.parent ? 1 : 2) / Math.max(a.depth, 1))(root);
  assignColors(root);

  // Project the radial layout to cartesian node centres (px, py).
  root.each((d) => {
    const angle = d.x - Math.PI / 2;
    d.px = Math.cos(angle) * d.y;
    d.py = Math.sin(angle) * d.y;
  });

  // Straight spoke between node centres, from current px/py.
  const linkPath = (d) =>
    `M${d.source.px},${d.source.py} L${d.target.px},${d.target.py}`;

  const link = g
    .append('g')
    .attr('fill', 'none')
    // non-scaling-stroke keeps links a constant on-screen width at any zoom,
    // so they stay clearly visible even at the fully-fitted (zoomed-out) view.
    .attr('stroke-width', 1.5)
    .attr('vector-effect', 'non-scaling-stroke')
    .selectAll('path')
    .data(root.links())
    .join('path')
    .attr('stroke', (d) => d.target.color) // colour each branch, markmap-style
    .attr('d', linkPath);

  const node = g
    .append('g')
    .selectAll('g')
    .data(root.descendants())
    .join('g')
    .attr('transform', (d) => `translate(${d.px},${d.py})`);

  // Pill width estimated from the (truncated) label length.
  const pillW = (d) => Math.min(MAX_CHARS, d.data.name.length) * 7.5 + 26;

  node
    .append('rect')
    .attr('x', (d) => -pillW(d) / 2)
    .attr('y', -PILL_H / 2)
    .attr('width', pillW)
    .attr('height', PILL_H)
    .attr('rx', PILL_H / 2)
    .attr('fill', (d) => (d.depth === 0 ? t.accent : t.surface))
    .attr('stroke', (d) => (d.depth === 0 ? t.accent : d.color))
    .attr('stroke-width', 1.5);

  node
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '0.32em')
    .attr('font-size', 12)
    .attr('font-family', "'Hanken Grotesk', system-ui, sans-serif")
    .attr('font-weight', (d) => (d.depth === 0 ? 600 : 400))
    .attr('fill', (d) => (d.depth === 0 ? '#fff' : t.fg))
    .text((d) => truncate(d.data.name, MAX_CHARS));

  // Full label on hover when it's been truncated.
  attachTooltip(node, (d) => (d.data.name.length > MAX_CHARS ? d.data.name : null));
  enableNodeDrag(node, link, linkPath);

  requestAnimationFrame(() => fit());

  return { fit, zoomIn, zoomOut, destroy, count: root.descendants().length };
}
