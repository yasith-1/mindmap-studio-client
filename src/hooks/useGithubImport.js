import { useState } from 'react';
import { api } from '../lib/api.js';

const MIN_PRELOADER_MS = 400;

/**
 * Orchestrates importing a GitHub profile README: drives the preloader flag,
 * calls the backend (which proxies GitHub so we stay within the client CSP),
 * and reports the outcome. The network detail lives in `api`; this hook only
 * owns the UI-facing flow — mirroring useImport so both share one shape.
 */
export function useGithubImport({ onImported, flash }) {
  const [importing, setImporting] = useState(false);

  const importFromGithub = async (url) => {
    if (!url || !url.trim()) return false;
    setImporting(true);
    const started = Date.now();
    try {
      const { markdown, username } = await api.importGithubReadme(url.trim());
      onImported(markdown);
      flash(`Imported @${username}'s profile README`);
      return true;
    } catch (err) {
      flash(err?.message || 'Could not import that profile');
      return false;
    } finally {
      // Keep the preloader up long enough to register on fast imports.
      const elapsed = Date.now() - started;
      if (elapsed < MIN_PRELOADER_MS) {
        await new Promise((r) => setTimeout(r, MIN_PRELOADER_MS - elapsed));
      }
      setImporting(false);
    }
  };

  return { importing, importFromGithub };
}
