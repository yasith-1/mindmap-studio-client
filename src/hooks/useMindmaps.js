import { useCallback, useState } from 'react';
import { api } from '../lib/api.js';

/**
 * Cloud mind-map operations for a signed-in user. Keeps a local cache of the
 * list so the "My maps" dialog can render immediately, and tracks which map
 * (if any) is the "current" cloud document so Save updates instead of
 * duplicating. Guest users never call these — the UI gates on auth first.
 */
export function useMindmaps({ flash }) {
  const [maps, setMaps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listMaps();
      setMaps(res.mindmaps);
      return res.mindmaps;
    } catch (err) {
      flash(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [flash]);

  // Save the current editor content: update the open cloud map, or create one.
  const save = useCallback(
    async ({ title, markdown, kind }) => {
      try {
        if (currentId) {
          const { mindmap } = await api.updateMap(currentId, { title, markdown, kind });
          setMaps((prev) => prev.map((m) => (m.id === mindmap.id ? mindmap : m)));
          flash('Changes saved to cloud');
          return mindmap;
        }
        const { mindmap } = await api.createMap({ title, markdown, kind });
        setCurrentId(mindmap.id);
        setMaps((prev) => [mindmap, ...prev]);
        flash('Saved as a new map');
        return mindmap;
      } catch (err) {
        flash(err.message);
        return null;
      }
    },
    [currentId, flash],
  );

  const remove = useCallback(
    async (id) => {
      try {
        await api.deleteMap(id);
        setMaps((prev) => prev.filter((m) => m.id !== id));
        if (id === currentId) setCurrentId(null);
        flash('Deleted');
      } catch (err) {
        flash(err.message);
      }
    },
    [currentId, flash],
  );

  // Mark a map as the open document (after loading it into the editor).
  const open = useCallback((id) => setCurrentId(id), []);

  // Forget which cloud map is "open" so the next Save creates a NEW entry
  // instead of overwriting the last one. Called when the editor switches to
  // fresh content (clear / example / import).
  const startNew = useCallback(() => setCurrentId(null), []);

  // Forget cloud state (on logout) — content stays in the editor as a draft.
  const reset = useCallback(() => {
    setMaps([]);
    setCurrentId(null);
  }, []);

  return { maps, loading, currentId, refresh, save, remove, open, startNew, reset };
}
