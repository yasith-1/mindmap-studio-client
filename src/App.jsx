import { useCallback, useEffect, useRef, useState } from 'react';
import Toolbar from './components/Toolbar.jsx';
import Editor from './components/Editor.jsx';
import MindMap from './components/MindMap.jsx';
import HowDialog from './components/HowDialog.jsx';
import Preloader from './components/Preloader.jsx';
import { useDiagram } from './hooks/useDiagram.js';
import { useTheme } from './hooks/useTheme.js';
import { useToast } from './hooks/useToast.js';
import { useImport } from './hooks/useImport.js';
import { copyMindmapSvg, copyMindmapPng, downloadMindmapSvg } from './lib/exportSvg.js';
import { readStored, writeStored } from './lib/storage.js';
import { examples, exampleOrder } from './data/examples.js';

const DRAFT_KEY = 'mms-draft';

// Accepted import types — kept in one place for the file input, the button
// hint, and the footer so the user always knows what they can import.
const IMPORT_ACCEPT =
  '.md,.markdown,.txt,.html,.htm,.docx,.pdf,text/markdown,text/plain,text/html,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const IMPORT_FORMATS = '.md · .txt · .html · .docx · .pdf';

function loadInitial() {
  const saved = readStored(DRAFT_KEY);
  return saved && saved.trim() ? saved : examples.readme;
}

export default function App() {
  const [markdown, setMarkdown] = useState(loadInitial);
  const [activePane, setActivePane] = useState('edit'); // mobile toggle
  const [howOpen, setHowOpen] = useState(false);
  const [diagramType, setDiagramType] = useState('mindmap');
  const exIdx = useRef(0);
  const fileRef = useRef(null);

  const { mindmapRef, diagramRef, update, setType, nodeCount, zoomIn, zoomOut, fit } =
    useDiagram();

  const { toast, flash } = useToast();

  // Re-render the active diagram so its d3 colours follow a theme change.
  const rerenderActive = useCallback(() => setType(diagramType), [setType, diagramType]);
  const { accent, mode, changeAccent, toggleMode } = useTheme(rerenderActive);

  const { importing, importFile } = useImport({
    onImported: (md) => {
      setMarkdown(md);
      setActivePane('edit');
    },
    flash,
  });

  // Debounced render + draft persistence whenever the markdown changes.
  useEffect(() => {
    const t = setTimeout(() => {
      update(markdown);
      writeStored(DRAFT_KEY, markdown);
    }, 180);
    return () => clearTimeout(t);
  }, [markdown, update]);

  const handleExample = () => {
    exIdx.current = (exIdx.current + 1) % exampleOrder.length;
    setMarkdown(examples[exampleOrder[exIdx.current]]);
  };

  const handleClear = () => {
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
    e.target.value = '';
    importFile(file);
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
        onAccentChange={changeAccent}
        mode={mode}
        onToggleMode={toggleMode}
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
        <span className="sep sep-hint">|</span>
        <span className="import-hint">
          Import accepts <strong>{IMPORT_FORMATS}</strong> — other text is converted
        </span>
        <button className="how" onClick={() => setHowOpen(true)}>
          How this works ↗
        </button>
      </footer>

      <input ref={fileRef} type="file" accept={IMPORT_ACCEPT} hidden onChange={handleFile} />
      <div className={`toast${toast ? ' show' : ''}`} role="status" aria-live="polite">
        {toast}
      </div>
      <Preloader show={importing} />
      <HowDialog open={howOpen} onClose={() => setHowOpen(false)} />
    </div>
  );
}
