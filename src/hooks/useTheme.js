import { useEffect, useState } from 'react';
import { readStored, writeStored } from '../lib/storage.js';
import { applyAccent, applyMode, currentAccent, prefersDark, toHex } from '../lib/theme.js';

const ACCENT_KEY = 'mms-accent';
const THEME_KEY = 'mms-theme';

/**
 * Owns the app's accent colour and light/dark mode: state, persistence and the
 * system-preference default. It knows nothing about diagrams — callers pass an
 * `onCommit` callback that runs after a committed change (e.g. to re-render).
 */
export function useTheme(onCommit) {
  const [accent, setAccent] = useState('');
  const [mode, setMode] = useState('dark');

  useEffect(() => {
    const savedMode = readStored(THEME_KEY) || (prefersDark() ? 'dark' : 'light');
    setMode(savedMode);
    applyMode(savedMode);

    const savedAccent = readStored(ACCENT_KEY);
    if (savedAccent) {
      applyAccent(savedAccent);
      setAccent(toHex(savedAccent));
    } else {
      setAccent(currentAccent());
    }
  }, []);

  // `commit` is false for live preview (dragging the picker), true on release.
  const changeAccent = (value, commit) => {
    const hex = toHex(value);
    if (!hex) return;
    setAccent(hex);
    applyAccent(hex);
    if (commit) {
      writeStored(ACCENT_KEY, hex);
      onCommit?.();
    }
  };

  const toggleMode = () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    applyMode(next);
    writeStored(THEME_KEY, next);
    onCommit?.();
  };

  return { accent, mode, changeAccent, toggleMode };
}
