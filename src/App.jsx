import { useCallback, useEffect, useRef, useState } from 'react';
import Toolbar from './components/Toolbar.jsx';
import Editor from './components/Editor.jsx';
import MindMap from './components/MindMap.jsx';
import HowDialog from './components/HowDialog.jsx';
import { useMindmap } from './hooks/useMindmap.js';
import { copyMindmapSvg, downloadMindmapSvg } from './lib/exportSvg.js';
import { examples, exampleOrder } from './data/examples.js';

const DRAFT_KEY = 'mms-draft';

function loadInitial() {
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved && saved.trim()) return saved;
  } catch {
    /* storage blocked */
  }
  return examples.readme;
}

export default function App() {
  const [markdown, setMarkdown] = useState(loadInitial);
  const [activePane, setActivePane] = useState('edit'); // mobile toggle
  const [howOpen, setHowOpen] = useState(false);
  const [toast, setToast] = useState('');
  const exIdx = useRef(0);
  const fileRef = useRef(null);
  const toastTimer = useRef(null);

  const { svgRef, update, nodeCount, zoomIn, zoomOut, fit } = useMindmap();

  // Debounced render whenever the markdown changes.
  useEffect(() => {
    const t = setTimeout(() => {
      update(markdown);
      try {
        localStorage.setItem(DRAFT_KEY, markdown);
      } catch {
        /* ignore */
      }
    }, 180);
    return () => clearTimeout(t);
  }, [markdown, update]);

  const flash = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 1900);
  }, []);

  const handleExample = () => {
    exIdx.current = (exIdx.current + 1) % exampleOrder.length;
    setMarkdown(examples[exampleOrder[exIdx.current]]);
  };

  const handleImportClick = () => fileRef.current?.click();
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setMarkdown(String(reader.result));
      setActivePane('edit');
      flash(`Loaded ${file.name}`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCopy = async () => {
    try {
      await copyMindmapSvg(svgRef.current);
      flash('SVG copied to clipboard');
    } catch {
      flash('Copy failed — try Download');
    }
  };

  const handleDownload = () => {
    downloadMindmapSvg(svgRef.current, 'mindmap.svg');
    flash('Downloading mindmap.svg');
  };

  return (
    <div className="app">
      <Toolbar
        onExample={handleExample}
        onImport={handleImportClick}
        onCopy={handleCopy}
        onDownload={handleDownload}
      />

      <div className="pane-toggle" role="group" aria-label="Switch pane">
        <button aria-pressed={activePane === 'edit'} onClick={() => setActivePane('edit')}>
          Markdown
        </button>
        <button
          aria-pressed={activePane === 'map'}
          onClick={() => {
            setActivePane('map');
            setTimeout(fit, 0);
          }}
        >
          Mind map
        </button>
      </div>

      <main data-active={activePane}>
        <Editor value={markdown} onChange={setMarkdown} charCount={markdown.length} />
        <MindMap
          svgRef={svgRef}
          nodeCount={nodeCount}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onFit={fit}
        />
      </main>

      <footer>
        <span className="dot" />
        <span>Live preview · updates as you type</span>
        <span className="sep">|</span>
        <span>Tip: scroll to zoom, drag to pan</span>
        <button className="how" onClick={() => setHowOpen(true)}>
          How this works ↗
        </button>
      </footer>

      <input
        ref={fileRef}
        type="file"
        accept=".md,.markdown,.txt,text/markdown,text/plain"
        hidden
        onChange={handleFile}
      />
      <div className={`toast${toast ? ' show' : ''}`} role="status" aria-live="polite">
        {toast}
      </div>
      <HowDialog open={howOpen} onClose={() => setHowOpen(false)} />
    </div>
  );
}
