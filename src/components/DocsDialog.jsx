import { useEffect, useRef } from 'react';
import {
  BookIcon,
  ImportIcon,
  GithubIcon,
  CopyIcon,
  ImageIcon,
  DownloadIcon,
  SaveIcon,
  CloudIcon,
  UserIcon,
  SunIcon,
  GlobeIcon,
  LockIcon,
  EyeIcon,
  QrIcon,
} from './Icons.jsx';

// Every toolbar/action, documented once. Rendered as a labelled list so adding
// a new tool here keeps the guide in sync with the UI.
const TOOLBAR = [
  {
    Icon: BookIcon,
    name: 'Example',
    how: 'Loads a ready-made sample document. Click it again to cycle through several examples — the fastest way to see what a finished map looks like.',
  },
  {
    Icon: ImportIcon,
    name: 'Import',
    how: 'Opens a file picker. Accepts .md, .txt, .html, .docx (Word) and .pdf. Markdown loads as-is; everything else is auto-converted to Markdown and structured into a map.',
  },
  {
    Icon: GithubIcon,
    name: 'GitHub',
    how: 'Paste a GitHub profile link (or @username / username) and it fetches that user’s profile README and renders it as a mind map. Public profile READMEs only.',
  },
  {
    Icon: CopyIcon,
    name: 'Copy SVG',
    how: 'Copies the current diagram to your clipboard as vector SVG — paste it into Figma, Slides, or any design tool and it stays crisp at any size.',
  },
  {
    Icon: ImageIcon,
    name: 'Copy PNG',
    how: 'Copies the diagram as a PNG image — paste straight into chat, docs, or email.',
  },
  {
    Icon: DownloadIcon,
    name: 'Download ▾',
    how: 'Saves the diagram as a file. Click the main button for SVG; use the ▾ arrow to pick PNG or JPEG instead.',
  },
  {
    Icon: SaveIcon,
    name: 'Save',
    how: 'Saves the current map to your cloud account (sign in first). Saved maps sync across devices. Editing after a save creates a new version.',
  },
  {
    Icon: CloudIcon,
    name: 'My maps',
    how: 'Opens your saved maps — click one to reopen it, or download / delete it from the list.',
  },
  {
    Icon: UserIcon,
    name: 'Sign in',
    how: 'Passwordless sign-in: enter your email, type the 6-digit code we send, and you’re in. No password, no registration. Guests can use everything except cloud save.',
  },
  {
    Icon: SunIcon,
    name: 'Colour & theme',
    how: 'The toolbar’s colour dots set the diagram’s accent; the custom swatch opens a full colour picker. The sun/moon button toggles light / dark mode.',
  },
];

const DIAGRAMS = [
  ['Mind map', 'Radial tree from a central idea — the default, best for brainstorming and outlines.'],
  ['Tree', 'Top-down hierarchy — good for org charts and taxonomies.'],
  ['Flowchart', 'Left-to-right flow — steps, pipelines, decisions.'],
  ['Concept', 'Linked concept map — ideas connected in a network.'],
  ['Mermaid', 'Write raw Mermaid syntax for full control (sequence, class, state diagrams and more).'],
];

const SHARE = [
  { Icon: GlobeIcon, name: 'Public', desc: 'Anyone with the link can view it, anytime.' },
  { Icon: LockIcon, name: 'Protected', desc: 'Viewers must enter a passcode you set.' },
  { Icon: EyeIcon, name: 'One-time', desc: 'The link works once, then stops working.' },
];

// Small section heading used throughout the guide.
function H({ children }) {
  return (
    <h3 className="mb-2 mt-6 border-b border-line pb-1.5 text-[0.95rem] font-bold tracking-[-0.01em] text-accent">
      {children}
    </h3>
  );
}

export default function DocsDialog({ open, onClose }) {
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
      className="max-h-[calc(100dvh-32px)] max-w-[min(640px,94vw)] overflow-auto rounded-[14px] border border-line bg-surface p-0 text-fg shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop:bg-black/50"
    >
      <div className="px-6 py-[22px] [&_code]:rounded-[5px] [&_code]:border [&_code]:border-line [&_code]:bg-panel [&_code]:px-[5px] [&_code]:py-px [&_code]:font-mono [&_code]:text-[0.82em]">
        <h2 className="mb-1 mt-0 text-[1.2rem] tracking-[-0.01em]">MarkMind — Documentation</h2>
        <p className="mb-0 mt-0 text-[0.86rem] leading-[1.5] text-muted">
          Everything you can do, A to Z. No sign-up needed to start.
        </p>

        {/* What is it */}
        <H>What is MarkMind?</H>
        <p className="m-0 text-[0.88rem] leading-[1.6]">
          MarkMind turns plain <b>Markdown into live, interactive diagrams</b>. You type (or import)
          Markdown on the left and it instantly redraws as a mind map on the right — headings and
          lists become branches and nodes. It runs entirely in your browser; no AI, no waiting.
        </p>

        {/* Quick start */}
        <H>Quick start</H>
        <ol className="m-0 flex list-decimal flex-col gap-1.5 pl-5 text-[0.88rem] leading-[1.55] [&_b]:text-accent">
          <li>
            <b>Add content</b> — type Markdown, click <b>Example</b>, <b>Import</b> a file, or pull a{' '}
            <b>GitHub</b> README.
          </li>
          <li>
            <b>Watch it render</b> — the diagram updates on every keystroke (no “generate” button).
          </li>
          <li>
            <b>Pick a style</b> — switch between the five diagram tabs above the canvas.
          </li>
          <li>
            <b>Use it</b> — Copy, Download, Save to the cloud, or Share with a link + QR.
          </li>
        </ol>

        {/* Markdown rules */}
        <H>Writing Markdown</H>
        <p className="m-0 text-[0.88rem] leading-[1.6]">
          Structure is everything: <code>#</code> is the root, <code>##</code> / <code>###</code> are
          branches, and <code>-</code> list items are leaves. Nest with indentation.
        </p>
        <pre className="mt-2.5 overflow-x-auto rounded-[9px] border border-line bg-panel p-3 font-mono text-[0.76rem] leading-[1.6]">{`# Project
## Frontend
- React
- Tailwind
## Backend
- Node
- MongoDB`}</pre>

        {/* Toolbar, one by one */}
        <H>Toolbar — every button</H>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {TOOLBAR.map(({ Icon, name, how }) => (
            <li key={name} className="flex gap-3">
              <span className="mt-0.5 flex size-8 flex-none items-center justify-center rounded-lg border border-line bg-panel text-accent">
                <Icon width="16" height="16" />
              </span>
              <span className="min-w-0">
                <span className="block text-[0.88rem] font-semibold">{name}</span>
                <span className="block text-[0.82rem] leading-[1.5] text-muted">{how}</span>
              </span>
            </li>
          ))}
        </ul>

        {/* Diagram types */}
        <H>Diagram types</H>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {DIAGRAMS.map(([name, desc]) => (
            <li key={name} className="text-[0.86rem] leading-[1.5]">
              <b className="font-semibold text-fg">{name}</b>{' '}
              <span className="text-muted">— {desc}</span>
            </li>
          ))}
        </ul>

        {/* Canvas controls */}
        <H>Navigating the canvas</H>
        <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5 text-[0.86rem] leading-[1.5] text-muted">
          <li>
            <b className="text-fg">Scroll</b> to zoom, <b className="text-fg">drag</b> to pan.
          </li>
          <li>
            <b className="text-fg">Drag a node</b> to reposition it.
          </li>
          <li>
            Use the <b className="text-fg">+ / −</b> buttons to zoom and the{' '}
            <b className="text-fg">fit</b> button (⤢) to frame the whole diagram.
          </li>
          <li>
            On phones, switch between <b className="text-fg">Markdown</b> and{' '}
            <b className="text-fg">Mind map</b> with the toggle above the panes.
          </li>
        </ul>

        {/* Sharing */}
        <H>Sharing &amp; QR codes</H>
        <p className="m-0 text-[0.88rem] leading-[1.6]">
          Save a map, then open <b>Share</b> from your saved maps to create a link in one of three
          modes. Every link comes with a <b>QR code</b> you can download or copy — scan it to open the
          map on any phone.
        </p>
        <ul className="mt-2.5 flex list-none flex-col gap-2 p-0">
          {SHARE.map(({ Icon, name, desc }) => (
            <li key={name} className="flex items-center gap-2.5 text-[0.84rem]">
              <Icon width="15" height="15" className="flex-none text-accent" />
              <span>
                <b className="font-semibold">{name}</b>{' '}
                <span className="text-muted">— {desc}</span>
              </span>
            </li>
          ))}
          <li className="flex items-center gap-2.5 text-[0.84rem]">
            <QrIcon width="15" height="15" className="flex-none text-accent" />
            <span>
              <b className="font-semibold">QR code</b>{' '}
              <span className="text-muted">— download, copy, or scan any share link.</span>
            </span>
          </li>
        </ul>

        {/* Tips */}
        <H>Good to know</H>
        <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5 text-[0.86rem] leading-[1.5] text-muted">
          <li>
            <b className="text-fg">Guest mode</b> works fully — your draft is saved in this browser.
            Sign in only when you want cloud save and sharing.
          </li>
          <li>
            Your current document is <b className="text-fg">auto-saved locally</b>, so a refresh
            won’t lose it.
          </li>
          <li>
            <b className="text-fg">Clear</b> (top of the editor) resets to the example.
          </li>
        </ul>

        <button className="btn btn-primary mt-6 w-full justify-center" onClick={onClose}>
          Got it
        </button>
      </div>
    </dialog>
  );
}
