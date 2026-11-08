export default function Editor({ value, onChange, charCount, onClear }) {
  return (
    <section
      id="pane-edit"
      className="pane flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-surface"
    >
      <div className="flex items-center gap-2 border-b border-line px-3 py-[9px] text-[0.72rem] font-semibold uppercase tracking-[0.04em] text-muted">
        Markdown{' '}
        <span className="ml-auto font-mono normal-case tracking-normal">{charCount} chars</span>
        <button
          className="cursor-pointer rounded-md border border-accent bg-accent-weak px-2.5 py-[3px] text-[0.68rem] font-semibold uppercase tracking-[0.04em] text-accent transition-[transform,box-shadow] hover:shadow-[0_0_0_3px_var(--accent-weak)] active:translate-y-px"
          onClick={onClear}
          title="Clear and reset to the example"
        >
          Clear
        </button>
      </div>
      <textarea
        id="editor"
        className="min-h-0 w-full flex-1 resize-none border-0 bg-panel p-[14px] font-mono text-[13px] leading-[1.65] text-fg outline-none [tab-size:2]"
        spellCheck="false"
        autoComplete="off"
        placeholder="# Paste a README or type Markdown…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </section>
  );
}
