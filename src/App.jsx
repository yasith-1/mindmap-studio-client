import { useCallback, useEffect, useRef, useState } from 'react';
import Toolbar from './components/Toolbar.jsx';
import Editor from './components/Editor.jsx';
import MindMap, { typeLabel } from './components/MindMap.jsx';
import HowDialog from './components/HowDialog.jsx';
import AuthDialog from './components/AuthDialog.jsx';
import MapsDialog from './components/MapsDialog.jsx';
import Preloader from './components/Preloader.jsx';
import { useDiagram } from './hooks/useDiagram.js';
import { useTheme } from './hooks/useTheme.js';
import { useToast } from './hooks/useToast.js';
import { useImport } from './hooks/useImport.js';
import { useAuth } from './hooks/useAuth.js';
import { useMindmaps } from './hooks/useMindmaps.js';
import { copyMindmapSvg, copyMindmapPng, downloadMindmapSvg, downloadBlob } from './lib/exportSvg.js';
import { renderMapToPngBlob } from './lib/exportMap.js';
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

// Derive a map title from its Markdown: first heading or first non-empty line.
function deriveTitle(md) {
  const line = md.split('\n').map((l) => l.trim()).find(Boolean) ?? '';
  const title = line.replace(/^#+\s*/, '').replace(/^[-*]\s*/, '').trim();
  return (title || 'Untitled').slice(0, 60);
}

// The name a map is saved under: the document's title + its diagram type,
// e.g. "Spring Boot Learning Plan - Flowchart".
function buildMapTitle(md, diagramType) {
  return `${deriveTitle(md)} - ${typeLabel(diagramType)}`;
}

export default function App() {
  const [markdown, setMarkdown] = useState(loadInitial);
  const [activePane, setActivePane] = useState('edit'); // mobile toggle
  const [howOpen, setHowOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [mapsOpen, setMapsOpen] = useState(false);
  const [diagramType, setDiagramType] = useState('mindmap');
  const exIdx = useRef(0);
  const fileRef = useRef(null);

  const { mindmapRef, diagramRef, update, setType, nodeCount, zoomIn, zoomOut, fit } =
    useDiagram();

  const { toast, flash } = useToast();

  // Passwordless auth session + the signed-in user's cloud maps.
  const { user, isAuthed, requestOtp, verifyOtp, logout } = useAuth();
  const cloud = useMindmaps({ flash });

  // Re-render the active diagram so its d3 colours follow a theme change.
  const rerenderActive = useCallback(() => setType(diagramType), [setType, diagramType]);
  const { accent, mode, changeAccent, toggleMode } = useTheme(rerenderActive);

  const { importing, importFile } = useImport({
    onImported: (md) => {
      setMarkdown(md);
      setActivePane('edit');
      cloud.startNew(); // an imported document is a new map
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
    cloud.startNew(); // fresh content → next Save makes a new cloud map
  };

  const handleClear = () => {
    exIdx.current = 0;
    setMarkdown(examples.readme);
    setActivePane('edit');
    cloud.startNew();
    flash('Cleared — reset to example');
  };

  const handleTypeChange = (type, { fromOpen = false } = {}) => {
    setDiagramType(type);
    setType(type);
    // A different diagram type is a distinct saved map — so switching type (when
    // the user does it) starts a new cloud document. Opening a saved map passes
    // fromOpen so it keeps pointing at that map.
    if (!fromOpen) cloud.startNew();
  };

  // ── Cloud save / account ───────────────────────────────
  const handleSave = () => {
    if (!isAuthed) {
      setAuthOpen(true);
      return;
    }
    cloud.save({ title: buildMapTitle(markdown, diagramType), markdown, kind: diagramType });
  };

  const handleOpenMap = (map) => {
    setMarkdown(map.markdown ?? '');
    if (map.kind) handleTypeChange(map.kind, { fromOpen: true });
    cloud.open(map.id);
    setMapsOpen(false);
    setActivePane('edit');
    flash(`Opened “${map.title || 'Untitled'}”`);
  };

  const handleSignOut = () => {
    logout();
    cloud.reset();
    flash('Signed out');
  };

  // Render a saved map off-screen and download it as a high-res PNG.
  const handleDownloadMap = async (map) => {
    const name = (map.title || 'mindmap').replace(/[^\w\- ]+/g, '').trim() || 'mindmap';
    const blob = await renderMapToPngBlob(map.markdown ?? '', map.kind ?? 'mindmap', 3);
    downloadBlob(blob, `${name}.png`);
    flash(`Downloaded ${name}.png`);
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
    <div
      className="flex h-dvh w-full flex-col pb-[env(safe-area-inset-bottom,0px)] pl-[max(16px,env(safe-area-inset-left,0px))] pr-[max(16px,env(safe-area-inset-right,0px))] pt-[env(safe-area-inset-top,0px)] min-[1200px]:pl-[max(20px,env(safe-area-inset-left,0px))] min-[1200px]:pr-[max(20px,env(safe-area-inset-right,0px))]"
    >
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
        isAuthed={isAuthed}
        email={user?.email}
        onSignIn={() => setAuthOpen(true)}
        onSignOut={handleSignOut}
        onSave={handleSave}
        onOpenMaps={() => setMapsOpen(true)}
      />

      <div
        className="hidden gap-1 pb-0.5 pt-1.5 max-[860px]:flex"
        role="group"
        aria-label="Switch pane"
      >
        <button
          className="btn flex-1 justify-center aria-pressed:border-accent aria-pressed:bg-accent-weak aria-pressed:text-accent"
          aria-pressed={activePane === 'edit'}
          onClick={() => setActivePane('edit')}
        >
          Markdown
        </button>
        <button
          className="btn flex-1 justify-center aria-pressed:border-accent aria-pressed:bg-accent-weak aria-pressed:text-accent"
          aria-pressed={activePane === 'map'}
          onClick={() => {
            setActivePane('map');
            setTimeout(fit, 0);
          }}
        >
          Mind map
        </button>
      </div>

      <main
        data-active={activePane}
        className="grid min-h-0 flex-1 grid-cols-[minmax(0,clamp(320px,30%,540px))_minmax(0,1fr)] gap-[14px] py-[14px] max-[860px]:grid-cols-1 max-[860px]:grid-rows-1 min-[1700px]:gap-5 [&[data-active=edit]_#pane-map]:max-[860px]:hidden [&[data-active=map]_#pane-edit]:max-[860px]:hidden [&_.pane]:max-[860px]:col-start-1 [&_.pane]:max-[860px]:row-start-1"
      >
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

      <footer className="flex flex-wrap items-center gap-2.5 border-t border-line py-[9px] text-[0.74rem] text-muted">
        <span className="size-[7px] flex-none rounded-full bg-accent" />
        <span>Live preview · updates as you type</span>
        <span className="text-line">|</span>
        <span>Tip: scroll to zoom, drag to pan</span>
        <span className="text-line max-[760px]:hidden">|</span>
        <span className="max-[760px]:hidden">
          Import accepts <strong className="font-semibold text-accent">{IMPORT_FORMATS}</strong> —
          other text is converted
        </span>
        <button
          className="ml-auto cursor-pointer border-0 bg-transparent px-1.5 py-1 text-[0.74rem] text-muted hover:text-accent"
          onClick={() => setHowOpen(true)}
        >
          How this works ↗
        </button>
      </footer>

      <input ref={fileRef} type="file" accept={IMPORT_ACCEPT} hidden onChange={handleFile} />
      <div
        className={`fixed bottom-[calc(20px+env(safe-area-inset-bottom,0px))] left-1/2 z-50 -translate-x-1/2 rounded-full bg-fg px-[15px] py-[9px] text-[0.82rem] font-medium text-ground transition-[opacity,transform] duration-200 ${
          toast ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-[14px] opacity-0'
        }`}
        role="status"
        aria-live="polite"
      >
        {toast}
      </div>
      <Preloader show={importing} />
      <HowDialog open={howOpen} onClose={() => setHowOpen(false)} />
      <AuthDialog
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        requestOtp={requestOtp}
        verifyOtp={verifyOtp}
        flash={flash}
      />
      <MapsDialog
        open={mapsOpen}
        onClose={() => setMapsOpen(false)}
        maps={cloud.maps}
        loading={cloud.loading}
        currentId={cloud.currentId}
        onRefresh={cloud.refresh}
        onOpenMap={handleOpenMap}
        onDownload={handleDownloadMap}
        onDelete={cloud.remove}
        flash={flash}
      />
    </div>
  );
}
