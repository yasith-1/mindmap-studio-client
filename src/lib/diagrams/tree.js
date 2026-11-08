import * as d3 from 'd3';
import { assignColors, enableNodeDrag, makeZoomable, theme, truncate } from './shared.js';

const NODE_W = 170;
const NODE_H = 34;
const ROW_GAP = 14; // vertical space between siblings
const COL_GAP = 56; // horizontal space between depth levels

/**
 * Left-to-right hierarchy tree: rounded node boxes connected by soft
 * curved links. Reads cleanly for text-heavy outlines of any breadth.
 */
export function renderTree(svgEl, data) {
  const t = theme();
  const { g, fit, zoomIn, zoomOut, destroy } = makeZoomable(svgEl);
  const root = d3.hierarchy(data);

  d3.tree().nodeSize([NODE_H + ROW_GAP, NODE_W + COL_GAP])(root);
  assignColors(root);
  // Cartesian node centres (left-to-right: depth → x, breadth → y).
  root.each((d) => {
    d.px = d.y;
    d.py = d.x;
  });

  // Soft horizontal cubic between node centres, from current px/py.
  const linkPath = (d) => {
    const mx = (d.source.px + d.target.px) / 2;
    return `M${d.source.px},${d.source.py} C${mx},${d.source.py} ${mx},${d.target.py} ${d.target.px},${d.target.py}`;
  };

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

  node
    .append('rect')
    .attr('x', -NODE_W / 2)
    .attr('y', -NODE_H / 2)
    .attr('width', NODE_W)
    .attr('height', NODE_H)
    .attr('rx', 9)
    .attr('fill', (d) => (d.depth === 0 ? t.accent : t.surface))
    .attr('stroke', (d) => (d.depth === 0 ? t.accent : d.color))
    .attr('stroke-width', 1.5);

  const label = node
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '0.32em')
    .attr('font-size', 13)
    .attr('font-family', "'Hanken Grotesk', system-ui, sans-serif")
    .attr('font-weight', (d) => (d.depth === 0 ? 600 : 400))
    .attr('fill', (d) => (d.depth === 0 ? '#fff' : t.fg))
    .text((d) => truncate(d.data.name, 22));

  label.append('title').text((d) => d.data.name);

  enableNodeDrag(node, link, linkPath);

  requestAnimationFrame(() => fit());

  return { fit, zoomIn, zoomOut, destroy, count: root.descendants().length };
}
