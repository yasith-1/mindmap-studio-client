import { useEffect, useRef, useState } from 'react';
import { SpinnerIcon, TrashIcon, MapsIcon, DownloadIcon } from './Icons.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';

/** Formats an ISO date as a short, friendly "updated" label. */
function when(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' · ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/**
 * Lists the signed-in user's cloud mind maps. Clicking one loads it into the
 * editor; the trash button deletes it. Refreshes the list each time it opens.
 */
export default function MapsDialog({ open, onClose, maps, loading, currentId, onRefresh, onOpenMap, onDownload, onDelete }) {
  const ref = useRef(null);
  // The map awaiting delete confirmation (null = no confirm open).
  const [pendingDelete, setPendingDelete] = useState(null);
  // Id of the map currently being rendered to PNG (shows a spinner).
  const [downloadingId, setDownloadingId] = useState(null);

  const handleDownload = async (map) => {
    if (downloadingId) return;
    setDownloadingId(map.id);
    try {
      await onDownload(map);
    } finally {
      setDownloadingId(null);
    }
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    if (open) onRefresh();
  }, [open, onRefresh]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="max-h-[calc(100dvh-32px)] max-w-[min(480px,92vw)] overflow-auto rounded-[14px] border border-line bg-surface p-0 text-fg shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop:bg-black/40"
    >
      <div className="px-6 py-[22px]">
        <h2 className="mb-1 mt-0 flex items-center gap-2 text-[1.15rem] tracking-[-0.01em]">
          <MapsIcon width="18" height="18" /> My mind maps
        </h2>
        <p className="mb-4 mt-0 text-[0.86rem] text-muted">
          Your maps, saved to the cloud. Open one to keep editing.
        </p>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-muted">
            <SpinnerIcon width="18" height="18" /> Loading…
          </div>
        ) : maps.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line py-10 text-center text-[0.86rem] text-muted">
            No saved maps yet.
            <br />
            Use <strong className="text-accent">Save</strong> to store the current one.
          </div>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {maps.map((m) => (
              <li
                key={m.id}
                className={`group flex items-center gap-2 rounded-lg border px-3 py-2.5 transition-colors ${
                  m.id === currentId ? 'border-accent bg-accent-weak' : 'border-line hover:border-accent'
                }`}
              >
                <button
                  type="button"
                  className="flex min-w-0 flex-1 cursor-pointer flex-col items-start border-0 bg-transparent p-0 text-left"
                  onClick={() => onOpenMap(m)}
                >
                  <span className="w-full truncate text-[0.9rem] font-medium text-fg">
                    {m.title || 'Untitled'}
                  </span>
                  <span className="text-[0.72rem] text-muted">{when(m.updatedAt)}</span>
                </button>
                <button
                  type="button"
                  className="flex-none cursor-pointer rounded-md border border-transparent p-1.5 text-muted hover:border-line hover:text-accent disabled:opacity-60"
                  title="Download as PNG"
                  aria-label={`Download ${m.title || 'Untitled'} as PNG`}
                  disabled={downloadingId === m.id}
                  onClick={() => handleDownload(m)}
                >
                  {downloadingId === m.id ? (
                    <SpinnerIcon width="15" height="15" />
                  ) : (
                    <DownloadIcon width="15" height="15" />
                  )}
                </button>
                <button
                  type="button"
                  className="flex-none cursor-pointer rounded-md border border-transparent p-1.5 text-muted hover:border-line hover:text-[#f43f5e]"
                  title="Delete"
                  aria-label={`Delete ${m.title || 'Untitled'}`}
                  onClick={() => setPendingDelete(m)}
                >
                  <TrashIcon width="15" height="15" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <button className="btn mt-[18px] w-full justify-center" onClick={onClose}>
          Close
        </button>
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this mind map?"
        message={
          pendingDelete
            ? `“${pendingDelete.title || 'Untitled'}” will be permanently removed from the cloud. This can't be undone.`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={() => {
          onDelete(pendingDelete.id);
          setPendingDelete(null);
        }}
        onClose={() => setPendingDelete(null)}
      />
    </dialog>
  );
}
