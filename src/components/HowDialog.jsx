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
    <dialog
      ref={ref}
      onClose={onClose}
      className="max-h-[calc(100dvh-32px)] max-w-[min(560px,92vw)] overflow-auto rounded-[14px] border border-line bg-surface p-0 text-fg shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
    >
      <div className="px-6 py-[22px] [&_code]:rounded-[5px] [&_code]:border [&_code]:border-line [&_code]:bg-panel [&_code]:px-[5px] [&_code]:py-px [&_code]:font-mono [&_code]:text-[0.82em]">
        <h2 className="mb-1 mt-0 text-[1.15rem] tracking-[-0.01em]">
          How a Markdown → mind map works
        </h2>
        <p className="mb-4 mt-0 text-[0.86rem] text-muted">
          The whole engine is two small libraries. No server, no AI.
        </p>
        <ol className="m-0 flex flex-col gap-[11px] pl-5 [&_b]:text-accent">
          <li className="text-[0.9rem] leading-[1.5]">
            <b>Parse</b> — <code>markmap-lib</code>&rsquo;s <code>Transformer</code> reads your Markdown
            and turns headings (<code>#</code>, <code>##</code>) and nested lists (<code>-</code>) into a
            tree of nodes.
          </li>
          <li className="text-[0.9rem] leading-[1.5]">
            <b>Render</b> — <code>markmap-view</code> (built on <code>d3</code>) draws that tree as a
            zoomable, pannable SVG with the curved branches.
          </li>
          <li className="text-[0.9rem] leading-[1.5]">
            <b>Live loop</b> — on every keystroke (debounced) it re-runs the transform and calls{' '}
            <code>mm.setData(root); mm.fit()</code>. That is the &ldquo;instant&rdquo; feeling.
          </li>
        </ol>
        <pre className="mt-[14px] overflow-x-auto rounded-[9px] border border-line bg-panel p-3 font-mono text-[0.76rem] leading-[1.55]">{`import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';

const { root } = new Transformer().transform(md);
Markmap.create(svgEl).setData(root);`}</pre>
        <button className="btn btn-primary mt-[18px] w-full justify-center" onClick={onClose}>
          Got it
        </button>
      </div>
    </dialog>
  );
}
