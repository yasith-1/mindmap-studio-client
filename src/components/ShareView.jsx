import { useCallback, useEffect, useRef, useState } from 'react';
import MindMap from './MindMap.jsx';
import { useDiagram } from '../hooks/useDiagram.js';
import { useTheme } from '../hooks/useTheme.js';
import { api } from '../lib/api.js';
import { LockIcon, EyeIcon, SunIcon, MoonIcon, SpinnerIcon } from './Icons.jsx';
import PasswordInput from './PasswordInput.jsx';

// Overlay states before the map is shown.
const GATE = { LOADING: 'loading', PROTECTED: 'protected', ONETIME: 'onetime', USED: 'used', ERROR: 'error', DONE: 'done' };

/**
 * Public read-only viewer for a shared map (route /s/:token). It always mounts
 * the diagram canvas (so the render engine is ready) and overlays the right
 * gate — passcode for protected, a one-time reveal warning for one-time —
 * until the content is unlocked.
 */
export default function ShareView({ token }) {
  const [gate, setGate] = useState(GATE.LOADING);
  const [error, setError] = useState('');
  const [passcode, setPasscode] = useState('');
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState('');

  const { mindmapRef, diagramRef, update, setType, nodeCount, zoomIn, zoomOut, fit } = useDiagram();
  const [diagramType, setDiagramType] = useState('mindmap');
  const rerenderActive = useCallback(() => setType(diagramType), [setType, diagramType]);
  const { mode, toggleMode } = useTheme(rerenderActive);

  // Render the loaded map into the canvas.
  const showMap = useCallback(
    (map) => {
      setTitle(map.title || 'Shared map');
      const kind = map.kind || 'mindmap';
      setDiagramType(kind);
      setType(kind);
      update(map.markdown || '');
      setGate(GATE.DONE);
    },
    [setType, update],
  );

  // Decide which gate to show from the share's meta.
  useEffect(() => {
    let alive = true;
    api
      .getShareMeta(token)
      .then((meta) => {
        if (!alive) return;
        if (meta.mode === 'public') showMap(meta.map);
        else if (meta.mode === 'protected') setGate(GATE.PROTECTED);
        else if (meta.mode === 'onetime') setGate(meta.used ? GATE.USED : GATE.ONETIME);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message);
        setGate(GATE.ERROR);
      });
    return () => {
      alive = false;
    };
  }, [token, showMap]);

  const open = async (code) => {
    setBusy(true);
    setError('');
    try {
      const { map } = await api.openShare(token, code);
      showMap(map);
    } catch (err) {
      setError(err.message);
      // A consumed one-time link can't be retried.
      if (/already been used/i.test(err.message)) setGate(GATE.USED);
    } finally {
      setBusy(false);
    }
  };

  const handleTypeChange = (type) => {
    setDiagramType(type);
    setType(type);
  };

  const overlay = gate !== GATE.DONE;

  return (
    <div className="flex h-dvh w-full flex-col px-[max(16px,env(safe-area-inset-left,0px))] py-3">
      {/* Minimal header */}
      <header className="flex items-center gap-2 border-b border-line pb-3">
        <svg className="size-[24px] flex-none" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <circle cx="7" cy="16" r="4" fill="var(--accent)" />
          <circle cx="24" cy="7" r="3" fill="none" stroke="var(--accent)" strokeWidth="2" />
          <circle cx="24" cy="16" r="3" fill="none" stroke="var(--accent)" strokeWidth="2" />
          <circle cx="24" cy="25" r="3" fill="none" stroke="var(--accent)" strokeWidth="2" />
          <path d="M11 16H16M16 16c0-4 2-7 5-8M16 16h5M16 16c0 4 2 7 5 8" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[0.95rem] font-bold tracking-[-0.01em]">{title || 'MarkMind'}</div>
          <div className="text-[0.7rem] text-muted">Shared mind map · read-only</div>
        </div>
        <button
          type="button"
          className="flex size-8 flex-none cursor-pointer items-center justify-center rounded-[7px] border border-accent bg-accent-weak text-accent"
          onClick={toggleMode}
          aria-label="Toggle light/dark"
        >
          {mode === 'dark' ? <SunIcon width="15" height="15" /> : <MoonIcon width="15" height="15" />}
        </button>
        <a
          href="/"
          className="btn"
          title="Open MarkMind"
        >
          Open editor
        </a>
      </header>

      {/* Canvas (always mounted) + gate overlay */}
      <main className="relative grid min-h-0 flex-1 py-3">
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

        {overlay && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-ground/80 backdrop-blur-sm">
            <div className="w-[min(380px,92vw)] rounded-[14px] border border-line bg-surface p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
              {gate === GATE.LOADING && (
                <div className="flex items-center justify-center gap-2 py-4 text-muted">
                  <SpinnerIcon width="18" height="18" /> Loading…
                </div>
              )}

              {gate === GATE.PROTECTED && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (passcode.trim()) open(passcode.trim());
                  }}
                >
                  <LockIcon width="26" height="26" className="mx-auto mb-3 text-accent" />
                  <h2 className="mb-1 mt-0 text-[1.05rem]">Passcode required</h2>
                  <p className="mb-4 mt-0 text-[0.84rem] text-muted">Enter the passcode to view this map.</p>
                  <div className="mb-3">
                    <PasswordInput
                      value={passcode}
                      onChange={setPasscode}
                      placeholder="Passcode"
                      autoFocus
                      autoComplete="off"
                    />
                  </div>
                  {error && <p className="mb-3 mt-0 text-[0.8rem] text-[#f43f5e]">{error}</p>}
                  <button type="submit" disabled={busy} className="btn btn-primary w-full justify-center disabled:opacity-60">
                    {busy ? <SpinnerIcon width="15" height="15" /> : null} Unlock
                  </button>
                </form>
              )}

              {gate === GATE.ONETIME && (
                <>
                  <EyeIcon width="26" height="26" className="mx-auto mb-3 text-accent" />
                  <h2 className="mb-1 mt-0 text-[1.05rem]">One-time view</h2>
                  <p className="mb-4 mt-0 text-[0.84rem] leading-[1.5] text-muted">
                    This link works <strong className="text-fg">only once</strong>. Once you open it, it can’t be viewed
                    again — so keep this tab open.
                  </p>
                  {error && <p className="mb-3 mt-0 text-[0.8rem] text-[#f43f5e]">{error}</p>}
                  <button onClick={() => open()} disabled={busy} className="btn btn-primary w-full justify-center disabled:opacity-60">
                    {busy ? <SpinnerIcon width="15" height="15" /> : <EyeIcon width="15" height="15" />} Reveal map (one time)
                  </button>
                </>
              )}

              {gate === GATE.USED && (
                <>
                  <EyeIcon width="26" height="26" className="mx-auto mb-3 text-muted" />
                  <h2 className="mb-1 mt-0 text-[1.05rem]">Link already used</h2>
                  <p className="mb-0 mt-0 text-[0.84rem] leading-[1.5] text-muted">
                    This was a one-time view link and it has already been opened. Ask the owner for a new link.
                  </p>
                </>
              )}

              {gate === GATE.ERROR && (
                <>
                  <LockIcon width="26" height="26" className="mx-auto mb-3 text-[#f43f5e]" />
                  <h2 className="mb-1 mt-0 text-[1.05rem]">Can’t open this link</h2>
                  <p className="mb-0 mt-0 text-[0.84rem] leading-[1.5] text-muted">{error}</p>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
