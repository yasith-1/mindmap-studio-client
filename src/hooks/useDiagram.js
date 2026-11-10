import { useCallback, useEffect, useRef, useState } from 'react';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import { parseTree } from '../lib/diagrams/shared.js';
import { renderTree } from '../lib/diagrams/tree.js';
import { renderFlow } from '../lib/diagrams/flow.js';
import { renderConcept } from '../lib/diagrams/concept.js';
import { renderMermaid } from '../lib/diagrams/mermaid.js';

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

const D3_RENDERERS = {
  tree: renderTree,
  flow: renderFlow,
  concept: renderConcept,
};

/**
 * Drives the diagram canvas. markmap (rich markdown nodes) and the custom
 * d3 layouts (`tree`, `flow`, `concept`) each own a persistent <svg> that is
 * shown or hidden — markmap is created once and never torn down, so its
 * auto-fit stays reliable. Returns both svg refs, an `update(markdown)`
 * renderer, a `setType(type)` switcher, the node count, and zoom helpers.
 */
export function useDiagram() {
  const mindmapRef = useRef(null); // <svg> for markmap
  const diagramRef = useRef(null); // <svg> for the d3 diagrams
  const mermaidRef = useRef(null); // <div> for rendered Mermaid diagrams
  const mmRef = useRef(null); // markmap instance (persistent)
  const ctrlRef = useRef(null); // active d3 / mermaid controller
  const mermaidToken = useRef(0); // guards async Mermaid renders against races
  const typeRef = useRef('mindmap');
  const mdRef = useRef('');
  const [nodeCount, setNodeCount] = useState(0);

  // Create markmap once, when its svg mounts, and keep it for the session.
  useEffect(() => {
    if (!mindmapRef.current) return undefined;
    mmRef.current = Markmap.create(mindmapRef.current, { ...MARKMAP_OPTIONS });
    return () => {
      mmRef.current?.destroy?.();
      mmRef.current = null;
      ctrlRef.current?.destroy?.();
      ctrlRef.current = null;
    };
  }, []);

  // markmap measures its HTML nodes asynchronously and animates them into
  // place, so its content box (and thus the correct fit) is only known once
  // the layout settles. Rather than guess a delay, watch the content's
  // bounding box and fit once it stops growing.
  const fitMindmapWhenStable = useCallback(() => {
    const svg = mindmapRef.current;
    if (!svg || !mmRef.current) return;
    let last = -1;
    let stable = 0;
    let tries = 0;
    const tick = () => {
      if (!mmRef.current || !svg.isConnected) return;
      const g = svg.querySelector('g'); // markmap's content group
      const w = g ? g.getBBox().width : 0;
      stable = w > 0 && Math.abs(w - last) < 0.5 ? stable + 1 : 0;
      last = w;
      if (stable >= 2 || tries >= 90) {
        mmRef.current.fit();
        return;
      }
      tries += 1;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, []);

  const renderMindmap = useCallback(() => {
    if (!mmRef.current) return;
    const { root } = transformer.transform(mdRef.current || '');
    mmRef.current.setData(root);
    fitMindmapWhenStable();
    setNodeCount(countNodes(root));
  }, [fitMindmapWhenStable]);

  const renderD3 = useCallback(() => {
    const svg = diagramRef.current;
    if (!svg) return;
    ctrlRef.current?.destroy?.();
    const renderer = D3_RENDERERS[typeRef.current] || renderTree;
    ctrlRef.current = renderer(svg, parseTree(mdRef.current));
    setNodeCount(ctrlRef.current.count);
  }, []);

  // Mermaid is async (and lazily loaded), so guard stale renders with a token.
  const renderMermaidView = useCallback(() => {
    const el = mermaidRef.current;
    if (!el) return;
    ctrlRef.current?.destroy?.();
    ctrlRef.current = null;
    const token = ++mermaidToken.current;
    renderMermaid(el, mdRef.current)
      .then((ctrl) => {
        if (token !== mermaidToken.current) {
          ctrl.destroy?.();
          return;
        }
        ctrlRef.current = ctrl;
        setNodeCount(ctrl.count);
      })
      .catch(() => {});
  }, []);

  const render = useCallback(
    (markdown, type) => {
      if (typeof markdown === 'string') mdRef.current = markdown;
      if (type) typeRef.current = type;
      if (typeRef.current === 'mindmap') renderMindmap();
      else if (typeRef.current === 'mermaid') renderMermaidView();
      else renderD3();
    },
    [renderMindmap, renderD3, renderMermaidView],
  );

  const update = useCallback((markdown) => render(markdown), [render]);
  // Re-render the stored markdown with a newly selected diagram type.
  const setType = useCallback((type) => render(undefined, type), [render]);

  // Refit the active diagram when the canvas resizes.
  useEffect(() => {
    const parent = mindmapRef.current?.parentElement;
    if (!parent) return undefined;
    let raf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (typeRef.current === 'mindmap') mmRef.current?.fit();
        else ctrlRef.current?.fit();
      });
    });
    ro.observe(parent);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  const zoomIn = useCallback(
    () => (typeRef.current === 'mindmap' ? mmRef.current?.rescale(1.25) : ctrlRef.current?.zoomIn()),
    [],
  );
  const zoomOut = useCallback(
    () => (typeRef.current === 'mindmap' ? mmRef.current?.rescale(0.8) : ctrlRef.current?.zoomOut()),
    [],
  );
  const fit = useCallback(
    () => (typeRef.current === 'mindmap' ? mmRef.current?.fit() : ctrlRef.current?.fit()),
    [],
  );

  return { mindmapRef, diagramRef, mermaidRef, update, setType, nodeCount, zoomIn, zoomOut, fit };
}
