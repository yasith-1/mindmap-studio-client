import { useEffect, useRef } from 'react';

/**
 * Generic confirm/cancel modal built on the native <dialog>. Used for
 * destructive actions (like deleting a saved map) so nothing irreversible
 * happens on a single click. `danger` paints the confirm button red.
 */
export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  danger = true,
  onConfirm,
  onClose,
}) {
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
      className="max-w-[min(400px,92vw)] rounded-[14px] border border-line bg-surface p-0 text-fg shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop:bg-black/50"
    >
      <div className="px-6 py-[22px]">
        <h2 className="mb-1.5 mt-0 text-[1.1rem] tracking-[-0.01em]">{title}</h2>
        {message && <p className="mb-5 mt-0 text-[0.88rem] leading-[1.5] text-muted">{message}</p>}
        <div className="flex gap-2.5">
          <button type="button" className="btn flex-1 justify-center" onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            type="button"
            autoFocus
            onClick={onConfirm}
            className={`btn flex-1 justify-center font-semibold ${
              danger
                ? 'border-[#f43f5e] bg-[#f43f5e] text-white hover:border-[#f43f5e]'
                : 'btn-primary'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
