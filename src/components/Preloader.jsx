export default function Preloader({ show, label = 'Processing file — building your map…' }) {
  if (!show) return null;
  return (
    <div className="preloader" role="status" aria-live="polite">
      <div className="preloader-card">
        <div className="spinner" />
        <span>{label}</span>
      </div>
    </div>
  );
}
