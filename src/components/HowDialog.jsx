import { useEffect, useRef } from 'react';

export default function HowDialog({ open, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog ref={ref} onClose={onClose}>
      <div className="doc">
        <h2>How a Markdown → mind map works</h2>
        <p className="sub">The whole engine is two small libraries. No server, no AI.</p>
        <ol>
          <li>
            <b>Parse</b> — <code>markmap-lib</code>&rsquo;s <code>Transformer</code> reads your Markdown and
            turns headings (<code>#</code>, <code>##</code>) and nested lists (<code>-</code>) into a tree of
            nodes.
          </li>
          <li>
            <b>Render</b> — <code>markmap-view</code> (built on <code>d3</code>) draws that tree as a
            zoomable, pannable SVG with the curved branches.
          </li>
          <li>
            <b>Live loop</b> — on every keystroke (debounced) it re-runs the transform and calls{' '}
            <code>mm.setData(root); mm.fit()</code>. That is the &ldquo;instant&rdquo; feeling.
          </li>
        </ol>
        <pre>{`import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';

const { root } = new Transformer().transform(md);
Markmap.create(svgEl).setData(root);`}</pre>
        <button className="primary close" onClick={onClose}>
          Got it
        </button>
      </div>
    </dialog>
  );
}
