import { useCallback, useEffect, useRef, useState } from 'react';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';

// One transformer instance is enough for the whole app.
const transformer = new Transformer();

function countNodes(node) {
  if (!node) return 0;
  let n = 1;
  (node.children || []).forEach((c) => (n += countNodes(c)));
  return n;
}

const MARKMAP_OPTIONS = {
  duration: 320,
  nodeMinHeight: 16,
  spacingVertical: 8,
  spacingHorizontal: 92,
  paddingX: 14,
  maxWidth: 260,
  autoFit: false,
  fitRatio: 0.92,
};

/**
 * Creates and drives a markmap instance bound to an <svg> ref.
 * Returns the ref to attach, an `update(markdown)` renderer,
 * the current node count, and zoom helpers.
 */
export function useMindmap() {
  const svgRef = useRef(null);
  const mmRef = useRef(null);
  const [nodeCount, setNodeCount] = useState(0);

  // Create the markmap once, after the <svg> is mounted.
  // A ResizeObserver refits the map whenever the canvas changes size.
  useEffect(() => {
    if (!svgRef.current) return undefined;
    mmRef.current = Markmap.create(svgRef.current, { ...MARKMAP_OPTIONS });

    const parent = svgRef.current.parentElement;
    let raf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => mmRef.current?.fit());
    });
    if (parent) ro.observe(parent);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      mmRef.current?.destroy?.();
      mmRef.current = null;
    };
  }, []);

  // Parse markdown -> tree -> render. This is the whole engine.
  const update = useCallback((markdown) => {
    if (!mmRef.current) return;
    const { root } = transformer.transform(markdown || '');
    mmRef.current.setData(root);
    // Fit once now and again on the next frame, after the SVG has its
    // final layout size (avoids an off-centre first render).
    mmRef.current.fit();
    requestAnimationFrame(() => mmRef.current?.fit());
    setNodeCount(countNodes(root));
  }, []);

  const zoomIn = useCallback(() => mmRef.current?.rescale(1.25), []);
  const zoomOut = useCallback(() => mmRef.current?.rescale(0.8), []);
  const fit = useCallback(() => mmRef.current?.fit(), []);

  return { svgRef, update, nodeCount, zoomIn, zoomOut, fit };
}
