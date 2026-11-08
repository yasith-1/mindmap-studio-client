import { BookIcon, ImportIcon, CopyIcon, DownloadIcon } from './Icons.jsx';

export default function Toolbar({ onExample, onImport, onCopy, onDownload }) {
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
