import { useEffect, useRef, useState } from 'react';
import { GithubIcon, SpinnerIcon } from './Icons.jsx';

/**
 * Collects a GitHub profile URL (or username) and asks the parent to import
 * that user's profile README. It owns only the input and open/close state — the
 * fetching and markdown handling live in the `onImport` callback the parent
 * passes down, so this dialog stays purely presentational.
 */
export default function GithubDialog({ open, onClose, onImport, importing }) {
  const ref = useRef(null);
  const [url, setUrl] = useState('');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    if (open) setUrl('');
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    const ok = await onImport(url);
    if (ok) onClose();
  };

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="max-h-[calc(100dvh-32px)] max-w-[min(420px,92vw)] overflow-visible rounded-[14px] border border-line bg-surface p-0 text-fg shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop:bg-black/40"
    >
      <form onSubmit={submit} className="px-6 py-[22px]">
        <h2 className="mb-1 mt-0 flex items-center gap-2 text-[1.15rem] tracking-[-0.01em]">
          <GithubIcon width="20" height="20" /> Import from GitHub
        </h2>
        <p className="mb-4 mt-0 text-[0.86rem] leading-[1.5] text-muted">
          Paste a GitHub profile link — we’ll turn that user’s profile README into a live mind map.
        </p>

        <input
          type="text"
          autoFocus
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/username"
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-lg border border-line bg-panel px-3 py-2.5 text-[0.9rem] text-fg outline-none focus:border-accent"
        />

        <button
          type="submit"
          disabled={importing || !url.trim()}
          className="btn btn-primary mt-4 w-full justify-center disabled:opacity-60"
        >
          {importing ? <SpinnerIcon width="15" height="15" /> : <GithubIcon width="15" height="15" />}
          {importing ? 'Fetching README…' : 'Generate mind map'}
        </button>

        <button
          type="button"
          className="mt-3 w-full cursor-pointer border-0 bg-transparent p-0 text-[0.78rem] text-muted hover:text-accent"
          onClick={onClose}
        >
          Cancel
        </button>
      </form>
    </dialog>
  );
}
