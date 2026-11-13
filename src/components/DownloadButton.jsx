import { useEffect, useRef, useState } from 'react';
import { DownloadIcon, ChevronDownIcon } from './Icons.jsx';

const FORMATS = [
  { id: 'svg', label: 'SVG', hint: 'Vector · scales perfectly' },
  { id: 'png', label: 'PNG', hint: 'Image · transparent' },
  { id: 'jpeg', label: 'JPEG', hint: 'Image · smaller file' },
];

/**
 * Split download button: the main part downloads SVG (the long-standing
 * default); the caret opens a menu to pick SVG / PNG / JPEG. Calls
 * `onDownload(format)` with the chosen format id.
 */
export default function DownloadButton({ onDownload, className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = (fmt) => {
    setOpen(false);
    onDownload(fmt);
  };

  return (
    <div className={`relative inline-flex ${className}`} ref={ref}>
      <button
        type="button"
        className="btn btn-primary flex-1 justify-center rounded-r-none max-[600px]:flex-col max-[600px]:gap-0.5 max-[600px]:py-1.5"
        onClick={() => pick('svg')}
        title="Download the diagram as SVG"
        aria-label="Download diagram as SVG"
      >
        <DownloadIcon width="15" height="15" />{' '}
        <span className="max-[600px]:text-[0.62rem] max-[600px]:font-semibold max-[600px]:leading-tight">
          Download
        </span>
      </button>
      <button
        type="button"
        className="btn btn-primary rounded-l-none border-l-[rgba(0,0,0,0.22)] px-1.5"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Choose download format"
        title="Choose format"
      >
        <ChevronDownIcon width="14" height="14" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-50 w-52 overflow-hidden rounded-[10px] border border-line bg-surface text-fg shadow-[0_12px_40px_rgba(0,0,0,0.25)]"
        >
          <div className="border-b border-line px-3 py-2 text-[0.64rem] font-semibold uppercase tracking-[0.05em] text-muted">
            Download as
          </div>
          {FORMATS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="menuitem"
              className="flex w-full cursor-pointer items-baseline gap-2 border-0 bg-transparent px-3 py-2 text-left hover:bg-panel"
              onClick={() => pick(f.id)}
            >
              <span className="w-10 flex-none text-[0.84rem] font-semibold text-fg">{f.label}</span>
              <span className="text-[0.72rem] text-muted">{f.hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
