import { BookIcon, ImportIcon, CopyIcon, DownloadIcon } from './Icons.jsx';

// Preset accent colours; the custom picker covers everything else.
const PRESETS = ['#2dd4bf', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#22c55e'];

export default function Toolbar({ onExample, onImport, onCopy, onDownload, accent, onAccentChange }) {
  const current = (accent || '').toLowerCase();
  return (
    <header className="toolbar">
      <div className="brand">
        <svg className="glyph" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <circle cx="7" cy="16" r="4" fill="var(--accent)" />
          <circle cx="24" cy="7" r="3" fill="none" stroke="var(--accent)" strokeWidth="2" />
          <circle cx="24" cy="16" r="3" fill="none" stroke="var(--accent)" strokeWidth="2" />
          <circle cx="24" cy="25" r="3" fill="none" stroke="var(--accent)" strokeWidth="2" />
          <path
            d="M11 16H16M16 16c0-4 2-7 5-8M16 16h5M16 16c0 4 2 7 5 8"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <div className="brand-text">
          <h1>MindMap Studio</h1>
          <span className="tag">Markdown in, mind map out — live</span>
        </div>
      </div>

      <div className="accent-picker" role="group" aria-label="Accent colour">
        <span className="accent-label">Theme</span>
        {PRESETS.map((c) => (
          <button
            key={c}
            type="button"
            className={`swatch${current === c ? ' active' : ''}`}
            style={{ '--sw': c }}
            title={`Use ${c}`}
            aria-label={`Use accent ${c}`}
            aria-pressed={current === c}
            onClick={() => onAccentChange(c, true)}
          />
        ))}
        <label className="swatch custom" title="Custom colour">
          <input
            type="color"
            value={current || '#2dd4bf'}
            onInput={(e) => onAccentChange(e.target.value, false)}
            onChange={(e) => onAccentChange(e.target.value, true)}
          />
        </label>
      </div>

      <div className="tools">
        <button onClick={onExample} title="Load a sample document">
          <BookIcon width="15" height="15" /> Example
        </button>
        <button onClick={onImport} title="Import a .md / README file">
          <ImportIcon width="15" height="15" /> Import
        </button>
        <button onClick={onCopy} title="Copy the mind map as SVG">
          <CopyIcon width="15" height="15" /> Copy SVG
        </button>
        <button className="primary" onClick={onDownload} title="Download the mind map as an SVG file">
          <DownloadIcon width="15" height="15" /> Download
        </button>
      </div>
    </header>
  );
}
