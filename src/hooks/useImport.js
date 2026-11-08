import { useState } from 'react';
import { fileToMarkdown } from '../lib/importFile.js';

const MIN_PRELOADER_MS = 400;

/**
 * Orchestrates importing a file: drives the preloader flag, converts the file
 * to Markdown, and reports the outcome. The conversion/structuring itself lives
 * in `importFile`; this hook only owns the UI-facing flow.
 */
export function useImport({ onImported, flash }) {
  const [importing, setImporting] = useState(false);

  const importFile = async (file) => {
    if (!file) return;
    setImporting(true);
    const started = Date.now();
    try {
      const { markdown, from, arranged } = await fileToMarkdown(file);
      onImported(markdown);
      if (arranged) flash(`Structured ${from ? `${from} ` : ''}content into a map`);
      else if (from) flash(`Converted ${from} → Markdown`);
      else flash(`Loaded ${file.name}`);
    } catch (err) {
      flash(err?.message || 'Could not import that file');
    } finally {
      // Keep the preloader up long enough to be seen on fast imports.
      const elapsed = Date.now() - started;
      if (elapsed < MIN_PRELOADER_MS) {
        await new Promise((r) => setTimeout(r, MIN_PRELOADER_MS - elapsed));
      }
      setImporting(false);
    }
  };

  return { importing, importFile };
}
