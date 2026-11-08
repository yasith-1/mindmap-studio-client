export default function Preloader({ show, label = 'Processing file — building your map…' }) {
  if (!show) return null;
  return (
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-[color-mix(in_srgb,var(--bg)_72%,transparent)] backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-[14px] rounded-xl border border-line bg-surface px-[22px] py-[18px] text-[0.9rem] font-medium text-fg shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
        <div className="size-[22px] flex-none animate-[spin_0.7s_linear_infinite] rounded-full border-[2.5px] border-line border-t-accent" />
        <span>{label}</span>
      </div>
    </div>
  );
}
