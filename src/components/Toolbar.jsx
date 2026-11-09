import {
  BookIcon,
  ImportIcon,
  CopyIcon,
  ImageIcon,
  DownloadIcon,
  SunIcon,
  MoonIcon,
  SaveIcon,
  CloudIcon,
  UserIcon,
} from './Icons.jsx';
import AccountMenu from './AccountMenu.jsx';

// Preset accent colours; the custom picker covers everything else.
const PRESETS = ['#2dd4bf', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#22c55e'];

const CUSTOM_GRADIENT = 'conic-gradient(red, orange, yellow, lime, aqua, blue, magenta, red)';

// Shared responsive bit for the five action buttons. Once the toolbar wraps the
// tools onto their own row (≤1100px), they grow to equal widths and fill it;
// on small phones (≤480px) they also drop their labels to icon-only squares.
const TOOL =
  'max-[1100px]:flex-1 max-[1100px]:justify-center max-[600px]:px-2';

export default function Toolbar({
  onExample,
  onImport,
  onCopy,
  onCopyPng,
  onDownload,
  accent,
  onAccentChange,
  mode,
  onToggleMode,
  isAuthed,
  email,
  onSignIn,
  onSignOut,
  onSave,
  onOpenMaps,
}) {
  const current = (accent || '').toLowerCase();
  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-line py-3">
      <div className="flex min-w-0 items-center gap-[9px]">
        <svg
          className="glyph size-[26px] flex-none"
          viewBox="0 0 32 32"
          fill="none"
          aria-hidden="true"
        >
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
        <div className="min-w-0">
          <h1 className="m-0 whitespace-nowrap text-[1.02rem] font-bold tracking-[-0.01em]">
            MindMap Studio
          </h1>
          <span className="whitespace-nowrap text-[0.72rem] font-medium text-muted max-[520px]:hidden">
            Markdown in, mind map out — live
          </span>
        </div>
      </div>

      <div
        className="mx-auto flex flex-wrap items-center justify-center gap-1.5 rounded-[10px] border border-line bg-surface px-2 py-1 max-[480px]:w-full max-[480px]:justify-between"
        role="group"
        aria-label="Theme"
      >
        <button
          type="button"
          className="mr-1 flex h-7 w-[30px] cursor-pointer items-center justify-center rounded-[7px] border border-accent bg-accent-weak p-0 text-accent transition-[transform,box-shadow] hover:shadow-[0_0_0_3px_var(--accent-weak)] active:translate-y-px pointer-coarse:size-9"
          onClick={onToggleMode}
          title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {mode === 'dark' ? <SunIcon width="15" height="15" /> : <MoonIcon width="15" height="15" />}
        </button>
        <span className="mr-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.04em] text-muted max-[640px]:hidden">
          Colour
        </span>
        {PRESETS.map((c) => {
          const active = current === c;
          return (
            <button
              key={c}
              type="button"
              className={`relative size-5 cursor-pointer rounded-full border-2 p-0 transition-transform hover:scale-110 pointer-coarse:size-[26px] ${
                active ? 'border-fg shadow-[inset_0_0_0_2px_var(--surface)]' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
              title={`Use ${c}`}
              aria-label={`Use accent ${c}`}
              aria-pressed={active}
              onClick={() => onAccentChange(c, true)}
            />
          );
        })}
        <label
          className="relative inline-flex size-5 cursor-pointer overflow-hidden rounded-full border-2 border-transparent transition-transform hover:scale-110 pointer-coarse:size-[26px]"
          style={{ backgroundImage: CUSTOM_GRADIENT }}
          title="Custom colour"
        >
          <input
            type="color"
            className="absolute inset-[-4px] h-[calc(100%+8px)] w-[calc(100%+8px)] cursor-pointer border-0 bg-transparent p-0 opacity-0"
            value={current || '#2dd4bf'}
            onInput={(e) => onAccentChange(e.target.value, false)}
            onChange={(e) => onAccentChange(e.target.value, true)}
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-[7px] max-[1100px]:w-full max-[600px]:gap-1.5">
        <button
          className={`btn ${TOOL}`}
          onClick={onExample}
          title="Load a sample document"
          aria-label="Load example"
        >
          <BookIcon width="15" height="15" /> <span className="max-[600px]:sr-only">Example</span>
        </button>
        <button
          className={`btn ${TOOL}`}
          onClick={onImport}
          title="Import Markdown, text, HTML, Word (.docx) or PDF — non-Markdown is converted"
          aria-label="Import a file"
        >
          <ImportIcon width="15" height="15" /> <span className="max-[600px]:sr-only">Import</span>
        </button>
        <button
          className={`btn ${TOOL}`}
          onClick={onCopy}
          title="Copy the diagram as SVG"
          aria-label="Copy diagram as SVG"
        >
          <CopyIcon width="15" height="15" /> <span className="max-[600px]:sr-only">Copy SVG</span>
        </button>
        <button
          className={`btn ${TOOL}`}
          onClick={onCopyPng}
          title="Copy the diagram as a PNG image"
          aria-label="Copy diagram as PNG"
        >
          <ImageIcon width="15" height="15" /> <span className="max-[600px]:sr-only">Copy PNG</span>
        </button>
        <button
          className={`btn btn-primary ${TOOL}`}
          onClick={onDownload}
          title="Download the mind map as an SVG file"
          aria-label="Download diagram as SVG"
        >
          <DownloadIcon width="15" height="15" />{' '}
          <span className="max-[600px]:sr-only">Download</span>
        </button>
      </div>

      {/* Account + cloud save. Guests see a single "Sign in"; signed-in users
          get Save, My maps and an avatar menu. */}
      <div className="flex items-center gap-[7px] max-[1100px]:w-full max-[1100px]:justify-end max-[600px]:gap-1.5">
        {isAuthed ? (
          <>
            <button
              className={`btn ${TOOL}`}
              onClick={onSave}
              title="Save the current map to the cloud"
              aria-label="Save to cloud"
            >
              <SaveIcon width="15" height="15" /> <span className="max-[600px]:sr-only">Save</span>
            </button>
            <button
              className={`btn ${TOOL}`}
              onClick={onOpenMaps}
              title="Open your saved maps"
              aria-label="My saved maps"
            >
              <CloudIcon width="15" height="15" />{' '}
              <span className="max-[600px]:sr-only">My maps</span>
            </button>
            <AccountMenu email={email} onSignOut={onSignOut} />
          </>
        ) : (
          <button
            className="btn"
            onClick={onSignIn}
            title="Sign in to save maps to the cloud"
            aria-label="Sign in"
          >
            <UserIcon width="15" height="15" /> <span className="max-[480px]:sr-only">Sign in</span>
          </button>
        )}
      </div>
    </header>
  );
}
