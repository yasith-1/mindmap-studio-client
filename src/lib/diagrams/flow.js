import * as d3 from 'd3';
import { enableNodeDrag, makeZoomable, theme, truncate } from './shared.js';

const NODE_W = 188;
const NODE_H = 40;
const ROW_GAP = 16; // vertical space between siblings
const COL_GAP = 70; // horizontal space between stages

/**
 * Left-to-right flow chart: sharp process boxes joined by orthogonal
 * connectors with arrowheads, showing direction of flow parent -> child.
 */
export function renderFlow(svgEl, data) {
  const t = theme();
  const { g, svg, fit, zoomIn, zoomOut, destroy } = makeZoomable(svgEl);
  const root = d3.hierarchy(data);

  d3.tree().nodeSize([NODE_H + ROW_GAP, NODE_W + COL_GAP])(root);
  // Cartesian node centres (left-to-right: depth → x, breadth → y).
  root.each((d) => {
    d.px = d.y;
    d.py = d.x;
  });

  // Arrowhead marker.
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
    .attr('fill', t.muted);

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
    .attr('stroke', t.muted)
    .attr('stroke-width', 1.5)
    .selectAll('path')
    .data(root.links())
    .join('path')
    .attr('d', elbow)
    .attr('marker-end', 'url(#flow-arrow)');

  const node = g
    .append('g')
    .selectAll('g')
    .data(root.descendants())
    .join('g')
    .attr('transform', (d) => `translate(${d.px},${d.py})`);

  node
    .append('rect')
    .attr('x', -NODE_W / 2)
    .attr('y', -NODE_H / 2)
    .attr('width', NODE_W)
    .attr('height', NODE_H)
    .attr('rx', 4)
    .attr('fill', (d) => (d.depth === 0 ? t.accent : t.surface))
    .attr('stroke', t.accent)
    .attr('stroke-width', (d) => (d.depth === 0 ? 1.5 : 2));

  const label = node
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '0.32em')
    .attr('font-size', 13)
    .attr('font-family', "'Hanken Grotesk', system-ui, sans-serif")
    .attr('font-weight', (d) => (d.depth === 0 ? 600 : 500))
    .attr('fill', (d) => (d.depth === 0 ? '#fff' : t.fg))
    .text((d) => truncate(d.data.name, 24));

  label.append('title').text((d) => d.data.name);

  enableNodeDrag(node, link, elbow);

  requestAnimationFrame(() => fit());

  return { fit, zoomIn, zoomOut, destroy, count: root.descendants().length };
}
