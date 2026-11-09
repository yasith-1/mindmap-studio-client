import { useEffect, useRef, useState } from 'react';
import { LogOutIcon } from './Icons.jsx';

/** Avatar chip (email initial) with a small dropdown for signing out. */
export default function AccountMenu({ email, onSignOut }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const initial = (email?.[0] ?? '?').toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="flex size-8 cursor-pointer items-center justify-center rounded-full border border-accent bg-accent-weak text-[0.82rem] font-bold text-accent transition-transform hover:scale-105 pointer-coarse:size-9"
        onClick={() => setOpen((v) => !v)}
        title={email}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {initial}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-50 w-56 overflow-hidden rounded-[10px] border border-line bg-surface shadow-[0_12px_40px_rgba(0,0,0,0.25)]"
        >
          <div className="border-b border-line px-3 py-2.5">
            <div className="text-[0.68rem] font-semibold uppercase tracking-[0.04em] text-muted">
              Signed in as
            </div>
            <div className="truncate text-[0.84rem] font-medium text-fg">{email}</div>
          </div>
          <button
            type="button"
            role="menuitem"
            className="flex w-full cursor-pointer items-center gap-2 border-0 bg-transparent px-3 py-2.5 text-left text-[0.86rem] text-fg hover:bg-panel"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
          >
            <LogOutIcon width="15" height="15" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
