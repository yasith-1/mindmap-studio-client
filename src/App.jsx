import { useCallback, useEffect, useRef, useState } from 'react';
import Toolbar from './components/Toolbar.jsx';
import Editor from './components/Editor.jsx';
import MindMap from './components/MindMap.jsx';
import HowDialog from './components/HowDialog.jsx';
import { useDiagram } from './hooks/useDiagram.js';
import { copyMindmapSvg, copyMindmapPng, downloadMindmapSvg } from './lib/exportSvg.js';
import { examples, exampleOrder } from './data/examples.js';

const DRAFT_KEY = 'mms-draft';
const ACCENT_KEY = 'mms-accent';

function loadInitial() {
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved && saved.trim()) return saved;
  } catch {
    /* storage blocked */
  }
  return examples.readme;
}

/** Normalise any CSS colour to a #rrggbb hex the picker and maths can use. */
function toHex(value) {
  const v = (value || '').trim();
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(v)) {
    return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`.toLowerCase();
  }
  const m = /rgba?\(([^)]+)\)/i.exec(v);
  if (m) {
    const [r, g, b] = m[1].split(',').map((n) => parseInt(n, 10));
    return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
  }
  return '';
}

/** Drive the whole app's colour by setting the accent CSS variables. */
function applyAccent(hex) {
  const h = toHex(hex);
  if (!h) return;
  const n = parseInt(h.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const root = document.documentElement;
  root.style.setProperty('--accent', h);
  root.style.setProperty('--accent-weak', `rgba(${r}, ${g}, ${b}, 0.16)`);
}

export default function App() {
  const [markdown, setMarkdown] = useState(loadInitial);
  const [activePane, setActivePane] = useState('edit'); // mobile toggle
  const [howOpen, setHowOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [diagramType, setDiagramType] = useState('mindmap');
  const [accent, setAccent] = useState('');
  const exIdx = useRef(0);
  const fileRef = useRef(null);
  const toastTimer = useRef(null);

  const { mindmapRef, diagramRef, update, setType, nodeCount, zoomIn, zoomOut, fit } =
    useDiagram();

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

  // Adopt a saved accent, or seed the picker from the theme's current accent.
  useEffect(() => {
    let saved = '';
    try {
      saved = localStorage.getItem(ACCENT_KEY) || '';
    } catch {
      /* ignore */
    }
    if (saved) {
      applyAccent(saved);
      setAccent(toHex(saved));
    } else {
      const base = getComputedStyle(document.documentElement).getPropertyValue('--accent');
      setAccent(toHex(base) || '#2dd4bf');
    }
  }, []);

  const handleAccentChange = (value, commit) => {
    const hex = toHex(value);
    if (!hex) return;
    setAccent(hex);
    applyAccent(hex);
    if (commit) {
      try {
        localStorage.setItem(ACCENT_KEY, hex);
      } catch {
        /* ignore */
      }
      // Re-render the active diagram so its d3 root node picks up the colour.
      setType(diagramType);
    }
  };

  const flash = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 1900);
  }, []);

  const handleExample = () => {
    exIdx.current = (exIdx.current + 1) % exampleOrder.length;
    setMarkdown(examples[exampleOrder[exIdx.current]]);
  };

  const handleClear = () => {
    // Clear all content, then fall back to the default example text.
    setMarkdown('');
    exIdx.current = 0;
    setMarkdown(examples.readme);
    setActivePane('edit');
    flash('Cleared — reset to example');
  };

  const handleTypeChange = (type) => {
    setDiagramType(type);
    setType(type);
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

  const activeSvg = () =>
    diagramType === 'mindmap' ? mindmapRef.current : diagramRef.current;

  const handleCopy = async () => {
    try {
      await copyMindmapSvg(activeSvg());
      flash('SVG copied to clipboard');
    } catch {
      flash('Copy failed — try Download');
    }
  };

  const handleCopyPng = async () => {
    try {
      await copyMindmapPng(activeSvg());
      flash('PNG copied to clipboard');
    } catch {
      flash('PNG copy failed — try Download');
    }
  };

  const handleDownload = () => {
    downloadMindmapSvg(activeSvg(), `${diagramType}.svg`);
    flash(`Downloading ${diagramType}.svg`);
  };

  return (
    <div className="app">
      <Toolbar
        onExample={handleExample}
        onImport={handleImportClick}
        onCopy={handleCopy}
        onCopyPng={handleCopyPng}
        onDownload={handleDownload}
        accent={accent}
        onAccentChange={handleAccentChange}
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
        <Editor
          value={markdown}
          onChange={setMarkdown}
          charCount={markdown.length}
          onClear={handleClear}
        />
        <MindMap
          mindmapRef={mindmapRef}
          diagramRef={diagramRef}
          nodeCount={nodeCount}
          diagramType={diagramType}
          onTypeChange={handleTypeChange}
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
