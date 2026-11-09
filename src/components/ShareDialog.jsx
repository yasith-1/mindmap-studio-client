import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import {
  GlobeIcon,
  LockIcon,
  EyeIcon,
  LinkIcon,
  CheckIcon,
  TrashIcon,
  SpinnerIcon,
} from './Icons.jsx';
import PasswordInput from './PasswordInput.jsx';

const MODES = [
  { id: 'public', label: 'Public', Icon: GlobeIcon, desc: 'Anyone with the link can view it, anytime.' },
  { id: 'protected', label: 'Protected', Icon: LockIcon, desc: 'Viewers must enter a passcode you set.' },
  { id: 'onetime', label: 'One-time', Icon: EyeIcon, desc: 'The link works once, then stops working.' },
];

const shareUrl = (token) => `${window.location.origin}/s/${token}`;

/** Owner-facing dialog to create, copy and revoke share links for a map. */
export default function ShareDialog({ open, onClose, map, flash }) {
  const ref = useRef(null);
  const [mode, setMode] = useState('public');
  const [passcode, setPasscode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [shares, setShares] = useState([]);
  const [copiedToken, setCopiedToken] = useState('');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  // Load existing links each time the dialog opens for a map.
  useEffect(() => {
    if (!open || !map) return;
    setMode('public');
    setPasscode('');
    setError('');
    setCopiedToken('');
    api
      .listShares(map.id)
      .then((res) => setShares(res.shares))
      .catch(() => setShares([]));
  }, [open, map]);

  const copy = async (token) => {
    try {
      await navigator.clipboard.writeText(shareUrl(token));
      setCopiedToken(token);
      flash('Link copied');
      setTimeout(() => setCopiedToken(''), 1600);
    } catch {
      flash('Copy failed');
    }
  };

  const create = async () => {
    if (mode === 'protected' && passcode.trim().length < 4) {
      setError('Enter a passcode of at least 4 characters.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { share } = await api.createShare(map.id, {
        mode,
        passcode: mode === 'protected' ? passcode.trim() : undefined,
      });
      setShares((prev) => [share, ...prev]);
      setPasscode('');
      await copy(share.token); // hand them a ready-to-paste link
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (token) => {
    try {
      await api.revokeShare(token);
      setShares((prev) => prev.filter((s) => s.token !== token));
      flash('Link revoked');
    } catch (err) {
      flash(err.message);
    }
  };

  const modeMeta = (m) => MODES.find((x) => x.id === m);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="max-h-[calc(100dvh-32px)] max-w-[min(460px,92vw)] overflow-auto rounded-[14px] border border-line bg-surface p-0 text-fg shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop:bg-black/50"
    >
      <div className="px-6 py-[22px]">
        <h2 className="mb-1 mt-0 text-[1.15rem] tracking-[-0.01em]">Share this map</h2>
        <p className="mb-4 mt-0 truncate text-[0.86rem] text-muted">{map?.title || 'Untitled'}</p>

        {/* Mode picker */}
        <div className="flex flex-col gap-2">
          {MODES.map(({ id, label, Icon, desc }) => (
            <label
              key={id}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                mode === id ? 'border-accent bg-accent-weak' : 'border-line hover:border-accent'
              }`}
            >
              <input
                type="radio"
                name="share-mode"
                className="sr-only"
                checked={mode === id}
                onChange={() => setMode(id)}
              />
              <Icon width="18" height="18" className={mode === id ? 'text-accent' : 'text-muted'} />
              <span className="min-w-0">
                <span className="block text-[0.9rem] font-semibold">{label}</span>
                <span className="block text-[0.78rem] leading-[1.4] text-muted">{desc}</span>
              </span>
            </label>
          ))}
        </div>

        {mode === 'protected' && (
          <div className="mt-3">
            <PasswordInput
              value={passcode}
              onChange={setPasscode}
              placeholder="Set a passcode (min 4 chars)"
              autoComplete="new-password"
            />
          </div>
        )}

        {error && <p className="mb-0 mt-3 text-[0.8rem] text-[#f43f5e]">{error}</p>}

        <button
          type="button"
          onClick={create}
          disabled={busy}
          className="btn btn-primary mt-4 w-full justify-center disabled:opacity-60"
        >
          {busy ? <SpinnerIcon width="15" height="15" /> : <LinkIcon width="15" height="15" />}
          {busy ? 'Creating…' : 'Create & copy link'}
        </button>

        {/* Existing links */}
        {shares.length > 0 && (
          <div className="mt-5">
            <div className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.04em] text-muted">
              Active links
            </div>
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {shares.map((s) => {
                const meta = modeMeta(s.mode);
                const Icon = meta?.Icon ?? GlobeIcon;
                return (
                  <li
                    key={s.token}
                    className="flex items-center gap-2 rounded-lg border border-line px-3 py-2"
                  >
                    <Icon width="15" height="15" className="flex-none text-muted" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-[0.82rem] font-medium">{meta?.label ?? s.mode}</span>
                      <span className="truncate text-[0.7rem] text-muted">{shareUrl(s.token)}</span>
                    </span>
                    <button
                      type="button"
                      className="flex-none cursor-pointer rounded-md border border-transparent p-1.5 text-muted hover:border-line hover:text-accent"
                      title="Copy link"
                      onClick={() => copy(s.token)}
                    >
                      {copiedToken === s.token ? (
                        <CheckIcon width="15" height="15" />
                      ) : (
                        <LinkIcon width="15" height="15" />
                      )}
                    </button>
                    <button
                      type="button"
                      className="flex-none cursor-pointer rounded-md border border-transparent p-1.5 text-muted hover:border-line hover:text-[#f43f5e]"
                      title="Revoke link"
                      onClick={() => revoke(s.token)}
                    >
                      <TrashIcon width="15" height="15" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <button className="btn mt-[18px] w-full justify-center" onClick={onClose}>
          Close
        </button>
      </div>
    </dialog>
  );
}
